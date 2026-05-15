import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import OpenAI from 'npm:openai';

const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

function buildScreeningPrompt(triggers) {
  const enabledTriggers = triggers.filter(t => t.enabled);
  const triggerLines = enabledTriggers.length > 0
    ? `\n\nADMIN-CONFIGURED ALERT TRIGGERS — you MUST flag if any of the following are detected:\n${enabledTriggers.map(t => `- [${t.severity.toUpperCase()} / ${t.category}] "${t.phrase}"`).join('\n')}`
    : '';

  return `You are a content screening assistant for railway communications. Review the following transcript and determine if it contains any alert-worthy content.

Alert-worthy content includes:
- Profanity or inappropriate language
- Aggressive or threatening behaviour
- Non-standard or dangerous safety-critical communication (e.g. unclear emergency reporting)
- Confusion or significant errors that could have safety implications${triggerLines}

If alert-worthy content is found, respond with a single concise sentence describing the specific issue (e.g. "Profanity detected — staff used inappropriate language during reporting").
If no issues are found, respond with exactly: null

Respond with ONLY the flag sentence or the word null. No other text.

TRANSCRIPT:
`;
}

function buildGradePrompt(guideline) {
  const guidelineText = guideline || `Assign a quick overall grade (A, B, C, D, X, or n/a) based on the staff member's communication performance.
- A: High standard. Protocols fully followed. Effective non-technical skills throughout.
- B: Satisfactory but improvable. Most protocols followed. Minor gaps in technique.
- C: Gives rise to concerns. Significant protocol variations. Limited non-technical skills.
- D: Not acceptable. Little or no protocol adherence. Safety compromised.
- X: ONLY use this when the call is UNAMBIGUOUSLY not safety-critical — e.g. a clearly wrong number with no work content, an obviously personal/social call with no operational relevance, or a call where there is no meaningful dialogue at all. When in doubt, grade A-D based on the content present. Do NOT assign X simply because a call is brief or informal.
- n/a: Cannot be assessed (too short to judge, entirely unintelligible, silent/blank recording).`;

  return `You are a railway communications quality assessor. Based on the following transcript, assign an overall grade for the STAFF MEMBER's communication performance.

${guidelineText}

CRITICAL RULE: Grade X must only be used when you are absolutely certain the call has zero operational or safety relevance (wrong number, purely personal/social with no work content whatsoever, or completely empty). If there is ANY railway operational content, work-related discussion, or safety-relevant communication — even brief or informal — you MUST grade it A, B, C, or D. Default to grading A-D when uncertain. X is the exception, not the default.

Respond with ONLY a JSON object in this exact format, no other text:
{"grade": "A" | "B" | "C" | "D" | "X" | "n/a", "reasoning": "<one sentence explanation>"}

TRANSCRIPT:
`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, staff_id, staff_name, file_name } = await req.json();

    if (!file_url) {
      return Response.json({ error: 'file_url is required' }, { status: 400 });
    }

    // Step 1: Transcribe the audio (inline — avoids auth issues when called in parallel)
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    const fetchRes = await fetch(file_url);
    const audioBlob = await fetchRes.blob();

    const form = new FormData();
    form.append('file', audioBlob, 'audio.mp3');
    form.append('model', 'whisper-1');
    form.append('response_format', 'verbose_json');

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!whisperRes.ok) {
      const err = await whisperRes.text();
      throw new Error(`Whisper error: ${err}`);
    }

    const whisperData = await whisperRes.json();
    const text = whisperData.text;
    const language = whisperData.language;
    const duration = whisperData.duration;
    const segments = (whisperData.segments || []).map(seg => ({
      timestamp: (() => { const m = Math.floor(seg.start / 60).toString().padStart(2,'0'); const s = Math.floor(seg.start % 60).toString().padStart(2,'0'); return `${m}:${s}`; })(),
      start: seg.start,
      end: seg.end,
      text: seg.text.trim(),
    }));

    if (!text) {
      return Response.json({ error: 'Transcription failed or returned empty' }, { status: 500 });
    }

    const transcriptForPrompt = segments?.length > 0
      ? segments.map(s => `[${s.timestamp}] ${s.text}`).join('\n')
      : text;

    // Load admin AI config concurrently
    const [alertTriggers, gradeConfigs] = await Promise.all([
      base44.asServiceRole.entities.AlertTrigger.list(),
      base44.asServiceRole.entities.AdminConfig.filter({ key: 'quickGradeGuideline' }),
    ]);
    const guidelineText = gradeConfigs[0]?.values?.[0] || null;

    const SCREENING_PROMPT = buildScreeningPrompt(alertTriggers);
    const GRADE_PROMPT = buildGradePrompt(guidelineText);

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
      if (['A', 'B', 'C', 'D', 'X', 'n/a'].includes(parsed.grade)) {
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
      name: file_name || `recording_${Date.now()}.audio`,
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