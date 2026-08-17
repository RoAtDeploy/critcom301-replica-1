import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { Resend } from 'npm:resend@4.0.0';
import { getAppUrl } from '../../shared/appUrl.js';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { email, firstName, role } = body;
    if (!email) return Response.json({ error: 'email is required' }, { status: 400 });

    const loginUrl = getAppUrl();
    const displayName = firstName || email.split('@')[0];
    const roleLabel = role === 'admin' ? 'Administrator' : 'Assessor';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You're Invited to CritCom301</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background-color:#1e2235;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#8b9dc3;">CritCom301</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">You're Invited</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:36px 40px;">
              <p style="margin:0 0 20px;font-size:16px;color:#1e2235;">Hi ${displayName},</p>
              <p style="margin:0 0 20px;font-size:15px;color:#4a5568;line-height:1.7;">
                You've been invited to join CritCom301 as a <strong>${roleLabel}</strong>. CritCom301 is a safety-critical communication monitoring platform that helps assessors review and report on call recordings.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" target="_blank"
                       style="display:inline-block;background-color:#4f5fdb;color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
                      Set Up Your Account →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:14px;color:#4a5568;line-height:1.7;">
                Click the button above to set your password and access your account. If you already have an account, you can use this link to log in directly.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f0f2f8;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;border-top:1px solid #e8ecf4;">
              <p style="margin:0;font-size:12px;color:#8b9dc3;line-height:1.6;">
                This email was sent by the <strong>CritCom301 Monitoring Team</strong>.<br/>
                If you weren't expecting this invitation, you can safely ignore this email.
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
      to: email,
      subject: `You're invited to CritCom301`,
      html,
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}