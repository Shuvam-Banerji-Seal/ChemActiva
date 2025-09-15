// src/js/ServiceWorkerManager.js

export default class ServiceWorkerManager {
    constructor() {
        this.isSupported = 'serviceWorker' in navigator;
        this.registration = null;
        this.isRegistered = false;
        this.cacheVersion = 'chemactiva-v1.2';
        this.updateAvailable = false;
        
        this.cacheStrategies = {
            'stale-while-revalidate': this.staleWhileRevalidate.bind(this),
            'cache-first': this.cacheFirst.bind(this),
            'network-first': this.networkFirst.bind(this),
            'network-only': this.networkOnly.bind(this),
            'cache-only': this.cacheOnly.bind(this)
        };
        
        this.config = {
            staticAssets: [
                '/css/styles.css',
                '/css/base.css',
                '/css/components.css',
                '/css/products.css',
                '/js/main.js',
                '/assets/images/logo.png',
                '/assets/images/logo-small_size.png'
            ],
            dynamicAssets: [
                '/js/ProductManager.js',
                '/js/ProductImageGallery.js',
                '/js/PerformanceManager.js'
            ],
            cacheRules: [
                {
                    pattern: /\.(?:png|jpg|jpeg|webp|svg|gif)$/,
                    strategy: 'cache-first',
                    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                    maxEntries: 100
                },
                {
                    pattern: /\.(?:js|css)$/,
                    strategy: 'stale-while-revalidate',
                    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                    maxEntries: 50
                },
                {
                    pattern: /\.(?:html)$/,
                    strategy: 'network-first',
                    maxAge: 24 * 60 * 60 * 1000, // 1 day
                    maxEntries: 20
                },
                {
                    pattern: /\/api\//,
                    strategy: 'network-first',
                    maxAge: 5 * 60 * 1000, // 5 minutes
                    maxEntries: 30
                }
            ],
            offlinePages: [
                '/offline.html'
            ]
        };
    }

    async init() {
        if (!this.isSupported) {
            console.warn('Service Worker not supported');
            return false;
        }

        try {
            await this.registerServiceWorker();
            this.setupUpdateHandling();
            this.setupMessageHandling();
            
            console.log('ServiceWorkerManager initialized successfully');
            return true;
            
        } catch (error) {
            console.error('ServiceWorkerManager initialization failed:', error);
            return false;
        }
    }

    async registerServiceWorker() {
        const swContent = this.generateServiceWorkerContent();
        const swBlob = new Blob([swContent], { type: 'application/javascript' });
        const swUrl = URL.createObjectURL(swBlob);

        try {
            this.registration = await navigator.serviceWorker.register(swUrl, {
                scope: '/'
            });
            
            this.isRegistered = true;
            console.log('Service Worker registered:', this.registration);
            
            // Clean up blob URL after registration
            URL.revokeObjectURL(swUrl);
            
            return this.registration;
            
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            throw error;
        }
    }

