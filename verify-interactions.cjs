// State/interaction checks with a small DOM test double, not browser rendering tests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const entry = fs.readFileSync('index.html', 'utf8');
assert.match(entry, /<script src="script\.js" defer><\/script>/, 'Final entry point must load the tested script');
class Element {
  constructor() {
    this.children = []; this.attrs = {}; this.listeners = {}; this.textContent = '';
    this.dataset = {}; this.style = { setProperty() {}, removeProperty() {} };
    const values = new Set();
    this.classList = { add: x => values.add(x), remove: x => values.delete(x), contains: x => values.has(x), toggle(x, yes) { yes ? values.add(x) : values.delete(x); } };
  }
  addEventListener(name, fn) { (this.listeners[name] ||= []).push(fn); }
  emit(name, extra = {}) { for (const fn of this.listeners[name] || []) fn({ currentTarget: this, preventDefault() {}, ...extra }); }
  setAttribute(name, value) { this.attrs[name] = value; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  focus() { this.focused = true; }
  getBoundingClientRect() { return { width: 300, height: 300, left: 0, top: 0 }; }
  querySelector(selector) { return this.queries[selector]; }
  scrollTo({ left }) { this.scrollLeft = left; }
}
const ids = Object.fromEntries(['scene', 'model', 'robot-button', 'robot-caption', 'architecture', 'pipeline-play', 'stage-info', 'run-status', 'pipeline-prev', 'pipeline-next', 'pipeline-reset', 'clients-toggle', 'clients-prev', 'clients-next', 'contact-form', 'contact-status', 'year'].map(id => [`#${id}`, new Element()]));
const stages = Array.from({ length: 7 }, () => new Element());
const links = Array.from({ length: 5 }, (_, i) => { const el = new Element(); el.dataset.link = String(i + 1); return el; });
const slider = new Element(), row = new Element(), group = new Element(), submit = new Element();
row.scrollLeft = 0; row.clientWidth = 600; group.scrollWidth = 2400; group.firstElementChild = new Element();
slider.queries = { '.client-slider-row': row, '.client-slider-group': group };
ids['#contact-form'].queries = { '[type="submit"]': submit };
ids['#contact-form'].reportValidity = () => true;
const document = { querySelector: selector => selector === '.client-slider' ? slider : ids[selector], querySelectorAll: selector => selector === '[data-stage]' ? stages : links, createElement: () => new Element(), addEventListener() {} };
let timer = null;
const preference = { matches: false, addEventListener() {} };
const context = { document, matchMedia: () => preference, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, setInterval(fn) { timer = fn; return 1; }, clearInterval() { timer = null; }, Date, window: { location: {} }, FormData: class { get(key) { return { name: 'Test Visitor', email: 'test@example.com', purpose: 'Consulting engagement', message: 'This is a test message with enough context.' }[key]; } } };
vm.createContext(context); vm.runInContext(fs.readFileSync('script.js', 'utf8'), context);
assert.equal(timer, null, 'Pipeline must start paused');
assert.equal(stages[0].attrs['aria-pressed'], 'true');
ids['#pipeline-play'].emit('click'); assert.ok(timer);
timer(); assert.equal(stages[1].attrs['aria-pressed'], 'true');
stages[3].emit('click'); assert.equal(timer, null); assert.equal(stages[3].attrs['aria-pressed'], 'true');
ids['#pipeline-next'].emit('click'); assert.equal(stages[4].attrs['aria-pressed'], 'true');
stages[4].emit('keydown', { key: 'End' }); assert.ok(stages[6].focused); assert.equal(stages[6].attrs['aria-pressed'], 'true');
ids['#pipeline-reset'].emit('click'); assert.equal(stages[0].attrs['aria-pressed'], 'true');
ids['#pipeline-play'].emit('click');
for (let i = 0; i < 5; i++) timer();
assert.equal(timer, null, 'Playback stops at serving, not governance');
assert.equal(stages[5].attrs['aria-pressed'], 'true');
ids['#pipeline-play'].emit('click');
const details = ids['#stage-info'].children[2]; details.open = true; details.emit('toggle'); assert.equal(timer, null, 'Reading notes pauses playback');
ids['#clients-next'].emit('click'); assert.ok(row.scrollLeft > 0); assert.ok(slider.classList.contains('is-paused'));
ids['#robot-button'].emit('click'); assert.match(ids['#robot-caption'].textContent, /queries/);
ids['#contact-form'].emit('submit');
assert.match(context.window.location.href, /^mailto:sathish2842@gmail.com\?subject=/);
assert.match(ids['#contact-status'].textContent, /Nothing has been submitted/);
assert.equal(submit.disabled, false);
for (const [purpose, recipient] of [['Hiring opportunity', 'sathishveerapathiran27@gmail.com'], ['Product collaboration', 'sathish2842@gmail.com']]) {
  context.FormData = class { get(key) { return { name: 'Test Visitor', email: 'test@example.com', purpose, message: 'A test enquiry with enough context.' }[key]; } };
  ids['#contact-form'].emit('submit');
  assert.ok(context.window.location.href.startsWith(`mailto:${recipient}?subject=`));
  assert.ok(ids['#contact-status'].textContent.includes(recipient));
}
preference.matches = true; vm.runInContext('motionPreference()', context);
assert.ok(slider.classList.contains('is-paused')); assert.equal(timer, null);
console.log('PASS: initial paused state, playback, manual selection, keyboard navigation, reset, serving stop, reading pause, carousel navigation, robot quips, mailto preparation, reduced-motion state.');
