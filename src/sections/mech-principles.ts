import { t } from '../engine/i18n';
import './mech-principles.css';
import { h } from '../engine/dom';
import { prefersReducedMotion, reveal, revealWords, gsap } from '../engine/motion';
import { svg as orn } from '../engine/ornament';
import type { Scope } from '../engine/page';
import { mechanisms } from '../content';
import { sectionHead, nextId } from './mech-util';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const W = 800, H = 640, CX = 400, CY = 320, R0 = 76, R1 = 236;

const f = (n: number) => +n.toFixed(1);
const ang = (i: number) => ((i * 60 - 90) * Math.PI) / 180;

/** Шаңырақ с шестью уықи (опорами-лучами). Каждый уық — слегка изогнутая линия. */
function shanyrakSvg(n: number) {
  let crown = `<circle cx="${CX}" cy="${CY}" r="${R0}" /><circle cx="${CX}" cy="${CY}" r="${R0 - 7}" />`;
  crown += `<path d="M${CX - R0 + 7} ${CY} Q${CX} ${CY - 60} ${CX + R0 - 7} ${CY} M${CX - R0 + 7} ${CY} Q${CX} ${CY + 60} ${CX + R0 - 7} ${CY} M${CX} ${CY - R0 + 7} Q${CX - 60} ${CY} ${CX} ${CY + R0 - 7} M${CX} ${CY - R0 + 7} Q${CX + 60} ${CY} ${CX} ${CY + R0 - 7}" />`;
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    crown += `<path d="M${f(CX + Math.cos(a) * (R0 + 2))} ${f(CY + Math.sin(a) * (R0 + 2))} L${f(CX + Math.cos(a) * (R0 + 7))} ${f(CY + Math.sin(a) * (R0 + 7))}" opacity=".6"/>`;
  }
  let eave = `<circle cx="${CX}" cy="${CY}" r="${R1 + 16}" stroke-dasharray="1 7" stroke-linecap="round"/>`;
  let poles = '', lit = '', tips = '';
  for (let i = 0; i < n; i++) {
    const a = ang(i);
    const x0 = CX + Math.cos(a) * (R0 + 8), y0 = CY + Math.sin(a) * (R0 + 8);
    const x1 = CX + Math.cos(a) * R1, y1 = CY + Math.sin(a) * R1;
    // изгиб уыка: контрольная точка смещена перпендикулярно
    const mx = (x0 + x1) / 2 - Math.sin(a) * 20, my = (y0 + y1) / 2 + Math.cos(a) * 20;
    const d = `M${f(x0)} ${f(y0)} Q${f(mx)} ${f(my)} ${f(x1)} ${f(y1)}`;
    poles += `<path class="pole" d="${d}"/>`;
    lit += `<path class="lit" data-i="${i}" d="${d}" pathLength="1"/>`;
    tips += `<circle class="tip" data-i="${i}" cx="${f(x1)}" cy="${f(y1)}" r="4"/><text class="rn" data-i="${i}" x="${f(CX + Math.cos(a) * (R1 + 28))}" y="${f(CY + Math.sin(a) * (R1 + 28) + 5)}" text-anchor="middle">${ROMAN[i]}</text>`;
  }
  return orn(`0 0 ${W} ${H}`, `<g class="crown">${crown}</g><g class="eave">${eave}</g><g class="poles">${poles}</g><g class="lits">${lit}</g><g class="tips">${tips}</g>`, 'mech-yurt__svg');
}

