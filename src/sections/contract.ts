// Разделы 02 «Компас» и 03 «Общественный договор»: компас, весы договора, путь ценности.
import { t, pick } from '../engine/i18n';
import './contract.css';
import { h } from '../engine/dom';
import { gsap, ScrollTrigger, prefersReducedMotion, reveal, revealWords, scrubText } from '../engine/motion';
import { rosette, ornamentBand, ramHornPath } from '../engine/ornament';
import { app } from '../engine/app';
import { concept } from '../content';
import type { Scope } from '../engine/page';

const SVG = 'http://www.w3.org/2000/svg';
function s<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, ...kids: Element[]): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  kids.forEach((k) => el.appendChild(k));
  return el;
}


export function contractSection(scope: Scope): HTMLElement {
  const c = concept.contract;
  const root = h('section#contract.section.contract', null);
  root.append(compassBlock(scope), balanceBlock(scope, c), pathBlock(scope, c));
  root.querySelectorAll('.contract-balance-wrap, .contract-path').forEach((el) => {
    const band = ornamentBand(18);
    band.classList.add('contract-band');
    el.before(band);
  });
  return root;
}

/* ───────────────────────── 02 · КОМПАС ───────────────────────── */
function compassBlock(scope: Scope): HTMLElement {
  const k = concept.compass;
  const [p1, p2, p3] = k.paragraphs;
  const TASKS = [
    t('соблюдение прав и свобод человека и гражданина'),
    t('верховенство закона и порядка'),
    t('укрепление общенационального единства'),
    t('повышение благосостояния народа'),
    t('развитие образования, науки и инноваций'),
  ];
  const reduced = prefersReducedMotion();

  // гравированный инструмент: золотые кольца, антиквенные румбы, розетка в центре
  const C = 200;
  const pol = (r: number, deg: number) => [C + Math.sin((deg * Math.PI) / 180) * r, C - Math.cos((deg * Math.PI) / 180) * r] as const;
  const ring = s('g', { class: 'contract-rose__ring' });
  for (let i = 0; i < 72; i++) {
    const major = i % 6 === 0;
    const [x1, y1] = pol(major ? 160 : 168, i * 5);
    const [x2, y2] = pol(182, i * 5);
    ring.appendChild(s('line', { x1, y1, x2, y2, class: major ? 'is-major' : '' }));
  }
  for (let i = 0; i < 10; i++) {
    const [x, y] = pol(146, i * 36);
    ring.appendChild(s('path', { d: `M${x} ${y - 6} L${x + 4} ${y} L${x} ${y + 6} L${x - 4} ${y} Z`, class: 'contract-rose__gem' }));
  }
  const star = s('g', { class: 'contract-rose__star' });
  for (let i = 0; i < 16; i++) {
    const [x, y] = pol(i % 4 === 0 ? 128 : i % 2 === 0 ? 104 : 80, i * 22.5);
    star.appendChild(s('line', { x1: C, y1: C, x2: x, y2: y }));
  }
  const labels = s('g', { class: 'contract-rose__cards' });
  ([[pick({ ru: 'В', kk: 'Ш' }), 90], [pick({ ru: 'Ю', kk: 'О' }), 180], [pick({ ru: 'З', kk: 'Б' }), 270]] as const).forEach(([ch, d]) => {
    const [x, y] = pol(204, d);
    const tx = s('text', { x, y: y + 6, 'text-anchor': 'middle' });
    tx.textContent = ch;
    labels.appendChild(tx);
  });
  const nlabel = s('text', { x: C, y: -4, 'text-anchor': 'middle', class: 'contract-rose__north' });
  nlabel.textContent = t('Конституция');
  const hub = rosette('');
  ['x', 'y'].forEach((k) => hub.setAttribute(k, '166'));
  hub.setAttribute('width', '68');
  hub.setAttribute('height', '68');
  hub.setAttribute('class', 'contract-rose__hub');
  const needle = s(
    'g',
    { class: 'contract-rose__needle' },
    s('path', { d: 'M200 46 L209 200 L200 214 L191 200 Z', class: 'contract-rose__n1' }),
    s('path', { d: 'M200 354 L209 200 L200 186 L191 200 Z', class: 'contract-rose__n2' }),
    s('circle', { cx: 200, cy: 200, r: 6, class: 'contract-rose__pin' }),
  );
  const svg = s(
    'svg',
    { viewBox: '-26 -26 452 452', class: 'contract-rose__svg', 'aria-hidden': 'true', focusable: 'false' },
    s('circle', { cx: C, cy: C, r: 190, class: 'contract-rose__edge' }),
    s('circle', { cx: C, cy: C, r: 184, class: 'contract-rose__edge contract-rose__edge--2' }),
    s('circle', { cx: C, cy: C, r: 126, class: 'contract-rose__edge contract-rose__edge--2' }),
    s('circle', { cx: C, cy: C, r: 70, class: 'contract-rose__edge contract-rose__edge--2' }),
    star,
    ring,
    labels,
    hub,
    needle,
    nlabel,
  );
  const rose = h('div.contract-rose', { role: 'img', 'aria-label': t('Компас: стрелка устанавливается на «Конституция»') }, svg);

  const chips = h(
    'ol.contract-tasks',
    { 'aria-label': t('Задачи, определённые Основным законом') },
    TASKS.map((task, i) => h('li', null, h('span.ref', null, String(i + 1).padStart(2, '0')), h('span', null, task))),
  );
  const title = h('h2.t-l', null, k.title);
  const t1 = h('p.contract-compass__p1', null, p1);
  const lead = h('p.lead.contract-compass__lead', null, p3);

  const el = h(
    'div.wrap.contract-compass',
    null,
    h(
      'div.contract-compass__text.stack',
      { '--gap': '22px' },
      h('p.eyebrow', null, t('02 · Компас')),
      title,
      t1,
      h('p.muted', null, p2),
      chips,
      lead,
    ),
    rose,
  );

  scope.add(revealWords(title));
  scope.add(scrubText(t1, { start: 'top 85%', end: 'bottom 55%' }));
  scope.add(reveal([...(el.querySelectorAll('.contract-compass__text > p.muted') as unknown as Element[]), chips, lead], { y: 30 }));
  if (!reduced) {
    const spin = gsap.to(ring, { rotation: 360, svgOrigin: '200 200', duration: 160, ease: 'none', repeat: -1 });
    scope.add(() => spin.kill());
    const tw = gsap.fromTo(
      needle,
      { rotation: 700, svgOrigin: '200 200' },
      { rotation: 0, svgOrigin: '200 200', ease: 'elastic.out(1, 0.32)', scrollTrigger: { trigger: rose, start: 'top 90%', end: 'center 40%', scrub: 1 } },
    );
    const tp = gsap.fromTo(nlabel, { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: rose, start: 'center 70%', end: 'center 45%', scrub: true } });
    scope.add(() => { tw.scrollTrigger?.kill(); tw.kill(); tp.scrollTrigger?.kill(); tp.kill(); });
  }
  return el;
}

