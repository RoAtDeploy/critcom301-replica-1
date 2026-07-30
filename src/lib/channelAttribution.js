import { base44 } from "@/api/base44Client";

/**
 * Attribute speaker labels (S1/S2) to transcript segments by transcribing
 * one stereo channel in isolation and matching its text against the master
 * transcript. Segments whose text appears in the isolated channel transcript
 * are labelled S1 (left channel); all others are S2 (right channel).
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

  // 2. Extract left channel, downsample to 16 kHz mono for Whisper
  const leftData = audioBuffer.getChannelData(0);
  const targetRate = 16000;
  const ratio = audioBuffer.sampleRate / targetRate;
  const newLength = Math.floor(leftData.length / ratio);
  const monoBuffer = audioContext.createBuffer(1, newLength, targetRate);
  const monoData = monoBuffer.getChannelData(0);
  for (let i = 0; i < newLength; i++) {
    monoData[i] = leftData[Math.floor(i * ratio)];
  }
  audioContext.close();

  // 3. Encode as WAV and upload
  const wavBlob = audioBufferToWav(monoBuffer);
  const file = new File([wavBlob], "left-channel.wav", { type: "audio/wav" });
  const { file_url } = await base44.integrations.Core.UploadFile({ file });

  // 4. Transcribe the isolated left channel
  const res = await base44.functions.invoke("transcribeAudio", { file_url });
  const channelData = res.data || res;
  const channelFullText = normalizeText(
    (channelData.text || "") + " " +
    (channelData.segments || []).map((s) => s.text || "").join(" ")
  );

  if (!channelFullText) {
    throw new Error("Channel transcription returned no text");
  }

  // 5. Match each master segment's text against the channel transcript
  return segments.map((seg) => {
    const isInChannel = isTextInChannel(seg.text, channelFullText);
    return { ...seg, speaker: isInChannel ? "S1" : "S2" };
  });
}

// --- Text matching helpers ---

function normalizeText(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Determine whether a segment's text belongs to the isolated channel.
 * - Direct substring match first (handles most cases).
 * - Fallback: word-overlap for longer segments where Whisper may vary slightly.
 */
function isTextInChannel(segmentText, channelFullText) {
  const normSeg = normalizeText(segmentText);
  if (!normSeg) return false;

  if (channelFullText.includes(normSeg)) return true;

  const segWords = normSeg.split(" ");
  if (segWords.length < 4) return false; // short segments: substring match is definitive

  const channelWords = channelFullText.split(" ");
  let matchCount = 0;
  let chIdx = 0;
  for (const word of segWords) {
    while (chIdx < channelWords.length) {
      if (channelWords[chIdx] === word) {
        matchCount++;
        chIdx++;
        break;
      }
      chIdx++;
    }
  }
  return matchCount / segWords.length > 0.6;
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