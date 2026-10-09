import './value-meaning.css';
import { h } from '../engine/dom';
import { t } from '../engine/i18n';
import { reveal, revealWords, scrubText } from '../engine/motion';
import { drawOn, illustration, flagKZ } from '../engine/ornament';
import type { IllustrationName } from '../engine/ornament';
import { valueMeta } from '../engine/theme';
import type { Scope } from '../engine/page';
import type { ValueContent, ValueId } from '../content';

const ART: Record<ValueId, IllustrationName> = {
  adam: 'sprout', adildik: 'scales', zan: 'book', qamqorlyq: 'candle', birlik: 'yurt',
  otan: 'shanyrak', dauys: 'book', orkendeu: 'sprout', mura: 'sun', beybitshilik: 'sun',
};

export function valueMeaningSection(scope: Scope, v: ValueContent): HTMLElement {
  const meta = valueMeta(v.id);
  const pair = valueMeta(meta.pair);
  const [first, ...rest] = v.meaning;
  const title = h('h2.t-xl.vmean-title', null, t('Что это значит'));
  const lead = h('p.vmean-lead', null, first ?? '');
  const others = rest.map((txt) => h('p.vmean-p', null, txt));
  scope.add(revealWords(title));
  scope.add(scrubText(lead));
  scope.add(reveal(others));

  const main = h('div.vmean-grid', null,
    h('div.vmean-side', null, h('span.ref', null, t('Смысл')), title),
    h('div.vmean-col', null, lead, others));
  const kids: HTMLElement[] = [main];

  if (v.national) {
    const art = v.id === 'otan' ? flagKZ('vmean-flag') : illustration(ART[v.id], 'illo vmean-illo');
    const ps = v.national.paragraphs.map((txt) => h('p', null, txt));
    const link = h('a.vmean-pair', { href: `#/value/${pair.id}` },
      h('span.icon-badge', { '--s': '48px', '--c': pair.color }, h('img', { src: pair.icon, alt: '' })),
      h('span.vmean-pair-t', null, h('span.ref', null, t('Смысловая пара')), h('b.kz', null, `${pair.kz} · ${pair.ru}`)),
      h('span.vmean-arrow', { 'aria-hidden': 'true' }, '→'));
    const panel = h('aside.vmean-charter', { 'aria-label': v.national.title },
      h('div.vmean-charter-head', null, h('span.ref', null, t('Выдержка из хартии')), h('span.ref', null, t('Образ страны'))),
      h('div.vmean-charter-body', null,
        h('div.vmean-art', null, art),
        h('div.vmean-charter-text', null, h('h3.t-m.vmean-nt', null, v.national.title), h('div.vmean-np', null, ps), link)));
    kids.push(panel);
    scope.add(reveal(panel));
    if (v.id !== 'otan') scope.add(drawOn(art as SVGSVGElement, { trigger: panel, duration: 3 }));
  }
  return h('section.section.vmean', null, h('div.wrap.vmean-in', null, kids));
}
