import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const fileUrl = body.file_url;
    if (!fileUrl) return Response.json({ error: 'No file_url provided' }, { status: 400 });

    const apiKey = Deno.env.get('OPENAI_API_KEY');

    // Fetch the audio file
    const fetchRes = await fetch(fileUrl);
    const audioBlob = await fetchRes.blob();

    // Send directly to Whisper
    const form = new FormData();
    form.append('file', audioBlob, 'audio.mp3');
    form.append('model', 'whisper-1');
    form.append('response_format', 'verbose_json');
    form.append('prompt', 'Railway safety-critical communications. Single digits spoken individually: zero, one, two, three, four, five, six, seven, eight, nine. Phonetic alphabet: Alpha, Bravo, Charlie, Delta, Echo, Foxtrot, Golf, Hotel, India, Juliet, Kilo, Lima, Mike, November, Oscar, Papa, Quebec, Romeo, Sierra, Tango, Uniform, Victor, Whiskey, X-ray, Yankee, Zulu. Signal numbers and headcodes given digit by digit. One two three four five six seven eight nine zero.');

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!whisperRes.ok) {
      const err = await whisperRes.text();
      throw new Error(`Whisper error: ${err}`);
    }

    const result = await whisperRes.json();

    const rawSegments = (result.segments || []).map(seg => ({
      timestamp: formatTime(seg.start),
      start: seg.start,
      end: seg.end,
      text: seg.text.trim(),
    }));

    const segments = mergeFragmentedSegments(rawSegments);

    return Response.json({
      text: result.text,
      language: result.language,
      duration: result.duration,
      segments,
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

// Whisper often splits mid-sentence on short pauses, producing fragments like
// "...I'll go through some details with" / "you." — merge these back together.
// If a segment does NOT end with terminal punctuation (. ? !) it is almost
// certainly a mid-sentence split and should be merged with the next segment
// regardless of the gap. Short fragments are also merged within a generous gap.
function mergeFragmentedSegments(segments) {
  if (!segments || segments.length === 0) return [];

  const TERMINAL = /[.?!]$/;
  const MAX_GAP_SEC = 4;         // generous gap for short-fragment merging
  const SHORT_FRAGMENT_WORDS = 8;

  const merged = [];

  for (const seg of segments) {
    const prev = merged[merged.length - 1];
    const gap = prev ? seg.start - prev.end : Infinity;

    const prevNeedsMerge = prev && (
      !TERMINAL.test(prev.text) ||
      prev.text.split(/\s+/).filter(Boolean).length < SHORT_FRAGMENT_WORDS
    );

    // Non-terminal segments always merge (they're mid-sentence splits).
    // Short fragments merge only within the gap threshold.
    const shouldMerge = prev && prevNeedsMerge && (
      !TERMINAL.test(prev.text) || gap <= MAX_GAP_SEC
    );

    if (shouldMerge) {
      prev.text = (prev.text + ' ' + seg.text).replace(/\s+/g, ' ').trim();
      prev.end = seg.end;
    } else {
      merged.push({ ...seg });
    }
  }

  return merged;
}