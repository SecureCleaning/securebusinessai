(function () {
  const responses = {
    review:
      'The AI Website Review checks where your site may be losing enquiries, how clearly customers can understand your offer, and where AI can help. It is the best low-risk starting point.',
    guide:
      'The AI Starter Guide is a plain-English PDF for business owners who want to understand AI before booking a call or buying a larger review. It is $47 once checkout is connected.',
    readiness:
      'The AI Readiness Pack prepares website-ready AI support files and business facts content so AI tools can better understand your services, locations, FAQs, and contact pathways. It is a one-time $495 pack.',
    voice:
      'The AI Voice Receptionist answers calls, captures enquiries, qualifies leads, and can route or summarise conversations for your team. It is useful when missed calls or after-hours enquiries cost money.',
    chatbot:
      'Our website chatbot option answers common questions, guides visitors to the right service, and captures leads. For clients, it can be trained on their website, FAQs, documents, service areas, and offer details.',
    price:
      'Current starting points are: AI Starter Guide for $47, AI Readiness Pack for $495, AI Website Review from $297, AI Voice Receptionist from $497 setup plus $247/month, and Website + AI Chatbot from $1,997 plus $97/month.',
    human:
      'The easiest next step is to send an enquiry. Share your website and what you want AI to help with, and we can recommend the right starting point.',
  };

  function createMessage(text, type) {
    const message = document.createElement('div');
    message.className = `chat-message ${type}`;
    message.textContent = text;
    return message;
  }

  function answerFor(input) {
    const text = input.toLowerCase();
    if (text.includes('guide') || text.includes('pdf') || text.includes('starter')) return responses.guide;
    if (text.includes('readiness') || text.includes('llms') || text.includes('schema') || text.includes('ai search')) return responses.readiness;
    if (text.includes('review') || text.includes('audit') || text.includes('website')) return responses.review;
    if (text.includes('voice') || text.includes('phone') || text.includes('call') || text.includes('reception')) return responses.voice;
    if (text.includes('chat') || text.includes('bot')) return responses.chatbot;
    if (text.includes('price') || text.includes('cost') || text.includes('package')) return responses.price;
    if (text.includes('human') || text.includes('contact') || text.includes('help')) return responses.human;
    return 'I can help with AI Website Reviews, website chatbots, AI voice reception, and practical AI rollout. What would you like to improve first?';
  }

  function initMobileNavigation() {
    const nav = document.querySelector('.site-header .nav > nav');
    const headerRow = nav?.parentElement;
    if (!nav || !headerRow || headerRow.querySelector('.nav-toggle')) return;

    const navId = nav.id || 'primary-nav';
    nav.id = navId;
    const toggle = document.createElement('button');
    toggle.className = 'nav-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.setAttribute('aria-controls', navId);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span>';
    headerRow.insertBefore(toggle, nav);

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }

    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('click', (event) => {
      if (!nav.classList.contains('is-open')) return;
      if (!event.target.closest('.site-header .nav')) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 860) setOpen(false);
    });
  }

  function initChatbot() {
    const widget = document.createElement('section');
    widget.className = 'chatbot-widget';
    widget.setAttribute('aria-label', 'Secure Business AI chat assistant');
    widget.innerHTML = `
      <button class="chatbot-toggle" type="button" aria-expanded="false">
        <span>Ask Secure AI</span>
      </button>
      <div class="chatbot-panel" hidden>
        <div class="chatbot-header">
          <div>
            <strong>Secure Business AI</strong>
            <span>AI assistant</span>
          </div>
          <button class="chatbot-close" type="button" aria-label="Close chat">×</button>
        </div>
        <div class="chatbot-log" aria-live="polite"></div>
        <div class="chatbot-prompts">
          <button type="button" data-prompt="Starter guide">Starter guide</button>
          <button type="button" data-prompt="AI Readiness Pack">AI readiness</button>
          <button type="button" data-prompt="Website review">Website review</button>
          <button type="button" data-prompt="Voice receptionist">Voice receptionist</button>
          <button type="button" data-prompt="Chatbot">Chatbot</button>
        </div>
        <form class="chatbot-form">
          <label>
            <span class="sr-only">Ask a question</span>
            <input name="message" type="text" autocomplete="off" placeholder="Ask what AI could do for your business" />
          </label>
          <button type="submit">Send</button>
        </form>
        <a class="chatbot-contact" href="/contact">Send enquiry</a>
      </div>
    `;

    document.body.appendChild(widget);

    const toggle = widget.querySelector('.chatbot-toggle');
    const panel = widget.querySelector('.chatbot-panel');
    const close = widget.querySelector('.chatbot-close');
    const log = widget.querySelector('.chatbot-log');
    const form = widget.querySelector('.chatbot-form');
    const input = widget.querySelector('input[name="message"]');

    function openPanel() {
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      if (!log.children.length) {
        log.appendChild(createMessage('Hi, I can help you choose between a website review, chatbot, or AI voice receptionist.', 'bot'));
      }
      input.focus();
    }

    function closePanel() {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }

    function send(text) {
      const clean = text.trim();
      if (!clean) return;
      log.appendChild(createMessage(clean, 'user'));
      log.appendChild(createMessage(answerFor(clean), 'bot'));
      log.scrollTop = log.scrollHeight;
      input.value = '';
    }

    toggle.addEventListener('click', () => {
      if (panel.hidden) openPanel();
      else closePanel();
    });
    close.addEventListener('click', closePanel);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      send(input.value);
    });
    widget.querySelectorAll('[data-prompt]').forEach((button) => {
      button.addEventListener('click', () => {
        openPanel();
        send(button.dataset.prompt);
      });
    });
  }

  function enhanceReadinessDetails() {
    const form = document.getElementById('detailsForm');
    if (!form) return;
    document.body.classList.add('readiness-details-page');
    const stateInput = form.elements.addressState;
    if (stateInput && stateInput.tagName === 'INPUT') {
      const select = document.createElement('select');
      select.name = 'addressState';
      select.innerHTML = '<option value="">Select state</option><option>ACT</option><option>NSW</option><option>NT</option><option>QLD</option><option>SA</option><option>TAS</option><option>VIC</option><option>WA</option>';
      select.value = stateInput.value;
      stateInput.replaceWith(select);
    }
    const sections = form.querySelectorAll('.form-section');
    const token = new URLSearchParams(window.location.search).get('token');

    function fillDiscoveredDetails(scan) {
      if (!scan) return;
      const serviceInputs = [...form.querySelectorAll('#servicesList [data-field="Service"]')];
      (scan.services || []).forEach((service) => {
        const input = serviceInputs.find((item) => !item.value.trim());
        if (input) input.value = service;
      });
      const areaRows = [...form.querySelectorAll('.area-row')];
      (scan.serviceAreas || []).forEach((area) => {
        const row = areaRows.find((item) => !item.querySelector('[data-field="Suburb, city, or region"]').value.trim());
        if (!row) return;
        row.querySelector('[data-field="Suburb, city, or region"]').value = area.suburb || '';
        row.querySelector('[data-field="radius"]').value = area.radius || '25 km';
      });
      const contact = scan.contact || {};
      const address = contact.address || {};
      const values = { phone: contact.phone, publicEmail: contact.email, addressLine1: address.line1, addressSuburb: address.suburb, addressState: address.state, addressPostcode: address.postcode, addressCountry: address.country };
      Object.entries(values).forEach(([name, value]) => {
        if (value && form.elements[name] && !form.elements[name].value.trim()) form.elements[name].value = value;
      });
      const pages = scan.pagesScanned?.length;
      const notice = document.getElementById('scanNotice');
      if (notice && pages) notice.textContent = `We checked ${pages} public page${pages === 1 ? '' : 's'} and added any public details we could identify. Please review them before saving.`;
    }

    async function refreshWebsiteFindings() {
      const button = document.getElementById('refreshWebsiteFindings');
      const notice = document.getElementById('scanNotice');
      if (!token) return;
      button.disabled = true;
      button.textContent = 'Checking public pages...';
      notice.textContent = 'Looking through the public pages of your website. This can take a few seconds.';
      try {
        const response = await fetch(`/api/ai-readiness-order?token=${encodeURIComponent(token)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'rescan' }) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'We could not refresh the public website details.');
        fillDiscoveredDetails(data.siteScan);
      } catch (error) {
        notice.textContent = error.message || 'We could not refresh the public website details.';
      } finally {
        button.disabled = false;
        button.textContent = 'Refresh website findings';
      }
    }

    if (sections[0] && !form.querySelector('#refreshWebsiteFindings')) {
      const scanTools = document.createElement('div');
      scanTools.className = 'scan-tools';
      scanTools.innerHTML = '<p id="scanNotice">We can check up to 12 relevant public pages for contact details, services, locations, and common customer information.</p><button id="refreshWebsiteFindings" type="button">Refresh website findings</button>';
      sections[0].before(scanTools);
      scanTools.querySelector('button').addEventListener('click', refreshWebsiteFindings);
    }
    if (sections[1] && !form.querySelector('[name="shipsProducts"]')) {
      const shipping = document.createElement('label');
      shipping.className = 'shipping-choice';
      shipping.innerHTML = '<input type="checkbox" name="shipsProducts" /> Do you sell products online or offer delivery/shipping?';
      sections[1].appendChild(shipping);
    }
    if (sections[3] && !form.querySelector('.extras-grid')) {
      const tips = document.createElement('p');
      tips.textContent = 'Choose any points that help customers understand, compare, and trust your business. All options are optional.';
      const extras = document.createElement('div');
      extras.className = 'extras-grid';
      extras.setAttribute('aria-label', 'Customer options and business standards');
      ['Free quotes or estimates','Online booking or ordering','Flexible contracts or terms','Qualified or experienced team','Licensed or insured','Emergency or after-hours support','Australia-wide service or delivery','Finance or payment plans'].forEach((label) => {
        const item = document.createElement('label');
        item.innerHTML = `<input type="checkbox" value="${label}" /> ${label}`;
        extras.appendChild(item);
      });
      const custom = document.createElement('div');
      custom.className = 'custom-benefits';
      custom.innerHTML = '<p>Anything else customers should know?</p><div class="custom-benefit-list"></div><button type="button" class="add-custom-benefit">Add another point</button>';
      const addCustomBenefit = (value = '') => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'custom-benefit';
        input.placeholder = 'Example: Family-owned business or same-day response';
        input.value = value;
        custom.querySelector('.custom-benefit-list').appendChild(input);
      };
      addCustomBenefit();
      addCustomBenefit();
      custom.querySelector('.add-custom-benefit').addEventListener('click', () => addCustomBenefit());
      sections[3].insertBefore(tips, sections[3].querySelector('label'));
      sections[3].insertBefore(extras, sections[3].querySelector('label'));
      sections[3].insertBefore(custom, sections[3].querySelector('label'));
    }
    form.addEventListener('submit', () => {
      const selections = [...form.querySelectorAll('.extras-grid input:checked')].map((input) => input.value);
      const customBenefits = [...form.querySelectorAll('.custom-benefit')].map((input) => input.value.trim()).filter(Boolean);
      const shipping = form.elements.shipsProducts?.checked ? 'Online products, delivery, or shipping available' : '';
      const points = [shipping, ...selections, ...customBenefits].filter(Boolean);
      if (points.length) {
        const notes = form.elements.notes;
        const marker = 'Customer options and trust points:';
        const generated = `${marker}\n${points.map((point) => `- ${point}`).join('\n')}`;
        if (notes) {
          const markerIndex = notes.value.indexOf(marker);
          notes.value = markerIndex === -1 ? `${notes.value.trim()}${notes.value.trim() ? '\n\n' : ''}${generated}` : `${notes.value.slice(0, markerIndex).trim()}${notes.value.slice(0, markerIndex).trim() ? '\n\n' : ''}${generated}`;
        }
      }
    }, true);
    if (token) {
      window.setTimeout(async () => {
        try {
          const response = await fetch(`/api/ai-readiness-order?token=${encodeURIComponent(token)}`);
          const data = await response.json().catch(() => ({}));
          if (response.ok) fillDiscoveredDetails(data.order?.site_scan);
        } catch (_error) {}
      }, 600);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initMobileNavigation(); initChatbot(); enhanceReadinessDetails(); });
  } else {
    initMobileNavigation();
    initChatbot();
    enhanceReadinessDetails();
  }
})();
