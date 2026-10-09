// Анимационный слой: GSAP + ScrollTrigger + Lenis и готовые «приёмы» для секций.
// Все секции анимируют только через эти хелперы или через gsap с учётом prefersReducedMotion().

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import type { Cleanup } from './dom';

gsap.registerPlugin(ScrollTrigger);
export { gsap, ScrollTrigger };

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let lenis: Lenis | null = null;

export function initSmoothScroll(): Lenis | null {
  if (prefersReducedMotion() || lenis) return lenis;
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export function scrollToTop(immediate = true) {
  if (lenis) lenis.scrollTo(0, { immediate });
  else window.scrollTo(0, 0);
}

export function scrollToEl(el: HTMLElement, offset = -80) {
  if (lenis) lenis.scrollTo(el, { offset });
  else el.scrollIntoView({ behavior: 'smooth' });
}

/** Разбивает текст элемента на слова в <span class="w"><span>…</span></span> для анимаций. */
export function splitWords(el: HTMLElement): HTMLElement[] {
  const text = el.textContent ?? '';
  el.textContent = '';
  el.setAttribute('aria-label', text);
  const out: HTMLElement[] = [];
  text.split(/(\s+)/).forEach((part) => {
    if (!part) return;
    if (/^\s+$/.test(part)) {
      el.appendChild(document.createTextNode(' '));
      return;
    }
    const outer = document.createElement('span');
    outer.className = 'w';
    outer.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.textContent = part;
    outer.appendChild(inner);
    el.appendChild(outer);
    out.push(inner);
  });
  return out;
}

/** Плавное появление элементов при входе во вьюпорт (снизу, с размытием). */
export function reveal(
  targets: Element | Element[] | string,
  opts: { y?: number; stagger?: number; delay?: number; start?: string; scope?: Element } = {},
): Cleanup {
  const els = resolve(targets, opts.scope);
  if (!els.length) return () => {};
  if (prefersReducedMotion()) {
    gsap.set(els, { opacity: 1, y: 0, filter: 'none' });
    return () => {};
  }
  const tweens = els.map((el, i) =>
    gsap.fromTo(
      el,
      { opacity: 0, y: opts.y ?? 40, filter: 'blur(8px)' },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1.1,
        ease: 'expo.out',
        delay: (opts.delay ?? 0) + (opts.stagger ? 0 : 0),
        scrollTrigger: { trigger: el, start: opts.start ?? 'top 88%', once: true },
      },
    ).delay((opts.delay ?? 0) + i * 0),
  );
  return () => tweens.forEach((t) => { t.scrollTrigger?.kill(); t.kill(); });
}

/** Заголовок, проявляющийся по словам (слова выезжают из-под маски). */
export function revealWords(el: HTMLElement, opts: { start?: string; delay?: number; immediate?: boolean } = {}): Cleanup {
  const words = splitWords(el);
  if (prefersReducedMotion()) return () => {};
  const tw = gsap.fromTo(
    words,
    { yPercent: 110, rotate: 4 },
    {
      yPercent: 0,
      rotate: 0,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.045,
      delay: opts.delay ?? 0,
      scrollTrigger: opts.immediate ? undefined : { trigger: el, start: opts.start ?? 'top 85%', once: true },
    },
  );
  return () => { tw.scrollTrigger?.kill(); tw.kill(); };
}

/** Текст, который «проявляется» по мере скролла: слова от тусклых к ярким (scrub). */
export function scrubText(el: HTMLElement, opts: { start?: string; end?: string } = {}): Cleanup {
  const words = splitWords(el);
  if (prefersReducedMotion()) return () => {};
  const tw = gsap.fromTo(
    words,
    { opacity: 0.14 },
    {
      opacity: 1,
      stagger: 0.08,
      ease: 'none',
      scrollTrigger: { trigger: el, start: opts.start ?? 'top 80%', end: opts.end ?? 'bottom 45%', scrub: true },
    },
  );
  return () => { tw.scrollTrigger?.kill(); tw.kill(); };
}

/** Счётчик от 0 до значения при появлении. */
export function countUp(el: HTMLElement, to: number, opts: { duration?: number; suffix?: string } = {}): Cleanup {
  const obj = { v: 0 };
  const render = () => (el.textContent = Math.round(obj.v) + (opts.suffix ?? ''));
  if (prefersReducedMotion()) {
    obj.v = to;
    render();
    return () => {};
  }
  const tw = gsap.to(obj, {
    v: to,
    duration: opts.duration ?? 1.6,
    ease: 'power3.out',
    onUpdate: render,
    scrollTrigger: { trigger: el, start: 'top 90%', once: true },
  });
  render();
  return () => { tw.scrollTrigger?.kill(); tw.kill(); };
}

/** «Магнитный» элемент: тянется к курсору. */
export function magnetic(el: HTMLElement, strength = 0.3): Cleanup {
  if (prefersReducedMotion() || matchMedia('(hover: none)').matches) return () => {};
  const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    xTo((e.clientX - (r.left + r.width / 2)) * strength);
    yTo((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const leave = () => { xTo(0); yTo(0); };
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', leave);
  return () => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerleave', leave);
  };
}

/** 3D-наклон карточки за курсором + блик (CSS-переменные --mx/--my в %). */
export function tilt(el: HTMLElement, max = 8): Cleanup {
  if (prefersReducedMotion() || matchMedia('(hover: none)').matches) return () => {};
  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    gsap.to(el, { rotateY: (px - 0.5) * max * 2, rotateX: (0.5 - py) * max * 2, duration: 0.5, ease: 'power2.out', transformPerspective: 900 });
    el.style.setProperty('--mx', px * 100 + '%');
    el.style.setProperty('--my', py * 100 + '%');
  };
  const leave = () => gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', leave);
  return () => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerleave', leave);
  };
}

/** Закрепляет секцию и прокручивает её горизонтальную ленту по вертикальному скроллу. */
export function horizontalScroll(section: HTMLElement, track: HTMLElement): Cleanup {
  if (prefersReducedMotion() || window.innerWidth < 720) return () => {};
  const dist = () => Math.max(0, track.scrollWidth - window.innerWidth + 64);
  const tw = gsap.to(track, {
    x: () => -dist(),
    ease: 'none',
    scrollTrigger: { trigger: section, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true },
  });
  return () => { tw.scrollTrigger?.kill(); tw.kill(); };
}

export function killAllTriggers() {
  ScrollTrigger.getAll().forEach((t) => t.kill());
}

function resolve(t: Element | Element[] | string, scope?: Element): Element[] {
  if (typeof t === 'string') return Array.from((scope ?? document).querySelectorAll(t));
  return Array.isArray(t) ? t : [t];
}
