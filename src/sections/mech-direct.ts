import { t } from '../engine/i18n';
import './mech-direct.css';
import { h } from '../engine/dom';
import { prefersReducedMotion, revealWords, scrubText, gsap, ScrollTrigger } from '../engine/motion';
import { illustration, drawOn, ornamentBand, type IllustrationName } from '../engine/ornament';
import type { Scope } from '../engine/page';
import { mechanisms } from '../content';
import { nextId, sectionHead } from './mech-util';
import { lifeFeature, mapFeature, stampFeature } from './mech-feat';

const ILLO: Record<string, IllustrationName> = {
  education: 'book', 'legal-education': 'scales', 'media-culture': 'candle',
  'opinion-leaders': 'sprout', 'state-communications': 'measure', events: 'yurt',
};
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export function mechDirect(scope: Scope): HTMLElement {
  const d = mechanisms.direct;
  const head = sectionHead(t('III · Прямое продвижение'), t('Ценности находят человека сами'));
  scope.add(revealWords(head.title));
  const lead = h('p.mech-direct__lead', null, d.intro[0]);
  scope.add(scrubText(lead, { start: 'top 85%', end: 'bottom 55%' }));

  const unique = d.items.filter((m) => m.unique);
  const byId = (id: string) => unique.find((m) => m.id === id)!;
  const feats = h('div.mech-direct__feats', null, mapFeature(byId('hak-map'), scope), lifeFeature(byId('life-hak'), scope), stampFeature(byId('bul-hak-pa'), scope));

  const rest = d.items.filter((m) => !m.unique);
  const trHead = h('div.mech-direct__trhead', null,
    ornamentBand(10, 'mech-direct__band'),
    h('p.eyebrow', null, t('III · Трансформация инструментов')),
    h('p.mech-direct__trlead', null, d.intro[1]));
  const rows = rest.map((m, i) => {
    const id = nextId('tr');
    const emb = illustration(ILLO[m.id] ?? 'book', 'mech-row__emb');
    const body = h('div.mech-row__body', { id }, h('div.mech-text', null, m.paragraphs.map((p) => h('p', null, p))));
    const more = h('div.mech-row__more', null, h('div.mech-row__in', null, body));
    const btn = h('button.mech-row__btn', { type: 'button', 'aria-expanded': 'false', 'aria-controls': id },
      h('span.mech-row__n', null, ROMAN[i]),
      h('span.mech-row__embw', { 'aria-hidden': 'true' }, emb),
      h('span.mech-row__txt', null, h('b', null, m.name), h('em', null, m.subtitle)),
      h('i.mech-row__plus', { 'aria-hidden': 'true' }));
    const row = h('article.mech-row', null, btn, more);
    scope.on(btn, 'click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      more.classList.toggle('is-open', open);
    });
    scope.on(more, 'transitionend', ((e: TransitionEvent) => { if (e.propertyName === 'grid-template-rows') ScrollTrigger.refresh(); }) as EventListener);
    scope.add(drawOn(emb, { duration: 1.8, start: 'top 92%' }));
    return row;
  });
  const list = h('div.mech-direct__list', null, rows);
  if (!prefersReducedMotion()) gsap.from(rows, { y: 24, opacity: 0, stagger: 0.07, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: list, start: 'top 85%', once: true } });

  return h('section.section.mech-direct', null, h('div.wrap', null, head.el, lead, feats, trHead, list));
}
