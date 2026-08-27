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

function clean(value) {
  return String(value || '').trim();
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = parseBody(req.body);
  const { name, email, business, website, services, locations, contactDetails, faqs, notes, company_website } = body;

  if (company_website) {
    return res.status(200).json({ ok: true });
  }

  const cleanName = clean(name);
  const cleanEmail = clean(email).toLowerCase();
  const cleanBusiness = clean(business);
  const cleanWebsite = clean(website);
  const cleanServices = clean(services);
  const cleanLocations = clean(locations);
  const cleanContactDetails = clean(contactDetails);
  const cleanFaqs = clean(faqs);
  const cleanNotes = clean(notes);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  let parsedWebsite;
  try {
    parsedWebsite = new URL(cleanWebsite);
  } catch (_error) {
    parsedWebsite = null;
  }

  if (!cleanName || !cleanEmail || !cleanBusiness || !cleanWebsite || !cleanServices || !cleanLocations || !cleanContactDetails) {
    return res.status(400).json({ error: 'Please complete all required fields.' });
  }

  if (!emailPattern.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (!parsedWebsite || !['http:', 'https:'].includes(parsedWebsite.protocol)) {
    return res.status(400).json({ error: 'Please enter a valid website URL.' });
  }

  if (
    cleanName.length > 120 || cleanBusiness.length > 160 || cleanWebsite.length > 300 ||
    cleanServices.length > 5000 || cleanLocations.length > 2000 || cleanContactDetails.length > 2000 ||
    cleanFaqs.length > 5000 || cleanNotes.length > 5000
  ) {
    return res.status(400).json({ error: 'Your intake is too long. Please shorten it slightly and try again.' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'AI Readiness intake is not configured yet.' });
  }

  const intakeText = [
    'New AI Readiness Pack intake - $495',
    '',
    `Name: ${cleanName}`,
    `Email: ${cleanEmail}`,
    `Business: ${cleanBusiness}`,
    `Website: ${parsedWebsite.href}`,
    '',
    'Main services:',
    cleanServices,
    '',
    'Service areas:',
    cleanLocations,
    '',
    'Public contact details:',
    cleanContactDetails,
    '',
    'Frequently asked questions:',
    cleanFaqs || 'Not provided',
    '',
    'Additional notes:',
    cleanNotes || 'Not provided',
    '',
    'Internal delivery checklist:',
    '1. Check public pages and confirm business facts.',
    '2. Draft llms.txt, business facts copy, schema support, robots additions, and install notes.',
    '3. Send the editable draft to the customer for review.',
    '4. Finalise the handover pack after customer approval.',
  ].join('\n');

  const customerText = [
    `Hi ${cleanName},`,
    '',
    'Thanks for submitting your AI Readiness Pack details.',
    '',
    'We have received your information and will prepare the editable draft pack. We may reply if anything on your website needs clarification. Please do not send passwords or website login details by email.',
    '',
    'Secure Business AI',
  ].join('\n');

  try {
    const [notificationResponse, customerResponse] = await Promise.all([
      sendEmail(process.env.RESEND_API_KEY, {
        from: FROM_EMAIL,
        to: [DESTINATION_EMAIL],
        reply_to: cleanEmail,
        subject: `AI Readiness Pack intake: ${cleanBusiness}`,
        text: intakeText,
      }),
      sendEmail(process.env.RESEND_API_KEY, {
        from: FROM_EMAIL,
        to: [cleanEmail],
        reply_to: DESTINATION_EMAIL,
        subject: 'We received your AI Readiness Pack details',
        text: customerText,
      }),
    ]);

    const notificationData = await notificationResponse.json().catch(() => ({}));
    const customerData = await customerResponse.json().catch(() => ({}));

    if (!notificationResponse.ok) {
      return res.status(500).json({ error: notificationData.message || 'AI Readiness intake email failed.' });
    }

    if (!customerResponse.ok) {
      return res.status(500).json({ error: customerData.message || 'Customer confirmation email failed.' });
    }

    return res.status(200).json({ ok: true });
  } catch (_error) {
    return res.status(500).json({ error: 'AI Readiness intake email failed.' });
  }
};
