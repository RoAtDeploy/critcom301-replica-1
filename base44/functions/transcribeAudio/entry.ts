import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import decode from 'npm:audio-decode@3.10.1';

// Encode a Float32Array of mono PCM samples into a WAV Uint8Array
function encodePcmToWav(samples, sampleRate) {
  const numSamples = samples.length;
  const bytesPerSample = 2; // 16-bit PCM
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

// Mix two Float32Array channels into a single mono channel
function mixToMono(ch0, ch1) {
  const mono = new Float32Array(ch0.length);
  for (let i = 0; i < ch0.length; i++) {
    mono[i] = (ch0[i] + ch1[i]) / 2;
  }
  return mono;
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

// Calculate overlap in seconds between two time ranges
function overlap(aStart, aEnd, bStart, bEnd) {
  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
}

// For each segment in the full transcript, find which channel (LC or RC)
// has the best overlap and assign that channel label.
function assignChannels(fullSegments, lcSegments, rcSegments) {
  return fullSegments.map(seg => {
    let maxLcOverlap = 0;
    let maxRcOverlap = 0;

    for (const lc of lcSegments) {
      maxLcOverlap = Math.max(maxLcOverlap, overlap(seg.start, seg.end, lc.start, lc.end));
    }
    for (const rc of rcSegments) {
      maxRcOverlap = Math.max(maxRcOverlap, overlap(seg.start, seg.end, rc.start, rc.end));
    }

    const channel = maxRcOverlap > maxLcOverlap ? 'RC' : 'LC';

    return {
      timestamp: formatTime(seg.start),
      start: seg.start,
      end: seg.end,
      channel,
      text: seg.text.trim(),
    };
  });
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

    // Fetch and decode the stereo audio file
    const fetchRes = await fetch(fileUrl);
    const audioBuffer = await fetchRes.arrayBuffer();
    const decoded = await decode(audioBuffer);

    const { channelData, sampleRate, duration } = decoded;

    // If mono, fall back to single-channel transcription
    if (channelData.length < 2) {
      const wavBytes = encodePcmToWav(channelData[0], sampleRate);
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

    // Build WAVs for: full mix, left channel, right channel
    const monoWav = encodePcmToWav(mixToMono(channelData[0], channelData[1]), sampleRate);
    const lcWav = encodePcmToWav(channelData[0], sampleRate);
    const rcWav = encodePcmToWav(channelData[1], sampleRate);

    // Transcribe all three in parallel
    const [fullResult, lcResult, rcResult] = await Promise.all([
      whisperTranscribe(monoWav, 'full-mix.wav', apiKey),
      whisperTranscribe(lcWav, 'left-channel.wav', apiKey),
      whisperTranscribe(rcWav, 'right-channel.wav', apiKey),
    ]);

    const lcSegs = (lcResult.segments || []).map(s => ({ start: s.start, end: s.end }));
    const rcSegs = (rcResult.segments || []).map(s => ({ start: s.start, end: s.end }));

    // Use the clean full-mix transcript as the base; label each segment via channel overlap
    const segments = assignChannels(fullResult.segments || [], lcSegs, rcSegs);

    return Response.json({
      text: fullResult.text,
      language: fullResult.language,
      duration: duration || fullResult.duration,
      segments,
      isStereo: true,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}