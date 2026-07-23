import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { Resend } from 'npm:resend@4.0.0';

const GRADE_BG = { A: '#dcfce7', B: '#fef9c3', C: '#ffedd5', D: '#fee2e2' };
const GRADE_FG = { A: '#166534', B: '#854d0e', C: '#9a3412', D: '#991b1b' };

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
}

function aspectsOf(report) {
  const qa = report.quality_assessment;
  const raw = qa?.response ?? qa;
  return raw?.aspects || raw?.rules || [];
}

function fmtDate(d) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return String(d); }
}

function detailRow(label, value) {
  return `<tr><td style="padding:5px 12px 5px 0;font-size:13px;color:#64748b;font-weight:600;white-space:nowrap;vertical-align:top;">${esc(label)}</td><td style="padding:5px 0;font-size:13px;color:#1e293b;vertical-align:top;">${esc(value)}</td></tr>`;
}

function gradeBadge(grade) {
  const bg = GRADE_BG[grade] || '#f1f5f9';
  const fg = GRADE_FG[grade] || '#475569';
  return `<span style="display:inline-block;min-width:28px;text-align:center;font-size:13px;font-weight:700;color:${fg};background:${bg};border-radius:6px;padding:4px 8px;">${esc(grade)}</span>`;
}

function buildReportContent(report) {
  const parts = [];

  parts.push(`<p style="margin:0 0 10px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#8b9dc3;">Call Details</p>`);
  parts.push(`<table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:22px;">`);
  parts.push(detailRow('Staff Member', report.staff_name));
  parts.push(detailRow('Role on Site', report.role));
  parts.push(detailRow('Date of Call', fmtDate(report.call_date)));
  parts.push(detailRow('Call Type', report.call_type));
  parts.push(detailRow('Duration', report.transcription_duration ? `${Math.round(report.transcription_duration)}s` : '—'));
  if (report.other_role) parts.push(detailRow('Conversation With', report.other_role));
  if (report.call_context) parts.push(detailRow('Context', report.call_context));
  parts.push(`</table>`);

  if (report.call_summary) {
    parts.push(`<p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#8b9dc3;">AI Call Summary</p>`);
    parts.push(`<p style="margin:0 0 22px;font-size:14px;color:#475569;line-height:1.6;">${esc(report.call_summary)}</p>`);
  }

  if (report.general_feedback) {
    parts.push(`<p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#8b9dc3;">General Feedback</p>`);
    parts.push(`<p style="margin:0 0 22px;font-size:14px;color:#475569;line-height:1.6;">${esc(report.general_feedback)}</p>`);
  }

  const aspects = aspectsOf(report);
  if (aspects.length > 0) {
    parts.push(`<p style="margin:0 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#8b9dc3;">Communication Assessment</p>`);
    for (const a of aspects) {
      const override = a.override || null;
      const grade = override?.grade || a.grade || '—';
      const name = a.aspect_name || a.name || 'Aspect';
      parts.push(`<table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px;background:#f8f9fc;border:1px solid #e8ecf4;border-radius:8px;"><tr><td style="padding:12px 14px;"><table cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-size:14px;font-weight:600;color:#1e293b;">${esc(name)}</td><td align="right">${gradeBadge(grade)}</td></tr></table></td></tr>`);
      if (a.reasoning) {
        parts.push(`<tr><td style="padding:0 14px 12px;font-size:13px;color:#64748b;line-height:1.55;">${esc(a.reasoning)}</td></tr>`);
      }
      if (override?.justification) {
        parts.push(`<tr><td style="padding:0 14px 12px;font-size:13px;color:#64748b;font-style:italic;line-height:1.55;">Override: ${esc(override.justification)}</td></tr>`);
      }
      parts.push(`</table>`);
    }
  }

  const items = report.action_items || [];
  if (items.length > 0) {
    parts.push(`<p style="margin:18px 0 8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#8b9dc3;">Actions &amp; Feedback</p>`);
    for (const item of items) {
      const grade = item.aspect_grade || '—';
      parts.push(`<table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px;background:#f8f9fc;border:1px solid #e8ecf4;border-radius:8px;"><tr><td style="padding:12px 14px;"><table cellpadding="0" cellspacing="0" width="100%"><tr><td style="font-size:14px;font-weight:600;color:#1e293b;">${esc(item.aspect_name)}</td><td align="right">${gradeBadge(grade)}</td></tr></table></td></tr>`);
      if (item.ai_reasoning && item.include_ai_feedback !== false) {
        parts.push(`<tr><td style="padding:0 14px 8px;font-size:13px;color:#64748b;line-height:1.55;"><strong>AI Feedback:</strong> ${esc(item.ai_reasoning)}</td></tr>`);
      }
      if (item.reviewer_comment) {
        parts.push(`<tr><td style="padding:0 14px 8px;font-size:13px;color:#64748b;line-height:1.55;"><strong>Reviewer comment:</strong> ${esc(item.reviewer_comment)}</td></tr>`);
      }
      if (item.action) {
        parts.push(`<tr><td style="padding:0 14px 8px;font-size:13px;color:#1e293b;line-height:1.55;"><strong>Required action:</strong> ${esc(item.action)}</td></tr>`);
      }
      if (grade === 'C' || grade === 'D') {
        const status = item.completed ? '✓ Confirmed by staff' : '✗ Not yet confirmed by staff';
        parts.push(`<tr><td style="padding:0 14px 12px;font-size:13px;color:#64748b;">${esc(status)}</td></tr>`);
      }
      parts.push(`</table>`);
    }
  }

  return parts.join('');
}

function lineManagerEmail(report) {
  const content = buildReportContent(report);
  const subject = `Communication Monitoring Report – ${report.staff_name || 'Staff Member'}`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Communication Monitoring Report</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background-color:#1e2235;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#8b9dc3;">CritCom301</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Communication Monitoring Report</h1>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:15px;color:#1e2235;">Hello,</p>
              <p style="margin:0 0 20px;font-size:15px;color:#4a5568;line-height:1.7;">
                A communication monitoring report has been completed for <strong>${esc(report.staff_name || 'a staff member')}</strong>${report.call_date ? ` on ${fmtDate(report.call_date)}` : ''}. A copy of the assessment is included below for your records.
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#4a5568;line-height:1.7;">
                This report has been sent to ${esc(report.staff_name || 'the staff member')} for their review and acknowledgement.
              </p>
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background-color:#f0f2f8;border-radius:0 0 12px 12px;padding:20px 40px;text-align:center;border-top:1px solid #e8ecf4;">
              <p style="margin:0;font-size:12px;color:#8b9dc3;line-height:1.6;">
                This email was sent by the <strong>CritCom301 Monitoring Team</strong>.<br/>
                This is a non-interactive copy of the report for your information.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  return { subject, html };
}

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { reportId, staffEmail, staffName, lineManagerEmails } = await req.json();
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

  // Notify line managers with a non-interactive copy of the full report
  const lmEmails = Array.isArray(lineManagerEmails) ? lineManagerEmails.filter(Boolean) : [];
  if (lmEmails.length > 0) {
    const report = await base44.asServiceRole.entities.Report.get(reportId);
    const { subject: lmSubject, html: lmHtml } = lineManagerEmail(report);
    await resend.emails.send({
      from: 'CritCom301 <notifications@critcom301.com>',
      to: lmEmails,
      subject: lmSubject,
      html: lmHtml,
    });
  }

  await base44.asServiceRole.entities.Report.update(reportId, {
    status: 'sent',
    staff_email: staffEmail,
    sent_at: new Date().toISOString(),
  });

  return Response.json({ success: true });
});