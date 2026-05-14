const SPEAKER_STYLES = {
  S1: { badge: "bg-blue-100 text-blue-700 border-blue-300", row: "border-blue-200" },
  S2: { badge: "bg-orange-100 text-orange-700 border-orange-300", row: "border-orange-200" },
};

export default function TranscriptEditor({ segments, onSegmentsChange, speakerLabels = {} }) {
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

  return (
    <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
      {segments.map((seg, idx) => {
        const style = SPEAKER_STYLES[seg.speaker] || SPEAKER_STYLES.S1;
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
            <textarea
              value={seg.text}
              onChange={(e) => updateText(idx, e.target.value)}
              rows={1}
              className="text-sm text-foreground/80 leading-relaxed flex-1 bg-transparent resize-none border-0 outline-none focus:bg-white focus:ring-1 focus:ring-primary/30 rounded px-1 py-0 min-h-[1.5rem] overflow-hidden"
              style={{ height: "auto" }}
              onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
            />
          </div>
        );
      })}
    </div>
  );
}