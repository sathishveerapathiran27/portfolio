'use strict';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const scene = document.querySelector('#scene');
const model = document.querySelector('#model');
let targetX = 0, targetY = 0, eyeX = 0, eyeY = 0, robotFrame = 0;
function trackRobot() {
  eyeX += (targetX - eyeX) * .12;
  eyeY += (targetY - eyeY) * .12;
  model.style.setProperty('--eye-x', `${eyeX * 12}px`);
  model.style.setProperty('--eye-y', `${eyeY * 8}px`);
  model.style.transform = `translate(-50%,-50%) rotateX(${-5 - eyeY * 12}deg) rotateY(${-12 + eyeX * 30}deg)`;
  robotFrame = Math.abs(targetX - eyeX) + Math.abs(targetY - eyeY) > .001 ? requestAnimationFrame(trackRobot) : 0;
}
scene.addEventListener('pointermove', event => {
  if (reduced.matches || event.pointerType === 'touch') return;
  const bounds = scene.getBoundingClientRect();
  targetX = (event.clientX - bounds.left) / bounds.width - .5;
  targetY = (event.clientY - bounds.top) / bounds.height - .5;
  if (!robotFrame) robotFrame = requestAnimationFrame(trackRobot);
});
scene.addEventListener('pointerleave', () => {
  targetX = targetY = 0;
  if (!reduced.matches && !robotFrame) robotFrame = requestAnimationFrame(trackRobot);
});
const quips = ['My favorite exercise? Running queries.', 'I put the fun in function.', 'Just here to improve your data mood.', '99 problems, but a null ain’t… wait.', 'Powered by curiosity. And suspicious amounts of coffee.'];
let quip = 0;
document.querySelector('#robot-button').addEventListener('click', () => {
  document.querySelector('#robot-caption').textContent = quips[quip++ % quips.length];
  if (!reduced.matches) {
    scene.classList.remove('robot-react');
    requestAnimationFrame(() => scene.classList.add('robot-react'));
  }
});
scene.addEventListener('animationend', event => { if (event.animationName === 'robot-nod') scene.classList.remove('robot-react'); });

const stages = [
  ['Sources', 'Azure SQL / APIs', 'sql-database', 'Bring the information your business already has into one flow.', 'Databases and APIs provide source records. Access, extraction boundaries and source ownership should be agreed before ingestion.'],
  ['Ingestion', 'Azure Data Factory', 'data-factory', 'Move data on a predictable schedule, without repeated manual exports.', 'Orchestrate extraction and loading. Incremental boundaries, retries and failure alerts depend on the source and business requirements.'],
  ['Raw layer', 'ADLS Gen2', 'data-lake', 'Keep an original copy so changes can be traced and processing can be repeated.', 'Land source data in a raw storage layer. Define retention, partitioning and replay strategy for each dataset.'],
  ['Cleansed layer', 'Azure Databricks', 'databricks', 'Clean and connect the records before people rely on them.', 'Use PySpark, Spark SQL and Delta Lake for standardization and transformations. Check schema, duplicates, nulls and business rules; isolate invalid records.'],
  ['Curated layer', 'Azure Synapse', 'synapse', 'Organize trusted data around the questions the business needs to answer.', 'Publish business models and aggregates with explicit grain and relationships. Review query plans and validate totals against the agreed source.'],
  ['Serving', 'Power BI', 'power-bi', 'Give teams consistent information for everyday decisions.', 'Consume curated models through reports and semantic models. Validate measures, refresh behavior and audience access.'],
  ['Governance', 'Cross-cutting capability', 'data-catalog', 'Keep data discoverable, controlled and trustworthy across the entire platform.', 'Apply ownership, cataloguing, lineage, access control, data quality and monitoring at every stage. The catalog icon represents this capability, not an additional processing step.']
];
const pipeline = document.querySelector('#architecture');
const stageButtons = [...document.querySelectorAll('[data-stage]')];
const playButton = document.querySelector('#pipeline-play');
let activeStage = 0, pipelineTimer = null;
function showStage(index) {
  activeStage = index;
  const [label, tool, icon, business, technical] = stages[index];
  const box = document.querySelector('#stage-info');
  box.replaceChildren();
  const heading = document.createElement('div');
  heading.className = 'stage-detail-heading';
  const image = document.createElement('img');
  image.src = `assets/tools/${icon}.svg`; image.alt = ''; image.width = image.height = 30;
  const title = document.createElement('strong'); title.textContent = `${label} · ${tool}`;
  heading.append(image, title);
  const description = document.createElement('p'); description.textContent = business;
  const details = document.createElement('details');
  const summary = document.createElement('summary'); summary.textContent = 'Technical notes';
  const paragraph = document.createElement('p'); paragraph.textContent = technical;
  details.append(summary, paragraph); box.append(heading, description, details);
  details.addEventListener('toggle', () => { if (details.open) pausePipeline(); });
  stageButtons.forEach((button, n) => {
    button.setAttribute('aria-pressed', String(n === index));
    button.classList.toggle('is-complete', index < 6 && n < index);
    button.setAttribute('aria-controls', 'stage-info');
  });
  pipeline.dataset.activeStage = String(index);
  document.querySelectorAll('[data-link]').forEach(link => link.classList.toggle('link-active', Number(link.dataset.link) === index));
  document.querySelector('#run-status').textContent = `${pipelineTimer ? 'Playing' : 'Selected'}: ${label}`;
}
function pausePipeline() {
  clearInterval(pipelineTimer); pipelineTimer = null;
  pipeline.classList.remove('is-processing');
  playButton.textContent = 'Play flow'; playButton.setAttribute('aria-pressed', 'false');
  document.querySelector('#run-status').textContent = `Selected: ${stages[activeStage][0]}`;
}
function navigateStage(index) { pausePipeline(); showStage((index + stages.length) % stages.length); }
playButton.addEventListener('click', () => {
  if (pipelineTimer) return pausePipeline();
  if (activeStage >= 5) showStage(0);
  pipelineTimer = setInterval(() => {
    if (activeStage >= 5) return pausePipeline();
    showStage(activeStage + 1);
    if (activeStage === 5) pausePipeline();
  }, 6000);
  playButton.textContent = 'Pause flow'; playButton.setAttribute('aria-pressed', 'true');
  pipeline.classList.add('is-processing');
  document.querySelector('#run-status').textContent = `Playing: ${stages[activeStage][0]}`;
});
stageButtons.forEach((button, index) => {
  button.addEventListener('click', () => navigateStage(index));
  button.addEventListener('keydown', event => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 6 : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + 7) % 7;
    navigateStage(next); stageButtons[next].focus();
  });
});
document.querySelector('#pipeline-prev').addEventListener('click', () => navigateStage(activeStage - 1));
document.querySelector('#pipeline-next').addEventListener('click', () => navigateStage(activeStage + 1));
document.querySelector('#pipeline-reset').addEventListener('click', () => navigateStage(0));
showStage(0);