    generateServiceWorkerContent() {
        const config = JSON.stringify(this.config);
        
        return `
            const CACHE_VERSION = '${this.cacheVersion}';
            const CONFIG = ${config};
            
            // Cache names
            const STATIC_CACHE = CACHE_VERSION + '-static';
            const DYNAMIC_CACHE = CACHE_VERSION + '-dynamic';
            const IMAGE_CACHE = CACHE_VERSION + '-images';
            
            // Install event - cache static assets
            self.addEventListener('install', (event) => {
                console.log('Service Worker installing...');
                
                event.waitUntil(
                    Promise.all([
                        caches.open(STATIC_CACHE).then(cache => {
                            return cache.addAll(CONFIG.staticAssets);
                        }),
                        caches.open(DYNAMIC_CACHE).then(cache => {
                            return cache.addAll(CONFIG.dynamicAssets);
                        })
                    ]).then(() => {
                        console.log('Service Worker installed successfully');
                        return self.skipWaiting();
                    })
                );
            });
            
            // Activate event - clean up old caches
            self.addEventListener('activate', (event) => {
                console.log('Service Worker activating...');
                
                event.waitUntil(
                    caches.keys().then(cacheNames => {
                        return Promise.all(
                            cacheNames.map(cacheName => {
                                if (cacheName.indexOf(CACHE_VERSION) !== 0) {
                                    console.log('Deleting old cache:', cacheName);
                                    return caches.delete(cacheName);
                                }
                            })
                        );
                    }).then(() => {
                        console.log('Service Worker activated');
                        return self.clients.claim();
                    })
                );
            });
            
            // Fetch event - handle requests with appropriate strategy
            self.addEventListener('fetch', (event) => {
                const request = event.request;
                const url = new URL(request.url);
                
                // Skip non-GET requests
                if (request.method !== 'GET') return;
                
                // Skip chrome-extension and other non-http requests
                if (!url.protocol.startsWith('http')) return;
                
                // Find matching cache rule
                const rule = CONFIG.cacheRules.find(rule => rule.pattern.test(url.pathname));
                const strategy = rule ? rule.strategy : 'network-first';
                
                event.respondWith(
                    handleRequest(request, strategy, rule)
                );
            });
            
            // Handle different caching strategies
            async function handleRequest(request, strategy, rule) {
                const cacheName = getCacheName(request);
                
                switch (strategy) {
                    case 'cache-first':
                        return cacheFirst(request, cacheName, rule);
                    case 'network-first':
                        return networkFirst(request, cacheName, rule);
                    case 'stale-while-revalidate':
                        return staleWhileRevalidate(request, cacheName, rule);
                    case 'network-only':
                        return fetch(request);
                    case 'cache-only':
                        return caches.match(request);
                    default:
                        return networkFirst(request, cacheName, rule);
                }
            }
            
            function getCacheName(request) {
                const url = new URL(request.url);
                
                if (url.pathname.match(/\\.(png|jpg|jpeg|webp|svg|gif)$/)) {
                    return IMAGE_CACHE;
                } else if (url.pathname.match(/\\.(js|css)$/)) {
                    return DYNAMIC_CACHE;
                } else {
                    return STATIC_CACHE;
                }
            }
            
            async function cacheFirst(request, cacheName, rule) {
                const cachedResponse = await caches.match(request);
                
                if (cachedResponse) {
                    // Check if cache is still valid
                    if (rule && rule.maxAge) {
                        const cacheDate = new Date(cachedResponse.headers.get('date') || cachedResponse.headers.get('last-modified'));
                        const now = new Date();
                        const age = now.getTime() - cacheDate.getTime();
                        
                        if (age > rule.maxAge) {
                            // Cache expired, fetch new version
                            return fetchAndCache(request, cacheName, rule);
                        }
                    }
                    
                    return cachedResponse;
                }
                
                return fetchAndCache(request, cacheName, rule);
            }
            
            async function networkFirst(request, cacheName, rule) {
                try {
                    const response = await fetch(request);
                    
                    if (response.status === 200) {
                        await cacheResponse(request, response.clone(), cacheName, rule);
                    }
                    
                    return response;
                } catch (error) {
                    console.log('Network failed, trying cache:', error);
                    const cachedResponse = await caches.match(request);
                    
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    
                    // Return offline page for HTML requests
                    if (request.headers.get('accept').includes('text/html')) {
                        return caches.match('/offline.html') || new Response('Offline', { status: 503 });
                    }
                    
                    throw error;
                }
            }
            
            async function staleWhileRevalidate(request, cacheName, rule) {
                const cachedResponse = await caches.match(request);
                
                // Always try to fetch in background
                const fetchPromise = fetchAndCache(request, cacheName, rule);
                
                // Return cached version immediately if available
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // If no cache, wait for network
                return fetchPromise;
            }
            
            async function fetchAndCache(request, cacheName, rule) {
                try {
                    const response = await fetch(request);
                    
                    if (response.status === 200) {
                        await cacheResponse(request, response.clone(), cacheName, rule);
                    }
                    
                    return response;
                } catch (error) {
                    console.error('Fetch failed:', error);
                    throw error;
                }
            }
            
            async function cacheResponse(request, response, cacheName, rule) {
                const cache = await caches.open(cacheName);
                
                // Check cache size limits
                if (rule && rule.maxEntries) {
                    const keys = await cache.keys();
                    if (keys.length >= rule.maxEntries) {
                        // Remove oldest entries
                        const entriesToRemove = keys.slice(0, keys.length - rule.maxEntries + 1);
                        await Promise.all(entriesToRemove.map(key => cache.delete(key)));
                    }
                }
                
                await cache.put(request, response);
            }
            
            // Handle messages from main thread
            self.addEventListener('message', (event) => {
                const { type, payload } = event.data;
                
                switch (type) {
                    case 'SKIP_WAITING':
                        self.skipWaiting();
                        break;
                    case 'GET_CACHE_SIZE':
                        getCacheSize().then(size => {
                            event.ports[0].postMessage({ type: 'CACHE_SIZE', payload: size });
                        });
                        break;
                    case 'CLEAR_CACHE':
                        clearCache(payload.cacheName).then(() => {
                            event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
                        });
                        break;
                    case 'PRELOAD_ASSETS':
                        preloadAssets(payload.assets).then(() => {
                            event.ports[0].postMessage({ type: 'ASSETS_PRELOADED' });
                        });
                        break;
                }
            });
            
            async function getCacheSize() {
                const cacheNames = await caches.keys();
                let totalSize = 0;
                
                for (const cacheName of cacheNames) {
                    const cache = await caches.open(cacheName);
                    const keys = await cache.keys();
                    totalSize += keys.length;
                }
                
                return totalSize;
            }
            
            async function clearCache(cacheName) {
                if (cacheName) {
                    return caches.delete(cacheName);
                } else {
                    const cacheNames = await caches.keys();
                    return Promise.all(cacheNames.map(name => caches.delete(name)));
                }
            }
            
            async function preloadAssets(assets) {
                const cache = await caches.open(DYNAMIC_CACHE);
                return cache.addAll(assets);
            }
        `;
    }

