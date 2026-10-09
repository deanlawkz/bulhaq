import { t } from '../engine/i18n';
import './mech-closing.css';
import { h } from '../engine/dom';
import { gsap, magnetic, prefersReducedMotion, reveal, revealWords } from '../engine/motion';
import { illustration, ornamentBand, drawOn } from '../engine/ornament';
import type { Scope } from '../engine/page';
import { mechanisms } from '../content';

export function mechClosing(scope: Scope): HTMLElement {
  const [kz, ru] = mechanisms.closing ?? ['Өз хақыңды біл. Өзгенің хақын құрметте.', 'Знай свое право и уважай право другого'];
  const [a, b] = kz.split(/(?<=\.)\s+/);
  const l1 = h('span.mech-close__l1', null, a);
  const l2 = h('span.mech-close__l2', null, b);
  const motto = h('h2.mech-close__motto.kz', { lang: 'kk' }, l1, l2);
  const tr = h('p.mech-close__tr', null, ru);
  const home = h('a.btn.btn--primary', { href: '#/' }, t('На главную'));
  const play = h('a.btn', { href: '#/play' }, t('Пройти ХАҚ-тест'));
  const art = illustration('shanyrak', 'mech-close__art');
  const el = h('section.section.mech-close', null,
    h('div.mech-close__artwrap', { 'aria-hidden': 'true' }, art),
    h('div.wrap.mech-close__in', null,
      ornamentBand(14, 'mech-close__band'),
      motto, tr, h('div.row.mech-close__cta', null, home, play)));
  scope.add(revealWords(l1, { start: 'top 85%' }));
  scope.add(revealWords(l2, { start: 'top 85%', delay: 0.5 }));
  motto.setAttribute('aria-label', kz);
  scope.add(reveal(tr));
  scope.add(reveal(el.querySelector('.mech-close__cta') as HTMLElement));
  scope.add(magnetic(home, 0.2));
  scope.add(magnetic(play, 0.2));
  scope.add(drawOn(art, { scrub: true, trigger: el, start: 'top 80%' }));
  if (!prefersReducedMotion()) gsap.to(art, { rotate: 360, duration: 300, ease: 'none', repeat: -1, transformOrigin: '50% 50%' });
  return el;
}
