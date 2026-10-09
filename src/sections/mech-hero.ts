import { t } from '../engine/i18n';
import './mech-hero.css';
import { h } from '../engine/dom';
import { gsap, prefersReducedMotion, revealWords, scrubText, reveal } from '../engine/motion';
import { illustration, ornamentBand, rosette, drawOn } from '../engine/ornament';
import type { Scope } from '../engine/page';
import { mechanisms } from '../content';
import { collapsible, svgRoot } from './mech-util';


/* ---------- Титул ---------- */
export function mechHero(scope: Scope): HTMLElement {
  const title = h('h1.mech-hero__title', null, t('Механизмы продвижения ХАҚ'));
  const quote = h('p.mech-hero__quote', null, t('Кампания действует, пока на нее выделяются ресурсы, а культурная норма воспроизводится сама.'));
  const body = collapsible(mechanisms.intro, scope);
  const art = illustration('shanyrak', 'mech-hero__art');
  const band = ornamentBand(18, 'mech-hero__band');
  const cue = h('a.mech-hero__cue', { href: '#mech-curves' }, h('span', null, t('Далее')), h('i', { 'aria-hidden': 'true' }));
  const el = h(
    'section.section.mech-hero',
    null,
    h('div.mech-hero__artwrap', { 'aria-hidden': 'true' }, art),
    h('div.wrap.mech-hero__in', null,
      h('p.eyebrow', null, t('Раздел III')),
      title, quote,
      h('div.mech-hero__body', null, body),
      h('div.mech-hero__foot', null, band, cue)),
  );
  scope.add(revealWords(title, { immediate: true, delay: 0.1 }));
  scope.add(scrubText(quote, { start: 'top 88%', end: 'bottom 60%' }));
  scope.add(reveal(body));
  scope.add(drawOn(art, { duration: 3.2, start: 'top 100%' }));
  scope.on(cue, 'click', ((e: Event) => {
    e.preventDefault();
    document.getElementById('mech-curves')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }) as EventListener);
  if (!prefersReducedMotion()) gsap.to(art, { rotate: 360, duration: 240, ease: 'none', repeat: -1, transformOrigin: '50% 50%' });
  return el;
}

/* ---------- Две кривые: гравюра ---------- */
const CAMPAIGN = 'M60 360 C150 352 190 86 295 86 C400 86 440 356 620 360 L940 360';
const NORM = 'M60 360 C250 360 330 332 450 252 C570 172 700 112 940 66';

