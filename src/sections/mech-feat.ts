// Три уникальных механизма прямого продвижения — развороты-«развороты издания» с линейной графикой.
import { t } from '../engine/i18n';
import './mech-feat.css';
import { h } from '../engine/dom';
import { gsap, prefersReducedMotion, reveal, revealWords, ScrollTrigger } from '../engine/motion';
import { ramHornPath, rosette } from '../engine/ornament';
import type { Scope } from '../engine/page';
import type { Mechanism } from '../content/types';
import { valueMeta } from '../engine/theme';
import { collapsible, svgRoot, nextId } from './mech-util';

const ROM = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'];

function shell(m: Mechanism, n: string, scope: Scope, visual: HTMLElement, rest?: HTMLElement | null): HTMLElement {
  const title = h('h3.mech-spread__name', null, m.name);
  const el = h('article.mech-spread', { id: 'mech-' + m.id },
    h('header.mech-spread__head', null,
      h('p.mech-spread__tag', null, t('III · Уникальный механизм {n}', { n })),
      title, h('p.mech-spread__sub', null, m.subtitle)),
    visual, rest ?? null);
  scope.add(revealWords(title));
  scope.add(reveal([visual], { y: 40 }));
  return el;
}

/* ===== ХАҚ Map ===== */
const stopsList = () => [
  t('Поступление на учебу'), t('Первое трудоустройство'), t('Создание семьи'), t('Получение государственной услуги'),
  t('Конфликт с работодателем'), t('Открытие собственного дела'), t('Столкновение с несправедливостью'),
];
const questionsList = () => [
  t('какие ценности здесь действуют и на каких нормах Конституции они основаны'),
  t('что эти ценности означают для человека в данный момент'),
  t('чего он вправе ожидать от других людей и от государства'),
  t('как он должен действовать сам'),
];
const Y = [78, 40, 70, 30, 74, 36, 66];

export function mapFeature(m: Mechanism, scope: Scope): HTMLElement {
  const STOPS = stopsList(), QUESTIONS = questionsList();
  const w = 700, hh = 120;
  const xs = STOPS.map((_, i) => ((i + 0.5) / STOPS.length) * w);
  let d = `M0 ${Y[0]}`;
  xs.forEach((x, i) => {
    const px = i ? xs[i - 1] : 0;
    const py = i ? Y[i - 1] : Y[0];
    d += ` C${px + (x - px) * 0.55} ${py} ${x - (x - px) * 0.55} ${Y[i]} ${x} ${Y[i]}`;
  });
  d += ` L${w} ${Y[6] - 14}`;
  const line = svgRoot(`0 0 ${w} ${hh}`, { class: 'mech-map__svg', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
    `<defs><clipPath id="mm-clip"><rect class="mm-clip" x="0" y="0" width="0" height="${hh}"/></clipPath></defs>
     <path class="mm-dots" d="${d}" fill="none" vector-effect="non-scaling-stroke"/>
     <path class="mm-gold" d="${d}" fill="none" vector-effect="non-scaling-stroke" clip-path="url(#mm-clip)"/>`);
  const clip = line.querySelector<SVGRectElement>('.mm-clip')!;
  const stops: HTMLButtonElement[] = STOPS.map((s, i) =>
    h('button.mech-map__stop', { type: 'button', 'aria-pressed': 'false', '--y': Y[i] + 'px', style: { left: ((i + 0.5) / STOPS.length) * 100 + '%' } },
      h('span.mech-map__dot', null, ROM[i]), h('span.mech-map__lab', null, s)));
  const path = h('div.mech-map__path', null, line, stops);

  const ansHead = h('h4.mech-map__q');
  const ansList = h('ol.mech-map__answers', null, QUESTIONS.map((q, i) => h('li.mech-map__ans', null, h('span.mech-map__n', null, ROM[i] + '.'), h('p', null, q))));
  const example = h('div.mech-map__ex');
  const panel = h('div.mech-map__panel', { 'aria-live': 'polite' }, h('p.mech-map__lbl', null, t('ХАҚ Map отвечает на четыре вопроса')), ansHead, ansList, example);

  const pick = (i: number, instant = false) => {
    stops.forEach((b, k) => { b.setAttribute('aria-pressed', String(k === i)); b.classList.toggle('is-past', k < i); });
    ansHead.textContent = STOPS[i];
    example.replaceChildren();
    example.hidden = i !== 1;
    if (i === 1) {
      example.append(
        h('div.mech-map__vals', null, (['adildik', 'zan', 'adam'] as const).map((id) => {
          const v = valueMeta(id);
          return h('span.mech-map__val', { '--c': v.color }, h('span.icon-badge', { '--s': '30px', '--c': v.color }, h('img', { src: v.icon, alt: '' })), v.kz);
        })),
        h('p', null, m.paragraphs[2] ?? ''));
    }
    const x = xs[i];
    if (instant || prefersReducedMotion()) clip.setAttribute('width', String(x + 1));
    else {
      gsap.to(clip, { attr: { width: x + 1 }, duration: 1, ease: 'power2.inOut' });
      gsap.fromTo(ansList.children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08, ease: 'expo.out' });
    }
  };
  stops.forEach((b, i) => scope.on(b, 'click', () => pick(i)));
  pick(1, true);

  const embed = h('p.mech-map__embed', null, h('span', null, t('Встраивается в то, чем человек уже пользуется: ')),
    [t('государственные сервисы и уведомления'), 'Kaspi', 'Kundelik', 'Yandex', t('процедуры приема на учебу и найма'), t('образовательные платформы'), t('цифровой помощник')].join(' · '));
  const visual = h('div.mech-map', null, h('p.mech-map__hint', null, t('Нажмите на жизненную ситуацию')), path, panel);
  return shell(m, '1', scope, visual, h('div.mech-spread__body', null, collapsible(m.paragraphs, scope), embed));
}

