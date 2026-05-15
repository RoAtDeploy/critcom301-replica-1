import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// One-time seed function to initialise allTimeCallSeconds from existing recordings.
// Safe to run multiple times — it always recalculates from scratch.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all recordings (up to 1000)
    const recordings = await base44.asServiceRole.entities.Recording.list('-created_date', 1000);
    const total = recordings.reduce((sum, r) => sum + (r.duration || 0), 0);

    // Upsert the config record
    const existing = await base44.asServiceRole.entities.AdminConfig.filter({ key: 'allTimeCallSeconds' });
    if (existing.length > 0) {
      await base44.asServiceRole.entities.AdminConfig.update(existing[0].id, { values: [String(total)] });
    } else {
      await base44.asServiceRole.entities.AdminConfig.create({ key: 'allTimeCallSeconds', values: [String(total)] });
    }

    return Response.json({ ok: true, total, count: recordings.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});