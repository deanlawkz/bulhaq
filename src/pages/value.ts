import { definePage } from '../engine/page';
import { setAccent } from '../engine/app';
import { t } from '../engine/i18n';
import { BRAND, valueMeta } from '../engine/theme';
import { valueById } from '../content';
import type { ValueId } from '../content';
import { valueHeroSection } from '../sections/value-hero';
import { valueIntroSection } from '../sections/value-intro';
import { valueCriterionSection } from '../sections/value-criterion';
import { valueMeaningSection } from '../sections/value-meaning';
import { valueConstitutionSection } from '../sections/value-constitution';
import { valueAudiencesSection } from '../sections/value-audiences';
import { valueLifeSection } from '../sections/value-life';
import { valueNavSection } from '../sections/value-nav';
import { chapterNav, chaptersFrom } from '../sections/chapter-nav';

export default definePage((root, params, scope) => {
  const v = valueById(params.id as ValueId) ?? valueById('adam')!;
  const meta = valueMeta(v.id);
  setAccent(meta.color, meta.palette[2], meta.palette);
  const prevTitle = document.title;
  document.title = `${v.kz} — ${v.ru} · ХАҚ`;
  scope.add(() => {
    document.title = prevTitle;
    setAccent(BRAND[1], BRAND[0], BRAND);
  });
  const sections = [
    valueHeroSection(scope, v),
    valueIntroSection(scope, v),
    valueCriterionSection(scope, v),
    valueMeaningSection(scope, v),
    valueConstitutionSection(scope, v),
    valueAudiencesSection(scope, v),
    valueLifeSection(scope, v),
    valueNavSection(scope, v),
  ];
  root.append(...sections);
  chapterNav(scope, chaptersFrom(sections, [
    v.kz, t('Вступление'), t('Бұл ХАҚ па?'), t('Что это значит'), t('Что говорит Конституция'), t('Норма для всех'), 'LifeХАҚ', t('Другие ценности'),
  ]));
});
