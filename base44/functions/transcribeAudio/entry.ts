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

    const merged = mergeFragmentedSegments(rawSegments);
    const segments = await resegmentSpeakers(base44, merged);

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

// Whisper segments can contain multiple speakers in one chunk (e.g. a question
// immediately followed by the answer). This uses an LLM to split those into
// individual speaker turns (S1 / S2) while preserving the exact text.
// Timestamps are interpolated within each original segment's time range.
async function resegmentSpeakers(base44, segments) {
  if (!segments || segments.length === 0) return [];

  // For a single short segment, skip the LLM call
  if (segments.length === 1 && (segments[0].text || '').length < 40) {
    return segments.map(s => ({ ...s, speaker: s.speaker || 'S1' }));
  }

  const lines = segments.map((s, i) => `[SEGMENT ${i}] ${s.text}`).join('\n');

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are given a transcript of a two-person railway safety-critical phone call. The text has been split into segments by an automatic speech recognition system, but some segments contain speech from BOTH speakers (e.g. a question from one person immediately followed by the answer from the other).

Your job: re-segment the transcript so that each output turn contains speech from only ONE speaker, and label each as "S1" or "S2".

Rules:
- Split any segment that contains two speakers into separate turns.
- Label each turn S1 or S2 based on the dialogue flow (questions tend to be one speaker, answers the other; alternate when unsure).
- If a segment already contains a single speaker, output it as one turn with a label.
- Preserve the exact text — do NOT alter, correct, paraphrase, or add/remove any words.
- For each turn, indicate which original SEGMENT number it came from (0-based).

TRANSCRIPT:
${lines}`,
    response_json_schema: {
      type: 'object',
      properties: {
        turns: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source_segment: { type: 'number' },
              text: { type: 'string' },
              speaker: { type: 'string' }
            },
            required: ['text', 'speaker']
          }
        }
      }
    }
  });

  const turns = result?.turns || result?.response?.turns || [];

  // If LLM didn't return usable turns, fall back to original segments
  if (turns.length === 0) {
    return segments.map(s => ({ ...s, speaker: s.speaker || 'S1' }));
  }

  // Group turns by their source segment for timestamp interpolation
  const turnsBySeg = {};
  for (const turn of turns) {
    const segIdx = Math.max(0, Math.min(turn.source_segment ?? 0, segments.length - 1));
    if (!turnsBySeg[segIdx]) turnsBySeg[segIdx] = [];
    turnsBySeg[segIdx].push(turn);
  }

  const result2 = [];

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segTurns = turnsBySeg[i] || [{ text: seg.text, speaker: 'S1' }];

    const segDuration = seg.end - seg.start;
    const totalChars = segTurns.reduce((sum, t) => sum + (t.text?.length || 0), 0) || 1;
    let elapsed = 0;

    for (const turn of segTurns) {
      const charLen = turn.text?.length || 0;
      const fraction = charLen / totalChars;
      const turnDuration = fraction * segDuration;
      const turnStart = seg.start + elapsed;
      elapsed += turnDuration;

      result2.push({
        timestamp: formatTime(turnStart),
        start: turnStart,
        end: turnStart + turnDuration,
        speaker: turn.speaker === 'S2' ? 'S2' : 'S1',
        text: (turn.text || '').trim(),
      });
    }
  }

  return result2;
}