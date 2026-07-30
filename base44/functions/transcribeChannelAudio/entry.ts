import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { secrets } from 'base44:runtime';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const fileUrl = body.file_url;
    if (!fileUrl) return Response.json({ error: 'No file_url provided' }, { status: 400 });

    const apiKey = secrets.get('OPENAI_API_KEY');
    if (!apiKey) return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 });

    // Fetch the audio file
    const fetchRes = await fetch(fileUrl);
    const audioBlob = await fetchRes.blob();

    // Send directly to Whisper — raw transcription only, no LLM post-processing
    const form = new FormData();
    form.append('file', audioBlob, 'audio.wav');
    form.append('model', 'whisper-1');
    form.append('response_format', 'verbose_json');
    form.append('prompt', 'Railway safety-critical communications. Single digits spoken individually: zero, one, two, three, four, five, six, seven, eight, nine. Phonetic alphabet: Alpha, Bravo, Charlie, Delta, Echo, Foxtrot, Golf, Hotel, India, Juliet, Kilo, Lima, Mike, November, Oscar, Papa, Quebec, Romeo, Sierra, Tango, Uniform, Victor, Whiskey, X-ray, Yankee, Zulu. Signal numbers and headcodes given digit by digit. One two three four five six seven eight nine zero.');

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    if (!whisperRes.ok) {
      const err = await whisperRes.text();
      throw new Error(`Whisper error: ${err}`);
    }

    const result = await whisperRes.json();

    // Return raw Whisper text and segments — no LLM resegmentation
    return Response.json({
      text: result.text || '',
      segments: (result.segments || []).map(seg => ({
        start: seg.start,
        end: seg.end,
        text: (seg.text || '').trim(),
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}