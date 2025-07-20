// src/js/AssetLoadingManager.js
import CacheManager from './CacheManager.js';
import AssetPreloader from './AssetPreloader.js';
import LoadingStateManager from './LoadingStateManager.js';

export default class AssetLoadingManager {
    constructor(options = {}) {
        this.cacheManager = options.cacheManager || new CacheManager();
        this.loadingStateManager = options.loadingStateManager || new LoadingStateManager();
        this.assetPreloader = options.assetPreloader || new AssetPreloader({
            cacheManager: this.cacheManager,
            loadingStateManager: this.loadingStateManager
        });
        
        this.loadingPromises = new Map();
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        this.baseRetryDelay = 1000; // 1 second
        
        this.criticalAssets = [
            '/assets/images/logo.png',
            '/public/assets/images/logo.png',
            './public/assets/images/logo.png',
            '/public/assets/images/logo-small_size.png'
        ];
        
        console.log('[AssetLoadingManager] Initialized with CacheManager and AssetPreloader');
    }

    /**
     * Preload critical assets including logo using AssetPreloader
     */
    async preloadCriticalAssets() {
        console.log('[AssetLoadingManager] Preloading critical assets via AssetPreloader');
        
        try {
            const result = await this.assetPreloader.preloadCriticalAssets();
            console.log(`[AssetLoadingManager] Critical asset preloading completed: ${result.successful}/${result.total} successful`);
            return result.successful > 0;
        } catch (error) {
            console.error('[AssetLoadingManager] Critical asset preloading failed:', error);
            
            // Fallback to direct loading
            return await this.fallbackPreloadCriticalAssets();
        }
    }

    /**
     * Fallback preloading method
     */
    async fallbackPreloadCriticalAssets() {
        console.log('[AssetLoadingManager] Using fallback preloading method');
        
        const preloadPromises = this.criticalAssets.map(async (assetUrl) => {
            try {
                await this.loadAssetWithRetry(assetUrl, { 
                    priority: 'critical',
                    preload: true 
                });
                console.log(`[AssetLoadingManager] Successfully preloaded: ${assetUrl}`);
            } catch (error) {
                console.warn(`[AssetLoadingManager] Failed to preload: ${assetUrl}`, error);
            }
        });

        const results = await Promise.allSettled(preloadPromises);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        
        console.log(`[AssetLoadingManager] Fallback preloaded ${successful}/${this.criticalAssets.length} critical assets`);
        return successful > 0;
    }

    /**
     * Strategic preloading based on user navigation patterns
     */
    async preloadBasedOnPatterns() {
        console.log('[AssetLoadingManager] Starting pattern-based preloading');
        
        try {
            const result = await this.assetPreloader.preloadBasedOnPatterns();
            console.log(`[AssetLoadingManager] Pattern-based preloading completed: ${result.successful}/${result.total} successful`);
            return result;
        } catch (error) {
            console.error('[AssetLoadingManager] Pattern-based preloading failed:', error);
            return { total: 0, successful: 0, failed: 0 };
        }
    }

    /**
     * Priority-based preloading for different asset types
     */
    async preloadByPriority(minPriority = 2) {
        console.log(`[AssetLoadingManager] Starting priority-based preloading (min priority: ${minPriority})`);
        
        try {
            const result = await this.assetPreloader.preloadByPriority(minPriority);
            console.log(`[AssetLoadingManager] Priority-based preloading completed: ${result.successful}/${result.total} successful`);
            return result;
        } catch (error) {
            console.error('[AssetLoadingManager] Priority-based preloading failed:', error);
            return { total: 0, successful: 0, failed: 0 };
        }
    }

    /**
     * Warm cache for critical assets
     */
    async warmCache() {
        console.log('[AssetLoadingManager] Warming cache for critical assets');
        
        try {
            await this.cacheManager.warmCache(this.criticalAssets);
            await this.assetPreloader.warmCacheForCriticalAssets();
            console.log('[AssetLoadingManager] Cache warming completed');
        } catch (error) {
            console.error('[AssetLoadingManager] Cache warming failed:', error);
        }
    }

    /**
     * Load asset with retry mechanism and exponential backoff
     */
    async loadAssetWithRetry(assetUrl, options = {}) {
        const cacheKey = this.getCacheKey(assetUrl);
        
        // Check if already loading
        if (this.loadingPromises.has(cacheKey)) {
            return this.loadingPromises.get(cacheKey);
        }

        // Check cache first using CacheManager
        const cachedAsset = this.cacheManager.get(assetUrl);
        if (cachedAsset) {
            console.log(`[AssetLoadingManager] Using cached asset: ${assetUrl}`);
            return cachedAsset;
        }

        // Create loading promise
        const loadingPromise = this.performAssetLoad(assetUrl, options);
        this.loadingPromises.set(cacheKey, loadingPromise);

        try {
            const result = await loadingPromise;
            this.loadingPromises.delete(cacheKey);
            return result;
        } catch (error) {
            this.loadingPromises.delete(cacheKey);
            throw error;
        }
    }

