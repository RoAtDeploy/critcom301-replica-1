import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import decode from 'npm:audio-decode@3.10.1';

// Downsample a Float32Array from sourceSampleRate to targetSampleRate
function downsample(samples, sourceSampleRate, targetSampleRate) {
  if (sourceSampleRate === targetSampleRate) return samples;
  const ratio = sourceSampleRate / targetSampleRate;
  const newLength = Math.floor(samples.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.floor((i + 1) * ratio);
    let sum = 0;
    for (let j = start; j < end; j++) sum += samples[j];
    result[i] = sum / (end - start);
  }
  return result;
}

// Encode a Float32Array of mono PCM samples into a WAV Uint8Array
function encodePcmToWav(samples, sampleRate) {
  const numSamples = samples.length;
  const bytesPerSample = 2;
  const dataSize = numSamples * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Uint8Array(buffer);
}

async function whisperTranscribe(wavBytes, fileName, apiKey) {
  const blob = new Blob([wavBytes], { type: 'audio/wav' });
  const form = new FormData();
  form.append('file', blob, fileName);
  form.append('model', 'whisper-1');
  form.append('response_format', 'verbose_json');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Whisper error (${fileName}): ${err}`);
  }
  return res.json();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const fileUrl = body.file_url;
    if (!fileUrl) return Response.json({ error: 'No file_url provided' }, { status: 400 });

    const apiKey = Deno.env.get('OPENAI_API_KEY');

    // Fetch and decode the audio file
    const fetchRes = await fetch(fileUrl);
    const audioBuffer = await fetchRes.arrayBuffer();
    const decoded = await decode(audioBuffer);

    const { channelData, sampleRate, duration } = decoded;

    // Whisper limit is 25MB. Downsample to 16kHz to keep WAV files small.
    const TARGET_SAMPLE_RATE = 16000;

    // If mono, fall back to single-channel transcription
    if (channelData.length < 2) {
      const mono = downsample(channelData[0], sampleRate, TARGET_SAMPLE_RATE);
      const wavBytes = encodePcmToWav(mono, TARGET_SAMPLE_RATE);
      const result = await whisperTranscribe(wavBytes, 'mono.wav', apiKey);
      const segments = (result.segments || []).map(seg => ({
        timestamp: formatTime(seg.start),
        start: seg.start,
        end: seg.end,
        channel: 'LC',
        text: seg.text.trim(),
      }));
      return Response.json({
        text: result.text,
        language: result.language,
        duration: duration || result.duration,
        segments,
        isStereo: false,
      });
    }

    // Downsample both channels and encode as WAV
    const lcSamples = downsample(channelData[0], sampleRate, TARGET_SAMPLE_RATE);
    const rcSamples = downsample(channelData[1], sampleRate, TARGET_SAMPLE_RATE);
    const lcWav = encodePcmToWav(lcSamples, TARGET_SAMPLE_RATE);
    const rcWav = encodePcmToWav(rcSamples, TARGET_SAMPLE_RATE);

    // Transcribe both channels in parallel
    const [lcResult, rcResult] = await Promise.all([
      whisperTranscribe(lcWav, 'left-channel.wav', apiKey),
      whisperTranscribe(rcWav, 'right-channel.wav', apiKey),
    ]);

    // Tag each segment with its channel
    const lcSegments = (lcResult.segments || []).map(seg => ({
      timestamp: formatTime(seg.start),
      start: seg.start,
      end: seg.end,
      channel: 'LC',
      text: seg.text.trim(),
    }));

    const rcSegments = (rcResult.segments || []).map(seg => ({
      timestamp: formatTime(seg.start),
      start: seg.start,
      end: seg.end,
      channel: 'RC',
      text: seg.text.trim(),
    }));

    // Merge and sort chronologically
    const merged = [...lcSegments, ...rcSegments].sort((a, b) => a.start - b.start);

    return Response.json({
      text: lcResult.text + ' ' + rcResult.text,
      language: lcResult.language || rcResult.language,
      duration: duration || Math.max(lcResult.duration || 0, rcResult.duration || 0),
      segments: merged,
      isStereo: true,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});