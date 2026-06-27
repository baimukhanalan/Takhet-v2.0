import React, { useEffect, useRef } from 'react';

type HeroFlowCanvasProps = {
  accent?: string;
  searchRef: React.RefObject<HTMLDivElement | null>;
};

type FlowLine = {
  ry: number;
  amp: number;
  fx: number;
  sp: number;
  off: number;
  lw: number;
  alpha: number;
  accent: boolean;
  depth: number;
  glow: boolean;
};

const FLOW_LINES: FlowLine[] = [
  { ry: 0.22, amp: 14, fx: 1.4, sp: 1, off: 2, lw: 1, alpha: 0.1, accent: false, depth: 0.18, glow: false },
  { ry: 0.3, amp: 18, fx: 1.1, sp: 1, off: 0, lw: 1.2, alpha: 0.14, accent: false, depth: 0.26, glow: false },
  { ry: 0.4, amp: 26, fx: 0.9, sp: 1, off: 1.7, lw: 1.5, alpha: 0.17, accent: false, depth: 0.36, glow: false },
  { ry: 0.52, amp: 30, fx: 1.3, sp: 2, off: 0.6, lw: 1.7, alpha: 0.2, accent: false, depth: 0.46, glow: false },
  { ry: 0.6, amp: 40, fx: 0.8, sp: 1, off: 2.4, lw: 2, alpha: 0.26, accent: true, depth: 0.56, glow: true },
  { ry: 0.7, amp: 34, fx: 1.15, sp: 2, off: 3.1, lw: 2.4, alpha: 0.34, accent: false, depth: 0.7, glow: false },
  { ry: 0.8, amp: 50, fx: 0.95, sp: 1, off: 0.9, lw: 2.8, alpha: 0.4, accent: true, depth: 0.86, glow: true },
  { ry: 0.88, amp: 58, fx: 1.05, sp: 1, off: 4.2, lw: 3.2, alpha: 0.44, accent: false, depth: 1, glow: false },
  { ry: 0.94, amp: 44, fx: 1.25, sp: 2, off: 5, lw: 2.6, alpha: 0.3, accent: false, depth: 1, glow: true },
];

