const RESEND_API_URL = 'https://api.resend.com/emails';
const FROM_EMAIL = 'Secure Business AI <website@securebusinessai.com.au>';
const DESTINATION_EMAIL = 'info@securebusinessai.com.au';

function sendEmail(apiKey, payload) {
  return fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const { name, email, business, service, message, company_website } = body;

  if (company_website) {
    return res.status(200).json({ ok: true });
  }

  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanBusiness = String(business || '').trim();
  const cleanService = String(service || '').trim();
  const cleanMessage = String(message || '').trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!cleanName || !cleanEmail || !cleanService || !cleanMessage) {
    return res.status(400).json({ error: 'Please complete all required fields.' });
  }

  if (!emailPattern.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (cleanName.length > 120 || cleanBusiness.length > 160 || cleanService.length > 120 || cleanMessage.length > 5000) {
    return res.status(400).json({ error: 'Your enquiry is too long. Please shorten it slightly and try again.' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Contact form is not configured yet.' });
  }

  const notificationText = [
    `Name: ${cleanName}`,
    `Email: ${cleanEmail}`,
    `Business: ${cleanBusiness || 'Not provided'}`,
    `Interest: ${cleanService}`,
    '',
    'Message:',
    cleanMessage,
  ].join('\n');

  const autoReplyText = [
    `Hi ${cleanName},`,
    '',
    'Thanks for getting in touch. We have received your message and will get back to you within one business day.',
    '',
    'If your enquiry is urgent, reply to this email and we will pick it up.',
    '',
    'Secure Business AI',
  ].join('\n');

  try {
    const [notificationResponse, autoReplyResponse] = await Promise.all([
      sendEmail(process.env.RESEND_API_KEY, {
        from: FROM_EMAIL,
        to: [DESTINATION_EMAIL],
        reply_to: cleanEmail,
        subject: `New Secure Business AI enquiry from ${cleanName}`,
        text: notificationText,
      }),
      sendEmail(process.env.RESEND_API_KEY, {
        from: FROM_EMAIL,
        to: [cleanEmail],
        reply_to: DESTINATION_EMAIL,
        subject: 'Got your message, Secure Business AI',
        text: autoReplyText,
      }),
    ]);

    const notificationData = await notificationResponse.json().catch(() => ({}));
    const autoReplyData = await autoReplyResponse.json().catch(() => ({}));

    if (!notificationResponse.ok) {
      return res.status(500).json({ error: notificationData.message || 'Email send failed.' });
    }

    if (!autoReplyResponse.ok) {
      return res.status(500).json({ error: autoReplyData.message || 'Auto-reply send failed.' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Email send failed.' });
  }
};
