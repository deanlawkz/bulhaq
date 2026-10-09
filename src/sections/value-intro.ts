import './value-intro.css';
import { h } from '../engine/dom';
import { t } from '../engine/i18n';
import { reveal, revealWords } from '../engine/motion';
import { ornamentBand, drawOn } from '../engine/ornament';
import type { Scope } from '../engine/page';
import type { ValueContent } from '../content';

export function valueIntroSection(scope: Scope, v: ValueContent): HTMLElement {
  const paras = v.intro.map((txt, i) => h('p', { class: i === 0 ? 'vintro-p vintro-p--first' : 'vintro-p' }, txt));
  const text = h('div.vintro-text', null, paras);
  const kids: HTMLElement[] = [
    h('div.vintro-head', null, h('span.ref', null, t('Вступление')), h('hr.divider')),
    text,
  ];
  scope.add(reveal(paras));

  if (v.proverb) {
    const kz = h('p.vintro-kz', null, v.proverb.kz);
    const ru = h('p.vintro-ru', null, v.proverb.ru);
    const top = ornamentBand(9);
    const bot = ornamentBand(9);
    bot.style.transform = 'scaleY(-1)';
    const fig = h('figure.vintro-proverb', null, top, h('blockquote.vintro-bq', null, kz, ru), bot);
    kids.push(fig);
    scope.add(revealWords(kz, { start: 'top 82%' }));
    scope.add(reveal(ru));
    scope.add(drawOn(top, { trigger: fig }));
    scope.add(drawOn(bot, { trigger: fig }));
  }

  if (v.formula) {
    const f = h('p.vintro-formula', null, v.formula);
    const wrap = h('div.vintro-formula-wrap', null, h('hr.divider'), h('span.ref', null, t('Формула')), f, h('hr.divider'));
    kids.push(wrap);
    scope.add(reveal(f));
  }
  return h('section.section.vintro', null, h('div.wrap.vintro-in', null, kids));
}
