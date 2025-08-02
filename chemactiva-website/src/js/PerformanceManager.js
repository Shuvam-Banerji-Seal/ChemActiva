// src/js/PerformanceManager.js
import ServiceWorkerManager from './ServiceWorkerManager.js';
import AssetOptimizer from './AssetOptimizer.js';

export default class PerformanceManager {
    constructor(options = {}) {
        this.serviceWorkerManager = options.serviceWorkerManager || new ServiceWorkerManager();
        this.assetOptimizer = options.assetOptimizer || new AssetOptimizer();
        this.cacheManager = options.cacheManager;
        this.assetLoadingManager = options.assetLoadingManager;
        this.loadingStateManager = options.loadingStateManager;
        this.errorRecoveryManager = options.errorRecoveryManager;
        
        this.metrics = {
            loadStartTime: performance.now(),
            navigationStart: performance.timing?.navigationStart || performance.now(),
            firstContentfulPaint: null,
            largestContentfulPaint: null,
            firstInputDelay: null,
            cumulativeLayoutShift: 0,
            timeToInteractive: null,
            resourceLoadTimes: new Map(),
            criticalResourcesLoaded: 0,
            totalCriticalResources: 0,
            // New metrics for loading operations
            assetLoadingMetrics: {
                totalLoads: 0,
                successfulLoads: 0,
                failedLoads: 0,
                averageLoadTime: 0,
                loadTimesByType: {},
                successRatesByType: {}
            },
            // New metrics for cache operations
            cacheMetrics: {
                hits: 0,
                misses: 0,
                hitRate: 0,
                totalRequests: 0,
                evictions: 0,
                cacheSize: 0,
                cacheSizeBytes: 0
            },
            // New metrics for error tracking
            errorMetrics: {
                totalErrors: 0,
                errorsLast24h: 0,
                errorsByType: {},
                errorsByAsset: {},
                recoveryAttempts: 0,
                recoverySuccessRate: 0
            },
            // Network condition metrics
            networkMetrics: {
                effectiveType: 'unknown',
                downlink: 0,
                rtt: 0,
                adaptiveLoadingActive: false,
                adaptiveLoadingStrategy: 'none'
            }
        };
        
        this.observers = new Map();
        this.preloadedAssets = new Set();
        this.criticalAssets = new Set();
        this.performanceEntries = [];
        this.isInitialized = false;
        
        // Configuration
        this.config = {
            preloadThreshold: 2000, // ms - preload assets within 2s of likely need
            criticalImageSelector: '.hero-image, .product-image-carousel-enhanced img:first-child, .above-fold img',
            criticalCSSSelector: 'link[rel="stylesheet"][data-critical="true"]',
            enableServiceWorker: true,
            cacheStrategy: 'stale-while-revalidate',
            maxCacheAge: 86400000, // 24 hours in ms
            performanceThresholds: {
                lcp: 2500, // ms
                fid: 100,  // ms
                cls: 0.1,  // score
                loadTime: 3000, // ms
                successRate: 95 // percentage
            },
            // New configuration for metrics collection
            metricsCollection: {
                interval: 5000, // Collect metrics every 5 seconds
                sampleSize: 100, // Maximum samples to keep for averages
                logLevel: 'info', // 'debug', 'info', 'warn', 'error'
                autoOptimize: true // Automatically optimize when thresholds are exceeded
            }
        };
        
        // Metrics history for trend analysis
        this.metricsHistory = {
            coreWebVitals: [],
            loadingMetrics: [],
            cacheMetrics: [],
            errorMetrics: [],
            networkMetrics: []
        };
        
        // Initialize metrics collection timer
        this.metricsTimer = null;
    }
 
   async init() {
        if (this.isInitialized) {
            console.warn('PerformanceManager already initialized');
            return;
        }

        try {
            // Initialize asset optimization first
            await this.assetOptimizer.init();
            
            // Initialize service worker for caching
            if (this.config.enableServiceWorker) {
                await this.serviceWorkerManager.init();
            }
            
            this.initCoreWebVitalsTracking();
            this.initResourceLoadTracking();
            this.initCriticalAssetPreloading();
            this.startPerformanceMonitoring();
            
            // Initialize metrics collection
            this.startMetricsCollection();
            
            // Initialize network condition monitoring
            this.initNetworkMonitoring();
            
            this.isInitialized = true;
            console.log('PerformanceManager initialized successfully');
            
            // Report initial metrics after a short delay
            setTimeout(() => this.reportMetrics(), 1000);
            
        } catch (error) {
            console.error('PerformanceManager initialization failed:', error);
        }
    }

