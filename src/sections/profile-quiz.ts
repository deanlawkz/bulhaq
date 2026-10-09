// Быстрый ХАҚ-тест «для себя»: по одному вопросу, Да / Не всегда / Нет (клавиши 1/2/3).
import { t } from '../engine/i18n';
import { h } from '../engine/dom';
import type { Scope } from '../engine/page';
import { gsap, prefersReducedMotion, magnetic } from '../engine/motion';
import { app, setAccent } from '../engine/app';
import { VALUES, valueMeta, BRAND } from '../engine/theme';
import { getAnswer, setAnswer, onAnswers } from '../engine/store';
import type { Answer } from '../engine/store';
import { values } from '../content';
import { getLang } from '../engine/i18n';
import type { ValueId } from '../content';
import { audScore } from './profile-radar';

interface Q { vid: ValueId; i: number; text: string; n: number; of: number }
// Вопросы берутся из живого контента текущего языка (кэш сбрасывается при смене языка).
let qCache: { lang: string; list: Q[] } | null = null;
const getQuestions = (): Q[] => {
  const lg = getLang();
  if (qCache && qCache.lang === lg) return qCache.list;
  const list = VALUES.flatMap((m) => {
    const a = values.find((v) => v.id === m.id)?.audiences.find((x) => x.id === 'person');
    const tests = a?.test ?? [];
    return tests.map((text, i) => ({ vid: m.id, i, text, n: i + 1, of: tests.length }));
  });
  qCache = { lang: lg, list };
  return list;
};
const choices = (): { a: Answer; label: string; key: string }[] => [
  { a: 2, label: t('Да'), key: '1' },
  { a: 1, label: t('Не всегда'), key: '2' },
  { a: 0, label: t('Нет'), key: '3' },
];
const pad3 = (n: number) => String(n).padStart(3, '0');
const answeredCount = () => getQuestions().filter((q) => getAnswer(q.vid, 'person', q.i) != null).length;