export function mechPrinciples(scope: Scope): HTMLElement {
  const items = mechanisms.principles;
  const n = items.length;
  const head = sectionHead(t('III · Принципы'), t('Шесть опор, на которых держится венец'));
  scope.add(revealWords(head.title));
  const uidp = nextId('pr');

  const svgEl = shanyrakSvg(n);
  const lits = Array.from(svgEl.querySelectorAll<SVGPathElement>('.lit'));
  const tips = Array.from(svgEl.querySelectorAll<SVGCircleElement>('.tip'));
  const rns = Array.from(svgEl.querySelectorAll<SVGTextElement>('.rn'));

  const tablist = h('div.mech-yurt__tabs', { role: 'tablist', 'aria-label': t('Принципы продвижения ХАҚ') });
  const tabs: HTMLButtonElement[] = items.map((it, i) => {
    const a = ang(i);
    const x = CX + Math.cos(a) * (R1 + 18), y = CY + Math.sin(a) * (R1 + 18);
    const side = Math.abs(Math.cos(a)) < 0.2 ? 'mid' : Math.cos(a) > 0 ? 'right' : 'left';
    const t = h('button.mech-yurt__tab', {
      type: 'button', role: 'tab', id: `${uidp}-t${i}`, 'aria-selected': 'false', 'aria-controls': `${uidp}-p`, tabindex: '-1',
      '--x': (x / W) * 100 + '%', '--y': (y / H) * 100 + '%', 'data-side': side, 'data-v': Math.sin(a) < -0.2 ? 'top' : Math.sin(a) > 0.2 ? 'bot' : 'mid',
    }, h('span.mech-yurt__n', null, ROMAN[i]), h('span.mech-yurt__name', null, it.name));
    tablist.append(t);
    return t;
  });

  const stage = h('div.mech-yurt__stage', null, svgEl, tablist);

  const pNum = h('p.mech-yurt__pnum');
  const pTitle = h('h3.mech-yurt__ptitle');
  const pText = h('p.mech-yurt__ptext');
  const bar = h('i.mech-yurt__timer');
  const panel = h('div.mech-yurt__panel', { role: 'tabpanel', id: `${uidp}-p`, 'aria-live': 'polite', tabindex: '0' }, bar, pNum, pTitle, pText);

  let cur = -1;
  let userTouched = false;
  let timer = 0;
  let visible = false;
  const DUR = 7000;
  const restartTimer = () => {
    window.clearTimeout(timer);
    bar.style.animation = 'none';
    void bar.offsetWidth;
    if (userTouched || prefersReducedMotion() || !visible) { bar.style.opacity = '0'; return; }
    bar.style.opacity = '1';
    bar.style.animation = `mech-timer ${DUR}ms linear forwards`;
    timer = window.setTimeout(() => select((cur + 1) % n), DUR);
  };
  const select = (i: number, focus = false) => {
    const first = cur < 0;
    cur = i;
    const it = items[i];
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    lits.forEach((l, k) => l.classList.toggle('on', k === i));
    tips.forEach((l, k) => l.classList.toggle('on', k === i));
    rns.forEach((l, k) => l.classList.toggle('on', k === i));
    panel.setAttribute('aria-labelledby', tabs[i].id);
    const swap = () => {
      pNum.textContent = `${ROMAN[i]} / ${ROMAN[n - 1]}`;
      pTitle.textContent = it.name;
      pText.textContent = it.text;
    };
    if (first || prefersReducedMotion()) swap();
    else {
      gsap.killTweensOf([pTitle, pText]);
      gsap.to([pTitle, pText], { opacity: 0, y: -6, duration: 0.2, onComplete: () => { swap(); gsap.fromTo([pTitle, pText], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.08 }); } });
    }
    if (focus) tabs[i].focus();
    restartTimer();
  };
  const touch = () => { if (!userTouched) { userTouched = true; restartTimer(); } };

  tabs.forEach((t, i) => {
    scope.on(t, 'click', () => { touch(); select(i); });
    scope.on(t, 'keydown', ((e: KeyboardEvent) => {
      let j = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % n;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i + n - 1) % n;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = n - 1;
      if (j >= 0) { e.preventDefault(); touch(); select(j, true); }
    }) as EventListener);
  });
  scope.on(panel, 'pointerdown', touch);
  select(0);

  const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; restartTimer(); }, { threshold: 0.4 });
  io.observe(stage);
  scope.add(() => { io.disconnect(); window.clearTimeout(timer); });

  const el = h('section.section.mech-yurt', null, h('div.wrap', null, head.el, h('div.mech-yurt__grid', null, stage, panel)));
  scope.add(reveal(stage, { y: 40 }));
  if (!prefersReducedMotion()) {
    gsap.from(svgEl.querySelectorAll('.crown path, .crown circle'), { opacity: 0, duration: 1.2, stagger: 0.015, scrollTrigger: { trigger: stage, start: 'top 80%', once: true } });
  }
  return el;
}
