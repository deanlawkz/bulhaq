import { t } from '../engine/i18n';
import './criterion.css';
import { h } from '../engine/dom';
import { gsap, prefersReducedMotion, reveal, revealWords, scrubText, magnetic } from '../engine/motion';
import { valueMeta } from '../engine/theme';
import { concept, values } from '../content';
import { ornamentBand, illustration, drawOn } from '../engine/ornament';
import type { Scope } from '../engine/page';

const CHECK =
  '<svg viewBox="0 0 48 32" aria-hidden="true"><path pathLength="1" d="M4 17 C 10 20, 14 24, 18 28 C 24 16, 34 8, 45 3"/></svg>';
const SVGNS = 'http://www.w3.org/2000/svg';

export function criterionSection(scope: Scope): HTMLElement {
  const c = concept.criterion;
  const el = h('section.crit', { id: 'criterion' });

  const band = ornamentBand(14, 'orn-band crit-band');
  el.append(h('div.wrap.crit-bandrow', null, band));
  scope.add(drawOn(band, { start: 'top 92%' }));

  /* ============ 1. Один вопрос -> десять ============ */
  const kz = h('h2.crit-kz', { 'aria-label': c.question.kz },
    h('span', { 'aria-hidden': 'true' }, 'Бұл '), h('span.crit-kz__gold', { 'aria-hidden': 'true' }, 'ХАҚ'), h('span', { 'aria-hidden': 'true' }, ' па?'));
  const ru = h('p.crit-ru', null, c.question.ru);
  const eyebrow = h('p.eyebrow', null, '05 · ' + c.title);
  const titleBox = h('div.crit-title', null, eyebrow, kz, ru);
  const levels = h('div.crit-levels', null,
    h('div.crit-level', null, h('span.crit-level__n.mono', null, '1'), h('b', null, t('Целостная система')), h('span', null, t('один вопрос для любого решения'))),
    h('div.crit-level', null, h('span.crit-level__n.mono', null, '10'), h('b', null, t('Десять направлений')), h('span', null, t('у каждой ценности свой вопрос'))));
  const intro = h('p.crit-intro', null, c.paragraphs[0]);

  const sun = illustration('shanyrak');
  sun.classList.add('crit-sun');
  const rays = document.createElementNS(SVGNS, 'svg');
  rays.setAttribute('class', 'crit-rays');
  rays.setAttribute('aria-hidden', 'true');

  const rows = values.map((v, i) => {
    const m = valueMeta(v.id);
    return h('a.crit-row', { href: `#/value/${v.id}`, style: `--c:${m.color}`, 'aria-label': `${m.kz} — ${v.criterion}` },
      h('span.crit-row__n.mono', { 'aria-hidden': 'true' }, String(i + 1).padStart(2, '0')),
      h('span.icon-badge', { '--s': '46px', '--c': m.color }, h('img', { src: m.icon, alt: '' })),
      h('span.crit-row__body', null,
        h('span.crit-row__kz', null, m.kz, h('span.crit-row__ru', null, ' · ' + m.ru)),
        h('span.crit-row__q', null, v.criterion)),
      h('span.crit-row__go', { 'aria-hidden': 'true' }, '→'));
  });
  const index = h('div.crit-index', { role: 'list' }, rows);
  rows.forEach((r) => r.setAttribute('role', 'listitem'));
  const hint = h('p.crit-hint.mono');
  const stage = h('div.crit-stage', null, h('div.crit-sub', null, levels, intro), sun, rays, index, hint, titleBox);
  const prism = h('div.crit-prism', null, stage);
  el.append(prism);

  const mm = gsap.matchMedia();
  scope.add(() => mm.revert());
  mm.add('(min-width: 900px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)', () => {
    prism.classList.add('crit-prism--pinned');
    const vh = () => window.innerHeight;
    const OY = () => vh() * 0.205;
    let lines: SVGLineElement[] = [];
    const layout = () => {
      const sr = stage.getBoundingClientRect();
      rays.setAttribute('viewBox', `0 0 ${sr.width} ${sr.height}`);
      rays.replaceChildren();
      const ox = sr.width / 2, oy = OY();
      sun.style.top = oy + 'px';
      lines = rows.map((r, i) => {
        const rr = r.getBoundingClientRect();
        const left = i % 2 === 0;
        const tx = left ? rr.right - sr.left + 10 : rr.left - sr.left - 10;
        const ty = rr.top - sr.top + rr.height / 2;
        const dx = tx - ox, dy = ty - oy, len = Math.hypot(dx, dy);
        const ln = document.createElementNS(SVGNS, 'line');
        ln.setAttribute('x1', String(ox + (dx / len) * 54));
        ln.setAttribute('y1', String(oy + (dy / len) * 54));
        ln.setAttribute('x2', String(tx));
        ln.setAttribute('y2', String(ty));
        ln.setAttribute('pathLength', '1');
        ln.style.strokeDasharray = '1';
        ln.style.strokeDashoffset = '1';
        rays.append(ln);
        return ln;
      });
    };
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: prism, start: 'top top', end: '+=400%', pin: stage, scrub: 0.7, invalidateOnRefresh: true,
        onRefresh: () => { layout(); tl.invalidate(); },
      },
    });
    layout();
    gsap.set(titleBox, { yPercent: -50, transformOrigin: '50% 50%' });
    gsap.set([ru, levels, intro], { opacity: 0, y: 24 });
    gsap.set(rows, { opacity: 0, y: 14 });
    gsap.set([hint, sun], { opacity: 0 });
    gsap.set(sun, { xPercent: -50, yPercent: -50 });
    gsap.set(kz, { letterSpacing: '-0.05em', scale: 0.84 });

    tl.to(kz, { letterSpacing: '0em', scale: 1, duration: 1 }, 0)
      .to(titleBox, { y: () => -vh() * 0.2, duration: 0.7, ease: 'power2.inOut' }, 1)
      .to(kz, { scale: 0.86, duration: 0.7, ease: 'power2.inOut' }, 1)
      .to(ru, { opacity: 1, y: 0, duration: 0.5 }, 1.3)
      .to(levels, { opacity: 1, y: 0, duration: 0.45 }, 1.6)
      .to(intro, { opacity: 1, y: 0, duration: 0.45 }, 1.85)
      .to([intro, levels], { opacity: 0, y: -20, duration: 0.3 }, 2.6)
      .to([ru, eyebrow], { opacity: 0, duration: 0.3 }, 2.65)
      .to(titleBox, { y: () => -(vh() * 0.5 - 70), scale: 0.3, duration: 0.9, ease: 'power2.inOut' }, 2.65)
      .to(kz, { scale: 1, duration: 0.9, ease: 'power2.inOut' }, 2.65)
      .to(sun, { opacity: 1, duration: 0.4 }, 3.1)
