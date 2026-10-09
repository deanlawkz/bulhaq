// Игра «Бұл ХАҚ па? — Узнай ценность»: сцена LifeХАҚ → выбери ценность (10 раундов).
import { t } from '../engine/i18n';
import './play-game.css';
import { h, clamp } from '../engine/dom';
import type { Scope } from '../engine/page';
import { gsap, prefersReducedMotion, magnetic, splitWords } from '../engine/motion';
import { app, setAccent } from '../engine/app';
import { VALUES, valueMeta, BRAND } from '../engine/theme';
import { getFlag, setFlag } from '../engine/store';
import { concept, valueById } from '../content';
import type { ValueId } from '../content';
import { createBurst } from './play-burst';
import { ramHorn, ornamentBand } from '../engine/ornament';

const GOLD = ['#d6aa4c', '#f0cf7a', '#19b6d2', '#efe8d8'];
const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const pad = (n: number) => String(n).padStart(2, '0');

const ROUNDS = 10;
const shuffle = <T,>(a: T[]): T[] => {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [r[i], r[j]] = [r[j], r[i]]; }
  return r;
};

interface Round { id: ValueId; scene: string; options: ValueId[] }

/** По одной сцене от каждой ценности (без повторов), 3 случайных неверных варианта */
function makeRounds(): Round[] {
  return shuffle(VALUES.map((m) => m.id)).slice(0, ROUNDS).map((id) => {
    const v = valueById(id)!;
    const scene = v.life[(Math.random() * v.life.length) | 0];
    const others = shuffle(VALUES.map((m) => m.id).filter((x) => x !== id)).slice(0, 3);
    return { id, scene, options: shuffle([id, ...others]) };
  });
}


