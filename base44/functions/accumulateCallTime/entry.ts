import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { data, event } = body;
    const duration = data?.duration;

    if (!duration || duration <= 0) {
      return Response.json({ ok: true, skipped: true });
    }

    // Find or create the all-time call time config record
    const existing = await base44.asServiceRole.entities.AdminConfig.filter({ key: 'allTimeCallSeconds' });

    if (existing.length > 0) {
      const current = parseFloat(existing[0].values?.[0] || '0');
      await base44.asServiceRole.entities.AdminConfig.update(existing[0].id, {
        values: [String(current + duration)]
      });
    } else {
      await base44.asServiceRole.entities.AdminConfig.create({
        key: 'allTimeCallSeconds',
        values: [String(duration)]
      });
    }

    return Response.json({ ok: true, added: duration });
  } catch (error) {
    console.error('accumulateCallTime error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});