// Shared Starter Guide delivery email: the branded message plus the PDF
// attachment. Used by the Stripe webhook (real purchase) and the admin
// "send sample" action, so buyers and previews always get the same thing.

const starterGuidePdf = require('./starter-guide-pdf');

const FROM_EMAIL = 'Secure Business AI <website@securebusinessai.com.au>';
const REPLY_TO_EMAIL = 'info@securebusinessai.com.au';

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

function starterGuideEmailHtml(name) {
  const safeName = escapeHtml(name || 'there');
  return `<!doctype html><html><body style="margin:0;background:#f3f7fb;font-family:Arial,Helvetica,sans-serif;color:#14253d"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden"><tr><td style="padding:28px 36px;background:#0b4c5c"><img src="https://securebusinessai.com.au/assets/secure-business-ai-horizontal.png" width="230" alt="Secure Business AI" style="display:block;max-width:230px;height:auto" /></td></tr><tr><td style="padding:36px"><p style="margin:0 0 12px;font-size:13px;font-weight:bold;letter-spacing:1px;color:#2f74ff">AI STARTER GUIDE</p><h1 style="margin:0 0 18px;font-size:28px;line-height:1.2;color:#14253d">Your guide is attached.</h1><p style="margin:0 0 16px;font-size:16px;line-height:1.6">Hi ${safeName},</p><p style="margin:0 0 16px;font-size:16px;line-height:1.6">Thank you for your purchase. Your <strong>AI Starter Guide</strong> is attached to this email as a PDF, ready to read on any device.</p><p style="margin:0 0 20px;font-size:16px;line-height:1.6">A good way to use it: read it once end to end, then use the Opportunity Map and Self-Assessment Checklist near the back to turn it into a shortlist of practical next steps for your business.</p><p style="margin:0 0 24px;font-size:16px;line-height:1.6">When you are ready to act on what you find, you can explore our services any time at <a href="https://securebusinessai.com.au/services" style="color:#2f74ff;text-decoration:none;font-weight:bold">securebusinessai.com.au</a>.</p><p style="margin:0;font-size:14px;line-height:1.6;color:#516277">If the attachment does not open, reply to this email and we will send it another way.</p></td></tr><tr><td style="padding:20px 36px;background:#eef4f7;font-size:13px;line-height:1.5;color:#516277">Secure Business AI<br />Practical, secure AI support for Australian small businesses.</td></tr></table></td></tr></table></body></html>`;
}

function starterGuideEmailText(name) {
  return `Hi ${name || 'there'},\n\nThank you for your purchase. Your AI Starter Guide is attached to this email as a PDF.\n\nA good way to use it: read it once end to end, then use the Opportunity Map and Self-Assessment Checklist near the back to turn it into a shortlist of practical next steps for your business.\n\nWhen you are ready to act on what you find, you can explore our services any time at https://securebusinessai.com.au/services.\n\nIf the attachment does not open, reply to this email and we will send it another way.\n\nSecure Business AI\nhttps://securebusinessai.com.au`;
}

// Build the full Resend payload for a Starter Guide delivery to one recipient.
function buildStarterGuideEmail(toEmail, name) {
  return {
    from: FROM_EMAIL,
    to: [toEmail],
    reply_to: REPLY_TO_EMAIL,
    subject: 'Your AI Starter Guide (PDF attached)',
    text: starterGuideEmailText(name),
    html: starterGuideEmailHtml(name),
    attachments: [{ filename: starterGuidePdf.filename, content: starterGuidePdf.base64 }],
  };
}

async function sendResendEmail(payload) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

module.exports = {
  FROM_EMAIL,
  REPLY_TO_EMAIL,
  escapeHtml,
  starterGuideEmailHtml,
  starterGuideEmailText,
  buildStarterGuideEmail,
  sendResendEmail,
};