export function mechCurves(_scope: Scope): HTMLElement {
  const reduced = prefersReducedMotion();
  let ticks = '';
  for (let i = 0; i <= 8; i++) ticks += `<line x1="${60 + i * 110}" x2="${60 + i * 110}" y1="360" y2="368" />`;
  const chart = svgRoot('0 0 1000 440', { class: 'mech-curves__svg', role: 'img', 'aria-label': t('Две кривые во времени: кампания растёт и сходит к нулю, когда заканчиваются ресурсы; культурная норма растёт и воспроизводится сама.') },
    `<defs>
      <pattern id="mc-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(52)"><line x1="0" y1="0" x2="0" y2="7" stroke="currentColor" stroke-width="1"/></pattern>
      <clipPath id="mc-cc"><rect class="mc-clip-c" x="0" y="0" width="0" height="440"/></clipPath>
      <clipPath id="mc-nc"><rect class="mc-clip-n" x="0" y="0" width="0" height="440"/></clipPath>
    </defs>
    <g class="mc-axes" fill="none" stroke="currentColor" stroke-width="1">
      <line x1="60" x2="950" y1="360" y2="360"/><line x1="60" x2="60" y1="34" y2="360"/>${ticks}
      <path d="M950 360 l-9 -4 v8z M60 34 l-4 9 h8z" fill="currentColor"/>
    </g>
    <text x="948" y="396" text-anchor="end" class="mc-axis">${t('время')}</text>
    <text x="74" y="40" class="mc-axis">${t('масштаб')}</text>
    <g class="mc-brace"><path d="M60 404 v8 h560 v-8" fill="none" stroke="currentColor"/><text x="340" y="432" text-anchor="middle" class="mc-note">${t('пока на нее выделяются ресурсы')}</text>
      <line x1="620" x2="620" y1="120" y2="360" stroke="currentColor" stroke-dasharray="2 6"/></g>
    <g class="mc-areas"><path class="mc-area-n" d="${NORM} L940 360 L60 360Z" fill="url(#mc-hatch)" clip-path="url(#mc-nc)"/></g>
    <path class="mc-p mc-p--c" d="${CAMPAIGN}" pathLength="1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    <path class="mc-p mc-p--n" d="${NORM}" pathLength="1" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
    <g class="mc-dot mc-dot--c"><circle r="7" fill="var(--night)" stroke="currentColor" stroke-width="1.2"/><circle r="2.2" fill="currentColor"/></g>
    <g class="mc-dot mc-dot--n"><circle r="8" fill="var(--night)" stroke="currentColor" stroke-width="1.2"/><circle r="2.6" fill="currentColor"/></g>
    <g class="mc-lab mc-lab--c"><text x="295" y="62" text-anchor="middle" class="mc-name">${t('Кампания')}</text></g>
    <g class="mc-lab mc-lab--n"><text x="940" y="38" text-anchor="end" class="mc-name">${t('Культурная норма')}</text><text x="940" y="58" text-anchor="end" class="mc-note">${t('воспроизводится сама')}</text></g>`,
  );
  const q = <T extends Element>(s: string) => chart.querySelector(s) as unknown as T;
  const pc = q<SVGPathElement>('.mc-p--c'), pn = q<SVGPathElement>('.mc-p--n');
  const dc = q<SVGGElement>('.mc-dot--c'), dn = q<SVGGElement>('.mc-dot--n');
  const clipC = q<SVGRectElement>('.mc-clip-c'), clipN = q<SVGRectElement>('.mc-clip-n');
  const labC = q<SVGGElement>('.mc-lab--c'), labN = q<SVGGElement>('.mc-lab--n');
  const brace = q<SVGGElement>('.mc-brace');
  const st = { c: 0, n: 0 };
  let lenC = 0, lenN = 0;
  const render = () => {
    if (!lenC) { lenC = pc.getTotalLength(); lenN = pn.getTotalLength(); }
    const set = (path: SVGPathElement, dot: SVGGElement, clip: SVGRectElement | null, v: number, len: number) => {
      path.style.strokeDasharray = '1';
      path.style.strokeDashoffset = String(1 - v);
      path.style.visibility = v < 0.002 ? 'hidden' : 'visible';
      const pt = path.getPointAtLength(len * v);
      dot.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
      dot.style.opacity = v > 0.002 ? '1' : '0';
      clip?.setAttribute('width', String(pt.x));
    };
    set(pc, dc, clipC, st.c, lenC);
    set(pn, dn, clipN, st.n, lenN);
    const ramp = (v: number, a: number, k: number) => String(Math.min(1, Math.max(0, (v - a) * k)));
    labC.style.opacity = ramp(st.c, 0.3, 4);
    labN.style.opacity = ramp(st.n, 0.7, 4);
    brace.style.opacity = ramp(st.c, 0.85, 6);
  };
  const legend = h('ul.mech-curves__legend', null,
    h('li.mech-curves__c', null, h('i', { 'aria-hidden': 'true' }), h('b', null, t('Кампания')), h('span', null, t('растёт, пока идут ресурсы, и сходит к нулю'))),
    h('li.mech-curves__n', null, h('i', { 'aria-hidden': 'true' }), h('b', null, t('Культурная норма')), h('span', null, t('растёт и поддерживает себя сама'))));
  const stick = h('div.mech-curves__stick', null, h('div.wrap.mech-curves__in', null,
    h('p.eyebrow', null, t('III · Время')),
    h('h2.t-l.mech-curves__t', null, t('Что остаётся, когда кампания заканчивается')),
    h('div.mech-curves__chart', null, chart), legend));
  const el = h('section#mech-curves.mech-curves', null, stick);
  if (reduced) {
    st.c = 1; st.n = 1;
    el.classList.add('is-static');
    requestAnimationFrame(render);
  } else {
    render();
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.7 }, defaults: { ease: 'none' } });
    tl.to(st, { c: 1, duration: 0.5, ease: 'power1.inOut', onUpdate: render }, 0.04)
      .to(st, { n: 1, duration: 0.62, ease: 'power1.inOut', onUpdate: render }, 0.36)
      .to({}, { duration: 0.1 });
  }
  return el;
}

