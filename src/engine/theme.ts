// Мета-данные ценностей для визуала: порядок, цвета, иконки. Тексты — в src/content.
import type { ValueId } from '../content/types';
import adam from '../assets/icons/adam.png';
import adildik from '../assets/icons/adildik.png';
import zan from '../assets/icons/zan.png';
import qamqorlyq from '../assets/icons/qamqorlyq.png';
import birlik from '../assets/icons/birlik.png';
import otan from '../assets/icons/otan.png';
import dauys from '../assets/icons/dauys.png';
import orkendeu from '../assets/icons/orkendeu.png';
import mura from '../assets/icons/mura.png';
import beybitshilik from '../assets/icons/beybitshilik.png';
import logo from '../assets/logo.png';
import { t } from './i18n';
import logoMark from '../assets/logo-mark.png';

export { logo, logoMark };

export interface ValueMeta {
  id: ValueId;
  kz: string;
  ru: string;
  /** Основной цвет ценности */
  color: string;
  /** Тройка для градиентов и поля частиц */
  palette: [string, string, string];
  icon: string;
  /** Партнёр по смысловой паре */
  pair: ValueId;
  /** Индекс измерения 0..4 */
  dim: number;
}

const P = (a: string, b: string, c: string): [string, string, string] => [a, b, c];

export const VALUES: ValueMeta[] = [
  { id: 'adam', kz: 'АДАМ', ru: 'Человек', color: '#4fb3a0', palette: P('#4fb3a0', '#19b6d2', '#d6aa4c'), icon: adam, pair: 'qamqorlyq', dim: 0 },
  { id: 'adildik', kz: 'ӘДІЛДІК', ru: 'Справедливость', color: '#3fa7d6', palette: P('#3fa7d6', '#19b6d2', '#d6aa4c'), icon: adildik, pair: 'zan', dim: 1 },
  { id: 'zan', kz: 'ЗАҢ', ru: 'Закон', color: '#8a9be8', palette: P('#8a9be8', '#3fa7d6', '#d6aa4c'), icon: zan, pair: 'adildik', dim: 1 },
  { id: 'qamqorlyq', kz: 'ҚАМҚОРЛЫҚ', ru: 'Забота', color: '#d98a7a', palette: P('#d98a7a', '#d6aa4c', '#efe8d8'), icon: qamqorlyq, pair: 'adam', dim: 0 },
  { id: 'birlik', kz: 'БІРЛІК', ru: 'Единство', color: '#d6aa4c', palette: P('#d6aa4c', '#f0cf7a', '#19b6d2'), icon: birlik, pair: 'beybitshilik', dim: 2 },
  { id: 'otan', kz: 'ОТАН', ru: 'Отечество', color: '#19b6d2', palette: P('#19b6d2', '#d6aa4c', '#efe8d8'), icon: otan, pair: 'dauys', dim: 3 },
  { id: 'dauys', kz: 'ДАУЫС', ru: 'Голос', color: '#a98be0', palette: P('#a98be0', '#19b6d2', '#d6aa4c'), icon: dauys, pair: 'otan', dim: 3 },
  { id: 'orkendeu', kz: 'ӨРКЕНДЕУ', ru: 'Развитие', color: '#7dbf72', palette: P('#7dbf72', '#4fb3a0', '#d6aa4c'), icon: orkendeu, pair: 'mura', dim: 4 },
  { id: 'mura', kz: 'МҰРА', ru: 'Наследие', color: '#c99a5b', palette: P('#c99a5b', '#d6aa4c', '#efe8d8'), icon: mura, pair: 'orkendeu', dim: 4 },
  { id: 'beybitshilik', kz: 'БЕЙБІТШІЛІК', ru: 'Мир', color: '#9fc9e6', palette: P('#9fc9e6', '#efe8d8', '#d6aa4c'), icon: beybitshilik, pair: 'birlik', dim: 2 },
];

// подпись под казахским названием переводится вместе с интерфейсом
for (const v of VALUES) {
  const base = v.ru;
  Object.defineProperty(v, 'ru', { get: () => t(base), enumerable: true });
}

export const valueMeta = (id: ValueId): ValueMeta => VALUES.find((v) => v.id === id)!;

/** Пять измерений (смысловых пар) */
const DIMENSIONS_RU = [
  { name: 'Измерение человека', values: ['adam', 'qamqorlyq'] as ValueId[], color: '#4fb3a0' },
  { name: 'Измерение правил', values: ['adildik', 'zan'] as ValueId[], color: '#3fa7d6' },
  { name: 'Измерение отношений', values: ['birlik', 'beybitshilik'] as ValueId[], color: '#d6aa4c' },
  { name: 'Измерение страны', values: ['otan', 'dauys'] as ValueId[], color: '#a98be0' },
  { name: 'Измерение будущего', values: ['orkendeu', 'mura'] as ValueId[], color: '#7dbf72' },
];

/** Пять измерений; name переводится на лету. */
export const DIMENSIONS = DIMENSIONS_RU.map((d) => ({ ...d, get name() { return t(d.name); } }));

export const BRAND: [string, string, string] = ['#d6aa4c', '#19b6d2', '#efe8d8'];

const AUD_RU = { person: 'Человек', organization: 'Организация', society: 'Общество', state: 'Государство' } as const;
/** Подписи аудиторий — переводятся на лету (t). */
export const AUDIENCE_LABEL = {
  get person() { return t(AUD_RU.person); },
  get organization() { return t(AUD_RU.organization); },
  get society() { return t(AUD_RU.society); },
  get state() { return t(AUD_RU.state); },
};
