// src/js/AssetOptimizer.js

export default class AssetOptimizer {
    constructor() {
        this.loadedModules = new Set();
        this.loadingPromises = new Map();
        this.bundleCache = new Map();
        this.criticalAssets = new Set();
        this.deferredAssets = new Set();

        this.config = {
            // Define module dependencies and loading strategies
            modules: {
                'ProductManager': {
                    path: '/js/ProductManager.js',
                    dependencies: ['UIAnimations'],
                    critical: false,
                    preload: true,
                    condition: () => document.querySelector('.product-card-enhanced')
                },
                'ProductImageGallery': {
                    path: '/js/ProductImageGallery.js',
                    dependencies: [],
                    critical: false,
                    preload: false,
                    condition: () => document.querySelector('.product-image-carousel-enhanced')
                },
                'PerformanceManager': {
                    path: '/js/PerformanceManager.js',
                    dependencies: [],
                    critical: true,
                    preload: true,
                    condition: () => true
                },
                'ServiceWorkerManager': {
                    path: '/js/ServiceWorkerManager.js',
                    dependencies: [],
                    critical: false,
                    preload: true,
                    condition: () => 'serviceWorker' in navigator
                }
            },

            // Bundle configurations for different page types
            bundles: {
                'homepage': [
                    'HeroLoader',
                    'SceneManager',
                    'TeamManager',
                    'JourneyManager',
                    'ScrollAnimations'
                ],
                'products': [
                    'ProductManager',
                    'ProductImageGallery',
                    'PerformanceManager'
                ],
                'blog': [
                    'ArticleManager',
                    'SingleArticleViewer'
                ],
                'common': [
                    'UIAnimations',
                    'ServiceWorkerManager',
                    'PerformanceManager'
                ]
            },

            // Asset optimization rules
            optimization: {
                enableBundling: true,
                enableMinification: false, // Would be handled by build process
                enableCompression: true,
                enableLazyLoading: true,
                preloadThreshold: 2000, // ms
                bundleThreshold: 3, // minimum modules to create bundle
                maxBundleSize: 100000 // bytes
            }
        };

        this.performanceMetrics = {
            modulesLoaded: 0,
            totalLoadTime: 0,
            bundlesCreated: 0,
            cacheHits: 0,
            networkRequests: 0
        };
    }

    async init() {
        console.log('AssetOptimizer initializing...');

        try {
            this.detectPageType();
            this.identifyCriticalAssets();
            await this.preloadCriticalAssets();
            this.setupConditionalLoading();
            this.optimizeBundles();

            console.log('AssetOptimizer initialized successfully');
            return true;

        } catch (error) {
            console.error('AssetOptimizer initialization failed:', error);
            return false;
        }
    }

    detectPageType() {
        const path = window.location.pathname;
        const body = document.body;

        let pageType = 'common';

        if (body.classList.contains('homepage') || path === '/' || path === '/index.html') {
            pageType = 'homepage';
        } else if (path.includes('products') || body.classList.contains('products-page')) {
            pageType = 'products';
        } else if (path.includes('blog') || body.classList.contains('blog-page')) {
            pageType = 'blog';
        }

        this.currentPageType = pageType;
        console.log(`Detected page type: ${pageType}`);

        // Emit event for other components
        window.dispatchEvent(new CustomEvent('pageTypeDetected', {
            detail: { pageType }
        }));
    }

    identifyCriticalAssets() {
        // Identify critical assets based on page type and configuration
        const pageBundle = this.config.bundles[this.currentPageType] || [];
        const commonBundle = this.config.bundles.common || [];

        [...pageBundle, ...commonBundle].forEach(moduleName => {
            const moduleConfig = this.config.modules[moduleName];
            if (moduleConfig && moduleConfig.critical) {
                this.criticalAssets.add(moduleName);
            }
        });

        console.log('Critical assets identified:', Array.from(this.criticalAssets));
    }

    async preloadCriticalAssets() {
        const preloadPromises = [];

        for (const moduleName of this.criticalAssets) {
            const moduleConfig = this.config.modules[moduleName];
            if (moduleConfig && moduleConfig.preload) {
                preloadPromises.push(this.preloadModule(moduleName));
            }
        }

        await Promise.all(preloadPromises);
        console.log('Critical assets preloaded');
    }