/* ---------- Эстафета роли государства ---------- */
const stages = () => [
  { who: t('Государство'), tag: t('импульс'), text: t('На первом этапе оно дает импульс: раскрывает конституционный смысл ценностей ХАҚ и подает пример собственной практикой.') },
  { who: t('Организации и сообщества'), tag: t('инициатива'), text: t('Затем инициатива все больше переходит к организациям, сообществам и самим людям, для которых ХАҚ становится естественным критерием оценки поступков.') },
  { who: t('Люди'), tag: t('норма'), text: t('ХАҚ становится естественным критерием оценки поступков.') },
];
const ROMAN = ['I', 'II', 'III'];

export function mechBaton(scope: Scope): HTMLElement {
  const reduced = prefersReducedMotion();
  const STAGES = stages();
  const nodes = STAGES.map((s, i) =>
    h('li.mech-baton__node', { style: { left: 12 + i * 38 + '%' } },
      h('span.mech-baton__med', null, rosette('mech-baton__ros'), h('b', null, ROMAN[i])),
      h('strong', null, s.who), h('em', null, s.tag)));
  const baton = h('div.mech-baton__rod', { 'aria-hidden': 'true' }, h('i'));
  const fill = h('div.mech-baton__fill');
  const track = h('div.mech-baton__track', null, h('div.mech-baton__line'), fill, h('ol.mech-baton__nodes', null, nodes), baton);
  const caps = STAGES.map((s, i) => h('li.mech-baton__cap', null, h('span', null, ROMAN[i]), h('p', null, s.text)));
  const law = h('p.mech-baton__law', null, h('i', { 'aria-hidden': 'true' }), t('Связь с Конституцией при этом сохраняется на каждом этапе: '), h('b', null, t('их источником остаются положения Основного закона.')));
  const title = h('h2.t-l.mech-baton__t', null, t('Роль государства в этой системе меняется по мере ее развития.'));
  const stick = h('div.mech-baton__stick', null, h('div.wrap.mech-baton__in', null, h('p.eyebrow', null, t('III · Эстафета')), title, track, h('ol.mech-baton__caps', null, caps), law));
  const el = h('section.mech-baton', null, stick);
  const st = { p: 0 };
  const render = () => {
    const p = st.p;
    baton.style.left = 12 + p * 76 + '%';
    fill.style.width = p * 76 + '%';
    const idx = p < 0.25 ? 0 : p < 0.75 ? 1 : 2;
    caps.forEach((c, i) => c.classList.toggle('is-on', i === idx));
    nodes.forEach((n, i) => {
      n.classList.toggle('is-on', p >= i * 0.5 - 0.02);
      const k = i === 0 ? 1 - p * 0.3 : i === 1 ? 0.85 + Math.sin(p * Math.PI) * 0.15 : 0.8 + p * 0.25;
      n.style.setProperty('--k', String(k));
    });
  };
  render();
  if (reduced) {
    el.classList.add('is-static');
    st.p = 1; render();
    caps.forEach((c) => c.classList.add('is-on'));
  } else {
    gsap.to(st, { p: 1, ease: 'none', onUpdate: render, scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
  }
  scope.add(reveal(title));
  return el;
}
