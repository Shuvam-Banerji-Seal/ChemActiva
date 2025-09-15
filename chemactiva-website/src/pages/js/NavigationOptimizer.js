// src/js/NavigationOptimizer.js
import globalAssetCache from './GlobalAssetCache.js';

/**
 * NavigationOptimizer - Prevents asset reloading during page transitions
 * Optimizes navigation performance by maintaining asset cache across pages
 */
class NavigationOptimizer {
    constructor() {
        this.isInitialized = false;
        this.preloadedPages = new Set();
        this.navigationQueue = [];
        this.isPreloading = false;
        
        // Track navigation patterns
        this.navigationPatterns = {
            commonPaths: new Map(),
            userBehavior: {
                averageTimeOnPage: 0,
                mostVisitedPages: new Map(),
                navigationSequences: []
            }
        };
        
        this.init();
    }

    /**
     * Initialize navigation optimization
     */
    init() {
        if (this.isInitialized) return;
        
        console.log('[NavigationOptimizer] Initializing navigation optimization');
        
        // Set up navigation event listeners
        this.setupNavigationListeners();
        
        // Preload critical assets for likely next pages
        this.preloadCriticalAssets();
        
        // Set up intersection observer for link preloading
        this.setupLinkPreloading();
        
        this.isInitialized = true;
        console.log('[NavigationOptimizer] Navigation optimization initialized');
    }

