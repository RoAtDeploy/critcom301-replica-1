import { useState } from "react";
import { Scissors, Plus, Trash2 } from "lucide-react";

const SPEAKER_STYLES = {
  S1: { badge: "bg-blue-100 text-blue-700 border-blue-300", row: "border-blue-200" },
  S2: { badge: "bg-orange-100 text-orange-700 border-orange-300", row: "border-orange-200" },
};

export default function TranscriptEditor({ segments, onSegmentsChange, speakerLabels = {} }) {
  const [splitIdx, setSplitIdx] = useState(null);
  const [splitPos, setSplitPos] = useState(0);

  const toggleSpeaker = (idx) => {
    const updated = segments.map((seg, i) => {
      if (i < idx) return seg;
      return { ...seg, speaker: seg.speaker === "S1" ? "S2" : "S1" };
    });
    onSegmentsChange(updated);
  };

  const updateText = (idx, text) => {
    const updated = segments.map((seg, i) => i === idx ? { ...seg, text } : seg);
    onSegmentsChange(updated);
  };

  const insertSegmentAfter = (idx) => {
    const newSeg = {
      timestamp: segments[idx]?.timestamp || "00:00:00",
      speaker: segments[idx]?.speaker === "S1" ? "S2" : "S1",
      text: "",
    };
    const updated = [...segments.slice(0, idx + 1), newSeg, ...segments.slice(idx + 1)];
    onSegmentsChange(updated);
  };

  const deleteSegment = (idx) => {
    const updated = segments.filter((_, i) => i !== idx);
    onSegmentsChange(updated);
  };

  const startSplit = (idx) => {
    setSplitIdx(idx);
    setSplitPos(0);
  };

  const cancelSplit = () => {
    setSplitIdx(null);
    setSplitPos(0);
  };

  const confirmSplit = () => {
    if (splitIdx === null) return;
    const seg = segments[splitIdx];
    const text = seg.text || "";
    const before = text.slice(0, splitPos).trim();
    const after = text.slice(splitPos).trim();
    if (!after) {
      cancelSplit();
      return;
    }
    const newSeg = {
      timestamp: seg.timestamp,
      speaker: seg.speaker === "S1" ? "S2" : "S1",
      text: after,
    };
    const updated = segments.map((s, i) =>
      i === splitIdx ? { ...s, text: before } : s
    );
    const withNew = [...updated.slice(0, splitIdx + 1), newSeg, ...updated.slice(splitIdx + 1)];
    onSegmentsChange(withNew);
    cancelSplit();
  };

  return (
    <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
      {segments.map((seg, idx) => {
        const style = SPEAKER_STYLES[seg.speaker] || SPEAKER_STYLES.S1;
        const isSplitting = splitIdx === idx;
        return (
          <div
            key={idx}
            className={`flex gap-2 items-start p-2 rounded-lg border ${style.row} bg-white group`}
          >
            <span className="text-xs font-mono text-muted-foreground bg-muted rounded px-1.5 py-0.5 whitespace-nowrap mt-0.5 shrink-0">
              {seg.timestamp}
            </span>
            <button
              type="button"
              onClick={() => toggleSpeaker(idx)}
              title="Click to toggle speaker"
              className={`text-xs font-bold px-2 py-0.5 rounded border shrink-0 mt-0.5 transition-all hover:opacity-70 cursor-pointer ${style.badge}`}
            >
              {speakerLabels[seg.speaker] || seg.speaker}
            </button>
            {isSplitting ? (
              <div className="flex-1 flex flex-col gap-1.5">
                <textarea
                  value={seg.text}
                  onChange={(e) => {
                    updateText(idx, e.target.value);
                    setSplitPos(e.target.selectionStart);
                  }}
                  onSelect={(e) => setSplitPos(e.target.selectionStart)}
                  onClick={(e) => setSplitPos(e.target.selectionStart)}
                  onKeyUp={(e) => setSplitPos(e.target.selectionStart)}
                  autoFocus
                  rows={1}
                  className="text-sm text-foreground/80 leading-relaxed flex-1 bg-yellow-50 resize-none border border-yellow-300 outline-none focus:ring-1 focus:ring-yellow-400 rounded px-1 py-0 overflow-hidden"
                  style={{ height: "auto", minHeight: "1.5rem" }}
                  ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
                  onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                />
                <p className="text-xs text-muted-foreground">
                  Place your cursor where you want to split — text before it stays here, text after becomes a new segment with the opposite speaker.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={confirmSplit}
                    className="text-xs font-medium bg-primary text-primary-foreground rounded px-3 py-1 hover:bg-primary/90"
                  >
                    Split at cursor
                  </button>
                  <button
                    type="button"
                    onClick={cancelSplit}
                    className="text-xs font-medium bg-secondary text-secondary-foreground rounded px-3 py-1 hover:bg-secondary/80"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <textarea
                value={seg.text}
                onChange={(e) => updateText(idx, e.target.value)}
                rows={1}
                className="text-sm text-foreground/80 leading-relaxed flex-1 bg-transparent resize-none border-0 outline-none focus:bg-white focus:ring-1 focus:ring-primary/30 rounded px-1 py-0 overflow-hidden"
                style={{ height: "auto", minHeight: "1.5rem" }}
                ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
                onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
              />
            )}
            {!isSplitting && (
              <div className="flex flex-col gap-1 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => startSplit(idx)}
                  title="Split this segment at cursor"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Scissors className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertSegmentAfter(idx)}
                  title="Insert new segment after"
                  className="text-muted-foreground hover:text-primary"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteSegment(idx)}
                  title="Delete this segment"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}