;
    const rayProxy = { p: 0 };
    tl.to(rayProxy, { p: 1, duration: 1.2, onUpdate: () => lines.forEach((ln, i) => {
      const t = Math.max(0, Math.min(1, rayProxy.p * 1.6 - i * 0.06));
      ln.style.strokeDashoffset = String(1 - t);
    }) }, 3.25)
      .to(rows, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, 3.7)
      .to(hint, { opacity: 1, duration: 0.4 }, 4.6)
      .to({}, { duration: 0.5 });
    return () => prism.classList.remove('crit-prism--pinned');
  });
  mm.add('(max-width: 899px), (max-height: 639px), (prefers-reduced-motion: reduce)', () => {
    if (!prefersReducedMotion()) {
      scope.add(reveal(rows));
      scope.add(reveal([levels, intro, ru]));
    }
    scope.add(drawOn(sun, { start: 'top 90%' }));
  });

  /* ============ 2. Что значит жить по ХАҚ — реестр ============ */
  const L = c.living;
  const total = L.examples.length;
  let done = 0;
  const counter = h('div.crit-counter.mono', { role: 'status', 'aria-live': 'polite' });
  const bar = h('span.crit-counter__bar');
  const closing = h('p.crit-closing', null, L.closing);
  const livingEl = h('div.crit-living');
  const updateCounter = () => {
    counter.replaceChildren(
      h('span.crit-counter__num', null, String(done).padStart(2, '0')), ` / ${String(total).padStart(2, '0')} ${t('поступков')}`,
      h('span.crit-counter__track', { 'aria-hidden': 'true' }, bar));
    bar.style.transform = `scaleX(${done / total})`;
    closing.classList.toggle('is-lit', done === total);
  };
  const items = L.examples.map((text, i) => {
    const btn = h('button.crit-led', { type: 'button', 'aria-pressed': 'false' },
      h('span.crit-led__n.mono', null, String(i + 1).padStart(2, '0')),
      h('span.crit-led__text', null, text),
      h('span.crit-led__mark', null,
        h('span.crit-led__yes', null, t('Это ХАҚ')),
        h('span.crit-led__check', { html: CHECK })));
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      btn.classList.toggle('is-on', on);
      done += on ? 1 : -1;
      updateCounter();
    });
    return h('li', null, btn);
  });
  const livingTitle = h('h3.t-l.crit-living__title', null, L.question);
  livingEl.append(h('div.wrap.crit-living__in', null,
    h('div.crit-living__head', null, h('p.eyebrow', null, t('жить по ХАҚ')), livingTitle,
      h('p.crit-living__hint', null, t('Каждый поступок — выбор. Отметь те, в которых узнаёшь ХАҚ.')), counter),
    h('div.crit-living__body', null, h('ol.crit-ledger', null, items), closing)));
  el.append(livingEl);
  updateCounter();
  scope.add(revealWords(livingTitle));
  scope.add(reveal(items.map((li) => li)));
  scope.add(reveal(closing));

  /* ============ 3. не по ХАҚ ============ */
  const para = c.paragraphs[4];
  const key = t('«не по ХАҚ»');
  const [pre, post = ''] = para.includes(key) ? para.split(key) : [para + ' ', ''];
  const strikeBtn = h('button.crit-strike', { type: 'button', 'aria-pressed': 'false', 'aria-label': t('Зачеркнуть «не по ХАҚ»') },
    h('span.crit-strike__text', null, key),
    h('span.crit-strike__line', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 200 30" preserveAspectRatio="none"><path pathLength="1" d="M2 18 C 40 8, 80 24, 120 13 S 180 19, 198 9"/></svg>' }),
    h('span.crit-strike__wave', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 200 14" preserveAspectRatio="none"><path pathLength="1" d="M2 7 q 12 -8 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0"/></svg>' }));
  const preEl = h('span', null, pre);
  const postEl = h('span', null, post);
  const statement = h('p.crit-statement', null, preEl, strikeBtn, postEl);
  strikeBtn.addEventListener('click', () => {
    const on = strikeBtn.getAttribute('aria-pressed') !== 'true';
    strikeBtn.setAttribute('aria-pressed', String(on));
    strikeBtn.classList.toggle('is-struck', on);
  });
  const cta = h('a.btn.btn--primary.crit-cta', { href: '#/play' },
    h('span', null, t('Проверь себя: ')), h('span.crit-cta__kz', null, 'Бұл ХАҚ па?'), h('span', { 'aria-hidden': 'true' }, '→'));
  el.append(h('div.crit-end', null,
    h('div.wrap.crit-end__in', null, h('p.eyebrow', null, t('нормой станет')), statement, h('div.crit-cta-row', null, cta))));
  scope.add(scrubText(preEl, { start: 'top 85%', end: 'bottom 60%' }));
  scope.add(scrubText(postEl, { start: 'top 80%', end: 'bottom 50%' }));
  scope.add(reveal(cta));
  scope.add(magnetic(cta, 0.2));
  const strikeNow = () => window.setTimeout(() => { strikeBtn.classList.add('is-struck'); strikeBtn.setAttribute('aria-pressed', 'true'); }, 500);
  if (prefersReducedMotion()) {
    strikeBtn.classList.add('is-struck');
    strikeBtn.setAttribute('aria-pressed', 'true');
  } else {
    gsap.timeline({ scrollTrigger: { trigger: strikeBtn, start: 'top 75%', once: true, onEnter: strikeNow } });
  }
  return el;
}
