import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { verifyReviewToken } from '../../shared/reviewToken.js';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { reportId, action, items, signature, token } = await req.json();

  if (!reportId) {
    return Response.json({ error: 'reportId is required' }, { status: 400 });
  }

  // Authorization: either a valid per-report review token (the staff member
  // following their secure email link) or an authenticated assessor/admin
  // (e.g. previewing the staff view). A bare report id is never sufficient.
  let authorized = false;
  if (await verifyReviewToken(reportId, token)) {
    authorized = true;
  } else {
    try {
      const me = await base44.auth.me();
      if (me && (me.role === 'admin' || me.role === 'assessor')) authorized = true;
    } catch { /* not authenticated */ }
  }
  if (!authorized) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
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