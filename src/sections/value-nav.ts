import './value-nav.css';
import { h } from '../engine/dom';
import { t } from '../engine/i18n';
import { reveal } from '../engine/motion';
import { ornamentBand } from '../engine/ornament';
import { VALUES, valueMeta } from '../engine/theme';
import type { Scope } from '../engine/page';
import type { ValueContent } from '../content';

export function valueNavSection(scope: Scope, v: ValueContent): HTMLElement {
  const i = VALUES.findIndex((x) => x.id === v.id);
  const prev = VALUES[(i + VALUES.length - 1) % VALUES.length];
  const next = VALUES[(i + 1) % VALUES.length];
  const pair = valueMeta(VALUES[i].pair);

  const pairLink = h('a.vnav-pair', { href: `#/value/${pair.id}` },
    h('span.icon-badge', { '--s': 'clamp(72px, 9vw, 112px)', '--c': pair.color }, h('img', { src: pair.icon, alt: '' })),
    h('span.vnav-pair-t', null,
      h('span.ref', null, t('Смысловая пара')),
      h('span.vnav-pair-kz', null, pair.kz),
      h('span.vnav-pair-ru', null, pair.ru)),
    h('span.vnav-arrow', { 'aria-hidden': 'true' }, '→'));

  const side = (m: typeof prev, label: string, cls: string, arrowFirst: boolean) =>
    h('a', { class: `vnav-side ${cls}`, href: `#/value/${m.id}` },
      h('span.ref', null, label),
      h('span.vnav-side-t', null, arrowFirst && h('span', { 'aria-hidden': 'true' }, '←'), h('span.kz', null, `${m.kz}`), !arrowFirst && h('span', { 'aria-hidden': 'true' }, '→')),
      h('span.vnav-side-ru', null, m.ru));
  const row = h('div.vnav-row', null, side(prev, t('Предыдущая'), 'vnav-prev', true), side(next, t('Следующая'), 'vnav-next', false));

  const dots = VALUES.map((m) =>
    h('a', {
      class: 'vnav-dot' + (m.id === v.id ? ' is-cur' : ''), href: `#/value/${m.id}`, '--c': m.color,
      'aria-label': `${m.kz} — ${m.ru}`, 'aria-current': m.id === v.id ? 'page' : null, title: `${m.kz} · ${m.ru}`,
    }, h('img', { src: m.icon, alt: '' })));
  const sw = h('nav.vnav-switch', { 'aria-label': t('Все ценности') }, dots);

  const el = h('section.section.vnav', null,
    h('div.wrap.vnav-in', null,
      ornamentBand(14),
      pairLink, row, sw,
      h('div.vnav-all', null, h('a.btn', { href: '#/' }, t('К карте всех ценностей')))));
  scope.add(reveal([pairLink, row, sw]));
  return el;
}
