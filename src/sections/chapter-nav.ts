// ЗОНА ОРКЕСТРАТОРА. Навигация по главам длинной страницы.
// Десктоп: вертикальное оглавление у правого края (номер + название, активная глава подсвечена).
// Мобильный: нижняя панель «‹ · глава N из M · ›», по нажатию на название — список всех глав.
import './chapter-nav.css';
import { h } from '../engine/dom';
import { ScrollTrigger, scrollToEl } from '../engine/motion';
import type { Scope } from '../engine/page';
import { ramHorn, rosette } from '../engine/ornament';
import { t } from '../engine/i18n';

export interface Chapter { el: HTMLElement; title: string }

/** Главы по заголовкам: если title не задан — берётся первый h1/h2 секции. */
export function chaptersFrom(sections: HTMLElement[], titles: (string | undefined)[] = []): Chapter[] {
  return sections.map((el, i) => {
    const auto = el.querySelector('h1, h2')?.getAttribute('aria-label') || el.querySelector('h1, h2')?.textContent || '';
    return { el, title: (titles[i] ?? auto).replace(/\s+/g, ' ').trim().slice(0, 48) || `${t('Глава')} ${i + 1}` };
  });
}

export function chapterNav(scope: Scope, chapters: Chapter[]): void {
  if (chapters.length < 2) return;
  let active = 0;
  const pad = (n: number) => String(n).padStart(2, '0');

  const go = (i: number) => {
    const k = Math.max(0, Math.min(chapters.length - 1, i));
    scrollToEl(chapters[k].el, 0);
    closeSheet();
  };

  // ---------- десктоп: оглавление ----------
  const items = chapters.map((c, i) =>
    h('li', null,
      h('button.cnav__item', { type: 'button', onclick: () => go(i), 'aria-label': `${t('Глава')} ${i + 1}: ${c.title}` },
        h('span.cnav__title', null, h('span.cnav__n', null, pad(i + 1)), c.title),
        h('span.cnav__knot', { 'aria-hidden': 'true' }, h('i.cnav__diamond'), ramHorn('cnav__horn')),
      )),
  );
  const rail = h('nav.cnav', { 'aria-label': t('Главы страницы') },
    rosette('cnav__cap'), h('ol', null, items), rosette('cnav__cap'));

  // ---------- мобильный: нижняя панель ----------
  const label = h('span.cbar__title');
  const count = h('span.cbar__count', { 'aria-hidden': 'true' }, chapters.map(() => h('i')));
  const countSr = h('span.sr-only');
  const prev = h('button.cbar__arrow', { type: 'button', 'aria-label': t('Предыдущая глава'), onclick: () => go(active - 1) }, '←');
  const next = h('button.cbar__arrow', { type: 'button', 'aria-label': t('Следующая глава'), onclick: () => go(active + 1) }, '→');
  const toggle = h('button.cbar__toggle', { type: 'button', 'aria-expanded': 'false', 'aria-controls': 'cbar-sheet', onclick: () => (sheet.hidden ? openSheet() : closeSheet()) }, count, countSr, label);
  const sheet = h('div#cbar-sheet.cbar__sheet', { hidden: true },
    h('p.cbar__sheet-head', null, t('Оглавление')),
    h('ol', null, chapters.map((c, i) => h('li', null,
      h('button', { type: 'button', onclick: () => go(i) }, h('span', null, pad(i + 1)), c.title)))),
  );
  const bar = h('div.cbar', { role: 'navigation', 'aria-label': t('Главы страницы') }, sheet, h('div.cbar__row', null, prev, toggle, next));

  function openSheet() { sheet.hidden = false; toggle.setAttribute('aria-expanded', 'true'); bar.classList.add('is-open'); }
  function closeSheet() { sheet.hidden = true; toggle.setAttribute('aria-expanded', 'false'); bar.classList.remove('is-open'); }

  function setActive(i: number) {
    active = i;
    items.forEach((li, k) => {
      const b = li.firstElementChild as HTMLElement;
      b.classList.toggle('is-active', k === i);
      if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    sheet.querySelectorAll('li button').forEach((b, k) => b.classList.toggle('is-active', k === i));
    label.textContent = chapters[i].title;
    Array.from(count.children).forEach((d, k) => { d.classList.toggle('is-past', k < i); d.classList.toggle('is-now', k === i); });
    countSr.textContent = `${t('Глава')} ${i + 1} / ${chapters.length}`;
    prev.toggleAttribute('disabled', i === 0);
    next.toggleAttribute('disabled', i === chapters.length - 1);
  }
  setActive(0);

  // активная глава — та, что пересекает середину экрана
  const triggers = chapters.map((c, i) =>
    ScrollTrigger.create({ trigger: c.el, start: 'top 55%', end: 'bottom 55%', onToggle: (s) => s.isActive && setActive(i) }),
  );
  // панель видна после первого экрана
  const show = ScrollTrigger.create({ start: () => window.innerHeight * 0.6, end: 'max', onToggle: (s) => document.body.classList.toggle('has-cnav', s.isActive) });

  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSheet(); };
  document.addEventListener('keydown', onKey);
  document.body.append(rail, bar);
  scope.add(() => {
    triggers.forEach((t) => t.kill());
    show.kill();
    rail.remove();
    bar.remove();
    document.body.classList.remove('has-cnav');
    document.removeEventListener('keydown', onKey);
  });
}