    /**
     * Perform the actual asset loading with retry logic
     */
    async performAssetLoad(assetUrl, options = {}) {
        const cacheKey = this.getCacheKey(assetUrl);
        let attempts = this.retryAttempts.get(cacheKey) || 0;

        while (attempts < this.maxRetries) {
            try {
                console.log(`[AssetLoadingManager] Loading ${assetUrl} (attempt ${attempts + 1}/${this.maxRetries})`);
                
                const asset = await this.loadSingleAsset(assetUrl, options);
                
                // Cache successful load using CacheManager
                this.cacheManager.set(assetUrl, asset, {
                    priority: options.priority === 'critical' ? this.cacheManager.priorities.CRITICAL : this.cacheManager.priorities.NORMAL,
                    type: asset.type,
                    url: assetUrl,
                    metadata: {
                        loadTime: Date.now(),
                        attempts: attempts + 1
                    }
                });
                this.retryAttempts.delete(cacheKey);
                
                return asset;
                
            } catch (error) {
                attempts++;
                this.retryAttempts.set(cacheKey, attempts);
                
                if (attempts >= this.maxRetries) {
                    console.error(`[AssetLoadingManager] Failed to load ${assetUrl} after ${this.maxRetries} attempts:`, error);
                    throw error;
                }
                
                // Exponential backoff
                const delay = this.baseRetryDelay * Math.pow(2, attempts - 1);
                console.warn(`[AssetLoadingManager] Retrying ${assetUrl} in ${delay}ms (attempt ${attempts})`);
                
                await this.delay(delay);
            }
        }
    }

