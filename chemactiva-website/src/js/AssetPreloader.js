// src/js/AssetPreloader.js
import CacheManager from './CacheManager.js';
import LoadingStateManager from './LoadingStateManager.js';

export default class AssetPreloader {
    constructor(options = {}) {
        this.cacheManager = options.cacheManager || new CacheManager();
        this.loadingStateManager = options.loadingStateManager || new LoadingStateManager();
        
        // Preloading configuration
        this.config = {
            maxConcurrentLoads: options.maxConcurrentLoads || 4,
            preloadTimeout: options.preloadTimeout || 5000,
            retryAttempts: options.retryAttempts || 2,
            priorityThreshold: options.priorityThreshold || 3,
            ...options.config
        };
        
        // Asset priority definitions
        this.priorities = {
            CRITICAL: 4,    // Logo, above-the-fold images
            HIGH: 3,        // Hero images, primary navigation assets
            NORMAL: 2,      // Secondary images, fonts
            LOW: 1          // Background images, non-essential assets
        };
        
        // Critical above-the-fold assets
        this.criticalAssets = [
            // Logo variants
            { url: '/assets/images/logo.png', type: 'image', priority: this.priorities.CRITICAL },
            { url: '/public/assets/images/logo.png', type: 'image', priority: this.priorities.CRITICAL },
            { url: './public/assets/images/logo.png', type: 'image', priority: this.priorities.CRITICAL },
            { url: '/public/assets/images/logo-small_size.png', type: 'image', priority: this.priorities.CRITICAL },
            
            // Hero section assets
            { url: '/public/assets/images/user1.jpg', type: 'image', priority: this.priorities.HIGH },
            { url: '/public/assets/images/user2.jpg', type: 'image', priority: this.priorities.HIGH },
            
            // Critical CSS (if externally loaded)
            { url: '/src/css/base.css', type: 'css', priority: this.priorities.HIGH },
            { url: '/src/css/theme.css', type: 'css', priority: this.priorities.HIGH }
        ];
        
        // Navigation pattern tracking
        this.navigationPatterns = {
            pageVisits: new Map(),
            assetRequests: new Map(),
            userBehavior: {
                averageSessionTime: 0,
                commonPaths: [],
                deviceType: this.detectDeviceType()
            }
        };
        
        // Preloading queue management
        this.preloadQueue = [];
        this.activePreloads = new Set();
        this.preloadResults = new Map();
        
        // Initialize navigation tracking
        this.initNavigationTracking();
        
        console.log('[AssetPreloader] Initialized with', this.criticalAssets.length, 'critical assets');
    }

    /**
     * Preload critical above-the-fold assets immediately
     */
    async preloadCriticalAssets() {
        console.log('[AssetPreloader] Starting critical asset preloading');
        
        const criticalAssets = this.criticalAssets.filter(asset => 
            asset.priority >= this.priorities.HIGH
        );
        
        const preloadPromises = criticalAssets.map(asset => 
            this.preloadAsset(asset.url, {
                type: asset.type,
                priority: asset.priority,
                timeout: this.config.preloadTimeout / 2, // Faster timeout for critical assets
                retries: this.config.retryAttempts + 1 // Extra retry for critical assets
            })
        );
        
        const results = await Promise.allSettled(preloadPromises);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        
        console.log(`[AssetPreloader] Critical asset preloading completed: ${successful}/${criticalAssets.length} successful`);
        
        // Trigger immediate cache warming for successful assets
        if (successful > 0) {
            this.warmCacheForCriticalAssets();
        }
        
        return {
            total: criticalAssets.length,
            successful,
            failed: criticalAssets.length - successful,
            results
        };
    }

