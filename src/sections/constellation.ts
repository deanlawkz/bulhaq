// ЗОНА ОРКЕСТРАТОРА. «Созвездие» десяти ценностей: три режима раскладки одной системы.
//  ring — целостная система (все связаны со всеми), pairs — пять смысловых пар/измерений,
//  basis — конституционная основа каждой ценности.
import { t } from '../engine/i18n';
import './constellation.css';
import { h, clamp } from '../engine/dom';
import { gsap, ScrollTrigger, prefersReducedMotion, revealWords, reveal } from '../engine/motion';
import { VALUES, DIMENSIONS, valueMeta, logo } from '../engine/theme';
import { concept, valueById } from '../content';
import type { ValueId } from '../content/types';
import type { Scope } from '../engine/page';
import { rosette } from '../engine/ornament';

type Mode = 'ring' | 'pairs' | 'basis';

export function constellationSection(scope: Scope): HTMLElement {
  const reduced = prefersReducedMotion();
  const MODES: { id: Mode; label: string; text: string }[] = [
    { id: 'ring', label: t('Система'), text: concept.system.paragraphs[3] },
    { id: 'pairs', label: t('Пять пар'), text: concept.system.paragraphs[4] },
    { id: 'basis', label: t('Основа — Конституция'), text: concept.system.paragraphs[2] },
  ];
  let mode: Mode = 'ring';
  let selected: ValueId | null = null;
  let hovered: ValueId | null = null;
  let size = 600;
  let spin = 0;

  // ---------- DOM ----------
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('const__lines');
  svg.setAttribute('aria-hidden', 'true');
  const edges: { a: number; b: number; el: SVGLineElement; pair: boolean }[] = [];
  for (let a = 0; a < VALUES.length; a++) {
    for (let b = a + 1; b < VALUES.length; b++) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      const pair = VALUES[a].pair === VALUES[b].id;
      el.setAttribute('class', pair ? 'const__edge const__edge--pair' : 'const__edge');
      if (pair) el.style.setProperty('--c', DIMENSIONS[VALUES[a].dim].color);
      svg.appendChild(el);
      edges.push({ a, b, el, pair });
    }
  }
  const spokes = VALUES.map(() => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    el.setAttribute('class', 'const__spoke');
    svg.appendChild(el);
    return el;
  });

  const nodes = VALUES.map((v, i) => {
    const btn = h('button.const__node', {
      type: 'button',
      '--c': v.color,
      'aria-label': `${v.kz} — ${v.ru}`,
      'aria-pressed': 'false',
      onclick: () => select(v.id),
      onpointerenter: () => (hovered = v.id),
      onpointerleave: () => (hovered = null),
      onfocus: () => (hovered = v.id),
      onblur: () => (hovered = null),
    },
      h('span.const__icon', null, h('img', { src: v.icon, alt: '' })),
      h('span.const__kz', null, v.kz),
    );
    return { v, i, btn, x: 0, y: 0, tx: 0, ty: 0, born: 0 };
  });

  const dimLabels = DIMENSIONS.map((d, k) => {
    const pair = concept.system.pairs[k];
    return { el: h('span.const__dim', { '--c': d.color, title: pair?.dimension }, t(d.name).replace(/^Измерение /, '').replace(/ өлшемі$/, '')), x: 0, y: 0 };
  });

  const hub = h('div.const__hub', null, rosette('orn const__rosette'), h('img', { src: logo, alt: 'ХАҚ' }), h('span', null, t('10 ценностей · 5 измерений')));
  const stage = h('div.const__stage', null, svg, hub, dimLabels.map((d) => d.el), nodes.map((n) => n.btn));

  const modeText = h('p.const__mode-text', null, MODES[0].text);
  const modeBtns = MODES.map((m) =>
    h('button.chip', { type: 'button', role: 'tab', 'aria-selected': String(m.id === mode), onclick: () => setMode(m.id) }, m.label),
  );
  const detail = h('div.const__detail.glass', { 'aria-live': 'polite' });
  const title = h('h2.t-l', null, concept.system.title);

  const el = h('section.section.const', { id: 'values' },
    h('div.wrap.const__grid', null,
      h('div.const__copy.stack', { '--gap': '22px' },
        h('p.eyebrow', null, t('I · 04 · Система ценностей')),
        title,
        h('div.const__modes.row', { role: 'tablist', 'aria-label': t('Режим'), '--gap': '8px' }, modeBtns),
        modeText,
        detail,
      ),
      stage,
    ),
  );

  // ---------- раскладки ----------
  function layout() {
    const R = size / 2;
    const cx = R, cy = R;
    if (mode === 'pairs') {
      DIMENSIONS.forEach((d, k) => {
        const a = -Math.PI / 2 + (k * Math.PI * 2) / 5;
        const pr = R * 0.64;
        const px = cx + Math.cos(a) * pr, py = cy + Math.sin(a) * pr;
        const tx = -Math.sin(a), ty = Math.cos(a); // касательная
        const off = R * 0.215;
        d.values.forEach((id, j) => {
          const n = nodes.find((n) => n.v.id === id)!;
          const s = j === 0 ? -1 : 1;
          n.tx = px + tx * off * s;
          n.ty = py + ty * off * s;
        });
        const lr = R * 0.33;
        dimLabels[k].x = cx + Math.cos(a) * lr;
        dimLabels[k].y = cy + Math.sin(a) * lr;
      });
    } else {
      const rr = R * 0.78;
      nodes.forEach((n) => {
        const a = -Math.PI / 2 + (n.i * Math.PI * 2) / VALUES.length + (mode === 'ring' ? spin : 0);
        n.tx = cx + Math.cos(a) * rr;
        n.ty = cy + Math.sin(a) * rr;
      });
    }
  }

  function setMode(m: Mode) {
    mode = m;
    stage.dataset.mode = m;
    modeBtns.forEach((b, k) => {
      b.classList.toggle('chip--on', MODES[k].id === m);
      b.setAttribute('aria-selected', String(MODES[k].id === m));
    });
    gsap.fromTo(modeText, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' });
    modeText.textContent = MODES.find((x) => x.id === m)!.text;
    renderDetail();
  }

  function select(id: ValueId) {
    selected = selected === id ? null : id;
    nodes.forEach((n) => n.btn.setAttribute('aria-pressed', String(n.v.id === selected)));
    renderDetail();
  }

  function renderDetail() {
    detail.innerHTML = '';
    const id = selected;
    if (!id) {
      if (mode === 'pairs') {
        detail.append(h('p.dim', null, t('Пары образуют пять измерений. Выберите ценность, чтобы увидеть её пару и образ страны.')));
      } else {
        detail.append(h('p.dim', null, t('Выберите ценность в созвездии, чтобы увидеть её смысл и вопрос «Бұл ХАҚ па?».')));
      }
      return;
    }
    const meta = valueMeta(id);
    const v = valueById(id)!;
    const head = h('div.const__dhead', null,
      h('span.icon-badge', { '--c': meta.color, '--s': '56px' }, h('img', { src: meta.icon, alt: '' })),
      h('div', null, h('div.kz.t-s', null, meta.kz), h('div.muted', null, `${meta.ru} — ${v.tagline}`)),
    );
    detail.style.setProperty('--c', meta.color);
    detail.append(head);
    if (mode === 'pairs') {
      const k = meta.dim;
      const pair = concept.system.pairs[k];
      const partner = valueMeta(meta.pair);
      detail.append(
        h('p.const__pair', null, h('b', null, `${meta.kz} + ${partner.kz}`), ' — ', pair.summary),
        h('p.const__image.grad-text.display', null, pair.image),
        h('p.muted.const__small', null, pair.text),
      );
    } else if (mode === 'basis') {
      const basis = concept.system.basis.find((b) => b.value === id);
      detail.append(h('p.eyebrow', null, t('Статьи Конституции')), h('p.const__small', null, basis?.articles ?? ''));
    } else {
      detail.append(h('p.eyebrow', null, 'Бұл ХАҚ па?'), h('p.const__q', null, v.criterion));
    }
    detail.append(h('a.btn.btn--accent.const__go', { href: `#/value/${id}`, style: { background: meta.color } }, t('Открыть ценность →')));
    gsap.fromTo(detail.children, { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: 0.05, duration: 0.6, ease: 'expo.out' });
  }

  // ---------- кадр ----------
  let visible = false;
  let t0 = 0;
  function frame() {
    if (!visible) return;
    const now = performance.now();
    if (!t0) t0 = now;
    if (mode === 'ring' && !hovered && !selected && !reduced) spin += 0.0012;
    layout();
    const R = size / 2;
    const focus = hovered ?? selected;
    nodes.forEach((n, k) => {
      const live = now - t0 > k * 70;
      if (!live) return;
      const ease = reduced ? 1 : 0.075;
      n.x += (n.tx - n.x) * ease;
      n.y += (n.ty - n.y) * ease;
      n.btn.style.transform = `translate(${n.x}px, ${n.y}px) translate(-50%, -50%)`;
      n.btn.classList.add('is-live');
      n.btn.classList.toggle('is-dim', !!focus && focus !== n.v.id && !(mode === 'pairs' && valueMeta(focus).pair === n.v.id));
      const s = spokes[k];
      s.setAttribute('x1', String(R)); s.setAttribute('y1', String(R));
      s.setAttribute('x2', String(n.x)); s.setAttribute('y2', String(n.y));
      s.classList.toggle('on', focus === n.v.id);
    });
    for (const e of edges) {
      const A = nodes[e.a], B = nodes[e.b];
      e.el.setAttribute('x1', String(A.x)); e.el.setAttribute('y1', String(A.y));
      e.el.setAttribute('x2', String(B.x)); e.el.setAttribute('y2', String(B.y));
      const touches = !!focus && (A.v.id === focus || B.v.id === focus);
      e.el.classList.toggle('on', touches);
    }
    dimLabels.forEach((d) => (d.el.style.transform = `translate(${d.x}px, ${d.y}px) translate(-50%, -50%)`));
  }

  const measure = () => {
    size = stage.clientWidth || 600;
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    nodes.forEach((n) => { if (!n.x) { n.x = size / 2; n.y = size / 2; } });
    stage.style.setProperty('--node', clamp(size * 0.13, 48, 84) + 'px');
  };
  const ro = new ResizeObserver(measure);
  ro.observe(stage);
  scope.add(() => ro.disconnect());

  const tick = () => frame();
  gsap.ticker.add(tick);
  scope.add(() => gsap.ticker.remove(tick));

  const st = ScrollTrigger.create({
    trigger: stage,
    start: 'top 85%',
    end: 'bottom top',
    onToggle: (self) => {
      visible = self.isActive;
      if (visible && !t0) measure();
    },
  });
  scope.add(() => st.kill());

  // при прокрутке до середины — один раз показываем пары, чтобы система «ожила»
  let autoPaired = false;
  const auto = ScrollTrigger.create({
    trigger: el,
    start: 'center 55%',
    onEnter: () => {
      if (autoPaired || selected) return;
      autoPaired = true;
      setTimeout(() => mode === 'ring' && !selected && setMode('pairs'), 400);
    },
  });
  scope.add(() => auto.kill());

  scope.add(revealWords(title));
  scope.add(reveal([modeText, detail]));
  setMode('ring');
  return el;
}
