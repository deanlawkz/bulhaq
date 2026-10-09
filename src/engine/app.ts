// Общие синглтоны приложения, доступные секциям.
import type { Field } from './field';
import { BRAND } from './theme';

export const app = {
  field: null as Field | null,
};

/** Акцент страницы: CSS-переменные + палитра поля + оттенок фона */
export function setAccent(color: string, color2: string, palette: [string, string, string] = BRAND) {
  const r = document.documentElement;
  r.style.setProperty('--accent', color);
  r.style.setProperty('--accent-2', color2);
  app.field?.setPalette(palette);
}
