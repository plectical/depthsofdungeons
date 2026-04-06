// Browser mocks for Node.js environment
// Load this before other imports with: --import ./scripts/browser-mocks.mjs

global.window = {
  innerWidth: 800,
  innerHeight: 600,
  devicePixelRatio: 1,
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
  localStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
  location: { href: 'http://localhost', origin: 'http://localhost', pathname: '/' },
  navigator: { 
    userAgent: 'Node.js',
    hardwareConcurrency: 4,
    deviceMemory: 8,
  },
  screen: { width: 800, height: 600 },
  document: { hidden: false },
  performance: {
    now: () => Date.now(),
    memory: { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 },
  },
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
};

global.document = {
  addEventListener: () => {},
  removeEventListener: () => {},
  hidden: false,
  createElement: () => ({ style: {}, appendChild: () => {}, click: () => {} }),
  body: { appendChild: () => {}, removeChild: () => {} },
  execCommand: () => {},
  visibilityState: 'visible',
};

// Navigator is read-only, so we need to define it on window instead
// global.navigator is already defined by Node.js

// Screen might be read-only too, wrap in try/catch
try {
  global.screen = { width: 800, height: 600 };
} catch (e) {
  // Already defined
}

global.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

global.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

if (!global.performance) {
  global.performance = {
    now: () => Date.now(),
    memory: { usedJSHeapSize: 0, totalJSHeapSize: 0, jsHeapSizeLimit: 0 },
  };
}

global.requestAnimationFrame = (cb) => setTimeout(cb, 16);
global.cancelAnimationFrame = (id) => clearTimeout(id);

global.PerformanceObserver = class { 
  observe() {} 
  disconnect() {} 
};

global.fetch = () => Promise.resolve({
  ok: true,
  json: () => Promise.resolve({}),
  text: () => Promise.resolve(''),
});

global.WebSocket = class {
  constructor() {}
  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
};

global.Image = class {
  constructor() {
    setTimeout(() => this.onload?.(), 0);
  }
  onload = null;
  onerror = null;
};

global.URL = {
  ...URL,
  createObjectURL: () => 'blob:mock',
  revokeObjectURL: () => {},
};

global.Blob = class {
  constructor() {}
};

global.Worker = class {
  constructor() {}
  postMessage() {}
  terminate() {}
  onmessage = null;
};

console.log('[browser-mocks] Browser globals mocked for Node.js');
