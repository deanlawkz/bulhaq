import './value-criterion.css';
import { h } from '../engine/dom';
import { t } from '../engine/i18n';
import { revealWords, gsap, prefersReducedMotion } from '../engine/motion';
import { rosette, drawOn, svg } from '../engine/ornament';
import { valueMeta } from '../engine/theme';
import type { Scope } from '../engine/page';
import type { ValueContent } from '../content';

export function valueCriterionSection(scope: Scope, v: ValueContent): HTMLElement {
  const meta = valueMeta(v.id);
  const q = h('h2.vcrit-q', null, v.criterion);
  const qm = h('span.vcrit-qm', { 'aria-hidden': 'true' }, '?');
  const icon = h('img.vcrit-icon', { src: meta.icon, alt: '', width: 120, height: 120 });

  // тонкие концентрические окружности + деления по кольцу
  let ticks = '';
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2, r0 = 94, r1 = i % 6 === 0 ? 87 : 91;
    ticks += `M${(100 + Math.cos(a) * r0).toFixed(2)} ${(100 + Math.sin(a) * r0).toFixed(2)}L${(100 + Math.cos(a) * r1).toFixed(2)} ${(100 + Math.sin(a) * r1).toFixed(2)}`;
  }
  const S = 'fill="none" stroke="currentColor" vector-effect="non-scaling-stroke"';
  const rings = svg('0 0 200 200',
    `<circle cx="100" cy="100" r="98" ${S} stroke-width="1"/><circle cx="100" cy="100" r="95" ${S} stroke-width=".6" opacity=".6"/>
     <path d="${ticks}" ${S} stroke-width=".8" opacity=".7"/><circle cx="100" cy="100" r="82" ${S} stroke-width=".6" opacity=".5"/>
     <circle cx="100" cy="100" r="46" ${S} stroke-width="1" style="color:var(--accent)"/>`, 'vcrit-rings');
  const ros = rosette('vcrit-ros');
  const medal = h('div.vcrit-medal', { 'aria-hidden': 'true' }, rings, ros, h('span.vcrit-core', null, qm, icon));
  const el = h('section.section.vcrit', null,
    h('div.wrap.vcrit-in', null, medal,
      h('div.vcrit-body', null, h('p.eyebrow', null, t('Бұл ХАҚ па?')), q,
        h('p.vcrit-hint', null, t('Один вопрос, по которому решение или поступок проверяется на эту ценность.')))));
  scope.add(revealWords(q, { start: 'top 85%' }));
  scope.add(drawOn(rings, { trigger: el, start: 'top 70%', duration: 2.6 }));
  scope.add(drawOn(ros, { trigger: el, start: 'top 60%', duration: 2.6 }));

  if (prefersReducedMotion()) {
    gsap.set(qm, { autoAlpha: 0 });
  } else {
    gsap.set(icon, { autoAlpha: 0, scale: 0.6 });
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 50%', end: 'center 35%', scrub: 0.6 } });
    tl.to(qm, { scale: 1.3, autoAlpha: 0, ease: 'power2.in', duration: 1 }, 0)
      .to(icon, { autoAlpha: 1, scale: 1, ease: 'power2.out', duration: 1 }, 0.7);
    gsap.to(rings, { rotate: 360, duration: 240, ease: 'none', repeat: -1 });
  }
  return el;
}
