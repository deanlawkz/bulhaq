// Языки платформы: ru (оригинал концепции) и kk (казахский перевод).
// UI-строки: t('Русская строка') → перевод из словаря src/i18n/kk.ts, иначе сама строка.
// С подстановками: t('Отвечено {n} из {m}', { n: 3, m: 5 }).
// Контент концепции переключается в src/content/index.ts (живые прокси на текущий язык).

import kk from '../i18n/kk';

export type Lang = 'ru' | 'kk';
const KEY = 'hak.lang';
const listeners = new Set<(l: Lang) => void>();

function initial(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'ru' || v === 'kk') return v;
  } catch { /* приватный режим */ }
  return 'ru';
}

let lang: Lang = initial();
document.documentElement.lang = lang === 'kk' ? 'kk' : 'ru';

export const getLang = (): Lang => lang;

export function setLang(l: Lang) {
  if (l === lang) return;
  lang = l;
  document.documentElement.lang = l === 'kk' ? 'kk' : 'ru';
  try { localStorage.setItem(KEY, l); } catch { /* */ }
  listeners.forEach((fn) => fn(l));
}

export function onLang(fn: (l: Lang) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

const DICTS: Record<Lang, Record<string, string>> = { ru: {}, kk };

/** Перевод UI-строки. Ключ — русская строка как в коде. */
export function t(ru: string, vars?: Record<string, string | number>): string {
  let s = lang === 'ru' ? ru : DICTS[lang][ru] ?? ru;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Выбор по языку для мелочей, которые неудобно класть в словарь (склонения, числа). */
export const pick = <T>(m: { ru: T; kk: T }): T => m[lang];
