// Поле частиц — фирменный визуальный слой ХАҚ.
// Частицы живут в полноэкранном WebGL-канвасе, дрейфуют по «степному ветру» (поток на синусоидах)
// и по команде собираются в силуэт (логотип, иконка ценности), привязанный к DOM-элементу.
// Физика считается на CPU (пружины + затухание), рисуется одним draw call (gl.POINTS).

import { prefersReducedMotion } from './motion';

export interface MorphOptions {
  /** URL картинки: силуэт берётся из альфа-канала */
  src: string;
  /** Элемент, в прямоугольник которого вписывается силуэт (contain). Следит за скроллом. */
  anchor: HTMLElement;
  /** Доля частиц, уходящих в силуэт (остальные — пыль вокруг). По умолчанию 0.78 */
  share?: number;
  /** Разброс точек внутри силуэта, px. По умолчанию 0.6 */
  jitter?: number;
}

export interface Field {
  morphTo(opts: MorphOptions): Promise<void>;
  /** Отпустить силуэт — частицы снова дрейфуют */
  release(): void;
  /** Палитра градиента (3 цвета hex) — плавно анимируется */
  setPalette(colors: [string, string, string]): void;
  /** Волна от точки (в CSS px) */
  pulse(x: number, y: number, strength?: number): void;
  /** Насколько ярко/заметно поле: 0..1 (для читаемости длинного текста) */
  setIntensity(v: number): void;
  destroy(): void;
}

type Shape = { pts: Float32Array; count: number; aspect: number };

const VERT = `
attribute vec2 a_pos;
attribute vec2 a_seed; // x: размер, y: фаза мерцания
attribute float a_glow; // 0 — пыль, 1 — частица силуэта
uniform vec2 u_res;
uniform float u_dpr;
uniform float u_time;
uniform float u_intensity;
varying float v_alpha;
varying vec2 v_uv;
void main() {
  vec2 clip = (a_pos / u_res) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  float tw = 0.75 + 0.25 * sin(u_time * 1.7 + a_seed.y * 6.2831);
  gl_PointSize = a_seed.x * u_dpr * (0.85 + 0.3 * tw) * mix(0.75, 1.2, a_glow);
  v_alpha = tw * u_intensity * mix(0.42, 1.0, a_glow);
  v_uv = a_pos / u_res;
}`;

const FRAG = `
precision mediump float;
uniform vec3 u_c1;
uniform vec3 u_c2;
uniform vec3 u_c3;
varying float v_alpha;
varying vec2 v_uv;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = length(d);
  if (r > 0.5) discard;
  float soft = smoothstep(0.5, 0.0, r);
  float t = clamp(v_uv.x * 0.6 + v_uv.y * 0.4, 0.0, 1.0);
  vec3 col = t < 0.5 ? mix(u_c1, u_c2, t * 2.0) : mix(u_c2, u_c3, (t - 0.5) * 2.0);
  col = mix(col, vec3(1.0), 0.35 * soft * soft);
  gl_FragColor = vec4(col * soft * v_alpha, soft * v_alpha);
}`;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const shapeCache = new Map<string, Promise<Shape>>();

/** Сэмплирует силуэт из альфа-канала картинки → нормализованные точки [0..1] */
function loadShape(src: string): Promise<Shape> {
  let p = shapeCache.get(src);
  if (p) return p;
  p = new Promise<Shape>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const W = 260;
      const aspect = img.naturalWidth / img.naturalHeight;
      const w = aspect >= 1 ? W : Math.round(W * aspect);
      const h = aspect >= 1 ? Math.round(W / aspect) : W;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      const pts: number[] = [];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (data[(y * w + x) * 4 + 3] > 140) pts.push(x / w, y / h);
        }
      }
      // перемешиваем, чтобы любые первые K точек равномерно покрывали силуэт
      const n = pts.length / 2;
      for (let i = n - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        const ax = pts[i * 2], ay = pts[i * 2 + 1];
        pts[i * 2] = pts[j * 2]; pts[i * 2 + 1] = pts[j * 2 + 1];
        pts[j * 2] = ax; pts[j * 2 + 1] = ay;
      }
      resolve({ pts: new Float32Array(pts), count: n, aspect });
    };
    img.onerror = reject;
    img.src = src;
  });
  shapeCache.set(src, p);
  return p;
}

