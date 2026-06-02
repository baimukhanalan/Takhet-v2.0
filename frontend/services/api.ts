const resolveApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (typeof window !== 'undefined') {
    const { origin, protocol, hostname, port } = window.location;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      if (port === '3000') {
        return origin;
      }

      return `${protocol}//${hostname}:3000`;
    }

    if (/takhet\.com$/i.test(hostname)) {
      return 'https://api.takhet.com';
    }

    if (port === '3000') {
      return origin;
    }

    return origin;
  }

  return 'http://localhost:3000';
};

export const API_URL = resolveApiUrl();

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    cache: options.cache || 'no-store',
    credentials: 'include',
    headers
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  const contentType = response.headers.get('content-type') || '';
  const raw = await response.text();

  if (!raw.trim()) {
    return null as T;
  }

  if (contentType.includes('application/json')) {
    return JSON.parse(raw) as T;
  }

  return raw as T;
}