    /**
     * Load a single asset (image, css, js, etc.)
     */
    async loadSingleAsset(assetUrl, options = {}) {
        return new Promise((resolve, reject) => {
            const timeout = options.timeout || 5000; // 5 second timeout
            let timeoutId;

            // Determine asset type
            const assetType = this.getAssetType(assetUrl);
            
            if (assetType === 'image') {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                
                timeoutId = setTimeout(() => {
                    reject(new Error(`Timeout loading image: ${assetUrl}`));
                }, timeout);
                
                img.onload = () => {
                    clearTimeout(timeoutId);
                    resolve({
                        type: 'image',
                        url: assetUrl,
                        element: img,
                        width: img.width,
                        height: img.height,
                        size: this.estimateImageSize(img)
                    });
                };
                
                img.onerror = () => {
                    clearTimeout(timeoutId);
                    reject(new Error(`Failed to load image: ${assetUrl}`));
                };
                
                img.src = assetUrl;
                
            } else if (assetType === 'css') {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.type = 'text/css';
                
                timeoutId = setTimeout(() => {
                    reject(new Error(`Timeout loading CSS: ${assetUrl}`));
                }, timeout);
                
                link.onload = () => {
                    clearTimeout(timeoutId);
                    resolve({
                        type: 'css',
                        url: assetUrl,
                        element: link
                    });
                };
                
                link.onerror = () => {
                    clearTimeout(timeoutId);
                    reject(new Error(`Failed to load CSS: ${assetUrl}`));
                };
                
                link.href = assetUrl;
                if (!options.preload) {
                    document.head.appendChild(link);
                }
                
            } else {
                // Generic fetch for other asset types
                const controller = new AbortController();
                timeoutId = setTimeout(() => {
                    controller.abort();
                    reject(new Error(`Timeout loading asset: ${assetUrl}`));
                }, timeout);
                
                fetch(assetUrl, { 
                    signal: controller.signal,
                    cache: 'default'
                })
                .then(response => {
                    clearTimeout(timeoutId);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.blob();
                })
                .then(blob => {
                    resolve({
                        type: assetType,
                        url: assetUrl,
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
     * Get the first available logo from critical assets
     */
    async getAvailableLogo() {
        console.log('[AssetLoadingManager] Finding available logo');
        
        for (const logoPath of this.criticalAssets) {
            try {
                const logo = await this.loadAssetWithRetry(logoPath, { 
                    priority: 'critical',
                    timeout: 2000 // Shorter timeout for logo detection
                });
                
                console.log(`[AssetLoadingManager] Found available logo: ${logoPath}`);
                return logo;
                
            } catch (error) {
                console.warn(`[AssetLoadingManager] Logo not available: ${logoPath}`);
                continue;
            }
        }
        
        throw new Error('No logo assets available');
    }

    /**
     * Cache asset with metadata
     */
    cacheAsset(assetUrl, asset, options = {}) {
        const cacheKey = this.getCacheKey(assetUrl);
        const cacheEntry = {
            data: asset,
            timestamp: Date.now(),
            url: assetUrl,
            priority: options.priority || 'normal',
            size: asset.size || 0,
            hits: 0
        };
        
        this.cache.set(cacheKey, cacheEntry);
        console.log(`[AssetLoadingManager] Cached asset: ${assetUrl} (${this.formatBytes(cacheEntry.size)})`);
        
        // Clean up old cache entries if cache gets too large
        this.cleanupCache();
    }

    /**
     * Get cached asset
     */
    getCachedAsset(assetUrl) {
        const cacheKey = this.getCacheKey(assetUrl);
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            cached.hits++;
            console.log(`[AssetLoadingManager] Cache hit for: ${assetUrl} (${cached.hits} hits)`);
        }
        
        return cached;
    }

    /**
     * Validate cache entry
     */
    isValidCache(cacheEntry) {
        const age = Date.now() - cacheEntry.timestamp;
        const isValid = age < this.cacheExpiry;
        
        if (!isValid) {
            console.log(`[AssetLoadingManager] Cache expired for: ${cacheEntry.url}`);
            this.cache.delete(this.getCacheKey(cacheEntry.url));
        }
        
        return isValid;
    }

    /**
     * Clean up old cache entries
     */
    cleanupCache() {
        const maxCacheSize = 50; // Maximum number of cached items
        
        if (this.cache.size <= maxCacheSize) return;
        
        // Sort by last access time and remove oldest entries
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        const toRemove = entries.slice(0, this.cache.size - maxCacheSize);
        toRemove.forEach(([key]) => {
            console.log(`[AssetLoadingManager] Removing old cache entry: ${key}`);
            this.cache.delete(key);
        });
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            loadingPromises: this.loadingPromises.size,
            retryAttempts: this.retryAttempts.size,
            criticalAssets: this.criticalAssets.length,
            maxRetries: this.maxRetries,
            baseRetryDelay: this.baseRetryDelay
        };
    }

    /**
     * Utility methods
     */
    getCacheKey(assetUrl) {
        return assetUrl.replace(/[^a-zA-Z0-9]/g, '_');
    }

    getAssetType(assetUrl) {
        const extension = assetUrl.split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
            return 'image';
        } else if (['css'].includes(extension)) {
            return 'css';
        } else if (['js'].includes(extension)) {
            return 'javascript';
        } else {
            return 'unknown';
        }
    }

    estimateImageSize(img) {
        // Rough estimation of image size in bytes
        return img.width * img.height * 4; // Assume 4 bytes per pixel (RGBA)
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear all cache
     */
    clearCache() {
        console.log('[AssetLoadingManager] Clearing all cache');
        
        // Clear CacheManager cache
        if (this.cacheManager) {
            this.cacheManager.clear();
        }
        
        // Clear local caches
        this.retryAttempts.clear();
        this.loadingPromises.clear();
    }

    /**
     * Preload specific logo paths
     */
    async preloadLogos() {
        console.log('[AssetLoadingManager] Preloading logo assets');
        
        const logoPromises = this.criticalAssets.map(async (logoPath) => {
            try {
                return await this.loadAssetWithRetry(logoPath, { 
                    priority: 'critical',
                    preload: true,
                    timeout: 3000
                });
            } catch (error) {
                return null;
            }
        });

        const results = await Promise.allSettled(logoPromises);
        const successfulLogos = results
            .filter(r => r.status === 'fulfilled' && r.value !== null)
            .map(r => r.value);

        console.log(`[AssetLoadingManager] Successfully preloaded ${successfulLogos.length} logo variants`);
        return successfulLogos;
    }

    /**
     * Get comprehensive statistics including preloading metrics
     */
    getStats() {
        return {
            assetLoading: this.getCacheStats(),
            cacheManager: this.cacheManager.getStats(),
            assetPreloader: this.assetPreloader.getStats(),
            loadingState: this.loadingStateManager.getPerformanceMetrics()
        };
    }

    /**
     * Get frequently accessed assets for optimization
     */
    getFrequentlyAccessed(limit = 10) {
        return this.cacheManager.getFrequentlyAccessed(limit);
    }

    /**
     * Optimize all caching and preloading systems
     */
    optimize() {
        console.log('[AssetLoadingManager] Starting comprehensive optimization');
        
        // Optimize cache
        this.cacheManager.optimize();
        
        // Clean up old loading states
        this.loadingStateManager.clearAllStates();
        
        // Clear completed preload results
        this.retryAttempts.clear();
        this.loadingPromises.clear();
        
        console.log('[AssetLoadingManager] Optimization completed');
    }

    /**
     * Cleanup method for proper resource management
     */
    cleanup() {
        console.log('[AssetLoadingManager] Starting cleanup');
        
        // Cleanup all components
        if (this.cacheManager.cleanup) {
            this.cacheManager.cleanup();
        }
        
        if (this.assetPreloader.cleanup) {
            this.assetPreloader.cleanup();
        }
        
        if (this.loadingStateManager.clearAllStates) {
            this.loadingStateManager.clearAllStates();
        }
        
        // Clear local state
        this.loadingPromises.clear();
        this.retryAttempts.clear();
        
        console.log('[AssetLoadingManager] Cleanup completed');
    }
}