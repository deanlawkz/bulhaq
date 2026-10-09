// Hash-роутер: #/, #/value/:id, #/mechanisms, #/play, #/profile
import type { Cleanup } from './dom';

export type PageMount = (root: HTMLElement, params: Record<string, string>) => Cleanup | Promise<Cleanup>;
interface Route { pattern: RegExp; keys: string[]; mount: PageMount }

const routes: Route[] = [];
let current: Cleanup | null = null;
let busy = Promise.resolve();

export function route(path: string, mount: PageMount) {
  const keys: string[] = [];
  const pattern = new RegExp('^' + path.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '/?$');
  routes.push({ pattern, keys, mount });
}

export function navigate(path: string) {
  if (location.hash.slice(1) === path) return;
  location.hash = path;
}

export function currentPath() {
  return location.hash.slice(1) || '/';
}

let rerun: (() => void) | null = null;
/** Перерисовать текущую страницу (например, после смены языка). */
export function rerender() { rerun?.(); }

export function startRouter(root: HTMLElement, hooks: { before?: (path: string) => Promise<void> | void; after?: (path: string) => void }) {
  const go = () => {
    busy = busy.then(async () => {
      const path = currentPath();
      const r = routes.find((r) => r.pattern.test(path)) ?? routes[0];
      const m = path.match(r.pattern);
      const params: Record<string, string> = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m?.[i + 1] ?? '')));
      await hooks.before?.(path);
      current?.();
      root.innerHTML = '';
      current = await r.mount(root, params);
      hooks.after?.(path);
    }).catch((e) => console.error(e));
  };
  window.addEventListener('hashchange', go);
  rerun = go;
  go();
}