    /**
     * Intelligent preloading based on user navigation patterns
     */
    async preloadBasedOnPatterns() {
        console.log('[AssetPreloader] Starting pattern-based preloading');
        
        const predictedAssets = this.predictNextAssets();
        const preloadCandidates = this.prioritizePreloadCandidates(predictedAssets);
        
        // Limit concurrent preloads to avoid overwhelming the network
        const assetsToPreload = preloadCandidates.slice(0, this.config.maxConcurrentLoads);
        
        if (assetsToPreload.length === 0) {
            console.log('[AssetPreloader] No assets predicted for preloading');
            return { total: 0, successful: 0, failed: 0 };
        }
        
        const preloadPromises = assetsToPreload.map(asset => 
            this.preloadAsset(asset.url, {
                type: asset.type,
                priority: asset.priority,
                reason: 'pattern-based'
            })
        );
        
        const results = await Promise.allSettled(preloadPromises);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        
        console.log(`[AssetPreloader] Pattern-based preloading completed: ${successful}/${assetsToPreload.length} successful`);
        
        return {
            total: assetsToPreload.length,
            successful,
            failed: assetsToPreload.length - successful,
            predictedAssets: predictedAssets.length,
            results
        };
    }

    /**
     * Create priority-based loading system for different asset types
     */
    async preloadByPriority(minPriority = this.priorities.NORMAL) {
        console.log(`[AssetPreloader] Starting priority-based preloading (min priority: ${minPriority})`);
        
        // Get all assets that meet the minimum priority threshold
        const priorityAssets = this.getAllAssetsByPriority(minPriority);
        
        // Sort by priority (highest first)
        priorityAssets.sort((a, b) => b.priority - a.priority);
        
        // Process in batches to avoid overwhelming the network
        const batchSize = this.config.maxConcurrentLoads;
        const results = [];
        
        for (let i = 0; i < priorityAssets.length; i += batchSize) {
            const batch = priorityAssets.slice(i, i + batchSize);
            
            const batchPromises = batch.map(asset => 
                this.preloadAsset(asset.url, {
                    type: asset.type,
                    priority: asset.priority,
                    reason: 'priority-based'
                })
            );
            
            const batchResults = await Promise.allSettled(batchPromises);
            results.push(...batchResults);
            
            // Small delay between batches to prevent overwhelming
            if (i + batchSize < priorityAssets.length) {
                await this.delay(100);
            }
        }
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        
        console.log(`[AssetPreloader] Priority-based preloading completed: ${successful}/${priorityAssets.length} successful`);
        
        return {
            total: priorityAssets.length,
            successful,
            failed: priorityAssets.length - successful,
            results
        };
    }

    /**
     * Preload a single asset with comprehensive error handling
     */
    async preloadAsset(url, options = {}) {
        const assetId = this.generateAssetId(url);
        
        // Check if already cached
        if (this.cacheManager.has(url)) {
            console.log(`[AssetPreloader] Asset already cached: ${url}`);
            return this.cacheManager.get(url);
        }
        
        // Check if already being preloaded
        if (this.activePreloads.has(assetId)) {
            console.log(`[AssetPreloader] Asset already being preloaded: ${url}`);
            return this.waitForPreload(assetId);
        }
        
        // Register loading state
        this.loadingStateManager.registerLoadingState(assetId, {
            url,
            type: options.type || 'unknown',
            priority: options.priority || this.priorities.NORMAL,
            reason: options.reason || 'manual'
        });
        
        this.activePreloads.add(assetId);
        
        try {
            const asset = await this.performPreload(url, options);
            
            // Cache the successful result
            this.cacheManager.set(url, asset, {
                type: options.type,
                priority: options.priority,
                url: url,
                metadata: {
                    preloadTime: Date.now(),
                    reason: options.reason
                }
            });
            
            // Update loading state
            this.loadingStateManager.updateLoadingState(assetId, {
                status: 'loaded',
                loadTime: Date.now()
            });
            
            this.preloadResults.set(assetId, { success: true, asset });
            
            console.log(`[AssetPreloader] Successfully preloaded: ${url}`);
            return asset;
            
        } catch (error) {
            // Handle preload failure
            this.loadingStateManager.handleLoadingFailure(assetId, options.type, error, 'preload-failed');
            this.preloadResults.set(assetId, { success: false, error });
            
            console.warn(`[AssetPreloader] Failed to preload: ${url}`, error);
            throw error;
            
        } finally {
            this.activePreloads.delete(assetId);
        }
    }

