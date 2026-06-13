const THEME_STORAGE_KEYS = ['theme', 'takhet_theme', 'color-theme', 'vite-ui-theme'];

const setMetaContent = (name: string, value: string) => {
  if (typeof document === 'undefined') return;
  const meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (meta && meta.content !== value) meta.content = value;
};

export const enforceLightTheme = () => {
  if (typeof document === 'undefined') return;

  const html = document.documentElement;
  html.classList.remove('dark');
  html.setAttribute('data-theme', 'light');
  html.style.colorScheme = 'only light';

  if (document.body) {
    document.body.classList.remove('dark');
    document.body.setAttribute('data-theme', 'light');
    document.body.style.colorScheme = 'only light';
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
