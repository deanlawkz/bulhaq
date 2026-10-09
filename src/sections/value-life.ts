// LifeХАҚ: колода карточек (свайп / перетаскивание / стрелки) + бегущая лента сцен.
import './value-life.css';
import { h } from '../engine/dom';
import { t, pick } from '../engine/i18n';
import { gsap, reveal, revealWords, prefersReducedMotion } from '../engine/motion';
import { svg, ILLUSTRATIONS, ramHorn, ornamentBand, type IllustrationName } from '../engine/ornament';
import type { Scope } from '../engine/page';
import type { ValueContent } from '../content/types';

/** «Шесть коротких сцен», «Одна короткая сцена», «Две короткие сцены» — согласование с числом. */
function sceneLead(n: number): string {
  if (pick({ ru: false, kk: true })) {
    const kw = ['Нөл', 'Бір', 'Екі', 'Үш', 'Төрт', 'Бес', 'Алты', 'Жеті', 'Сегіз', 'Тоғыз'];
    return `${kw[n] ?? n} қысқа көрініс`;
  }
  const words = ['Ноль', 'Одна', 'Две', 'Три', 'Четыре', 'Пять', 'Шесть', 'Семь', 'Восемь', 'Девять'];
  const num = words[n] ?? String(n);
  const d = n % 10;
  const dd = n % 100;
  if (d === 1 && dd !== 11) return `${num} короткая сцена`;
  if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return `${num} короткие сцены`;
  return `${num} коротких сцен`;
}
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MOTIFS: IllustrationName[] = ['scales', 'book', 'yurt', 'sun', 'shanyrak', 'sprout', 'measure', 'candle'];
const SK = 'fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" vector-effect="non-scaling-stroke"';

/** Линейная виньетка в стиле гравюры: рамка-линейка, мотив, горизонт, звёзды, барашковый рог. */
function vignette(i: number, salt: number): SVGSVGElement {
  const r = rng(salt * 131 + i * 977 + 13);
  const name = MOTIFS[(i * 3 + salt) % MOTIFS.length];
  let d = `<rect x="6" y="6" width="188" height="148" ${SK} opacity=".55"/><rect x="11" y="11" width="178" height="138" ${SK} opacity=".25"/>`;
  // звёзды/точки неба
  for (let k = 0; k < 9; k++) {
    const x = 18 + r() * 164, y = 18 + r() * 40;
    d += `<path d="M${x.toFixed(1)} ${(y - 2).toFixed(1)} V${(y + 2).toFixed(1)} M${(x - 2).toFixed(1)} ${y.toFixed(1)} H${(x + 2).toFixed(1)}" ${SK} opacity="${(0.3 + r() * 0.4).toFixed(2)}"/>`;
  }
  // дуга орбиты за мотивом
  const cx = 40 + r() * 120;
  d += `<circle cx="${cx.toFixed(1)}" cy="${(70 + r() * 20).toFixed(1)}" r="${(46 + r() * 20).toFixed(1)}" ${SK} stroke-dasharray="2 5" opacity=".5"/>`;
  // горизонт-штриховка
  for (let k = 0; k < 4; k++) d += `<path d="M${20 + k * 4} ${138 + k * 2.4} H${180 - k * 4}" ${SK} opacity="${0.5 - k * 0.1}"/>`;
  const el = svg('0 0 200 160', `<g class="vl-m">${ILLUSTRATIONS[name]()}</g><g class="vl-f">${d}</g>`, 'vlife-art');
  return el;
}

