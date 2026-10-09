// «Мой ХАҚ»: радар (паутина) по 10 ценностям, полигоны по аудиториям.
import { t } from '../engine/i18n';
import './profile.css';
import { h } from '../engine/dom';
import { rosette } from '../engine/ornament';
import type { Scope } from '../engine/page';
import { gsap, prefersReducedMotion } from '../engine/motion';
import { VALUES, AUDIENCE_LABEL } from '../engine/theme';
import { score, onAnswers } from '../engine/store';
import { values, valueById } from '../content';
import type { AudienceId } from '../content';

export const AUDIENCES: AudienceId[] = ['person', 'organization', 'society', 'state'];
export const AUD_COLOR: Record<AudienceId, string> = { person: '#d6aa4c', organization: '#19b6d2', society: '#efe8d8', state: '#d98a7a' };

export const testLen = (vid: string, a: AudienceId) => values.find((v) => v.id === vid)!.audiences.find((x) => x.id === a)?.test.length ?? 0;
export const audScore = (vid: string, a: AudienceId) => score(vid as never, a, testLen(vid, a));
export const audTotals = (a: AudienceId) => {
  let answered = 0, total = 0;
  for (const m of VALUES) { answered += audScore(m.id, a).answered; total += testLen(m.id, a); }
  return { answered, total };
};

const NS = 'http://www.w3.org/2000/svg';
function S<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number> = {}, ...kids: Node[]): SVGElementTagNameMap[K] {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  kids.forEach((k) => el.appendChild(k));
  return el;
}

const W = 640, C = 320, R = 185;
const N = VALUES.length;
const ang = (i: number) => ((-90 + (360 / N) * i) * Math.PI) / 180;
const pt = (i: number, r: number): [number, number] => [C + r * Math.cos(ang(i)), C + r * Math.sin(ang(i))];
const poly = (vals: number[]) => vals.map((v, i) => pt(i, R * v).map((n) => n.toFixed(1)).join(',')).join(' ');

interface Aud { id: AudienceId; cur: number[]; g: SVGGElement; poly: SVGPolygonElement; dots: SVGCircleElement[]; tw?: gsap.core.Tween; on: boolean }

export interface Radar {
  el: HTMLElement;
  primary(): AudienceId;
  onPrimary(cb: (a: AudienceId) => void): void;
}

