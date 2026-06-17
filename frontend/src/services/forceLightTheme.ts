const THEME_STORAGE_KEYS = ['theme', 'takhet_theme', 'color-theme', 'vite-ui-theme'];
let isApplyingLightTheme = false;

const setMetaContent = (name: string, value: string) => {
  if (typeof document === 'undefined') return;
  const meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (meta && meta.content !== value) meta.content = value;
};

const setColorScheme = (element: HTMLElement) => {
  if (element.style.colorScheme !== 'only light') {
    element.style.colorScheme = 'only light';
  }
};

export const enforceLightTheme = () => {
  if (typeof document === 'undefined') return;
  if (isApplyingLightTheme) return;

  isApplyingLightTheme = true;
  try {
    const html = document.documentElement;
    if (html.classList.contains('dark')) html.classList.remove('dark');
    if (html.getAttribute('data-theme') !== 'light') html.setAttribute('data-theme', 'light');
    setColorScheme(html);

    if (document.body) {
      if (document.body.classList.contains('dark')) document.body.classList.remove('dark');
      if (document.body.getAttribute('data-theme') !== 'light') document.body.setAttribute('data-theme', 'light');
      setColorScheme(document.body);
    }

    setMetaContent('color-scheme', 'light');
    setMetaContent('supported-color-schemes', 'light');

    try {
      THEME_STORAGE_KEYS.forEach((key) => {
        if (localStorage.getItem(key) !== 'light') localStorage.setItem(key, 'light');
      });
    } catch {
      // Storage can be unavailable in private windows; DOM-level lock is still enough.
    }
  } finally {
    isApplyingLightTheme = false;
  }
};

export const installLightThemeLock = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => undefined;

  enforceLightTheme();

  const observer = new MutationObserver(() => enforceLightTheme());
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
  if (document.body) observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });

  const onStorage = (event: StorageEvent) => {
    if (!event.key || THEME_STORAGE_KEYS.includes(event.key)) enforceLightTheme();
  };
  window.addEventListener('storage', onStorage);

  const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const onSchemeChange = () => enforceLightTheme();
  try {
    darkScheme.addEventListener('change', onSchemeChange);
  } catch {
    darkScheme.addListener(onSchemeChange);
  }

  return () => {
    observer.disconnect();
    window.removeEventListener('storage', onStorage);
    try {
      darkScheme.removeEventListener('change', onSchemeChange);
    } catch {
      darkScheme.removeListener(onSchemeChange);
    }
  };
};
