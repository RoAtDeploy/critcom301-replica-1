import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RULES_PROMPT = `
You are an expert railway communications quality assessor. You will evaluate a call transcript and assess the STAFF MEMBER's performance only — not the other party on the call. Evaluate against the 6 rules below.

SCORING:
- Each rule is either PASS or FAIL.
- Use "n/a" only when the rule genuinely cannot be assessed from the transcript (e.g. the call was too short to include that element).

THE RULES (assess staff member only):

R1 — Caller Identification
PASS if the staff member states their name AND role. FAIL if either is missing.

R2 — Location Identification
PASS if the staff member provides a specific location reference: signal ID, mileage, station name, or worksite. Phonetic-prefix IDs (e.g. "Sierra 288") and alphanumeric IDs (e.g. NJ54) are valid. FAIL for vague references ("down the line", "nearby").

R3 — Three-Part Repeat-Back
PASS if the staff member's exchange contains all three parts: (1) Request/instruction, (2) Readback/execution, (3) Confirmation. Valid confirmation phrases: "that's correct", "that is correct", "is that correct?". FAIL if any part is missing.

R4 — No Ambiguous Language
PASS if the staff member uses no ambiguous language in safety-critical context. FAIL if they use "maybe", "might", "probably", or "I think" when referring to safety-critical decisions or states. NOTE: quantity/time estimates (e.g. "about 10 minutes") do NOT trigger a fail.

R5 — Proper Closure
PASS if the staff member ends with a formal close AND an agreed next action or handover acknowledgement. FAIL if the call trails off or ends without a clear close.

R6 — Positive Control Language
PASS if the staff member uses clear authoritative language: "you must", "you are authorised", "the block is in place". FAIL if they use passive or hedged phrasing (e.g. "you should probably", "I think you can go").

IMPORTANT:
- Only judge the staff member's contributions to the call.
- Ignore or discount anything said by the other party.
- Be specific in your reasoning — quote or paraphrase from the transcript.

RESPONSE FORMAT:
Return a JSON object. Do not include any other text.
{
  "rules": [
    {
      "id": "R1",
      "name": "Caller Identification",
      "status": <"pass" | "fail" | "n/a">,
      "reasoning": "<specific reasoning quoting or paraphrasing the staff member's words>"
    },
    {
      "id": "R2",
      "name": "Location Identification",
      "status": <"pass" | "fail" | "n/a">,
      "reasoning": "..."
    },
    {
      "id": "R3",
      "name": "Three-Part Repeat-Back",
      "status": <"pass" | "fail" | "n/a">,
      "reasoning": "..."
    },
    {
      "id": "R4",
      "name": "No Ambiguous Language",
      "status": <"pass" | "fail" | "n/a">,
      "reasoning": "..."
    },
    {
      "id": "R5",
      "name": "Proper Closure",
      "status": <"pass" | "fail" | "n/a">,
      "reasoning": "..."
    },
    {
      "id": "R6",
      "name": "Positive Control Language",
      "status": <"pass" | "fail" | "n/a">,
      "reasoning": "..."
    }
  ]
}
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
          rules: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                status: { type: 'string' },
                reasoning: { type: 'string' }
              }
            }
          }
        }
      }
    });

    // Unwrap extra 'response' key if the LLM wraps its output
    const normalized = assessment?.response ?? assessment;

    if (reportId) {
      await base44.asServiceRole.entities.Report.update(reportId, {
        quality_assessment: normalized
      });
    }

    return Response.json({ assessment: normalized });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});