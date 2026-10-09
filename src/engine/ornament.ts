// Графический словарь «Хартии Степи»: казахский орнамент, флаги, линейные иллюстрации.
// Всё — SVG-строки/элементы, линии в currentColor (красятся через CSS color), без растровых картинок.
// Анимация «прорисовки»: drawOn(svg) — штрихи рисуются по скроллу/при появлении.

import { gsap, prefersReducedMotion } from './motion';
import type { Cleanup } from './dom';

const NS = 'http://www.w3.org/2000/svg';

export function svg(viewBox: string, inner: string, cls = ''): SVGSVGElement {
  const el = document.createElementNS(NS, 'svg');
  el.setAttribute('viewBox', viewBox);
  el.setAttribute('aria-hidden', 'true');
  if (cls) el.setAttribute('class', cls);
  el.innerHTML = inner;
  return el;
}

// ---------- геометрия ----------
const f = (n: number) => +n.toFixed(2);

/** Логарифмическая спираль-«рог» от точки (x,y): растёт вверх и закручивается наружу. dir = 1 вправо, -1 влево */
function hornPath(x: number, y: number, size: number, dir: 1 | -1, turns = 1.35): string {
  const pts: [number, number][] = [];
  const N = 46;
  // идём от внешнего конца стебля к центру завитка
  const cx = x + dir * size * 0.42, cy = y - size * 0.62;
  const a0 = dir === 1 ? Math.PI * 1.02 : -Math.PI * 0.02;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const r = size * 0.5 * Math.pow(0.16, t);
    const a = a0 + dir * t * Math.PI * 2 * turns;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 1.05]);
  }
  // плавное соединение со стеблем
  let d = `M${f(x)} ${f(y)} C${f(x)} ${f(y - size * 0.3)} ${f(pts[0][0])} ${f(pts[0][1] + size * 0.25)} ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length; i++) d += ` L${f(pts[i][0])} ${f(pts[i][1])}`;
  return d;
}

/** Қошқар мүйіз — парные бараньи рога: центральный стебель + два завитка. Габарит ~ size×size */
export function ramHornPath(cx: number, base: number, size: number): string {
  const top = base - size * 0.18;
  return [
    `M${f(cx)} ${f(base)} L${f(cx)} ${f(top)}`,
    hornPath(cx, top, size, 1),
    hornPath(cx, top, size, -1),
    // нижние малые завитки — «корни»
    hornPath(cx, base, size * 0.38, 1, 1.1).replace(/^M[^C]+C/, `M${f(cx)} ${f(base)} C`),
    hornPath(cx, base, size * 0.38, -1, 1.1).replace(/^M[^C]+C/, `M${f(cx)} ${f(base)} C`),
  ].join(' ');
}

export function ramHorn(cls = 'orn'): SVGSVGElement {
  return svg('0 0 100 100', `<path d="${ramHornPath(50, 88, 62)}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`, cls);
}

/** Орнаментальная лента: мотивы рогов, чередующиеся вверх/вниз, между двумя линиями. */
export function ornamentBand(count = 12, cls = 'orn-band'): SVGSVGElement {
  const W = 60, H = 44;
  let p = `<path d="M0 2 H${count * W} M0 ${H - 2} H${count * W}" stroke="currentColor" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".55"/>`;
  for (let i = 0; i < count; i++) {
    const cx = i * W + W / 2;
    const up = i % 2 === 0;
    const d = ramHornPath(cx, H - 5, 30);
    p += `<path d="${d}" ${up ? '' : `transform="translate(0 ${H}) scale(1 -1)"`} fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
  }
  const el = svg(`0 0 ${count * W} ${H}`, p, cls);
  el.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  return el;
}

/** Розетка — четыре пары рогов вокруг центра (для медальонов, номеров разделов). */
export function rosette(cls = 'orn'): SVGSVGElement {
  let p = '<circle cx="50" cy="50" r="4" fill="currentColor"/>';
  for (let k = 0; k < 4; k++) {
    p += `<path transform="rotate(${k * 90} 50 50)" d="${ramHornPath(50, 46, 34)}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
  }
  p += '<circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" stroke-width="1" opacity=".4" vector-effect="non-scaling-stroke"/>';
  return svg('0 0 100 100', p, cls);
}

