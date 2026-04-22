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

  if (!name || !email || !service || !message) {
    return res.status(400).json({ error: 'Please complete all required fields.' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: 'Contact form is not configured yet.' });
  }

  const emailText = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Business: ${business || 'Not provided'}`,
    `Interest: ${service}`,
    '',
    'Message:',
    message,
  ].join('\n');

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Secure Business AI <website@securebusinessai.com.au>',
        to: ['info@securebusinessai.com.au'],
        reply_to: email,
        subject: `New Secure Business AI enquiry from ${name}`,
        text: emailText,
      }),
    });

    const resendData = await resendResponse.json().catch(() => ({}));

    if (!resendResponse.ok) {
      return res.status(500).json({ error: resendData.message || 'Email send failed.' });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Email send failed.' });
  }
};
