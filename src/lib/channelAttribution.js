/**
 * Attribute speaker labels (S1/S2) to transcript segments by analysing
 * which stereo audio channel (left/right) carries the most energy during
 * each segment's time window.
 *
 * @param {string} audioUrl   — URL of the uploaded stereo audio file
 * @param {Array}  segments   — transcript segments with { start, end, text, ... }
 * @returns {Promise<Array>}  — segments with `speaker` set to "S1" or "S2"
 */
export async function attributeSpeakersByChannel(audioUrl, segments) {
  const response = await fetch(audioUrl);
  const arrayBuffer = await response.arrayBuffer();

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Web Audio API not supported in this browser");
  }

  const audioContext = new AudioContextClass();
  let audioBuffer;
  try {
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  } catch (e) {
    audioContext.close();
    throw new Error("Could not decode audio file for channel analysis");
  }
  audioContext.close();

  if (audioBuffer.numberOfChannels < 2) {
    throw new Error("Audio is mono — stereo channels required for speaker detection");
  }

  const leftChannel = audioBuffer.getChannelData(0);
  const rightChannel = audioBuffer.getChannelData(1);
  const sampleRate = audioBuffer.sampleRate;

  const attributed = segments.map((seg) => {
    const startSec = seg.start ?? 0;
    const endSec = seg.end ?? startSec + 1;

    const startSample = Math.floor(startSec * sampleRate);
    const endSample = Math.floor(endSec * sampleRate);

    const frameStart = Math.max(0, Math.min(startSample, leftChannel.length));
    const frameEnd = Math.max(frameStart + 1, Math.min(endSample, leftChannel.length));

    let leftSum = 0;
    let rightSum = 0;
    let count = 0;
    const stride = Math.max(1, Math.floor((frameEnd - frameStart) / 500));

    for (let i = frameStart; i < frameEnd; i += stride) {
      leftSum += leftChannel[i] * leftChannel[i];
      rightSum += rightChannel[i] * rightChannel[i];
      count++;
    }

    const leftRMS = count > 0 ? Math.sqrt(leftSum / count) : 0;
    const rightRMS = count > 0 ? Math.sqrt(rightSum / count) : 0;

    return { ...seg, channel: leftRMS >= rightRMS ? "left" : "right" };
  });

  // Assign S1 to whichever channel speaks first; S2 to the other.
  const firstChannel = attributed[0]?.channel || "left";
  return attributed.map((seg) => ({
    ...seg,
    speaker: seg.channel === firstChannel ? "S1" : "S2",
  }));
}