// AI Readiness Pack generator.
// Pure function: given a stored order (public site_scan + customer-confirmed
// intake), assemble the deliverable content — a business summary, an llms.txt
// file, a LocalBusiness schema.json (JSON-LD), and a plain-language install
// guide. Used by both the delivery automation and the example renderer.
//
// It never invents pricing, availability, licences, or guarantees; it only
// organises what the customer confirmed or what appears on the public site.

function firstNonEmpty(...values) {
  for (const v of values) {
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

function uniqueList(arr) {
  return [...new Set((arr || []).map((s) => String(s || '').trim()).filter(Boolean))];
}

function buildPack(order) {
  const scan = (order && order.site_scan) || {};
  const intake = (order && order.intake) || {};
  const scanContact = scan.contact || {};
  const intakeContact = intake.contact || {};
  const address = Object.assign({}, scanContact.address || {}, intakeContact.address || {});

  const business = {
    name: firstNonEmpty(order && order.business_name, scan.pageTitle) || 'Your business',
    url: firstNonEmpty(order && order.website_url),
    phone: firstNonEmpty(intakeContact.phone, scanContact.phone),
    email: firstNonEmpty(intakeContact.email, scanContact.email),
    address: {
      line1: firstNonEmpty(address.line1),
      suburb: firstNonEmpty(address.suburb),
      state: firstNonEmpty(address.state),
      postcode: firstNonEmpty(address.postcode),
      country: firstNonEmpty(address.country, 'Australia'),
    },
  };

  const services = uniqueList(
    (intake.services && intake.services.length ? intake.services : scan.services) || []
  );
  const areas = ((intake.serviceAreas && intake.serviceAreas.length ? intake.serviceAreas : scan.serviceAreas) || [])
    .map((a) => (typeof a === 'string' ? { suburb: a } : a))
    .filter((a) => a && a.suburb);
  const pages = uniqueList((scan.pagesScanned || []).map((p) => p && p.url).filter(Boolean));
  const faqs = firstNonEmpty(intake.faqs);
  const notes = firstNonEmpty(intake.notes);

  const addressLine = [
    business.address.line1, business.address.suburb, business.address.state,
    business.address.postcode, business.address.country,
  ].filter(Boolean).join(', ');

  // ---- llms.txt -------------------------------------------------------------
  const L = [];
  L.push('# ' + business.name);
  L.push('');
  L.push(firstNonEmpty(scan.description) ||
    (business.name + ' is an Australian business. This file summarises its public business information for AI systems and automated tools.'));
  L.push('');
  L.push('## Key Pages');
  L.push('');
  if (business.url) L.push('- Home: ' + business.url);
  pages.filter((u) => u !== business.url).slice(0, 6).forEach((u) => L.push('- ' + u));
  L.push('');
  L.push('## Contact');
  L.push('');
  L.push('- Business name: ' + business.name);
  if (business.phone) L.push('- Phone: ' + business.phone);
  if (business.email) L.push('- Email: ' + business.email);
  if (addressLine) L.push('- Address: ' + addressLine);
  L.push('');
  L.push('## Services');
  L.push('');
  if (services.length) services.forEach((s) => L.push('- ' + s));
  else L.push('- (Add your main services)');
  if (areas.length) {
    L.push('');
    L.push('## Service Areas');
    L.push('');
    areas.forEach((a) => L.push('- ' + a.suburb + (a.radius ? ' (within ' + a.radius + ')' : '')));
  }
  L.push('');
  L.push('## Information Notes');
  L.push('');
  L.push('- Use the public contact details above for customer enquiries.');
  L.push('- Do not infer pricing, availability, licences, guarantees, or booking terms unless they are confirmed on the public website or directly by the business.');
  const llmsTxt = L.join('\n') + '\n';

  // ---- schema.json (JSON-LD) -----------------------------------------------
  const schema = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'ProfessionalService'],
    name: business.name,
  };
  if (business.url) schema.url = business.url;
  if (business.phone) schema.telephone = business.phone;
  if (business.email) schema.email = business.email;
  if (business.address.line1 || business.address.suburb) {
    schema.address = {
      '@type': 'PostalAddress',
      streetAddress: business.address.line1,
      addressLocality: business.address.suburb,
      addressRegion: business.address.state,
      postalCode: business.address.postcode,
      addressCountry: 'AU',
    };
  }
  if (services.length) {
    schema.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: business.name + ' Services',
      itemListElement: services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s } })),
    };
  }

  // ---- install guide --------------------------------------------------------
  const host = business.url ? business.url.replace(/\/+$/, '') : 'https://your-website';
  const installGuideMd = [
    '# ' + business.name + ' — llms.txt Installation Guide',
    '',
    '## What this file does',
    '',
    '`llms.txt` is a small plain-text summary of the public business information that matters most: the business name, contact pathway, services, and key pages. It gives AI systems and other automated tools a clearer starting point when they read the public website. It does not guarantee search rankings, AI citations, or leads, and it should be kept accurate whenever the business details or services change.',
    '',
    '## File to install',
    '',
    'Install the included `llms.txt` at this exact public address:',
    '',
    '```',
    host + '/llms.txt',
    '```',
    '',
    'It must sit in the website\'s top-level public folder (the document root), alongside the homepage files — not inside an images, documents, or subfolder directory.',
    '',
    '## Optional companion: schema.json',
    '',
    'The pack also includes `schema.json`, a structured business-information draft. It is not uploaded as a public file. Your web person should review it and add its contents as JSON-LD inside a single `<script type="application/ld+json">` tag on the home page, first checking whether the site already has LocalBusiness or organisation schema so details are merged, not duplicated.',
    '',
    '## Steps for the web person',
    '',
    '1. Upload the supplied `llms.txt` to the public web root for the website without renaming it.',
    '2. Confirm that visiting `' + host + '/llms.txt` opens the file as plain text.',
    '3. Confirm the visible contents include the business phone, email, address, and current service list.',
    '4. Do not replace the existing `robots.txt` or alter the website navigation as part of this installation.',
    '5. If installing the optional schema, add the reviewed `schema.json` contents as JSON-LD on the home page and test the page after publishing.',
    '',
    '## When to update it',
    '',
    'Update the file whenever the business name, phone, email, address, services, or main page URLs change.',
    '',
  ].join('\n');

  return { business, services, areas, faqs, notes, llmsTxt, schema, installGuideMd };
}

module.exports = { buildPack };