    /**
     * Set up navigation event listeners
     */
    setupNavigationListeners() {
        // Intercept link clicks for smart preloading
        document.addEventListener('click', (event) => {
            // Ensure event.target is an Element before calling closest
            if (event.target && typeof event.target.closest === 'function') {
                const link = event.target.closest('a[href]');
                if (link && this.isInternalLink(link.href)) {
                    this.handleLinkClick(link, event);
                }
            }
        });

        // Preload on hover (desktop) or touch start (mobile)
        document.addEventListener('mouseenter', (event) => {
            const link = event.target.closest('a[href]');
            if (link && this.isInternalLink(link.href)) {
                this.preloadPageAssets(link.href);
            }
        }, true);

        document.addEventListener('touchstart', (event) => {
            const link = event.target.closest('a[href]');
            if (link && this.isInternalLink(link.href)) {
                this.preloadPageAssets(link.href);
            }
        }, true);

        // Track page visibility for optimization decisions
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.handlePageVisible();
            }
        });
    }

    /**
     * Check if link is internal
     */
    isInternalLink(href) {
        try {
            const url = new URL(href, window.location.origin);
            return url.origin === window.location.origin;
        } catch (error) {
            return false;
        }
    }

    /**
     * Handle link click with optimization
     */
    handleLinkClick(link, event) {
        const href = link.href;
        const targetPage = this.getPageTypeFromUrl(href);
        
        console.log(`[NavigationOptimizer] Link clicked to: ${targetPage}`);
        
        // Track navigation pattern
        this.trackNavigation(window.location.pathname, href);
        
        // If assets are already preloaded, navigation will be faster
        if (this.preloadedPages.has(href)) {
            console.log(`[NavigationOptimizer] Assets already preloaded for: ${href}`);
        } else {
            // Start preloading immediately for faster navigation
            this.preloadPageAssets(href, { priority: 'urgent' });
        }
    }

    /**
     * Preload assets for a specific page
     */
    async preloadPageAssets(href, options = {}) {
        if (this.preloadedPages.has(href)) {
            return; // Already preloaded
        }

        const pageType = this.getPageTypeFromUrl(href);
        const assets = this.getAssetsForPageType(pageType);
        
        if (assets.length === 0) {
            return;
        }

        console.log(`[NavigationOptimizer] Preloading assets for ${pageType} page:`, assets.length, 'assets');
        
        try {
            const preloadPromises = assets.map(asset => 
                this.preloadSingleAsset(asset, options)
            );
            
            // Don't wait for all assets, just start the process
            if (options.priority === 'urgent') {
                // For urgent preloading (user clicked), wait for critical assets
                const criticalAssets = assets.filter(a => a.priority === 'critical');
                await Promise.allSettled(criticalAssets.map(asset => 
                    this.preloadSingleAsset(asset, options)
                ));
            } else {
                // For background preloading, don't block
                Promise.allSettled(preloadPromises).then(results => {
                    const successful = results.filter(r => r.status === 'fulfilled').length;
                    console.log(`[NavigationOptimizer] Background preloading completed: ${successful}/${assets.length} assets`);
                });
            }
            
            this.preloadedPages.add(href);
            
        } catch (error) {
            console.warn(`[NavigationOptimizer] Failed to preload assets for ${href}:`, error);
        }
    }

    /**
     * Preload a single asset
     */
    async preloadSingleAsset(asset, options = {}) {
        // Check if already in global cache
        if (globalAssetCache.has(asset.key || asset.url)) {
            return globalAssetCache.get(asset.key || asset.url);
        }

        try {
            const loadedAsset = await this.loadAsset(asset.url, asset.type, options);
            
            // Store in global cache
            globalAssetCache.set(asset.key || asset.url, loadedAsset, {
                type: asset.type,
                priority: asset.priority || 'normal',
                persistent: asset.priority === 'critical'
            });
            
            return loadedAsset;
            
        } catch (error) {
            console.warn(`[NavigationOptimizer] Failed to preload asset ${asset.url}:`, error);
            throw error;
        }
    }

    /**
     * Load asset with appropriate method based on type
     */
    async loadAsset(url, type, options = {}) {
        const timeout = options.priority === 'urgent' ? 2000 : 5000;
        
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Timeout loading ${type}: ${url}`));
            }, timeout);

            if (type === 'image') {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                img.onload = () => {
                    clearTimeout(timeoutId);
                    resolve({
                        type: 'image',
                        element: img,
                        url: url,
                        width: img.width,
                        height: img.height
                    });
                };
                
                img.onerror = () => {
                    clearTimeout(timeoutId);
                    reject(new Error(`Failed to load image: ${url}`));
                };
                
                img.src = url;
                
            } else if (type === 'css') {
                // For CSS, create a link element but don't append it yet
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'style';
                link.href = url;
                
                link.onload = () => {
                    clearTimeout(timeoutId);
                    resolve({
                        type: 'css',
                        element: link,
                        url: url
                    });
                };
                
                link.onerror = () => {
                    clearTimeout(timeoutId);
                    reject(new Error(`Failed to load CSS: ${url}`));
                };
                
                document.head.appendChild(link);
                
            } else {
                // Generic fetch for other types
                fetch(url, { cache: 'default' })
                    .then(response => {
                        clearTimeout(timeoutId);
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        return response.blob();
                    })
                    .then(blob => {
                        resolve({
                            type: type,
                            url: url,
                            blob: blob,
                            size: blob.size
                        });
                    })
                    .catch(error => {
                        clearTimeout(timeoutId);
                        reject(error);
                    });
            }
        });
    }

    /**
     * Get page type from URL
     */
    getPageTypeFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const path = urlObj.pathname;
            
            if (path === '/' || path === '/index.html') {
                return 'homepage';
            } else if (path.includes('products')) {
                return 'products';
            } else if (path.includes('blog')) {
                return 'blog';
            } else if (path.includes('innovation')) {
                return 'innovation';
            } else {
                return 'other';
            }
        } catch (error) {
            return 'other';
        }
    }

    /**
     * Get assets required for a specific page type
     */
    getAssetsForPageType(pageType) {
        const assetMap = {
            homepage: [
                { key: 'logo-main', url: '/assets/images/logo.png', type: 'image', priority: 'critical' },
                { key: 'logo-small', url: '/assets/images/logo-small_size.png', type: 'image', priority: 'critical' },
                { key: 'hero-user1', url: '/assets/images/user1.jpg', type: 'image', priority: 'high' },
                { key: 'hero-user2', url: '/assets/images/user2.jpg', type: 'image', priority: 'high' },
                { key: 'team-data', url: '/team.jsonl', type: 'data', priority: 'normal' },
                { key: 'journey-data', url: '/journey.jsonl', type: 'data', priority: 'normal' }
            ],
            products: [
                { key: 'logo-main', url: '/assets/images/logo.png', type: 'image', priority: 'critical' },
                { key: 'product-domestic-kit', url: '/assets/images/products/Domestic_oil_spill_kit_1.webp', type: 'image', priority: 'high' },
                { key: 'product-marine-kit', url: '/assets/images/products/Marine_oil_spill_kit.webp', type: 'image', priority: 'high' },
                { key: 'product-nano-cellulose', url: '/assets/images/products/Nano_cellulose_1.webp', type: 'image', priority: 'normal' }
            ],
            blog: [
                { key: 'logo-main', url: '/assets/images/logo.png', type: 'image', priority: 'critical' },
                { key: 'blog-data', url: '/blog.jsonl', type: 'data', priority: 'high' }
            ],
            innovation: [
                { key: 'logo-main', url: '/assets/images/logo.png', type: 'image', priority: 'critical' }
            ],
            other: [
                { key: 'logo-main', url: '/assets/images/logo.png', type: 'image', priority: 'critical' }
            ]
        };

        return assetMap[pageType] || assetMap.other;
    }

    /**
     * Preload critical assets for current and likely next pages
     */
    async preloadCriticalAssets() {
        console.log('[NavigationOptimizer] Preloading critical assets');
        
        // Always preload logo assets
        await globalAssetCache.preloadCriticalAssets();
        
        // Preload assets for current page type
        const currentPageType = this.getPageTypeFromUrl(window.location.href);
        const currentPageAssets = this.getAssetsForPageType(currentPageType);
        
        const criticalAssets = currentPageAssets.filter(asset => asset.priority === 'critical');
        
        for (const asset of criticalAssets) {
            try {
                await this.preloadSingleAsset(asset, { priority: 'critical' });
            } catch (error) {
                console.warn(`[NavigationOptimizer] Failed to preload critical asset ${asset.url}:`, error);
            }
        }
        
        // Preload likely next pages based on current page
        this.preloadLikelyNextPages();
    }

    /**
     * Preload likely next pages based on navigation patterns
     */
    preloadLikelyNextPages() {
        const currentPageType = this.getPageTypeFromUrl(window.location.href);
        const likelyNextPages = this.getLikelyNextPages(currentPageType);
        
        // Preload assets for likely next pages (background, low priority)
        likelyNextPages.forEach(pageType => {
            const assets = this.getAssetsForPageType(pageType);
            const highPriorityAssets = assets.filter(asset => 
                asset.priority === 'critical' || asset.priority === 'high'
            );
            
            // Preload with delay to not interfere with current page
            setTimeout(() => {
                highPriorityAssets.forEach(asset => {
                    this.preloadSingleAsset(asset, { priority: 'background' })
                        .catch(error => {
                            // Silently fail for background preloading
                        });
                });
            }, 2000);
        });
    }

    /**
     * Get likely next pages based on current page and patterns
     */
    getLikelyNextPages(currentPageType) {
        const navigationMap = {
            homepage: ['products', 'blog'],
            products: ['homepage'],
            blog: ['homepage'],
            innovation: ['homepage', 'products'],
            other: ['homepage']
        };

        return navigationMap[currentPageType] || ['homepage'];
    }

    /**
     * Set up intersection observer for link preloading
     */
    setupLinkPreloading() {
        if (!('IntersectionObserver' in window)) {
            return; // Fallback for older browsers
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const link = entry.target;
                    if (link.href && this.isInternalLink(link.href)) {
                        // Preload when link becomes visible
                        this.preloadPageAssets(link.href, { priority: 'background' });
                        observer.unobserve(link); // Only preload once
                    }
                }
            });
        }, {
            rootMargin: '100px' // Start preloading when link is 100px away from viewport
        });

        // Observe all internal links
        document.querySelectorAll('a[href]').forEach(link => {
            if (this.isInternalLink(link.href)) {
                observer.observe(link);
            }
        });
    }

    /**
     * Track navigation patterns for optimization
     */
    trackNavigation(fromPath, toPath) {
        const navigationKey = `${fromPath} -> ${toPath}`;
        const count = this.navigationPatterns.commonPaths.get(navigationKey) || 0;
        this.navigationPatterns.commonPaths.set(navigationKey, count + 1);
        
        // Track page visits
        const pageCount = this.navigationPatterns.userBehavior.mostVisitedPages.get(toPath) || 0;
        this.navigationPatterns.userBehavior.mostVisitedPages.set(toPath, pageCount + 1);
        
        console.log(`[NavigationOptimizer] Navigation tracked: ${navigationKey} (${count + 1} times)`);
    }

    /**
     * Handle page becoming visible
     */
    handlePageVisible() {
        // Refresh preloading when page becomes visible
        if (!this.isPreloading) {
            this.isPreloading = true;
            
            setTimeout(() => {
                this.preloadLikelyNextPages();
                this.isPreloading = false;
            }, 1000);
        }
    }

    /**
     * Get optimization statistics
     */
    getStats() {
        return {
            preloadedPages: this.preloadedPages.size,
            navigationPatterns: {
                commonPaths: Array.from(this.navigationPatterns.commonPaths.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10),
                mostVisitedPages: Array.from(this.navigationPatterns.userBehavior.mostVisitedPages.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
            },
            globalCacheStats: globalAssetCache.getStats()
        };
    }

    /**
     * Clear preloaded pages cache
     */
    clearPreloadCache() {
        this.preloadedPages.clear();
        console.log('[NavigationOptimizer] Preload cache cleared');
    }
}

// Create global instance
const navigationOptimizer = new NavigationOptimizer();

export default navigationOptimizer;