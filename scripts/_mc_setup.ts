/**
 * Preload script: mocks browser globals so the SDK can initialize in Node.js
 * Run with: node --import ./scripts/_mc_setup.ts
 */

// Must use globalThis since 'window' doesn't exist yet
const win: Record<string, any> = {
  innerWidth: 375,
  innerHeight: 812,
  navigator: { userAgent: 'montecarlo-sim', language: 'en' },
  location: { href: 'http://localhost', hostname: 'localhost', search: '', hash: '', pathname: '/' },
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
  setTimeout: globalThis.setTimeout,
  setInterval: globalThis.setInterval,
  clearTimeout: globalThis.clearTimeout,
  clearInterval: globalThis.clearInterval,
  requestAnimationFrame: (cb: any) => globalThis.setTimeout(cb, 16),
  cancelAnimationFrame: globalThis.clearTimeout,
  performance: globalThis.performance,
  onerror: null,
  crypto: globalThis.crypto,
  matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
  getComputedStyle: () => ({ getPropertyValue: () => '' }),
  screen: { width: 375, height: 812 },
  devicePixelRatio: 2,
  history: { pushState: () => {}, replaceState: () => {} },
  self: undefined as any,
};
win.self = win;
win.window = win;
(globalThis as any).window = win;
(globalThis as any).self = win;

(globalThis as any).document = {
  createElement: (tag: string) => ({
    style: {},
    appendChild: () => {},
    setAttribute: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    tagName: tag.toUpperCase(),
    sheet: { insertRule: () => 0, cssRules: [] },
    getContext: () => null,
  }),
  createTextNode: () => ({}),
  head: { appendChild: () => {} },
  body: { appendChild: () => {}, style: {}, classList: { add: () => {}, remove: () => {} } },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  removeEventListener: () => {},
  visibilityState: 'visible',
  hidden: false,
  cookie: '',
  documentElement: { style: {} },
  createEvent: () => ({ initEvent: () => {} }),
};

try {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'montecarlo-sim', language: 'en', languages: ['en'], platform: 'Linux' },
    writable: true,
    configurable: true,
  });
} catch {
  // navigator may be read-only in this Node version — that's fine, the SDK just needs window.navigator
}

(globalThis as any).localStorage = {
  _data: {} as Record<string, string>,
  getItem(key: string) { return this._data[key] ?? null; },
  setItem(key: string, value: string) { this._data[key] = value; },
  removeItem(key: string) { delete this._data[key]; },
  clear() { this._data = {}; },
};

(globalThis as any).sessionStorage = {
  _data: {} as Record<string, string>,
  getItem(key: string) { return this._data[key] ?? null; },
  setItem(key: string, value: string) { this._data[key] = value; },
  removeItem(key: string) { delete this._data[key]; },
  clear() { this._data = {}; },
};

(globalThis as any).XMLHttpRequest = class {
  open() {}
  send() {}
  setRequestHeader() {}
  addEventListener() {}
};

(globalThis as any).Image = class {
  set src(_: string) {}
  addEventListener() {}
};

(globalThis as any).HTMLCanvasElement = class {};
(globalThis as any).HTMLElement = class {};

(globalThis as any).AudioContext = class {
  createGain() { return { connect() {}, gain: { value: 0 } }; }
  createOscillator() { return { connect() {}, start() {}, stop() {}, frequency: { value: 0 } }; }
  close() {}
};

(globalThis as any).MutationObserver = class {
  observe() {}
  disconnect() {}
};

(globalThis as any).ResizeObserver = class {
  observe() {}
  disconnect() {}
};

(globalThis as any).IntersectionObserver = class {
  observe() {}
  disconnect() {}
};

(globalThis as any).requestAnimationFrame = (cb: any) => globalThis.setTimeout(cb, 16);
(globalThis as any).cancelAnimationFrame = globalThis.clearTimeout;

console.log('[MC Setup] Browser globals mocked for Node.js');
