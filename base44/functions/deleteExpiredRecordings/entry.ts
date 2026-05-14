import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allRecordings = await base44.asServiceRole.entities.Recording.list('-created_date', 500);
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;

    const expired = allRecordings.filter(r => new Date(r.created_date).getTime() < cutoff);

    let deleted = 0;
    for (const rec of expired) {
      await base44.asServiceRole.entities.Recording.delete(rec.id);
      deleted++;
    }

    return Response.json({ deleted, checked: allRecordings.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});