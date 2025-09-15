/**
 * PerformanceMonitor - Comprehensive performance tracking and optimization
 * Monitors Web Vitals, page load metrics, and provides actionable insights
 */
export default class PerformanceMonitor {
    constructor(options = {}) {
        this.config = {
            enableLogging: options.enableLogging !== false,
            enableAnalytics: options.enableAnalytics !== false,
            reportingInterval: options.reportingInterval || 30000, // 30 seconds
            lcpThreshold: options.lcpThreshold || 2500, // 2.5 seconds
            fidThreshold: options.fidThreshold || 100, // 100ms
            clsThreshold: options.clsThreshold || 0.1, // 0.1 shift units
            ...options
        };

        this.metrics = {
            navigation: {},
            webVitals: {},
            resources: [],
            userTiming: {},
            customMetrics: {}
        };

        this.observers = new Map();
        this.reportingTimer = null;
        this.isInitialized = false;

        this.init();
    }

    async init() {
        if (this.isInitialized) return;

        try {
            // Load Web Vitals library dynamically
            await this.loadWebVitals();
            
            this.setupNavigationObserver();
            this.setupResourceObserver();
            this.setupWebVitalsTracking();
            this.setupCustomMetrics();
            this.startReporting();
            
            this.isInitialized = true;
            
            if (this.config.enableLogging) {
                console.log('[PerformanceMonitor] Initialized with comprehensive tracking');
            }
        } catch (error) {
            console.error('[PerformanceMonitor] Initialization failed:', error);
        }
    }

