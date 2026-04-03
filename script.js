/* =========================================================
   RESIDENCES EXTENDED STAY — Global JavaScript
   ========================================================= */

const siteConfig = window.SITE_CONFIG || {};
const hubspotConfig = siteConfig.hubspot || {};
const calendlyConfig = siteConfig.calendly || {};

function loadScript(src, attrs = {}) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    Object.entries(attrs).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });
    script.addEventListener('load', () => {
      script.dataset.loaded = 'true';
      resolve();
    }, { once: true });
    script.addEventListener('error', reject, { once: true });
    document.head.appendChild(script);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getLeadContext() {
  const params = new URLSearchParams(window.location.search);
  const data = {};

  params.forEach((value, key) => {
    const trimmed = value.trim();
    if (trimmed) data[key] = trimmed;
  });

  return data;
}

function buildContactUrl(form) {
  const nextUrl = new URL('contact.html', window.location.href);
  const fields = new FormData(form);

  fields.forEach((value, key) => {
    const normalized = String(value).trim();
    if (normalized) nextUrl.searchParams.set(key, normalized);
  });

  nextUrl.searchParams.set('source_page', window.location.pathname.split('/').pop() || 'index.html');

  const locationHeading = document.querySelector('h1');
  if (locationHeading) {
    nextUrl.searchParams.set('page_title', locationHeading.textContent.replace(/\s+/g, ' ').trim());
  }

  return nextUrl.toString();
}

function renderSetupNotice(element, title, body) {
  element.innerHTML = `
    <div class="integration-empty">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(body)}</p>
    </div>
  `;
}

