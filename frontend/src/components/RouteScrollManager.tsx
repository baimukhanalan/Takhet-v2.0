import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const resetScrollPosition = () => {
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';

  window.scrollTo(0, 0);
  if (document.scrollingElement) {
    document.scrollingElement.scrollTop = 0;
    document.scrollingElement.scrollLeft = 0;
  }

  document.querySelectorAll<HTMLElement>('main, [data-route-scroll-container]').forEach((container) => {
    container.scrollTop = 0;
    container.scrollLeft = 0;
  });

  root.style.scrollBehavior = previousScrollBehavior;
};

const RouteScrollManager = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType === 'POP') return;

    resetScrollPosition();
    const frame = requestAnimationFrame(resetScrollPosition);
    return () => cancelAnimationFrame(frame);
  }, [location.key, navigationType]);

  return null;
};

export default RouteScrollManager;
