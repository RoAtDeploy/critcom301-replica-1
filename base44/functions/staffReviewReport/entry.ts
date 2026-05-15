import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { reportId, action, items, signature } = await req.json();

  if (!reportId) {
    return Response.json({ error: 'reportId is required' }, { status: 400 });
  }

  // GET report
  if (action === 'get') {
    const report = await base44.asServiceRole.entities.Report.get(reportId);
    return Response.json({ report });
  }

  // SUBMIT review
  if (action === 'submit') {
    const updatePayload = {
      action_items: items,
      status: 'staff_reviewed',
      staff_reviewed_at: new Date().toISOString(),
    };
    if (signature) updatePayload.staff_signature = signature;
    const updated = await base44.asServiceRole.entities.Report.update(reportId, updatePayload);
    return Response.json({ report: updated });
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
});