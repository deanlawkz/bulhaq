// ЗОНА ОРКЕСТРАТОРА. Героический экран ценности: частицы собираются в её иконку.
import './value-hero.css';
import { h } from '../engine/dom';
import { t } from '../engine/i18n';
import { app } from '../engine/app';
import { gsap, ScrollTrigger, prefersReducedMotion, splitWords } from '../engine/motion';
import { VALUES, valueMeta, DIMENSIONS } from '../engine/theme';
import type { Scope } from '../engine/page';
import type { ValueContent } from '../content/types';

export function valueHeroSection(scope: Scope, v: ValueContent): HTMLElement {
  const meta = valueMeta(v.id);
  const idx = VALUES.findIndex((x) => x.id === v.id);
  const partner = valueMeta(meta.pair);
  const dim = DIMENSIONS[meta.dim];

  const anchor = h('div.vhero__icon', { role: 'img', 'aria-label': t('Знак ценности {name}', { name: v.kz }) }, h('img', { src: meta.icon, alt: '' }));
  const name = h('h1.vhero__kz', { '--len': v.kz.length }, v.kz);
  const el = h('section.vhero', null,
    h('div.wrap.vhero__grid', null,
      h('div.vhero__text', null,
        h('p.eyebrow.vhero__num', null, t('Ценность {n} / 10 · {dim}', { n: String(idx + 1).padStart(2, '0'), dim: t(dim.name) })),
        name,
        h('p.vhero__ru.display', null, v.ru),
        h('p.vhero__tag.lead', null, v.tagline.replace(/\.$/, '') + '?'),
        h('a.chip.vhero__pair', { href: `#/value/${partner.id}`, '--c': partner.color },
          h('img', { src: partner.icon, alt: '' }), t('Смысловая пара: {name}', { name: partner.kz })),
      ),
      anchor,
    ),
  );

  const field = app.field;
  requestAnimationFrame(() => field?.morphTo({ src: meta.icon, anchor, share: 0.8, jitter: 1.2 }));
  const st = ScrollTrigger.create({
    trigger: el, start: 'top top', end: 'bottom 25%',
    onLeave: () => field?.release(),
    onEnterBack: () => field?.morphTo({ src: meta.icon, anchor, share: 0.8, jitter: 1.2 }),
  });
  scope.add(() => st.kill());
  scope.add(() => field?.release());

  if (!prefersReducedMotion()) {
    const letters = splitWords(name);
    const tl = gsap.timeline({ delay: 0.15 });
    tl.from('.vhero__num', { opacity: 0, x: -20, duration: 0.8, ease: 'expo.out' })
      .from(letters, { yPercent: 115, duration: 1.2, ease: 'expo.out' }, 0.1)
      .from(['.vhero__ru', '.vhero__tag', '.vhero__pair'], { opacity: 0, y: 24, filter: 'blur(8px)', stagger: 0.12, duration: 1, ease: 'expo.out' }, 0.45)
      .fromTo(anchor.querySelector('img'), { opacity: 0, scale: 0.85 }, { opacity: 0.06, scale: 1, duration: 2.2, ease: 'power2.out' }, 0.9);
    gsap.to(anchor, { yPercent: 25, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } });
  }
  return el;
}
