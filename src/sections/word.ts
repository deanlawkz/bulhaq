import { t } from '../engine/i18n';
import './word.css';
import { h } from '../engine/dom';
import { gsap, reveal, revealWords, scrubText, magnetic, prefersReducedMotion } from '../engine/motion';
import { ornamentBand, rosette, flagDK, flagSE, flagKZ, illustration, drawOn } from '../engine/ornament';
import { concept } from '../content';
import type { Scope } from '../engine/page';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function wordSection(scope: Scope): HTMLElement {
  const w = concept.word;
  const reduce = prefersReducedMotion();
  const P = w.paragraphs;

  // ---------- заголовок ----------
  const title = h('h2.word__title', null, w.title);
  const lead = h('p.word__lead', null, P[0]);

  // ---------- дерево ----------
  const rootFam = w.family[0];
  const kids = w.family.slice(1);
  const leftKids = kids.slice(0, 3); // құқық, хақылы, құқылы
  const rightKids = kids.slice(3); // повседневные слова

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'word-tree__svg');
  svg.setAttribute('aria-hidden', 'true');
  type Node = { word: string; meaning: string; btn: HTMLButtonElement; path: SVGPathElement; flow: SVGPathElement };
  const nodes: Node[] = [];
  const mkNode = (f: { word: string; meaning: string }, side: 'l' | 'r'): HTMLElement => {
    const btn = h(
      'button.word-node',
      { type: 'button', 'aria-pressed': 'false', 'data-side': side },
      h('span.word-node__w.kz', null, f.word),
      h('span.word-node__m', null, f.meaning),
    );
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('class', 'word-branch');
    path.setAttribute('pathLength', '1');
    const flow = document.createElementNS(SVG_NS, 'path');
    flow.setAttribute('class', 'word-branch word-branch--flow');
    flow.setAttribute('pathLength', '1');
    svg.append(path, flow);
    nodes.push({ ...f, btn, path, flow });
    return btn;
  };

  const rootBtn = h(
    'button.word-root',
    { type: 'button', 'aria-pressed': 'true', 'aria-label': t('ХАҚ — корень слова') },
    h('span.word-root__ring', { 'aria-hidden': 'true' }),
    h('span.word-root__t', null, 'хақ'), h('span.word-root__s', null, t('корень')),
  );
  const colL = h('div.word-tree__col.word-tree__col--l', null, h('p.word-tree__lab', null, t('право и «вправе»')), leftKids.map((k) => mkNode(k, 'l')));
  const colR = h('div.word-tree__col.word-tree__col--r', null, h('p.word-tree__lab', null, t('слова повседневной жизни')), rightKids.map((k) => mkNode(k, 'r')));
  const tree = h('div.word-tree', null, svg, colL, h('div.word-tree__mid', null, rootBtn), colR);

  const dWord = h('span.word-detail__w', null, 'хақ');
  const dMeaning = h('p.word-detail__m', null, rootFam.meaning);
  const dRel = h('p.word-detail__rel', null, t('корень'));
  const detail = h('div.word-detail.glass', { 'aria-live': 'polite' }, h('div.word-detail__head', null, dWord, dRel), dMeaning);

  let active: HTMLElement = rootBtn;
  const select = (btn: HTMLElement, word: string, meaning: string, rel: string) => {
    active.setAttribute('aria-pressed', 'false');
    nodes.forEach((n) => n.btn.classList.remove('is-active'));
    nodes.forEach((n) => { n.path.classList.remove('is-active'); n.flow.classList.remove('is-active'); });
    btn.setAttribute('aria-pressed', 'true');
    active = btn;
    const n = nodes.find((x) => x.btn === btn);
    if (n) { n.btn.classList.add('is-active'); n.path.classList.add('is-active'); n.flow.classList.add('is-active'); }
    rootBtn.classList.toggle('is-active', btn === rootBtn);
    dWord.textContent = word;
    dMeaning.textContent = meaning;
    dRel.textContent = rel;
    if (!reduce) gsap.fromTo([dWord, dMeaning], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.06 });
    const r = detail.getBoundingClientRect();
    if (r.bottom > innerHeight || r.top < 0) detail.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  };
  rootBtn.classList.add('is-active');
  rootBtn.addEventListener('click', () => select(rootBtn, rootFam.word, rootFam.meaning, t('корень')));
  nodes.forEach((n) => {
    const rel = n.word === 'құқық' ? t('исторически — форма множественного числа от «хақ»') : t('от того же корня «хақ»');
    n.btn.addEventListener('click', () => select(n.btn, n.word, n.meaning, rel));
  });

  // пути считаем по реальным позициям DOM (работает и для десктопа, и для мобильной колонки)
  const layout = () => {
    const tr = tree.getBoundingClientRect();
    if (!tr.width) return;
    svg.setAttribute('viewBox', `0 0 ${tr.width} ${tr.height}`);
    const rr = rootBtn.getBoundingClientRect();
    const rcx = rr.left - tr.left + rr.width / 2;
    const rcy = rr.top - tr.top + rr.height / 2;
    const stacked = innerWidth < 760;
    nodes.forEach((n) => {
      const nr = n.btn.getBoundingClientRect();
      let d: string;
      if (stacked) {
        const ex = nr.left - tr.left;
        const y = nr.top - tr.top + nr.height / 2;
        const sy = rr.bottom - tr.top - 4;
        const sx = 12;
        d = `M${rcx},${sy} C${rcx},${sy + 36} ${sx},${sy + 10} ${sx},${sy + 56} L${sx},${y - 16} Q${sx},${y} ${sx + 16},${y} L${ex},${y}`;
      } else {
        const left = n.btn.dataset.side === 'l';
        const x = left ? nr.right - tr.left : nr.left - tr.left;
        const y = nr.top - tr.top + nr.height / 2;
        const sx = left ? rr.left - tr.left + 2 : rr.right - tr.left - 2;
        const dx = (x - sx) * 0.55;
        d = `M${sx},${rcy} C${sx + dx},${rcy} ${x - dx},${y} ${x},${y}`;
      }
      n.path.setAttribute('d', d);
      n.flow.setAttribute('d', d);
    });
  };
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(layout);
    ro.observe(tree);
    scope.add(() => ro.disconnect());
  }
  scope.on(window, 'resize', layout);
  requestAnimationFrame(layout);
  document.fonts?.ready.then(layout);

  const treeBlock = h('div.word-treeblock', null, tree, detail);

  // ---------- девиз ----------
  const mottoParts = w.motto.kz.split('. ').map((s, i) => (i === 0 ? s + '.' : s));
  const ruParts = [t('Знай свое право'), t('Уважай право другого')];
  const mA = h('p.word-motto__line.word-motto__line--a', null, mottoParts[0]);
  const mB = h('p.word-motto__line.word-motto__line--b', null, mottoParts[1]);
  const tA = h('p.word-motto__ru.word-motto__ru--a', null, ruParts[0]);
  const tB = h('p.word-motto__ru.word-motto__ru--b', null, ruParts[1]);
  const knot = h('span.word-motto__knot', { 'aria-hidden': 'true' }, h('i'), h('b', null, '+'), h('i'));
  const bandTop = ornamentBand(10, 'orn-band word-motto__band');
  const bandBot = ornamentBand(10, 'orn-band word-motto__band');
  const mottoStick = h(
    'div.word-motto__stick',
    null,
    bandTop,
    h('p.eyebrow', null, t('Формула Концепции')),
    h('div.word-motto__half.word-motto__half--a', null, mA, tA),
    knot,
    h('div.word-motto__half.word-motto__half--b', null, mB, tB),
    h('p.word-motto__sum', null, w.motto.ru + '.'),
    bandBot,
  );
  const motto = h('div.word-motto', { role: 'group', 'aria-label': w.motto.kz + ' ' + w.motto.ru }, mottoStick);

  // ---------- Абай ----------
  const abaiLines = w.abai.kz.split('\n').map((l) => h('span.word-abai__l', null, l));
  const abaiRu = h('p.word-abai__ru', null, w.abai.ru);
  const abai = h(
    'figure.word-abai',
    null,
    h('span.word-abai__mark', { 'aria-hidden': 'true' }, '«'),
    h('blockquote', null, h('p.word-abai__kz', null, abaiLines), abaiRu),
    h('figcaption', null, w.abai.author),
  );

  // ---------- hygge / lagom / ХАҚ ----------
  const mkPlate = (cls: string, flag: SVGSVGElement, art: SVGSVGElement, name: string, country: string, text: string, extra?: Element[]) =>
    h(
      'article.word-plate' + cls,
      null,
      extra?.[0],
      h('div.word-plate__top', null, h('div.word-plate__flag', null, flag), h('p.word-plate__country', null, country)),
      h('div.word-plate__art', null, art),
      h('h3.word-plate__name', null, name),
      h('p.word-plate__text', null, text),
      extra?.[1],
    );
  const artH = illustration('candle', 'illo word-plate__illo');
  const artL = illustration('measure', 'illo word-plate__illo');
  const artK = illustration('book', 'illo word-plate__illo');
  const cards = [
    mkPlate('', flagDK(), artH, 'hygge', t('Дания'), t('тепло и близость повседневной жизни')),
    mkPlate('', flagSE(), artL, 'lagom', t('Швеция'), t('мера и баланс')),
    mkPlate(
      '.word-plate--hak',
      flagKZ(),
      artK,
      'ХАҚ',
      t('Казахстан'),
      t('выводится из Конституции'),
      [ornamentBand(6, 'orn-band word-plate__band'), h('div.word-plate__seal', { 'aria-hidden': 'true' }, rosette('orn'))],
    ),
  ];
  const cmp = h('div.word-cmp', null, cards);

  // ---------- примечание ----------
  const noteBody = h('div.word-note__body', { id: 'word-note-body', role: 'region' }, h('div', null, h('p', null, w.note)));
  const noteBtn = h(
    'button.word-note__btn',
    { type: 'button', 'aria-expanded': 'false', 'aria-controls': 'word-note-body' },
    h('span', null, t('Примечание')),
    h('i', { 'aria-hidden': 'true' }, '+'),
  );
  noteBtn.addEventListener('click', () => {
    const open = noteBtn.getAttribute('aria-expanded') !== 'true';
    noteBtn.setAttribute('aria-expanded', String(open));
    noteBody.classList.toggle('is-open', open);
  });
  const note = h('div.word-note', null, noteBtn, noteBody);

  const prose = (...ps: string[]) => h('div.prose.word-prose', null, ps.map((p) => h('p', null, p)));
  const prose1 = prose(P[1]);
  const prose2 = prose(P[2]);
  const prose3 = prose(P[3]);
  const prose4 = prose(P[4]);
  const prose5 = prose(P[5], P[6]);
  const abaiIntro = h('p.word__intro.lead', null, P[7]);

  const el = h(
    'section.section.word#word',
    null,
    h(
      'div.wrap',
      null,
      h('p.eyebrow', null, t('Слово')),
      title,
      lead,
      h('div.word-split', null, prose1, h('div.word-split__side', null, prose2)),
      h('p.word-treehint.dim', null, t('Нажмите на слово — и увидите, как оно связано с корнем')),
      treeBlock,
      h('div.word-gap', null, prose3),
    ),
    motto,
    h(
      'div.wrap',
      null,
      h('div.word-gap', null, prose4),
      h('div.word-gap', null, cmp, prose5),
      h('div.word-gap', null, abaiIntro, abai),
      h('div.word-gap.word-gap--end', null, note),
    ),
  );

  // ---------- анимации ----------
  scope.add(revealWords(title));
  scope.add(scrubText(lead, { start: 'top 85%', end: 'bottom 55%' }));
  [prose1, prose2, prose3, prose4, prose5, abaiIntro, detail, note].forEach((e) => scope.add(reveal(e)));
  
  scope.add(magnetic(rootBtn, 0.15));

  if (reduce) return el;

  // ветви прорисовываются по скроллу
  const paths = nodes.map((n) => n.path);
  gsap.set(paths, { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.set(nodes.map((n) => n.flow), { strokeDasharray: '0.04 0.12', strokeDashoffset: 0 });
  const tt = gsap.timeline({ scrollTrigger: { trigger: tree, start: 'top 75%', end: 'center 45%', scrub: 0.8 } });
  tt.fromTo(rootBtn, { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' }, 0);
  tt.to(paths, { strokeDashoffset: 0, duration: 1, ease: 'none', stagger: 0.08 }, 0.3);
  tt.fromTo(nodes.map((n) => n.btn), { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' }, 0.7);
  scope.add(() => { tt.scrollTrigger?.kill(); tt.kill(); });

  // девиз: две половины едут навстречу, встречаются, проявляются переводы
  const mt = gsap.timeline({
    scrollTrigger: { trigger: motto, start: 'top top', end: 'bottom bottom', scrub: 0.7 },
    defaults: { ease: 'power2.inOut' },
  });
  mt.fromTo(mA, { xPercent: -110 }, { xPercent: 0, duration: 1 }, 0);
  mt.fromTo(mB, { xPercent: 110 }, { xPercent: 0, duration: 1 }, 0);
  mt.fromTo([tA, tB], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, 1);
  mt.fromTo(knot, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)' }, 0.85);
  mt.fromTo('.word-motto__sum', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, 1.5);
  mt.to({}, { duration: 0.4 });
  scope.add(() => { mt.scrollTrigger?.kill(); mt.kill(); });

  scope.add(drawOn(bandTop, { scrub: true, trigger: motto, start: 'top 60%', duration: 1.4 }));
  scope.add(drawOn(bandBot, { scrub: true, trigger: motto, start: 'top 40%', duration: 1.4 }));

  // Абай: строки по словам
  abaiLines.forEach((l, i) => scope.add(revealWords(l, { start: 'top 88%', delay: i * 0.25 })));
  scope.add(reveal(abaiRu));
  cards.forEach((c, i) => scope.add(reveal(c, { y: 50, delay: i * 0.1 })));
  [artH, artL, artK].forEach((a) => scope.add(drawOn(a, { duration: 2.4 })));

  return el;
}
