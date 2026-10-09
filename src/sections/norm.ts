import { t } from '../engine/i18n';
import './norm.css';
import { h } from '../engine/dom';
import { gsap, prefersReducedMotion, reveal, revealWords, scrubText, magnetic } from '../engine/motion';
import { concept, mechanisms } from '../content';
import { ornamentBand, rosette, ramHorn, drawOn } from '../engine/ornament';
import type { Scope } from '../engine/page';

const NS = 'http://www.w3.org/2000/svg';
const CX = 300, CY = 300;
const R0 = 78, R1 = 268, TURNS = 3;

function spiralPath(): string {
  const pts: string[] = [];
  const n = 360;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = -Math.PI / 2 + t * TURNS * Math.PI * 2;
    const r = R0 + (R1 - R0) * t;
    pts.push(`${i ? 'L' : 'M'}${(CX + Math.cos(a) * r).toFixed(1)} ${(CY + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join('');
}
const svgEl = (tag: string, attrs: Record<string, string | number>) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
};

export function normSection(scope: Scope): HTMLElement {
  const n = concept.norm;
  const el = h('section.norm', { id: 'norm' });

  /* ================= 1. СПИРАЛЬ ================= */
  const title = h('h2.t-xl.norm-title', null, n.title);
  const lead = h('p.lead.norm-lead', null, n.paragraphs[2]);
  const head = h('div.wrap.stack.norm-head', { '--gap': '22px' }, h('p.eyebrow', null, t('06 · от ценности к норме')), title, lead);
  const band = ornamentBand(14, 'orn-band norm-band');
  el.append(h('div.wrap.norm-bandrow', null, band), h('div.norm-intro', null, head));
  scope.add(drawOn(band, { start: 'top 92%' }));
  scope.add(revealWords(title));
  scope.add(scrubText(lead, { start: 'top 82%', end: 'bottom 55%' }));

  // SVG спираль
  const svg = svgEl('svg', { viewBox: '0 0 600 600', class: 'norm-spiral', role: 'img', 'aria-label': t('Спираль: ценность, поведение, практика, норма, культурный код') }) as SVGSVGElement;
  const radii = [0, 1, 2, 3].map((i) => R0 + (R1 - R0) * ((i * 1) / TURNS));
  const rings = radii.map((r, i) => {
    const c = svgEl('circle', { cx: CX, cy: CY, r: i === 0 ? R0 - 14 : r, class: 'norm-ring' });
    svg.append(c);
    return c;
  });
  const d = spiralPath();
  svg.append(svgEl('path', { d, class: 'norm-spiral__ghost' }));
  const path = svgEl('path', { d, class: 'norm-spiral__path', pathLength: 1 });
  svg.append(path);
  const nodePos = [0, 1, 2, 3].map((i) => {
    const t = i / TURNS;
    const a = -Math.PI / 2 + t * TURNS * Math.PI * 2;
    const r = R0 + (R1 - R0) * t;
    return { x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r };
  });
  const nodes = nodePos.map((p, i) => {
    const g = svgEl('g', { class: 'norm-node', transform: `translate(${p.x} ${p.y})` });
    g.append(svgEl('circle', { r: 15, class: 'norm-node__bg' }));
    const t = svgEl('text', { class: 'norm-node__t', 'text-anchor': 'middle', y: 4.5 });
    t.textContent = String(i + 1);
    g.append(t);
    svg.append(g);
    return g;
  });
  const rose = rosette('norm-rose');
  const roseShapes = Array.from(rose.querySelectorAll<SVGGeometryElement>('path, circle')).filter((x) => x.getAttribute('fill') !== 'currentColor');
  const roseLen = roseShapes.map((x) => { let l = 400; try { l = x.getTotalLength(); } catch { /* */ } x.style.strokeDasharray = `${l} ${l}`; return l; });
  const roseWrap = h('div.norm-rosewrap', null, rose);
  const steps = [
    { t: t('Принятая ценность влияет на поведение') },
    { t: t('Повторяющееся действие превращается в устойчивую практику') },
    { t: t('Практика формирует общественное ожидание и норму') },
    { t: t('ХАҚ закрепляется как часть культурного кода казахстанского общества') },
  ];
  const stepEls = steps.map((s, i) =>
    h('li.norm-step', { 'data-i': i },
      h('span.norm-step__n.mono', null, String(i + 1).padStart(2, '0')),
      h('span.norm-step__t', null, s.t)));
  const list = h('ol.norm-steps', null, stepEls);
  const spiralWrap = h('div.norm-spiralwrap', null, svg, roseWrap);
  const spiralStage = h('div.wrap.norm-spiralstage', null, spiralWrap, list);
  const spiralSec = h('div.norm-spiralsec', null, spiralStage);
  el.append(spiralSec);

  const setStage = (p: number) => {
    // p 0..1 прогресс; этапы 0..3 и финал
    const idx = p < 0.04 ? -1 : Math.min(3, Math.floor((p - 0.04) / 0.24));
    stepEls.forEach((s, i) => {
      s.classList.toggle('is-on', i <= idx);
      s.classList.toggle('is-now', i === idx);
    });
    nodes.forEach((g, i) => g.classList.toggle('is-on', i <= idx));
    rings.forEach((r, i) => r.classList.toggle('is-on', i <= idx));
    const done = p > 0.97;
    svg.classList.toggle('is-done', done);
  };
  const draw = (p: number) => {
    const v = Math.max(0, Math.min(1, (p - 0.02) / 0.9));
    (path as SVGElement).style.strokeDashoffset = String(1 - v);
      const t = Math.max(0, Math.min(1, (p - 0.78) / 0.2));
    roseShapes.forEach((x, i) => { x.style.strokeDashoffset = String(roseLen[i] * (1 - t)); });
    roseWrap.classList.toggle('is-on', t > 0.9);
    setStage(p);
  };

  const mm = gsap.matchMedia();
  scope.add(() => mm.revert());
  mm.add('(min-width: 900px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)', () => {
    spiralSec.classList.add('norm-spiralsec--pinned');
    draw(0);
    const st = gsap.to({}, {
      scrollTrigger: { trigger: spiralSec, start: 'top top', end: '+=260%', pin: true, scrub: 0.5, onUpdate: (s) => draw(s.progress) },
    });
    return () => { spiralSec.classList.remove('norm-spiralsec--pinned'); st.scrollTrigger?.kill(); };
  });
  mm.add('(max-width: 899px), (max-height: 599px), (prefers-reduced-motion: reduce)', () => {
    if (prefersReducedMotion()) { draw(1); return; }
    draw(0);
    gsap.to({}, { scrollTrigger: { trigger: spiralSec, start: 'top 70%', end: 'bottom 70%', scrub: 0.4, onUpdate: (s) => draw(s.progress) } });
  });

  /* ================= 2. ДВА ПОТОКА -> ОПЫТ ================= */
  const p0 = n.paragraphs[0];
  // границы предложений: маркеры ru/kk, иначе — по предложениям
  const sentences = (x: string) => x.match(/[^.!?]+(?:ст\.[^.!?]*)*[.!?]+(?:\s|$)|[^.!?]+$/g)?.map((z) => z.trim()).filter(Boolean) ?? [x];
  const find = (x: string, ms: string[]) => ms.map((m) => x.indexOf(m)).find((i) => i >= 0) ?? -1;
  let iDirect = find(p0, ['Прямое продвижение раскрывает', 'Тікелей ілгерілету']);
  let iEnv = find(p0, ['Средовое продвижение создает', 'Ортаға негізделген ілгерілету']);
  if (iDirect < 0 || iEnv < 0 || iEnv < iDirect) {
    const ss = sentences(p0);
    const a = ss.slice(0, -2).join(' ');
    iDirect = a.length + (a ? 1 : 0);
    iEnv = iDirect + (ss[ss.length - 2] ?? '').length + 1;
  }
  const direct = p0.slice(iDirect, iEnv).trim();
  const envir = p0.slice(iEnv).trim();
  const lead0 = p0.slice(0, iDirect).trim();
  const p1 = n.paragraphs[1];
  let iSelf = find(p1, ['Поэтому государство', 'Сондықтан мемлекет']);
  if (iSelf < 0) iSelf = (sentences(p1)[0] ?? '').length + 1;
  const principleKey = p1.slice(0, iSelf).trim();
  const principle = p1.slice(iSelf).trim();

  const flowPaths = (v: boolean) => {
    const vb = v ? '0 0 300 200' : '0 0 300 400';
    const [a, b, m] = v
      ? ['M60 0 C 60 90, 150 80, 150 130', 'M240 0 C 240 90, 150 80, 150 130', 'M150 130 L150 200']
      : ['M0 90 C 140 90, 150 200, 220 200', 'M0 310 C 140 310, 150 200, 220 200', 'M220 200 L300 200'];
    return `<svg class="norm-flow__svg ${v ? 'norm-flow__svg--v' : 'norm-flow__svg--h'}" viewBox="${vb}" preserveAspectRatio="none" aria-hidden="true">
      <path class="nf-base" d="${a}"/><path class="nf-base" d="${b}"/><path class="nf-base" d="${m}"/>
      <path class="nf-live" d="${a}"/><path class="nf-live" d="${b}"/><path class="nf-live" d="${m}"/></svg>`;
  };
  const flowEl = h('div.norm-flow', null,
    h('div.norm-flow__streams', null,
      h('div.norm-stream', null,
        h('span.norm-stream__tag.mono', null, 'I'), h('h4.norm-stream__h', null, t('Прямое продвижение')), h('p', null, direct)),
      h('div.norm-stream', null,
        h('span.norm-stream__tag.mono', null, 'II'), h('h4.norm-stream__h', null, t('Средовое продвижение')), h('p', null, envir))),
    h('div.norm-flow__mid', { html: flowPaths(false) + flowPaths(true) }),
    h('div.norm-flow__end', null,
      h('div.norm-experience', null,
        h('span.eyebrow', null, t('один принцип')),
        h('b.norm-experience__t', null, t('опыт реального действия')),
        h('span.norm-experience__s', null, principleKey))));
  const flowTitle = h('h3.t-l', null, t('Два потока — один опыт'));
  const flowLead = h('p.norm-flow__lead', null, lead0);
  const selfCard = h('blockquote.norm-self', null,
    h('span.norm-self__orn', null, ramHorn('orn')),
    h('div', null,
      h('p.eyebrow', null, t('принцип самопроверки')),
      h('p.norm-self__t', null, principle)));
  const flowSec = h('div.norm-flowsec', null, h('div.wrap.norm-flowsec__in', null, flowTitle, flowLead, flowEl, selfCard));
  el.append(flowSec);
  scope.add(revealWords(flowTitle));
  scope.add(reveal([flowLead, selfCard]));
  scope.add(reveal(Array.from(flowEl.querySelectorAll('.norm-stream, .norm-experience'))));
  const ornSvg = selfCard.querySelector('svg');
  if (ornSvg) scope.add(drawOn(ornSvg as SVGSVGElement, { start: 'top 85%' }));
  if (!prefersReducedMotion()) {
    flowEl.querySelectorAll<SVGPathElement>('.nf-live').forEach((p) => {
      p.setAttribute('pathLength', '1');
      gsap.fromTo(p, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: flowEl, start: 'top 75%', end: 'bottom 70%', scrub: 0.6 } });
    });
  } else {
    flowEl.classList.add('is-static');
  }

  /* ================= 3. ТИЗЕР МЕХАНИЗМОВ — указатель ================= */
  const names = (items: { name: string }[]) => {
    const out: (Node | string)[] = [];
    items.forEach((m, i) => {
      if (i) out.push(h('span.norm-dot', { 'aria-hidden': 'true' }));
      out.push(h('span.norm-name', null, m.name));
    });
    return out;
  };
  const tTitle = h('h3.t-l', null, t('Механизмы, которые делают это возможным'));
  const btn = h('a.btn.btn--primary.norm-cta', { href: '#/mechanisms' },
    h('span', null, t('Открыть все механизмы')), h('span.mono', null, String(mechanisms.direct.items.length + mechanisms.environmental.items.length)), h('span', { 'aria-hidden': 'true' }, '→'));
  const idx = h('div.norm-index', null,
    h('div.norm-index__grp', null, h('span.norm-index__lab.mono', null, t('Прямое продвижение')), h('p.norm-index__list', null, names(mechanisms.direct.items))),
    h('div.norm-index__grp', null, h('span.norm-index__lab.mono', null, t('Средовое продвижение')), h('p.norm-index__list', null, names(mechanisms.environmental.items))));
  el.append(h('div.norm-teaser', null,
    h('div.wrap.norm-teaser__in', null, h('p.eyebrow', null, t('раздел III')), tTitle,
      h('p.norm-teaser__p', null, n.paragraphs[3]), idx, h('div.norm-teaser__cta', null, btn))));
  scope.add(revealWords(tTitle));
  scope.add(reveal(Array.from(idx.children)));
  scope.add(reveal(btn));
  scope.add(magnetic(btn, 0.25));

  return el;
}
