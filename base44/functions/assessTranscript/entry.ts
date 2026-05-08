import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RULES_PROMPT = `
You are an expert railway communications quality assessor. You will evaluate a call transcript against 8 specific rules (R1–R8). For each rule, assign a score of 0, 0.5, or 1, and provide brief reasoning.

SCORING SCALE:
- 1 = Fully compliant
- 0.5 = Minor issue / coaching point
- 0 = Violation / missing

THE RULES:

R1 — Caller Identification
The caller must state their name AND role. On a handback where an authority number is quoted (e.g. "10800 Lima"), identification is paired with the signaller's logbook entry at take-time (Rule Book T3 §4 / RT3185). A missing role declaration is a minor coaching point (0.5), not a full violation (0).

R2 — Receiver Acknowledgement
The receiver must identify themselves and confirm they are ready. Only evaluate this rule if the transcript is a tagged/two-party call. If not applicable, return score: null.

R3 — Location Identification
A specific reference is required — signal ID, mileage, station, or "NNNN points". Phonetic-prefix signal IDs (e.g. "Sierra 288") are valid alongside alphanumeric ones (e.g. NJ54).

R4 — Three-Part Repeat-Back
The exchange must contain: (1) Request, (2) Execution/readback, (3) Confirmation. "That's correct", "that is correct", or "is that correct?" are all valid confirmation forms.

R5 — No Ambiguous Language
Zero tolerance for "maybe", "might", "probably", "I think" in safety-critical context. Context-aware: quantity or time estimates (e.g. "about 10 minutes") do NOT trip this rule.

R6 — Proper Closure
The call must end with a formal close AND an agreed next action or handover acknowledgement.

R7 — Positive Control Language
Language must be positive and authoritative: "you must", "you are authorised", "block is in place". Passive or hedged language is a violation.

R8 — Safety-Critical Content Validated
All named limits, authority numbers, and permit references must be confirmed by readback from the receiver.

RESPONSE FORMAT:
Return a JSON object with the following structure. Do not include any other text.
{
  "overall_score": <number 0-8, sum of individual scores>,
  "overall_percentage": <number 0-100>,
  "overall_grade": <"Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Unsatisfactory">,
  "summary": "<2-3 sentence overall assessment>",
  "rules": [
    {
      "id": "R1",
      "name": "Caller Identification",
      "score": <0 | 0.5 | 1 | null>,
      "max_score": 1,
      "status": <"pass" | "coaching" | "fail" | "n/a">,
      "reasoning": "<specific reasoning referencing transcript content>"
    },
    ... (R2 through R8)
  ]
}

Grade thresholds: 90-100% = Excellent, 75-89% = Good, 60-74% = Satisfactory, 40-59% = Needs Improvement, 0-39% = Unsatisfactory.
`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { transcript, reportId } = await req.json();

    if (!transcript) {
      return Response.json({ error: 'No transcript provided' }, { status: 400 });
    }

    const transcriptText = typeof transcript === 'string'
      ? transcript
      : Array.isArray(transcript)
        ? transcript.map(seg => `[${seg.timestamp || ''}] ${seg.channel ? `(${seg.channel}) ` : ''}${seg.text}`).join('\n')
        : JSON.stringify(transcript);

    const assessment = await base44.integrations.Core.InvokeLLM({
      model: 'claude_sonnet_4_6',
      prompt: `${RULES_PROMPT}\n\nTRANSCRIPT TO ASSESS:\n\n${transcriptText}`,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_score: { type: 'number' },
          overall_percentage: { type: 'number' },
          overall_grade: { type: 'string' },
          summary: { type: 'string' },
          rules: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                score: {},
                max_score: { type: 'number' },
                status: { type: 'string' },
                reasoning: { type: 'string' }
              }
            }
          }
        }
      }
    });

    // Optionally save back to the report entity
    if (reportId) {
      await base44.asServiceRole.entities.Report.update(reportId, {
        quality_assessment: assessment
      });
    }

    return Response.json({ assessment });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});