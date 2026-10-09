// «<KZ> как общественная норма»: орбита из 4 колец + интерактивный ХАҚ-тест.
import './value-audiences.css';
import { h } from '../engine/dom';
import { t, pick } from '../engine/i18n';
import { gsap, reveal, revealWords, prefersReducedMotion } from '../engine/motion';
import { AUDIENCE_LABEL } from '../engine/theme';
import { getAnswer, setAnswer, onAnswers, type Answer } from '../engine/store';
import type { Scope } from '../engine/page';
import type { Audience, ValueContent } from '../content/types';

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag: string, attrs: Record<string, string | number> = {}, ...kids: Element[]): SVGElement => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  kids.forEach((k) => el.appendChild(k));
  return el as SVGElement;
};

const ORDER = ['person', 'organization', 'society', 'state'] as const;
const RADII = [60, 104, 144, 184];
const C = 200;
const ANS = (): { v: Answer; label: string }[] => [
  { v: 2, label: t('Да') },
  { v: 1, label: t('Не всегда') },
  { v: 0, label: t('Нет') },
];
const aud = (id: keyof typeof AUDIENCE_LABEL) => t(AUDIENCE_LABEL[id]);

const firstSentence = (t: string) => {
  const m = t.match(/^.*?[.!?](?=\s|$)/s);
  return (m ? m[0] : t).trim();
};
const pct = (x: number | null) => (x == null ? '—' : Math.round(x * 100) + '%');
const bandText = (x: number) =>
  x < 0.35 ? t('Здесь есть над чем подумать: вернитесь к вопросам, которые отозвались сильнее всего.')
  : x < 0.7 ? t('Ценность заметна в ваших поступках, но не всегда.')
  : t('Эта ценность уже живёт в ваших решениях.');

