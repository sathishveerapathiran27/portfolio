'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('analytics.js', 'utf8');
function setup(id = 'G-TEST1234', stored = null) {
  const elements = {};
  function element() { return { hidden: true, listeners: {}, addEventListener(name, fn) { this.listeners[name] = fn; }, focus() {}, getAttribute() {} }; }
  for (const id of ['analytics-consent', 'analytics-settings', 'analytics-accept', 'analytics-decline', 'contact-form']) elements[`#${id}`] = element();
  const loaded = [], listeners = {};
  const window = { portfolioAnalyticsConfig: { measurementId: id } };
  let purpose = 'Hiring opportunity';
  const context = {
    window, location: { protocol: 'https:', hostname: 'example.github.io', origin: 'https://example.github.io', pathname: '/portfolio/' },
    localStorage: { getItem: () => stored, setItem() {} }, Date, encodeURIComponent,
    document: { querySelector: selector => elements[selector], createElement: element, head: { append: node => loaded.push(node) }, addEventListener: (name, fn) => { listeners[name] = fn; } },
    FormData: class { get(key) { return { purpose, name: 'Private Name', message: 'Private message longer than 20 chars', email: 'private@example.com' }[key]; } }
  };
  vm.createContext(context); vm.runInContext(source, context);
  const events = () => Array.from(window.dataLayer || [], args => Array.from(args)).filter(args => args[0] === 'event');
  function click(href, options = {}) {
    const link = { getAttribute: () => href, classList: { contains: () => !!options.resume }, dataset: options.channel ? { contact: options.channel } : {}, closest: () => null };
    listeners.click?.({ target: { closest: () => link } });
  }
  return { window, elements, loaded, events, click, setPurpose: value => { purpose = value; } };
}
let test = setup('');
assert.equal(test.loaded.length, 0, 'Unconfigured analytics must not load');
test = setup();
assert.equal(test.loaded.length, 0, 'No Google requests before consent');
assert.equal(test.elements['#analytics-consent'].hidden, false);
test.click('mailto:sathishveerapathiran27@gmail.com'); assert.equal(test.events().length, 0);
test.elements['#analytics-accept'].listeners.click();
assert.equal(test.loaded.length, 1);
test.click('resume.pdf', { resume: true });
test.click('mailto:sathishveerapathiran27@gmail.com?subject=private');
test.click('mailto:sathish2842@gmail.com');
test.click('https://wa.me/example', { channel: 'whatsapp' });
const form = { checkValidity: () => true };
test.elements['#contact-form'].listeners.submit({ currentTarget: form });
test.setPurpose('Consulting engagement');
test.elements['#contact-form'].listeners.submit({ currentTarget: form });
assert.deepEqual(test.events().map(e => e[1]), ['resume_download_click', 'email_click', 'email_click', 'contact_click', 'contact_draft_request', 'contact_draft_request']);
assert.equal(test.events()[1][2].audience, 'hiring');
assert.equal(test.events()[2][2].audience, 'business');
assert.equal(test.events()[4][2].audience, 'hiring');
assert.equal(test.events()[5][2].audience, 'business');
assert.ok(!JSON.stringify(test.events()).includes('Private'));
assert.ok(!JSON.stringify(test.events()).includes('@'));
const count = test.events().length;
test.elements['#analytics-decline'].listeners.click();
test.click('resume.pdf', { resume: true }); assert.equal(test.events().length, count);
assert.equal(test.window['ga-disable-G-TEST1234'], true);
test = setup('G-TEST1234', 'denied'); assert.equal(test.loaded.length, 0);
test = setup('G-TEST1234', 'granted'); assert.equal(test.loaded.length, 1);
console.log('PASS: disabled configuration, opt-in loading, event categories, hiring/business routing, no form contents in events, withdrawal, stored preferences. No live GA delivery verified.');
