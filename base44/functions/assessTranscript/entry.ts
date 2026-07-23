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
   The conversation should start correctly as this sets the tone for the remainder of the communication. Starting the communications properly involves identifying who you are, confirmation about who you are talking to, and where they are calling from.
   Watch for: over-familiarity (especially in repetitive communications) and not being specific enough about location.
   A: Clearly states own name, role, and specific location. Confirms who they are speaking to. All three elements present.
   B: Identifies themselves with most elements but missing one (e.g. location vague or role omitted).
   C: Partial identification only — over-familiar, vague, or missing multiple elements.
   D: No meaningful attempt to identify themselves, who they are calling, or from where.

2. Makes it clear what the intention or purpose of the communication is?
   This includes being clear that they are taking a line blockage, reporting an event, making an emergency call, testing equipment, etc.
   A: Purpose stated clearly and immediately at the outset; no ambiguity.
   B: Purpose eventually stated but not upfront, or slightly unclear.
   C: Purpose implied but never explicitly stated; listener may be confused.
   D: No clear purpose communicated throughout the call.

3. Delivers the message in a structured and logical manner?
   Look for evidence the individual has planned the communication and thought about what they are going to say (e.g. notes of key points). The message should have a clear structure: an opening, information exchange, agreement of actions, and confirmation of understanding.
   A: Message flows logically with a clear opening, information exchange, action agreement, and close.
   B: Mostly structured with minor digressions or elements out of sequence.
   C: Disorganised delivery; information given out of sequence causing potential confusion.
   D: Chaotic or incoherent delivery; no logical structure evident.

4. Delivers the message accurately and concisely?
   No superfluous chat. Information is relevant and structured logically. No over-explanation. Speaks in chunks of essential information. Avoids meaningless phrases like "I just wanted to tell you" or "as I said before".
   IMPORTANT — call etiquette: Normal courtesy such as a "thank you", "please", "cheers", or a brief "goodbye"/"bye" is professional and acceptable. Do NOT mark the staff member down for these as long as the core message remains clear and unconfused, and the courtesies are not excessive or repeated to the point of padding the call. Only treat etiquette as a negative when it is clearly overdone (drawn-out social chat, repeated/excessive pleasantries) or when it actually obscures or confuses the message.
   A: All information accurate and delivered without unnecessary padding or filler phrases. Brief, normal courtesies are fine and should not lower the grade.
   B: Mostly accurate and concise; minor inaccuracies or slight over-elaboration.
   C: Some inaccuracies or significant verbosity / filler phrases (or genuinely excessive social chat) that risk misunderstanding.
   D: Inaccurate information given, or delivery so poor accuracy cannot be confirmed.

5. Uses the safety critical communications protocols as specified by Rule Book Section G1?
   Speaks slowly and at a good volume. Uses the phonetic alphabet appropriately (train head-codes, signal numbers, difficult words). Avoids ambiguous language and regional words; keeps jargon to a minimum. Uses single numbers (zero, one, two...) for all key information. Uses the 24-hour clock. Uses standard terms and phrases (e.g. "this is an emergency call").
   A: Correct protocols used throughout — phonetic alphabet where appropriate, single numbers, 24hr clock, standard phrases.
   B: Protocols mostly followed with minor lapses (e.g. phonetic alphabet not used once when it should have been).
   C: Some protocol use but significant gaps or deviations from required procedure.
   D: No meaningful use of safety-critical communications protocols.

6. Listens actively, patiently and demonstrates understanding when receiving information?
   Uses acknowledgements (paraphrasing, use of "uh huh") to indicate they are listening.
   A: Clear evidence of active listening: no interruptions, uses acknowledgements, reflects back information.
   B: Generally listens well; minor instances of missing a point or insufficient acknowledgement.
   C: Listens passively; misses or ignores some information from the other party.
   D: Does not listen; talks over the other party or misses critical information entirely.

7. Asks questions to clarify and check all the information has been exchanged?
   Uses open questions at the start. Uses closed questions to confirm specifics. Persists with questioning until confident they have all the relevant information — does not accept vague reports.
   A: Proactively uses open then closed questions; persists until all key information is confirmed.
   B: Asks some questions but misses opportunities to clarify important points.
   C: Rarely asks questions; relies on assumptions; accepts vague answers without follow-up.
   D: No clarifying questions asked; information gaps left entirely unresolved.

8. Agrees actions and next steps?
   Only concludes the communication when the next step has been agreed.
   A: Clear, explicit agreement on actions and next steps before closing the call.
   B: Next steps mentioned but not formally agreed or confirmed by both parties.
   C: Vague reference to next steps without clear agreement.
   D: No discussion or agreement on actions or next steps; call ends without conclusion.