export function valueAudiencesSection(scope: Scope, v: ValueContent): HTMLElement {
  const auds = ORDER.map((id) => v.audiences.find((a) => a.id === id)).filter(Boolean) as Audience[];
  const sid = 'vaud-' + v.id;
  let current = 0;

  /** Сводка по аудитории из хранилища: n отвечено, score 0..1 (Да=1, Не всегда=0.5, Нет=0) */
  const stats = (i: number) => {
    const a = auds[i];
    const counts = [0, 0, 0]; // нет, не всегда, да
    a.test.forEach((_, q) => { const x = getAnswer(v.id, a.id, q); if (x != null) counts[x]++; });
    const n = counts[0] + counts[1] + counts[2];
    return { n, m: a.test.length, counts, score: n ? (counts[2] + counts[1] * 0.5) / n : null };
  };

  /* ---------- орбита: гравированная диаграмма ---------- */
  const ringEls: { prog: SVGElement; dots: SVGElement[]; g: SVGElement; len: number }[] = [];
  const orbit = svg('svg', { viewBox: '0 0 400 400', class: 'vaud-orbit__svg', 'aria-hidden': 'true' });
  const ticks = svg('g', { class: 'vaud-ticks' });
  for (let k = 0; k < 120; k++) {
    const an = (k / 120) * Math.PI * 2, r1 = 196, r2 = k % 10 === 0 ? 187 : k % 5 === 0 ? 191 : 193.5;
    ticks.appendChild(svg('path', { d: `M${(C + Math.cos(an) * r1).toFixed(2)} ${(C + Math.sin(an) * r1).toFixed(2)} L${(C + Math.cos(an) * r2).toFixed(2)} ${(C + Math.sin(an) * r2).toFixed(2)}` }));
  }
  orbit.appendChild(ticks);
  orbit.appendChild(svg('path', { class: 'vaud-cross', d: `M${C} 6 V394 M6 ${C} H394` }));
  const arcDefs = svg('defs');
  orbit.appendChild(arcDefs);

  // подсказка
  const tipName = h('b.vaud-tip__n');
  const tipRole = h('span.vaud-tip__r');
  const tipStat = h('span.vaud-tip__s');
  const tip = h('div.vaud-tip', { role: 'tooltip', id: sid + '-tip', hidden: true }, tipName, tipRole, tipStat);
  const infoFor = (i: number) => {
    const st = stats(i);
    return {
      name: aud(auds[i].id),
      role: firstSentence(auds[i].paragraphs[0] ?? ''),
      stat: t('Отвечено {n} из {m} · ХАҚ-индекс {idx}', { n: st.n, m: st.m, idx: pct(st.score) }),
    };
  };
  let tipIdx = 0;
  const showTip = (i: number) => {
    tipIdx = i;
    const inf = infoFor(i);
    tipName.textContent = inf.name; tipRole.textContent = inf.role; tipStat.textContent = inf.stat;
    tip.style.top = `${((C - RADII[i]) / 400) * 100}%`;
    tip.hidden = false;
  };
  const hideTip = () => { tip.hidden = true; };

  // от внешнего к внутреннему, чтобы внутренние были сверху
  [...auds.keys()].reverse().forEach((i) => {
    const a = auds[i], r = RADII[i];
    const len = 2 * Math.PI * r;
    const g = svg('g', { class: 'vaud-ring', 'data-i': i });
    const base = svg('circle', { cx: C, cy: C, r, class: 'vaud-ring__base', fill: 'none' });
    const prog = svg('circle', {
      cx: C, cy: C, r, class: 'vaud-ring__prog', fill: 'none', transform: `rotate(-90 ${C} ${C})`,
      'stroke-dasharray': `0 ${len}`,
    });
    const hit = svg('circle', { cx: C, cy: C, r, class: 'vaud-ring__hit', fill: i === 0 ? 'transparent' : 'none' });
    g.append(base, prog);
    // точки — вопросы этой аудитории; закрашена = отвечено
    const dots: SVGElement[] = [];
    for (let k = 0; k < a.test.length; k++) {
      const an = ((k + 0.5) / a.test.length) * Math.PI * 2 - Math.PI / 2, rr = r - 9;
      const d = svg('circle', { cx: (C + Math.cos(an) * rr).toFixed(2), cy: (C + Math.sin(an) * rr).toFixed(2), r: 2.1, class: 'vaud-ring__q' });
      dots.push(d); g.appendChild(d);
    }
    const pid = `${sid}-arc-${i}`;
    arcDefs.appendChild(svg('path', { id: pid, d: `M${C - r} ${C} A${r} ${r} 0 0 1 ${C + r} ${C}` }));
    const lab = svg('text', { class: 'vaud-ring__label', 'text-anchor': 'middle', dy: -8 });
    const tp = svg('textPath', { href: `#${pid}`, startOffset: '50%' });
    tp.textContent = aud(a.id);
    lab.appendChild(tp);
    g.append(lab, hit);
    orbit.appendChild(g);
    ringEls[i] = { prog, dots, g, len };
    scope.on(g, 'click', () => select(i));
    scope.on(g, 'pointerenter', (e) => { g.classList.add('is-hover'); if ((e as PointerEvent).pointerType !== 'touch') showTip(i); });
    scope.on(g, 'pointerleave', () => { g.classList.remove('is-hover'); hideTip(); });
  });
  // центр: индекс выбранной аудитории
  const cNum = svg('text', { x: C, y: C + 6, class: 'vaud-c__n', 'text-anchor': 'middle' });
  cNum.textContent = '—';
  const cCap = svg('text', { x: C, y: C + 24, class: 'vaud-c__cap', 'text-anchor': 'middle' });
  cCap.textContent = t('ХАҚ-индекс');
  orbit.append(cNum, cCap);
  if (!prefersReducedMotion()) {
    const tw = gsap.to(ticks, { rotation: 360, svgOrigin: `${C} ${C}`, duration: 240, ease: 'none', repeat: -1 });
    scope.add(() => tw.kill());
  }
  const orbitWrap = h('div.vaud-orbit', null, orbit, tip);
  const cap = h('p.vaud-cap', { 'aria-live': 'polite' });

  /* ---------- табы ---------- */
  const tabs = auds.map((a, i) =>
    h('button.chip.vaud-tab', {
      type: 'button', role: 'tab', id: `${sid}-tab-${i}`, 'aria-controls': `${sid}-panel-${i}`,
      'aria-selected': 'false', tabindex: '-1', 'aria-describedby': sid + '-tip',
    },
      h('span.vaud-tab__t', null, aud(a.id)),
      h('span.vaud-tab__c.mono', { 'data-c': i }, `0/${a.test.length}`),
    ));
  const tablist = h('div.vaud-tabs', { role: 'tablist', 'aria-label': t('Для кого эта норма') }, tabs);
  tabs.forEach((t, i) => {
    scope.on(t, 'click', () => select(i));
    scope.on(t, 'pointerenter', (e) => { if ((e as PointerEvent).pointerType !== 'touch') showTip(i); });
    scope.on(t, 'pointerleave', hideTip);
    scope.on(t, 'focus', () => { if (t.matches(':focus-visible')) showTip(i); });
    scope.on(t, 'blur', hideTip);
    scope.on(t, 'keydown', (e) => {
      const k = (e as KeyboardEvent).key;
      let n = -1;
      if (k === 'ArrowRight' || k === 'ArrowDown') n = (i + 1) % tabs.length;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') n = (i + tabs.length - 1) % tabs.length;
      else if (k === 'Home') n = 0;
      else if (k === 'End') n = tabs.length - 1;
      else if (k === 'Escape') hideTip();
      if (n >= 0) { e.preventDefault(); select(n, true); }
    });
  });

  /* ---------- панели ---------- */
  const painters: ((animate: boolean) => void)[] = [];
  let animateNext = false;
  const panels = auds.map((a, i) => {
    const total = a.test.length;

    // вопросы
    const radios: HTMLElement[][] = [];
    const cards = a.test.map((q, qi) => {
      const btns = ANS().map(({ v: val, label }) =>
        h('button.vaud-ans', { type: 'button', 'data-a': val, role: 'radio', 'aria-checked': 'false',
          onclick: () => { animateNext = true; setAnswer(v.id, a.id, qi, val); } }, label));
      radios.push(btns);
      return h('li.vaud-q', null,
        h('span.vaud-q__n.mono', { 'aria-hidden': 'true' }, String(qi + 1).padStart(2, '0')),
        h('p.vaud-q__t', { id: `${sid}-q-${i}-${qi}` }, q),
        h('div.vaud-q__a', { role: 'radiogroup', 'aria-labelledby': `${sid}-q-${i}-${qi}` }, btns));
    });

    // результат: индекс, распределение, интерпретация, главный вопрос
    const rNum = h('span.vaud-res__num', null, '—');
    const rSub = h('span.vaud-res__sub', null, t('ХАҚ-индекс'));
    const barSeg = [0, 1, 2].map((k) => h('i.vaud-bar__s', { 'data-a': String(2 - k) }));
    const bar = h('div.vaud-bar', { 'aria-hidden': 'true' }, barSeg);
    const dist = h('ul.vaud-dist', null, [2, 1, 0].map((val) =>
      h('li', { 'data-a': String(val) }, h('span.vaud-dist__sw'), ANS_LABEL_OF(val), ' ', h('b', { 'data-n': String(val) }, '0'))));
    const msg = h('p.vaud-res__msg', { 'aria-live': 'polite' });
    const result = h('div.vaud-res', null,
      h('div.vaud-res__score', null, rNum, rSub),
      h('div.vaud-res__txt', null,
        h('p.vaud-res__title', null, ...answeredTitle(total)),
        bar, dist, msg,
        h('div.vaud-res__q', null, h('p.vaud-res__qh', null, t('Главный вопрос')), h('p.vaud-res__qt', null, v.criterion)),
        h('p.vaud-res__fine', null, t('Это подсказка для самопроверки, а не оценка и не вывод концепции.'))));
    const titleN = result.querySelector('[data-t]') as HTMLElement;
    let shown = 0;

    painters.push((animate) => {
      const st = stats(i);
      // кнопки ответов
      a.test.forEach((_, qi) => {
        const x = getAnswer(v.id, a.id, qi);
        radios[qi].forEach((b) => b.setAttribute('aria-checked', String(Number(b.getAttribute('data-a')) === x)));
        cards[qi].classList.toggle('is-answered', x != null);
      });
      titleN.textContent = String(st.n);
      const target = st.score == null ? 0 : Math.round(st.score * 100);
      if (animate && !prefersReducedMotion() && st.score != null) {
        const o = { n: shown };
        gsap.to(o, { n: target, duration: 0.6, ease: 'power3.out', onUpdate: () => { rNum.textContent = Math.round(o.n) + '%'; } });
      } else rNum.textContent = pct(st.score);
      shown = target;
      barSeg.forEach((sg, k) => { sg.style.flexGrow = String(st.counts[2 - k]); });
      bar.classList.toggle('is-empty', st.n === 0);
      [0, 1, 2].forEach((val) => { (dist.querySelector(`[data-n="${val}"]`) as HTMLElement).textContent = String(st.counts[val]); });
      msg.textContent = st.score == null
        ? t('Вопросы ХАҚ-теста — не экзамен, а зеркало. Отвечайте так, как есть на самом деле.')
        : (st.n < total ? t('По ответам на {n} из {m}: ', { n: st.n, m: total }) : '') + bandText(st.score);
    });

    return h('div.vaud-panel', {
      role: 'tabpanel', id: `${sid}-panel-${i}`, 'aria-labelledby': `${sid}-tab-${i}`, tabindex: '0', hidden: i !== 0,
    },
      h('p.eyebrow.vaud-panel__eyebrow', null, a.title),
      h('div.vaud-panel__text', null, a.paragraphs.map((p, pi) => h(pi === 0 ? 'p.lead' : 'p.muted', null, p))),
      h('div.vaud-test', null,
        h('div.vaud-test__head', null,
          h('h3.t-m.vaud-test__title', null, t('ХАҚ-тест')),
          h('p.vaud-test__sub.dim', null, t('Три варианта ответа, без правильных и неправильных. Кольцо на схеме меняется с каждым ответом.'))),
        h('ol.vaud-qs', null, cards),
        result));
  });

  /* ---------- общая отрисовка ---------- */
  let cShown = 0;
  function paintAll(animate: boolean) {
    const anim = animate && !prefersReducedMotion();
    auds.forEach((_, i) => {
      const st = stats(i), re = ringEls[i];
      const dash = `${(re.len * (st.score ?? 0)).toFixed(1)} ${re.len}`;
      if (anim) gsap.to(re.prog, { attr: { 'stroke-dasharray': dash }, duration: 0.7, ease: 'power3.out', overwrite: 'auto' });
      else re.prog.setAttribute('stroke-dasharray', dash);
      re.dots.forEach((d, k) => d.classList.toggle('is-on', getAnswer(v.id, auds[i].id, k) != null));
      re.g.classList.toggle('is-done', st.n === st.m && st.m > 0);
      const chip = tablist.querySelector(`[data-c="${i}"]`);
      if (chip) chip.textContent = `${st.n}/${st.m}`;
    });
    painters.forEach((p) => p(animate));
    // центр + подпись
    const cs = stats(current);
    const tgt = cs.score == null ? null : Math.round(cs.score * 100);
    if (anim && tgt != null) {
      const o = { n: cShown };
      gsap.to(o, { n: tgt, duration: 0.6, ease: 'power3.out', onUpdate: () => { cNum.textContent = Math.round(o.n) + '%'; } });
    } else cNum.textContent = tgt == null ? '—' : tgt + '%';
    cShown = tgt ?? 0;
    const inf = infoFor(current);
    cap.textContent = '';
    cap.append(h('b', null, inf.name), h('span.vaud-cap__r', null, inf.role), h('span.vaud-cap__s', null, inf.stat));
    if (!tip.hidden) showTip(tipIdx);
  }
  scope.add(onAnswers(() => { paintAll(animateNext); animateNext = false; }));

  /* ---------- переключение ---------- */
  const stage = h('div.vaud-stage', null, panels);
  let busy: gsap.core.Tween | null = null;
  function select(n: number, focus = false) {
    if (n === current && tabs[n].getAttribute('aria-selected') === 'true') { if (focus) tabs[n].focus(); return; }
    const prev = current;
    current = n;
    tabs.forEach((t, i) => {
      t.setAttribute('aria-selected', String(i === n));
      t.tabIndex = i === n ? 0 : -1;
    });
    ringEls.forEach((r, i) => { r.g.classList.toggle('is-active', i === n); });
    paintAll(true);
    if (focus) tabs[n].focus();
    const from = panels[prev], to = panels[n];
    if (prev === n) return;
    busy?.kill();
    if (prefersReducedMotion()) { from.hidden = true; to.hidden = false; return; }
    const dir = n > prev ? 1 : -1;
    busy = gsap.to(from, {
      opacity: 0, x: -24 * dir, duration: 0.25, ease: 'power2.in',
      onComplete: () => {
        from.hidden = true;
        gsap.set(from, { clearProps: 'all' });
        to.hidden = false;
        gsap.fromTo(to, { opacity: 0, x: 32 * dir }, { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out', clearProps: 'all' });
        gsap.fromTo(to.querySelectorAll('.vaud-panel__text > *, .vaud-q'), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.04, ease: 'power3.out', clearProps: 'all' });
      },
    });
  }

  /* ---------- пояснение схемы ---------- */
  const how = h('div.vaud-how', null,
    h('p.vaud-how__h', null, t('Как читать схему')),
    h('p.vaud-how__p', null, t('Норма видна с четырёх сторон: от человека (центр) к организации, обществу и государству.')),
    h('p.vaud-how__p', null, t('Чем полнее кольцо, тем чаще ваши ответы — «Да». Это самопроверка, а не экзамен.')),
    h('ul.vaud-legend', null,
      h('li', null, h('i.vaud-legend__arc'), t('дуга — ХАҚ-индекс аудитории')),
      h('li', null, h('i.vaud-legend__dot.is-on'), h('i.vaud-legend__dot'), t('точки — вопросы: закрашена, если вы ответили')),
      h('li', null, h('i.vaud-legend__ctr'), t('в центре — индекс выбранного кольца'))));

  /* ---------- сборка ---------- */
  const title = h('h2.t-l.vaud-title', null, t('{name} как общественная норма', { name: v.kz }));
  const note = h('p.vaud-note', null,
    h('span.vaud-note__ic', { 'aria-hidden': 'true' }, '※'),
    h('span', null, t('Ответы хранятся только в вашем браузере и никуда не отправляются. Вся картина — в '),
      h('a', { href: '#/profile' }, t('Моём ХАҚ-профиле')), '.'));

  const el = h('section.section.vaud', { 'aria-labelledby': sid + '-h' },
    h('div.wrap', null,
      h('header.vaud-head', null,
        h('p.eyebrow', null, t('Норма для всех')),
        title,
        h('p.lead.muted.vaud-lead', null, t('Норма видна с четырёх сторон: человека, организации, общества и государства. Выберите кольцо — и посмотрите, как она выглядит с каждой из них.'))),
      h('div.vaud-grid', null,
        h('div.vaud-side', null, orbitWrap, cap, tablist, how),
        stage),
      note));
  title.id = sid + '-h';

  tabs[0].setAttribute('aria-selected', 'true');
  tabs[0].tabIndex = 0;
  ringEls.forEach((r, i) => r.g.classList.toggle('is-active', i === 0));
  paintAll(false);
  scope.add(revealWords(title));
  scope.add(reveal([orbitWrap, stage, note]));
  scope.add(() => busy?.kill());
  return el;
}

function ANS_LABEL_OF(val: number): string {
  return ANS().find((a) => a.v === val)!.label;
}

/** «Отвечено <b>n</b> из m» — число в отдельном узле (обновляется по [data-t]); порядок слов по языку. */
function answeredTitle(total: number): (string | HTMLElement)[] {
  const b = h('b', { 'data-t': '' }, '0');
  return pick({
    ru: ['Отвечено ', b, ` из ${total}`],
    kk: ['Жауап берілді: ', b, ` / ${total}`],
  });
}
