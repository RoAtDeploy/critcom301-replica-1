import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const ASSESSMENT_PROMPT = `
You are an expert railway communications quality assessor. You will evaluate a call transcript and assess the STAFF MEMBER's performance only — not the other party on the call.

GRADING SCALE:
- A (Competent): High standard of communications. Protocols fully followed. Strong evidence of effective non-technical skills: planning, clarity, conciseness, challenging where appropriate, actively listening.
- B (Competent with Development): Satisfactory performance but could be improved. Most protocols followed. Satisfactory evidence of summarising, questioning, and repeating back to check understanding.
- C (Medium Risk): Performance gives rise to concerns. Some protocols followed but with significant variations and possibility of misunderstanding. Limited or poor non-technical skills (clarity, listening, questioning, summarising).
- D (High Risk): Communications not acceptable. None or very limited attempt to follow communications protocols. Poor or absent non-technical skills resulting in safety being compromised.
- n/a: The aspect cannot be assessed from this transcript (e.g. too short, not applicable to call type).

THE 10 ASPECTS TO ASSESS (assess staff member only, aspect 11 is user-scored):

1. Opens the communication by identifying themselves, who they are talking to and from where?
   A: Clearly states own name, role, and specific location. Confirms who they are speaking to.
   B: Identifies themselves and location but missing one element (e.g. no role stated).
   C: Partial identification only — vague or incomplete.
   D: No attempt to identify themselves, who they are calling, or from where.

2. Makes it clear what the intention or purpose of the communication is?
   A: Purpose stated clearly and immediately at the outset.
   B: Purpose eventually stated but not upfront or slightly unclear.
   C: Purpose implied but never explicitly stated; listener may be confused.
   D: No clear purpose communicated throughout the call.

3. Delivers the message in a structured and logical manner?
   A: Message flows logically; information given in a clear sequence.
   B: Mostly structured with minor digressions or repetition.
   C: Disorganised delivery; information given out of sequence causing potential confusion.
   D: Chaotic or incoherent delivery; no logical structure evident.

4. Delivers the message accurately and concisely?
   A: All information accurate and delivered without unnecessary padding.
   B: Mostly accurate and concise; minor inaccuracies or slight over-elaboration.
   C: Some inaccuracies or significant verbosity that risks misunderstanding.
   D: Inaccurate information given, or delivery so poor accuracy cannot be confirmed.

5. Uses the safety critical communications protocols?
   A: Correct protocol used throughout (e.g. repeat-back, phonetic alphabet, signal IDs).
   B: Protocols mostly followed with minor lapses.
   C: Some protocol use but significant gaps or deviations from required procedure.
   D: No meaningful use of safety-critical communications protocols.

6. Listens actively, patiently and demonstrates understanding when receiving information?
   A: Clear evidence of active listening: no interruptions, acknowledges information, reflects back.
   B: Generally listens well; one or two instances of interrupting or missing a point.
   C: Listens passively; misses or ignores some information from the other party.
   D: Does not listen; talks over the other party or misses critical information entirely.

7. Asks questions to clarify and check all the information has been exchanged?
   A: Proactively asks clarifying questions; confirms all key information has been covered.
   B: Asks some questions but misses opportunities to clarify important points.
   C: Rarely asks questions; relies on assumptions rather than verification.
   D: No clarifying questions asked; information gaps left unresolved.

8. Agrees actions and next steps?
   A: Clear agreement on actions and next steps before closing the call.
   B: Next steps mentioned but not formally agreed or confirmed.
   C: Vague reference to next steps without clear agreement.
   D: No discussion or agreement on actions or next steps.

9. Confirms understanding through repeating back or summarising the critical details?
   A: Repeat-back or summary of critical details explicitly confirmed by both parties.
   B: Partial repeat-back; key points summarised but not all critical details covered.
   C: Attempted repeat-back but incomplete or inaccurate.
   D: No repeat-back or summary of critical details.

10. Challenges lack of repeat back and mistakes in communications?
    A: Actively and confidently challenges any omissions or errors in the other party's communications.
    B: Challenges one issue but allows others to pass without comment.
    C: Rarely challenges; accepts incomplete or incorrect communications without query.
    D: Makes no attempt to challenge errors or omissions in the other party's communications.

IMPORTANT:
- Only judge the staff member's contributions.
- Ignore or discount anything said by the other party EXCEPT when assessing aspects 6, 7, 10 where the interaction is relevant.
- Be specific in your reasoning — quote or paraphrase from the transcript.

RESPONSE FORMAT:
Return a JSON object only. No other text.
{
  "aspects": [
    {
      "id": "1",
      "name": "Opens communication with identification",
      "grade": <"A" | "B" | "C" | "D" | "n/a">,
      "reasoning": "<specific reasoning quoting or paraphrasing the staff member's words>"
    },
    ... (aspects 2 through 10 in same format)
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

    const { transcript, reportId, staffChannel, staffName, otherRole } = await req.json();

    if (!transcript) {
      return Response.json({ error: 'No transcript provided' }, { status: 400 });
    }

    const transcriptText = typeof transcript === 'string'
      ? transcript
      : Array.isArray(transcript)
      ? transcript.map(seg => {
          const isStaff = staffChannel
            ? (seg.speaker === staffChannel || seg.channel === staffChannel)
            : seg.is_staff;
          const label = isStaff ? `[STAFF${staffName ? ` - ${staffName}` : ''}]` : `[OTHER]`;
          return `[${seg.timestamp || ''}] ${label} ${seg.text}`;
        }).join('\n')
        : JSON.stringify(transcript);

    const staffContext = staffName
      ? `The staff member being assessed is ${staffName}${staffChannel ? ` (speaker: ${staffChannel})` : ''}. Lines labelled [STAFF] are their contributions. Lines labelled [OTHER] are ${otherRole || 'the other party'} — do NOT assess these except where the interaction is relevant.`
      : '';

    const summaryPrompt = `You are reviewing a railway staff call. Write a single sentence (max 2 sentences) summarising the context of this call for a reviewer. Include who is speaking (staff member name and their role on site) and who they are speaking to (the other party's role). Do not evaluate quality — just describe the call context concisely.

Staff member: ${staffName || 'Unknown'}
Their role: (infer from transcript if possible)
Other party role: ${otherRole || 'Unknown'}

TRANSCRIPT:
${transcriptText}`;

    const [assessment, summaryResult] = await Promise.all([
      base44.integrations.Core.InvokeLLM({
        model: 'claude_sonnet_4_6',
        prompt: `${ASSESSMENT_PROMPT}\n\n${staffContext}\n\nTRANSCRIPT TO ASSESS:\n\n${transcriptText}`,
        response_json_schema: {
          type: 'object',
          properties: {
            aspects: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  grade: { type: 'string' },
                  reasoning: { type: 'string' }
                }
              }
            }
          }
        }
      }),
      base44.integrations.Core.InvokeLLM({
        prompt: summaryPrompt,
      })
    ]);

    const normalized = assessment?.response ?? assessment;
    const callSummary = typeof summaryResult === 'string' ? summaryResult.trim() : '';

    // Append the 11th aspect (user-scored) as a placeholder
    if (normalized?.aspects) {
      normalized.aspects.push({
        id: '11',
        name: 'Completes relevant actions and supporting documentation',
        grade: null,
        reasoning: '',
        user_scored: true,
      });
    }

    if (reportId) {
      await base44.asServiceRole.entities.Report.update(reportId, {
        quality_assessment: normalized,
        call_summary: callSummary,
      });
    }

    return Response.json({ assessment: normalized, call_summary: callSummary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});