// ---------- флаги ----------
/** Флаг Казахстана: небесно-голубое поле, солнце с 32 лучами, степной орёл, национальный орнамент у древка. */
export function flagKZ(cls = 'flag'): SVGSVGElement {
  const sky = '#00AFCA', gold = '#FEC50C';
  const cx = 300, cy = 128;
  let rays = '';
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    const a1 = a - 0.045, a2 = a + 0.045;
    const r0 = 46, r1 = 70;
    rays += `M${f(cx + Math.cos(a1) * r0)} ${f(cy + Math.sin(a1) * r0)} L${f(cx + Math.cos(a) * r1)} ${f(cy + Math.sin(a) * r1)} L${f(cx + Math.cos(a2) * r0)} ${f(cy + Math.sin(a2) * r0)}Z `;
  }
  // орёл: два широких крыла дугой под солнцем
  const eagle = `M300 214 C268 200 236 196 196 204 C214 212 226 214 240 214 C224 220 212 224 200 232 C226 230 252 226 272 224 C280 230 290 236 300 238
    C310 236 320 230 328 224 C348 226 374 230 400 232 C388 224 376 220 360 214 C374 214 386 212 404 204 C364 196 332 200 300 214Z`;
  // орнамент у древка — вертикальная лента рогов
  let orn = '';
  for (let i = 0; i < 6; i++) {
    const y = 26 + i * 50;
    orn += `<path d="${ramHornPath(40, y + 34, 30)}" fill="none" stroke="${gold}" stroke-width="5" stroke-linecap="round"/>`;
  }
  return svg('0 0 600 300', `<rect width="600" height="300" fill="${sky}"/>
    <path d="${rays}" fill="${gold}"/><circle cx="${cx}" cy="${cy}" r="40" fill="${gold}"/>
    <path d="${eagle}" fill="${gold}"/>${orn}`, cls);
}

export function flagDK(cls = 'flag'): SVGSVGElement {
  return svg('0 0 37 28', '<rect width="37" height="28" fill="#C8102E"/><path d="M12 0h4v28h-4zM0 12h37v4H0z" fill="#fff"/>', cls);
}

export function flagSE(cls = 'flag'): SVGSVGElement {
  return svg('0 0 16 10', '<rect width="16" height="10" fill="#006AA7"/><path d="M5 0h2v10H5zM0 4h16v2H0z" fill="#FECC02"/>', cls);
}

// ---------- линейные иллюстрации (штрих currentColor, viewBox 0 0 200 160) ----------
const S = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"';

