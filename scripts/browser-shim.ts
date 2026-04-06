/**
 * Browser environment shim for running game code in Node.js
 * Must be loaded BEFORE any game imports via --require or --import
 */

// Minimal window stub
const win: any = {
  innerWidth: 375,
  innerHeight: 667,
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { href: 'http://localhost', origin: 'http://localhost', pathname: '/' },
  navigator: { userAgent: 'node-simulation' },
  setTimeout: globalThis.setTimeout,
  setInterval: globalThis.setInterval,
  clearTimeout: globalThis.clearTimeout,
  clearInterval: globalThis.clearInterval,
  requestAnimationFrame: (cb: Function) => setTimeout(cb, 16),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
  getComputedStyle: () => ({}),
  matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
  performance: globalThis.performance,
  crypto: globalThis.crypto,
  self: undefined as any,
  top: undefined as any,
  parent: undefined as any,
  document: undefined as any,
  screen: { width: 375, height: 667 },
  devicePixelRatio: 1,
  dispatchEvent: () => true,
};
win.self = win;
win.top = win;
win.parent = win;

// Minimal document stub
const doc: any = {
  createElement: (tag: string) => {
    const el: any = {
      style: {}, setAttribute: () => {}, getAttribute: () => null,
      appendChild: () => {}, removeChild: () => {}, addEventListener: () => {},
      removeEventListener: () => {}, classList: { add: () => {}, remove: () => {}, contains: () => false },
      tagName: tag.toUpperCase(), innerHTML: '', textContent: '', children: [], childNodes: [],
      parentNode: null, getBoundingClientRect: () => ({ top: 0, left: 0, bottom: 0, right: 0, width: 0, height: 0 }),
      getContext: () => ({
        fillRect: () => {}, clearRect: () => {}, fillText: () => {},
        measureText: () => ({ width: 0 }), beginPath: () => {}, arc: () => {},
        fill: () => {}, stroke: () => {}, createRadialGradient: () => ({
          addColorStop: () => {},
        }),
        canvas: { width: 375, height: 667 },
      }),
    };
    return el;
  },
  createElementNS: (ns: string, tag: string) => doc.createElement(tag),
  addEventListener: () => {},
  removeEventListener: () => {},
  body: { appendChild: () => {}, removeChild: () => {}, style: {} },
  head: { appendChild: () => {}, removeChild: () => {} },
  documentElement: { style: {} },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  createTextNode: () => ({ textContent: '' }),
  readyState: 'complete',
  hidden: false,
  visibilityState: 'visible',
};
win.document = doc;

// Minimal localStorage stub
const storage: any = {
  _data: {} as Record<string, string>,
  getItem(key: string) { return this._data[key] ?? null; },
  setItem(key: string, value: string) { this._data[key] = value; },
  removeItem(key: string) { delete this._data[key]; },
  clear() { this._data = {}; },
  get length() { return Object.keys(this._data).length; },
  key(i: number) { return Object.keys(this._data)[i] ?? null; },
};

// Apply to globalThis — use defineProperty for read-only globals
const g = globalThis as any;
g.window = win;
g.self = win;
g.document = doc;
g.localStorage = storage;
g.sessionStorage = storage;
// navigator is read-only in Node, override with defineProperty
try { g.navigator = win.navigator; } catch { Object.defineProperty(globalThis, 'navigator', { value: win.navigator, writable: true, configurable: true }); }
g.HTMLElement = class {};
g.HTMLCanvasElement = class {};
g.requestAnimationFrame = win.requestAnimationFrame;
g.cancelAnimationFrame = win.cancelAnimationFrame;
g.getComputedStyle = win.getComputedStyle;
g.matchMedia = win.matchMedia;
try { g.screen = win.screen; } catch { Object.defineProperty(globalThis, 'screen', { value: win.screen, writable: true, configurable: true }); }
g.devicePixelRatio = 1;
g.Image = class { src = ''; onload = () => {}; onerror = () => {}; };
g.fetch = async () => ({ ok: false, json: async () => ({}), text: async () => '' });
g.XMLHttpRequest = class {
  open() {} send() {} setRequestHeader() {}
  readyState = 4; status = 200; responseText = '{}';
};
