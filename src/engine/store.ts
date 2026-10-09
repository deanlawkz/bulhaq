// Локальное хранилище ответов ХАҚ-теста (только в браузере пользователя).
// Ключ ответа: `${valueId}:${audienceId}:${questionIndex}` → 0 (нет) | 1 (иногда) | 2 (да)
import type { AudienceId, ValueId } from '../content/types';

export type Answer = 0 | 1 | 2;
const KEY = 'hak.answers.v1';
type Listener = () => void;
const listeners = new Set<Listener>();

function read(): Record<string, Answer> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}
let cache = read();

export const answerKey = (v: ValueId, a: AudienceId, i: number) => `${v}:${a}:${i}`;

export function getAnswer(v: ValueId, a: AudienceId, i: number): Answer | undefined {
  return cache[answerKey(v, a, i)];
}

export function setAnswer(v: ValueId, a: AudienceId, i: number, ans: Answer) {
  cache[answerKey(v, a, i)] = ans;
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* приватный режим — живём в памяти */
  }
  listeners.forEach((l) => l());
}

/** Доля «ХАҚ» по ценности и аудитории: 0..1, и сколько вопросов отвечено */
export function score(v: ValueId, a: AudienceId, total: number): { value: number; answered: number } {
  let sum = 0, answered = 0;
  for (let i = 0; i < total; i++) {
    const x = cache[answerKey(v, a, i)];
    if (x != null) { sum += x; answered++; }
  }
  return { value: answered ? sum / (answered * 2) : 0, answered };
}

export function resetAnswers() {
  cache = {};
  try { localStorage.removeItem(KEY); } catch { /* */ }
  listeners.forEach((l) => l());
}

export function onAnswers(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Произвольные флаги прогресса (посещённые ценности, рекорд игры) */
export function getFlag<T>(name: string, def: T): T {
  try {
    const v = localStorage.getItem('hak.' + name);
    return v == null ? def : (JSON.parse(v) as T);
  } catch {
    return def;
  }
}
export function setFlag<T>(name: string, v: T) {
  try { localStorage.setItem('hak.' + name, JSON.stringify(v)); } catch { /* */ }
}
