import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { Resend } from 'npm:resend@4.0.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { reportId, staffEmail, staffName } = await req.json();
  if (!reportId || !staffEmail) {
    return Response.json({ error: 'reportId and staffEmail are required' }, { status: 400 });
  }

  const appUrl = req.headers.get('origin') || 'https://app.base44.com';
  const reviewUrl = `${appUrl}/staff-review/${reportId}`;
  const firstName = (staffName || 'Team Member').split(' ')[0];

  const subject = `Your Communication Monitoring Report – Action Required`;

  const body = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Communication Monitoring Report</title>
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
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Communication Monitoring Report</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#1e2235;">Hi ${firstName},</p>
              <p style="margin:0 0 20px;font-size:15px;color:#4a5568;line-height:1.7;">
                Your assessor has completed a review of a recent safety-critical communication monitoring session. Your report is now ready for you to view and acknowledge.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td align="center">
                    <a href="${reviewUrl}" target="_blank"
                       style="display:inline-block;background-color:#4f5fdb;color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
                      View Your Report →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What to do -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f9fc;border-radius:10px;border:1px solid #e8ecf4;padding:24px;margin-bottom:24px;">
                <tr>
                  <td style="padding:0 24px;">
                    <p style="margin:0 0 14px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#8b9dc3;">What you need to do</p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      ${[
                        'Review the feedback provided for each aspect of your communication',
                        'For any items graded <strong>C</strong> or <strong>D</strong>, confirm the assigned action and mark it complete',
                        'Add any comments you wish to share with your assessor',
                        'Click <strong>"Confirm &amp; Submit"</strong> when finished'
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
                If you have any questions about the report, please speak to your line manager directly.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f0f2f8;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;border-top:1px solid #e8ecf4;">
              <p style="margin:0;font-size:12px;color:#8b9dc3;line-height:1.6;">
                This email was sent by the <strong>CritCom301 Monitoring Team</strong>.<br/>
                Please do not reply to this email. Contact your line manager with any questions.
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
    to: staffEmail,
    subject,
    html: body,
  });

  await base44.asServiceRole.entities.Report.update(reportId, {
    status: 'sent',
    staff_email: staffEmail,
    sent_at: new Date().toISOString(),
  });

  return Response.json({ success: true });
});