export const ILLUSTRATIONS = {
  /** Шаңырақ — как на Государственном гербе: венец с перекрещёнными изогнутыми кульдырышами (3 + 3),
   *  от венца лучами расходятся уықи до внешнего кольца-обода. */
  shanyrak: () => {
    const cx = 100, cy = 80, R = 76, rc = 25;
    let p = `<circle cx="${cx}" cy="${cy}" r="${R}" ${S}/><circle cx="${cx}" cy="${cy}" r="${R - 4}" ${S} opacity=".6"/>`;
    // уықи: 36 лучей от венца к ободу, чуть сужающихся (двойная линия у основания)
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2 + Math.PI / 36;
      const c = Math.cos(a), sn = Math.sin(a);
      const r0 = rc + 4, r1 = R - 5;
      p += `<path d="M${f(cx + c * r0)} ${f(cy + sn * r0)} L${f(cx + c * r1)} ${f(cy + sn * r1)}" ${S}/>`;
    }
    // венец (дөңгелек)
    p += `<circle cx="${cx}" cy="${cy}" r="${rc + 4}" ${S}/><circle cx="${cx}" cy="${cy}" r="${rc}" ${S}/>`;
    // кульдырыши: три пары перекрещённых дуг, выгнутых к центру купола
    for (const d of [-12, 0, 12]) {
      const half = Math.sqrt(rc * rc - d * d);
      const bow = d === 0 ? 0 : d * 0.55;
      p += `<path d="M${f(cx - half)} ${f(cy + d)} Q${cx} ${f(cy + d + bow)} ${f(cx + half)} ${f(cy + d)}" ${S}/>`;
      p += `<path d="M${f(cx + d)} ${f(cy - half)} Q${f(cx + d + bow)} ${cy} ${f(cx + d)} ${f(cy + half)}" ${S}/>`;
    }
    return p;
  },
  /** Раскрытая книга — Конституция */
  book: () =>
    `<path d="M100 44 C80 34 52 32 28 38 V124 C52 118 80 120 100 130 C120 120 148 118 172 124 V38 C148 32 120 34 100 44 Z" ${S}/>
     <path d="M100 44 V130" ${S}/>
     <path d="M42 56 C58 53 74 54 88 58 M42 70 C58 67 74 68 88 72 M42 84 C58 81 74 82 88 86 M112 58 C126 54 142 53 158 56 M112 72 C126 68 142 67 158 70 M112 86 C126 82 142 81 158 84" ${S} opacity=".6"/>
     <path d="${ramHornPath(100, 30, 22)}" ${S}/>`,
  /** Весы правосудия */
  scales: () =>
    `<path d="M100 26 V138 M74 138 H126 M40 50 H160 M100 26 m-5 0 a5 5 0 1 0 10 0 a5 5 0 1 0 -10 0" ${S}/>
     <path d="M40 50 L22 96 M40 50 L58 96 M160 50 L142 96 M160 50 L178 96" ${S} opacity=".7"/>
     <path d="M18 96 Q40 116 62 96 Z M138 96 Q160 116 182 96 Z" ${S}/>`,
  /** Свеча и чашка — hygge */
  candle: () =>
    `<path d="M62 66 V132 H86 V66 Z M74 66 V58" ${S}/>
     <path d="M74 56 C66 46 70 36 74 28 C78 36 84 46 74 56 Z" ${S}/>
     <path d="M54 34 C50 40 50 46 54 50 M96 34 C100 40 100 46 96 50" ${S} opacity=".45"/>
     <path d="M110 92 H158 V118 C158 128 150 134 140 134 H128 C118 134 110 128 110 118 Z M158 100 C170 100 172 116 158 118" ${S}/>
     <path d="M124 84 C120 78 128 74 124 68 M140 84 C136 78 144 74 140 68" ${S} opacity=".5"/>
     <path d="M40 134 H176" ${S} opacity=".5"/>`,
  /** Чаша с отметкой меры — lagom («в самый раз») */
  measure: () =>
    `<path d="M48 60 H152 C150 102 128 128 100 128 C72 128 50 102 48 60 Z" ${S}/>
     <path d="M54 84 H146" ${S} stroke-dasharray="4 5"/>
     <path d="M100 128 V140 M76 140 H124" ${S}/>
     <path d="M160 84 H178 M170 78 L178 84 L170 90" ${S} opacity=".6"/>`,
  /** Солнце с лучами */
  sun: () => {
    let p = `<circle cx="100" cy="80" r="26" ${S}/>`;
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const r1 = i % 2 ? 50 : 60;
      p += `<path d="M${f(100 + Math.cos(a) * 34)} ${f(80 + Math.sin(a) * 34)} L${f(100 + Math.cos(a) * r1)} ${f(80 + Math.sin(a) * r1)}" ${S}/>`;
    }
    return p;
  },
  /** Юрта — дом, семья, Отан */
  yurt: () =>
    `<path d="M30 132 V92 C30 84 34 80 40 78 L86 46 H114 L160 78 C166 80 170 84 170 92 V132 Z" ${S}/>
     <path d="M86 46 C92 40 108 40 114 46 M30 92 H170 M30 112 H170" ${S} opacity=".55"/>
     <path d="M86 132 V100 H114 V132" ${S}/>
     <path d="M44 100 L58 92 L72 100 L86 92 M114 92 L128 100 L142 92 L156 100" ${S} opacity=".55"/>
     <path d="M16 132 H184" ${S}/>`,
  /** Росток из ладоней — развитие */
  sprout: () =>
    `<path d="M100 132 V64" ${S}/>
     <path d="M100 96 C80 96 66 84 64 64 C84 64 98 76 100 96 Z M100 78 C116 78 130 66 132 46 C114 46 102 58 100 78 Z" ${S}/>
     <path d="M52 132 C66 120 84 118 100 124 C116 118 134 120 148 132" ${S}/>
     <path d="M40 140 H160" ${S} opacity=".5"/>`,
} as const;

export type IllustrationName = keyof typeof ILLUSTRATIONS;

export function illustration(name: IllustrationName, cls = 'illo'): SVGSVGElement {
  return svg('0 0 200 160', ILLUSTRATIONS[name](), cls);
}

/** Прорисовка штрихов: все path/circle внутри svg рисуются по порядку при появлении (или по скроллу scrub). */
export function drawOn(el: SVGSVGElement, opts: { scrub?: boolean; trigger?: Element; duration?: number; start?: string } = {}): Cleanup {
  const shapes = Array.from(el.querySelectorAll<SVGGeometryElement>('path, circle, line, polyline, ellipse'))
    .filter((s) => s.getAttribute('fill') === 'none' || s.getAttribute('stroke'));
  if (prefersReducedMotion() || !shapes.length) return () => {};
  shapes.forEach((s) => {
    let len = 1000;
    try { len = s.getTotalLength(); } catch { /* в отсоединённом svg */ }
    s.style.strokeDasharray = `${len} ${len}`;
    s.style.strokeDashoffset = String(len);
    (s as unknown as { _len: number })._len = len;
  });
  const tw = gsap.to(shapes, {
    strokeDashoffset: 0,
    duration: opts.duration ?? 2.2,
    ease: 'power2.inOut',
    stagger: 0.04,
    scrollTrigger: {
      trigger: opts.trigger ?? el,
      start: opts.start ?? 'top 85%',
      end: 'center 45%',
      scrub: opts.scrub ? 0.8 : false,
      once: !opts.scrub,
    },
  });
  return () => { tw.scrollTrigger?.kill(); tw.kill(); };
}
