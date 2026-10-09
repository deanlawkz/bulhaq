// Общие приёмы страницы «Механизмы»: раскрываемый текст, заголовок секции.
import { t } from '../engine/i18n';
import './mech-util.css';
import { h } from '../engine/dom';
import { ScrollTrigger } from '../engine/motion';
import type { Scope } from '../engine/page';

let uid = 0;
export const nextId = (p = 'mech') => `${p}-${++uid}`;

/** Первый абзац виден, остальные — под кнопкой «Подробнее». */
export function collapsible(paras: string[], scope: Scope, opts: { open?: boolean; cls?: string } = {}): HTMLElement {
  const first = h('div.mech-text', null, h('p', null, paras[0]));
  const rest = paras.slice(1);
  if (!rest.length) return h('div.mech-collapse' + (opts.cls ? '.' + opts.cls : ''), null, first);
  const id = nextId('more');
  const inner = h('div.mech-more__in.mech-text', { id }, rest.map((p) => h('p', null, p)));
  const more = h('div.mech-more', null, inner);
  const label = h('span', null, t('Подробнее'));
  const btn = h('button.mech-toggle', { type: 'button', 'aria-expanded': 'false', 'aria-controls': id }, label, h('i.mech-toggle__i', { 'aria-hidden': 'true' }));
  const set = (open: boolean) => {
    more.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    label.textContent = open ? t('Свернуть') : t('Подробнее');
  };
  scope.on(btn, 'click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  scope.on(more, 'transitionend', ((e: TransitionEvent) => {
    if (e.propertyName === 'grid-template-rows') ScrollTrigger.refresh();
  }) as EventListener);
  if (opts.open) set(true);
  return h('div.mech-collapse' + (opts.cls ? '.' + opts.cls : ''), null, first, more, btn);
}

export function sectionHead(eyebrow: string, title: string, lead?: string | null): { el: HTMLElement; title: HTMLElement } {
  const t = h('h2.t-xl.mech-h', null, title);
  const el = h('header.mech-head', null, h('p.eyebrow', null, eyebrow), t, lead ? h('p.lead.mech-lead', null, lead) : null);
  return { el, title: t };
}

export const NS = 'http://www.w3.org/2000/svg';
export function svg(tag: string, attrs: Record<string, string | number> = {}, ...kids: (SVGElement | null)[]): SVGElement {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  kids.forEach((k) => k && el.appendChild(k));
  return el;
}
export function svgRoot(viewBox: string, attrs: Record<string, string | number> = {}, html = ''): SVGSVGElement {
  const el = document.createElementNS(NS, 'svg') as SVGSVGElement;
  el.setAttribute('viewBox', viewBox);
  el.setAttribute('xmlns', NS);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  el.innerHTML = html;
  return el;
}