9. Confirms understanding through repeating back or summarising the critical details?
   Avoids monotonous and unnecessary repeat-back; thinks about what they are saying and what it means. Summarises focusing on key points. Uses active listening and neutral questions to confirm understanding.
   A: Meaningful repeat-back or summary of critical details; focussed on key points, not monotonous recitation.
   B: Partial repeat-back; key points summarised but not all critical details covered.
   C: Attempted repeat-back but incomplete, inaccurate, or merely monotonous recitation without thought.
   D: No repeat-back or summary of critical details.

10. Challenges lack of repeat back and mistakes in communications?
    Prompts / challenges the other party if they do not repeat back. Identifies and corrects errors or inconsistencies in the other party's repeat back.
    A: Actively and confidently challenges any omissions or errors in the other party's communications.
    B: Challenges one issue but allows others to pass without comment.
    C: Rarely challenges; accepts incomplete or incorrect communications without query.
    D: Makes no attempt to challenge errors or omissions in the other party's communications.

IMPORTANT:
- Only judge the STAFF MEMBER's contributions (lines labelled [STAFF]).
- TRANSCRIPTION NOTE: The transcription model may convert spoken words into their numeric or grouped forms. For example, if the staff member says "one, nine, five, three" it may appear in the transcript as "1953", or "zero, one" may appear as "01". The staff member IS still speaking the digits individually — the transcript format does NOT indicate they grouped them. Do NOT penalise a staff member for using grouped digits, numeric formats, or abbreviations that are simply artefacts of how the transcript was rendered. Judge whether they followed the single-number / phonetic protocol based on the spoken intent and context, not the written appearance of the transcript.
- Do not assess or grade the other party's performance.
- For aspects 6, 7, 9, 10 the interaction between parties is relevant context, but the grade still reflects the staff member's behaviour only.
- Be specific in your reasoning — quote or paraphrase the staff member's actual words from the transcript.
- If the transcript is too short or a specific aspect clearly cannot be assessed, use n/a.

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

    const { transcript, reportId, staffChannel, staffName, otherRole, staffRole } = await req.json();

    // Fetch industry definitions and assessment rules concurrently
    const [definitions, assessmentRules] = await Promise.all([
      base44.asServiceRole.entities.IndustryDefinition.list(),
      base44.asServiceRole.entities.AssessmentRule.list(),
    ]);
    const definitionsText = definitions.length > 0
      ? `\n\nINDUSTRY-SPECIFIC TERMINOLOGY (use these exact definitions when interpreting the transcript):\n${definitions.map(d => `- ${d.term}: ${d.definition}`).join('\n')}`
      : '';

    const rulesText = assessmentRules.length > 0
      ? `\n\nADMIN-CONFIGURED ASSESSMENT CRITERIA (use these criteria to grade each aspect — they override the defaults above):\n${[...assessmentRules].sort((a, b) => Number(a.aspect_id) - Number(b.aspect_id)).map(r => `Aspect ${r.aspect_id} — ${r.aspect_name}:\n  A: ${r.grade_a_criteria}\n  B: ${r.grade_b_criteria || 'Between A and C'}\n  C: ${r.grade_c_criteria || 'Between B and D'}\n  D: ${r.grade_d_criteria}${r.additional_guidance ? `\n  Watch-points: ${r.additional_guidance}` : ''}`).join('\n\n')}`
      : '';

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
      ? `The staff member being assessed is ${staffName}${staffRole ? `, whose role on site is ${staffRole}` : ''}${staffChannel ? ` (speaker: ${staffChannel})` : ''}. Lines labelled [STAFF] are their contributions. Lines labelled [OTHER] are ${otherRole || 'the other party'} — do NOT assess these except where the interaction is relevant.`
      : '';

    const summaryPrompt = `You are reviewing a railway staff call. Write a single sentence (max 2 sentences) summarising the context of this call for a reviewer. Include who is speaking (staff member name and their role on site) and who they are speaking to (the other party's role). Do not evaluate quality — just describe the call context concisely.

Staff member: ${staffName || 'Unknown'}
Their role: ${staffRole || '(infer from transcript if possible)'}
Other party role: ${otherRole || 'Unknown'}

TRANSCRIPT:
${transcriptText}`;

    const [assessment, summaryResult] = await Promise.all([
      base44.integrations.Core.InvokeLLM({
        model: 'claude_sonnet_4_6',
        prompt: `${ASSESSMENT_PROMPT}${definitionsText}${rulesText}\n\n${staffContext}\n\nTRANSCRIPT TO ASSESS:\n\n${transcriptText}`,
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