/* ===== Экосистема LifeХАҚ — созвездие ===== */
export function lifeFeature(m: Mechanism, scope: Scope): HTMLElement {
  const P = m.paragraphs;
  const VW = 600, VH = 520;
  const nodes = [
    { label: t('Экосистема LifeХАҚ'), x: 300, y: 260, p: 0 },
    { label: 'LifeХАҚ', x: 112, y: 142, p: 1 },
    { label: '#БұлХАҚпа', x: 488, y: 142, p: 2 },
    { label: 'ХАҚеры', x: 508, y: 347, p: 3 },
    { label: t('Роль государства'), x: 300, y: 465, p: 4 },
    { label: 'ХАҚ hub', x: 92, y: 347, p: 5 },
  ];
  const arcs = nodes.slice(1).map((n) => {
    const mx = (300 + n.x) / 2, my = (260 + n.y) / 2;
    const dx = n.x - 300, dy = n.y - 260;
    return `M300 260 Q${mx - dy * 0.18} ${my + dx * 0.18} ${n.x} ${n.y}`;
  });
  let stars = '';
  const seed = [[40, 40], [560, 60], [330, 40], [210, 230], [420, 410], [30, 230], [570, 250], [150, 470], [450, 490], [250, 120], [360, 130], [200, 400]];
  seed.forEach(([x, y], i) => { stars += `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.2 : 1.8}" fill="currentColor" opacity=".6"/>`; });
  const reduced = prefersReducedMotion();
  const pulses = reduced ? '' : arcs.map((a, i) => `<circle r="2.6" fill="var(--gold-2)"><animateMotion dur="${3.4 + i * 0.4}s" begin="${i * 0.7}s" repeatCount="indefinite" path="${a}"/><animate attributeName="opacity" values="0;1;1;0" dur="${3.4 + i * 0.4}s" begin="${i * 0.7}s" repeatCount="indefinite"/></circle>`).join('');
  const deco = svgRoot(`0 0 ${VW} ${VH}`, { class: 'mech-life__svg', 'aria-hidden': 'true' },
    `<ellipse class="ml-ring" cx="300" cy="260" rx="236" ry="206" fill="none" vector-effect="non-scaling-stroke"/>
     <ellipse class="ml-ring2" cx="300" cy="260" rx="150" ry="132" fill="none" vector-effect="non-scaling-stroke"/>
     ${arcs.map((a) => `<path class="ml-arc" d="${a}" fill="none" vector-effect="non-scaling-stroke"/>`).join('')}
     <g class="ml-stars">${stars}</g>${pulses}`);
  const btns = nodes.map((n, i) => h('button.mech-life__node' + (i === 0 ? '.is-hub' : ''), { type: 'button', 'aria-pressed': 'false', style: { left: (n.x / VW) * 100 + '%', top: (n.y / VH) * 100 + '%' } },
    h('span.mech-life__ring', { 'aria-hidden': 'true' }, i === 0 ? rosette('mech-life__ros') : h('i')), h('span.mech-life__t', null, n.label)));
  const net = h('div.mech-life__net', null, deco, btns);
  const txt = h('p.mech-life__txt');
  const ttl = h('h4.mech-life__ttl');
  const panel = h('div.mech-life__panel', { 'aria-live': 'polite' }, h('p.mech-map__lbl', null, t('Нажмите на звезду')), ttl, txt);
  const pick = (i: number) => {
    btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    ttl.textContent = nodes[i].label;
    txt.textContent = P[nodes[i].p] ?? '';
    if (!reduced) gsap.fromTo([ttl, txt], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.07, ease: 'expo.out' });
  };
  btns.forEach((b, i) => scope.on(b, 'click', () => pick(i)));
  pick(0);
  if (!reduced) gsap.from(btns, { scale: 0.6, opacity: 0, stagger: 0.1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: net, start: 'top 80%', once: true } });
  return shell(m, '2', scope, h('div.mech-life', null, net, panel), null);
}

