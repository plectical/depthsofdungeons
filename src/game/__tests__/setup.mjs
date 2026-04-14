// Preload script — sets up browser globals before any modules evaluate
const _win = {
  __GP__: undefined,
  innerWidth: 375,
  innerHeight: 812,
  addEventListener: () => {},
  removeEventListener: () => {},
  navigator: { userAgent: 'test' },
  location: { href: 'http://test', hostname: 'test', search: '', pathname: '/' },
  parent: null,
  postMessage: () => {},
  top: null,
  screen: { width: 375, height: 812 },
  devicePixelRatio: 1,
  setTimeout: globalThis.setTimeout,
  clearTimeout: globalThis.clearTimeout,
  setInterval: globalThis.setInterval,
  clearInterval: globalThis.clearInterval,
  requestAnimationFrame: (cb) => globalThis.setTimeout(cb, 16),
  performance: globalThis.performance ?? { now: () => Date.now() },
  crypto: globalThis.crypto,
};
globalThis.window = _win;
global.window = _win;

globalThis.localStorage = {
  _data: {},
  getItem(key) { return this._data[key] ?? null; },
  setItem(key, val) { this._data[key] = val; },
  removeItem(key) { delete this._data[key]; },
  clear() { this._data = {}; },
  get length() { return Object.keys(this._data).length; },
  key(i) { return Object.keys(this._data)[i] ?? null; },
};
global.localStorage = globalThis.localStorage;

globalThis.document = {
  createElement: () => ({
    getContext: () => null,
    style: {},
    addEventListener: () => {},
  }),
  addEventListener: () => {},
  removeEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  body: { appendChild: () => {}, removeChild: () => {} },
  documentElement: { style: {} },
  createEvent: () => ({ initEvent: () => {} }),
};
global.document = globalThis.document;
try { Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'test', language: 'en' }, writable: true, configurable: true }); } catch {}
globalThis.fetch = () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
globalThis.XMLHttpRequest = class { open() {} send() {} };
globalThis.Image = class { set src(_) {} };
globalThis.HTMLElement = class {};
globalThis.HTMLCanvasElement = class {};
globalThis.MutationObserver = class { observe() {} disconnect() {} };
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
globalThis.IntersectionObserver = class { observe() {} disconnect() {} };
