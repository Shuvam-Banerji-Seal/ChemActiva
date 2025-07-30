// src/js/tests/setup.js
// Test setup and global mocks

// Mock DOM APIs that might not be available in jsdom
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback, options = {}) {
    this.callback = callback;
    this.options = options;
    this.elements = new Set();
  }
  
  observe(element) {
    this.elements.add(element);
    // Immediately trigger callback for testing
    setTimeout(() => {
      this.callback([{
        target: element,
        isIntersecting: true,
        intersectionRatio: 1,
        boundingClientRect: element.getBoundingClientRect(),
        intersectionRect: element.getBoundingClientRect(),
        rootBounds: null,
        time: performance.now()
      }]);
    }, 0);
  }
  
  unobserve(element) {
    this.elements.delete(element);
  }
  
  disconnect() {
    this.elements.clear();
  }
};

global.PerformanceObserver = class PerformanceObserver {
  constructor(callback) {
    this.callback = callback;
    this.entryTypes = [];
  }
  
  observe(options) {
    this.entryTypes = options.entryTypes || [];
    // Mock some performance entries
    setTimeout(() => {
      this.callback({
        getEntries: () => [
          {
            name: 'test-resource',
            entryType: 'resource',
            startTime: 100,
            duration: 50,
            transferSize: 1024,
            encodedBodySize: 800,
            decodedBodySize: 1000
          }
        ]
      });
    }, 0);
  }
  
  disconnect() {
    this.entryTypes = [];
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 16);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Mock performance.now
if (!global.performance) {
  global.performance = {};
}

if (!global.performance.now) {
  global.performance.now = () => Date.now();
}

// Mock performance.timing
if (!global.performance.timing) {
  global.performance.timing = {
    navigationStart: Date.now() - 1000,
    loadEventEnd: Date.now()
  };
}

// Mock performance.memory
if (!global.performance.memory) {
  global.performance.memory = {
    usedJSHeapSize: 10000000,
    totalJSHeapSize: 50000000,
    jsHeapSizeLimit: 100000000
  };
}

// Mock navigator.connection
if (!global.navigator.connection) {
  global.navigator.connection = {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  };
}

// Mock navigator.onLine
if (typeof global.navigator.onLine === 'undefined') {
  global.navigator.onLine = true;
}

// Mock Image constructor for testing image loading
global.Image = class Image {
  constructor() {
    this.onload = null;
    this.onerror = null;
    this.src = '';
    this.alt = '';
    this.width = 0;
    this.height = 0;
    this.naturalWidth = 300;
    this.naturalHeight = 200;
    this.complete = false;
  }
  
  set src(value) {
    this._src = value;
    // Simulate async loading
    setTimeout(() => {
      if (value.includes('invalid') || value.includes('error')) {
        this.complete = false;
        if (this.onerror) this.onerror();
      } else {
        this.complete = true;
        if (this.onload) this.onload();
      }
    }, 10);
  }
  
  get src() {
    return this._src;
  }
};

// Mock fetch for network testing
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob())
  })
);

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
global.sessionStorage = localStorageMock;

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Mock CSS custom properties
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: (prop) => {
      const mockValues = {
        '--color-accent-primary': '#007bff',
        '--color-text-primary': '#212529',
        '--color-text-secondary': '#6c757d',
        '--font-family-base': 'system-ui'
      };
      return mockValues[prop] || '';
    }
  })
});

// Mock touch events
global.TouchEvent = class TouchEvent extends Event {
  constructor(type, options = {}) {
    super(type, options);
    this.touches = options.touches || [];
    this.changedTouches = options.changedTouches || [];
    this.targetTouches = options.targetTouches || [];
  }
};

// Mock custom events
global.CustomEvent = class CustomEvent extends Event {
  constructor(type, options = {}) {
    super(type, options);
    this.detail = options.detail;
  }
};

// Mock URL.createObjectURL for file downloads
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock Blob for file operations
global.Blob = class Blob {
  constructor(parts = [], options = {}) {
    this.parts = parts;
    this.type = options.type || '';
    this.size = parts.reduce((size, part) => size + (part.length || 0), 0);
  }
};

// Setup DOM testing utilities
beforeEach(() => {
  // Clear DOM
  document.body.innerHTML = '';
  
  // Reset mocks
  jest.clearAllMocks();
  
  // Reset console mocks but keep them quiet
  global.console.log.mockImplementation(() => {});
  global.console.warn.mockImplementation(() => {});
  global.console.error.mockImplementation(() => {});
  global.console.info.mockImplementation(() => {});
  global.console.debug.mockImplementation(() => {});
});

afterEach(() => {
  // Clean up any remaining timers
  jest.clearAllTimers();
  
  // Clean up DOM
  document.body.innerHTML = '';
  
  // Remove any event listeners
  const events = ['online', 'offline', 'error', 'unhandledrejection'];
  events.forEach(event => {
    window.removeAllListeners?.(event);
  });
});

// Global test utilities
global.testUtils = {
  // Create a mock product card element
  createMockProductCard: (options = {}) => {
    const card = document.createElement('div');
    card.className = 'product-card-enhanced';
    card.innerHTML = `
      <div class="product-image-carousel-enhanced">
        <img src="${options.imageSrc || 'test.jpg'}" alt="${options.imageAlt || 'Test Product'}">
      </div>
      <div class="product-info-enhanced">
        <h3>${options.title || 'Test Product'}</h3>
        ${options.benefits ? options.benefits.map(b => `<div class="key-benefit-item">${b}</div>`).join('') : ''}
      </div>
      ${options.accordion ? `
        <div class="product-specs-accordion">
          <div class="accordion-item">
            <button class="accordion-header" aria-expanded="false">
              <span>Specifications</span>
              <span class="accordion-icon">+</span>
            </button>
            <div class="accordion-content" aria-hidden="true">
              <p>Test specifications</p>
            </div>
          </div>
        </div>
      ` : ''}
      <button class="contact-button primary">${options.buttonText || 'Contact Us'}</button>
    `;
    return card;
  },
  
  // Wait for async operations
  waitFor: (condition, timeout = 1000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });
  },
  
  // Simulate user interactions
  simulateClick: (element) => {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    element.dispatchEvent(event);
  },
  
  simulateKeydown: (element, key) => {
    const event = new KeyboardEvent('keydown', {
      key: key,
      bubbles: true,
      cancelable: true
    });
    element.dispatchEvent(event);
  },
  
  simulateTouch: (element, startX, endX, startY = 100, endY = 100) => {
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: startX, clientY: startY }],
      bubbles: true
    });
    
    const touchEnd = new TouchEvent('touchend', {
      changedTouches: [{ clientX: endX, clientY: endY }],
      bubbles: true
    });
    
    element.dispatchEvent(touchStart);
    element.dispatchEvent(touchEnd);
  }
};

// Performance testing utilities
global.performanceUtils = {
  measureTime: (fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    return {
      result,
      duration: end - start
    };
  },
  
  measureAsyncTime: async (fn) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return {
      result,
      duration: end - start
    };
  }
};

// Error testing utilities
global.errorUtils = {
  expectNoErrors: () => {
    expect(global.console.error).not.toHaveBeenCalled();
    expect(global.console.warn).not.toHaveBeenCalled();
  },
  
  expectError: (message) => {
    expect(global.console.error).toHaveBeenCalledWith(
      expect.stringContaining(message)
    );
  },
  
  expectWarning: (message) => {
    expect(global.console.warn).toHaveBeenCalledWith(
      expect.stringContaining(message)
    );
  }
};