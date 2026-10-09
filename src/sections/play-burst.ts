// Конфетти-всплеск на canvas поверх страницы (цвета ценности). Без зависимостей.
import type { Cleanup } from '../engine/dom';
import { prefersReducedMotion } from '../engine/motion';

interface P { x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number; c: string; life: number; max: number; rect: boolean }

export function createBurst(): { burst(x: number, y: number, colors: string[], n?: number): void; destroy: Cleanup } {
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.className = 'play-burst';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d')!;
  let dpr = 1;
  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
  };
  resize();
  addEventListener('resize', resize);
  const ps: P[] = [];
  const rings: { x: number; y: number; t: number; c: string }[] = [];
  let raf = 0;
  let last = 0;

  const frame = (t: number) => {
    const dt = Math.min(0.04, (t - last) / 1000 || 0.016);
    last = t;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life += dt;
      if (p.life >= p.max) { ps.splice(i, 1); continue; }
      p.vy += 900 * dt;
      p.vx *= 0.985;
      p.vy *= 0.985;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      const k = 1 - p.life / p.max;
      ctx.globalAlpha = Math.min(1, k * 1.6);
      ctx.fillStyle = p.c;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.rect) {
        // ромб-«искра» орнамента
        ctx.beginPath(); ctx.moveTo(0, -p.r * 1.5); ctx.lineTo(p.r * 0.6, 0); ctx.lineTo(0, p.r * 1.5); ctx.lineTo(-p.r * 0.6, 0); ctx.closePath(); ctx.fill();
      } else { ctx.fillRect(-p.r * 0.8, -0.5, p.r * 1.6, 1); }
      ctx.restore();
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.t += dt;
      const k = r.t / 0.9;
      if (k >= 1) { rings.splice(i, 1); continue; }
      ctx.globalAlpha = (1 - k) * 0.8;
      ctx.strokeStyle = r.c; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(r.x, r.y, 12 + k * 90, 0, 6.283); ctx.stroke();
      ctx.beginPath(); ctx.arc(r.x, r.y, 6 + k * 60, 0, 6.283); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (ps.length || rings.length) raf = requestAnimationFrame(frame);
    else { raf = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  };

  return {
    burst(x, y, colors, n = 46) {
      rings.push({ x, y, t: 0, c: colors[0] });
      const count = prefersReducedMotion() ? 8 : n;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 180 + Math.random() * 520;
        ps.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 260,
          r: 2.5 + Math.random() * 3.5, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 16,
          c: colors[(Math.random() * colors.length) | 0], life: 0, max: 0.9 + Math.random() * 0.9, rect: Math.random() < 0.55,
        });
      }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    },
    destroy() {
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
      cv.remove();
    },
  };
}