const slider = document.querySelector('.client-slider');
const carouselToggle = document.querySelector('#clients-toggle');
function pauseCarousel(paused) {
  if (!paused) slider.querySelector('.client-slider-row').scrollLeft = 0;
  slider.classList.toggle('is-paused', paused);
  carouselToggle.setAttribute('aria-pressed', String(paused));
  carouselToggle.textContent = paused ? 'Play carousel' : 'Pause carousel';
}
carouselToggle.addEventListener('click', () => pauseCarousel(!slider.classList.contains('is-paused')));
function moveCarousel(direction) {
  pauseCarousel(true);
  const row = slider.querySelector('.client-slider-row');
  const group = slider.querySelector('.client-slider-group');
  const step = group.firstElementChild.getBoundingClientRect().width + 18;
  const limit = group.scrollWidth - row.clientWidth;
  const next = row.scrollLeft + direction * step;
  row.scrollTo({ left: next < 0 ? Math.max(0, limit) : next > limit + 1 ? 0 : next, behavior: reduced.matches ? 'instant' : 'smooth' });
}
document.querySelector('#clients-prev').addEventListener('click', () => moveCarousel(-1));
document.querySelector('#clients-next').addEventListener('click', () => moveCarousel(1));
slider.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); moveCarousel(event.key === 'ArrowRight' ? 1 : -1); }
});
slider.addEventListener('pointerdown', () => pauseCarousel(true));
function motionPreference() {
  if (reduced.matches) {
    cancelAnimationFrame(robotFrame); robotFrame = 0;
    targetX = targetY = eyeX = eyeY = 0;
    model.style.removeProperty('transform');
    model.style.setProperty('--eye-x', '0px'); model.style.setProperty('--eye-y', '0px');
    pausePipeline(); pauseCarousel(true);
  }
}
reduced.addEventListener('change', motionPreference); motionPreference();
document.addEventListener('visibilitychange', () => { if (document.hidden) { pausePipeline(); pauseCarousel(true); } });

document.querySelector('#contact-form').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const status = document.querySelector('#contact-status');
  const button = form.querySelector('[type="submit"]');
  const fields = new FormData(form);
  const recipient = fields.get('purpose') === 'Hiring opportunity' ? 'sathishveerapathiran27@gmail.com' : 'sathish2842@gmail.com';
  const name = String(fields.get('name')).trim();
  const message = String(fields.get('message')).trim();
  if (!name || message.length < 20) { status.textContent = 'Please add your name and a message of at least 20 characters.'; return; }
  button.disabled = true; button.textContent = 'Preparing…';
  try {
    const subject = `${fields.get('purpose')} — ${name}`;
    const body = `${message}\n\nFrom: ${name}\nReply to: ${fields.get('email')}`;
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    status.textContent = `Email draft requested. Review and send it in your mail app. Nothing has been submitted through this website. If your mail app did not open, email ${recipient} directly.`;
  } catch {
    status.textContent = `Could not open your mail app. Please email ${recipient} directly.`;
  } finally { button.disabled = false; button.textContent = 'Prepare email ↗'; }
});
document.querySelector('#year').textContent = new Date().getFullYear();
