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
  view.setUint32(16, 16, true);        // PCM chunk size
  view.setUint16(20, 1, true);          // PCM format
  view.setUint16(22, 1, true);          // 1 channel (mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true); // byte rate
  view.setUint16(32, bytesPerSample, true);              // block align
  view.setUint16(34, 16, true);                          // bits per sample
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

    // Encode left (LC) and right (RC) channels as separate WAV files
    const lcWav = encodePcmToWav(channelData[0], sampleRate);
    const rcWav = encodePcmToWav(channelData[1], sampleRate);

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

    // Merge and sort by start time to reconstruct the conversation chronologically
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

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}