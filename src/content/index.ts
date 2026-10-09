// Единая точка доступа к контенту. Экспорты — «живые»: всегда отдают текст текущего языка (engine/i18n).
import type { ConceptContent, MechanismsContent, ValueContent, ValueId } from './types';
import adam from './values/adam';
import adildik from './values/adildik';
import zan from './values/zan';
import qamqorlyq from './values/qamqorlyq';
import birlik from './values/birlik';
import otan from './values/otan';
import dauys from './values/dauys';
import orkendeu from './values/orkendeu';
import mura from './values/mura';
import beybitshilik from './values/beybitshilik';
import ruConcept from './concept';
import ruMechanisms from './mechanisms';
import { kkConcept, kkMechanisms, kkValues } from './kk';
import { getLang } from '../engine/i18n';

const ruValues: ValueContent[] = [adam, adildik, zan, qamqorlyq, birlik, otan, dauys, orkendeu, mura, beybitshilik];

const curValues = (): ValueContent[] => (getLang() === 'kk' ? ruValues.map((v) => kkValues[v.id] ?? v) : ruValues);
const curConcept = (): ConceptContent => (getLang() === 'kk' && kkConcept) || ruConcept;
const curMechanisms = (): MechanismsContent => (getLang() === 'kk' && kkMechanisms) || ruMechanisms;

/** Прокси, переадресующий любое обращение к объекту текущего языка. */
function live<T extends object>(get: () => T): T {
  return new Proxy({} as T, {
    get: (_t, k) => { const o = get() as Record<PropertyKey, unknown>; const v = o[k]; return typeof v === 'function' ? (v as Function).bind(o) : v; },
    has: (_t, k) => k in get(),
    ownKeys: () => Reflect.ownKeys(get()),
    getOwnPropertyDescriptor: (_t, k) => ({ ...Reflect.getOwnPropertyDescriptor(get(), k), configurable: true }),
  });
}

export const values: ValueContent[] = live(curValues);
export const concept: ConceptContent = live(curConcept);
export const mechanisms: MechanismsContent = live(curMechanisms);
export const valueById = (id: ValueId) => curValues().find((v) => v.id === id);
export * from './types';
