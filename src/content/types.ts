// Контракт контента платформы ХАҚ.
// Источник истины — текст концепции в source/pages/p{N}.txt (N = номер страницы PDF).
// Тексты переносятся дословно (допускается только склейка переносов строк).

export type ValueId =
  | 'adam' | 'adildik' | 'zan' | 'qamqorlyq' | 'birlik'
  | 'otan' | 'dauys' | 'orkendeu' | 'mura' | 'beybitshilik';

export type AudienceId = 'person' | 'organization' | 'society' | 'state';

export interface Audience {
  id: AudienceId;
  /** «Для человека», «Для организации», ... */
  title: string;
  /** Абзацы описания нормы для этой аудитории */
  paragraphs: string[];
  /** Вопросы ХАҚ-теста (без знака «?» в начале строки) */
  test: string[];
}

export interface ValueContent {
  id: ValueId;
  /** Казахское название: «АДАМ» */
  kz: string;
  /** Русский перевод: «Человек» */
  ru: string;
  /** Короткий вопрос со стр. 8: «с чего всё начинается.» */
  tagline: string;
  /** Номер первой страницы главы в PDF */
  page: number;
  /** Вступление главы (культурная отсылка + связь с Конституцией), абзацы */
  intro: string[];
  /** Казахская пословица/напутствие из вступления, если есть: «Адам бол!» */
  proverb?: { kz: string; ru: string };
  /** Итоговая формула вступления, напр. «быть человеком самому и видеть человека в другом» */
  formula?: string;
  /** Вопрос «Бұл ХАҚ па?» для этой ценности */
  criterion: string;
  /** «Что это значит» — абзацы */
  meaning: string[];
  /** «Что говорит Конституция» */
  constitution: {
    /** «статьи 1, 12–25, 36, 41» */
    articles: string;
    paragraphs: string[];
    /** Выделенный итоговый вывод раздела, если есть */
    conclusion?: string;
  };
  /** Блок «X и <образ страны>» (напр. «ӘДІЛДІК и Справедливый Казахстан»), если есть в главе */
  national?: { title: string; paragraphs: string[] };
  /** «… как общественная норма»: четыре аудитории */
  audiences: Audience[];
  /** «LifeХАҚ: как X выглядит в жизни» — короткие сцены */
  life: string[];
}

export interface PairContent {
  /** Пара ценностей, напр. ['adam','qamqorlyq'] */
  values: [ValueId, ValueId];
  /** «ценность человека и забота о нем» */
  summary: string;
  /** «Измерение человека» */
  dimension: string;
  /** Образ страны: «Социальное государство», «Справедливый Казахстан» ... */
  image: string;
  /** Полный абзац со стр. 10 */
  text: string;
}

export interface ConstitutionBasis {
  value: ValueId;
  /** Текст колонки «Статьи Конституции, которые она охватывает» (стр. 9–11) */
  articles: string;
}

export interface ConceptContent {
  preamble: { lead: string; paragraphs: string[] };
  /** Раздел 01 */
  word: {
    title: string;
    paragraphs: string[];
    motto: { kz: string; ru: string };
    abai: { kz: string; ru: string; author: string };
    note: string;
    /** Однокоренные слова: «жалақы», «зейнетақы», ... с переводом */
    family: { word: string; meaning: string }[];
  };
  /** Раздел 02 */
  compass: { title: string; paragraphs: string[] };
  /** Раздел 03 */
  contract: {
    title: string;
    paragraphs: string[];
    stateGives: string[];
    personGives: string[];
    /** Путь ценности: знание → понимание → принятие → воплощение → практика */
    path: string[];
  };
  /** Раздел 04 */
  system: {
    title: string;
    paragraphs: string[];
    pairs: PairContent[];
    basis: ConstitutionBasis[];
  };
  /** Раздел 05 */
  criterion: {
    title: string;
    paragraphs: string[];
    question: { kz: string; ru: string };
    living: { question: string; examples: string[]; closing: string };
  };
  /** Раздел 06 */
  norm: { title: string; paragraphs: string[] };
}

export interface Mechanism {
  id: string;
  /** «ХАҚ Map» */
  name: string;
  /** Подзаголовок: «Конституция находит человека в значимые моменты жизни» */
  subtitle: string;
  kind: 'direct' | 'environmental';
  /** Признак «уникальный механизм ХАҚ» */
  unique: boolean;
  paragraphs: string[];
  /** Маркированные списки внутри описания (если есть) */
  bullets?: string[];
}

export interface MechanismsContent {
  intro: string[];
  principles: { name: string; text: string }[];
  direct: { intro: string[]; items: Mechanism[] };
  environmental: { intro: string[]; items: Mechanism[] };
  /** Заключение документа (последние страницы), если есть */
  closing?: string[];
}
