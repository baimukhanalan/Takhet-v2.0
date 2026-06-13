import React, { useEffect, useRef } from 'react';

type PlatformMotionShellProps = {
  children: React.ReactNode;
  variant?: 'rich' | 'portal';
};

type ParallaxValues = {
  x: number;
  y: number;
};

const createParallaxValues = (): ParallaxValues => ({ x: 0, y: 0 });

const PlatformMotionShell: React.FC<PlatformMotionShellProps> = ({ children, variant = 'portal' }) => {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const activeTiltElementRef = useRef<HTMLElement | null>(null);
  const activeMagneticButtonRef = useRef<HTMLElement | null>(null);
  const parallaxRef = useRef<{
    element: HTMLElement | null;
    frame: number;
    current: ParallaxValues;
    target: ParallaxValues;
  }>({
    element: null,
    frame: 0,
    current: createParallaxValues(),
    target: createParallaxValues(),
  });

  useEffect(() => {
    return () => {
      if (parallaxRef.current.frame) {
        cancelAnimationFrame(parallaxRef.current.frame);
      }
    };
  }, []);

  const writeCursorPosition = (clientX: number, clientY: number, opacity: number) => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    cursor.style.transform = `translate3d(${clientX.toFixed(2)}px, ${clientY.toFixed(2)}px, 0)`;
    cursor.style.opacity = opacity.toFixed(3);
  };

  const writeParallax = (element: HTMLElement, values: ParallaxValues) => {
    const { style } = element;
    style.setProperty('--takhet-platform-parallax-soft-x', `${(values.x * 7).toFixed(2)}px`);
    style.setProperty('--takhet-platform-parallax-soft-y', `${(values.y * 5).toFixed(2)}px`);
    style.setProperty('--takhet-platform-parallax-medium-x', `${(values.x * 12).toFixed(2)}px`);
    style.setProperty('--takhet-platform-parallax-medium-y', `${(values.y * 8).toFixed(2)}px`);
    style.setProperty('--takhet-platform-parallax-deep-x', `${(values.x * 18).toFixed(2)}px`);
    style.setProperty('--takhet-platform-parallax-deep-y', `${(values.y * 12).toFixed(2)}px`);
    style.setProperty('--takhet-platform-parallax-rotate', `${(values.x * 0.55).toFixed(2)}deg`);
  };

  const animateParallax = () => {
    const parallax = parallaxRef.current;
    const { element, current, target } = parallax;
    if (!element) {
      parallax.frame = 0;
      return;
    }

    const ease = 0.09;
    const deltaX = target.x - current.x;
    const deltaY = target.y - current.y;
    current.x += deltaX * ease;
    current.y += deltaY * ease;
    writeParallax(element, current);
    parallax.frame = Math.abs(deltaX) > 0.003 || Math.abs(deltaY) > 0.003 ? requestAnimationFrame(animateParallax) : 0;
  };

  const setParallaxTarget = (element: HTMLElement, target: ParallaxValues) => {
    const parallax = parallaxRef.current;
    parallax.element = element;
    parallax.target = target;
    if (!parallax.frame) {
      parallax.frame = requestAnimationFrame(animateParallax);
    }
  };

  const resetTiltElement = (element: HTMLElement | null) => {
    if (!element) return;
    element.style.setProperty('--takhet-tilt-x', '0deg');
    element.style.setProperty('--takhet-tilt-y', '0deg');
    element.style.setProperty('--takhet-tilt-lift', '0px');
    element.style.setProperty('--takhet-tilt-glare-x', '50%');
    element.style.setProperty('--takhet-tilt-glare-y', '50%');
  };

  const resetMagneticButton = (element: HTMLElement | null) => {
    if (!element) return;
    element.style.setProperty('--takhet-magnetic-x', '0px');
    element.style.setProperty('--takhet-magnetic-y', '0px');
  };

  const updateTiltElement = (event: React.PointerEvent<HTMLElement>) => {
    const target = event.target instanceof Element ? event.target : null;
    const candidate = target?.closest('[data-takhet-tilt]');
    const element = candidate instanceof HTMLElement && event.currentTarget.contains(candidate) ? candidate : null;

    if (activeTiltElementRef.current && activeTiltElementRef.current !== element) {
      resetTiltElement(activeTiltElementRef.current);
    }

    activeTiltElementRef.current = element;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const normalizedX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const normalizedY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    const x = Math.max(-1, Math.min(1, normalizedX));
    const y = Math.max(-1, Math.min(1, normalizedY));

    element.style.setProperty('--takhet-tilt-x', `${(-y * 3.1).toFixed(2)}deg`);
    element.style.setProperty('--takhet-tilt-y', `${(x * 3.6).toFixed(2)}deg`);
    element.style.setProperty('--takhet-tilt-lift', '5px');
    element.style.setProperty('--takhet-tilt-glare-x', `${(50 + x * 14).toFixed(2)}%`);
    element.style.setProperty('--takhet-tilt-glare-y', `${(50 + y * 12).toFixed(2)}%`);
  };

  const updateMagneticButton = (event: React.PointerEvent<HTMLElement>) => {
    const target = event.target instanceof Element ? event.target : null;
    const candidate = target?.closest('[data-takhet-magnetic-button]');
    const element = candidate instanceof HTMLElement && event.currentTarget.contains(candidate) ? candidate : null;

    if (activeMagneticButtonRef.current && activeMagneticButtonRef.current !== element) {
      resetMagneticButton(activeMagneticButtonRef.current);
    }

    activeMagneticButtonRef.current = element;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const normalizedX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const normalizedY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    const x = Math.max(-1, Math.min(1, normalizedX));
    const y = Math.max(-1, Math.min(1, normalizedY));

    element.style.setProperty('--takhet-magnetic-x', `${(x * 7).toFixed(2)}px`);
    element.style.setProperty('--takhet-magnetic-y', `${(y * 5).toFixed(2)}px`);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'touch') return;
    writeCursorPosition(event.clientX, event.clientY, 1);
    updateTiltElement(event);
    updateMagneticButton(event);

    if (variant !== 'rich') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const normalizedX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const normalizedY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    setParallaxTarget(event.currentTarget, {
      x: Math.max(-1, Math.min(1, normalizedX)),
      y: Math.max(-1, Math.min(1, normalizedY)),
    });
  };

  const handlePointerLeave = (event: React.PointerEvent<HTMLElement>) => {
    writeCursorPosition(event.clientX, event.clientY, 0);
    resetTiltElement(activeTiltElementRef.current);
    resetMagneticButton(activeMagneticButtonRef.current);
    activeTiltElementRef.current = null;
    activeMagneticButtonRef.current = null;
    if (variant === 'rich') {
      setParallaxTarget(event.currentTarget, createParallaxValues());
    }
  };

  return (
    <div
      className={`takhet-platform-motion-shell takhet-platform-motion-shell--${variant}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div ref={cursorRef} className="takhet-platform-cursor" aria-hidden="true">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
          <text
            x="50"
            y="69"
            textAnchor="middle"
            fill="#64B5F6"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 900,
              fontSize: '76px'
            }}
          >
            +
          </text>
        </svg>
      </div>
      {children}
    </div>
  );
};

export default PlatformMotionShell;