    initCoreWebVitalsTracking() {
        // Track Largest Contentful Paint (LCP)
        if ('PerformanceObserver' in window) {
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.largestContentfulPaint = lastEntry.startTime;
                    
                    // Check if LCP meets threshold
                    if (lastEntry.startTime > this.config.performanceThresholds.lcp) {
                        console.warn(`LCP threshold exceeded: ${lastEntry.startTime}ms > ${this.config.performanceThresholds.lcp}ms`);
                        this.optimizeLCP();
                    }
                });
                
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                this.observers.set('lcp', lcpObserver);
                
            } catch (error) {
                console.warn('LCP tracking not supported:', error);
            }

            // Track First Input Delay (FID)
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
                        
                        if (this.metrics.firstInputDelay > this.config.performanceThresholds.fid) {
                            console.warn(`FID threshold exceeded: ${this.metrics.firstInputDelay}ms > ${this.config.performanceThresholds.fid}ms`);
                            this.optimizeFID();
                        }
                    });
                });
                
                fidObserver.observe({ entryTypes: ['first-input'] });
                this.observers.set('fid', fidObserver);
                
            } catch (error) {
                console.warn('FID tracking not supported:', error);
            }

            // Track Cumulative Layout Shift (CLS)
            try {
                const clsObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            this.metrics.cumulativeLayoutShift += entry.value;
                        }
                    });
                    
                    if (this.metrics.cumulativeLayoutShift > this.config.performanceThresholds.cls) {
                        console.warn(`CLS threshold exceeded: ${this.metrics.cumulativeLayoutShift} > ${this.config.performanceThresholds.cls}`);
                        this.optimizeCLS();
                    }
                });
                
                clsObserver.observe({ entryTypes: ['layout-shift'] });
                this.observers.set('cls', clsObserver);
                
            } catch (error) {
                console.warn('CLS tracking not supported:', error);
            }

            // Track First Contentful Paint (FCP)
            try {
                const fcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.name === 'first-contentful-paint') {
                            this.metrics.firstContentfulPaint = entry.startTime;
                        }
                    });
                });
                
                fcpObserver.observe({ entryTypes: ['paint'] });
                this.observers.set('fcp', fcpObserver);
                
            } catch (error) {
                console.warn('FCP tracking not supported:', error);
            }
        }
    }

    initResourceLoadTracking() {
        if ('PerformanceObserver' in window) {
            try {
                const resourceObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.metrics.resourceLoadTimes.set(entry.name, {
                            duration: entry.duration,
                            transferSize: entry.transferSize || 0,
                            encodedBodySize: entry.encodedBodySize || 0,
                            decodedBodySize: entry.decodedBodySize || 0,
                            startTime: entry.startTime,
                            responseEnd: entry.responseEnd
                        });
                        
                        // Track critical resource loading
                        if (this.isCriticalResource(entry.name)) {
                            this.metrics.criticalResourcesLoaded++;
                            console.log(`Critical resource loaded: ${entry.name} in ${entry.duration}ms`);
                        }
                        
                        // Track resource loading by type
                        const resourceType = this.getResourceType(entry.name);
                        if (!this.metrics.assetLoadingMetrics.loadTimesByType[resourceType]) {
                            this.metrics.assetLoadingMetrics.loadTimesByType[resourceType] = [];
                        }
                        
                        // Keep a limited history of load times for each type
                        const loadTimes = this.metrics.assetLoadingMetrics.loadTimesByType[resourceType];
                        loadTimes.push(entry.duration);
                        if (loadTimes.length > this.config.metricsCollection.sampleSize) {
                            loadTimes.shift();
                        }
                    });
                });
                
                resourceObserver.observe({ entryTypes: ['resource'] });
                this.observers.set('resource', resourceObserver);
                
            } catch (error) {
                console.warn('Resource tracking not supported:', error);
            }
        }
    }

    /**
     * Start collecting metrics at regular intervals
     */
    startMetricsCollection() {
        // Clear any existing timer
        if (this.metricsTimer) {
            clearInterval(this.metricsTimer);
        }
        
        // Start new collection timer
        this.metricsTimer = setInterval(() => {
            this.collectMetrics();
        }, this.config.metricsCollection.interval);
        
        console.log(`PerformanceManager: Started metrics collection every ${this.config.metricsCollection.interval}ms`);
    }

    /**
     * Collect metrics from all integrated components
     */
    collectMetrics() {
        // Collect metrics from CacheManager if available
        if (this.cacheManager) {
            const cacheStats = this.cacheManager.getStats();
            this.metrics.cacheMetrics = {
                hits: cacheStats.hits,
                misses: cacheStats.misses,
                hitRate: parseFloat(cacheStats.hitRate),
                totalRequests: cacheStats.totalRequests,
                evictions: cacheStats.evictions,
                cacheSize: cacheStats.totalEntries,
                cacheSizeBytes: cacheStats.totalSize,
                assetTypes: cacheStats.assetTypes,
                priorities: cacheStats.priorities
            };
        }
        
        // Collect metrics from LoadingStateManager if available
        if (this.loadingStateManager) {
            const loadingMetrics = this.loadingStateManager.getPerformanceMetrics();
            this.metrics.assetLoadingMetrics = {
                ...this.metrics.assetLoadingMetrics,
                totalLoads: loadingMetrics.totalLoads,
                successfulLoads: loadingMetrics.successfulLoads,
                failedLoads: loadingMetrics.failedLoads,
                averageLoadTime: loadingMetrics.averageLoadTime,
                successRate: loadingMetrics.successRate
            };
        }
        
        // Collect metrics from AssetLoadingManager if available
        if (this.assetLoadingManager) {
            const assetStats = this.assetLoadingManager.getStats();
            
            // Merge with existing metrics
            if (assetStats.assetLoading) {
                Object.assign(this.metrics.assetLoadingMetrics, {
                    loadingPromises: assetStats.assetLoading.loadingPromises,
                    retryAttempts: assetStats.assetLoading.retryAttempts,
                    criticalAssets: assetStats.assetLoading.criticalAssets
                });
            }
        }
        
        // Collect metrics from ErrorRecoveryManager if available
        if (this.errorRecoveryManager) {
            const errorStats = this.errorRecoveryManager.getErrorStats();
            this.metrics.errorMetrics = {
                totalErrors: errorStats.totalErrors,
                errorsLast24h: errorStats.errorsLast24h,
                errorsByType: errorStats.errorsByType,
                errorsByAsset: errorStats.errorsByAsset,
                recoveryAttempts: errorStats.recoveryAttempts
            };
        }
        
        // Store metrics history for trend analysis
        this.storeMetricsHistory();
        
        // Check if any metrics exceed thresholds
        this.checkMetricsThresholds();
        
        // Log metrics at configured level
        this.logMetrics();
    }    /*
*
     * Store metrics history for trend analysis
     */
    storeMetricsHistory() {
        const timestamp = Date.now();
        
        // Store Core Web Vitals history
        this.metricsHistory.coreWebVitals.push({
            timestamp,
            lcp: this.metrics.largestContentfulPaint,
            fid: this.metrics.firstInputDelay,
            cls: this.metrics.cumulativeLayoutShift,
            fcp: this.metrics.firstContentfulPaint
        });
        
        // Store loading metrics history
        this.metricsHistory.loadingMetrics.push({
            timestamp,
            totalLoads: this.metrics.assetLoadingMetrics.totalLoads,
            successRate: this.metrics.assetLoadingMetrics.successRate,
            averageLoadTime: this.metrics.assetLoadingMetrics.averageLoadTime
        });
        
        // Store cache metrics history
        this.metricsHistory.cacheMetrics.push({
            timestamp,
            hitRate: this.metrics.cacheMetrics.hitRate,
            cacheSize: this.metrics.cacheMetrics.cacheSize,
            evictions: this.metrics.cacheMetrics.evictions
        });
        
        // Store error metrics history
        this.metricsHistory.errorMetrics.push({
            timestamp,
            totalErrors: this.metrics.errorMetrics.totalErrors,
            errorsLast24h: this.metrics.errorMetrics.errorsLast24h,
            recoveryAttempts: this.metrics.errorMetrics.recoveryAttempts
        });
        
        // Store network metrics history
        this.metricsHistory.networkMetrics.push({
            timestamp,
            effectiveType: this.metrics.networkMetrics.effectiveType,
            downlink: this.metrics.networkMetrics.downlink,
            rtt: this.metrics.networkMetrics.rtt
        });
        
        // Limit history size
        const maxHistoryItems = 100;
        if (this.metricsHistory.coreWebVitals.length > maxHistoryItems) {
            this.metricsHistory.coreWebVitals.shift();
            this.metricsHistory.loadingMetrics.shift();
            this.metricsHistory.cacheMetrics.shift();
            this.metricsHistory.errorMetrics.shift();
            this.metricsHistory.networkMetrics.shift();
        }
    }

    /**
     * Check if any metrics exceed thresholds
     */
    checkMetricsThresholds() {
        const thresholds = this.config.performanceThresholds;
        
        // Check loading success rate
        if (this.metrics.assetLoadingMetrics.successRate < thresholds.successRate) {
            console.warn(`Loading success rate below threshold: ${this.metrics.assetLoadingMetrics.successRate.toFixed(1)}% < ${thresholds.successRate}%`);
            
            if (this.config.metricsCollection.autoOptimize) {
                this.optimizeLoadingSuccess();
            }
        }
        
        // Check average load time
        if (this.metrics.assetLoadingMetrics.averageLoadTime > thresholds.loadTime) {
            console.warn(`Average load time exceeds threshold: ${this.metrics.assetLoadingMetrics.averageLoadTime.toFixed(1)}ms > ${thresholds.loadTime}ms`);
            
            if (this.config.metricsCollection.autoOptimize) {
                this.optimizeLoadingTime();
            }
        }
        
        // Check cache hit rate
        if (this.metrics.cacheMetrics.hitRate < 50 && this.metrics.cacheMetrics.totalRequests > 10) {
            console.warn(`Cache hit rate is low: ${this.metrics.cacheMetrics.hitRate.toFixed(1)}%`);
            
            if (this.config.metricsCollection.autoOptimize) {
                this.optimizeCaching();
            }
        }
    }

    /**
     * Log metrics at configured level
     */
    logMetrics() {
        const logLevel = this.config.metricsCollection.logLevel;
        
        if (logLevel === 'debug') {
            console.debug('Performance Metrics:', this.metrics);
        } else if (logLevel === 'info') {
            console.info(`Performance Summary - LCP: ${this.metrics.largestContentfulPaint?.toFixed(0)}ms, Success Rate: ${this.metrics.assetLoadingMetrics.successRate.toFixed(1)}%, Cache Hit Rate: ${this.metrics.cacheMetrics.hitRate.toFixed(1)}%`);
        }
    }

    /**
     * Initialize network condition monitoring
     */
    initNetworkMonitoring() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            // Initial network info
            this.updateNetworkMetrics(connection);
            
            // Listen for changes
            connection.addEventListener('change', () => {
                this.updateNetworkMetrics(connection);
            });
        }
    }

    /**
     * Update network metrics
     */
    updateNetworkMetrics(connection) {
        this.metrics.networkMetrics = {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            adaptiveLoadingActive: this.metrics.networkMetrics.adaptiveLoadingActive,
            adaptiveLoadingStrategy: this.metrics.networkMetrics.adaptiveLoadingStrategy
        };
        
        // Emit network change event
        window.dispatchEvent(new CustomEvent('networkConditionChange', {
            detail: this.metrics.networkMetrics
        }));
    }   
 initCriticalAssetPreloading() {
        // Identify critical above-the-fold images
        const criticalImages = document.querySelectorAll(this.config.criticalImageSelector);
        criticalImages.forEach(img => {
            if (img.src || img.dataset.src) {
                const src = img.src || img.dataset.src;
                this.criticalAssets.add(src);
                this.preloadImage(src);
            }
        });

        // Identify critical CSS
        const criticalCSS = document.querySelectorAll(this.config.criticalCSSSelector);
        criticalCSS.forEach(link => {
            this.criticalAssets.add(link.href);
        });

        this.metrics.totalCriticalResources = this.criticalAssets.size;

        // Preload product images that are likely to be viewed
        this.preloadProductImages();
        
        // Preload next page resources based on navigation patterns
        this.preloadNextPageResources();
    }

    preloadImage(src) {
        if (this.preloadedAssets.has(src)) return;

        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        
        // Add WebP support check
        if (this.supportsWebP() && !src.includes('.webp')) {
            const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
            link.href = webpSrc;
            
            // Fallback to original if WebP fails
            link.onerror = () => {
                const fallbackLink = document.createElement('link');
                fallbackLink.rel = 'preload';
                fallbackLink.as = 'image';
                fallbackLink.href = src;
                document.head.appendChild(fallbackLink);
            };
        }
        
        document.head.appendChild(link);
        this.preloadedAssets.add(src);
        
        console.log(`Preloading critical image: ${src}`);
    }

    preloadProductImages() {
        // Use Intersection Observer to preload images just before they come into view
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src || img.src;
                    
                    if (src && !this.preloadedAssets.has(src)) {
                        this.preloadImage(src);
                    }
                    
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '200px 0px', // Preload 200px before entering viewport
            threshold: 0.01
        });

        // Observe all product images
        const productImages = document.querySelectorAll('.product-image-carousel-enhanced img[data-src]');
        productImages.forEach(img => imageObserver.observe(img));
        
        this.observers.set('productImages', imageObserver);
    }

    preloadNextPageResources() {
        // Analyze navigation patterns and preload likely next pages
        const currentPage = window.location.pathname;
        const navLinks = document.querySelectorAll('nav a[href]');
        
        // Preload CSS and JS for likely next pages
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href !== currentPage && !href.startsWith('#')) {
                // Preload on hover with debouncing
                let preloadTimeout;
                
                link.addEventListener('mouseenter', () => {
                    preloadTimeout = setTimeout(() => {
                        this.preloadPageResources(href);
                    }, 200); // 200ms delay to avoid unnecessary preloads
                });
                
                link.addEventListener('mouseleave', () => {
                    if (preloadTimeout) {
                        clearTimeout(preloadTimeout);
                    }
                });
            }
        });
    }

    preloadPageResources(href) {
        if (this.preloadedAssets.has(href)) return;

        // Preload the HTML page
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
        
        this.preloadedAssets.add(href);
        console.log(`Prefetching page: ${href}`);
    }    star
