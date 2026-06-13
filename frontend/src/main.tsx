import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { installLightThemeLock } from './services/forceLightTheme';

installLightThemeLock();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js?v=20260415-offline-access', { updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch((error) => {
        console.error('Service worker registration failed:', error);
      });
  });
}

document.documentElement.classList.remove('dark');
document.documentElement.setAttribute('data-theme', 'light');
document.documentElement.style.colorScheme = 'only light';
document.body?.classList.remove('dark');
if (document.body) {
  document.body.style.colorScheme = 'only light';
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js?v=20260415-offline-access', { updateViaCache: 'none' })
      .then((registration) => registration.update())
      .catch((error) => {
        console.error('Service worker registration failed:', error);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
