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

function parseBody(body) {
  if (typeof body !== 'string') return body || {};

  try {
    return JSON.parse(body || '{}');
  } catch (_error) {
    return {};
  }
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = parseBody(req.body);
  const { name, email, business, website, priority, notes, company_website } = body;

  if (company_website) {
    return res.status(200).json({ ok: true });
  }

  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanBusiness = String(business || '').trim();
  const cleanWebsite = String(website || '').trim();
  const cleanPriority = String(priority || '').trim();
  const cleanNotes = String(notes || '').trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let parsedWebsite;
  try {
    parsedWebsite = new URL(cleanWebsite);
  } catch (_error) {
    parsedWebsite = null;
  }

  if (!cleanName || !cleanEmail || !cleanBusiness || !cleanWebsite || !cleanPriority) {
    return res.status(400).json({ error: 'Please complete all required fields.' });
  }

  if (!emailPattern.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (!parsedWebsite || !['http:', 'https:'].includes(parsedWebsite.protocol)) {
    return res.status(400).json({ error: 'Please enter a valid website URL.' });
  }

  if (
    cleanName.length > 120 ||
    cleanBusiness.length > 160 ||
    cleanWebsite.length > 300 ||
    cleanPriority.length > 180 ||
    cleanNotes.length > 5000
  ) {
    return res.status(400).json({ error: 'Your intake is too long. Please shorten it slightly and try again.' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Review intake is not configured yet.' });
  }

  const intakeText = [
    'New AI Website Review intake',
    '',
    `Name: ${cleanName}`,
    `Email: ${cleanEmail}`,
    `Business: ${cleanBusiness}`,
    `Website: ${parsedWebsite.href}`,
    `Priority: ${cleanPriority}`,
    '',
    'Notes:',
    cleanNotes || 'Not provided',
    '',
    'Suggested next internal steps:',
    '1. Run AI-search and website audit checks.',
    '2. Generate the editable report draft.',
    '3. Review recommended Secure Business AI upsell options.',
    '4. Send approved report to the customer.',
  ].join('\n');

  const customerText = [
    `Hi ${cleanName},`,
    '',
    'Thanks for submitting your AI Website Review details.',
    '',
    'We have received your website and priorities, and will prepare your review report. If anything needs clarification, we will reply to this email.',
    '',
    'Secure Business AI',
  ].join('\n');

  try {
    const [notificationResponse, customerResponse] = await Promise.all([
      sendEmail(process.env.RESEND_API_KEY, {
        from: FROM_EMAIL,
        to: [DESTINATION_EMAIL],
        reply_to: cleanEmail,
        subject: `AI Website Review intake: ${cleanBusiness}`,
        text: intakeText,
      }),
      sendEmail(process.env.RESEND_API_KEY, {
        from: FROM_EMAIL,
        to: [cleanEmail],
        reply_to: DESTINATION_EMAIL,
        subject: 'We received your AI Website Review details',
        text: customerText,
      }),
    ]);

    const notificationData = await notificationResponse.json().catch(() => ({}));
    const customerData = await customerResponse.json().catch(() => ({}));

    if (!notificationResponse.ok) {
      return res.status(500).json({ error: notificationData.message || 'Review intake email failed.' });
    }

    if (!customerResponse.ok) {
      return res.status(500).json({ error: customerData.message || 'Customer confirmation email failed.' });
    }

    return res.status(200).json({ ok: true });
  } catch (_error) {
    return res.status(500).json({ error: 'Review intake email failed.' });
  }
};
