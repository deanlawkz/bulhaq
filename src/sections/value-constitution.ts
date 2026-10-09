import './value-constitution.css';
import { h } from '../engine/dom';
import { reveal, revealWords, gsap, prefersReducedMotion } from '../engine/motion';
import { values } from '../content';
import { t } from '../engine/i18n';
import { valueMeta } from '../engine/theme';
import type { Scope } from '../engine/page';
import type { ValueContent } from '../content';

/** 0 = преамбула, остальное — номера статей (диапазоны «12–25» раскрываются). Язык-независимо: ru «статьи 1, 12–25; преамбула», kk «1, 12–25-баптар; преамбула». */
export function parseArticles(text: string): Set<number> {
  const out = new Set<number>();
  if (/преамбул|кіріспе/i.test(text)) out.add(0);
  const body = text.replace(/(?:преамбул|кіріспе)\p{L}*/giu, '');
  for (const m of body.matchAll(/(\d+)(?:\s*[–—-]\s*(\d+))?/g)) {
    const a = +m[1];
    const b = m[2] ? +m[2] : a;
    for (let i = a; i <= b; i++) out.add(i);
  }
  return out;
}

function maxArticle(): number {
  let max = 0;
  const feed = (t: string) => parseArticles(t).forEach((n) => (max = Math.max(max, n)));
  values.forEach((x) => feed(x.constitution.articles));
  return max;
}

export function valueConstitutionSection(scope: Scope, v: ValueContent): HTMLElement {
  const N = maxArticle();
  const mine = parseArticles(v.constitution.articles);
  const sets = values.map((x) => ({ x, set: parseArticles(x.constitution.articles) }));
  const label = (n: number) => (n === 0 ? t('Преамбула') : t('Статья {n}', { n }));

  const readout = h('p.vconst-readout', { 'aria-live': 'polite' }, t('Выберите подсвеченную статью'));
  const select = (n: number, btn: HTMLElement) => {
    mapEl.querySelectorAll('.is-sel').forEach((e) => e.classList.remove('is-sel'));
    btn.classList.add('is-sel');
    const others = sets.filter((s) => s.x.id !== v.id && s.set.has(n)).map((s) => s.x.kz);
    readout.innerHTML = '';
    readout.append(h('b', null, label(n)), t(' — входит в {name}', { name: v.kz }), others.length ? h('span', null, t(' · также: {list}', { list: others.join(', ') })) : '');
  };

  const cells: HTMLElement[] = [];
  const lit: HTMLElement[] = [];
  for (let n = 0; n <= N; n++) {
    const on = mine.has(n);
    const shared = sets.filter((s) => s.set.has(n)).length;
    const txt = n === 0 ? t('Преамб.') : String(n).padStart(2, '0');
    let c: HTMLElement;
    if (on) {
      c = h('button.vconst-cell.is-lit', { type: 'button', 'aria-label': t('{label}, входит в {name}', { label: label(n), name: v.kz }) }, h('i.vconst-mark', { 'aria-hidden': 'true' }), txt);
      c.addEventListener('click', () => select(n, c));
      c.addEventListener('focus', () => select(n, c));
      c.addEventListener('pointerenter', () => select(n, c));
      lit.push(c);
    } else {
      c = h('div.vconst-cell', { 'aria-hidden': 'true', title: label(n) }, txt);
    }
    if (n === 0) c.classList.add('vconst-cell--pre');
    c.style.setProperty('--d', String(Math.min(shared, 5)));
    cells.push(c);
  }
  const mapEl = h('div.vconst-map', { role: 'group', 'aria-label': t('Карта статей Конституции: {list}', { list: v.constitution.articles }) }, cells);

  const icon = valueMeta(v.id).icon;
  const count = h('span.vconst-count', null, String(lit.length - (mine.has(0) ? 1 : 0)));
  const mapCard = h('div.vconst-mapcard', null,
    h('div.vconst-maphead', null,
      h('span.icon-badge', { '--s': '44px' }, h('img', { src: icon, alt: '' })),
      h('p.vconst-legend', null, h('span.ref', null, t('Оглавление Конституции')), h('br'), count, t(' из {N} статей и преамбула обращены к ценности {name}', { N, name: v.kz }))),
    mapEl, readout,
    h('p.vconst-arts.muted', null, v.constitution.articles));

  // timeline
  const items = v.constitution.paragraphs.map((txt) => h('li.vconst-item', null, h('span.vconst-dot', { 'aria-hidden': 'true' }), h('p', null, txt)));
  const line = h('span.vconst-line', { 'aria-hidden': 'true' });
  const story = h('ol.vconst-story', null, line, items);

  const title = h('h2.t-xl', null, t('Что говорит Конституция'));
  const head = h('div.vconst-head', null, h('span.ref', null, t('Конституция')), title);
  const kids: HTMLElement[] = [head, h('div.vconst-grid', null, h('div.vconst-left', null, mapCard), story)];

  let concl: HTMLElement | null = null;
  if (v.constitution.conclusion) {
    const ct = h('p.vconst-concl-t', null, v.constitution.conclusion);
    concl = h('div.vconst-concl', null, h('span.ref.vconst-concl-k', null, t('Вывод')), ct);
    kids.push(concl);
    scope.add(revealWords(ct, { start: 'top 85%' }));
    scope.add(reveal(concl.querySelector('.vconst-concl-k')!));
  }

  const el = h('section.section.vconst', null, h('div.wrap', null, kids));
  scope.add(revealWords(title));
  scope.add(reveal(mapCard));

  const reduced = prefersReducedMotion();
  if (reduced) {
    gsap.set(lit, { '--on': 1 });
    gsap.set(items.map((i) => i.querySelector('.vconst-dot')), { '--on': 1 });
  } else {
    gsap.set(lit, { '--on': 0 });
    gsap.set(line, { scaleY: 0 });
    gsap.to(lit, {
      '--on': 1, duration: 0.7, ease: 'power2.out', stagger: { each: 0.05, from: 'start' },
      scrollTrigger: { trigger: mapEl, start: 'top 75%', once: true },
    });
    gsap.to(line, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: story, start: 'top 70%', end: 'bottom 70%', scrub: true } });
    items.forEach((it) => {
      const dot = it.querySelector('.vconst-dot')!;
      const p = it.querySelector('p')!;
      gsap.set(dot, { '--on': 0 });
      gsap.fromTo(p, { opacity: 0.2, y: 16 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: it, start: 'top 72%', toggleActions: 'play none none reverse' } });
      gsap.to(dot, { '--on': 1, duration: 0.6, ease: 'back.out(3)', scrollTrigger: { trigger: it, start: 'top 72%', toggleActions: 'play none none reverse' } });
    });
  }
  return el;
}