tPerformanceMonitoring() {
        // Monitor performance continuously
        setInterval(() => {
            this.checkPerformanceThresholds();
        }, 5000); // Check every 5 seconds

        // Monitor memory usage if available
        if ('memory' in performance) {
            setInterval(() => {
                const memInfo = performance.memory;
                if (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize > 0.9) {
                    console.warn('High memory usage detected, consider optimization');
                    this.optimizeMemoryUsage();
                }
            }, 10000); // Check every 10 seconds
        }

        // Monitor network conditions
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            const handleConnectionChange = () => {
                console.log(`Network changed: ${connection.effectiveType}, ${connection.downlink}Mbps`);
                this.adaptToNetworkConditions(connection);
            };
            
            connection.addEventListener('change', handleConnectionChange);
            handleConnectionChange(); // Initial check
        }
    }

    checkPerformanceThresholds() {
        const metrics = this.getMetrics();
        
        // Check if any thresholds are exceeded
        if (metrics.largestContentfulPaint > this.config.performanceThresholds.lcp) {
            this.optimizeLCP();
        }
        
        if (metrics.firstInputDelay > this.config.performanceThresholds.fid) {
            this.optimizeFID();
        }
        
        if (metrics.cumulativeLayoutShift > this.config.performanceThresholds.cls) {
            this.optimizeCLS();
        }
    }

    optimizeLCP() {
        console.log('Optimizing LCP...');
        
        // Preload critical images more aggressively
        const criticalImages = document.querySelectorAll(this.config.criticalImageSelector);
        criticalImages.forEach(img => {
            if (!img.complete && (img.src || img.dataset.src)) {
                const src = img.src || img.dataset.src;
                this.preloadImage(src);
            }
        });
        
        // Emit event for external optimization
        window.dispatchEvent(new CustomEvent('performanceOptimization', {
            detail: { type: 'lcp', value: this.metrics.largestContentfulPaint }
        }));
    }

    optimizeFID() {
        console.log('Optimizing FID...');
        
        // Defer non-critical JavaScript
        const scripts = document.querySelectorAll('script:not([data-critical])');
        scripts.forEach(script => {
            if (!script.defer && !script.async) {
                script.defer = true;
            }
        });
        
        // Emit event for external optimization
        window.dispatchEvent(new CustomEvent('performanceOptimization', {
            detail: { type: 'fid', value: this.metrics.firstInputDelay }
        }));
    }

    optimizeCLS() {
        console.log('Optimizing CLS...');
        
        // Add size attributes to images without them
        const images = document.querySelectorAll('img:not([width]):not([height])');
        images.forEach(img => {
            if (img.naturalWidth && img.naturalHeight) {
                img.setAttribute('width', img.naturalWidth);
                img.setAttribute('height', img.naturalHeight);
            }
        });
        
        // Emit event for external optimization
        window.dispatchEvent(new CustomEvent('performanceOptimization', {
            detail: { type: 'cls', value: this.metrics.cumulativeLayoutShift }
        }));
    }    /*
*
     * Optimize loading success rate
     */
    optimizeLoadingSuccess() {
        console.log('Optimizing loading success rate...');
        
        // Analyze error patterns
        const errorsByType = this.metrics.errorMetrics.errorsByType;
        const mostProblematicType = Object.entries(errorsByType)
            .sort((a, b) => b[1] - a[1])
            .map(entry => entry[0])[0];
            
        if (mostProblematicType) {
            console.log(`Most problematic asset type: ${mostProblematicType}`);
            
            // Emit optimization event
            window.dispatchEvent(new CustomEvent('performanceOptimization', {
                detail: { 
                    type: 'loadingSuccess', 
                    problematicAssetType: mostProblematicType,
                    successRate: this.metrics.assetLoadingMetrics.successRate
                }
            }));
        }
        
        // If AssetLoadingManager is available, increase retry attempts
        if (this.assetLoadingManager) {
            // This would require a method in AssetLoadingManager to adjust retry settings
            console.log('Increasing retry attempts for problematic assets');
        }
    }

    /**
     * Optimize loading time
     */
    optimizeLoadingTime() {
        console.log('Optimizing loading time...');
        
        // Find slowest loading asset types
        const loadTimesByType = this.metrics.assetLoadingMetrics.loadTimesByType;
        const slowestTypes = Object.entries(loadTimesByType)
            .map(([type, times]) => {
                const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
                return { type, avgTime };
            })
            .sort((a, b) => b.avgTime - a.avgTime);
            
        if (slowestTypes.length > 0) {
            console.log(`Slowest loading asset type: ${slowestTypes[0].type} (${slowestTypes[0].avgTime.toFixed(0)}ms)`);
            
            // Emit optimization event
            window.dispatchEvent(new CustomEvent('performanceOptimization', {
                detail: { 
                    type: 'loadingTime', 
                    slowestAssetType: slowestTypes[0].type,
                    averageTime: slowestTypes[0].avgTime
                }
            }));
        }
        
        // Increase preloading for slow asset types
        if (slowestTypes.length > 0 && slowestTypes[0].type === 'image') {
            console.log('Increasing image preloading aggressiveness');
            // This would adjust preloading behavior
        }
    }

    /**
     * Optimize caching
     */
    optimizeCaching() {
        console.log('Optimizing caching...');
        
        // If CacheManager is available, optimize it
        if (this.cacheManager && typeof this.cacheManager.optimize === 'function') {
            this.cacheManager.optimize();
        }
        
        // Emit optimization event
        window.dispatchEvent(new CustomEvent('performanceOptimization', {
            detail: { 
                type: 'caching', 
                hitRate: this.metrics.cacheMetrics.hitRate
            }
        }));
    }

    optimizeMemoryUsage() {
        console.log('Optimizing memory usage...');
        
        // Clean up unused resources
        this.cleanupUnusedResources();
        
        // Suggest garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }   
 adaptToNetworkConditions(connection) {
        const effectiveType = connection.effectiveType;
        
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
            // Reduce image quality and disable non-essential features
            console.log('Adapting to slow network conditions');
            
            // Update network metrics
            this.metrics.networkMetrics.adaptiveLoadingActive = true;
            this.metrics.networkMetrics.adaptiveLoadingStrategy = 'reduced_quality';
            
            // Disable autoplay videos
            const videos = document.querySelectorAll('video[autoplay]');
            videos.forEach(video => {
                video.removeAttribute('autoplay');
            });
            
            // Use lower quality images
            const images = document.querySelectorAll('img[data-src-low]');
            images.forEach(img => {
                if (img.dataset.srcLow) {
                    img.src = img.dataset.srcLow;
                }
            });
            
        } else if (effectiveType === '4g') {
            // Enable high-quality features
            console.log('Adapting to fast network conditions');
            
            // Update network metrics
            this.metrics.networkMetrics.adaptiveLoadingActive = false;
            this.metrics.networkMetrics.adaptiveLoadingStrategy = 'high_quality';
            
            // Preload more aggressively
            this.preloadNextPageResources();
        }
    }

    cleanupUnusedResources() {
        // Remove unused preload links
        const preloadLinks = document.querySelectorAll('link[rel="preload"]');
        preloadLinks.forEach(link => {
            // Remove preload links that are older than 30 seconds
            const linkAge = Date.now() - (link.dataset.timestamp || 0);
            if (linkAge > 30000) {
                link.remove();
            }
        });
        
        // Clear old performance entries
        if (this.performanceEntries.length > 1000) {
            this.performanceEntries = this.performanceEntries.slice(-500);
        }
    }

    isCriticalResource(resourceName) {
        return this.criticalAssets.has(resourceName) ||
               resourceName.includes('critical') ||
               resourceName.includes('above-fold') ||
               resourceName.includes('hero');
    }

    /**
     * Get resource type from URL
     */
    getResourceType(url) {
        const extension = url.split('.').pop()?.toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
            return url.includes('logo') ? 'logo' : 'image';
        } else if (['css'].includes(extension)) {
            return 'css';
        } else if (['js'].includes(extension)) {
            return 'javascript';
        } else if (['woff', 'woff2', 'ttf', 'otf'].includes(extension)) {
            return 'font';
        } else if (['json', 'jsonl'].includes(extension)) {
            return 'data';
        } else {
            return 'other';
        }
    }

    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }  
  getMetrics() {
        const now = performance.now();
        
        // Get metrics from integrated components
        this.collectMetrics();
        
        const assetOptimizerMetrics = this.assetOptimizer.getPerformanceMetrics();
        const serviceWorkerMetrics = {
            isRegistered: this.serviceWorkerManager.isRegistered,
            updateAvailable: this.serviceWorkerManager.isUpdateAvailable(),
            cacheSize: 0 // Will be populated asynchronously
        };
        
        return {
            ...this.metrics,
            totalLoadTime: now - this.metrics.loadStartTime,
            criticalResourcesProgress: this.metrics.totalCriticalResources > 0 
                ? (this.metrics.criticalResourcesLoaded / this.metrics.totalCriticalResources) * 100 
                : 100,
            resourceCount: this.metrics.resourceLoadTimes.size,
            preloadedAssetsCount: this.preloadedAssets.size,
            averageResourceLoadTime: this.calculateAverageResourceLoadTime(),
            performanceScore: this.calculatePerformanceScore(),
            
            // Asset optimization metrics
            assetOptimization: assetOptimizerMetrics,
            
            // Service worker metrics
            serviceWorker: serviceWorkerMetrics,
            
            // Trend analysis
            trends: this.calculateTrends()
        };
    }

    /**
     * Calculate trends from metrics history
     */
    calculateTrends() {
        // Only calculate trends if we have enough history
        if (this.metricsHistory.loadingMetrics.length < 3) {
            return {
                loadingSuccessRate: 'stable',
                loadingTime: 'stable',
                cacheHitRate: 'stable',
                errorRate: 'stable'
            };
        }
        
        // Get the last few metrics
        const recentLoadingMetrics = this.metricsHistory.loadingMetrics.slice(-3);
        const recentCacheMetrics = this.metricsHistory.cacheMetrics.slice(-3);
        const recentErrorMetrics = this.metricsHistory.errorMetrics.slice(-3);
        
        // Calculate trends
        const loadingSuccessRateTrend = this.calculateTrend(
            recentLoadingMetrics.map(m => m.successRate)
        );
        
        const loadingTimeTrend = this.calculateTrend(
            recentLoadingMetrics.map(m => m.averageLoadTime)
        );
        
        const cacheHitRateTrend = this.calculateTrend(
            recentCacheMetrics.map(m => m.hitRate)
        );
        
        const errorRateTrend = this.calculateTrend(
            recentErrorMetrics.map(m => m.errorsLast24h)
        );
        
        return {
            loadingSuccessRate: loadingSuccessRateTrend,
            loadingTime: loadingTimeTrend === 'improving' ? 'improving' : (loadingTimeTrend === 'degrading' ? 'degrading' : 'stable'),
            cacheHitRate: cacheHitRateTrend,
            errorRate: errorRateTrend === 'improving' ? 'degrading' : (errorRateTrend === 'degrading' ? 'improving' : 'stable')
        };
    }

    /**
     * Calculate trend direction from a series of values
     */
    calculateTrend(values) {
        if (values.length < 2) return 'stable';
        
        const first = values[0];
        const last = values[values.length - 1];
        const percentChange = ((last - first) / first) * 100;
        
        if (percentChange > 5) return 'improving';
        if (percentChange < -5) return 'degrading';
        return 'stable';
    }

    calculateAverageResourceLoadTime() {
        if (this.metrics.resourceLoadTimes.size === 0) return 0;
        
        let totalTime = 0;
        this.metrics.resourceLoadTimes.forEach(resource => {
            totalTime += resource.duration;
        });
        
        return totalTime / this.metrics.resourceLoadTimes.size;
    }

    calculatePerformanceScore() {
        let score = 100;
        
        // Deduct points for poor Core Web Vitals
        if (this.metrics.largestContentfulPaint > this.config.performanceThresholds.lcp) {
            score -= 20;
        }
        
        if (this.metrics.firstInputDelay > this.config.performanceThresholds.fid) {
            score -= 20;
        }
        
        if (this.metrics.cumulativeLayoutShift > this.config.performanceThresholds.cls) {
            score -= 20;
        }
        
        // Deduct points for poor loading metrics
        if (this.metrics.assetLoadingMetrics.successRate < this.config.performanceThresholds.successRate) {
            score -= 15;
        }
        
        if (this.metrics.assetLoadingMetrics.averageLoadTime > this.config.performanceThresholds.loadTime) {
            score -= 15;
        }
        
        // Bonus points for good practices
        if (this.metrics.criticalResourcesLoaded === this.metrics.totalCriticalResources) {
            score += 10;
        }
        
        if (this.metrics.cacheMetrics.hitRate > 80) {
            score += 10;
        }
        
        return Math.max(0, Math.min(100, score));
    }    re