export function profileQuiz(scope: Scope): HTMLElement {
  const calm = prefersReducedMotion();
  const QUESTIONS = getQuestions();
  const TOTAL = QUESTIONS.length;
  const CHOICES = choices();
  const body = h('div.prof-quiz__body');
  const root = h('section.prof-quiz', { 'aria-label': t('Быстрый ХАҚ-тест'), id: 'prof-quiz' }, body);
  let mode: 'idle' | 'run' | 'done' = 'idle';
  let idx = 0;
  let lock = false;
  let tws: gsap.core.Animation[] = [];
  let cl: (() => void)[] = [];
  let timer = 0;
  scope.add(() => { clearTimeout(timer); tws.forEach((t) => t.kill()); cl.forEach((f) => f()); setAccent(BRAND[1], BRAND[0], BRAND); });

  const reset = () => { clearTimeout(timer); tws.forEach((t) => t.kill()); tws = []; cl.forEach((f) => f()); cl = []; body.textContent = ''; };
  const T = <A extends gsap.core.Animation>(t: A) => { tws.push(t); return t; };

  function start(from: number) {
    idx = from; mode = 'run'; lock = false;
    if (!calm) root.scrollIntoView({ behavior: 'smooth', block: 'center' });
    renderRun();
  }
  function pause() { mode = 'idle'; setAccent(BRAND[1], BRAND[0], BRAND); renderIdle(); }

  function renderIdle() {
    reset();
    mode = 'idle';
    const n = answeredCount();
    const first = QUESTIONS.findIndex((q) => getAnswer(q.vid, 'person', q.i) == null);
    const complete = n >= TOTAL;
    const main = h('button.btn.btn--primary.prof-quiz__go', { type: 'button', 'data-act': 'start-test' },
      complete ? t('Пройти заново') : n ? t('Продолжить') : t('Пройти ХАҚ-тест для себя'), h('span', { 'aria-hidden': 'true' }, '→'));
    main.addEventListener('click', () => start(complete ? 0 : first));
    cl.push(magnetic(main, 0.25));
    body.append(
      h('p.eyebrow', null, t('Быстрый тест')),
      h('h2.t-m', { html: t('Пройти ХАҚ-тест <em>для себя</em>') }),
      h('p.muted', null, t('{n} коротких вопросов — по несколько на каждую из десяти ценностей. Это зеркало, а не экзамен: отвечайте так, как есть. Радар слева будет меняться сразу.', { n: TOTAL })),
      h('div.prof-bar', { role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': TOTAL, 'aria-valuenow': n, 'aria-label': t('Отвечено') }, h('i', { style: { width: (n / TOTAL) * 100 + '%' } })),
      h('p.prof-quiz__count.dim.mono', null, n ? t('Отвечено {n} / {m}', { n: pad3(n), m: pad3(TOTAL) }) : t('Пока ни одного ответа')),
      h('div.prof-quiz__row', null, main,
        n && !complete ? h('button.btn', { type: 'button', onclick: () => start(0) }, t('Начать заново')) : null),
      h('p.dim.mono.prof-quiz__hint', null, t('1 Да · 2 Не всегда · 3 Нет · ← назад · Esc пауза')));
    if (!calm) T(gsap.from(body.children, { opacity: 0, y: 16, duration: 0.6, ease: 'expo.out', stagger: 0.06 }));
  }

  function renderRun() {
    reset();
    mode = 'run'; lock = false;
    const q = QUESTIONS[idx];
    const m = valueMeta(q.vid);
    const prev = getAnswer(q.vid, 'person', q.i);
    setAccent(m.color, m.palette[1], m.palette);
    root.style.setProperty('--c', m.color);

    const btns = CHOICES.map((c) => h('button.prof-ans', { type: 'button', class: prev === c.a ? 'is-on' : '', 'data-a': String(c.a), 'aria-pressed': String(prev === c.a), onclick: (e: Event) => choose(c, e.currentTarget as HTMLElement) },
      h('kbd.mono', { 'aria-hidden': 'true' }, c.key), h('b', null, c.label)));
    const qEl = h('p.prof-q__text', { 'aria-live': 'polite' }, q.text);
    const dots = h('ol.prof-q__dots', { 'aria-label': t('Вопрос {n} из {m}', { n: q.n, m: q.of }) }, Array.from({ length: q.of }, (_, k) =>
      h('li', { class: k === q.i ? 'is-now' : getAnswer(q.vid, 'person', k) != null ? 'is-done' : '' })));
    const back = h('button.prof-link', { type: 'button', disabled: idx === 0, onclick: () => go(-1) }, t('← Назад'));
    const stop = h('button.prof-link', { type: 'button', onclick: pause }, t('Пауза'));
    body.append(
      h('div.prof-q__no.mono', null, h('span', null, t('№ {n}', { n: pad3(idx + 1) })), h('span', null, `/ ${pad3(TOTAL)}`)),
      h('div.prof-bar', { role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': TOTAL, 'aria-valuenow': idx, 'aria-label': t('Прогресс теста') }, h('i', { style: { width: (idx / TOTAL) * 100 + '%' } })),
      h('div.prof-q__head', null,
        h('span.icon-badge', { '--c': m.color, '--s': '44px' }, h('img', { src: m.icon, alt: '' })),
        h('div', null, h('b.prof-q__kz', null, m.kz), h('small', null, t('{v} · вопрос {n} из {m}', { v: m.ru, n: q.n, m: q.of }))), dots),
      qEl,
      h('div.prof-ans-row', { role: 'group', 'aria-label': t('Ответ') }, btns),
      h('div.prof-q__foot', null, back, stop));
    if (!calm) {
      T(gsap.from(qEl, { opacity: 0, y: 20, duration: 0.5, ease: 'expo.out' }));
      T(gsap.from(btns, { opacity: 0, duration: 0.5, stagger: 0.06, delay: 0.1, clearProps: 'opacity' }));
      T(gsap.fromTo(body.querySelector('.prof-bar i'), { width: Math.max(0, ((idx - 1) / TOTAL) * 100) + '%' }, { width: (idx / TOTAL) * 100 + '%', duration: 0.6, ease: 'power3.out' }));
    }
  }

  function go(d: number) {
    const ni = idx + d;
    if (ni < 0) return;
    if (ni >= TOTAL) { finish(); return; }
    idx = ni; renderRun();
  }

  function choose(c: { a: Answer }, btn?: HTMLElement) {
    if (lock || mode !== 'run') return;
    lock = true;
    const q = QUESTIONS[idx];
    setAnswer(q.vid, 'person', q.i, c.a);
    const target = btn ?? (body.querySelector(`[data-a="${c.a}"]`) as HTMLElement | null);
    if (target) {
      body.querySelectorAll('.prof-ans').forEach((b) => b.classList.toggle('is-on', b === target));
      const r = target.getBoundingClientRect();
      app.field?.pulse(r.left + r.width / 2, r.top + r.height / 2);
      
    }
    timer = window.setTimeout(() => go(1), calm ? 60 : 420);
  }

  function finish() {
    reset();
    mode = 'done';
    setAccent(BRAND[1], BRAND[0], BRAND);
    root.style.removeProperty('--c');
    const ranked = VALUES.map((m) => ({ m, s: audScore(m.id, 'person') })).filter((x) => x.s.answered).sort((a, b) => b.s.value - a.s.value);
    const top = ranked.slice(0, 2);
    const low = ranked.slice(-2).reverse().filter((x) => !top.includes(x));
    const chip = (x: (typeof ranked)[number]) => h('a.prof-pill', { href: `#/value/${x.m.id}`, '--c': x.m.color }, h('span.icon-badge', { '--c': x.m.color, '--s': '30px' }, h('img', { src: x.m.icon, alt: '' })), x.m.kz);
    const again = h('button.btn.btn--primary', { type: 'button', 'data-act': 'start-test', onclick: () => start(0) }, t('Пройти заново'));
    body.append(...([
      h('p.eyebrow', null, t('Готово')),
      h('h2.t-m', null, t('Вы прошли все вопросы')),
      h('p.muted', null, t('Это не оценка, а карта: радар показывает, где ХАҚ в вашей жизни уже ярок, а куда стоит заглянуть с любопытством.')),
      top.length ? h('div.prof-done__row', null, h('span.dim', null, t('Ярче всего сейчас')), ...top.map(chip)) : null,
      low.length ? h('div.prof-done__row', null, h('span.dim', null, t('Загляните, чтобы узнать больше')), ...low.map(chip)) : null,
      h('div.prof-quiz__row', null, again, h('button.btn', { type: 'button', onclick: renderIdle }, t('Закрыть')))] as (HTMLElement | null)[]).filter((x): x is HTMLElement => !!x));
    if (!calm) {
      T(gsap.from(body.children, { opacity: 0, y: 16, duration: 0.6, ease: 'expo.out', stagger: 0.07 }));
      const r = root.getBoundingClientRect();
      app.field?.pulse(r.left + r.width / 2, r.top + r.height / 2);
    }
  }

  scope.on(document, 'keydown', ((e: KeyboardEvent) => {
    if (mode !== 'run' || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = CHOICES.find((c) => c.key === e.key);
    if (k) { e.preventDefault(); choose(k); }
    else if (e.key === 'ArrowLeft' || e.key === 'Backspace') { if (idx > 0 && !lock) { e.preventDefault(); go(-1); } }
    else if (e.key === 'Escape') pause();
  }) as EventListener);

  // счётчик «отвечено» в режиме покоя обновляется при внешних изменениях (сброс)
  scope.add(onAnswers(() => { if (mode === 'idle') renderIdle(); }));

  renderIdle();
  return root;
}
