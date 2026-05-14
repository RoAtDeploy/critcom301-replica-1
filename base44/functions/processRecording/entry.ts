import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

const SCREENING_PROMPT = `You are a content screening assistant for railway communications. Review the following transcript and determine if it contains any alert-worthy content.

Alert-worthy content includes:
- Profanity or inappropriate language
- Aggressive or threatening behaviour
- Non-standard or dangerous safety-critical communication (e.g. unclear emergency reporting)
- Confusion or significant errors that could have safety implications

If alert-worthy content is found, respond with a single concise sentence describing the specific issue (e.g. "Profanity detected — staff used inappropriate language during reporting").
If no issues are found, respond with exactly: null

Respond with ONLY the flag sentence or the word null. No other text.

TRANSCRIPT:
`;

const GRADE_PROMPT = `You are a railway communications quality assessor. Based on the following transcript, assign an overall grade for the STAFF MEMBER's communication performance.

Grades:
- A: High standard. Protocols fully followed. Effective non-technical skills throughout.
- B: Satisfactory but improvable. Most protocols followed. Minor gaps in technique.
- C: Gives rise to concerns. Significant protocol variations. Limited non-technical skills.
- D: Not acceptable. Little or no protocol adherence. Safety compromised.
- n/a: Cannot be assessed (too short, not applicable).

Respond with ONLY a JSON object in this exact format, no other text:
{"grade": "A" | "B" | "C" | "D" | "n/a", "reasoning": "<one sentence explanation>"}

TRANSCRIPT:
`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, staff_id, staff_name } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    // Step 1: Transcribe the audio
    const transcribeResult = await base44.functions.invoke('transcribeAudio', { file_url });
    const { text, segments, duration, language } = transcribeResult.data;

    if (!text) {
      return Response.json({ error: 'Transcription failed or returned empty' }, { status: 500 });
    }

    const transcriptForPrompt = segments?.length > 0
      ? segments.map(s => `[${s.timestamp}] ${s.text}`).join('\n')
      : text;

    // Step 2: Grade and screen concurrently
    const [gradeResponse, flagResponse] = await Promise.all([
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: GRADE_PROMPT + transcriptForPrompt }],
        temperature: 0.2,
      }),
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: SCREENING_PROMPT + transcriptForPrompt }],
        temperature: 0.2,
      }),
    ]);

    // Parse grade
    let grade = 'n/a';
    try {
      const gradeRaw = gradeResponse.choices[0].message.content.trim();
      const parsed = JSON.parse(gradeRaw);
      if (['A', 'B', 'C', 'D', 'n/a'].includes(parsed.grade)) {
        grade = parsed.grade;
      }
    } catch (_) {
      // fallback to n/a
    }

    // Parse flag
    let flag = null;
    const flagRaw = flagResponse.choices[0].message.content.trim();
    if (flagRaw && flagRaw.toLowerCase() !== 'null') {
      flag = flagRaw;
    }

    // Step 3: Persist Recording to database
    const recording = await base44.asServiceRole.entities.Recording.create({
      name: `recording_${Date.now()}.audio`,
      staff_id: staff_id || null,
      staff_name: staff_name || null,
      audio_url: file_url,
      duration: duration || null,
      grade,
      flag: flag || undefined,
      transcription: text,
      segments: segments || [],
      language: language || null,
    });

    return Response.json({
      recording,
      text,
      segments,
      duration,
      language,
      grade,
      flag,
    });

  } catch (error) {
    console.error('processRecording error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});