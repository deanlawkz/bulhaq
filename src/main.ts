import './styles/base.css';
import { h, qs } from './engine/dom';
import { createField } from './engine/field';
import { app, setAccent } from './engine/app';
import { gsap, initSmoothScroll, killAllTriggers, prefersReducedMotion, scrollToTop, ScrollTrigger } from './engine/motion';
import { route, startRouter, currentPath } from './engine/router';
import { BRAND, logo } from './engine/theme';
import home from './pages/home';
import value from './pages/value';
import mechanisms from './pages/mechanisms';
import play from './pages/play';
import profile from './pages/profile';
import { footerSection } from './sections/footer';
import { getLang, onLang, setLang, t } from './engine/i18n';
import { rerender } from './engine/router';

app.field = createField(qs<HTMLCanvasElement>('#field')!);
initSmoothScroll();

// ---------- шапка ----------
const links: [string, string][] = [
  ['#/', 'Концепция'],
  ['#/value/adam', 'Ценности'],
  ['#/mechanisms', 'Механизмы'],
  ['#/play', 'Бұл ХАҚ па?'],
  ['#/profile', 'Мой ХАҚ'],
];
const linkEls = links.map(([href, label]) => h('a', { href, onclick: () => nav.classList.remove('nav--open') }, t(label)));
const langBtns = (['kk', 'ru'] as const).map((l) =>
  h('button.nav__lang-btn', { type: 'button', 'aria-pressed': String(getLang() === l), lang: l, onclick: () => setLang(l) }, l === 'kk' ? 'Қаз' : 'Рус'),
);
const burger = h('button.nav__burger', { 'aria-label': t('Меню'), onclick: () => nav.classList.toggle('nav--open') }, t('Меню'));
const nav = h('header.nav', null,
  h('a.nav__logo', { href: '#/', 'aria-label': 'ХАҚ' }, h('img', { src: logo, alt: 'ХАҚ' })),
  h('div.nav__right', null,
    h('nav.nav__links', null, linkEls),
    h('div.nav__lang', { role: 'group', 'aria-label': 'Язык / Тіл' }, langBtns),
    burger,
  ),
);
onLang((l) => {
  linkEls.forEach((a, i) => (a.textContent = t(links[i][1])));
  burger.textContent = t('Меню');
  langBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('lang') === l)));
  rerender();
});
document.body.prepend(nav);

let lastY = 0;
ScrollTrigger.create({
  start: 0,
  end: 'max',
  onUpdate: (self) => {
    const y = self.scroll();
    nav.classList.toggle('nav--solid', y > 40);
    nav.classList.toggle('nav--hidden', y > lastY && y > 400 && !nav.classList.contains('nav--open'));
    lastY = y;
    gsap.set('.progress', { scaleX: self.progress });
  },
});

// ---------- маршруты ----------
route('/', home);
route('/value/:id', value);
route('/mechanisms', mechanisms);
route('/play', play);
route('/profile', profile);

const root = qs('#app')!;
const wipe = qs('.wipe')!;
let pointer = { x: innerWidth / 2, y: innerHeight / 2 };
addEventListener('pointerdown', (e) => (pointer = { x: e.clientX, y: e.clientY }), { passive: true });
let first = true;

startRouter(root, {
  async before() {
    if (first || prefersReducedMotion()) return;
    // «вспышка» из точки клика заливает экран градиентом бренда
    wipe.style.setProperty('--wx', pointer.x + 'px');
    wipe.style.setProperty('--wy', pointer.y + 'px');
    app.field?.pulse(pointer.x, pointer.y, 1.6);
    await gsap.fromTo(wipe, { clipPath: `circle(0% at ${pointer.x}px ${pointer.y}px)`, opacity: 1 }, { clipPath: `circle(150% at ${pointer.x}px ${pointer.y}px)`, duration: 0.55, ease: 'power3.in' });
  },
  after(path) {
    root.append(footerSection());
    killStale();
    scrollToTop();
    ScrollTrigger.refresh();
    const base = '#' + path;
    nav.querySelectorAll('a[href^="#/"]').forEach((a) => {
      const href = a.getAttribute('href')!;
      const on = href === base || (href.startsWith('#/value') && base.startsWith('#/value'));
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (!first && !prefersReducedMotion()) gsap.to(wipe, { opacity: 0, duration: 0.6, ease: 'power2.out' });
    first = false;
  },
});

// Страницы обязаны убирать свои триггеры в cleanup; это страховка.
function killStale() {
  if (currentPath() === '') killAllTriggers();
}
setAccent(BRAND[1], BRAND[0], BRAND);