portMetrics() {
        const metrics = this.getMetrics();
        
        console.group('Performance Metrics Report');
        console.log('Core Web Vitals:');
        console.log(`  LCP: ${metrics.largestContentfulPaint?.toFixed(2) || 'N/A'}ms`);
        console.log(`  FID: ${metrics.firstInputDelay?.toFixed(2) || 'N/A'}ms`);
        console.log(`  CLS: ${metrics.cumulativeLayoutShift?.toFixed(3) || 'N/A'}`);
        console.log(`  FCP: ${metrics.firstContentfulPaint?.toFixed(2) || 'N/A'}ms`);
        
        console.log('Resource Loading:');
        console.log(`  Critical Resources: ${metrics.criticalResourcesLoaded}/${metrics.totalCriticalResources} (${metrics.criticalResourcesProgress.toFixed(1)}%)`);
        console.log(`  Total Resources: ${metrics.resourceCount}`);
        console.log(`  Average Load Time: ${metrics.averageResourceLoadTime.toFixed(2)}ms`);
        console.log(`  Preloaded Assets: ${metrics.preloadedAssetsCount}`);
        
        console.log('Asset Loading Metrics:');
        console.log(`  Total Loads: ${metrics.assetLoadingMetrics.totalLoads}`);
        console.log(`  Success Rate: ${metrics.assetLoadingMetrics.successRate?.toFixed(1) || 'N/A'}%`);
        console.log(`  Average Load Time: ${metrics.assetLoadingMetrics.averageLoadTime?.toFixed(2) || 'N/A'}ms`);
        
        console.log('Cache Metrics:');
        console.log(`  Hit Rate: ${metrics.cacheMetrics.hitRate?.toFixed(1) || 'N/A'}%`);
        console.log(`  Cache Size: ${metrics.cacheMetrics.cacheSize || 'N/A'} items`);
        console.log(`  Evictions: ${metrics.cacheMetrics.evictions || 'N/A'}`);
        
        console.log('Error Metrics:');
        console.log(`  Total Errors: ${metrics.errorMetrics.totalErrors || 'N/A'}`);
        console.log(`  Errors (24h): ${metrics.errorMetrics.errorsLast24h || 'N/A'}`);
        
        console.log('Network Metrics:');
        console.log(`  Connection: ${metrics.networkMetrics.effectiveType || 'unknown'}`);
        console.log(`  Downlink: ${metrics.networkMetrics.downlink || 'N/A'} Mbps`);
        console.log(`  RTT: ${metrics.networkMetrics.rtt || 'N/A'} ms`);
        console.log(`  Adaptive Loading: ${metrics.networkMetrics.adaptiveLoadingActive ? 'Active' : 'Inactive'}`);
        
        console.log(`Performance Score: ${metrics.performanceScore}/100`);
        console.log(`Total Load Time: ${metrics.totalLoadTime.toFixed(2)}ms`);
        
        console.log('Trends:');
        console.log(`  Loading Success Rate: ${metrics.trends?.loadingSuccessRate || 'N/A'}`);
        console.log(`  Loading Time: ${metrics.trends?.loadingTime || 'N/A'}`);
        console.log(`  Cache Hit Rate: ${metrics.trends?.cacheHitRate || 'N/A'}`);
        console.log(`  Error Rate: ${metrics.trends?.errorRate || 'N/A'}`);
        
        console.groupEnd();
        
        // Emit metrics event for external consumption
        window.dispatchEvent(new CustomEvent('performanceMetrics', {
            detail: metrics
        }));
        
        return metrics;
    }

    /**
     * Get detailed metrics for a specific category
     */
    getDetailedMetrics(category) {
        switch (category) {
            case 'coreWebVitals':
                return {
                    lcp: this.metrics.largestContentfulPaint,
                    fid: this.metrics.firstInputDelay,
                    cls: this.metrics.cumulativeLayoutShift,
                    fcp: this.metrics.firstContentfulPaint,
                    history: this.metricsHistory.coreWebVitals
                };
                
            case 'loading':
                return {
                    ...this.metrics.assetLoadingMetrics,
                    history: this.metricsHistory.loadingMetrics
                };
                
            case 'cache':
                return {
                    ...this.metrics.cacheMetrics,
                    history: this.metricsHistory.cacheMetrics
                };
                
            case 'errors':
                return {
                    ...this.metrics.errorMetrics,
                    history: this.metricsHistory.errorMetrics
                };
                
            case 'network':
                return {
                    ...this.metrics.networkMetrics,
                    history: this.metricsHistory.networkMetrics
                };
                
            default:
                return this.getMetrics();
        }
    }

    // Method to manually trigger performance optimization
    optimize() {
        console.log('Manual performance optimization triggered');
        
        this.optimizeLCP();
        this.optimizeFID();
        this.optimizeCLS();
        this.optimizeLoadingSuccess();
        this.optimizeLoadingTime();
        this.optimizeCaching();
        this.cleanupUnusedResources();
        
        // Report metrics after optimization
        setTimeout(() => this.reportMetrics(), 1000);
    }

    // Cleanup method
    cleanup() {
        // Disconnect all observers
        this.observers.forEach((observer, key) => {
            if (observer && typeof observer.disconnect === 'function') {
                observer.disconnect();
            }
        });
        this.observers.clear();
        
        // Clear intervals and timeouts
        if (this.metricsTimer) {
            clearInterval(this.metricsTimer);
        }
        
        // Clear caches
        this.preloadedAssets.clear();
        this.criticalAssets.clear();
        this.performanceEntries = [];
        
        console.log('PerformanceManager cleaned up');
    }

    // Static method to check browser support
    static isSupported() {
        return !!(
            window.performance &&
            window.PerformanceObserver &&
            window.IntersectionObserver
        );
    }

    // Static method to get basic performance info without full initialization
    static getBasicMetrics() {
        if (!window.performance) return null;
        
        const navigation = performance.getEntriesByType('navigation')[0];
        
        return {
            domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
            loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
            totalPageLoad: navigation?.loadEventEnd - navigation?.navigationStart,
            dnsLookup: navigation?.domainLookupEnd - navigation?.domainLookupStart,
            tcpConnection: navigation?.connectEnd - navigation?.connectStart,
            serverResponse: navigation?.responseEnd - navigation?.requestStart
        };
    }
}