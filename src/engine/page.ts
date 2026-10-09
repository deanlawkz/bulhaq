// Хелпер страницы: всё, что секции создают через gsap/ScrollTrigger синхронно внутри build,
// автоматически откатывается при уходе со страницы (gsap.context), плюс явные cleanups.
import { cleanups } from './dom';
import { gsap, ScrollTrigger } from './motion';
import type { PageMount } from './router';

export type Scope = ReturnType<typeof cleanups>;
export type Section = (scope: Scope) => HTMLElement;

export function definePage(build: (root: HTMLElement, params: Record<string, string>, scope: Scope) => void): PageMount {
  return (root, params) => {
    const scope = cleanups();
    const ctx = gsap.context(() => build(root, params, scope), root);
    // Секции могут создавать pin-триггеры отложенно (в rAF), поэтому порядок создания ≠ порядку в документе.
    // sort() упорядочивает по позиции, иначе pin-отступы считаются неверно и секции наезжают друг на друга.
    const settle = () => {
      ScrollTrigger.refresh();
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    };
    requestAnimationFrame(() => requestAnimationFrame(settle));
    document.fonts?.ready.then(settle);
    setTimeout(settle, 600);
    return () => {
      scope.run();
      ctx.revert();
    };
  };
}