export function createField(canvas: HTMLCanvasElement): Field {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
  const reduced = prefersReducedMotion();
  const small = window.matchMedia('(max-width: 720px)').matches;
  const N = reduced ? 1800 : small ? 3600 : 8500;

  const pos = new Float32Array(N * 2);
  const vel = new Float32Array(N * 2);
  const tgt = new Float32Array(N * 2); // нормализованная цель внутри силуэта
  const hasTgt = new Uint8Array(N);
  const stiff = new Float32Array(N);
  const delay = new Float32Array(N);
  const seed = new Float32Array(N * 2);
  const glow = new Float32Array(N);

  let W = 0, H = 0, dpr = 1;
  let shape: Shape | null = null;
  let anchor: HTMLElement | null = null;
  let morphStart = 0;
  let intensity = 1, intensityTarget = 1;
  const pal = [hexToRgb('#d6aa4c'), hexToRgb('#19b6d2'), hexToRgb('#efe8d8')];
  const palTarget = pal.map((c) => [...c] as [number, number, number]);
  const mouse = { x: -9999, y: -9999, active: false };
  const pulses: { x: number; y: number; t: number; s: number }[] = [];
  let raf = 0;
  let running = true;
  const t0 = performance.now();

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    gl?.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();

  for (let i = 0; i < N; i++) {
    pos[i * 2] = Math.random() * W;
    pos[i * 2 + 1] = Math.random() * H;
    const big = Math.random() < 0.06;
    seed[i * 2] = big ? 3.6 + Math.random() * 2.6 : 1.5 + Math.random() * 1.8;
    seed[i * 2 + 1] = Math.random();
    stiff[i] = 0.018 + Math.random() * 0.03;
  }

  // ---------- WebGL ----------
  let prog: WebGLProgram | null = null;
  let posBuf: WebGLBuffer | null = null;
  let glowBuf: WebGLBuffer | null = null;
  const U: Record<string, WebGLUniformLocation | null> = {};
  if (gl) {
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    for (const u of ['u_res', 'u_dpr', 'u_time', 'u_intensity', 'u_c1', 'u_c2', 'u_c3']) U[u] = gl.getUniformLocation(prog, u);
    posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const seedBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
    gl.bufferData(gl.ARRAY_BUFFER, seed, gl.STATIC_DRAW);
    const aSeed = gl.getAttribLocation(prog, 'a_seed');
    gl.enableVertexAttribArray(aSeed);
    gl.vertexAttribPointer(aSeed, 2, gl.FLOAT, false, 0, 0);
    glowBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, glowBuf);
    gl.bufferData(gl.ARRAY_BUFFER, glow, gl.DYNAMIC_DRAW);
    const aGlow = gl.getAttribLocation(prog, 'a_glow');
    gl.enableVertexAttribArray(aGlow);
    gl.vertexAttribPointer(aGlow, 1, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }

  // ---------- события ----------
  const onMove = (e: PointerEvent) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  };
  const onLeave = () => (mouse.active = false);
  const onDown = (e: PointerEvent) => {
    const el = e.target as HTMLElement;
    if (el.closest('a,button,input,label,[data-no-pulse]')) return;
    pulses.push({ x: e.clientX, y: e.clientY, t: 0, s: 1 });
  };
  const onVis = () => {
    running = !document.hidden;
    if (running) loop();
  };
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  document.addEventListener('visibilitychange', onVis);

  // ---------- шаг симуляции ----------
  function step(now: number) {
    const t = (now - t0) / 1000;
    const since = (now - morphStart) / 1000;

    // прямоугольник силуэта
    let bx = 0, by = 0, bw = 0, bh = 0, onScreen = false;
    if (shape && anchor && anchor.isConnected) {
      const r = anchor.getBoundingClientRect();
      onScreen = r.bottom > -r.height * 0.5 && r.top < H + r.height * 0.5;
      const ra = r.width / Math.max(r.height, 1);
      if (ra > shape.aspect) { bh = r.height; bw = bh * shape.aspect; }
      else { bw = r.width; bh = bw / shape.aspect; }
      bx = r.left + (r.width - bw) / 2;
      by = r.top + (r.height - bh) / 2;
    }

    // волны
    for (const p of pulses) p.t += 1 / 60;
    while (pulses.length && pulses[0].t > 1.6) pulses.shift();

    const mR = small ? 90 : 140;
    const mR2 = mR * mR;
    const windT = t * 0.12;

    for (let i = 0; i < N; i++) {
      const ix = i * 2, iy = ix + 1;
      let x = pos[ix], y = pos[iy];
      let vx = vel[ix], vy = vel[iy];

      const inShape = hasTgt[i] && onScreen && since > delay[i];
      glow[i] += ((inShape ? 1 : 0) - glow[i]) * 0.05;
      if (inShape) {
        const tx = bx + tgt[ix] * bw;
        const ty = by + tgt[iy] * bh;
        // лёгкое «дыхание» внутри силуэта
        const br = reduced ? 0 : 0.6;
        const dx = tx + Math.sin(t * 1.3 + seed[iy] * 40) * br - x;
        const dy = ty + Math.cos(t * 1.1 + seed[iy] * 30) * br - y;
        vx += dx * stiff[i];
        vy += dy * stiff[i];
        vx *= 0.82;
        vy *= 0.82;
      } else {
        // степной ветер: дешёвое псевдо-поле потока
        const a = Math.sin(x * 0.0021 + windT) * 1.7 + Math.cos(y * 0.0026 - windT * 1.3) * 1.7 + seed[iy] * 0.6;
        const sp = reduced ? 0.04 : 0.09;
        vx += Math.cos(a) * sp + 0.012;
        vy += Math.sin(a) * sp;
        vx *= 0.955;
        vy *= 0.955;
      }

      // курсор раздвигает частицы
      if (mouse.active) {
        const dx = x - mouse.x, dy = y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < mR2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (1 - d / mR) * 2.2;
          vx += (dx / d) * f;
          vy += (dy / d) * f;
        }
      }
      // ударные волны от кликов
      for (const p of pulses) {
        const dx = x - p.x, dy = y - p.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const front = p.t * 900;
        const band = Math.abs(d - front);
        if (band < 70) {
          const f = (1 - band / 70) * 3.2 * p.s * (1 - p.t / 1.6);
          vx += (dx / d) * f;
          vy += (dy / d) * f;
        }
      }

      x += vx;
      y += vy;
      // заворачиваем дрейфующие частицы за края
      if (!hasTgt[i] || !onScreen) {
        if (x < -20) x = W + 20; else if (x > W + 20) x = -20;
        if (y < -20) y = H + 20; else if (y > H + 20) y = -20;
      }
      pos[ix] = x; pos[iy] = y; vel[ix] = vx; vel[iy] = vy;
    }

    // плавная смена палитры и яркости
    for (let k = 0; k < 3; k++) for (let c = 0; c < 3; c++) pal[k][c] += (palTarget[k][c] - pal[k][c]) * 0.04;
    intensity += (intensityTarget - intensity) * 0.05;
    return t;
  }

  function draw(t: number) {
    if (!gl || !prog) return;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos);
    gl.bindBuffer(gl.ARRAY_BUFFER, glowBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, glow);
    gl.uniform2f(U.u_res, W, H);
    gl.uniform1f(U.u_dpr, dpr);
    gl.uniform1f(U.u_time, t);
    gl.uniform1f(U.u_intensity, intensity);
    gl.uniform3fv(U.u_c1, pal[0]);
    gl.uniform3fv(U.u_c2, pal[1]);
    gl.uniform3fv(U.u_c3, pal[2]);
    gl.drawArrays(gl.POINTS, 0, N);
  }

  function loop() {
    cancelAnimationFrame(raf);
    const tick = (now: number) => {
      if (!running) return;
      draw(step(now));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  loop();

  let morphToken = 0;
  return {
    async morphTo({ src, anchor: el, share = 0.78, jitter = 0.6 }) {
      const token = ++morphToken;
      const s = await loadShape(src);
      if (token !== morphToken) return;
      shape = s;
      anchor = el;
      morphStart = performance.now();
      const k = Math.floor(N * share);
      const r = el.getBoundingClientRect();
      const j = jitter / Math.max(r.width, 1);
      for (let i = 0; i < N; i++) {
        if (i < k) {
          const p = (i * 7919) % s.count; // равномерный проход по перемешанным точкам
          tgt[i * 2] = s.pts[p * 2] + (Math.random() - 0.5) * j;
          tgt[i * 2 + 1] = s.pts[p * 2 + 1] + (Math.random() - 0.5) * j;
          hasTgt[i] = 1;
          delay[i] = reduced ? 0 : Math.random() * 0.9;
        } else hasTgt[i] = 0;
      }
    },
    release() {
      morphToken++;
      shape = null;
      anchor = null;
      hasTgt.fill(0);
      // лёгкий разлёт при освобождении
      for (let i = 0; i < N; i++) {
        vel[i * 2] += (Math.random() - 0.5) * 6;
        vel[i * 2 + 1] += (Math.random() - 0.5) * 6;
      }
    },
    setPalette(colors) {
      colors.forEach((c, k) => (palTarget[k] = hexToRgb(c)));
    },
    pulse(x, y, strength = 1) {
      pulses.push({ x, y, t: 0, s: strength });
    },
    setIntensity(v) {
      intensityTarget = v;
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
    },
  };
}