/* ───────────────────────── 03 · ВЕСЫ ДОГОВОРА ───────────────────────── */
type Side = 'state' | 'person';
const PIV = { x: 400, y: 110 };
const HALF = 300;
const DROP = 190;
const MAXA = 11;

function balanceBlock(scope: Scope, c: typeof concept.contract): HTMLElement {
  const reduced = prefersReducedMotion();
  const sides: Record<Side, { items: string[]; sign: -1 | 1; color: string }> = {
    state: { items: c.stateGives, sign: -1, color: 'var(--sky)' },
    person: { items: c.personGives, sign: 1, color: 'var(--gold)' },
  };
  const placed: Record<Side, boolean[]> = { state: c.stateGives.map(() => false), person: c.personGives.map(() => false) };
  let busy = 0;
  let done = false;

  // ── SVG: гравюра весов ──
  const post = s('g', { class: 'contract-scale__post' },
    s('path', { d: `M${PIV.x - 4} ${PIV.y + 12} V428 M${PIV.x + 4} ${PIV.y + 12} V428` }),
    s('path', { d: 'M330 428 H470 M312 438 H488 M292 448 H508 M330 428 L312 438 M470 428 L488 438' }),
    s('path', { d: `M${PIV.x - 4} 400 Q${PIV.x} 392 ${PIV.x + 4} 400` }),
  );
  const horn = s('path', { d: ramHornPath(PIV.x, PIV.y - 14, 34), class: 'contract-scale__horn' });
  const level = s('line', { x1: 40, x2: 760, y1: PIV.y, y2: PIV.y, class: 'contract-scale__level', opacity: 0 });
  const beam = s('g', { class: 'contract-scale__beam' },
    s('path', { d: `M${PIV.x - HALF} ${PIV.y} L${PIV.x - 40} ${PIV.y - 7} Q${PIV.x} ${PIV.y - 12} ${PIV.x + 40} ${PIV.y - 7} L${PIV.x + HALF} ${PIV.y} L${PIV.x + 40} ${PIV.y + 7} Q${PIV.x} ${PIV.y + 12} ${PIV.x - 40} ${PIV.y + 7} Z` }),
    s('path', { d: `M${PIV.x - HALF + 10} ${PIV.y} H${PIV.x + HALF - 10}`, opacity: 0.5 }),
    s('circle', { cx: PIV.x - HALF, cy: PIV.y, r: 5 }),
    s('circle', { cx: PIV.x + HALF, cy: PIV.y, r: 5 }),
  );
  const hub = s('g', { class: 'contract-scale__hub' }, s('circle', { cx: PIV.x, cy: PIV.y, r: 11 }), s('circle', { cx: PIV.x, cy: PIV.y, r: 4 }));
  const ring = s('circle', { cx: PIV.x, cy: PIV.y, r: 11, class: 'contract-scale__ring', opacity: 0 });
  const beamG = beam;

  const pans = {} as Record<Side, { g: SVGGElement; strings: SVGPathElement; weights: Map<number, SVGGElement>; bowl: SVGPathElement }>;
  (['state', 'person'] as Side[]).forEach((side) => {
    const g = s('g', { class: 'contract-pan' });
    g.style.setProperty('--c', sides[side].color);
    const strings = s('path', { class: 'contract-pan__str' });
    strings.style.setProperty('--c', sides[side].color);
    const bowl = s('path', { d: 'M-92 0 Q0 66 92 0', class: 'contract-pan__bowl' });
    const bowl2 = s('path', { d: 'M-78 0 Q0 50 78 0', class: 'contract-pan__bowl contract-pan__bowl--in' });
    const rim = s('path', { d: 'M-98 0 H98 M-98 0 q-4 -4 0 -8 M98 0 q4 -4 0 -8', class: 'contract-pan__rim' });
    g.append(bowl, bowl2, rim);
    pans[side] = { g, strings, weights: new Map(), bowl };
  });
  const svg = s(
    'svg',
    { viewBox: '0 0 800 470', class: 'contract-scale__svg', 'aria-hidden': 'true', focusable: 'false' },
    level,
    post,
    horn,
    pans.state.strings,
    pans.person.strings,
    beamG,
    ring,
    hub,
    pans.state.g,
    pans.person.g,
  );
  const beamGlow = level;

  const sim = { a: 0, glow: 0 };
  const render = () => {
    const r = (sim.a * Math.PI) / 180;
    beamG.setAttribute('transform', `rotate(${sim.a} ${PIV.x} ${PIV.y})`);
    (['state', 'person'] as Side[]).forEach((side) => {
      const sg = sides[side].sign;
      const ex = PIV.x + sg * HALF * Math.cos(r);
      const ey = PIV.y + sg * HALF * Math.sin(r);
      const p = pans[side];
      p.g.setAttribute('transform', `translate(${ex} ${ey + DROP})`);
      p.strings.setAttribute('d', `M${ex} ${ey} L${ex - 98} ${ey + DROP - 8} M${ex} ${ey} L${ex + 98} ${ey + DROP - 8} M${ex} ${ey} L${ex - 49} ${ey + DROP - 8} M${ex} ${ey} L${ex + 49} ${ey + DROP - 8}`);
    });
  };
  render();

  const frac = (side: Side) => placed[side].filter(Boolean).length / placed[side].length;
  const targetAngle = () => (frac('person') - frac('state')) * MAXA;
  const settle = (elastic = false) => {
    if (reduced) { sim.a = targetAngle(); render(); return; }
    gsap.to(sim, { a: targetAngle(), duration: elastic ? 2.2 : 1.1, ease: elastic ? 'elastic.out(1, 0.28)' : 'back.out(1.6)', overwrite: 'auto', onUpdate: render });
  };

  // ── слоты весов ──
  const slot = (rank: number) => ({ x: ((rank % 3) - 1) * 38, y: -17 - Math.floor(rank / 3) * 31 });
  const layout = (side: Side, animate = true) => {
    let rank = 0;
    placed[side].forEach((on, i) => {
      const w = pans[side].weights.get(i);
      if (!w || !on) return;
      const p = slot(rank++);
      if (animate && !reduced) gsap.to(w, { x: p.x, y: p.y, duration: 0.5, ease: 'back.out(1.8)', overwrite: 'auto' });
      else gsap.set(w, { x: p.x, y: p.y });
    });
  };
  const makeWeight = (side: Side, i: number) => {
    const w = s('g', { class: 'contract-weight' });
    w.style.setProperty('--c', sides[side].color);
    w.append(s('circle', { r: 16 }), s('circle', { r: 12, opacity: 0.45 }));
    const t = s('text', { 'text-anchor': 'middle', y: 4.5, class: 'contract-weight__n' });
    t.textContent = String(i + 1);
    w.appendChild(t);
    pans[side].g.appendChild(w);
    pans[side].weights.set(i, w);
    return w;
  };

  // ── UI ──
  const status = h('p.contract-scale__status', { role: 'status', 'aria-live': 'polite' });
  const statement = h('p.contract-statement.quote', { 'aria-live': 'polite' });
  statement.setAttribute('aria-hidden', 'true');
  statement.textContent = t('Права и ответственность в этом договоре неотделимы: одно без другого не работает.');

  const buttons: Record<Side, HTMLButtonElement[]> = { state: [], person: [] };
  const mkCol = (side: Side, head: string) => {
    const col = sides[side].color;
    const list = h(
      'ul.contract-tokens',
      { role: 'list', '--c': col },
      sides[side].items.map((text, i) => {
        const b = h(
          'button.contract-tok',
          { type: 'button', 'aria-pressed': 'false', 'data-side': side, 'data-i': i },
          h('span.contract-tok__n', { 'aria-hidden': 'true' }, String(i + 1).padStart(2, '0')),
          h('span.contract-tok__t', null, text),
        ) as HTMLButtonElement;
        buttons[side].push(b);
        return h('li', null, b);
      }),
    );
    return h('div.contract-col', { '--c': col }, h('h3.contract-col__h', null, head), list);
  };

  const btnAll = h('button.btn.btn--primary', { type: 'button' }, t('Заполнить всё')) as HTMLButtonElement;
  const btnReset = h('button.btn', { type: 'button' }, t('Сбросить')) as HTMLButtonElement;

  const intro = h(
    'div.contract-intro.stack',
    { '--gap': '20px' },
    h('p.eyebrow', null, t('03 · Общественный договор')),
    h('h2.t-l', null, c.title),
    h('p.lead', null, c.paragraphs[0]),
    h('p.muted', null, c.paragraphs[1]),
  );
  scope.add(revealWords(intro.querySelector('h2') as HTMLElement));
  scope.add(reveal(Array.from(intro.querySelectorAll('p:not(.eyebrow)')), { y: 30 }));

  const scale = h('div.contract-scale', null, svg, status);
  const cols = h(
    'div.contract-cols',
    null,
    mkCol('state', t('Государство')),
    mkCol('person', t('Человек в ответ')),
  );
  const hint = h('p.contract-hint.dim', null, t('Положите обязательства на весы: нажмите на любое — оно упадёт в чашу, коснитесь снова, чтобы убрать.'));
  const tools = h('div.contract-tools.row', { '--gap': '12px' }, btnAll, btnReset);
  const stage = h('div.contract-stage', null, scale, cols);
  const wrap = h('div.wrap.contract-balance.stack', { '--gap': 'clamp(24px,4vw,48px)' }, intro, stage, tools, hint, statement);
  scope.add(reveal(scale, { y: 50 }));

  // ── логика ──
  const total = () => placed.state.length + placed.person.length;
  const count = () => placed.state.filter(Boolean).length + placed.person.filter(Boolean).length;

  const updateStatus = () => {
    const l = frac('state'), r = frac('person');
    let msg: string;
    if (count() === 0) msg = t('Весы пусты. Выберите обязательство ниже.');
    else if (count() === total()) msg = t('Обязательства сторон уравновешены.');
    else if (l > r) msg = t('Пока перевешивает государство: человек ещё не положил свои обязательства.');
    else if (r > l) msg = t('Пока перевешивает человек: государство ещё не положило свои обязательства.');
    else msg = t('Весы почти уравновешены. Осталось положить недостающее.');
    status.textContent = msg;
  };

  const complete = () => {
    if (done) return;
    done = true;
    wrap.classList.add('is-balanced');
    statement.removeAttribute('aria-hidden');
    if (reduced) {
      gsap.set(beamGlow, { attr: { opacity: 0.8 } });
      gsap.set(statement, { opacity: 1, y: 0 });
      return;
    }
    settle(true);
    gsap.to(beamGlow, { attr: { opacity: 0.8 }, duration: 1.2, ease: 'power2.out' });
    gsap.fromTo(ring, { attr: { r: 11 }, opacity: 0.9 }, { attr: { r: 80 }, opacity: 0, duration: 1.6, ease: 'power2.out' });
    gsap.fromTo(statement, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.3, ease: 'expo.out', delay: 0.5 });
    const r = scale.getBoundingClientRect();
    app.field?.pulse(r.left + r.width / 2, r.top + r.height * 0.25, 1);
  };
  const undone = () => {
    if (!done) return;
    done = false;
    wrap.classList.remove('is-balanced');
    statement.setAttribute('aria-hidden', 'true');
    gsap.killTweensOf([beamGlow, statement]);
    gsap.to(beamGlow, { attr: { opacity: 0 }, duration: 0.6 });
    gsap.to(statement, { opacity: 0, y: 10, duration: 0.4 });
  };
  gsap.set(statement, { opacity: 0 });

  const slotClient = (side: Side, rank: number) => {
    const ctm = svg.getScreenCTM();
    const m = pans[side].g.transform.baseVal.consolidate()?.matrix;
    const p = slot(rank);
    const pt = svg.createSVGPoint();
    pt.x = (m?.e ?? 0) + p.x;
    pt.y = (m?.f ?? 0) + p.y;
    const q = ctm ? pt.matrixTransform(ctm) : { x: 0, y: 0 };
    return { x: q.x, y: q.y };
  };

  const setPressed = (side: Side, i: number, on: boolean) => {
    const b = buttons[side][i];
    b.setAttribute('aria-pressed', String(on));
    b.classList.toggle('is-on', on);
  };

  const place = (side: Side, i: number) => {
    if (placed[side][i]) return;
    placed[side][i] = true;
    setPressed(side, i, true);
    const rank = placed[side].slice(0, i).filter(Boolean).length;
    const w = makeWeight(side, i);
    updateStatus();
    const finish = () => {
      busy--;
      layout(side);
      if (count() === total()) complete();
    };
    if (reduced) {
      gsap.set(w, slot(rank));
      layout(side, false);
      settle();
      if (count() === total()) complete();
      return;
    }
    gsap.set(w, { opacity: 0, scale: 0.4 });
    busy++;
    const b = buttons[side][i];
    const from = b.getBoundingClientRect();
    const fx = from.left + 22, fy = from.top + from.height / 2;
    const fly = h('span.contract-fly', { '--c': sides[side].color }, i + 1);
    document.body.appendChild(fly);
    const prog = { t: 0 };
    const arcH = 110 + Math.random() * 40;
    gsap.set(fly, { x: fx, y: fy, xPercent: -50, yPercent: -50 });
    gsap.to(prog, {
      t: 1,
      duration: 0.85,
      ease: 'power1.inOut',
      onUpdate: () => {
        const to = slotClient(side, rank);
        const x = fx + (to.x - fx) * prog.t;
        const y = fy + (to.y - fy) * prog.t - Math.sin(prog.t * Math.PI) * arcH;
        gsap.set(fly, { x, y, scale: 1 - prog.t * 0.25, rotate: prog.t * 220 });
      },
      onComplete: () => {
        fly.remove();
        gsap.to(w, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(3)' });
        finish();
      },
    });
    // чаша начинает крениться, как только жетон взлетел
    gsap.delayedCall(0.45, settle);
    scope.add(() => fly.remove());
  };

  const remove = (side: Side, i: number) => {
    if (!placed[side][i]) return;
    placed[side][i] = false;
    setPressed(side, i, false);
    const w = pans[side].weights.get(i);
    pans[side].weights.delete(i);
    if (w) {
      if (reduced) w.remove();
      else gsap.to(w, { opacity: 0, scale: 0.3, duration: 0.3, onComplete: () => w.remove() });
    }
    undone();
    layout(side);
    settle();
    updateStatus();
  };

  const toggle = (side: Side, i: number) => (placed[side][i] ? remove(side, i) : place(side, i));

  (['state', 'person'] as Side[]).forEach((side) =>
    buttons[side].forEach((b, i) => scope.on(b, 'click', () => toggle(side, i))),
  );
  scope.on(btnAll, 'click', () => {
    const queue: [Side, number][] = [];
    const n = Math.max(placed.state.length, placed.person.length);
    for (let i = 0; i < n; i++) (['state', 'person'] as Side[]).forEach((sd) => { if (i < placed[sd].length && !placed[sd][i]) queue.push([sd, i]); });
    queue.forEach(([sd, i], k) => {
      if (reduced) place(sd, i);
      else gsap.delayedCall(k * 0.3, () => place(sd, i));
    });
  });
  scope.on(btnReset, 'click', () => {
    (['state', 'person'] as Side[]).forEach((sd) => placed[sd].forEach((_, i) => remove(sd, i)));
    status.textContent = t('Весы пусты. Выберите обязательство ниже.');
  });
  updateStatus();
  scope.add(() => { gsap.killTweensOf(sim); document.querySelectorAll('.contract-fly').forEach((n) => n.remove()); void busy; });

  const out = h('div.contract-balance-wrap', null, wrap);
  return out;
}

