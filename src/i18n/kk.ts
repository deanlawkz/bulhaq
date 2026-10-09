// Словарь UI-строк для казахской версии: ключ — русская строка как в коде (t('...')), значение — перевод.
// Собирается из файлов src/i18n/kk-*.ts (у каждой группы секций свой файл — агенты не мешают друг другу).
// ПЕРЕВОД ЧЕРНОВОЙ (выполнен агентами), требует вычитки носителем языка.
const parts = import.meta.glob<{ default: Record<string, string> }>('./kk-*.ts', { eager: true });
const kk: Record<string, string> = {};
for (const m of Object.values(parts)) Object.assign(kk, m.default);
export default kk;