const parseHex = (hex: string) => {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized.split('').map((character) => character + character).join('')
    : normalized;
  const value = Number.parseInt(expanded, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
};

const HeroFlowCanvas: React.FC<HeroFlowCanvasProps> = ({ accent = '#1d4ed8', searchRef }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.closest<HTMLElement>('[data-takhet-flow-hero]');
    if (!canvas || !hero) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const tau = Math.PI * 2;
    const period = 16;
    const accentRgb = parseHex(accent);
    const mouse = { nx: 0, ny: 0, last: -Infinity };
    const parallax = { x: 0, y: 0 };
    const cursor = { x: -Infinity, y: -Infinity, inside: false, amount: 0, lag: 0, last: -Infinity };
    const maxLag = tau * 0.45;
    let cssWidth = 1;
    let cssHeight = 1;
    let clock = 0;
    let previousFrame = performance.now();
    let frame = 0;
    let visible = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      cssWidth = Math.max(1, rect.width);
      cssHeight = Math.max(1, rect.height);
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
    };

    const draw = (time: number, scrollProgress: number) => {
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, cssWidth, cssHeight);

      const phase = time / period;
      const cursorAmount = reducedMotion.matches ? 0 : cursor.amount;
      const cursorLag = reducedMotion.matches ? 0 : cursor.lag;
      const horizontalSigma = 2 * (cssWidth * 0.14) ** 2;
      const verticalSigma = 2 * (cssHeight * 0.2) ** 2;
      const step = Math.max(3, cssWidth / 320);

      context.lineCap = 'round';

      for (const line of FLOW_LINES) {
        const xOffset = parallax.x * line.depth;
        const baseY = cssHeight * line.ry + parallax.y * line.depth;
        const speed = line.sp * (1 + 0.5 * scrollProgress * (0.6 + 0.4 * line.depth));
        const cursorDeltaY = cssHeight * line.ry - cursor.y;
        const verticalPresence = cursorAmount > 0.001
          ? Math.exp(-(cursorDeltaY ** 2) / verticalSigma) * cursorAmount
          : 0;

        context.beginPath();
        for (let x = 0; x <= cssWidth; x += step) {
          const unit = (x - xOffset) / cssWidth;
          const cursorDeltaX = x - cursor.x;
          const influence = verticalPresence > 0.002
            ? Math.exp(-(cursorDeltaX ** 2) / horizontalSigma) * verticalPresence
            : 0;
          const amplitude = line.amp * (1 + 1.35 * influence);
          const y = baseY
            + amplitude * Math.sin(tau * line.fx * unit + tau * speed * phase + line.off - influence * cursorLag)
            + amplitude * 0.38 * Math.sin(tau * line.fx * 2 * unit - tau * speed * phase + line.off * 1.3 - influence * cursorLag * 0.5);
          if (x === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }

        const middleColor = line.accent
          ? `${accentRgb.r},${accentRgb.g},${accentRgb.b}`
          : '124,142,224';
        const alpha = Math.min(0.7, line.alpha * (1 + 0.18 * scrollProgress));
        const gradient = context.createLinearGradient(0, 0, cssWidth, 0);
        gradient.addColorStop(0, 'rgba(150,168,228,0)');
        gradient.addColorStop(0.14, `rgba(150,168,228,${alpha})`);
        gradient.addColorStop(0.5, `rgba(${middleColor},${alpha})`);
        gradient.addColorStop(0.86, `rgba(150,168,228,${alpha})`);
        gradient.addColorStop(1, 'rgba(150,168,228,0)');
        context.strokeStyle = gradient;
        context.lineWidth = line.lw;
        context.shadowColor = line.glow ? `rgba(40,90,210,${0.18 + 0.45 * scrollProgress})` : 'transparent';
        context.shadowBlur = line.glow ? 4 + 16 * scrollProgress : 0;
        context.stroke();
        context.shadowBlur = 0;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches || reducedMotion.matches) return;
      const rect = canvas.getBoundingClientRect();
      const localY = event.clientY - rect.top;
      mouse.nx = (event.clientX / window.innerWidth - 0.5) * 2;
      mouse.ny = (event.clientY / window.innerHeight - 0.5) * 2;
      mouse.last = performance.now();
      cursor.x = event.clientX - rect.left;
      cursor.y = localY;
      cursor.inside = localY >= 0 && localY <= rect.height;
      cursor.last = performance.now();
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (!visible || document.hidden) return;

      const delta = Math.min(0.05, (now - previousFrame) / 1000);
      previousFrame = now;
      const scrollProgress = Math.max(0, Math.min(1, window.scrollY / 600));
      hero.style.setProperty('--takhet-flow-glow', (0.04 + 0.7 * scrollProgress).toFixed(3));

      const pointerIdle = now - mouse.last > 1600;
      const targetX = !pointerIdle && finePointer.matches && !reducedMotion.matches ? mouse.nx : 0;
      const targetY = !pointerIdle && finePointer.matches && !reducedMotion.matches ? mouse.ny : 0;
      parallax.x += (targetX * 13 - parallax.x) * 0.045;
      parallax.y += (targetY * 7 - parallax.y) * 0.045;

      if (searchRef.current) {
        searchRef.current.style.transform = `translate3d(${(parallax.x * 0.2).toFixed(2)}px, ${(parallax.y * 0.2).toFixed(2)}px, 0)`;
      }

      const cursorIdle = now - cursor.last > 1200;
      const cursorTarget = cursor.inside && !cursorIdle ? 1 : 0;
      cursor.amount += (cursorTarget - cursor.amount) * 0.07;
      cursor.lag += (cursor.amount * maxLag - cursor.lag) * 0.05;
      const speedScale = (1 + 0.45 * scrollProgress) * (1 - 0.16 * cursor.amount);
      clock += delta * speedScale;
      draw(clock, scrollProgress);
    };

    resize();
    draw(0, 0);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      previousFrame = performance.now();
    });
    visibilityObserver.observe(hero);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [accent, searchRef]);

  return <canvas ref={canvasRef} className="takhet-flow-canvas" aria-hidden="true" />;
};

export default HeroFlowCanvas;