/* ===== Бұл ХАҚ па? — гравированная печать ===== */
export function stampFeature(m: Mechanism, scope: Scope): HTMLElement {
  const uid = nextId('stamp');
  let horns = '';
  for (let k = 0; k < 12; k++) horns += `<path transform="rotate(${k * 30} 180 180)" d="${ramHornPath(180, 28, 26)}" fill="none" vector-effect="non-scaling-stroke"/>`;
  const svg = svgRoot('0 0 360 360', { class: 'mech-stamp__svg', 'aria-hidden': 'true' },
    `<defs><path id="${uid}-c" d="M180 180 m-124 0 a124 124 0 1 1 248 0 a124 124 0 1 1 -248 0"/></defs>
     <g class="st-lines" fill="none"><circle cx="180" cy="180" r="172" vector-effect="non-scaling-stroke"/><circle cx="180" cy="180" r="166" vector-effect="non-scaling-stroke" opacity=".5"/>
     <circle cx="180" cy="180" r="140" vector-effect="non-scaling-stroke"/><circle cx="180" cy="180" r="108" vector-effect="non-scaling-stroke"/><circle cx="180" cy="180" r="102" vector-effect="non-scaling-stroke" opacity=".5"/></g>
     <g class="st-horns" stroke-linecap="round">${horns}</g>
     <g class="mech-stamp__spin"><text class="st-ring"><textPath href="#${uid}-c">БҰЛ ХАҚ ПА? • БҰЛ ХАҚ ПА? • БҰЛ ХАҚ ПА? • БҰЛ ХАҚ ПА? • </textPath></text></g>
     <text class="st-c1" x="180" y="168" text-anchor="middle">Бұл</text>
     <text class="st-c2" x="180" y="214" text-anchor="middle">ХАҚ</text>
     <text class="st-c1" x="180" y="250" text-anchor="middle">па?</text>`);
  const wave = h('i.mech-stamp__wave', { 'aria-hidden': 'true' });
  const wave2 = h('i.mech-stamp__wave', { 'aria-hidden': 'true' });
  const seal = h('span.mech-stamp__seal', null, svg);
  const stamp = h('button.mech-stamp', { type: 'button', 'aria-label': t('Поставить печать «Бұл ХАҚ па?»') }, wave, wave2, seal);
  const slam = () => {
    if (prefersReducedMotion()) return;
    const tl = gsap.timeline();
    tl.fromTo(seal, { scale: 1.9, rotate: -16, opacity: 0.1 }, { scale: 1, rotate: -4, opacity: 1, duration: 0.5, ease: 'power4.in' })
      .fromTo([wave, wave2], { scale: 0.9, opacity: 0.8 }, { scale: 1.8, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.14 }, '>-0.02')
      .fromTo(stamp, { y: 5 }, { y: 0, duration: 0.6, ease: 'elastic.out(1,0.3)' }, '<');
  };
  const dirs = [
    { t: t('Оценить поступок'), text: m.paragraphs[1] ?? '' },
    { t: t('Увидеть ценность'), text: m.paragraphs[2] ?? '' },
  ];
  let dir = 0;
  const tabs = dirs.map((d, i) => h('button.mech-tab', { type: 'button', role: 'tab', 'aria-selected': String(i === 0) }, d.t));
  const body = h('p.mech-stamp__body');
  const tabPanel = h('div.mech-stamp__tp', { role: 'tabpanel', 'aria-live': 'polite' }, body);
  const setDir = (i: number) => {
    dir = i;
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    body.textContent = dirs[i].text;
    if (!prefersReducedMotion()) gsap.fromTo(body, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' });
  };
  scope.on(stamp, 'click', () => { slam(); setDir(dir === 0 ? 1 : 0); });
  tabs.forEach((t, i) => {
    scope.on(t, 'click', () => setDir(i));
    scope.on(t, 'keydown', ((e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); setDir(1 - i); tabs[1 - i].focus(); }
    }) as EventListener);
  });
  setDir(0);
  const result = h('p.mech-stamp__res', null, m.paragraphs[3] ?? '');
  const visual = h('div.mech-stampwrap', null,
    h('div.mech-stamp__col', null, stamp, h('p.mech-map__hint', null, t('Нажмите на печать'))),
    h('div.mech-stamp__info', null, h('div.mech-stamp__lead.mech-text', null, h('p', null, m.paragraphs[0] ?? '')), h('div.mech-stamp__tabs', { role: 'tablist', 'aria-label': t('Два направления распознавания') }, tabs), tabPanel, result));
  if (!prefersReducedMotion()) {
    gsap.set(seal, { opacity: 0 });
    ScrollTrigger.create({ trigger: stamp, start: 'top 75%', once: true, onEnter: slam });
  }
  return shell(m, '3', scope, visual, null);
}
