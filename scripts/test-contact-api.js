const assert = require('node:assert/strict');

const contactHandler = require('../api/contact');
const reviewCheckoutHandler = require('../api/review-checkout');
const reviewIntakeHandler = require('../api/review-intake');
const starterGuideCheckoutHandler = require('../api/starter-guide-checkout');
const aiReadinessCheckoutHandler = require('../api/ai-readiness-checkout');
const aiReadinessIntakeHandler = require('../api/ai-readiness-intake');

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    payload: undefined,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
    redirect(code, url) {
      this.statusCode = code;
      this.headers.Location = url;
      return this;
    },
  };
}

async function invoke(handler, { method = 'POST', body = {}, apiKey = 'test-key', fetchImpl } = {}) {
  const previousKey = process.env.RESEND_API_KEY;
  const previousFetch = global.fetch;

  if (apiKey === null) {
    delete process.env.RESEND_API_KEY;
  } else {
    process.env.RESEND_API_KEY = apiKey;
  }

  global.fetch = fetchImpl || (async () => ({
    ok: true,
    json: async () => ({ id: 'email_test' }),
  }));

  const response = createResponse();
  await handler({ method, body }, response);

  if (previousKey === undefined) {
    delete process.env.RESEND_API_KEY;
  } else {
    process.env.RESEND_API_KEY = previousKey;
  }
  global.fetch = previousFetch;

  return response;
}

