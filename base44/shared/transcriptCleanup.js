// Whisper hallucinates short filler words over silence, background noise or long
// gaps in a recording, producing runs like "Yeah." repeated dozens of times.
// Real dialogue does not repeat the same one-to-four-word utterance back to back
// more than a couple of times, so collapse those runs to a single segment.
//
// This runs on raw Whisper segments, before any merging, so the hallucinated
// repeats never reach the stored transcript or the AI assessment.

const FILLER_MAX_WORDS = 4;

const normalise = (text) =>
  (text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

export function removeHallucinatedRepetitions(segments) {
  if (!Array.isArray(segments) || segments.length === 0) return [];

  const cleaned = [];
  let run = [];

  const flush = () => {
    if (run.length === 0) return;
    // Keep the first utterance in the run (it is usually genuine speech that
    // precedes the gap) and discard the looped repeats.
    cleaned.push(run[0]);
    run = [];
  };

  for (const segment of segments) {
    const key = normalise(segment && segment.text);
    const words = key ? key.split(' ').length : 0;
    const previousKey = run.length > 0 ? normalise(run[0].text) : null;

    if (previousKey !== null && key === previousKey && words > 0 && words <= FILLER_MAX_WORDS) {
      run.push(segment);
    } else {
      flush();
      run = [segment];
    }
  }

  flush();

  return cleaned;
}