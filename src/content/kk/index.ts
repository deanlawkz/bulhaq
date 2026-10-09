// Казахский контент. Файлы появляются по мере перевода; чего нет — берётся русский оригинал.
// ПЕРЕВОД ЧЕРНОВОЙ (выполнен агентами), требует вычитки носителем языка.
import type { ConceptContent, MechanismsContent, ValueContent, ValueId } from '../types';

const valueMods = import.meta.glob<{ default: ValueContent }>('./values/*.ts', { eager: true });
const conceptMod = import.meta.glob<{ default: ConceptContent }>('./concept.ts', { eager: true });
const mechMod = import.meta.glob<{ default: MechanismsContent }>('./mechanisms.ts', { eager: true });

export const kkValues: Partial<Record<ValueId, ValueContent>> = {};
for (const [path, m] of Object.entries(valueMods)) {
  const id = path.match(/\/([a-z]+)\.ts$/)![1] as ValueId;
  kkValues[id] = m.default;
}
export const kkConcept: ConceptContent | undefined = Object.values(conceptMod)[0]?.default;
export const kkMechanisms: MechanismsContent | undefined = Object.values(mechMod)[0]?.default;