async function run() {
  let response = await invoke(contactHandler, { method: 'GET' });
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, 'POST');

  response = await invoke(contactHandler, { body: { company_website: 'https://spam.example' } });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload, { ok: true });

  response = await invoke(contactHandler, { body: { name: 'A', email: 'bad', service: 'AI Website Review', message: 'Hello' } });
  assert.equal(response.statusCode, 400);

  response = await invoke(contactHandler, {
    apiKey: null,
    body: { name: 'Lyle', email: 'lyle@example.com', service: 'AI Website Review', message: 'Please review my site.' },
  });
  assert.equal(response.statusCode, 500);
  assert.match(response.payload.error, /not configured/i);

  const sentPayloads = [];
  response = await invoke(contactHandler, {
    body: { name: 'Lyle', email: 'lyle@example.com', business: 'Secure', service: 'AI Website Review', message: 'Please review my site.' },
    fetchImpl: async (_url, options) => {
      sentPayloads.push(JSON.parse(options.body));
      return { ok: true, json: async () => ({ id: `email_${sentPayloads.length}` }) };
    },
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload, { ok: true });
  assert.equal(sentPayloads.length, 2);
  assert.deepEqual(sentPayloads[0].to, ['info@securebusinessai.com.au']);
  assert.deepEqual(sentPayloads[1].to, ['lyle@example.com']);
  assert.equal(sentPayloads[0].reply_to, 'lyle@example.com');

  const previousPaymentLink = process.env.AI_REVIEW_PAYMENT_LINK;
  delete process.env.AI_REVIEW_PAYMENT_LINK;
  response = createResponse();
  await reviewCheckoutHandler({}, response);
  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.Location, '/contact?enquiry=ai-website-review');
  process.env.AI_REVIEW_PAYMENT_LINK = 'https://buy.stripe.com/test';
  response = createResponse();
  await reviewCheckoutHandler({}, response);
  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.Location, 'https://buy.stripe.com/test');
  if (previousPaymentLink === undefined) {
    delete process.env.AI_REVIEW_PAYMENT_LINK;
  } else {
    process.env.AI_REVIEW_PAYMENT_LINK = previousPaymentLink;
  }

  const previousGuidePaymentLink = process.env.AI_STARTER_GUIDE_PAYMENT_LINK;
  delete process.env.AI_STARTER_GUIDE_PAYMENT_LINK;
  response = createResponse();
  await starterGuideCheckoutHandler({}, response);
  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.Location, '/contact?enquiry=ai-starter-guide');
  process.env.AI_STARTER_GUIDE_PAYMENT_LINK = 'https://checkout.example/ai-guide';
  response = createResponse();
  await starterGuideCheckoutHandler({}, response);
  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.Location, 'https://checkout.example/ai-guide');
  if (previousGuidePaymentLink === undefined) {
    delete process.env.AI_STARTER_GUIDE_PAYMENT_LINK;
  } else {
    process.env.AI_STARTER_GUIDE_PAYMENT_LINK = previousGuidePaymentLink;
  }

  const previousStripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const previousReadinessPriceId = process.env.STRIPE_AI_READINESS_PRICE_ID;
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_AI_READINESS_PRICE_ID;
  response = createResponse();
  await aiReadinessCheckoutHandler({}, response);
  assert.equal(response.statusCode, 302);
  assert.equal(response.headers.Location, '/contact');
  process.env.STRIPE_SECRET_KEY = 'sk_test_example';
  process.env.STRIPE_AI_READINESS_PRICE_ID = 'price_example';
  response = createResponse();
  const previousFetch = global.fetch;
  global.fetch = async (_url, options) => {
    assert.match(options.body, /line_items%5B0%5D%5Bprice%5D=price_example/);
    assert.match(options.body, /mode=payment/);
    assert.match(options.body, /allow_promotion_codes=true/);
    assert.match(options.body, /invoice_creation%5Benabled%5D=true/);
    assert.match(options.body, /managed_payments%5Benabled%5D=false/);
    return { ok: true, json: async () => ({ url: 'https://checkout.stripe.com/c/pay/cs_test_example' }) };
  };
  await aiReadinessCheckoutHandler({ method: 'GET' }, response);
  global.fetch = previousFetch;
  assert.equal(response.statusCode, 303);
  assert.equal(response.headers.Location, 'https://checkout.stripe.com/c/pay/cs_test_example');
  if (previousStripeSecretKey === undefined) {
    delete process.env.STRIPE_SECRET_KEY;
  } else {
    process.env.STRIPE_SECRET_KEY = previousStripeSecretKey;
  }
  if (previousReadinessPriceId === undefined) {
    delete process.env.STRIPE_AI_READINESS_PRICE_ID;
  } else {
    process.env.STRIPE_AI_READINESS_PRICE_ID = previousReadinessPriceId;
  }

  response = await invoke(reviewIntakeHandler, { method: 'GET' });
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, 'POST');

  response = await invoke(reviewIntakeHandler, {
    body: { name: 'Lyle', email: 'lyle@example.com', business: 'Secure', website: 'not-a-url', priority: 'More enquiries' },
  });
  assert.equal(response.statusCode, 400);

  const intakePayloads = [];
  response = await invoke(reviewIntakeHandler, {
    body: {
      name: 'Lyle',
      email: 'lyle@example.com',
      business: 'Secure Cleaning',
      website: 'https://securecleaning.com.au',
      priority: 'More enquiries from the website',
      notes: 'Please review conversion and AI options.',
    },
    fetchImpl: async (_url, options) => {
      intakePayloads.push(JSON.parse(options.body));
      return { ok: true, json: async () => ({ id: `email_${intakePayloads.length}` }) };
    },
  });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload, { ok: true });
  assert.equal(intakePayloads.length, 2);
  assert.deepEqual(intakePayloads[0].to, ['info@securebusinessai.com.au']);
  assert.deepEqual(intakePayloads[1].to, ['lyle@example.com']);

  response = await invoke(aiReadinessIntakeHandler, { method: 'GET' });
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, 'POST');

  response = await invoke(aiReadinessIntakeHandler, {
    body: { name: 'Lyle', email: 'lyle@example.com', business: 'Secure', website: 'not-a-url', services: 'Cleaning', locations: 'Melbourne', contactDetails: 'hello@example.com' },
  });
  assert.equal(response.statusCode, 400);

  const readinessPayloads = [];
  response = await invoke(aiReadinessIntakeHandler, {
    body: {
      name: 'Lyle',
      email: 'lyle@example.com',
      business: 'Secure Cleaning',
      website: 'https://securecleaning.com.au',
      services: 'Office and medical cleaning',
      locations: 'Melbourne and Sydney',
      contactDetails: 'info@securecleaning.com.au, Monday to Friday',
      faqs: 'Can I get a quote?',
      notes: 'Mention verified operators.',
    },
    fetchImpl: async (_url, options) => {
      readinessPayloads.push(JSON.parse(options.body));
      return { ok: true, json: async () => ({ id: `email_${readinessPayloads.length}` }) };
    },
  });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.payload, { ok: true });
  assert.equal(readinessPayloads.length, 2);
  assert.deepEqual(readinessPayloads[0].to, ['info@securebusinessai.com.au']);
  assert.deepEqual(readinessPayloads[1].to, ['lyle@example.com']);
  assert.match(readinessPayloads[0].text, /New AI Readiness Pack intake - \$495/);

  console.log('Contact, review, and AI Readiness Pack workflow API tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
