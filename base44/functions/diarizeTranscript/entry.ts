import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const segments = body.segments;
    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return Response.json({ error: 'No segments provided' }, { status: 400 });
    }

    const lines = segments
      .map((s, i) => `[${i}] ${s.text || ''}`)
      .join('\n');

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are given a transcript of a two-person railway safety-critical phone call. The text has been split into segments by a speech recognition system.

Your job: label each segment as "S1" or "S2" based on the dialogue flow.

Guidelines:
- Questions tend to come from one speaker; answers from the other.
- If a speaker continues across consecutive segments, keep the same label.
- Alternate when genuinely unsure, but prefer consistency.
- Do NOT alter, correct, or paraphrase any text.
- Return a label for EVERY segment, in order.

TRANSCRIPT:
${lines}`,
      response_json_schema: {
        type: 'object',
        properties: {
          labels: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                index: { type: 'number' },
                speaker: { type: 'string' },
              },
              required: ['index', 'speaker'],
            },
          },
        },
      },
    });

    const labels = result?.labels || [];

    const labelMap = {};
    for (const lbl of labels) {
      labelMap[lbl.index] = lbl.speaker === 'S2' ? 'S2' : 'S1';
    }

    const updated = segments.map((seg, i) => ({
      ...seg,
      speaker: labelMap[i] || seg.speaker || 'S1',
    }));

    return Response.json({ segments: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}