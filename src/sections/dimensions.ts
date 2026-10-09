// Раздел 04: пять измерений — закреплённая горизонтальная лента парных ценностей.
import { t, pick } from '../engine/i18n';
import './dimensions.css';
import { h } from '../engine/dom';
import { gsap, ScrollTrigger, prefersReducedMotion, horizontalScroll, reveal, revealWords } from '../engine/motion';
import { DIMENSIONS, VALUES, valueMeta } from '../engine/theme';
import { illustration, ornamentBand, type IllustrationName } from '../engine/ornament';
import { concept } from '../content';
import type { ValueId } from '../content/types';
import type { Scope } from '../engine/page';

const SVG = 'http://www.w3.org/2000/svg';
function s(tag: string, attrs: Record<string, string | number> = {}, ...kids: Element[]): SVGElement {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  kids.forEach((k) => el.appendChild(k));
  return el;
}

const ART: IllustrationName[] = ['shanyrak', 'book', 'yurt', 'sun', 'sprout'];
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];

function valueLink(id: ValueId): HTMLElement {
  const m = valueMeta(id);
  return h(
    'a.dims-val',
    { href: `#/value/${id}`, 'aria-label': t('{name}: открыть ценность', { name: `${m.kz} — ${m.ru}` }), '--c': m.color },
    h('span.icon-badge.dims-val__badge', { '--c': m.color, '--s': '84px' }, h('img', { src: m.icon, alt: '', width: 64, height: 64 })),
    h('span.dims-val__kz.kz', null, m.kz),
    h('span.dims-val__ru', null, m.ru),
  );
}

/** Тонкая дуга между медальонами: двойная линия и ромб посередине. */
function arc(): SVGElement {
  const el = s(
    'svg',
    { viewBox: '0 0 240 70', class: 'dims-arc', 'aria-hidden': 'true', focusable: 'false' },
    s('path', { d: 'M4 54 C 50 -8, 190 -8, 236 54', class: 'dims-arc__line' }),
    s('path', { d: 'M14 58 C 60 6, 180 6, 226 58', class: 'dims-arc__line dims-arc__line--2' }),
    s('path', { d: 'M120 8 l5 5 l-5 5 l-5 -5 z', class: 'dims-arc__gem' }),
  );
  return el;
}

