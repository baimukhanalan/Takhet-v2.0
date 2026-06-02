import React, { useEffect, useRef, useState } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface FadeInProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'direction'> {
  delay?: number;
  direction?: Direction;
  distance?: number;
}

const getInitialTransform = (direction: Direction, distance: number) => {
  if (direction === 'up') return `translate3d(0, ${distance}px, 0)`;
  if (direction === 'down') return `translate3d(0, -${distance}px, 0)`;
  if (direction === 'left') return `translate3d(${distance}px, 0, 0)`;
  if (direction === 'right') return `translate3d(-${distance}px, 0, 0)`;
  return 'translate3d(0, 0, 0)';
};

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  delay = 0,
  direction = 'up',
  distance = 20,
  className,
  style,
  ...props
}) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -50px 0px', threshold: 0.05 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate3d(0, 0, 0)' : getInitialTransform(direction as Direction, distance),
        transitionProperty: 'opacity, transform',
        transitionDuration: '800ms',
        transitionTimingFunction: 'cubic-bezier(0.21, 0.47, 0.32, 0.98)',
        transitionDelay: `${delay}s`,
        willChange: 'opacity, transform',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

interface FadeInStaggerProps extends React.HTMLAttributes<HTMLDivElement> {
  staggerDelay?: number;
}

export const FadeInStagger: React.FC<FadeInStaggerProps> = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};
