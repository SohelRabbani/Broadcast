import { config } from './config.js';

const main = document.querySelector('main');
const rootStyle = document.documentElement.style;
rootStyle.setProperty('--background', config.primary);
rootStyle.setProperty('--accent', config.secondary);
rootStyle.setProperty('--font', config.font);

const page = location.pathname.replace(/\/$/, '') || '/';
const bookingLink = '<a class="button" href="/booking">Book a session <span aria-hidden="true">↗</span></a>';
const formatPrice = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0
});

function heading(title, description) {
  return '<header class="page-heading slide-right"><h1>' + title + '</h1><p>' + description + '</p></header>';
}

function makeElement(tag, content, className) {
  const element = document.createElement(tag);
  element.textContent = content;
  if (className) element.className = className;
  return element;
}

const pages = {
  '/': {
    title: 'Home',
    content: `
      <div class="hero">
        <div class="hero-copy slide-right">
          <p class="eyebrow"><span></span> Podcast recording studio</p>
          <h1>Good stories.<br><em>Great sound.</em></h1>
          <p class="hero-description">A dedicated studio for recording, filming, and editing your podcast. Bring your idea and we’ll handle the gear.</p>
          <div class="actions">${bookingLink}<a class="button secondary" href="/services">Explore services</a></div>
        </div>
        <figure class="hero-photo">
          <img src="/assets/studio.png" alt="Podcast studio concept with two microphones and magenta lighting">
          <figcaption><span></span> The recording room <small>Studio concept</small></figcaption>
        </figure>
      </div>
      <section class="home-services">
        <div class="section-heading"><h2>Make your next episode</h2><a href="/pricing">View pricing <span aria-hidden="true">↗</span></a></div>
        <div class="grid" data-catalog></div>
      </section>`
  },
  '/services': {
    title: 'Services',
    content: heading('Studio services', 'Record an episode, film a conversation, or send us your audio for editing.') +
      '<div class="grid" data-catalog></div>'
  },
  '/gallery': {
    title: 'Gallery',
    content: heading('Inside the studio', 'A visual concept for the Broadcast Podcast recording space.') + `
      <div class="gallery">
        <figure><img src="/assets/studio.png" alt="Wide view of the recording room concept"><figcaption>Recording room</figcaption></figure>
        <figure><div class="gallery-detail"><img src="/assets/studio.png" alt="Close crop of the microphone and desk in the studio concept"></div><figcaption>Microphone setup</figcaption></figure>
      </div>`
  },
  '/pricing': {
    title: 'Pricing',
    content: heading('Studio pricing', 'Sample rates in Indian rupees for recording and editing.') +
      '<div class="grid" data-catalog></div>'
  },
  '/booking': {
    title: 'Booking',
    content: heading('Book a session', 'Send your preferred date and service. Your request will be pending until the studio confirms it.') + `
      <form class="panel" id="booking-form">
        <label for="name">Full name</label>
        <input id="name" name="name" autocomplete="name" required maxlength="100">
        <label for="phone">Phone number</label>
        <input id="phone" name="phone" type="tel" autocomplete="tel" required maxlength="25">
        <label for="service">Service</label>
        <select id="service" name="service" required><option value="">Choose a service</option></select>
        <label for="date">Preferred date</label>
        <input id="date" name="date" type="date" required>
        <button class="button" disabled>Request booking <span aria-hidden="true">↗</span></button>
        <p class="form-status" role="status"></p>
      </form>`
  },
  '/reviews': {
    title: 'Reviews',
    content: heading('Studio reviews', 'Client reviews will appear here once they’re available.') +
      '<div class="panel"><h2>Planning your first session?</h2><p>See what’s included in each recording and editing service.</p><a class="button secondary" href="/services">Explore services</a></div>'
  },
  '/contact': {
    title: 'Contact',
    content: heading('Contact the studio', 'Send your phone number with a booking request so the studio can follow up about your session.') +
      '<div class="panel"><h2>Session inquiries</h2><p>Choose the service you need and share your preferred recording date.</p>' + bookingLink + '</div>'
  }
};

const current = pages[page];
if (current) {
  document.title = current.title === 'Home' ? config.businessName + ' | ' + config.category : current.title + ' | ' + config.businessName;
  main.className = 'shell ' + (page === '/' ? 'home' : 'interior');
  main.innerHTML = current.content;
  document.querySelector('header a[href="' + page + '"]:not(.brand)')?.setAttribute('aria-current', 'page');
}

async function readCatalog() {
  try {
    const response = await fetch('/api/services');
    if (response.ok) return await response.json();
  } catch {
    // The bundled catalog also supports a static preview.
  }
  const response = await fetch('/services.json');
  if (!response.ok) throw new Error('The service catalog is unavailable.');
  return response.json();
}

function showCatalog(container, services) {
  for (const service of services) {
    const card = makeElement('article', '', 'card');
    card.append(makeElement('h3', service.name));
    if (page === '/pricing') {
      card.append(makeElement('p', formatPrice.format(service.price) + ' / ' + service.unit, 'price'));
    }
    card.append(makeElement('p', service.description));
    if (page !== '/') {
      const features = makeElement('ul', '');
      for (const feature of service.features) features.append(makeElement('li', feature));
      card.append(features);
    }
    const link = makeElement('a', 'Book this service ↗', 'text-link');
    link.href = '/booking?service=' + encodeURIComponent(service.slug);
    card.append(link);
    container.append(card);
  }
}

function setupBooking(form, services) {
  const serviceSelect = form.elements.namedItem('service');
  const dateField = form.elements.namedItem('date');
  const button = form.querySelector('button');
  const status = form.querySelector('[role="status"]');
  const selectedService = new URLSearchParams(location.search).get('service');
  dateField.min = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

  for (const service of services) {
    serviceSelect.add(new Option(service.name, service.slug, false, service.slug === selectedService));
  }
  button.disabled = services.length === 0;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    button.disabled = true;
    status.textContent = 'Sending your request…';
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const result = await response.json();
      if (!response.ok) {
        status.textContent = result.message || 'Your request could not be sent.';
        return;
      }
      form.reset();
      status.textContent = result.message;
    } catch {
      status.textContent = 'Online booking is temporarily unavailable. Please try again later.';
    } finally {
      button.disabled = false;
    }
  });
}

const catalogContainer = document.querySelector('[data-catalog]');
const bookingForm = document.querySelector('#booking-form');
if (catalogContainer || bookingForm) {
  try {
    const services = await readCatalog();
    if (catalogContainer) showCatalog(catalogContainer, services);
    if (bookingForm) setupBooking(bookingForm, services);
  } catch {
    (catalogContainer || bookingForm.querySelector('[role="status"]')).textContent = 'The service catalog is unavailable. Please try again later.';
  }
}


