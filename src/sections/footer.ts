// ЗОНА ОРКЕСТРАТОРА. Общий футер.
import { t } from '../engine/i18n';
import { h } from '../engine/dom';
import { VALUES, logo } from '../engine/theme';
import { concept } from '../content';
import { ornamentBand } from '../engine/ornament';

export function footerSection(): HTMLElement {
  return h('footer.footer', null,
    h('div.wrap.stack', { '--gap': '28px' },
      ornamentBand(18),
      h('div.row', { style: { justifyContent: 'space-between', alignItems: 'flex-start' } },
        h('div.stack', { '--gap': '10px' },
          h('img', { src: logo, alt: 'ХАҚ — Халықтық Ата Заң Құндылықтары', style: { width: '160px' } }),
          h('p.kz', { style: { margin: '0', color: 'var(--ivory)', fontSize: '20px' } }, concept.word.motto.kz),
          h('p', { style: { margin: '0' } }, concept.word.motto.ru),
        ),
        h('nav.row', { '--gap': '8px', 'aria-label': t('Ценности'), style: { maxWidth: '560px' } },
          VALUES.map((v) => h('a.chip', { href: `#/value/${v.id}` }, v.kz)),
        ),
      ),
      h('hr.divider'),
      h('p', { style: { margin: '0' } },
        t('Интерактивное изложение «Концепции продвижения ценностей Конституции» — новая архитектура продвижения конституционных ценностей. Астана · 2026.')),
    ),
  );
}
