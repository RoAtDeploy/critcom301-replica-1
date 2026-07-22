import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { Resend } from 'npm:resend@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json();
    const { data, old_data, event } = body;

    // Only proceed when status actually changed TO staff_reviewed
    const newStatus = data?.status;
    const oldStatus = old_data?.status;
    if (newStatus !== 'staff_reviewed' || oldStatus === 'staff_reviewed') {
      return Response.json({ skipped: true, reason: 'Status did not change to staff_reviewed' });
    }

    // Fetch full report if payload was stripped (too large)
    let report = data;
    if (!report && event?.entity_id) {
      report = await base44.asServiceRole.entities.Report.get(event.entity_id);
    }
    if (!report) {
      return Response.json({ skipped: true, reason: 'No report data available' });
    }

    // Find the assessor who created / owns this report
    let assessor = null;
    if (report.created_by_id) {
      try {
        assessor = await base44.asServiceRole.entities.User.get(report.created_by_id);
      } catch (_) { /* assessor may have been removed */ }
    }

    if (!assessor?.email) {
      return Response.json({ skipped: true, reason: 'No assessor email found for this report' });
    }

    const appUrl = req.headers.get('origin') || 'https://app.base44.com';
    const reportUrl = `${appUrl}/reports/${report.id}`;
    const assessorName = (assessor.full_name || 'Assessor').split(' ')[0];
    const staffName = report.staff_name || 'a staff member';
    const callDate = report.call_date
      ? new Date(report.call_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;

    const subject = `${staffName} has completed their review – Ready for sign-off`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Assessment Ready for Sign-off</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#1e2235;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#8b9dc3;">CritCom301</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Assessment Ready for Sign-off</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#1e2235;">Hi ${assessorName},</p>
              <p style="margin:0 0 20px;font-size:15px;color:#4a5568;line-height:1.7;">
                <strong>${staffName}</strong> has completed their review of the communication monitoring report${callDate ? ` (call dated ${callDate})` : ''} and it is now ready for your final sign-off.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td align="center">
                    <a href="${reportUrl}" target="_blank"
                       style="display:inline-block;background-color:#4f5fdb;color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
                      Review &amp; Sign Off →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Summary box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fc;border-radius:10px;border:1px solid #e8ecf4;padding:24px;margin-bottom:24px;">
                <tr>
                  <td style="padding:0 24px;">
                    <p style="margin:0 0 14px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#8b9dc3;">Next steps</p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      ${[
                        'Open the report to review the staff member\'s comments and action item responses',
                        'Verify that all C and D graded aspects have agreed actions',
                        'Sign off the report to finalise the assessment cycle'
                      ].map(step => `
                      <tr>
                        <td valign="top" style="padding:5px 0;">
                          <table cellpadding="0" cellspacing="0"><tr>
                            <td style="width:22px;vertical-align:top;padding-top:2px;">
                              <div style="width:8px;height:8px;background-color:#4f5fdb;border-radius:50%;margin-top:5px;"></div>
                            </td>
                            <td style="font-size:14px;color:#4a5568;line-height:1.6;">${step}</td>
                          </tr></table>
                        </td>
                      </tr>`).join('')}
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:14px;color:#4a5568;line-height:1.7;">
                If you did not expect this notification, you can disregard this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f0f2f8;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;border-top:1px solid #e8ecf4;">
              <p style="margin:0;font-size:12px;color:#8b9dc3;line-height:1.6;">
                This email was sent by the <strong>CritCom301 Monitoring Team</strong>.<br/>
                Please do not reply to this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    await resend.emails.send({
      from: 'CritCom301 <notifications@critcom301.com>',
      to: assessor.email,
      subject,
      html,
    });

    return Response.json({ success: true, sentTo: assessor.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});