function closingText(text: string): (Node | string)[] {
  const words: [string, string][] = pick({
    ru: [
      ['Справедливый', DIMENSIONS[1].color],
      ['Безопасный', DIMENSIONS[2].color],
      ['Сильный', DIMENSIONS[3].color],
      ['Прогрессивный', DIMENSIONS[4].color],
      ['Чистый', DIMENSIONS[4].color],
    ] as [string, string][],
    kk: [
      ['Әділетті', DIMENSIONS[1].color],
      ['Қауіпсіз', DIMENSIONS[2].color],
      ['Күшті', DIMENSIONS[3].color],
      ['Прогрессивті', DIMENSIONS[4].color],
      ['Таза', DIMENSIONS[4].color],
    ] as [string, string][],
  });
  const out: (Node | string)[] = [];
  let last = 0;
  for (const m of text.matchAll(new RegExp('(' + words.map((w) => w[0]).join('|') + ')', 'g'))) {
    const idx = m.index ?? 0;
    out.push(text.slice(last, idx));
    const col = words.find((w) => w[0] === m[0])![1];
    out.push(h('em.dims-end__kz', { style: { color: col } }, m[0]));
    last = idx + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}

export function dimensionsSection(scope: Scope): HTMLElement {
  const sys = concept.system;
  const reduced = prefersReducedMotion();
  const closing = sys.paragraphs[7] ?? '';
  const lead = sys.paragraphs[5] ?? '';

  const title = h('h2.dims-title', null, sys.title);
  const bar = h('span.dims-prog__bar', { 'aria-hidden': 'true' });
  const idx = h('ol.dims-prog__idx', { 'aria-hidden': 'true' }, ROMAN.map((r, i) => h('li', { class: i === 0 ? 'is-on' : '' }, r)));
  const head = h(
    'header.dims-head.wrap',
    null,
    h('div.dims-head__t.stack', { '--gap': '10px' }, h('p.eyebrow', null, t('04 · Пять измерений')), title),
    h('div.dims-head__r.stack', { '--gap': '10px' }, h('p.muted.dims-head__lead', null, lead), h('div.dims-prog', null, h('span.dims-prog__hint', null, t('Листайте →')), idx, h('span.dims-prog__track', null, bar))),
  );

  const arts: SVGSVGElement[] = [];
  const panels = sys.pairs.map((p, i) => {
    const dim = DIMENSIONS[i];
    const [a, b] = p.values;
    const art = illustration(ART[i], 'illo dims-art');
    arts.push(art);
    const arcEl = arc();
    const imgParts = p.image.split(' · ');
    return h(
      'article.dims-panel',
      { '--dc': dim.color, 'aria-label': p.dimension },
      h(
        'div.dims-page.dims-page--l',
        null,
        h('p.dims-folio', null, t('Глава {n}', { n: ROMAN[i] })),
        h('div.dims-art-wrap', null, art),
        h('div.dims-pair', null, valueLink(a), arcEl, valueLink(b)),
      ),
      h(
        'div.dims-page.dims-page--r.stack',
        { '--gap': '16px' },
        h('p.dims-panel__dim', null, p.dimension),
        h('h3.dims-panel__img', null, imgParts.map((t, k) => h('span.dims-panel__line', { class: k ? 'is-2' : '' }, t))),
        h('p.dims-panel__sum', null, p.summary.charAt(0).toUpperCase() + p.summary.slice(1)),
        h('p.dims-panel__text', null, p.text),
      ),
    );
  });

  const icons = h(
    'div.dims-end__icons',
    null,
    VALUES.map((v) => h('a.icon-badge.dims-end__ic', { href: `#/value/${v.id}`, '--c': v.color, '--s': '56px', 'aria-label': `${v.kz} — ${v.ru}`, title: `${v.kz} — ${v.ru}` }, h('img', { src: v.icon, alt: '' }))),
  );
  const band = ornamentBand(10);
  const endCard = h(
    'article.dims-panel.dims-end',
    { 'aria-label': t('Итог') },
    h('p.dims-folio', null, t('Итог')),
    h('p.dims-end__t.quote', null, closingText(closing)),
    icons,
    band,
  );

  const track = h('div.dims-track', null, panels, endCard);
  const section = h('section#dimensions.dims', null, head, h('div.dims-viewport', null, track));

  scope.add(revealWords(title));
  scope.add(reveal(Array.from(section.querySelectorAll('.dims-head__lead')), { y: 24 }));

  // прорисовка линий иллюстрации и дуги (однократно, когда страница «открывается»)
  const prep = (root: Element) => {
    const shapes = Array.from(root.querySelectorAll<SVGGeometryElement>('path, circle, line'));
    if (reduced) return () => {};
    shapes.forEach((sh) => {
      let len = 600;
      try { len = sh.getTotalLength(); } catch { /* */ }
      sh.style.strokeDasharray = `${len} ${len}`;
      sh.style.strokeDashoffset = String(len);
    });
    let drawn = false;
    return () => {
      if (drawn) return;
      drawn = true;
      gsap.to(shapes, { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut', stagger: 0.03, onComplete: () => shapes.forEach((sh) => (sh.style.strokeDasharray = 'none')) });
    };
  };
  const draws = panels.map((pn) => prep(pn.querySelector('.dims-art-wrap, .dims-arc') as Element));
  const arcDraws = panels.map((pn) => prep(pn.querySelector('.dims-arc') as Element));

  // горизонтальный скролл (на узких экранах — вертикальный стек через CSS)
  const horizontal = !reduced && window.innerWidth >= 720;
  const setup = () => {
    scope.add(horizontalScroll(section, track));
    if (horizontal) {
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth + 64);
      const total = panels.length;
      const st = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: () => '+=' + dist(),
        onUpdate: (self) => {
          bar.style.transform = `scaleX(${self.progress})`;
          const cur = Math.min(total - 1, Math.round(self.progress * total));
          Array.from(idx.children).forEach((li, k) => li.classList.toggle('is-on', k === cur));
        },
      });
      scope.add(() => st.kill());
      // страницы «переворачиваются»: боковые развороты чуть повёрнуты и приглушены
      const all = [...panels, endCard];
      const focus = () => {
        const vw = window.innerWidth;
        all.forEach((pn, i) => {
          const r = pn.getBoundingClientRect();
          const dx = (r.left + r.width / 2 - vw / 2) / (vw * 0.75);
          const d = Math.min(1, Math.abs(dx));
          gsap.set(pn, { opacity: 1 - 0.65 * d, rotateY: -dx * 5, transformPerspective: 1600, transformOrigin: dx > 0 ? '0% 50%' : '100% 50%' });
          if (d < 0.45 && i < panels.length) { draws[i](); arcDraws[i](); }
        });
      };
      gsap.ticker.add(focus);
      scope.add(() => gsap.ticker.remove(focus));
      focus();
    } else {
      panels.forEach((pn, i) => {
        const st = ScrollTrigger.create({ trigger: pn, start: 'top 80%', once: true, onEnter: () => { draws[i](); arcDraws[i](); } });
        scope.add(() => st.kill());
      });
      scope.add(reveal([...panels, endCard], { y: 40 }));
      section.classList.add('is-stack');
    }
  };
  let dead = false;
  scope.add(() => { dead = true; });
  const tryInit = (n = 0) => {
    if (dead) return;
    if (!section.isConnected && n < 60) return void requestAnimationFrame(() => tryInit(n + 1));
    setup();
    ScrollTrigger.refresh();
  };
  requestAnimationFrame(() => tryInit());
  return section;
}
