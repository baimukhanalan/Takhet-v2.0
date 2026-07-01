import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const app = read('src/App.tsx');
const manager = read('src/components/RouteScrollManager.tsx');

if (!app.includes("import RouteScrollManager from './components/RouteScrollManager'")) {
  throw new Error('The application must synchronously load the global route scroll manager');
}

if (!app.includes('<RouteScrollManager />') || app.indexOf('<RouteScrollManager />') > app.indexOf('<AppRoutes />')) {
  throw new Error('The route scroll manager must be mounted inside BrowserRouter before application routes');
}

if (!app.includes('data-route-scroll-container')) {
  throw new Error('The authenticated portal scroll container must be explicitly resettable');
}

if (!manager.includes('useNavigationType()') || !manager.includes("if (navigationType === 'POP') return")) {
  throw new Error('Browser back and forward navigation must preserve native scroll restoration');
}

if (!manager.includes('window.scrollTo(0, 0)') || !manager.includes("querySelectorAll<HTMLElement>('main, [data-route-scroll-container]')")) {
  throw new Error('New routes must reset both window and nested portal scroll positions');
}

if (!manager.includes('[location.key, navigationType]')) {
  throw new Error('Every pushed route or query landing must trigger scroll reset');
}

console.log('Route scroll restoration contract passed');
