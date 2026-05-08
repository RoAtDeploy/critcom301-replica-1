import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transcription, staffName, role, callType, callDate, context } = await req.json();

    if (!transcription) {
      return Response.json({ error: 'No transcription provided' }, { status: 400 });
    }

    // Format segments into timestamped transcript lines
    const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = Math.floor(seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };

    const timestampedLines = (transcription.segments || []).map((seg, idx) => ({
      timestamp: formatTime(seg.start),
      channel: idx % 2 === 0 ? 'LC' : 'RC',
      text: seg.text.trim(),
    }));

    const report = {
      staffName: staffName || 'Unknown',
      role: role || 'Unknown',
      callType: callType || 'Unknown',
      callDate: callDate || new Date().toISOString().split('T')[0],
      context: context || '',
      duration: transcription.duration,
      language: transcription.language,
      fullText: transcription.text,
      timestampedTranscript: timestampedLines,
      generatedAt: new Date().toISOString(),
    };

    return Response.json({ report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});