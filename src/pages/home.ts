// Главная: история концепции от слова «хақ» до культурной нормы.
import { t } from '../engine/i18n';
import { definePage } from '../engine/page';
import { setAccent } from '../engine/app';
import { BRAND } from '../engine/theme';
import { homeHeroSection } from '../sections/home-hero';
import { preambleSection } from '../sections/preamble';
import { wordSection } from '../sections/word';
import { contractSection } from '../sections/contract';
import { constellationSection } from '../sections/constellation';
import { dimensionsSection } from '../sections/dimensions';
import { criterionSection } from '../sections/criterion';
import { normSection } from '../sections/norm';
import { chapterNav, chaptersFrom } from '../sections/chapter-nav';

export default definePage((root, _params, scope) => {
  setAccent(BRAND[1], BRAND[0], BRAND);
  document.title = 'ХАҚ — Халықтық Ата Заң Құндылықтары';
  const sections = [
    homeHeroSection(scope),
    preambleSection(scope),
    wordSection(scope),
    contractSection(scope),
    constellationSection(scope),
    dimensionsSection(scope),
    criterionSection(scope),
    normSection(scope),
  ];
  root.append(...sections);
  chapterNav(scope, chaptersFrom(sections, [
    t('Начало'), t('Преамбула'), t('Слово «хақ»'), t('Общественный договор'), t('Десять ценностей'), t('Пять измерений'), 'Бұл ХАҚ па?', t('От ценности к норме'),
  ]));
});