    setupUpdateHandling() {
        if (!this.registration) return;

        this.registration.addEventListener('updatefound', () => {
            const newWorker = this.registration.installing;
            
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    this.updateAvailable = true;
                    this.notifyUpdateAvailable();
                }
            });
        });
    }

    setupMessageHandling() {
        navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, payload } = event.data;
            
            switch (type) {
                case 'CACHE_SIZE':
                    console.log('Cache size:', payload);
                    break;
                case 'CACHE_CLEARED':
                    console.log('Cache cleared successfully');
                    break;
                case 'ASSETS_PRELOADED':
                    console.log('Assets preloaded successfully');
                    break;
            }
        });
    }

    notifyUpdateAvailable() {
        console.log('Service Worker update available');
        
        // Emit custom event for UI to handle
        window.dispatchEvent(new CustomEvent('serviceWorkerUpdateAvailable', {
            detail: {
                registration: this.registration,
                skipWaiting: () => this.skipWaiting()
            }
        }));
        
        // Show notification (could be customized)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Update Available', {
                body: 'A new version of the site is available. Refresh to update.',
                icon: '/assets/images/logo-small_size.png'
            });
        }
    }

    async skipWaiting() {
        if (!this.registration || !this.registration.waiting) return;
        
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Reload page after service worker takes control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    }

    async getCacheSize() {
        if (!this.registration || !this.registration.active) return 0;
        
        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                resolve(event.data.payload);
            };
            
            this.registration.active.postMessage(
                { type: 'GET_CACHE_SIZE' },
                [messageChannel.port2]
            );
        });
    }

    async clearCache(cacheName = null) {
        if (!this.registration || !this.registration.active) return;
        
        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = () => {
                resolve();
            };
            
            this.registration.active.postMessage(
                { type: 'CLEAR_CACHE', payload: { cacheName } },
                [messageChannel.port2]
            );
        });
    }

    async preloadAssets(assets) {
        if (!this.registration || !this.registration.active) return;
        
        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = () => {
                resolve();
            };
            
            this.registration.active.postMessage(
                { type: 'PRELOAD_ASSETS', payload: { assets } },
                [messageChannel.port2]
            );
        });
    }

    // Cache management methods
    async staleWhileRevalidate(request) {
        const cache = await caches.open(this.cacheVersion);
        const cachedResponse = await cache.match(request);
        
        const fetchPromise = fetch(request).then(response => {
            if (response.status === 200) {
                cache.put(request, response.clone());
            }
            return response;
        });
        
        return cachedResponse || fetchPromise;
    }

    async cacheFirst(request) {
        const cache = await caches.open(this.cacheVersion);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const response = await fetch(request);
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        
        return response;
    }

    async networkFirst(request) {
        try {
            const response = await fetch(request);
            
            if (response.status === 200) {
                const cache = await caches.open(this.cacheVersion);
                cache.put(request, response.clone());
            }
            
            return response;
        } catch (error) {
            const cache = await caches.open(this.cacheVersion);
            const cachedResponse = await cache.match(request);
            
            if (cachedResponse) {
                return cachedResponse;
            }
            
            throw error;
        }
    }

    async networkOnly(request) {
        return fetch(request);
    }

    async cacheOnly(request) {
        const cache = await caches.open(this.cacheVersion);
        return cache.match(request);
    }

    // Utility methods
    isOnline() {
        return navigator.onLine;
    }

    getRegistration() {
        return this.registration;
    }

    isUpdateAvailable() {
        return this.updateAvailable;
    }

    // Static method to check support
    static isSupported() {
        return 'serviceWorker' in navigator && 'caches' in window;
    }
}