    async preloadModule(moduleName) {
        const moduleConfig = this.config.modules[moduleName];
        if (!moduleConfig) return;

        // Create preload link
        const link = document.createElement('link');
        link.rel = 'modulepreload';
        link.href = moduleConfig.path;

        // Add to document head
        document.head.appendChild(link);

        console.log(`Preloading module: ${moduleName}`);
    }

    setupConditionalLoading() {
        // Set up intersection observers and event listeners for conditional loading
        this.setupIntersectionObserver();
        this.setupEventBasedLoading();
        this.setupRouteBasedLoading();
    }

    setupIntersectionObserver() {
        // Load modules when their trigger elements come into view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.checkAndLoadModules();
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '100px 0px',
            threshold: 0.1
        });

        // Observe elements that might trigger module loading
        const triggers = document.querySelectorAll(
            '.product-card-enhanced, .product-image-carousel-enhanced, .blog-article'
        );

        triggers.forEach(trigger => observer.observe(trigger));
    }

    setupEventBasedLoading() {
        // Load modules based on user interactions
        document.addEventListener('click', (event) => {
            if (event.target.matches('.product-cta-enhanced, .product-card-enhanced')) {
                this.loadModule('ProductManager');
            }

            if (event.target.matches('.product-image-carousel-enhanced img')) {
                this.loadModule('ProductImageGallery');
            }
        });

        // Load modules on hover for better perceived performance
        document.addEventListener('mouseenter', (event) => {
            if (event.target && typeof event.target.matches === 'function' && event.target.matches('.product-card-enhanced')) {
                this.loadModule('ProductManager');
            }
        }, true);
    }

    setupRouteBasedLoading() {
        // Load modules when navigating to different sections
        window.addEventListener('popstate', () => {
            this.detectPageType();
            this.checkAndLoadModules();
        });

        // Monitor hash changes for single-page navigation
        window.addEventListener('hashchange', () => {
            this.checkAndLoadModules();
        });
    }

    async checkAndLoadModules() {
        const loadPromises = [];

        for (const [moduleName, moduleConfig] of Object.entries(this.config.modules)) {
            if (moduleConfig.condition && moduleConfig.condition()) {
                if (!this.loadedModules.has(moduleName)) {
                    loadPromises.push(this.loadModule(moduleName));
                }
            }
        }

        await Promise.all(loadPromises);
    }

    async loadModule(moduleName) {
        // Check if module is already loaded or loading
        if (this.loadedModules.has(moduleName)) {
            return this.bundleCache.get(moduleName);
        }

        if (this.loadingPromises.has(moduleName)) {
            return this.loadingPromises.get(moduleName);
        }

        const moduleConfig = this.config.modules[moduleName];
        if (!moduleConfig) {
            console.warn(`Module configuration not found: ${moduleName}`);
            return null;
        }

        console.log(`Loading module: ${moduleName}`);
        const startTime = performance.now();

        // Create loading promise
        const loadingPromise = this.loadModuleWithDependencies(moduleName, moduleConfig);
        this.loadingPromises.set(moduleName, loadingPromise);

        try {
            const module = await loadingPromise;

            // Track performance
            const loadTime = performance.now() - startTime;
            this.performanceMetrics.modulesLoaded++;
            this.performanceMetrics.totalLoadTime += loadTime;
            this.performanceMetrics.networkRequests++;

            // Cache the module
            this.bundleCache.set(moduleName, module);
            this.loadedModules.add(moduleName);

            console.log(`Module loaded: ${moduleName} in ${loadTime.toFixed(2)}ms`);

            // Emit event
            window.dispatchEvent(new CustomEvent('moduleLoaded', {
                detail: { moduleName, module, loadTime }
            }));

            return module;

        } catch (error) {
            console.error(`Failed to load module ${moduleName}:`, error);
            throw error;
        } finally {
            this.loadingPromises.delete(moduleName);
        }
    }

    async loadModuleWithDependencies(moduleName, moduleConfig) {
        // Load dependencies first
        if (moduleConfig.dependencies && moduleConfig.dependencies.length > 0) {
            const dependencyPromises = moduleConfig.dependencies.map(dep =>
                this.loadModule(dep)
            );
            await Promise.all(dependencyPromises);
        }

        // Load the actual module
        try {
            const module = await import(/* @vite-ignore */ moduleConfig.path);
            return module.default || module;
        } catch (error) {
            // Fallback to script tag loading for compatibility
            return this.loadModuleViaScript(moduleConfig.path);
        }
    }

    async loadModuleViaScript(path) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = path;

            script.onload = () => {
                resolve(window[path.split('/').pop().replace('.js', '')]);
            };

            script.onerror = () => {
                reject(new Error(`Failed to load script: ${path}`));
            };

            document.head.appendChild(script);
        });
    }

    optimizeBundles() {
        if (!this.config.optimization.enableBundling) return;

        // Group modules by page type for potential bundling
        const pageBundles = this.config.bundles[this.currentPageType] || [];

        if (pageBundles.length >= this.config.optimization.bundleThreshold) {
            this.createVirtualBundle(this.currentPageType, pageBundles);
        }
    }

    createVirtualBundle(bundleName, moduleNames) {
        // Create a virtual bundle by preloading related modules together
        console.log(`Creating virtual bundle: ${bundleName}`);

        const bundlePromise = Promise.all(
            moduleNames.map(moduleName => this.loadModule(moduleName))
        );

        this.bundleCache.set(bundleName, bundlePromise);
        this.performanceMetrics.bundlesCreated++;

        return bundlePromise;
    }

    // Asset compression and optimization
    async optimizeAsset(url, type = 'auto') {
        // Check cache first
        if (this.bundleCache.has(url)) {
            this.performanceMetrics.cacheHits++;
            return this.bundleCache.get(url);
        }

        try {
            const response = await fetch(url);
            let optimizedContent = await response.text();

            // Apply optimizations based on type
            if (type === 'css' || url.endsWith('.css')) {
                optimizedContent = this.optimizeCSS(optimizedContent);
            } else if (type === 'js' || url.endsWith('.js')) {
                optimizedContent = this.optimizeJS(optimizedContent);
            }

            // Cache optimized content
            this.bundleCache.set(url, optimizedContent);

            return optimizedContent;

        } catch (error) {
            console.error(`Failed to optimize asset: ${url}`, error);
            throw error;
        }
    }

    optimizeCSS(css) {
        if (!this.config.optimization.enableMinification) return css;

        // Basic CSS optimization (in production, use proper minifier)
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
            .trim();
    }

    optimizeJS(js) {
        if (!this.config.optimization.enableMinification) return js;

        // Basic JS optimization (in production, use proper minifier)
        return js
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
            .replace(/\/\/.*$/gm, '') // Remove line comments
            .replace(/\s+/g, ' ') // Collapse whitespace
            .trim();
    }

    // Performance monitoring
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            averageLoadTime: this.performanceMetrics.modulesLoaded > 0
                ? this.performanceMetrics.totalLoadTime / this.performanceMetrics.modulesLoaded
                : 0,
            cacheHitRate: this.performanceMetrics.networkRequests > 0
                ? (this.performanceMetrics.cacheHits / this.performanceMetrics.networkRequests) * 100
                : 0,
            loadedModules: Array.from(this.loadedModules),
            currentPageType: this.currentPageType
        };
    }

    // Manual optimization triggers
    async preloadPageAssets(pageType) {
        const pageBundle = this.config.bundles[pageType];
        if (!pageBundle) return;

        const preloadPromises = pageBundle.map(moduleName =>
            this.preloadModule(moduleName)
        );

        await Promise.all(preloadPromises);
        console.log(`Preloaded assets for page type: ${pageType}`);
    }

    async prefetchNextPage(url) {
        // Prefetch resources for the next likely page
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);

        console.log(`Prefetching page: ${url}`);
    }

    // Cleanup methods
    clearCache() {
        this.bundleCache.clear();
        this.loadedModules.clear();
        this.loadingPromises.clear();

        console.log('Asset cache cleared');
    }

    cleanup() {
        this.clearCache();

        // Remove preload links
        const preloadLinks = document.querySelectorAll('link[rel="modulepreload"], link[rel="prefetch"]');
        preloadLinks.forEach(link => link.remove());

        console.log('AssetOptimizer cleaned up');
    }

    // Static utility methods
    static detectConnectionSpeed() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
        return null;
    }

    static isSlowConnection() {
        const connection = AssetOptimizer.detectConnectionSpeed();
        return connection && (
            connection.effectiveType === 'slow-2g' ||
            connection.effectiveType === '2g' ||
            connection.saveData
        );
    }

    static shouldDeferAssets() {
        return AssetOptimizer.isSlowConnection() ||
            (performance.memory && performance.memory.usedJSHeapSize > 50000000); // 50MB
    }
}