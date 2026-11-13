'use strict';
(() => {
  const id = window.portfolioAnalyticsConfig?.measurementId || '';
  // Missing configuration and local previews must not generate analytics traffic.
  if (!/^G-[A-Z0-9]+$/.test(id) || location.protocol !== 'https:') return;
  if (['localhost', '127.0.0.1', '::1'].includes(location.hostname)) return;

  const key = 'portfolio-analytics-consent-v1';
  const banner = document.querySelector('#analytics-consent');
  const settings = document.querySelector('#analytics-settings');
  let consent = null, started = false;
  try { consent = localStorage.getItem(key); } catch { /* Ask again when storage is blocked. */ }
  window.dataLayer = window.dataLayer || [];
  function tag() { window.dataLayer.push(arguments); }
  function start() {
    if (started) return;
    started = true;
    const loader = document.createElement('script');
    loader.async = true;
    loader.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.append(loader);
    tag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    tag('js', new Date());
    tag('config', id, {
      send_page_view: true,
      // Avoid collecting form content or URL query parameters through automatic events.
      page_location: location.origin + location.pathname,
      page_referrer: '',
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  }
  function choose(value) {
    consent = value;
    try { localStorage.setItem(key, value); } catch { /* Consent remains valid for this page only. */ }
    banner.hidden = true;
    window[`ga-disable-${id}`] = value !== 'granted';
    if (value === 'granted') {
      if (started) tag('consent', 'update', { analytics_storage: 'granted' });
      else start();
    } else if (started) {
      tag('consent', 'update', { analytics_storage: 'denied' });
    }
    settings.focus({ preventScroll: true });
  }
  function track(name, params) {
    if (consent === 'granted' && started) tag('event', name, { ...params, transport_type: 'beacon' });
  }
  function audience(address) {
    return address === 'sathishveerapathiran27@gmail.com' ? 'hiring' : 'business';
  }
  settings.hidden = false;
  settings.addEventListener('click', () => { banner.hidden = false; document.querySelector('#analytics-accept').focus(); });
  document.querySelector('#analytics-accept').addEventListener('click', () => choose('granted'));
  document.querySelector('#analytics-decline').addEventListener('click', () => choose('denied'));
  if (consent === 'granted') start();
  else if (consent !== 'denied') banner.hidden = false;

  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (link.classList.contains('resume-download')) {
      track('resume_download_click', { placement: 'hero' });
    } else if (href.startsWith('mailto:')) {
      const recipient = audience(href.slice(7).split('?')[0]);
      track('email_click', { audience: recipient, placement: link.closest('#resume-dialog') ? 'resume_dialog' : 'contact' });
    } else if (link.dataset.contact === 'whatsapp' || link.dataset.contact === 'linkedin') {
      track('contact_click', { channel: link.dataset.contact });
    }
  });
  document.querySelector('#contact-form').addEventListener('submit', event => {
    const form = event.currentTarget;
    if (!form.checkValidity()) return;
    const fields = new FormData(form);
    if (!String(fields.get('name') || '').trim() || String(fields.get('message') || '').trim().length < 20) return;
    const purpose = fields.get('purpose');
    // Count a valid draft request, never a submitted/received email.
    track('contact_draft_request', { audience: purpose === 'Hiring opportunity' ? 'hiring' : 'business' });
  });
})();