function setFieldValue(scope, selectors, value) {
  const selectorList = Array.isArray(selectors) ? selectors : [selectors];
  for (const selector of selectorList) {
    const field = scope.querySelector(selector);
    if (!field) continue;
    field.value = value;
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  return false;
}

function prefillHubSpotForm(formRoot, context) {
  if (!formRoot || !Object.keys(context).length) return;

  const fullName = context.name || '';
  const [firstName, ...rest] = fullName.split(' ').filter(Boolean);
  const lastName = rest.join(' ');

  if (firstName) {
    setFieldValue(formRoot, [
      'input[name="firstname"]',
      'input[name="first_name"]'
    ], firstName);
  }

  if (lastName) {
    setFieldValue(formRoot, [
      'input[name="lastname"]',
      'input[name="last_name"]'
    ], lastName);
  }

  const fieldMap = [
    { value: context.email, selectors: ['input[name="email"]'] },
    { value: context.phone, selectors: ['input[name="phone"]'] },
    { value: context.company, selectors: ['input[name="company"]'] },
    { value: context.location, selectors: ['select[name="location"]', 'input[name="location"]', 'input[name="location_preference"]'] },
    { value: context.reason, selectors: ['select[name="reason"]', 'input[name="reason"]', 'textarea[name="reason"]'] },
    { value: context.duration, selectors: ['select[name="duration"]', 'input[name="duration"]', 'input[name="length_of_stay"]'] },
    { value: context.checkin, selectors: ['input[name="checkin"]', 'input[name="check_in"]'] },
    { value: context.message, selectors: ['textarea[name="message"]'] }
  ];

  fieldMap.forEach(({ value, selectors }) => {
    if (value) setFieldValue(formRoot, selectors, value);
  });
}

function renderContactContext() {
  const shell = document.querySelector('[data-contact-context]');
  const summary = document.getElementById('contact-context-summary');
  if (!shell || !summary) return;

  const context = getLeadContext();
  const entries = [
    ['Name', context.name],
    ['Email', context.email],
    ['Phone', context.phone],
    ['Location', context.location],
    ['Check-In', context.checkin],
    ['Stay Length', context.duration],
    ['Reason', context.reason],
    ['Company', context.company],
    ['Source Page', context.source_page]
  ].filter(([, value]) => value);

  if (!entries.length) return;

  summary.innerHTML = entries.map(([label, value]) => `
    <div class="contact-context-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `).join('');
}

function initStayPlanner() {
  const range = document.querySelector('[data-stay-range]');
  if (!range) return;

  const valueEl = document.querySelector('[data-stay-value]');
  const badgeEl = document.querySelector('[data-stay-badge]');
  const headlineEl = document.querySelector('[data-stay-headline]');
  const copyEl = document.querySelector('[data-stay-copy]');
  const ctaEl = document.querySelector('[data-stay-cta]');
  const secondaryEl = document.querySelector('[data-stay-secondary]');

  const render = () => {
    const nights = Number(range.value);
    if (valueEl) valueEl.textContent = `${nights} ${nights === 1 ? 'night' : 'nights'}`;

    if (nights <= 6) {
      if (badgeEl) badgeEl.textContent = 'Short stay';
      if (headlineEl) headlineEl.textContent = 'Come see the product before you commit longer';
      if (copyEl) copyEl.textContent = 'For shorter stays, the site should sell ease, comfort, and the quality of the suite itself. Use a tour or trial stay to get people in the funnel.';
      if (ctaEl) ctaEl.textContent = 'Book a night →';
      if (secondaryEl) secondaryEl.textContent = 'Book a tour';
      return;
    }

    if (nights <= 29) {
      if (badgeEl) badgeEl.textContent = 'Flex stay';
      if (headlineEl) headlineEl.textContent = 'A better fit than a normal hotel when the stay starts stretching';
      if (copyEl) copyEl.textContent = 'At this stage, you sell the transition away from nightly-hotel logic: more space, a kitchen, laundry, and less friction for a multi-week stay.';
      if (ctaEl) ctaEl.textContent = 'Book a tour →';
      if (secondaryEl) secondaryEl.textContent = 'Request a quote';
      return;
    }

    if (badgeEl) badgeEl.textContent = 'Monthly stay';
    if (headlineEl) headlineEl.textContent = 'Built for the way long stays actually work';
    if (copyEl) copyEl.textContent = 'For 30+ day stays, the full value story becomes clear: full kitchens, in-unit laundry, parking, and a far more livable setup than a normal hotel room.';
    if (ctaEl) ctaEl.textContent = 'Book a month →';
    if (secondaryEl) secondaryEl.textContent = 'Talk to our team';
  };

  range.addEventListener('input', render);
  render();
}

async function initHubSpotForm() {
  const container = document.querySelector('[data-hubspot-form]');
  if (!container) return;

  if (!hubspotConfig.portalId || !hubspotConfig.formId) {
    renderSetupNotice(
      container,
      'HubSpot form not configured yet',
      'Add your HubSpot portalId, formId, and region in site-config.js to render the live inquiry form here.'
    );
    return;
  }

  try {
    await loadScript(`https://js.hs-scripts.com/${hubspotConfig.portalId}.js`, { async: '', defer: '' });
    await loadScript('https://js.hsforms.net/forms/embed/v2.js', { charset: 'utf-8', type: 'text/javascript' });

    if (!window.hbspt || !window.hbspt.forms || !window.hbspt.forms.create) {
      throw new Error('HubSpot embed unavailable');
    }

    window.hbspt.forms.create({
      region: hubspotConfig.region || 'na1',
      portalId: hubspotConfig.portalId,
      formId: hubspotConfig.formId,
      target: '#hubspot-form',
      onFormReady: formRoot => prefillHubSpotForm(formRoot, getLeadContext())
    });
  } catch (error) {
    renderSetupNotice(
      container,
      'HubSpot form failed to load',
      'Check the HubSpot IDs in site-config.js and confirm this domain is trusted in HubSpot.'
    );
  }
}

async function initCalendlyEmbed() {
  const container = document.querySelector('[data-calendly-embed]');
  if (!container) return;

  if (!calendlyConfig.url) {
    renderSetupNotice(
      container,
      'Calendly link not configured yet',
      'Add your Calendly scheduling URL in site-config.js to render the booking widget here.'
    );
    return;
  }

  try {
    await loadScript('https://assets.calendly.com/assets/external/widget.js', { type: 'text/javascript', async: '' });

    if (!window.Calendly || !window.Calendly.initInlineWidget) {
      throw new Error('Calendly embed unavailable');
    }

    container.innerHTML = '';
    window.Calendly.initInlineWidget({
      url: calendlyConfig.url,
      parentElement: container
    });
  } catch (error) {
    renderSetupNotice(
      container,
      'Calendly widget failed to load',
      'Check the Calendly URL in site-config.js and make sure the event type or routing page is still active.'
    );
  }
}

// ── Mobile Nav Toggle
const navToggle = document.querySelector('.nav-toggle');
const mobileMenu = document.querySelector('.nav-mobile-menu');
if (navToggle && mobileMenu) {
  navToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    const isOpen = mobileMenu.classList.contains('open');
    navToggle.querySelectorAll('span')[0].style.transform = isOpen ? 'rotate(45deg) translate(5px, 5px)' : '';
    navToggle.querySelectorAll('span')[1].style.opacity  = isOpen ? '0' : '1';
    navToggle.querySelectorAll('span')[2].style.transform = isOpen ? 'rotate(-45deg) translate(5px, -5px)' : '';
  });
}

// ── FAQ Accordion
document.querySelectorAll('.faq-question').forEach(q => {
  q.addEventListener('click', () => {
    const item = q.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// ── Inquiry Form Submission
const forms = document.querySelectorAll('.inquiry-form');
forms.forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    if (btn) {
      btn.textContent = 'Continuing…';
      btn.disabled = true;
    }
    window.location.href = buildContactUrl(form);
  });
});

// ── Sticky Nav shadow on scroll
const nav = document.querySelector('.nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 20 ? '0 4px 30px rgba(0,0,0,.25)' : '';
  });
}

// ── Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const navH = nav ? nav.offsetHeight : 72;
      window.scrollTo({ top: target.offsetTop - navH - 16, behavior: 'smooth' });
      if (mobileMenu) mobileMenu.classList.remove('open');
    }
  });
});

// ── Simple number counter animation
const counters = document.querySelectorAll('[data-count]');
const countObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      let start = 0;
      const step = target / 50;
      const timer = setInterval(() => {
        start = Math.min(start + step, target);
        el.textContent = prefix + Math.floor(start).toLocaleString() + suffix;
        if (start >= target) clearInterval(timer);
      }, 28);
      countObs.unobserve(el);
    }
  });
}, { threshold: 0.5 });
counters.forEach(c => countObs.observe(c));

renderContactContext();
initHubSpotForm();
initCalendlyEmbed();
initStayPlanner();