    /**
     * Perform the actual preload operation
     */
    async performPreload(url, options = {}) {
        const timeout = options.timeout || this.config.preloadTimeout;
        const retries = options.retries || this.config.retryAttempts;
        
        let lastError;
        
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                if (attempt > 0) {
                    console.log(`[AssetPreloader] Retry attempt ${attempt} for: ${url}`);
                    await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
                }
                
                return await this.loadAssetWithTimeout(url, options, timeout);
                
            } catch (error) {
                lastError = error;
                console.warn(`[AssetPreloader] Attempt ${attempt + 1} failed for: ${url}`, error);
            }
        }
        
        throw lastError;
    }

    /**
     * Load asset with timeout
     */
    async loadAssetWithTimeout(url, options, timeout) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Preload timeout for: ${url}`));
            }, timeout);
            
            const assetType = options.type || this.detectAssetType(url);
            
            if (assetType === 'image') {
                this.preloadImage(url, resolve, reject, timeoutId);
            } else if (assetType === 'css') {
                this.preloadCSS(url, resolve, reject, timeoutId);
            } else {
                this.preloadGeneric(url, resolve, reject, timeoutId);
            }
        });
    }

    /**
     * Preload image asset
     */
    preloadImage(url, resolve, reject, timeoutId) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
            clearTimeout(timeoutId);
            resolve({
                type: 'image',
                url: url,
                element: img,
                width: img.width,
                height: img.height,
                size: this.estimateImageSize(img)
            });
        };
        
        img.onerror = () => {
            clearTimeout(timeoutId);
            reject(new Error(`Failed to preload image: ${url}`));
        };
        
        img.src = url;
    }

    /**
     * Preload CSS asset
     */
    preloadCSS(url, resolve, reject, timeoutId) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = url;
        
        link.onload = () => {
            clearTimeout(timeoutId);
            resolve({
                type: 'css',
                url: url,
                element: link
            });
        };
        
        link.onerror = () => {
            clearTimeout(timeoutId);
            reject(new Error(`Failed to preload CSS: ${url}`));
        };
        
        document.head.appendChild(link);
    }

    /**
     * Preload generic asset
     */
    async preloadGeneric(url, resolve, reject, timeoutId) {
        try {
            const response = await fetch(url, { cache: 'default' });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const blob = await response.blob();
            
            clearTimeout(timeoutId);
            resolve({
                type: this.detectAssetType(url),
                url: url,
                blob: blob,
                size: blob.size
            });
            
        } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
        }
    }

    /**
     * Predict next assets based on navigation patterns
     */
    predictNextAssets() {
        const currentPage = window.location.pathname;
        const predictions = [];
        
        // Get common navigation patterns from this page
        const pageData = this.navigationPatterns.pageVisits.get(currentPage);
        if (pageData && pageData.nextPages) {
            pageData.nextPages.forEach((count, nextPage) => {
                const probability = count / pageData.totalVisits;
                if (probability > 0.3) { // 30% threshold
                    predictions.push(...this.getPageAssets(nextPage, probability));
                }
            });
        }
        
        // Add device-specific predictions
        if (this.navigationPatterns.userBehavior.deviceType === 'mobile') {
            predictions.push(...this.getMobileOptimizedAssets());
        }
        
        // Add time-based predictions (e.g., product images during business hours)
        const hour = new Date().getHours();
        if (hour >= 9 && hour <= 17) { // Business hours
            predictions.push(...this.getBusinessHourAssets());
        }
        
        return predictions;
    }

    /**
     * Get assets for a specific page
     */
    getPageAssets(pagePath, probability = 1) {
        const assets = [];
        
        if (pagePath.includes('products')) {
            assets.push(
                { url: '/public/assets/images/products/Domestic_oil_spill_kit_1.webp', type: 'image', priority: this.priorities.HIGH * probability },
                { url: '/public/assets/images/products/Marine_oil_spill_kit.webp', type: 'image', priority: this.priorities.HIGH * probability },
                { url: '/public/assets/images/products/Nano_cellulose_1.webp', type: 'image', priority: this.priorities.NORMAL * probability }
            );
        } else if (pagePath.includes('blog')) {
            assets.push(
                { url: '/src/css/articles.css', type: 'css', priority: this.priorities.NORMAL * probability }
            );
        }
        
        return assets;
    }

    /**
     * Get mobile-optimized assets
     */
    getMobileOptimizedAssets() {
        return [
            { url: '/public/assets/images/logo-small_size.png', type: 'image', priority: this.priorities.HIGH },
            // Prioritize smaller images for mobile
            ...this.criticalAssets.filter(asset => 
                asset.url.includes('small') || asset.url.includes('mobile')
            )
        ];
    }

    /**
     * Get business hour specific assets
     */
    getBusinessHourAssets() {
        return [
            { url: '/public/assets/images/products/Domestic_oil_spill_kit_1.webp', type: 'image', priority: this.priorities.NORMAL },
            { url: '/public/assets/resources/domestic-oil-spill-kit-datasheet.pdf', type: 'document', priority: this.priorities.LOW }
        ];
    }

    /**
     * Prioritize preload candidates based on multiple factors
     */
    prioritizePreloadCandidates(candidates) {
        return candidates
            .filter(asset => !this.cacheManager.has(asset.url)) // Not already cached
            .sort((a, b) => {
                // Sort by priority, then by predicted usage
                if (a.priority !== b.priority) {
                    return b.priority - a.priority;
                }
                return (b.probability || 0) - (a.probability || 0);
            });
    }

    /**
     * Get all assets by minimum priority
     */
    getAllAssetsByPriority(minPriority) {
        const allAssets = [...this.criticalAssets];
        
        // Add dynamic assets based on current page
        const currentPage = window.location.pathname;
        if (currentPage.includes('products')) {
            allAssets.push(...this.getProductPageAssets());
        }
        
        return allAssets.filter(asset => asset.priority >= minPriority);
    }

    /**
     * Get product page specific assets
     */
    getProductPageAssets() {
        return [
            { url: '/public/assets/images/products/Domestic_oil_spill_kit_1.webp', type: 'image', priority: this.priorities.HIGH },
            { url: '/public/assets/images/products/Domestic_oil_spill_kit_collage_1.webp', type: 'image', priority: this.priorities.NORMAL },
            { url: '/public/assets/images/products/Marine_oil_spill_kit.webp', type: 'image', priority: this.priorities.HIGH },
            { url: '/public/assets/images/products/Nano_cellulose_1.webp', type: 'image', priority: this.priorities.NORMAL },
            { url: '/public/assets/images/products/Nano_cellulose_2.webp', type: 'image', priority: this.priorities.LOW },
            { url: '/src/css/products.css', type: 'css', priority: this.priorities.NORMAL }
        ];
    }

    /**
     * Warm cache for critical assets
     */
    async warmCacheForCriticalAssets() {
        const criticalUrls = this.criticalAssets
            .filter(asset => asset.priority >= this.priorities.HIGH)
            .map(asset => asset.url);
        
        await this.cacheManager.warmCache(criticalUrls);
    }

    /**
     * Initialize navigation tracking for pattern learning
     */
    initNavigationTracking() {
        // Track page visits
        const currentPage = window.location.pathname;
        this.trackPageVisit(currentPage);
        
        // Track navigation events
        window.addEventListener('beforeunload', () => {
            this.trackPageExit(currentPage);
        });
        
        // Track asset requests
        this.trackAssetRequests();
    }

    /**
     * Track page visit for pattern learning
     */
    trackPageVisit(page) {
        if (!this.navigationPatterns.pageVisits.has(page)) {
            this.navigationPatterns.pageVisits.set(page, {
                totalVisits: 0,
                nextPages: new Map(),
                assetRequests: new Set()
            });
        }
        
        const pageData = this.navigationPatterns.pageVisits.get(page);
        pageData.totalVisits++;
        
        // Track previous page relationship
        const previousPage = document.referrer ? new URL(document.referrer).pathname : null;
        if (previousPage && this.navigationPatterns.pageVisits.has(previousPage)) {
            const prevPageData = this.navigationPatterns.pageVisits.get(previousPage);
            const nextPageCount = prevPageData.nextPages.get(page) || 0;
            prevPageData.nextPages.set(page, nextPageCount + 1);
        }
    }

    /**
     * Track page exit
     */
    trackPageExit(page) {
        // Could be used for session time tracking
        console.log(`[AssetPreloader] Page exit tracked: ${page}`);
    }

    /**
     * Track asset requests for pattern learning
     */
    trackAssetRequests() {
        // Override fetch to track asset requests
        const originalFetch = window.fetch;
        window.fetch = (...args) => {
            const url = args[0];
            if (typeof url === 'string' && this.isAssetUrl(url)) {
                this.recordAssetRequest(url);
            }
            return originalFetch.apply(window, args);
        };
    }

    /**
     * Record asset request for pattern analysis
     */
    recordAssetRequest(url) {
        const currentPage = window.location.pathname;
        const pageData = this.navigationPatterns.pageVisits.get(currentPage);
        
        if (pageData) {
            pageData.assetRequests.add(url);
        }
        
        const requestCount = this.navigationPatterns.assetRequests.get(url) || 0;
        this.navigationPatterns.assetRequests.set(url, requestCount + 1);
    }

    /**
     * Utility methods
     */
    
    generateAssetId(url) {
        return url.replace(/[^a-zA-Z0-9]/g, '_');
    }

    detectAssetType(url) {
        const extension = url.split('.').pop()?.toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
            return 'image';
        } else if (['css'].includes(extension)) {
            return 'css';
        } else if (['js'].includes(extension)) {
            return 'javascript';
        } else if (['woff', 'woff2', 'ttf', 'otf'].includes(extension)) {
            return 'font';
        } else if (['pdf', 'doc', 'docx'].includes(extension)) {
            return 'document';
        } else {
            return 'unknown';
        }
    }

    detectDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/mobile|android|iphone|ipad|tablet/.test(userAgent)) {
            return 'mobile';
        } else {
            return 'desktop';
        }
    }

    isAssetUrl(url) {
        return /\.(jpg|jpeg|png|gif|webp|svg|css|js|woff|woff2|ttf|otf|pdf)$/i.test(url);
    }

    estimateImageSize(img) {
        return (img.width || 400) * (img.height || 300) * 4; // RGBA estimation
    }

    async waitForPreload(assetId) {
        return new Promise((resolve, reject) => {
            const checkResult = () => {
                const result = this.preloadResults.get(assetId);
                if (result) {
                    if (result.success) {
                        resolve(result.asset);
                    } else {
                        reject(result.error);
                    }
                } else {
                    setTimeout(checkResult, 100);
                }
            };
            checkResult();
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get preloading statistics
     */
    getStats() {
        const totalPreloads = this.preloadResults.size;
        const successful = Array.from(this.preloadResults.values()).filter(r => r.success).length;
        
        return {
            totalPreloads,
            successful,
            failed: totalPreloads - successful,
            successRate: totalPreloads > 0 ? (successful / totalPreloads * 100).toFixed(2) + '%' : '0%',
            activePreloads: this.activePreloads.size,
            cacheStats: this.cacheManager.getStats(),
            navigationPatterns: {
                pagesTracked: this.navigationPatterns.pageVisits.size,
                assetsTracked: this.navigationPatterns.assetRequests.size,
                deviceType: this.navigationPatterns.userBehavior.deviceType
            }
        };
    }

    /**
     * Cleanup method
     */
    cleanup() {
        // Clear active preloads
        this.activePreloads.clear();
        this.preloadResults.clear();
        
        // Restore original fetch if overridden
        if (window.fetch !== fetch) {
            window.fetch = fetch;
        }
        
        console.log('[AssetPreloader] Cleanup completed');
    }
}