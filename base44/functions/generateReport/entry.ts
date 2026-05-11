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

    const formatTime = (seconds) => {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = Math.floor(seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    };

    // Use AI to identify which channel (LC or RC) the staff member is on,
    // by matching the staff member's name against the text content of each channel.
    const transcriptPreview = (transcription.segments || [])
      .slice(0, 30)
      .map(s => `[${s.channel}] ${s.text.trim()}`)
      .join('\n');

    const channelResult = await base44.integrations.Core.InvokeLLM({
      model: 'claude_sonnet_4_6',
      prompt: `You are analysing a call transcript to identify which audio channel the staff member is speaking on.

The staff member's name is: "${staffName}"

Below is a sample of the transcript. Each line is prefixed with [LC] (left channel) or [RC] (right channel).
Match the staff member's name or self-introduction to the correct channel.
If you cannot determine this from the text alone, default to "LC".

Transcript sample:
${transcriptPreview}

Respond with ONLY a JSON object in this exact format: { "staffChannel": "LC" } or { "staffChannel": "RC" }`,
      response_json_schema: {
        type: 'object',
        properties: {
          staffChannel: { type: 'string' }
        }
      }
    });

    const determinedStaffChannel = channelResult?.staffChannel || 'LC';

    // Build the timestamped transcript, labelling each segment by whether it is the staff member
    const timestampedLines = (transcription.segments || []).map((seg) => {
      const channel = seg.channel || 'LC';
      const isStaff = channel === determinedStaffChannel;
      return {
        timestamp: seg.timestamp || formatTime(seg.start || 0),
        channel,
        isStaff,
        text: seg.text.trim(),
      };
    });

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
      staffChannel: determinedStaffChannel,
      generatedAt: new Date().toISOString(),
    };

    return Response.json({ report });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});