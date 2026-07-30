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

  // First pass: compute RMS energy per channel for each segment
  const energies = segments.map((seg) => {
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

    return {
      seg,
      leftRMS: count > 0 ? Math.sqrt(leftSum / count) : 0,
      rightRMS: count > 0 ? Math.sqrt(rightSum / count) : 0,
    };
  });

  // Auto-calibrate threshold: 10% of the loudest moment across the whole call
  const maxRMS = Math.max(
    ...energies.map((e) => e.leftRMS),
    ...energies.map((e) => e.rightRMS),
    0.001
  );
  const threshold = maxRMS * 0.1;

  // Second pass: assign channels definitively — audio is on one channel or the other
  let lastChannel = null;
  const attributed = energies.map(({ seg, leftRMS, rightRMS }) => {
    const leftActive = leftRMS > threshold;
    const rightActive = rightRMS > threshold;

    let channel;
    if (leftActive && !rightActive) {
      channel = "left";
    } else if (rightActive && !leftActive) {
      channel = "right";
    } else if (leftActive && rightActive) {
      channel = leftRMS >= rightRMS ? "left" : "right";
    } else {
      // Silence/pause — keep the previous speaker for continuity
      channel = lastChannel || "left";
    }

    lastChannel = channel;
    return { ...seg, channel };
  });

  // Assign S1 to whichever channel speaks first; S2 to the other.
  const firstChannel = attributed[0]?.channel || "left";
  return attributed.map((seg) => ({
    ...seg,
    speaker: seg.channel === firstChannel ? "S1" : "S2",
  }));
}