    async loadWebVitals() {
        // Load web-vitals library from CDN if not already available
        if (typeof window.webVitals === 'undefined') {
            try {
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js';
                script.defer = true;
                
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
                
                // Wait for the library to be available
                let attempts = 0;
                while (typeof window.webVitals === 'undefined' && attempts < 50) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    attempts++;
                }
                
                if (typeof window.webVitals === 'undefined') {
                    throw new Error('Web Vitals library failed to load');
                }
            } catch (error) {
                console.warn('[PerformanceMonitor] Could not load Web Vitals library:', error);
                // Fall back to manual measurement
                window.webVitals = {
                    getCLS: () => {},
                    getFID: () => {},
                    getFCP: () => {},
                    getLCP: () => {},
                    getTTFB: () => {}
                };
            }
        }
    }

    setupNavigationObserver() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.entryType === 'navigation') {
                            this.metrics.navigation = {
                                loadTime: entry.loadEventEnd - entry.loadEventStart,
                                domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                                domInteractive: entry.domInteractive - entry.navigationStart,
                                firstByte: entry.responseStart - entry.requestStart,
                                dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
                                tcpConnect: entry.connectEnd - entry.connectStart,
                                serverResponse: entry.responseEnd - entry.responseStart,
                                domProcessing: entry.domComplete - entry.domLoading,
                                pageLoad: entry.loadEventEnd - entry.navigationStart,
                                timestamp: Date.now()
                            };
                            
                            this.analyzeNavigationMetrics();
                        }
                    }
                });
                
                observer.observe({ entryTypes: ['navigation'] });
                this.observers.set('navigation', observer);
            } catch (error) {
                console.warn('[PerformanceMonitor] Navigation observer setup failed:', error);
            }
        }
    }

    setupResourceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        const resource = {
                            name: entry.name,
                            type: this.getResourceType(entry),
                            size: entry.transferSize || 0,
                            duration: entry.duration,
                            startTime: entry.startTime,
                            blocked: entry.domainLookupStart - entry.fetchStart,
                            dns: entry.domainLookupEnd - entry.domainLookupStart,
                            connect: entry.connectEnd - entry.connectStart,
                            send: entry.responseStart - entry.requestStart,
                            wait: entry.responseStart - entry.requestStart,
                            receive: entry.responseEnd - entry.responseStart,
                            timestamp: Date.now()
                        };
                        
                        this.metrics.resources.push(resource);
                        this.analyzeResourceMetrics(resource);
                    }
                });
                
                observer.observe({ entryTypes: ['resource'] });
                this.observers.set('resource', observer);
            } catch (error) {
                console.warn('[PerformanceMonitor] Resource observer setup failed:', error);
            }
        }
    }

    setupWebVitalsTracking() {
        if (window.webVitals) {
            // Core Web Vitals
            window.webVitals.getCLS((metric) => {
                this.metrics.webVitals.cls = {
                    value: metric.value,
                    rating: metric.rating,
                    entries: metric.entries,
                    timestamp: Date.now()
                };
                this.handleWebVitalMetric('CLS', metric);
            });

            window.webVitals.getFID((metric) => {
                this.metrics.webVitals.fid = {
                    value: metric.value,
                    rating: metric.rating,
                    entries: metric.entries,
                    timestamp: Date.now()
                };
                this.handleWebVitalMetric('FID', metric);
            });

            window.webVitals.getLCP((metric) => {
                this.metrics.webVitals.lcp = {
                    value: metric.value,
                    rating: metric.rating,
                    entries: metric.entries,
                    timestamp: Date.now()
                };
                this.handleWebVitalMetric('LCP', metric);
                this.optimizeLCP(metric);
            });

            // Additional metrics
            window.webVitals.getFCP((metric) => {
                this.metrics.webVitals.fcp = {
                    value: metric.value,
                    rating: metric.rating,
                    entries: metric.entries,
                    timestamp: Date.now()
                };
                this.handleWebVitalMetric('FCP', metric);
            });

            window.webVitals.getTTFB((metric) => {
                this.metrics.webVitals.ttfb = {
                    value: metric.value,
                    rating: metric.rating,
                    entries: metric.entries,
                    timestamp: Date.now()
                };
                this.handleWebVitalMetric('TTFB', metric);
            });
        }
    }

    setupCustomMetrics() {
        // Track JavaScript load time
        this.measureCustomMetric('js-bundle-load', () => {
            const scripts = document.querySelectorAll('script[src]');
            let totalSize = 0;
            let totalDuration = 0;
            
            scripts.forEach(script => {
                const entry = performance.getEntriesByName(script.src)[0];
                if (entry) {
                    totalSize += entry.transferSize || 0;
                    totalDuration += entry.duration || 0;
                }
            });
            
            return { totalSize, totalDuration, scriptCount: scripts.length };
        });

        // Track CSS load time
        this.measureCustomMetric('css-load', () => {
            const links = document.querySelectorAll('link[rel="stylesheet"]');
            let totalSize = 0;
            let totalDuration = 0;
            
            links.forEach(link => {
                const entry = performance.getEntriesByName(link.href)[0];
                if (entry) {
                    totalSize += entry.transferSize || 0;
                    totalDuration += entry.duration || 0;
                }
            });
            
            return { totalSize, totalDuration, stylesheetCount: links.length };
        });

        // Track image optimization
        this.measureCustomMetric('image-optimization', () => {
            const images = document.querySelectorAll('img');
            let optimizedCount = 0;
            let totalImages = images.length;
            let totalSize = 0;
            
            images.forEach(img => {
                const entry = performance.getEntriesByName(img.src)[0];
                if (entry) {
                    totalSize += entry.transferSize || 0;
                    
                    // Check if image is optimized (WebP, proper sizing, etc.)
                    if (img.src.includes('.webp') || 
                        img.loading === 'lazy' || 
                        img.hasAttribute('sizes')) {
                        optimizedCount++;
                    }
                }
            });
            
            return { 
                totalImages, 
                optimizedCount, 
                optimizationRate: totalImages > 0 ? (optimizedCount / totalImages) * 100 : 0,
                totalSize 
            };
        });
    }

    measureCustomMetric(name, measureFunction) {
        try {
            performance.mark(`${name}-start`);
            const result = measureFunction();
            performance.mark(`${name}-end`);
            performance.measure(name, `${name}-start`, `${name}-end`);
            
            const measure = performance.getEntriesByName(name)[0];
            this.metrics.customMetrics[name] = {
                duration: measure.duration,
                data: result,
                timestamp: Date.now()
            };
            
            if (this.config.enableLogging) {
                console.log(`[PerformanceMonitor] Custom metric ${name}:`, result);
            }
        } catch (error) {
            console.warn(`[PerformanceMonitor] Failed to measure ${name}:`, error);
        }
    }

    getResourceType(entry) {
        if (entry.initiatorType) return entry.initiatorType;
        
        const url = entry.name;
        if (url.match(/\.(js|mjs)$/)) return 'script';
        if (url.match(/\.(css)$/)) return 'stylesheet';
        if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'image';
        if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
        if (url.match(/\.(mp4|webm|ogg)$/)) return 'video';
        if (url.match(/\.(mp3|wav|ogg)$/)) return 'audio';
        
        return 'other';
    }

    handleWebVitalMetric(name, metric) {
        if (this.config.enableLogging) {
            console.log(`[PerformanceMonitor] ${name}:`, metric.value, metric.rating);
        }

        // Provide recommendations based on thresholds
        this.provideRecommendations(name, metric);

        // Dispatch custom event for other components to listen
        window.dispatchEvent(new CustomEvent('webVitalMeasured', {
            detail: { name, metric }
        }));
    }

    provideRecommendations(metricName, metric) {
        const recommendations = [];

        switch (metricName) {
            case 'LCP':
                if (metric.value > this.config.lcpThreshold) {
                    recommendations.push(
                        'LCP is slow. Consider optimizing images, preloading key resources, or using a CDN.',
                        'Remove unused JavaScript and CSS to improve loading speed.',
                        'Optimize server response times and use efficient caching strategies.'
                    );
                }
                break;
                
            case 'FID':
                if (metric.value > this.config.fidThreshold) {
                    recommendations.push(
                        'FID is high. Break up long JavaScript tasks and use web workers.',
                        'Minimize main thread blocking and defer non-critical JavaScript.',
                        'Use code splitting to reduce initial bundle size.'
                    );
                }
                break;
                
            case 'CLS':
                if (metric.value > this.config.clsThreshold) {
                    recommendations.push(
                        'CLS is high. Set explicit dimensions for images and videos.',
                        'Avoid inserting content above existing content.',
                        'Use CSS transforms instead of changing layout properties.'
                    );
                }
                break;
        }

        if (recommendations.length > 0 && this.config.enableLogging) {
            console.group(`[PerformanceMonitor] ${metricName} Recommendations:`);
            recommendations.forEach(rec => console.log('•', rec));
            console.groupEnd();
        }
    }

    optimizeLCP(metric) {
        // Automatic LCP optimization
        if (metric.entries && metric.entries.length > 0) {
            const lcpElement = metric.entries[metric.entries.length - 1]?.element;
            
            if (lcpElement) {
                // If LCP element is an image, optimize it
                if (lcpElement.tagName === 'IMG') {
                    this.optimizeLCPImage(lcpElement);
                }
                
                // If LCP element is text, optimize font loading
                if (lcpElement.tagName === 'H1' || lcpElement.tagName === 'P') {
                    this.optimizeLCPText(lcpElement);
                }
            }
        }
    }

    optimizeLCPImage(image) {
        // Add priority loading if not already present
        if (!image.hasAttribute('fetchpriority')) {
            image.setAttribute('fetchpriority', 'high');
        }
        
        // Ensure proper loading strategy
        if (!image.hasAttribute('loading') || image.getAttribute('loading') === 'lazy') {
            image.setAttribute('loading', 'eager');
        }
        
        if (this.config.enableLogging) {
            console.log('[PerformanceMonitor] Optimized LCP image:', image.src);
        }
    }

    optimizeLCPText(element) {
        // Ensure fonts are preloaded
        const computedStyle = window.getComputedStyle(element);
        const fontFamily = computedStyle.fontFamily;
        
        if (fontFamily && !document.querySelector(`link[rel="preload"][href*="${fontFamily}"]`)) {
            // This is a simplified approach - in practice, you'd need font URLs
            if (this.config.enableLogging) {
                console.log('[PerformanceMonitor] Consider preloading font for LCP text:', fontFamily);
            }
        }
    }

    analyzeNavigationMetrics() {
        const nav = this.metrics.navigation;
        const issues = [];

        if (nav.firstByte > 500) {
            issues.push('Slow server response time (TTFB > 500ms)');
        }
        
        if (nav.domProcessing > 2000) {
            issues.push('Slow DOM processing (> 2s)');
        }
        
        if (nav.pageLoad > 5000) {
            issues.push('Slow page load (> 5s)');
        }

        if (issues.length > 0 && this.config.enableLogging) {
            console.group('[PerformanceMonitor] Navigation Issues:');
            issues.forEach(issue => console.warn('•', issue));
            console.groupEnd();
        }
    }

    analyzeResourceMetrics(resource) {
        // Flag slow resources
        if (resource.duration > 1000) {
            if (this.config.enableLogging) {
                console.warn('[PerformanceMonitor] Slow resource:', resource.name, `${resource.duration}ms`);
            }
        }

        // Flag large resources
        if (resource.size > 500000) { // 500KB
            if (this.config.enableLogging) {
                console.warn('[PerformanceMonitor] Large resource:', resource.name, `${(resource.size / 1024).toFixed(1)}KB`);
            }
        }
    }

    startReporting() {
        if (this.reportingTimer) {
            clearInterval(this.reportingTimer);
        }

        this.reportingTimer = setInterval(() => {
            this.generateReport();
        }, this.config.reportingInterval);
    }

    generateReport() {
        const report = {
            timestamp: Date.now(),
            navigation: this.metrics.navigation,
            webVitals: this.metrics.webVitals,
            resourceSummary: this.getResourceSummary(),
            customMetrics: this.metrics.customMetrics,
            recommendations: this.getPerformanceRecommendations()
        };

        if (this.config.enableLogging) {
            console.group('[PerformanceMonitor] Performance Report');
            console.table(report.webVitals);
            console.log('Resource Summary:', report.resourceSummary);
            console.log('Custom Metrics:', report.customMetrics);
            if (report.recommendations.length > 0) {
                console.log('Recommendations:', report.recommendations);
            }
            console.groupEnd();
        }

        // Dispatch event for external analytics
        if (this.config.enableAnalytics) {
            window.dispatchEvent(new CustomEvent('performanceReport', {
                detail: report
            }));
        }

        return report;
    }

    getResourceSummary() {
        const resources = this.metrics.resources;
        const summary = {
            total: resources.length,
            totalSize: resources.reduce((sum, r) => sum + r.size, 0),
            totalDuration: resources.reduce((sum, r) => sum + r.duration, 0),
            byType: {}
        };

        // Group by type
        resources.forEach(resource => {
            if (!summary.byType[resource.type]) {
                summary.byType[resource.type] = { count: 0, size: 0, duration: 0 };
            }
            summary.byType[resource.type].count++;
            summary.byType[resource.type].size += resource.size;
            summary.byType[resource.type].duration += resource.duration;
        });

        return summary;
    }

    getPerformanceRecommendations() {
        const recommendations = [];
        const nav = this.metrics.navigation;
        const vitals = this.metrics.webVitals;

        // Navigation-based recommendations
        if (nav.firstByte > 500) {
            recommendations.push('Optimize server response time');
        }
        
        if (nav.domProcessing > 2000) {
            recommendations.push('Reduce DOM complexity');
        }

        // Web Vitals recommendations
        if (vitals.lcp?.value > this.config.lcpThreshold) {
            recommendations.push('Optimize Largest Contentful Paint');
        }
        
        if (vitals.fid?.value > this.config.fidThreshold) {
            recommendations.push('Reduce First Input Delay');
        }
        
        if (vitals.cls?.value > this.config.clsThreshold) {
            recommendations.push('Minimize Cumulative Layout Shift');
        }

        return recommendations;
    }

    // Public API methods
    getMetrics() {
        return { ...this.metrics };
    }

    clearMetrics() {
        this.metrics = {
            navigation: {},
            webVitals: {},
            resources: [],
            userTiming: {},
            customMetrics: {}
        };
    }

    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    destroy() {
        // Clean up observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();

        // Clear reporting timer
        if (this.reportingTimer) {
            clearInterval(this.reportingTimer);
            this.reportingTimer = null;
        }

        this.isInitialized = false;
    }

    // Static factory method
    static create(options = {}) {
        return new PerformanceMonitor(options);
    }
}