// Список ценностей с мини-кольцами прогресса.
import { t } from '../engine/i18n';
import { h } from '../engine/dom';
import type { Scope } from '../engine/page';
import { gsap, prefersReducedMotion, reveal } from '../engine/motion';
import { VALUES, AUDIENCE_LABEL } from '../engine/theme';
import { onAnswers } from '../engine/store';
import type { AudienceId } from '../content';
import { audScore, testLen } from './profile-radar';

const R = 25, CIRC = 2 * Math.PI * R;
const NS = 'http://www.w3.org/2000/svg';

export function profileList(scope: Scope, getAud: () => AudienceId) {
  const calm = prefersReducedMotion();
  const grid = h('div.prof-list__grid');
  const title = h('span.prof-list__aud');
  const arcs = new Map<string, SVGCircleElement>();
  const nums = new Map<string, HTMLElement>();
  const subs = new Map<string, HTMLElement>();

  const items = VALUES.map((m) => {
    const arc = document.createElementNS(NS, 'circle');
    arc.setAttribute('cx', '30'); arc.setAttribute('cy', '30'); arc.setAttribute('r', String(R));
    arc.setAttribute('class', 'prof-ring__arc');
    arc.setAttribute('stroke-dasharray', String(CIRC));
    arc.setAttribute('stroke-dashoffset', String(CIRC));
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 60 60');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `<circle cx="30" cy="30" r="${R}" class="prof-ring__bg"/>`;
    svg.appendChild(arc);
    arcs.set(m.id, arc);
    const num = h('b.prof-item__n');
    const sub = h('small.mono');
    nums.set(m.id, num); subs.set(m.id, sub);
    return h('a.prof-item', { href: `#/value/${m.id}`, '--c': m.color, 'aria-label': m.kz },
      h('span.prof-item__no.mono', null, String(VALUES.indexOf(m) + 1).padStart(2, '0')),
      h('span.prof-ring', null, svg, h('img', { src: m.icon, alt: '' })),
      h('span.prof-item__t', null, h('b.prof-item__kz', null, m.kz), h('small', null, m.ru)), sub,
      num, h('span.prof-item__go', { 'aria-hidden': 'true' }, '→'));
  });
  items.forEach((i) => grid.appendChild(i));

  const render = (animate: boolean) => {
    const a = getAud();
    title.textContent = t(AUDIENCE_LABEL[a]);
    VALUES.forEach((m) => {
      const s = audScore(m.id, a);
      const total = testLen(m.id, a);
      const off = CIRC * (1 - (s.answered ? s.value : 0));
      const arc = arcs.get(m.id)!;
      if (animate && !calm) gsap.to(arc, { attr: { 'stroke-dashoffset': off }, duration: 1, ease: 'power3.out' });
      else arc.setAttribute('stroke-dashoffset', String(off));
      nums.get(m.id)!.textContent = s.answered ? Math.round(s.value * 100) + '%' : '—';
      subs.get(m.id)!.textContent = s.answered ? `${s.answered}/${total}` : t('не пройдено');
    });
  };
  render(false);
  scope.add(onAnswers(() => render(true)));
  requestAnimationFrame(() => render(true));

  const el = h('section.prof-list', { 'aria-label': t('Ценности') },
    h('div.prof-list__head', null, h('h2.t-m', { html: t('По <em>ценностям</em>') }), h('p.muted', null, t('Аудитория: '), title, t('. Откройте любую ценность — там вопросы для всех четырёх аудиторий.'))),
    grid);
  scope.add(reveal(items, { y: 24 }));
  return { el, refresh: () => render(true) };
}