export function profileRadar(scope: Scope): Radar {
  const calm = prefersReducedMotion();
  const listeners: ((a: AudienceId) => void)[] = [];

  // выбор аудиторий: порядок важен, первая — «главная»
  let sel: AudienceId[] = ['person'];
  const personNone = audTotals('person').answered === 0;
  if (personNone) {
    const other = AUDIENCES.find((a) => audTotals(a).answered > 0);
    if (other) sel = [other];
  }

  // ---- SVG ----
  const svg = S('svg', { viewBox: `0 18 ${W} ${W - 30}`, class: 'prof-radar__svg', role: 'img', 'aria-labelledby': 'prof-radar-t' });
  svg.appendChild(Object.assign(S('title', { id: 'prof-radar-t' }), { textContent: t('Радар ХАҚ: доля ответов «Да» по десяти ценностям') }));
  const centerBig = h('b.prof-read__n');
  const centerSmall = h('span.prof-read__l.mono');
  const gridG = S('g', { class: 'prof-radar__grid' });
  for (let k = 1; k <= 4; k++) gridG.appendChild(S('polygon', { points: poly(Array(N).fill(k / 4)), class: k === 4 ? 'is-edge' : '' }));
  gridG.appendChild(S('circle', { cx: C, cy: C, r: R + 12, class: 'is-outer' }));
  for (let i = 0; i < N; i++) {
    const [x, y] = pt(i, R);
    gridG.appendChild(S('line', { x1: C, y1: C, x2: x, y2: y }));
  }
  svg.appendChild(gridG);

  const ros = rosette('prof-radar__ros');
  ros.setAttribute('x', String(C - 40)); ros.setAttribute('y', String(C - 40)); ros.setAttribute('width', '80'); ros.setAttribute('height', '80');
  svg.appendChild(ros);
  const spokes = VALUES.map((_, i) => {
    const [x, y] = pt(i, R);
    const l = S('line', { x1: C, y1: C, x2: x, y2: y, class: 'prof-spoke' });
    svg.appendChild(l);
    return l;
  });
  const ghost = S('polygon', { points: poly(Array(N).fill(0.38)), class: 'prof-radar__ghost' });
  svg.appendChild(ghost);

  const auds: Aud[] = AUDIENCES.map((id) => {
    const p = S('polygon', { class: 'prof-poly', fill: AUD_COLOR[id], stroke: AUD_COLOR[id] });
    const dots = VALUES.map((m) => S('circle', { r: 3.5, fill: m.color, stroke: AUD_COLOR[id], 'stroke-width': 1, class: 'prof-dot' }));
    const g = S('g', { class: 'prof-aud', 'data-aud': id }, p, ...dots);
    svg.appendChild(g);
    return { id, cur: Array(N).fill(0), g, poly: p, dots, on: sel.includes(id) };
  });
  const draw = (a: Aud) => {
    a.poly.setAttribute('points', poly(a.cur));
    a.dots.forEach((d, i) => { const [x, y] = pt(i, R * a.cur[i]); d.setAttribute('cx', x.toFixed(1)); d.setAttribute('cy', y.toFixed(1)); });
  };
  const targets = (a: AudienceId) => VALUES.map((m) => audScore(m.id, a).value);

  // подписи осей: иконка + KZ-имя, ссылка на ценность
  const labels = VALUES.map((m, i) => {
    const [x, y] = pt(i, R + 50);
    const a = S('a', { href: `#/value/${m.id}`, class: 'prof-lbl', 'aria-label': `${m.kz}, ${m.ru}`, style: `--c:${m.color}` },
      S('circle', { cx: x, cy: y, r: 24, class: 'prof-lbl__bg' }),
      S('image', { href: m.icon, x: x - 14, y: y - 14, width: 28, height: 28 }),
      Object.assign(S('text', { x, y: Math.sin(ang(i)) < -0.5 ? y - 34 : y + 42, 'text-anchor': 'middle', class: 'prof-lbl__t' }), { textContent: m.kz }));
    const open = () => showTip(i, false);
    a.addEventListener('pointerenter', (e) => { if ((e as PointerEvent).pointerType !== 'touch') open(); });
    a.addEventListener('focus', open);
    a.addEventListener('pointerleave', () => hideTip());
    a.addEventListener('blur', () => hideTip());
    a.addEventListener('click', (e) => {
      // на касании первый тап — подсказка под диаграммой, переход — по ссылке в подсказке
      if (matchMedia('(hover: none)').matches) { e.preventDefault(); showTip(i, true); }
    });
    return a;
  });
  labels.forEach((l) => svg.appendChild(l));

  // ---- состояние «нет ответов», подсказка, сводка ----
  const tip = h('div.prof-tip', { role: 'status', hidden: true });
  let tipFor = -1, tipTimer = 0, tipSticky = false;
  const idxPct = (id: string) => { const p = audScore(id, sel[0]); return p.answered ? Math.round(p.value * 100) : null; };
  function fillTip(i: number) {
    const m = VALUES[i];
    const v = valueById(m.id)!;
    const p = audScore(m.id, sel[0]);
    const total = testLen(m.id, sel[0]);
    tip.style.setProperty('--c', m.color);
    tip.textContent = '';
    tip.append(
      h('div.prof-tip__h', null, h('b', null, m.kz), h('span', null, m.ru)),
      h('p.prof-tip__q', null, v.criterion),
      h('p.prof-tip__s', null,
        h('span', null, t('Отвечено {n} из {m}', { n: p.answered, m: total })),
        p.answered ? h('span', null, t('ХАҚ-индекс '), h('b', null, `${Math.round(p.value * 100)}%`)) : h('span', null, t('ХАҚ-индекс: нет ответов'))),
      h('a.prof-tip__a', { href: `#/value/${m.id}` }, p.answered >= total ? t('Открыть ценность →') : t('Ответить на вопросы →')));
  }
  function showTip(i: number, sticky: boolean) {
    clearTimeout(tipTimer);
    tipFor = i; tipSticky = sticky;
    fillTip(i);
    tip.hidden = false;
    // позиция рядом с медальоном (на касании — подпись под диаграммой, см. CSS)
    const [x, y] = pt(i, R + 50);
    const box = root.querySelector('.prof-radar__box') as HTMLElement;
    const bw = box.clientWidth, bh = svg.getBoundingClientRect().height;
    const px = (x / W) * bw, py = ((y - 18) / (W - 30)) * bh;
    const tw = Math.min(300, bw - 8);
    tip.style.width = tw + 'px';
    tip.style.left = Math.max(0, Math.min(bw - tw, px - tw / 2)) + 'px';
    const below = py < bh / 2;
    tip.style.top = below ? py + 34 + 'px' : 'auto';
    tip.style.bottom = below ? 'auto' : bh - py + 34 + 'px';
    root.querySelectorAll('.prof-lbl').forEach((l, k) => l.classList.toggle('is-open', k === i));
    renderCenter();
  }
  function hideTip() {
    if (tipSticky) return;
    clearTimeout(tipTimer);
    tipTimer = window.setTimeout(() => { if (tipSticky) return; tip.hidden = true; tipFor = -1; root.querySelectorAll('.prof-lbl').forEach((l) => l.classList.remove('is-open')); renderCenter(); }, 220);
  }
  tip.addEventListener('pointerenter', () => clearTimeout(tipTimer));
  tip.addEventListener('pointerleave', hideTip);
  tip.addEventListener('focusin', () => clearTimeout(tipTimer));
  tip.addEventListener('focusout', hideTip);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !tip.hidden) { tipSticky = false; tip.hidden = true; } });
  scope.add(() => clearTimeout(tipTimer));

  const summary = h('div.prof-sum');
  function renderSummary() {
    const a = sel[0];
    const rows = VALUES.map((m) => ({ m, p: audScore(m.id, a) })).filter((x) => x.p.answered);
    const tt = audTotals(a);
    const left = tt.total - tt.answered;
    summary.textContent = '';
    const bits: (HTMLElement | string)[] = [];
    if (rows.length) {
      rows.sort((x, y) => y.p.value - x.p.value);
      const top = rows[0], low = rows[rows.length - 1];
      if (top.p.value === low.p.value && (top.p.value === 0 || top.p.value === 1)) bits.push(h('p', null, top.p.value === 0 ? t('Во всех отвеченных вопросах стоит «Нет» — многоугольник собран в центре.') : t('Во всех отвеченных вопросах стоит «Да» — многоугольник растянут до края.')));
      else bits.push(h('p', null, t('Чаще всего «Да»: '), h('b', null, top.m.kz), ` — ${Math.round(top.p.value * 100)}%`));
      if (rows.length > 1 && top.p.value !== low.p.value) bits.push(h('p', null, t('Реже всего «Да»: '), h('b', null, low.m.kz), ` — ${Math.round(low.p.value * 100)}%`));
      if (rows.length < VALUES.length) bits.push(h('p.dim', null, t('Ответов нет у {n} из {m} ценностей — они на радаре пунктиром.', { n: VALUES.length - rows.length, m: VALUES.length })));
    } else bits.push(h('p', null, t('Ответов пока нет — радар пуст. Один ответ уже оживит его.')));
    let act: HTMLElement | null = null;
    if (left > 0) {
      bits.push(h('p', null, t('Осталось {n} из {m} вопросов ({a}).', { n: left, m: tt.total, a: t(AUDIENCE_LABEL[a]).toLowerCase() })));
      if (a === 'person') {
        act = h('button.btn', { type: 'button', onclick: () => {
          const b = document.querySelector('#prof-quiz [data-act="start-test"]') as HTMLElement | null;
          b?.scrollIntoView({ behavior: 'smooth', block: 'center' }); b?.click();
        } }, tt.answered ? t('Продолжить тест') : t('Начать тест'));
      } else {
        const nxt = VALUES.find((m) => audScore(m.id, a).answered < testLen(m.id, a));
        if (nxt) act = h('a.btn', { href: `#/value/${nxt.id}` }, t('Ответить: {v}', { v: nxt.kz }));
      }
    } else bits.push(h('p', null, t('Все вопросы этой аудитории отвечены. Любой ответ можно изменить — радар перерисуется сразу.')));
    summary.append(...bits, ...(act ? [act] : []));
  }

  function renderCenter() {
    const tt = audTotals(sel[0]);
    centerBig.style.color = '';
    if (tipFor >= 0) {
      const m = VALUES[tipFor]; const pc = idxPct(m.id);
      centerBig.textContent = pc == null ? '—' : pc + '%';
      centerBig.style.color = m.color;
      centerSmall.textContent = t('{v}: ХАҚ-индекс', { v: m.kz });
      return;
    }
    if (!tt.answered) { centerBig.textContent = 'ХАҚ'; centerSmall.textContent = t('пока пусто'); return; }
    let sum = 0, n = 0;
    VALUES.forEach((m) => { const p = audScore(m.id, sel[0]); if (p.answered) { sum += p.value; n++; } });
    centerBig.textContent = Math.round((sum / n) * 100) + '%';
    centerSmall.textContent = t('ХАҚ-индекс: среднее по ответам');
  }
  function renderStates() {
    VALUES.forEach((m, i) => {
      const none = audScore(m.id, sel[0]).answered === 0;
      spokes[i].classList.toggle('is-none', none);
      labels[i].classList.toggle('is-none', none);
      const lt = labels[i].querySelector('.prof-lbl__t') as SVGTextElement;
      lt.textContent = none ? t('{v} · нет ответов', { v: m.kz }) : m.kz;
    });
    renderSummary();
    if (tipFor >= 0) fillTip(tipFor);
  }

  // ---- анимация ----
  function tweenTo(a: Aud, to: number[], dur = 1.2) {
    a.tw?.kill();
    if (calm) { a.cur = to.slice(); draw(a); return; }
    const from = a.cur.slice();
    const o = { p: 0 };
    a.tw = gsap.to(o, { p: 1, duration: dur, ease: 'power3.out', onUpdate: () => { for (let i = 0; i < N; i++) a.cur[i] = from[i] + (to[i] - from[i]) * o.p; draw(a); } });
  }
  const syncVisibility = (instant = false) => {
    auds.forEach((a) => {
      const on = sel.includes(a.id);
      if (on && !a.on) { a.cur = Array(N).fill(0); tweenTo(a, targets(a.id)); }
      a.on = on;
      const prim = sel[0] === a.id;
      const o = on ? (prim ? 1 : 0.85) : 0;
      if (instant || calm) gsap.set(a.g, { opacity: o }); else gsap.to(a.g, { opacity: o, duration: 0.5 });
      a.g.classList.toggle('is-primary', prim);
      a.g.style.pointerEvents = 'none';
    });
    const empty = !AUDIENCES.some((a) => sel.includes(a) && audTotals(a).answered > 0);
    ghost.style.opacity = empty ? '1' : '0';
    root.classList.toggle('is-empty', empty);
    renderStates();
    renderCenter();
  };

  // ---- чипы ----
  const chipEls = AUDIENCES.map((id) => {
    const b = h('button.prof-chip', { type: 'button', '--c': AUD_COLOR[id], 'aria-pressed': String(sel.includes(id)) },
      h('i'), h('span', null, t(AUDIENCE_LABEL[id])), h('small.mono'));
    b.addEventListener('click', () => {
      const i = sel.indexOf(id);
      if (i >= 0) { if (sel.length === 1) return; sel.splice(i, 1); }
      else sel.push(id);
      afterSel();
    });
    return b;
  });
  const updateChips = () => chipEls.forEach((b, k) => {
    const id = AUDIENCES[k];
    b.setAttribute('aria-pressed', String(sel.includes(id)));
    const tt = audTotals(id);
    (b.querySelector('small') as HTMLElement).textContent = `${tt.answered}/${tt.total}`;
  });
  let lastPrimary = sel[0];
  function afterSel() {
    updateChips();
    syncVisibility();
    if (sel[0] !== lastPrimary) { lastPrimary = sel[0]; listeners.forEach((cb) => cb(lastPrimary)); }
  }

  const root = h('div.prof-radar', null,
    h('div.prof-radar__chips', { role: 'group', 'aria-label': t('Чей взгляд: аудитория') }, chipEls),
    h('div.prof-read', { 'aria-live': 'polite' }, centerBig, centerSmall),
    h('div.prof-radar__box', null, svg, tip,
      h('p.prof-radar__empty', null, t('Пока здесь пусто — ответьте на несколько вопросов, и ХАҚ проступит.'))),
    summary,
    h('div.prof-how', null,
      h('h3', null, t('Как читать радар')),
      h('ul', null,
        h('li', null, t('Десять лучей — десять ценностей ХАҚ. Нажмите или наведите на значок: увидите вопрос ценности и ваши ответы.')),
        h('li', null, t('Чем дальше точка от центра, тем чаще ответ «Да»: центр — «Нет», середина — «Не всегда», край — «Да».')),
        h('li', null, t('Вкладки сверху меняют взгляд: человек, организация, общество, государство. Можно включить несколько и сравнить.')),
        h('li', null, h('span.prof-how__sw', { 'aria-hidden': 'true' }), t('Пунктирный луч — по этой ценности ещё нет ответов (это не ноль).')),
        h('li', null, t('Это зеркало для самопроверки, а не экзамен: ответы хранятся только у вас в браузере.')))));

  scope.add(onAnswers(() => {
    auds.forEach((a) => { if (sel.includes(a.id)) tweenTo(a, targets(a.id), 0.8); else { a.cur = targets(a.id); draw(a); } });
    updateChips();
    syncVisibility(true);
  }));
  scope.add(() => auds.forEach((a) => a.tw?.kill()));

  // начальное состояние + вход
  auds.forEach((a) => { draw(a); });
  updateChips();
  syncVisibility(true);
  auds.forEach((a) => { if (sel.includes(a.id)) tweenTo(a, targets(a.id), 1.6); else { a.cur = targets(a.id); draw(a); } });
  if (!calm) {
    gsap.from(gridG.querySelectorAll('polygon'), { opacity: 0, svgOrigin: `${C} ${C}`, scale: 0.4, duration: 1.1, ease: 'expo.out', stagger: 0.1 });
    gsap.from(labels, { opacity: 0, duration: 0.7, stagger: 0.06, delay: 0.3 });
    gsap.from(root, { opacity: 0, y: 30, duration: 0.9, ease: 'expo.out' });
  }

  return {
    el: root,
    primary: () => sel[0],
    onPrimary: (cb) => { listeners.push(cb); },
  };
}
