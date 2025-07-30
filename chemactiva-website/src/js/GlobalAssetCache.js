// src/js/GlobalAssetCache.js
/**
 * Global Asset Cache - Persistent cache across page navigations
 * Prevents asset reloading when navigating between pages
 */
class GlobalAssetCache {
    constructor() {
        this.cache = new Map();
        this.persistentCache = new Map();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            stores: 0
        };
        
        // Initialize from sessionStorage if available
        this.initFromStorage();
        
        // Set up cleanup on page unload
        this.setupCleanup();
        
        console.log('[GlobalAssetCache] Initialized');
    }

    /**
     * Initialize cache from sessionStorage
     */
    initFromStorage() {
        try {
            const storedCache = sessionStorage.getItem('globalAssetCache');
            if (storedCache) {
                const parsed = JSON.parse(storedCache);
                
                // Restore cache entries that are still valid
                Object.entries(parsed).forEach(([key, entry]) => {
                    if (this.isValidCacheEntry(entry)) {
                        this.persistentCache.set(key, entry);
                    }
                });
                
                console.log(`[GlobalAssetCache] Restored ${this.persistentCache.size} cached assets from storage`);
            }
        } catch (error) {
            console.warn('[GlobalAssetCache] Failed to restore from storage:', error);
        }
    }

    /**
     * Check if cache entry is still valid
     */
    isValidCacheEntry(entry) {
        const maxAge = 10 * 60 * 1000; // 10 minutes
        return entry && entry.timestamp && (Date.now() - entry.timestamp < maxAge);
    }

    /**
     * Store asset in cache
     */
    set(key, asset, options = {}) {
        const cacheEntry = {
            asset: asset,
            timestamp: Date.now(),
            type: options.type || 'unknown',
            priority: options.priority || 'normal',
            size: this.estimateSize(asset),
            hits: 0
        };

        // Store in memory cache
        this.cache.set(key, cacheEntry);
        
        // Store in persistent cache for critical assets
        if (options.priority === 'critical' || options.persistent !== false) {
            this.persistentCache.set(key, {
                ...cacheEntry,
                // Don't store the actual asset in sessionStorage, just metadata
                asset: this.serializeAsset(asset),
                serialized: true
            });
        }

        this.cacheStats.stores++;
        
        // Persist to sessionStorage
        this.persistToStorage();
        
        console.log(`[GlobalAssetCache] Cached asset: ${key} (${cacheEntry.type})`);
    }

    /**
     * Get asset from cache
     */
    get(key) {
        // Try memory cache first
        let entry = this.cache.get(key);
        
        if (entry) {
            entry.hits++;
            this.cacheStats.hits++;
            console.log(`[GlobalAssetCache] Memory cache hit: ${key}`);
            return entry.asset;
        }

        // Try persistent cache
        entry = this.persistentCache.get(key);
        if (entry && this.isValidCacheEntry(entry)) {
            entry.hits++;
            this.cacheStats.hits++;
            
            // Deserialize asset if needed
            const asset = entry.serialized ? this.deserializeAsset(entry.asset, entry.type) : entry.asset;
            
            // Move back to memory cache
            this.cache.set(key, { ...entry, asset: asset, serialized: false });
            
            console.log(`[GlobalAssetCache] Persistent cache hit: ${key}`);
            return asset;
        }

        this.cacheStats.misses++;
        return null;
    }

    /**
     * Check if asset exists in cache
     */
    has(key) {
        return this.cache.has(key) || 
               (this.persistentCache.has(key) && this.isValidCacheEntry(this.persistentCache.get(key)));
    }

    /**
     * Serialize asset for storage
     */
    serializeAsset(asset) {
        if (!asset) return null;

        try {
            if (asset.type === 'image' && asset.element) {
                return {
                    type: 'image',
                    src: asset.element.src,
                    width: asset.width,
                    height: asset.height
                };
            } else if (asset.type === 'css' && asset.element) {
                return {
                    type: 'css',
                    href: asset.element.href
                };
            } else if (asset.url) {
                return {
                    type: asset.type,
                    url: asset.url
                };
            }
        } catch (error) {
            console.warn('[GlobalAssetCache] Failed to serialize asset:', error);
        }

        return null;
    }

    /**
     * Deserialize asset from storage
     */
    deserializeAsset(serializedAsset, type) {
        if (!serializedAsset) return null;

        try {
            if (type === 'image' && serializedAsset.src) {
                // Create a new image element
                const img = new Image();
                img.src = serializedAsset.src;
                img.crossOrigin = 'anonymous';
                
                return {
                    type: 'image',
                    element: img,
                    width: serializedAsset.width,
                    height: serializedAsset.height,
                    url: serializedAsset.src
                };
            } else if (type === 'css' && serializedAsset.href) {
                // CSS assets are typically already loaded in the DOM
                const existingLink = document.querySelector(`link[href="${serializedAsset.href}"]`);
                if (existingLink) {
                    return {
                        type: 'css',
                        element: existingLink,
                        url: serializedAsset.href
                    };
                }
            }
        } catch (error) {
            console.warn('[GlobalAssetCache] Failed to deserialize asset:', error);
        }

        return null;
    }

    /**
     * Estimate asset size
     */
    estimateSize(asset) {
        if (!asset) return 0;

        if (asset.size) return asset.size;
        if (asset.width && asset.height) return asset.width * asset.height * 4; // RGBA estimation
        if (asset.element && asset.element.src) return asset.element.src.length;
        
        return 1024; // Default 1KB estimation
    }

    /**
     * Persist cache to sessionStorage
     */
    persistToStorage() {
        try {
            const cacheData = {};
            
            // Only persist serializable entries
            this.persistentCache.forEach((entry, key) => {
                if (entry.serialized && entry.asset) {
                    cacheData[key] = {
                        asset: entry.asset,
                        timestamp: entry.timestamp,
                        type: entry.type,
                        priority: entry.priority,
                        hits: entry.hits
                    };
                }
            });

            sessionStorage.setItem('globalAssetCache', JSON.stringify(cacheData));
        } catch (error) {
            console.warn('[GlobalAssetCache] Failed to persist to storage:', error);
        }
    }

    /**
     * Preload critical assets that are likely to be needed
     */
    async preloadCriticalAssets() {
        const criticalAssets = [
            { key: 'logo-main', url: '/assets/images/logo.png', type: 'image' },
            { key: 'logo-small', url: '/assets/images/logo-small_size.png', type: 'image' }
        ];

        const preloadPromises = criticalAssets.map(async (assetConfig) => {
            if (this.has(assetConfig.key)) {
                console.log(`[GlobalAssetCache] Asset already cached: ${assetConfig.key}`);
                return;
            }

            try {
                const asset = await this.loadAsset(assetConfig.url, assetConfig.type);
                this.set(assetConfig.key, asset, { 
                    type: assetConfig.type, 
                    priority: 'critical',
                    persistent: true 
                });
            } catch (error) {
                console.warn(`[GlobalAssetCache] Failed to preload ${assetConfig.key}:`, error);
            }
        });

        await Promise.allSettled(preloadPromises);
    }

    /**
     * Load asset with timeout
     */
    async loadAsset(url, type, timeout = 3000) {
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
                        height: img.height,
                        size: this.estimateSize({ width: img.width, height: img.height })
                    });
                };
                
                img.onerror = () => {
                    clearTimeout(timeoutId);
                    reject(new Error(`Failed to load image: ${url}`));
                };
                
                img.src = url;
            } else {
                // Generic fetch for other types
                fetch(url)
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
     * Get first available logo from cache or load it
     */
    async getAvailableLogo() {
        const logoKeys = ['logo-main', 'logo-public', 'logo-small'];
        
        // Try to get from cache first
        for (const key of logoKeys) {
            const cachedLogo = this.get(key);
            if (cachedLogo) {
                console.log(`[GlobalAssetCache] Using cached logo: ${key}`);
                return cachedLogo;
            }
        }

        // If not in cache, try to load
        const logoUrls = [
            '/assets/images/logo.png',
            '/assets/images/logo-small_size.png'
        ];

        for (let i = 0; i < logoUrls.length; i++) {
            try {
                const logo = await this.loadAsset(logoUrls[i], 'image', 2000); // 2s timeout
                this.set(logoKeys[i], logo, { 
                    type: 'image', 
                    priority: 'critical',
                    persistent: true 
                });
                console.log(`[GlobalAssetCache] Loaded and cached logo: ${logoKeys[i]}`);
                return logo;
            } catch (error) {
                console.warn(`[GlobalAssetCache] Failed to load logo ${logoUrls[i]}:`, error);
                continue;
            }
        }

        throw new Error('No logo could be loaded');
    }

    /**
     * Setup cleanup on page unload
     */
    setupCleanup() {
        window.addEventListener('beforeunload', () => {
            this.persistToStorage();
        });

        // Clean up old entries periodically
        setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000); // Every 5 minutes
    }

    /**
     * Clean up old cache entries
     */
    cleanup() {
        const maxAge = 10 * 60 * 1000; // 10 minutes
        const now = Date.now();
        
        // Clean memory cache
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > maxAge) {
                this.cache.delete(key);
            }
        }

        // Clean persistent cache
        for (const [key, entry] of this.persistentCache.entries()) {
            if (now - entry.timestamp > maxAge) {
                this.persistentCache.delete(key);
            }
        }

        this.persistToStorage();
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const memorySize = this.cache.size;
        const persistentSize = this.persistentCache.size;
        const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0 ? 
            (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(2) + '%' : '0%';

        return {
            memoryCache: memorySize,
            persistentCache: persistentSize,
            totalHits: this.cacheStats.hits,
            totalMisses: this.cacheStats.misses,
            totalStores: this.cacheStats.stores,
            hitRate: hitRate
        };
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
        this.persistentCache.clear();
        
        try {
            sessionStorage.removeItem('globalAssetCache');
        } catch (error) {
            console.warn('[GlobalAssetCache] Failed to clear storage:', error);
        }

        console.log('[GlobalAssetCache] All cache cleared');
    }

    /**
     * Get frequently accessed assets
     */
    getFrequentlyAccessed(limit = 10) {
        const allEntries = [
            ...Array.from(this.cache.entries()),
            ...Array.from(this.persistentCache.entries())
        ];

        return allEntries
            .sort((a, b) => (b[1].hits || 0) - (a[1].hits || 0))
            .slice(0, limit)
            .map(([key, entry]) => ({
                key,
                hits: entry.hits || 0,
                type: entry.type,
                priority: entry.priority
            }));
    }
}

// Create global instance
const globalAssetCache = new GlobalAssetCache();

export default globalAssetCache;