export function playGameSection(scope: Scope): HTMLElement {
  const burst = createBurst();
  scope.add(burst.destroy);
  scope.add(() => setAccent(BRAND[1], BRAND[0], BRAND));

  const stage = h('div.play__stage');
  const root = h('section.section.play', null, h('div.wrap.play__wrap', null, stage));
  const calm = prefersReducedMotion();

  // ---- состояние игры ----
  let rounds: Round[] = [];
  let idx = 0;
  let score = 0;
  let streak = 0;
  let bestStreak = 0;
  let answered = false;
  let phase: 'start' | 'round' | 'end' = 'start';
  const results: boolean[] = [];
  let stageTweens: gsap.core.Tween[] = [];
  let localCleanups: (() => void)[] = [];
  let pickFn: ((i: number) => void) | null = null;
  let nextFn: (() => void) | null = null;

  const clearStage = () => {
    stageTweens.forEach((t) => t.kill());
    stageTweens = [];
    localCleanups.forEach((f) => f());
    localCleanups = [];
    pickFn = nextFn = null;
    stage.textContent = '';
  };
  const mount = (...kids: (Node | null)[]) => {
    clearStage();
    kids.forEach((k) => k && stage.appendChild(k));
  };
  const tw = <T extends gsap.core.Tween>(t: T) => { stageTweens.push(t); return t; };
  const focusSoon = (el: HTMLElement) => requestAnimationFrame(() => el.focus({ preventScroll: true }));
  const topOfStage = () => {
    const y = root.getBoundingClientRect().top + scrollY - 70;
    if (scrollY > y + 40) scrollTo({ top: Math.max(0, y), behavior: 'auto' });
  };

  // ---- ввод с клавиатуры ----
  scope.on(document, 'keydown', ((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target as HTMLElement;
    if (e.key >= '1' && e.key <= '4' && phase === 'round') { pickFn?.(Number(e.key) - 1); return; }
    if (e.key === 'Enter' && !t.closest?.('button,a,input,select,textarea')) nextFn?.();
  }) as EventListener);

  // ---- старт ----
  function showStart() {
    phase = 'start';
    setAccent(BRAND[1], BRAND[0], BRAND);
    const best = getFlag<number>('playBest', 0);
    const title = h('h1.t-hero.play-start__title', { html: 'Бұл <em>ХАҚ</em> па?' });
    const q = h('p.lead.play-start__q', null, concept.criterion.living.question);
    const startBtn = h('button.btn.btn--primary.play-start__btn', { type: 'button' }, t('Начать'), h('span', { 'aria-hidden': 'true' }, '→'));
    startBtn.addEventListener('click', startGame);
    localCleanups.push(magnetic(startBtn, 0.3));

    const list = h('ol.play-start__list', { 'aria-label': t('Жить по ХАҚ — это') },
      concept.criterion.living.examples.map((ex, i) => h('li.play-start__item', null, h('span.mono', null, roman[i]), h('span.play-start__ex', null, ex))));
    const icons = h('div.play-start__icons', { 'aria-hidden': 'true' }, VALUES.map((m) =>
      h('span.icon-badge', { '--c': m.color, '--s': '44px' }, h('img', { src: m.icon, alt: '' }))));

    mount(h('div.play-start', null,
      h('p.eyebrow', null, t('Игра · 10 сцен из жизни')),
      title, ornamentBand(14, 'orn-band play-start__band'), q,
      list,
      icons,
      h('p.muted.play-start__lead', null,
        t('Перед вами сцена из жизни. Какая ценность в ней живёт? Чем точнее чувствуете ХАҚ, тем длиннее серия.')),
      h('div.play-start__go', null, startBtn,
        best ? h('span.play-start__best.mono', null, t('Рекорд: '), h('b', null, String(best))) : null),
      h('p.dim.mono.play-start__hint', null, t('1–4 — выбрать · Enter — дальше')),
    ));
    nextFn = startGame;
    if (!calm) {
      tw(gsap.from(title, { opacity: 0, y: 40, duration: 1.4, ease: 'expo.out' }));
      tw(gsap.from('.play-start__band', { opacity: 0, scaleX: 0.3, duration: 1.4, ease: 'expo.out', delay: 0.2 }));
      tw(gsap.from('.play-start__item', { opacity: 0, x: -16, duration: 0.8, ease: 'expo.out', stagger: 0.08, delay: 0.5, clearProps: 'opacity,transform' }));
      tw(gsap.from('.play-start__icons .icon-badge', { opacity: 0, duration: 0.7, stagger: 0.05, delay: 0.9, clearProps: 'opacity' }));
      tw(gsap.from('.play-start__go', { opacity: 0, y: 16, duration: 0.8, ease: 'expo.out', delay: 1.1 }));
    }
  }

  function startGame() {
    rounds = makeRounds();
    topOfStage();
    idx = 0; score = 0; streak = 0; bestStreak = 0; results.length = 0;
    showRound();
  }

  // ---- HUD ----
  const scoreObj = { v: 0, shown: 0 };
  function hud() {
    const ticks = h('ol.play-ticks', { 'aria-label': t('Раунд {n} из {m}', { n: idx + 1, m: ROUNDS }) }, rounds.map((_, i) =>
      h('li.play-tick', {
        class: i < results.length ? (results[i] ? 'is-ok' : 'is-bad') : i === idx ? 'is-now' : '',
      })));
    const scoreEl = h('b.play-score__n', null, String(scoreObj.shown));
    const flames = h('div.play-streak', { 'aria-label': t('Серия: {n}', { n: streak }) },
      h('span.play-streak__l.mono', null, t('серия')),
      ...[1, 2, 3, 4, 5].map((n) => h('span.play-flame', { class: streak >= n ? 'is-lit' : '' }, ramHorn('orn'))),
      h('span.play-streak__n.mono', null, streak > 1 ? `×${streak}` : ''));
    return {
      el: h('div.play-hud', null,
        h('div.play-hud__l', null, h('span.play-round.mono', null, t('Раунд {n} / {m}', { n: pad(idx + 1), m: ROUNDS })), ticks),
        h('div.play-hud__r', null, flames, h('div.play-score', { 'aria-live': 'polite' }, h('span.mono', null, t('очки')), scoreEl))),
      scoreEl,
      flames,
    };
  }
  const setScore = (el: HTMLElement, to: number) => {
    if (calm) { scoreObj.shown = to; el.textContent = String(to); return; }
    scoreObj.v = scoreObj.shown;
    tw(gsap.to(scoreObj, { v: to, duration: 0.9, ease: 'power3.out', onUpdate: () => { scoreObj.shown = Math.round(scoreObj.v); el.textContent = String(scoreObj.shown); } }));
  };

  // ---- раунд ----
  function showRound() {
    phase = 'round';
    answered = false;
    const r = rounds[idx];
    const correct = valueMeta(r.id);
    const H = hud();
    const sceneText = h('p.play-scene__text', null, r.scene);
    const scene = h('article.play-scene', null,
      h('div.play-scene__top', null, h('span.mono', null, t('Сцена № {n}', { n: pad(idx + 1) })), h('span.mono', null, 'LifeХАҚ')),
      sceneText,
      h('p.play-scene__ask', null, t('Какая ценность живёт в этой сцене?')));
    const feedback = h('div.play-fb', { 'aria-live': 'polite', hidden: true });

    const optBtns = r.options.map((id, i) => {
      const m = valueMeta(id);
      return h('button.play-opt', { type: 'button', '--c': m.color, 'data-id': id, 'aria-label': `${i + 1}. ${m.kz}, ${m.ru}`, onclick: () => pick(i) },
        h('span.play-opt__key.mono', { 'aria-hidden': 'true' }, String(i + 1)),
        h('span.icon-badge', { '--c': m.color, '--s': '48px' }, h('img', { src: m.icon, alt: '' })),
        h('b.play-opt__kz', null, m.kz),
        h('span.play-opt__ru', null, m.ru),
        h('span.play-opt__mark.mono', { 'aria-hidden': 'true' }));
    });
    const opts = h('div.play-opts', { role: 'group', 'aria-label': t('Варианты ценностей') }, optBtns);
    mount(H.el, h('div.play-main', null, scene, h('div.play-side', null, opts, feedback)));

    if (!calm) {
      const words = splitWords(sceneText);
      tw(gsap.from(scene, { opacity: 0, y: 30, duration: 0.7, ease: 'expo.out' }));
      tw(gsap.from(words, { yPercent: 110, duration: 0.8, ease: 'expo.out', stagger: 0.018, delay: 0.15 }));
      tw(gsap.from(optBtns, { opacity: 0, x: -20, duration: 0.7, ease: 'expo.out', stagger: 0.07, delay: 0.35, clearProps: 'opacity,transform' }));
      tw(gsap.from('.play-tick.is-now', { scaleY: 0.2, duration: 0.6, ease: 'expo.out' }));
    }

    pickFn = pick;
    function pick(i: number) {
      if (answered || !optBtns[i]) return;
      answered = true;
      const ok = r.options[i] === r.id;
      results.push(ok);
      const btn = optBtns[i];
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;

      optBtns.forEach((b, k) => {
        b.setAttribute('aria-disabled', 'true');
        b.classList.add(r.options[k] === r.id ? 'is-correct' : k === i ? 'is-wrong' : 'is-dim');
        const mk = b.querySelector('.play-opt__mark');
        if (mk) mk.textContent = r.options[k] === r.id ? t('верно') : k === i ? t('не то') : '';
      });
      scene.style.setProperty('--c', correct.color);
      scene.classList.add('is-revealed');

      let gain = 0;
      if (ok) {
        streak++;
        bestStreak = Math.max(bestStreak, streak);
        gain = 100 + 25 * clamp(streak - 1, 0, 4);
        score += gain;
        burst.burst(cx, cy, GOLD);
        app.field?.pulse(cx, cy);
        setAccent(correct.color, '#d6aa4c', correct.palette);
        if (!calm) {
          const lit = H.flames.querySelectorAll('.play-flame')[clamp(streak - 1, 0, 4)];
          if (lit) { lit.classList.add('is-lit'); tw(gsap.fromTo(lit, { scale: 1.8, y: -4 }, { scale: 1, y: 0, duration: 0.7, ease: 'expo.out' })); }
        } else H.flames.querySelectorAll('.play-flame').forEach((f, k) => f.classList.toggle('is-lit', k < streak));
        const n = H.flames.querySelector('.play-streak__n');
        if (n) n.textContent = streak > 1 ? `×${streak}` : '';
      } else {
        streak = 0;
        H.flames.querySelectorAll('.play-flame').forEach((f) => f.classList.remove('is-lit'));
        const n = H.flames.querySelector('.play-streak__n');
        if (n) n.textContent = '';
        const good = optBtns[r.options.indexOf(r.id)];
        app.field?.pulse(good.getBoundingClientRect().left + good.offsetWidth / 2, good.getBoundingClientRect().top + good.offsetHeight / 2);
        if (!calm) {
          tw(gsap.fromTo(btn, { x: 0 }, { x: 0, duration: 0.5, ease: 'none', keyframes: { x: [0, -8, 7, -5, 3, -1, 0] } }));
        }
      }
      setScore(H.scoreEl, score);
      const dot = H.el.querySelectorAll('.play-tick')[idx] as HTMLElement;
      dot.className = 'play-tick ' + (ok ? 'is-ok' : 'is-bad');

      // пояснение
      const last = idx === ROUNDS - 1;
      const nextBtn = h('button.btn.btn--primary.play-fb__next', { type: 'button' }, last ? t('Результат') : t('Дальше'), h('span', { 'aria-hidden': 'true' }, '→'));
      nextBtn.addEventListener('click', () => next());
      feedback.style.setProperty('--c', correct.color);
      feedback.hidden = false;
      feedback.append(
        h('div.play-fb__head', null,
          h('b.play-fb__verdict', { class: ok ? 'is-ok' : 'is-bad' }, ok ? t('Верно') : t('Не совсем — это {v}', { v: correct.kz })),
          ok ? h('span.play-fb__gain.mono', null, `+${gain}`) : h('span.play-fb__gain.mono', null, correct.ru)),
        h('p.eyebrow.play-fb__label', null, t('Вопрос ценности {v}', { v: correct.kz })),
        h('p.quote.play-fb__q', null, valueById(r.id)!.criterion),
        h('div.play-fb__row', null,
          h('a.play-fb__link', { href: `#/value/${r.id}` }, t('Узнать ценность →')),
          nextBtn));
      if (!calm) tw(gsap.from(feedback, { opacity: 0, y: 24, duration: 0.6, ease: 'expo.out', delay: 0.15 }));
      focusSoon(nextBtn);
      nextFn = next;
      setTimeout(() => {
        const bottom = feedback.getBoundingClientRect().bottom;
        if (bottom > innerHeight - 10) scrollBy({ top: bottom - innerHeight + 24, behavior: calm ? 'auto' : 'smooth' });
      }, 150);
    }
  }

  function next() {
    if (!answered || phase !== 'round') return;
    answered = false;
    idx++;
    topOfStage();
    if (idx >= ROUNDS) showEnd();
    else showRound();
  }

  // ---- финал ----
  function showEnd() {
    phase = 'end';
    setAccent(BRAND[1], BRAND[0], BRAND);
    const nOk = results.filter(Boolean).length;
    const prev = getFlag<number>('playBest', 0);
    const record = score > prev;
    if (record) setFlag('playBest', score);

    const ringNum = h('b.play-ring__n', null, '0');
    const pt = (a: number, r: number) => [100 + r * Math.cos((a * Math.PI) / 180), 100 + r * Math.sin((a * Math.PI) / 180)].map((n) => n.toFixed(2)).join(' ');
    const segs = results.map((ok, k) => {
      const a0 = -90 + k * 36 + 3, a1 = a0 + 30;
      return `<path class="play-ring__seg ${ok ? 'is-ok' : ''}" d="M${pt(a0, 82)} A82 82 0 0 1 ${pt(a1, 82)}"/>`;
    }).join('');
    const ring = h('div.play-ring', { role: 'img', 'aria-label': t('Узнано {n} из {m}', { n: nOk, m: ROUNDS }) },
      h('span', { html: `<svg viewBox="0 0 200 200" aria-hidden="true"><circle class="play-ring__hair" cx="100" cy="100" r="97"/><circle class="play-ring__hair" cx="100" cy="100" r="67"/>${segs}</svg>` }),
      h('div.play-ring__c', null, ringNum, h('small.mono', null, t('из {m}', { m: ROUNDS }))));
    const arc = null as unknown as SVGElement;

    const title = nOk >= 9 ? t('Вы чувствуете ХАҚ') : nOk >= 6 ? t('Хорошее чутьё на ХАҚ') : nOk >= 3 ? t('ХАҚ уже рядом') : t('Всё только начинается');
    const sub = nOk >= 9 ? t('Почти каждая сцена нашла свою ценность.') : nOk >= 6 ? t('Большинство сцен вы узнали с первого взгляда.') : t('Ценности легче заметить, когда знаешь их вопросы. Загляните в те, что ускользнули.');

    const recMap = new Map<ValueId, boolean>();
    rounds.forEach((r, i) => recMap.set(r.id, results[i]));
    const tiles = VALUES.map((m) => {
      const st = recMap.get(m.id);
      const played = st !== undefined;
      return h('a.play-tile', { href: `#/value/${m.id}`, class: st ? 'is-on' : 'is-off', '--c': m.color, 'aria-label': `${m.kz}: ${st ? t('узнано') : played ? t('не узнано') : t('не попалось')}` },
        h('span.icon-badge', { '--c': m.color, '--s': '40px' }, h('img', { src: m.icon, alt: '' })),
        h('b.play-tile__kz', null, m.kz),
        h('span.play-tile__ru', null, m.ru),
        h('small.mono', null, st ? t('узнано') : played ? t('упущено') : t('не попалось')));
    });

    const again = h('button.btn.btn--primary', { type: 'button', onclick: startGame }, t('Ещё раз'));
    const profile = h('a.btn', { href: '#/profile' }, t('Мой ХАҚ-профиль'));
    mount(h('div.play-end', null,
      h('p.eyebrow', null, t('Итог')),
      h('div.play-end__top', null, ring,
        h('div.play-end__txt', null,
          h('h2.t-l', null, title),
          h('p.lead.muted', null, sub),
          h('div.play-end__stats', null,
            h('div', null, h('small.mono', null, t('Очки')), h('b', { class: 'play-end__score' }, '0')),
            h('div', null, h('small.mono', null, t('Лучшая серия')), h('b', null, `×${bestStreak}`)),
            h('div', null, h('small.mono', null, t('Рекорд')), h('b', null, String(Math.max(prev, score))), record && prev > 0 ? h('em.play-end__rec.mono', null, t('новый')) : null)))),
      h('div.play-tiles', null, tiles),
      h('div.play-end__btns', null, again, profile)));
    focusSoon(again);
    nextFn = () => startGame();

    const sc = stage.querySelector('.play-end__score') as HTMLElement;
    const o = { a: 0, b: 0 };
    const upd = () => { ringNum.textContent = String(Math.round(o.a)); sc.textContent = String(Math.round(o.b)); };
    void arc;
    if (calm) { o.a = nOk; o.b = score; upd(); }
    else {
      tw(gsap.from('.play-ring__seg', { opacity: 0, duration: 0.5, stagger: 0.12, delay: 0.2 }));
      tw(gsap.to(o, { a: nOk, b: score, duration: 1.6, ease: 'power3.out', delay: 0.2, onUpdate: upd }));
      tw(gsap.from('.play-end h2, .play-end .lead, .play-end__stats', { opacity: 0, y: 24, duration: 0.8, ease: 'expo.out', stagger: 0.12, delay: 0.3 }));
      tw(gsap.from('.play-tile', { opacity: 0, x: -14, duration: 0.6, ease: 'expo.out', stagger: 0.05, delay: 0.6, clearProps: 'opacity,transform' }));
    }
    const rect = ring.getBoundingClientRect();
    if (nOk >= 6) setTimeout(() => {
      burst.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, GOLD, 90);
      app.field?.pulse(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }, 700);
  }

  scope.add(() => { stageTweens.forEach((t) => t.kill()); localCleanups.forEach((f) => f()); });
  showStart();
  return root;
}
