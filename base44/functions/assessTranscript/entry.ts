import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RULES_PROMPT = `
You are an expert railway communications quality assessor. You will evaluate a call transcript and assess the STAFF MEMBER's performance only — not the other party on the call. Evaluate against the 6 rules below.

SCORING SCALE:
- 1 = Fully compliant
- 0.5 = Minor issue / coaching point
- 0 = Violation / missing
- null = Not applicable (use sparingly, only when the rule genuinely cannot be assessed from the transcript)

THE RULES (assess staff member only):

R1 — Caller Identification
The staff member must state their name AND role when initiating or responding to the call. A missing role is a coaching point (0.5), not a full fail (0).

R2 — Location Identification
The staff member must provide a specific location reference — signal ID, mileage, station name, or worksite. Phonetic-prefix IDs (e.g. "Sierra 288") and alphanumeric IDs (e.g. NJ54) are both valid. Vague references ("down the line") are a fail (0).

R3 — Three-Part Repeat-Back
The exchange attributed to the staff member must contain: (1) a Request or instruction, (2) a readback/execution, (3) a Confirmation. Valid confirmation phrases include: "that's correct", "that is correct", "is that correct?". Missing any part is a fail (0). A partial readback is coaching (0.5).

R4 — No Ambiguous Language
Zero tolerance for "maybe", "might", "probably", "I think" used in safety-critical context by the staff member. Context-aware: quantity/time estimates (e.g. "about 10 minutes", "approximately 5 metres") do NOT trigger this rule. Only flag genuine uncertainty language around safety-critical decisions or states.

R5 — Proper Closure
The staff member must end the call with a formal close AND an agreed next action or handover acknowledgement. A call that simply trails off or ends without a clear close is a fail (0).

R6 — Positive Control Language
The staff member must use clear, authoritative language: e.g. "you must", "you are authorised", "the block is in place". Passive, hedged, or uncertain phrasing (e.g. "you should probably", "I think you can go") is a violation (0). Mildly passive but not misleading is coaching (0.5).

IMPORTANT:
- Only judge the staff member's contributions to the call.
- Ignore or discount anything said by the other party.
- Be specific in your reasoning — quote or paraphrase from the transcript.

RESPONSE FORMAT:
Return a JSON object. Do not include any other text.
{
  "overall_score": <number, sum of non-null scores>,
  "overall_percentage": <number 0-100, based on applicable rules only>,
  "overall_grade": <"Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Unsatisfactory">,
  "summary": "<2-3 sentence overall assessment of the staff member's performance>",
  "rules": [
    {
      "id": "R1",
      "name": "Caller Identification",
      "score": <0 | 0.5 | 1 | null>,
      "max_score": 1,
      "status": <"pass" | "coaching" | "fail" | "n/a">,
      "reasoning": "<specific reasoning quoting or paraphrasing the staff member's words>"
    },
    {
      "id": "R2",
      "name": "Location Identification",
      "score": <0 | 0.5 | 1 | null>,
      "max_score": 1,
      "status": <"pass" | "coaching" | "fail" | "n/a">,
      "reasoning": "..."
    },
    {
      "id": "R3",
      "name": "Three-Part Repeat-Back",
      "score": <0 | 0.5 | 1 | null>,
      "max_score": 1,
      "status": <"pass" | "coaching" | "fail" | "n/a">,
      "reasoning": "..."
    },
    {
      "id": "R4",
      "name": "No Ambiguous Language",
      "score": <0 | 0.5 | 1 | null>,
      "max_score": 1,
      "status": <"pass" | "coaching" | "fail" | "n/a">,
      "reasoning": "..."
    },
    {
      "id": "R5",
      "name": "Proper Closure",
      "score": <0 | 0.5 | 1 | null>,
      "max_score": 1,
      "status": <"pass" | "coaching" | "fail" | "n/a">,
      "reasoning": "..."
    },
    {
      "id": "R6",
      "name": "Positive Control Language",
      "score": <0 | 0.5 | 1 | null>,
      "max_score": 1,
      "status": <"pass" | "coaching" | "fail" | "n/a">,
      "reasoning": "..."
    }
  ]
}

Grade thresholds (based on applicable rules only): 90-100% = Excellent, 75-89% = Good, 60-74% = Satisfactory, 40-59% = Needs Improvement, 0-39% = Unsatisfactory.
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