export function valueLifeSection(scope: Scope, v: ValueContent): HTMLElement {
  const scenes = v.life;
  const n = scenes.length;
  const salt = [...v.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  let idx = 0;
  const dirs: number[] = []; // сторона, куда улетела карточка

  /* ---------- карточки: страницы хартии ---------- */
  const pad = (k: number) => String(k).padStart(2, '0');
  const arts: SVGSVGElement[] = [];
  const cards: HTMLElement[] = scenes.map((txt, i) => {
    const a = vignette(i, salt);
    arts.push(a);
    return h('article.vlife-card', { 'aria-roledescription': t('слайд'), 'aria-label': t('{i} из {n}', { i: i + 1, n }) },
      h('header.vlife-card__top', null,
        h('span.vlife-card__no.mono', null, t('№ {i} / {n}', { i: pad(i + 1), n: pad(n) })),
        h('span.vlife-card__kz', null, v.kz)),
      h('div.vlife-card__art', null, a),
      h('div.vlife-card__body', null, h('p.vlife-card__t', null, txt)),
      h('footer.vlife-card__foot', null, ramHorn('vlife-horn')));
  });

  const restart = h('button.btn.btn--primary.vlife-restart', { type: 'button' }, t('Пройти заново'));
  const finalCard = h('article.vlife-card.vlife-card--final', { 'aria-roledescription': t('слайд'), 'aria-label': t('Итог') },
    h('header.vlife-card__top', null,
      h('span.vlife-card__no.mono', null, t('Итог')),
      h('span.vlife-card__kz', null, v.kz)),
    h('div.vlife-final__orn', { 'aria-hidden': 'true' }, ornamentBand(6)),
    h('div.vlife-card__body', null,
      h('p.vlife-final__t', null, t('Это LifeХАҚ')),
      h('p.vlife-final__s', null, t('Из таких обычных моментов складывается жизнь, в которой Конституция работает каждый день.')),
      restart));
  cards.push(finalCard);
  const total = cards.length;

  // подготовка штрихов к прорисовке (дэш 1000 хватает для всех путей viewBox 200×160)
  const motifShapes = (a: SVGSVGElement) => Array.from(a.querySelectorAll<SVGElement>('.vl-m path, .vl-m circle'));
  const animateArt = !prefersReducedMotion();
  const drawn = new Set<number>();
  if (animateArt) {
    arts.forEach((a) => motifShapes(a).forEach((sh) => {
      sh.style.strokeDasharray = '1000';
      sh.style.strokeDashoffset = '1000';
    }));
  }
  function drawCard(i: number) {
    if (!animateArt || drawn.has(i) || !arts[i]) return;
    drawn.add(i);
    gsap.to(motifShapes(arts[i]), { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: 0.03, delay: 0.25 });
  }

  const deck = h('div.vlife-deck', {
    tabindex: '0', role: 'group', 'aria-roledescription': t('колода карточек'),
    'aria-label': t('LifeХАҚ: сцены {name}. Стрелки влево и вправо листают карточки.', { name: v.kz }),
  }, cards);
  const live = h('p.sr-only', { 'aria-live': 'polite' });

  const counter = h('p.vlife-counter', { 'aria-hidden': 'true' }, h('b', null, '1'), ' / ', String(n));
  const bar = h('i.vlife-bar__f');
  const prev = h('button.vlife-nav', { type: 'button', 'aria-label': t('Предыдущая сцена') }, '←');
  const next = h('button.vlife-nav', { type: 'button', 'aria-label': t('Следующая сцена') }, '→');
  const hint = h('p.vlife-hint', null, t('Потяните страницу в сторону или нажмите →'));

  /* ---------- раскладка ---------- */
  const POS = (p: number) => ({
    x: 0, y: p * 22, scale: 1 - p * 0.055, rotation: p === 0 ? 0 : (p % 2 ? 1 : -1) * p * 1.6,
    opacity: p > 2 ? 0 : 1, filter: `brightness(${1 - p * 0.22})`,
  });
  function layout(animate: boolean) {
    cards.forEach((c, i) => {
      const p = i - idx;
      const live_ = p === 0;
      c.classList.toggle('is-top', live_);
      c.toggleAttribute('inert', !live_);
      c.setAttribute('aria-hidden', String(!live_));
      c.style.zIndex = String(total - Math.abs(p) + (p < 0 ? -total : 0));
      let t: gsap.TweenVars;
      if (p < 0) {
        const d = dirs[i] ?? 1;
        t = { x: d * (window.innerWidth * 0.9 + 200), y: 40, rotation: d * 24, opacity: 0, scale: 1, filter: 'brightness(1)' };
      } else t = POS(p);
      if (animate && !prefersReducedMotion()) {
        gsap.to(c, { ...t, duration: p < 0 ? 0.55 : 0.7, ease: p < 0 ? 'power3.in' : 'expo.out', overwrite: 'auto' });
      } else gsap.set(c, t);
    });
    if (idx < n) drawCard(idx);
    const shown = Math.min(idx + 1, n);
    (counter.firstChild as HTMLElement).textContent = String(shown);
    gsap.to(bar, { scaleX: Math.min(1, (idx + 1) / n), duration: 0.6, ease: 'expo.out' });
    prev.disabled = idx === 0;
    next.disabled = idx >= total - 1;
    hint.classList.toggle('is-gone', idx > 0);
    live.textContent = idx < n ? t('Сцена {i} из {n}: {text}', { i: idx + 1, n, text: scenes[idx] }) : t('Это LifeХАҚ');
  }

  function go(delta: number, dir = delta > 0 ? 1 : -1) {
    const ni = Math.max(0, Math.min(total - 1, idx + delta));
    if (ni === idx) return;
    if (delta > 0) dirs[idx] = dir;
    idx = ni;
    layout(true);
  }
  scope.on(next, 'click', () => go(1, 1));
  scope.on(prev, 'click', () => go(-1));
  scope.on(restart, 'click', () => {
    // перелистываем обратно к началу
    idx = 0;
    layout(true);
    deck.focus({ preventScroll: true });
  });
  scope.on(deck, 'keydown', (e) => {
    const k = (e as KeyboardEvent).key;
    if (k === 'ArrowRight') { e.preventDefault(); go(1, 1); }
    else if (k === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });

  /* ---------- перетаскивание ---------- */
  let drag: { id: number; x0: number; y0: number; t0: number; dx: number; locked: boolean | null; c: HTMLElement } | null = null;
  scope.on(deck, 'pointerdown', (e) => {
    const pe = e as PointerEvent;
    if (pe.button > 0) return;
    const c = cards[idx];
    if (!c || !c.contains(pe.target as Node) || idx >= n) return;
    if ((pe.target as HTMLElement).closest('button')) return;
    drag = { id: pe.pointerId, x0: pe.clientX, y0: pe.clientY, t0: performance.now(), dx: 0, locked: null, c };
  });
  scope.on(window, 'pointermove', (e) => {
    const pe = e as PointerEvent;
    if (!drag || pe.pointerId !== drag.id) return;
    const dx = pe.clientX - drag.x0, dy = pe.clientY - drag.y0;
    if (drag.locked === null && Math.hypot(dx, dy) > 8) {
      drag.locked = Math.abs(dx) > Math.abs(dy);
      if (drag.locked) {
        try { deck.setPointerCapture(pe.pointerId); } catch { /* */ }
        drag.c.classList.add('is-drag');
        gsap.killTweensOf(drag.c);
      }
    }
    if (drag.locked) {
      drag.dx = dx;
      gsap.set(drag.c, { x: dx, y: Math.min(0, dy * 0.2) + Math.abs(dx) * 0.04, rotation: dx * 0.05 });
      const k = Math.min(1, Math.abs(dx) / 220);
      for (let j = idx + 1; j < Math.min(total, idx + 3); j++) {
        const q = POS(j - idx), q0 = POS(j - idx - 1);
        gsap.set(cards[j], { filter: `brightness(${(1 - (j - idx) * 0.22) + 0.22 * k})`, y: q.y + (q0.y - q.y) * k, scale: q.scale + (q0.scale - q.scale) * k, rotation: q.rotation + (q0.rotation - q.rotation) * k });
      }
    }
  });
  const end = (e: Event) => {
    const pe = e as PointerEvent;
    if (!drag || pe.pointerId !== drag.id) return;
    const d = drag; drag = null;
    d.c.classList.remove('is-drag');
    if (!d.locked) return;
    const v_ = d.dx / Math.max(1, performance.now() - d.t0);
    if ((Math.abs(d.dx) > 90 || Math.abs(v_) > 0.5) && idx < total - 1) {
      go(1, d.dx >= 0 ? 1 : -1);
    } else layout(true);
  };
  scope.on(window, 'pointerup', end);
  scope.on(window, 'pointercancel', end);

  /* ---------- лента ---------- */
  const chips = (hidden: boolean) =>
    h('ul.vlife-marq__set', hidden ? { 'aria-hidden': 'true' } : null,
      scenes.map((s) => h('li.vlife-chip', null, h('span.vlife-chip__t', null, s), h('span.vlife-chip__sep', { 'aria-hidden': 'true' }, '◆'))));
  const track = h('div.vlife-marq__track', null, chips(false), chips(true));
  const marquee = h('div.vlife-marq', { 'aria-label': t('Все сцены') }, track);

  /* ---------- сборка ---------- */
  const title = h('h2.t-l.vlife-title', null, t('LifeХАҚ: как {name} выглядит в жизни', { name: v.kz }));
  const stage = h('div.vlife-stage', null,
    h('div.vlife-deckwrap', null, deck, live),
    h('div.vlife-ctrl', null, prev, h('div.vlife-prog', null, counter, h('div.vlife-bar', null, bar)), next),
    hint);
  const el = h('section.section.vlife', null,
    h('div.wrap', null,
      h('header.vlife-head', null,
        h('p.eyebrow', null, t('Жизнь, а не лозунг')),
        title,
        h('p.lead.muted', null, t('{lead} — листайте колоду.', { lead: sceneLead(n) }))),
      stage),
    h('div.vlife-marqwrap', null, marquee));

  gsap.set(cards, { transformPerspective: 1000 });
  layout(false);
  gsap.set(bar, { scaleX: 1 / n });
  scope.add(revealWords(title));
  scope.add(reveal([stage]));
  scope.add(reveal([marquee]));
  scope.add(() => gsap.killTweensOf([...cards, bar]));
  return el;
}
