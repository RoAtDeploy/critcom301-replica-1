import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { reportId, staffEmail, staffName } = await req.json();
  if (!reportId || !staffEmail) {
    return Response.json({ error: 'reportId and staffEmail are required' }, { status: 400 });
  }

  // Build the staff review URL (public, no auth needed)
  const appUrl = req.headers.get('origin') || 'https://app.base44.com';
  const reviewUrl = `${appUrl}/staff-review/${reportId}`;

  const subject = `Your Communication Monitoring Report – Action Required`;
  const body = `
Dear ${staffName || 'Team Member'},

Your line manager has completed a review of a recent safety-critical communication monitoring session and your report is now ready for you to view.

Please click the link below to review your report, read any feedback, and confirm any required actions:

${reviewUrl}

What you'll need to do:
- Review the feedback for each aspect of your communication
- For any items graded C or D, confirm the assigned action and mark it as completed once done
- Add any comments you wish to share
- Click "Confirm & Submit" when you are finished

If you have any questions, please speak to your line manager directly.

Kind regards,
CritCon301 Monitoring Team
  `.trim();

  await base44.integrations.Core.SendEmail({
    from_name: "CritCon301",
    to: staffEmail,
    subject,
    body,
  });

  // Update report status to 'sent'
  await base44.asServiceRole.entities.Report.update(reportId, { status: 'sent', staff_email: staffEmail });

  return Response.json({ success: true });
});