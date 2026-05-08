import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let audioBlob;
    let fileName = 'audio.mp3';
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // Direct file upload
      const formData = await req.formData();
      const audioFile = formData.get('file');
      if (!audioFile) {
        return Response.json({ error: 'No audio file provided' }, { status: 400 });
      }
      audioBlob = audioFile;
      fileName = audioFile.name || fileName;
    } else {
      // JSON body with file_url
      const body = await req.json();
      const fileUrl = body.file_url;
      if (!fileUrl) {
        return Response.json({ error: 'No file_url provided' }, { status: 400 });
      }
      const fetchRes = await fetch(fileUrl);
      audioBlob = await fetchRes.blob();
      // Extract filename from URL
      const urlParts = fileUrl.split('/');
      fileName = urlParts[urlParts.length - 1] || fileName;
    }

    // Build FormData for OpenAI Whisper API
    const whisperForm = new FormData();
    whisperForm.append('file', audioBlob, fileName);
    whisperForm.append('model', 'whisper-1');
    whisperForm.append('response_format', 'verbose_json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: whisperForm,
    });

    if (!response.ok) {
      const errorData = await response.text();
      return Response.json({ error: `Whisper API error: ${errorData}` }, { status: response.status });
    }

    const result = await response.json();

    return Response.json({
      text: result.text,
      language: result.language,
      duration: result.duration,
      segments: result.segments,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});