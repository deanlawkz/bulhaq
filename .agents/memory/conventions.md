# Конвенции проекта (ведёт оркестратор)

## Команды
- `npm run dev` — dev-сервер (http://localhost:5173)
- `npm run typecheck` — обязательно перед сдачей
- `npm run build` / `npm run build:single`
- Скриншоты для самопроверки: `node scripts/shot.mjs '#/route' out.png [width]` (Playwright + Chromium уже установлены; см. файл, если он есть). Скриншоты сохраняй в scratchpad, не в репо.

## Стек
Vite + TS (strict, noUnusedLocals), без фреймворка. GSAP 3 + ScrollTrigger, Lenis. Шрифты (v2): Noto Serif Display (`--f-display`), Golos Text (`--f-text`), IBM Plex Mono (`--f-mono`). АРТ-ДИРЕКШН — `.agents/memory/design.md` (обязателен).

## Структура
- `src/content/` — контент (дословно из PDF). Доступ: `import { values, valueById, concept, mechanisms } from '../content'`.
- `src/engine/` — зона оркестратора (не редактировать, предлагать изменения в отчёте):
  - `dom.ts` — `h(tag, attrs, ...children)`, `cleanups()`, `qs`, `qsa`, `clamp`, `lerp`.
    - `h('div.card.glass', { onclick: fn, style: {...}, '--c': '#fff', html: '<b>..</b>' }, child1, [child2, child3])`
  - `motion.ts` — `gsap`, `ScrollTrigger`, `prefersReducedMotion()`, `reveal(els)`, `revealWords(el)`, `scrubText(el)`, `countUp(el, n)`, `magnetic(el)`, `tilt(el)`, `horizontalScroll(section, track)`, `splitWords(el)`, `scrollToEl(el)`. Все возвращают Cleanup.
  - `field.ts` — поле частиц. Доступ: `import { app } from '../engine/app'` → `app.field?.morphTo({ src, anchor })`, `.release()`, `.pulse(x,y)`, `.setIntensity(0..1)`, `.setPalette([...])`.
  - `app.ts` — `app`, `setAccent(color, color2, palette)` (CSS `--accent`, `--accent-2`).
  - `theme.ts` — `VALUES` (id, kz, ru, color, palette, icon (URL png белой иконки), pair, dim), `valueMeta(id)`, `DIMENSIONS`, `BRAND`, `AUDIENCE_LABEL`, `logo`.
  - `store.ts` — ответы ХАҚ-теста: `getAnswer/setAnswer(valueId, audienceId, i, 0|1|2)`, `score(...)`, `onAnswers(cb)`, `getFlag/setFlag`.
  - `ornament.ts` — орнамент, флаги, линейные иллюстрации, `drawOn(svg)` (см. design.md).
  - `page.ts` — `definePage((root, params, scope) => {...})`. `Section = (scope) => HTMLElement`.
  - `router.ts` — `navigate('/value/adam')`; ссылки делай обычными `<a href="#/value/adam">`.
- `src/sections/*.ts` — секции. Каждая экспортирует функцию, которая принимает `scope` (+данные) и ВОЗВРАЩАЕТ элемент `<section>`. Анимации навешивай внутри функции синхронно (gsap.context страницы их откатит), либо регистрируй очистку через `scope.add(cleanupFn)` / `scope.on(target, 'event', fn)`.
  - ВАЖНО: элемент ещё не в DOM в момент вызова. ScrollTrigger с `trigger: el` работает (ищет позицию при refresh). Если нужно мерить размеры — делай это в `requestAnimationFrame` или по событию.
- `src/sections/<name>.css` — стили секции, импортируй из её .ts (`import './name.css'`). Префикс классов — имя секции (`.word-tree__node`), чтобы не конфликтовать.
- `src/pages/*.ts` — сборка страниц из секций.

## Пример секции
```ts
import './example.css';
import { h } from '../engine/dom';
import { reveal, revealWords, tilt } from '../engine/motion';
import type { Scope } from '../engine/page';

export function exampleSection(scope: Scope): HTMLElement {
  const title = h('h2.t-l', null, 'Заголовок');
  const card = h('div.glass.card.shine', null, h('p', null, 'Текст'));
  const el = h('section.section.example', null, h('div.wrap.stack', null, h('p.eyebrow', null, '01'), title, card));
  scope.add(revealWords(title));
  scope.add(reveal(card));
  scope.add(tilt(card));
  return el;
}
```

## Дизайн
- Тёмный глубокий фон, поле частиц позади всего; контент — на «стекле» (`.glass`) или прямо на фоне.
- Токены: `--ink`, `--ink-2`, `--ink-3`, `--line`, `--glass`, `--accent`, `--accent-2`, `--brand-grad`, `--r-s/m/l`, `--ease`, `--gutter`.
- Классы: `.wrap .section .screen .stack .row .grid(--min) .split .glass .card .shine .btn(.btn--primary/.btn--accent) .chip(.chip--on) .icon-badge(--c,--s) .eyebrow .t-hero/.t-xl/.t-l/.t-m/.t-s .lead .muted .dim .grad-text .quote .kz .prose`.
- Каждая идея — через механику: интерактив (клик/ховер/перетаскивание/выбор), scroll-driven анимацию, или визуальную метафору. Без «стены текста»: длинные абзацы — раскрываемые, или проявляются по скроллу.
- Мобильная версия обязательна (от 360px): без горизонтального скролла страницы, тач-цели ≥ 44px, hover-эффекты не должны быть единственным способом получить информацию.
- Доступность: интерактивы — настоящие `<button>`, есть `aria-*`, фокус виден. `prefers-reduced-motion` — без тяжёлых анимаций.
- Иконки ценностей — белые PNG (`valueMeta(id).icon`), красить можно через `.icon-badge` фон или CSS `filter`/`mask-image`.
- Язык интерфейса — русский; казахские термины — как в концепции.
