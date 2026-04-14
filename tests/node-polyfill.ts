/**
 * Browser polyfills for running game engine code in Node.
 * Must be loaded BEFORE any game imports (via --import or --require).
 */
const g = global as any;

g.window = {
  innerWidth: 800, innerHeight: 600,
  addEventListener: () => {}, removeEventListener: () => {},
  location: { href: 'http://localhost/', search: '', hostname: 'localhost', protocol: 'http:' },
  navigator: { userAgent: 'node-test', language: 'en' },
  setTimeout, clearTimeout, setInterval, clearInterval,
  requestAnimationFrame: (cb: any) => setTimeout(cb, 16),
  cancelAnimationFrame: clearTimeout,
  matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
  getComputedStyle: () => ({}),
  performance: { now: () => Date.now() },
  devicePixelRatio: 1,
  screen: { width: 800, height: 600 },
  self: undefined as any,
  dispatchEvent: () => true,
  postMessage: () => {},
};
g.window.self = g.window;
g.window.top = g.window;

g.self = g.window;

g.document = {
  addEventListener: () => {}, removeEventListener: () => {},
  createElement: (tag: string) => ({
    style: {}, tagName: tag, appendChild: () => {}, setAttribute: () => {},
    getContext: () => null, toDataURL: () => '', addEventListener: () => {},
  }),
  getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  body: { appendChild: () => {}, removeChild: () => {}, style: {} },
  head: { appendChild: () => {} },
  hidden: false, visibilityState: 'visible',
  createEvent: () => ({ initEvent: () => {} }),
  createTextNode: () => ({}),
};

g.localStorage = {
  _data: {} as Record<string, string>,
  getItem(k: string) { return this._data[k] ?? null; },
  setItem(k: string, v: string) { this._data[k] = v; },
  removeItem(k: string) { delete this._data[k]; },
  clear() { this._data = {}; },
  get length() { return Object.keys(this._data).length; },
  key(i: number) { return Object.keys(this._data)[i] ?? null; },
};

try { g.navigator = { userAgent: 'node-test', language: 'en', languages: ['en'] }; } catch { /* readonly in newer Node */ }
g.HTMLElement = class {};
g.HTMLCanvasElement = class {};
g.Image = class { src = ''; onload: any = null; onerror: any = null; width = 0; height = 0; };
g.Blob = class { constructor() {} };
g.URL = g.URL ?? URL;
g.fetch = () => Promise.resolve({ ok: true, json: () => Promise.resolve({}), blob: () => Promise.resolve(new g.Blob()), text: () => Promise.resolve('') });
g.XMLHttpRequest = class { open() {} send() {} setRequestHeader() {} };
g.Worker = class { postMessage() {} terminate() {} addEventListener() {} };
g.MessageChannel = class { port1 = { onmessage: null, postMessage() {} }; port2 = { onmessage: null, postMessage() {} }; };
g.AudioContext = class { createGain() { return { connect() {}, gain: { value: 1 } }; } get destination() { return {}; } };
g.webkitAudioContext = g.AudioContext;
