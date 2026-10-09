// Минимальный DOM-хелпер. h('div.card.glass', { onclick }, ...children)

export type Cleanup = () => void;
export type Child = Node | string | number | null | undefined | false | Child[];
type StyleObj = Partial<Record<keyof CSSStyleDeclaration, string | number>> & { [custom: `--${string}`]: string | number };
type Attrs = Record<string, unknown> & { style?: StyleObj | string };

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K | `${K}.${string}` | `${K}#${string}`,
  attrs?: Attrs | null,
  ...children: Child[]
): HTMLElementTagNameMap[K];
export function h(tag: string, attrs?: Attrs | null, ...children: Child[]): HTMLElement;
export function h(tag: string, attrs?: Attrs | null, ...children: Child[]): HTMLElement {
  // 'tag#id.a.b' и 'tag.a.b#id' — оба порядка
  const name = tag.match(/^[^.#]*/)![0];
  const id = tag.match(/#([^.#]+)/)?.[1];
  const classes = Array.from(tag.matchAll(/\.([^.#]+)/g), (m) => m[1]);
  const el = document.createElement(name || 'div');
  if (id) el.id = id;
  if (classes.length) el.className = classes.join(' ');
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') {
        el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
      } else if (k === 'style') {
        if (typeof v === 'string') el.setAttribute('style', v);
        else
          for (const [sk, sv] of Object.entries(v as Record<string, unknown>)) {
            if (sv == null) continue;
            if (sk.startsWith('--')) el.style.setProperty(sk, String(sv));
            else (el.style as unknown as Record<string, string>)[sk] = String(sv);
          }
      } else if (k === 'class' || k === 'className') {
        el.className = [el.className, v].filter(Boolean).join(' ');
      } else if (k === 'html') {
        el.innerHTML = String(v);
      } else if (k.startsWith('--')) {
        el.style.setProperty(k, String(v));
      } else if (v === true) {
        el.setAttribute(k, '');
      } else {
        el.setAttribute(k, String(v));
      }
    }
  }
  append(el, children);
  return el;
}

export function append(parent: Node, children: Child[]): void {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) append(parent, c);
    else parent.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
  }
}

/** Набор функций очистки; удобно собирать всё, что секция повесила. */
export function cleanups() {
  const fns: Cleanup[] = [];
  return {
    add(fn: Cleanup | void | undefined) {
      if (fn) fns.push(fn);
    },
    on<T extends EventTarget>(t: T, ev: string, fn: EventListener, opts?: AddEventListenerOptions) {
      t.addEventListener(ev, fn, opts);
      fns.push(() => t.removeEventListener(ev, fn, opts));
    },
    run() {
      while (fns.length) {
        try {
          fns.pop()!();
        } catch (e) {
          console.error(e);
        }
      }
    },
  };
}

export const qs = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector(sel) as T | null;
export const qsa = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll(sel)) as T[];

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
