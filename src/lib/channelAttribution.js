import { base44 } from "@/api/base44Client";

/**
 * Attribute speaker labels (S1/S2) to transcript segments by transcribing
 * BOTH stereo channels in isolation and comparing text overlap.
 *
 * Each master segment is assigned to whichever channel transcript has
 * higher word overlap — S1 for the left channel, S2 for the right.
 *
 * Uses transcribeChannelAudio (raw Whisper) to avoid LLM resegmentation
 * modifying the text between passes.
 *
 * @param {string} audioUrl   — URL of the uploaded stereo audio file
 * @param {Array}  segments   — master transcript segments { start, end, text, ... }
 * @returns {Promise<Array>}  — segments with `speaker` set to "S1" or "S2"
 */
export async function attributeSpeakersByChannel(audioUrl, segments) {
  // 1. Fetch and decode the stereo audio
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
    throw new Error("Could not decode audio file for channel extraction");
  }

  if (audioBuffer.numberOfChannels < 2) {
    audioContext.close();
    throw new Error("Audio is mono — stereo channels required for speaker detection");
  }

  // 2. Extract both channels as 16 kHz mono WAV (needs audioContext alive)
  const leftWav = extractChannelAsWav(audioBuffer, audioContext, 0);
  const rightWav = extractChannelAsWav(audioBuffer, audioContext, 1);
  audioContext.close();

  // 3. Upload and transcribe both channels in parallel
  const [leftUrl, rightUrl] = await Promise.all([
    uploadWav(leftWav, "left-channel.wav"),
    uploadWav(rightWav, "right-channel.wav"),
  ]);

  const [leftRes, rightRes] = await Promise.all([
    base44.functions.invoke("transcribeChannelAudio", { file_url: leftUrl }),
    base44.functions.invoke("transcribeChannelAudio", { file_url: rightUrl }),
  ]);

  const leftText = normalizeText(
    ((leftRes.data || leftRes).text || "") + " " +
    ((leftRes.data || leftRes).segments || []).map((s) => s.text || "").join(" ")
  );
  const rightText = normalizeText(
    ((rightRes.data || rightRes).text || "") + " " +
    ((rightRes.data || rightRes).segments || []).map((s) => s.text || "").join(" ")
  );

  console.log("[ChannelAttribution] Left text length:", leftText.length, "first 300:", leftText.substring(0, 300));
  console.log("[ChannelAttribution] Right text length:", rightText.length, "first 300:", rightText.substring(0, 300));
  console.log("[ChannelAttribution] Master segments:", segments.length);

  if (!leftText && !rightText) {
    throw new Error("Both channel transcriptions returned no text");
  }

  // 4. Assign each segment to whichever channel has higher text overlap
  const result = segments.map((seg) => {
    const normSeg = normalizeText(seg.text);
    const leftScore = wordOverlap(normSeg, leftText);
    const rightScore = wordOverlap(normSeg, rightText);
    const speaker = leftScore >= rightScore ? "S1" : "S2";
    console.log(`[ChannelAttribution] L:${leftScore.toFixed(2)} R:${rightScore.toFixed(2)} → ${speaker} | "${normSeg.substring(0, 80)}"`);
    return { ...seg, speaker };
  });

  const s1Count = result.filter((s) => s.speaker === "S1").length;
  console.log(`[ChannelAttribution] Result: ${s1Count} S1, ${result.length - s1Count} S2`);

  return result;
}

// --- Channel extraction ---

function extractChannelAsWav(audioBuffer, audioContext, channelIndex) {
  const channelData = audioBuffer.getChannelData(channelIndex);
  const targetRate = 16000;
  const ratio = audioBuffer.sampleRate / targetRate;
  const newLength = Math.floor(channelData.length / ratio);
  const monoBuffer = audioContext.createBuffer(1, newLength, targetRate);
  const monoData = monoBuffer.getChannelData(0);
  for (let i = 0; i < newLength; i++) {
    monoData[i] = channelData[Math.floor(i * ratio)];
  }
  return audioBufferToWav(monoBuffer);
}

async function uploadWav(wavBlob, filename) {
  const file = new File([wavBlob], filename, { type: "audio/wav" });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return file_url;
}

// --- Text matching ---

function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Score how well a segment's text matches a channel transcript.
 * - 1.0 if the segment text is a direct substring (definitive match).
 * - Otherwise, ratio of segment words found in the channel text (0–1).
 */
function wordOverlap(segmentText, channelFullText) {
  if (!segmentText || !channelFullText) return 0;

  if (channelFullText.includes(segmentText)) return 1.0;

  const segWords = segmentText.split(" ");
  if (segWords.length === 0) return 0;

  const channelWordSet = new Set(channelFullText.split(" "));
  let matchCount = 0;
  for (const word of segWords) {
    if (channelWordSet.has(word)) matchCount++;
  }
  return matchCount / segWords.length;
}

// --- WAV encoder (16-bit PCM) ---

function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * numChannels * 2 + 44;
  const arrayBuffer = new ArrayBuffer(length);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, length - 8, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * 2, true);
  view.setUint16(32, numChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, length - 44, true);

  let offset = 44;
  const channels = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}