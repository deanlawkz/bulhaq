import { t } from '../engine/i18n';
import './preamble.css';
import { h } from '../engine/dom';
import { gsap, reveal, revealWords, scrubText, prefersReducedMotion } from '../engine/motion';
import { ornamentBand, ramHorn, drawOn } from '../engine/ornament';
import { concept } from '../content';
import type { Scope } from '../engine/page';

const ROMAN = ['I', 'II', 'III'];

export function preambleSection(scope: Scope): HTMLElement {
  const p = concept.preamble;
  const STAGES = [t('узнаваемой'), t('соотнесённой с повседневным опытом'), t('встроенной в представления')];
  // термины дословно из первого абзаца преамбулы
  const NORM_TERMS = [t('права'), t('обязанности'), t('гарантии'), t('принципы государственного устройства')];
  const reduce = prefersReducedMotion();

  const lead = h('p.preamble__lead', null, p.lead);
  const statement = p.paragraphs[3];

  // ---------- левая колонка: страница нормативного текста ----------
  const rows = NORM_TERMS.map((term, i) =>
    h(
      'li.preamble-row',
      null,
      h('span.preamble-row__no', null, t('ст. {n}', { n: i + 1 })),
      h('span.preamble-row__t', null, term),
      h('i.preamble-row__rule', { 'aria-hidden': 'true' }),
    ),
  );
  const stamp = h('span.preamble-stamp', null, t('разъяснить'));
  const page = h('div.preamble-page', null, h('p.preamble-page__head', null, t('Конституция Республики Казахстан')), h('ol.preamble-rows', null, rows), stamp);
  const left = h(
    'article.preamble-col.preamble-col--law',
    null,
    h('p.eyebrow', null, t('Объект I')),
    h('h3.preamble-col__title', null, t('Юридическое содержание норм')),
    h('p.preamble-col__verb', null, t('правовое просвещение')),
    page,
    h('p.preamble-col__text', null, p.paragraphs[0]),
  );

  // ---------- правая колонка: ценность растёт орнаментом ----------
  const horn = ramHorn('preamble-orn preamble-orn--1');
  const band3 = ornamentBand(3, 'preamble-orn preamble-orn--2');
  const band7 = ornamentBand(7, 'preamble-orn preamble-orn--3');
  const orns = [horn, band3, band7];
  const stageEls = STAGES.map((s, i) =>
    h('li.preamble-stage', null, h('span.preamble-stage__n', null, ROMAN[i]), h('div.preamble-stage__b', null, h('span.preamble-stage__t', null, s), orns[i])),
  );
  const right = h(
    'article.preamble-col.preamble-col--value',
    null,
    h('p.eyebrow', null, t('Объект II')),
    h('h3.preamble-col__title', null, t('Система ценностей')),
    h('p.preamble-col__verb', null, t('самостоятельный подход')),
    h('p.preamble-col__lab', null, t('Ценность должна стать')),
    h('ol.preamble-stages', null, stageEls),
    h('p.preamble-col__text', null, p.paragraphs[1]),
  );

  const duo = h('div.preamble-duo', null, left, right);
  const approachEl = h('div.preamble-approach.prose', null, h('p', null, p.paragraphs[2]));

  // ---------- финальная фраза ----------
  const [pre] = statement.split('ХАҚ');
  const hak = h('span.preamble-hak', null, 'ХАҚ.');
  const endBand = ornamentBand(9, 'orn-band preamble-endband');
  const stmt = h('p.preamble-statement', { 'aria-label': statement }, h('span.preamble-statement__pre', { 'aria-hidden': 'true' }, pre.trim()), h('span', { 'aria-hidden': 'true' }, hak));
  const end = h('div.preamble-end', null, endBand, stmt);

  const el = h('section.section.preamble#preamble', null, h('div.wrap', null, h('p.eyebrow', null, t('Два объекта продвижения')), lead, duo, approachEl, end));

  scope.add(scrubText(lead, { start: 'top 82%', end: 'bottom 50%' }));

  if (reduce) {
    stageEls.forEach((s) => s.classList.add('is-on'));
    rows.forEach((r) => r.classList.add('is-on'));
    return el;
  }

  scope.add(reveal([left, right], { y: 40 }));
  scope.add(reveal(approachEl));

  // левая: линейки строк прочерчиваются, затем «разъяснить» ставится печатью
  const lt = gsap.timeline({ scrollTrigger: { trigger: page, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 } });
  rows.forEach((r, i) => {
    lt.fromTo(r.querySelector('.preamble-row__rule'), { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 }, i * 0.7);
    lt.fromTo(r, { opacity: 0.35 }, { opacity: 1, ease: 'none', duration: 0.5 }, i * 0.7);
  });
  lt.fromTo(stamp, { opacity: 0, rotate: -10, scale: 1.3 }, { opacity: 1, rotate: -4, scale: 1, duration: 0.6, ease: 'power2.out' }, rows.length * 0.7 + 0.2);
  scope.add(() => { lt.scrollTrigger?.kill(); lt.kill(); });

  // правая: орнамент прорисовывается стадия за стадией
  orns.forEach((o, i) => {
    scope.add(drawOn(o, { scrub: true, trigger: stageEls[i], duration: 1.4, start: 'top 85%' }));
    const st = gsap.timeline({ scrollTrigger: { trigger: stageEls[i], start: 'top 80%', onEnter: () => stageEls[i].classList.add('is-on'), onLeaveBack: () => stageEls[i].classList.remove('is-on') } });
    scope.add(() => { st.scrollTrigger?.kill(); st.kill(); });
  });

  // финал
  scope.add(drawOn(endBand, { scrub: true, trigger: end, start: 'top 90%', duration: 1.4 }));
  scope.add(revealWords(stmt.querySelector('.preamble-statement__pre') as HTMLElement, { start: 'top 88%' }));
  const ft = gsap.timeline({ scrollTrigger: { trigger: stmt, start: 'top 85%', end: 'top 35%', scrub: 0.7 } });
  ft.fromTo(hak, { opacity: 0, scale: 0.9, letterSpacing: '0.03em' }, { opacity: 1, scale: 1, letterSpacing: '-0.02em', ease: 'none' }, 0);
  scope.add(() => { ft.scrollTrigger?.kill(); ft.kill(); });

  return el;
}
