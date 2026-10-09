// ЗОНА ОРКЕСТРАТОРА. Героический экран: частицы собираются в логотип ХАҚ.
import { t } from '../engine/i18n';
import './home-hero.css';
import { h } from '../engine/dom';
import { app } from '../engine/app';
import { gsap, ScrollTrigger, magnetic, prefersReducedMotion, scrollToEl, splitWords } from '../engine/motion';
import { VALUES, logoMark } from '../engine/theme';
import { concept } from '../content';
import type { Scope } from '../engine/page';
import { ornamentBand, drawOn } from '../engine/ornament';

export function homeHeroSection(scope: Scope): HTMLElement {
  const anchor = h('div.hero__logo', { role: 'img', 'aria-label': 'ХАҚ' }, h('img.hero__ghost', { src: logoMark, alt: '' }));
  const title = h('h1.hero__title', null, t('Новая архитектура продвижения конституционных ценностей'));
  const band = ornamentBand(14, 'orn-band hero__band');
  const motto = h('p.hero__motto.kz', null, concept.word.motto.kz);
  const icons = h('div.hero__icons', null,
    VALUES.map((v) =>
      h('a.hero__icon', { href: `#/value/${v.id}`, '--c': v.color, title: `${v.kz} — ${v.ru}` },
        h('img', { src: v.icon, alt: '' }),
        h('span', null, v.kz),
      ),
    ),
  );
  const cue = h('button.hero__cue', { 'aria-label': t('Листать дальше'), onclick: () => scrollToEl(el.nextElementSibling as HTMLElement, 0) },
    h('span', null, t('Листайте')), h('i'));

  const el = h('section.hero', null,
    h('div.hero__inner.wrap', null,
      h('p.hero__eyebrow.eyebrow', null, 'Халықтық Ата Заң Құндылықтары'),
      anchor,
      title,
      band,
      motto,
      icons,
    ),
    cue,
  );

  // частицы → логотип; при уходе с экрана — отпускаем
  const field = app.field;
  const assemble = () => field?.morphTo({ src: logoMark, anchor, share: 0.82 });
  requestAnimationFrame(assemble);
  const st = ScrollTrigger.create({
    trigger: el,
    start: 'top top',
    end: 'bottom 30%',
    onLeave: () => field?.release(),
    onEnterBack: () => assemble(),
  });
  scope.add(() => st.kill());
  scope.add(() => field?.release());
  scope.add(magnetic(cue, 0.4));
  scope.add(drawOn(band, { duration: 3, start: 'top bottom' }));

  if (!prefersReducedMotion()) {
    const words = splitWords(title);
    const tl = gsap.timeline({ delay: 0.5 });
    tl.from('.hero__eyebrow', { opacity: 0, letterSpacing: '0.8em', duration: 1.6, ease: 'expo.out' }, 0)
      .fromTo('.hero__ghost', { opacity: 0, scale: 0.96 }, { opacity: 0.07, scale: 1, duration: 2.4, ease: 'power2.out' }, 1.2)
      .from(words, { yPercent: 110, rotate: 5, duration: 1.2, ease: 'expo.out', stagger: 0.05 }, 1.1)
      .from(motto, { opacity: 0, y: 20, filter: 'blur(10px)', duration: 1.2, ease: 'expo.out' }, 1.6)
      .from('.hero__icon', { opacity: 0, y: 30, scale: 0.6, duration: 0.9, ease: 'back.out(2)', stagger: 0.06 }, 1.8)
      .from(cue, { opacity: 0, duration: 1 }, 2.6);
    // параллакс: логотип уходит медленнее текста, слегка растворяется
    gsap.to(anchor, { yPercent: 30, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__inner > :not(.hero__logo)', { opacity: 0, y: -40, ease: 'none', scrollTrigger: { trigger: el, start: '30% top', end: '80% top', scrub: true } });
  }
  return el;
}
