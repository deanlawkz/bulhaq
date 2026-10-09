import { t } from '../engine/i18n';
import './mech-env.css';
import { h } from '../engine/dom';
import { gsap, horizontalScroll, prefersReducedMotion, revealWords, ScrollTrigger } from '../engine/motion';
import type { Scope } from '../engine/page';
import { mechanisms } from '../content';
import { collapsible, sectionHead, svgRoot } from './mech-util';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

/** Линейные эмблемы (штрих currentColor, золото): у каждого механизма своя. */
function emblem(id: string): SVGSVGElement {
  const L = 'fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"';
  const f = 'font-family="Fira Sans Condensed, Fira Sans Condensed, sans-serif" font-weight="500" fill="currentColor"';
  switch (id) {
    case 'hak-check':
      return svgRoot('0 0 200 200', { class: 'em em--check' }, `
        <path d="M100 20 L168 44 V100 C168 142 138 168 100 182 C62 168 32 142 32 100 V44 Z" ${L}/>
        <path d="M44 52 L100 32 L156 52 V100 C156 134 132 156 100 168 C68 156 44 134 44 100 Z" ${L} opacity=".4"/>
        <path d="M64 70h72M64 92h50M64 114h60" ${L} opacity=".55"/>
        <path class="em-tick" d="M66 108 L92 134 L138 76" ${L} stroke-width="2.2" pathLength="1"/>
        <path class="em-scan" d="M40 44 H160" ${L}/>`);
    case 'bul-hak-sign':
      return svgRoot('0 0 200 200', { class: 'em em--sign' }, `
        <defs><path id="em-sg" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0"/></defs>
        <g class="em-spin"><text ${f} font-size="13" letter-spacing="1.6"><textPath href="#em-sg">ХАҚ МЕКТЕП • ХАҚ УНИВЕРСИТЕТ • ХАҚ БИЗНЕС • ХАҚ ҚАЛА • ХАҚ ЖОБА •</textPath></text></g>
        <circle cx="100" cy="100" r="60" ${L}/><circle cx="100" cy="100" r="54" ${L} opacity=".45"/>
        <text x="100" y="97" text-anchor="middle" ${f} font-size="23">Бұл</text>
        <text x="100" y="124" text-anchor="middle" ${f} font-size="27">ХАҚ</text>`);
    case 'hak-4d':
      return svgRoot('0 0 200 200', { class: 'em em--4d' }, `
        <ellipse cx="100" cy="100" rx="82" ry="32" ${L} opacity=".6" transform="rotate(-24 100 100)"/>
        <ellipse cx="100" cy="100" rx="82" ry="32" ${L} opacity=".6" transform="rotate(36 100 100)"/>
        <ellipse cx="100" cy="100" rx="82" ry="32" ${L} opacity=".6" transform="rotate(96 100 100)"/>
        <g class="em-o em-o1"><circle cx="182" cy="100" r="6" fill="var(--night)" ${L}/></g>
        <g class="em-o em-o2"><circle cx="182" cy="100" r="6" fill="var(--night)" ${L}/></g>
        <g class="em-o em-o3"><circle cx="182" cy="100" r="6" fill="var(--night)" ${L}/></g>
        <circle cx="100" cy="100" r="30" fill="var(--night)" ${L}/>
        <text x="100" y="105" text-anchor="middle" ${f} font-size="15">ОТАН</text>`);
    case 'open-hak': {
      let dots = '';
      for (let r = 0; r < 10; r++) for (let q = 0; q < 10; q++) dots += `<circle class="em-d" style="--i:${(r * 7 + q * 13) % 20}" cx="${25 + q * 16.7}" cy="${25 + r * 16.7}" r="2.4" fill="currentColor"/>`;
      return svgRoot('0 0 200 200', { class: 'em em--open' }, dots);
    }
    case 'hakathon': {
      let people = '';
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const x = 100 + Math.cos(a) * 76, y = 100 + Math.sin(a) * 76;
        people += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} Q${(100 + Math.cos(a + 0.5) * 48).toFixed(1)} ${(100 + Math.sin(a + 0.5) * 48).toFixed(1)} 100 100" ${L} opacity=".4"/><circle class="em-p" style="--i:${k}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" fill="var(--night)" ${L}/>`;
      }
      return svgRoot('0 0 200 200', { class: 'em em--hack' }, `<circle class="em-ring" cx="100" cy="100" r="76" ${L} stroke-dasharray="1 7" opacity=".7"/>${people}
        <circle cx="100" cy="100" r="26" fill="var(--night)" ${L}/><text x="100" y="105" text-anchor="middle" ${f} font-size="15">&lt;/&gt;</text>`);
    }
    default:
      return svgRoot('0 0 200 200', { class: 'em em--hub' }, `
        <path d="M100 100 Q96 62 100 26 M100 100 Q64 112 32 148 M100 100 Q136 112 168 148" ${L} opacity=".7"/>
        <circle class="em-t" style="--i:0" r="3" fill="currentColor"/><circle class="em-t" style="--i:1" r="3" fill="currentColor"/><circle class="em-t" style="--i:2" r="3" fill="currentColor"/>
        <circle cx="100" cy="24" r="12" fill="var(--night)" ${L}/><circle cx="30" cy="150" r="12" fill="var(--night)" ${L}/><circle cx="170" cy="150" r="12" fill="var(--night)" ${L}/>
        <circle cx="100" cy="100" r="32" fill="var(--night)" ${L}/><circle cx="100" cy="100" r="26" ${L} opacity=".45"/>
        <text x="100" y="105" text-anchor="middle" ${f} font-size="16">hub</text>`);
  }
}