/* ───────────────────────── ПУТЬ ЦЕННОСТИ ───────────────────────── */
function pathBlock(scope: Scope, c: typeof concept.contract): HTMLElement {
  const reduced = prefersReducedMotion();
  const [, , p3, p4] = c.paragraphs;
  const stages = c.path;

  const svg = s('svg', { class: 'contract-path__svg', 'aria-hidden': 'true', focusable: 'false' });
  const track = s('path', { class: 'contract-path__track' });
  const line = s('path', { class: 'contract-path__line' });
  svg.append(track, line);

  const stationEls: HTMLElement[] = [];
  const dotEls: HTMLElement[] = [];
  const mkStation = (name: string, i: number) => {
    const dot = h('span.contract-st__dot', { 'aria-hidden': 'true' });
    const card = h('div.contract-st__card', null, h('span.contract-st__k', null, String(i + 1).padStart(2, '0')), h('h4.contract-st__t', null, name));
    const el = h('li.contract-st', { class: i % 2 ? 'is-right' : 'is-left' }, dot, card);
    stationEls.push(el);
    dotEls.push(dot);
    return el;
  };
  const stations = stages.map(mkStation);
  const grpA = h(
    'li.contract-grp.contract-grp--edu',
    null,
    h('span.contract-grp__label', null, t('Правовое просвещение')),
    h('ol.contract-grp__list', null, stations.slice(0, 2)),
  );
  const grpB = h(
    'li.contract-grp.contract-grp--hak',
    null,
    h('span.contract-grp__label', null, t('ХАҚ — дальше, до практики')),
    h('ol.contract-grp__list', null, stations.slice(2)),
  );
  const list = h('ol.contract-path__list', null, grpA, grpB);
  const holder = h('div.contract-path__holder', null, svg, list);

  const noteA = h('p.contract-path__note', null, t('Правовое просвещение обеспечивает первые этапы этого пути, но не последующие.'));
  const goal = h(
    'div.contract-goal',
    null,
    h('span.contract-goal__k', null, t('Конечная цель')),
    h('p.contract-goal__t.quote', null, p4),
  );
  const title = h('h3.t-l.contract-path__title', null, t('Путь ценности: от текста к норме жизни'));
  const intro = h('p.muted.contract-path__intro', null, p3);

  const el = h('div.wrap.contract-path.stack', { '--gap': 'clamp(28px,4vw,56px)' }, h('div.stack', { '--gap': '16px' }, h('p.eyebrow', null, t('Путь ценности')), title, intro), holder, noteA, goal);
  scope.add(revealWords(title));
  scope.add(reveal([intro, noteA, goal], { y: 40 }));

  let total = 1;
  let fracs: number[] = [];
  const build = () => {
    const hb = holder.getBoundingClientRect();
    if (hb.width < 10) return;
    const pts = dotEls.map((d) => {
      const r = d.getBoundingClientRect();
      return { x: r.left - hb.left + r.width / 2, y: r.top - hb.top + r.height / 2 };
    });
    svg.setAttribute('viewBox', `0 0 ${hb.width} ${hb.height}`);
    svg.setAttribute('width', String(hb.width));
    svg.setAttribute('height', String(hb.height));
    let d = `M${pts[0].x} ${pts[0].y - 30} L${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const my = (a.y + b.y) / 2;
      d += ` C${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y}`;
    }
    d += ` L${pts[pts.length - 1].x} ${pts[pts.length - 1].y + 40}`;
    [track, line].forEach((p) => p.setAttribute('d', d));
    total = (line as unknown as SVGPathElement).getTotalLength();
    line.style.strokeDasharray = `${total}`;
    // доля длины для каждой станции
    fracs = pts.map((p) => {
      let lo = 0, hi = total;
      for (let k = 0; k < 18; k++) {
        const mid = (lo + hi) / 2;
        const q = (line as unknown as SVGPathElement).getPointAtLength(mid);
        if (q.y < p.y) lo = mid; else hi = mid;
      }
      return lo / total;
    });
    apply(progress);
  };

  let progress = reduced ? 1 : 0;
  const apply = (p: number) => {
    progress = p;
    const off = total * (1 - p);
    line.style.strokeDashoffset = `${off}`;
    dotEls.forEach((d, i) => {
      const on = p >= (fracs[i] ?? 2) - 0.004;
      if (d.classList.contains('is-on') !== on) {
        d.classList.toggle('is-on', on);
        stationEls[i].classList.toggle('is-on', on);
        if (on && !reduced) gsap.fromTo(d, { scale: 1.6 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1,0.4)' });
      }
    });
  };

  requestAnimationFrame(() => {
    build();
    if (!reduced) {
      const st = ScrollTrigger.create({
        trigger: holder,
        start: 'top 65%',
        end: 'bottom 55%',
        scrub: 0.4,
        onUpdate: (self) => apply(self.progress),
      });
      scope.add(() => st.kill());
    }
  });
  scope.on(window, 'resize', () => build());
  scope.on(window, 'load', () => build());
  document.fonts?.ready.then(() => build());
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => build());
    ro.observe(holder);
    scope.add(() => ro.disconnect());
  }

  // скобки групп проявляются по скроллу
  if (!reduced) {
    [grpA, grpB].forEach((g) => {
      const tw = gsap.fromTo(g, { '--br': 0 }, { '--br': 1, ease: 'none', scrollTrigger: { trigger: g, start: 'top 75%', end: 'bottom 60%', scrub: true } });
      scope.add(() => { tw.scrollTrigger?.kill(); tw.kill(); });
    });
  } else {
    [grpA, grpB].forEach((g) => g.style.setProperty('--br', '1'));
  }
  return el;
}