export function mechEnvironmental(scope: Scope, host: HTMLElement): HTMLElement {
  const e = mechanisms.environmental;
  const head = sectionHead(t('III · Средовое продвижение'), t('Среда, в которой ХАҚ распространяется сам'), null);
  scope.add(revealWords(head.title));
  const intro = collapsible(e.intro, scope);
  const first = h('div.mech-env__intro', null, head.el, intro, h('p.mech-env__drag', null, h('span', null, t('Листайте')), h('i', { 'aria-hidden': 'true' })));
  const cards = e.items.map((m, i) => {
    const em = h('div.mech-env__em', { 'aria-hidden': 'true' }, emblem(m.id));
    const body = collapsible(m.paragraphs, scope, { cls: 'mech-env__col' });
    const card = h('article.mech-env__card', null,
      em, h('p.mech-env__n', null, `${ROMAN[i]} · ${ROMAN[e.items.length - 1]}`), h('h3.mech-env__name', null, m.name), h('p.mech-env__sub', null, m.subtitle),
      h('div.mech-env__text', { 'data-lenis-prevent': '' }, body));
    return card;
  });
  const track = h('div.mech-env__track', null, first, cards);
  const bar = h('i.mech-env__bar');
  const count = h('span.mech-env__count', { 'aria-hidden': 'true' }, '');
  const prog = h('div.mech-env__prog', { 'aria-hidden': 'true' }, h('div.mech-env__barwrap', null, bar), count);
  const el = h('section.mech-env', null, h('div.mech-env__viewport', null, track), prog);
  host.append(el); // pin требует родителя в DOM
  scope.add(horizontalScroll(el, track));

  if (!prefersReducedMotion() && window.innerWidth >= 720) {
    const upd = () => {
      const x = -(Number(gsap.getProperty(track, 'x')) || 0);
      const dist = Math.max(1, track.scrollWidth - window.innerWidth + 64);
      const p = Math.min(1, Math.max(0, x / dist));
      bar.style.transform = `scaleX(${p})`;
      const idx = Math.round(p * (cards.length - 1));
      count.textContent = p < 0.02 ? t('Средовое продвижение') : `${ROMAN[idx]} / ${ROMAN[cards.length - 1]}`;
    };
    ScrollTrigger.create({ trigger: el, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? gsap.ticker.add(upd) : gsap.ticker.remove(upd)) });
    scope.add(() => gsap.ticker.remove(upd));
    cards.forEach((c, i) => gsap.from(c, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', delay: i * 0.05, scrollTrigger: { trigger: el, start: 'top 70%', once: true } }));
  }
  return el;
}
