// src/js/CacheManager.js

export default class CacheManager {
    constructor(options = {}) {
        this.cache = new Map();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            totalRequests: 0,
            evictions: 0
        };
        
        // Configuration
        this.maxCacheSize = options.maxCacheSize || 50; // Maximum number of cached items
        this.maxCacheMemory = options.maxCacheMemory || 50 * 1024 * 1024; // 50MB default
        this.defaultTTL = options.defaultTTL || 30 * 60 * 1000; // 30 minutes default
        this.cleanupInterval = options.cleanupInterval || 5 * 60 * 1000; // 5 minutes
        
        // Priority levels
        this.priorities = {
            CRITICAL: 4,
            HIGH: 3,
            NORMAL: 2,
            LOW: 1
        };
        
        // Asset type configurations
        this.assetConfigs = {
            image: { ttl: 60 * 60 * 1000, priority: this.priorities.HIGH }, // 1 hour
            css: { ttl: 24 * 60 * 60 * 1000, priority: this.priorities.NORMAL }, // 24 hours
            javascript: { ttl: 24 * 60 * 60 * 1000, priority: this.priorities.NORMAL }, // 24 hours
            font: { ttl: 7 * 24 * 60 * 60 * 1000, priority: this.priorities.HIGH }, // 7 days
            logo: { ttl: 24 * 60 * 60 * 1000, priority: this.priorities.CRITICAL } // 24 hours
        };
        
        // Critical assets that should never be evicted
        this.criticalAssets = new Set([
            '/assets/images/logo.png',
            '/public/assets/images/logo.png',
            './public/assets/images/logo.png',
            '/public/assets/images/logo-small_size.png'
        ]);
        
        // Start periodic cleanup
        this.startCleanupTimer();
        
        console.log('[CacheManager] Initialized with max size:', this.maxCacheSize, 'max memory:', this.formatBytes(this.maxCacheMemory));
    }

    /**
     * Store an asset in cache with metadata
     */
    set(key, value, options = {}) {
        this.cacheStats.totalRequests++;
        
        const now = Date.now();
        const assetType = options.type || this.detectAssetType(key);
        const config = this.assetConfigs[assetType] || this.assetConfigs.image;
        
        const cacheEntry = {
            key,
            value,
            timestamp: now,
            lastAccessed: now,
            ttl: options.ttl || config.ttl,
            priority: options.priority || config.priority,
            type: assetType,
            size: this.calculateSize(value),
            hits: 0,
            metadata: {
                url: options.url || key,
                loadTime: options.metadata?.loadTime || now,
                attempts: options.metadata?.attempts || 1,
                ...options.metadata
            }
        };
        
        // Check if we need to make space
        if (this.shouldEvict(cacheEntry)) {
            this.evictLeastImportant(cacheEntry);
        }
        
        this.cache.set(key, cacheEntry);
        
        console.log(`[CacheManager] Cached ${assetType}: ${key} (${this.formatBytes(cacheEntry.size)}, priority: ${cacheEntry.priority})`);
        
        // Warm cache for related assets if this is a critical asset
        if (this.isCriticalAsset(key)) {
            this.warmRelatedAssets(key);
        }
        
        return cacheEntry;
    }

    /**
     * Retrieve an asset from cache
     */
    get(key) {
        this.cacheStats.totalRequests++;
        
        const cacheEntry = this.cache.get(key);
        
        if (!cacheEntry) {
            this.cacheStats.misses++;
            return null;
        }
        
        // Check if entry has expired
        if (this.isExpired(cacheEntry)) {
            console.log(`[CacheManager] Cache entry expired: ${key}`);
            this.cache.delete(key);
            this.cacheStats.misses++;
            return null;
        }
        
        // Update access statistics
        cacheEntry.hits++;
        cacheEntry.lastAccessed = Date.now();
        this.cacheStats.hits++;
        
        console.log(`[CacheManager] Cache hit: ${key} (${cacheEntry.hits} hits)`);
        return cacheEntry.value;
    }

    /**
     * Check if an asset exists in cache and is valid
     */
    has(key) {
        const cacheEntry = this.cache.get(key);
        return cacheEntry && !this.isExpired(cacheEntry);
    }

    /**
     * Remove an asset from cache
     */
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            console.log(`[CacheManager] Removed from cache: ${key}`);
        }
        return deleted;
    }

    /**
     * Clear all cache entries
     */
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        this.resetStats();
        console.log(`[CacheManager] Cleared ${size} cache entries`);
    }

    /**
     * Warm cache with critical assets
     */
    async warmCache(assetUrls = []) {
        console.log('[CacheManager] Warming cache with critical assets');
        
        const criticalUrls = assetUrls.length > 0 ? assetUrls : Array.from(this.criticalAssets);
        const warmingPromises = [];
        
        for (const url of criticalUrls) {
            // Only warm if not already cached
            if (!this.has(url)) {
                warmingPromises.push(this.preloadAsset(url));
            }
        }
        
        if (warmingPromises.length > 0) {
            const results = await Promise.allSettled(warmingPromises);
            const successful = results.filter(r => r.status === 'fulfilled').length;
            console.log(`[CacheManager] Cache warming completed: ${successful}/${warmingPromises.length} assets loaded`);
        } else {
            console.log('[CacheManager] All critical assets already cached');
        }
    }

    /**
     * Preload a single asset for cache warming
     */
    async preloadAsset(url) {
        try {
            const assetType = this.detectAssetType(url);
            
            if (assetType === 'image') {
                return await this.preloadImage(url);
            } else {
                return await this.preloadGenericAsset(url);
            }
        } catch (error) {
            console.warn(`[CacheManager] Failed to preload asset: ${url}`, error);
            throw error;
        }
    }

    /**
     * Preload an image asset
     */
    async preloadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            const timeout = setTimeout(() => {
                reject(new Error(`Timeout preloading image: ${url}`));
            }, 5000);
            
            img.onload = () => {
                clearTimeout(timeout);
                const asset = {
                    type: 'image',
                    url: url,
                    element: img,
                    width: img.width,
                    height: img.height,
                    size: this.estimateImageSize(img)
                };
                
                this.set(url, asset, {
                    type: 'image',
                    priority: this.isCriticalAsset(url) ? this.priorities.CRITICAL : this.priorities.HIGH,
                    url: url
                });
                
                resolve(asset);
            };
            
            img.onerror = () => {
                clearTimeout(timeout);
                reject(new Error(`Failed to preload image: ${url}`));
            };
            
            img.src = url;
        });
    }

    /**
     * Preload a generic asset
     */
    async preloadGenericAsset(url) {
        const response = await fetch(url, { cache: 'default' });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const asset = {
            type: this.detectAssetType(url),
            url: url,
            blob: blob,
            size: blob.size
        };
        
        this.set(url, asset, {
            type: asset.type,
            priority: this.isCriticalAsset(url) ? this.priorities.CRITICAL : this.priorities.NORMAL,
            url: url
        });
        
        return asset;
    }

    /**
     * Get cache statistics and performance metrics
     */
    getStats() {
        const totalSize = this.getTotalCacheSize();
        const hitRate = this.cacheStats.totalRequests > 0 
            ? (this.cacheStats.hits / this.cacheStats.totalRequests * 100).toFixed(2)
            : 0;
        
        const assetTypes = {};
        const priorities = {};
        
        this.cache.forEach(entry => {
            assetTypes[entry.type] = (assetTypes[entry.type] || 0) + 1;
            priorities[entry.priority] = (priorities[entry.priority] || 0) + 1;
        });
        
        return {
            totalEntries: this.cache.size,
            totalSize: totalSize,
            formattedSize: this.formatBytes(totalSize),
            hitRate: `${hitRate}%`,
            hits: this.cacheStats.hits,
            misses: this.cacheStats.misses,
            totalRequests: this.cacheStats.totalRequests,
            evictions: this.cacheStats.evictions,
            assetTypes,
            priorities,
            memoryUsage: `${this.formatBytes(totalSize)} / ${this.formatBytes(this.maxCacheMemory)}`,
            utilizationRate: `${(this.cache.size / this.maxCacheSize * 100).toFixed(1)}%`
        };
    }

    /**
     * Get frequently accessed assets for optimization
     */
    getFrequentlyAccessed(limit = 10) {
        const entries = Array.from(this.cache.values())
            .sort((a, b) => b.hits - a.hits)
            .slice(0, limit);
        
        return entries.map(entry => ({
            key: entry.key,
            hits: entry.hits,
            type: entry.type,
            size: this.formatBytes(entry.size),
            priority: entry.priority,
            lastAccessed: new Date(entry.lastAccessed).toISOString()
        }));
    }

    /**
     * Optimize cache by removing least valuable entries
     */
    optimize() {
        console.log('[CacheManager] Starting cache optimization');
        
        const beforeSize = this.cache.size;
        const beforeMemory = this.getTotalCacheSize();
        
        // Remove expired entries
        this.cleanupExpired();
        
        // If still over limits, remove least valuable entries
        if (this.cache.size > this.maxCacheSize * 0.8 || this.getTotalCacheSize() > this.maxCacheMemory * 0.8) {
            this.evictLeastValuable();
        }
        
        const afterSize = this.cache.size;
        const afterMemory = this.getTotalCacheSize();
        
        console.log(`[CacheManager] Optimization complete: ${beforeSize} → ${afterSize} entries, ${this.formatBytes(beforeMemory)} → ${this.formatBytes(afterMemory)}`);
    }

    /**
     * Private helper methods
     */
    
    shouldEvict(newEntry) {
        return this.cache.size >= this.maxCacheSize || 
               (this.getTotalCacheSize() + newEntry.size) > this.maxCacheMemory;
    }

    evictLeastImportant(newEntry) {
        // Never evict critical assets
        const evictableEntries = Array.from(this.cache.values())
            .filter(entry => !this.isCriticalAsset(entry.key));
        
        if (evictableEntries.length === 0) {
            console.warn('[CacheManager] Cannot evict - all entries are critical');
            return;
        }
        
        // Sort by value score (priority, hits, recency)
        evictableEntries.sort((a, b) => {
            const scoreA = this.calculateValueScore(a);
            const scoreB = this.calculateValueScore(b);
            return scoreA - scoreB; // Ascending order (lowest value first)
        });
        
        // Evict lowest value entries until we have space
        let evicted = 0;
        while ((this.cache.size >= this.maxCacheSize || 
                (this.getTotalCacheSize() + newEntry.size) > this.maxCacheMemory) &&
               evicted < evictableEntries.length) {
            
            const entryToEvict = evictableEntries[evicted];
            this.cache.delete(entryToEvict.key);
            this.cacheStats.evictions++;
            
            console.log(`[CacheManager] Evicted: ${entryToEvict.key} (score: ${this.calculateValueScore(entryToEvict)})`);
            evicted++;
        }
    }

    evictLeastValuable() {
        const targetSize = Math.floor(this.maxCacheSize * 0.7);
        const targetMemory = Math.floor(this.maxCacheMemory * 0.7);
        
        const evictableEntries = Array.from(this.cache.values())
            .filter(entry => !this.isCriticalAsset(entry.key))
            .sort((a, b) => this.calculateValueScore(a) - this.calculateValueScore(b));
        
        while ((this.cache.size > targetSize || this.getTotalCacheSize() > targetMemory) &&
               evictableEntries.length > 0) {
            
            const entryToEvict = evictableEntries.shift();
            this.cache.delete(entryToEvict.key);
            this.cacheStats.evictions++;
        }
    }

    calculateValueScore(entry) {
        const now = Date.now();
        const age = now - entry.timestamp;
        const recency = now - entry.lastAccessed;
        
        // Higher priority and more hits = higher score
        // Older and less recently accessed = lower score
        const priorityScore = entry.priority * 100;
        const hitScore = Math.min(entry.hits * 10, 100);
        const ageScore = Math.max(0, 100 - (age / (24 * 60 * 60 * 1000)) * 10); // Decay over days
        const recencyScore = Math.max(0, 100 - (recency / (60 * 60 * 1000)) * 5); // Decay over hours
        
        return priorityScore + hitScore + ageScore + recencyScore;
    }

    isExpired(entry) {
        return (Date.now() - entry.timestamp) > entry.ttl;
    }

    isCriticalAsset(key) {
        return this.criticalAssets.has(key) || 
               Array.from(this.criticalAssets).some(critical => key.includes(critical));
    }

    detectAssetType(url) {
        const extension = url.split('.').pop()?.toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
            return url.includes('logo') ? 'logo' : 'image';
        } else if (['css'].includes(extension)) {
            return 'css';
        } else if (['js'].includes(extension)) {
            return 'javascript';
        } else if (['woff', 'woff2', 'ttf', 'otf'].includes(extension)) {
            return 'font';
        } else {
            return 'unknown';
        }
    }

    calculateSize(value) {
        if (!value) return 0;
        
        if (value.size) return value.size;
        if (value.element && value.element.src) {
            return this.estimateImageSize(value.element);
        }
        if (value.blob) return value.blob.size;
        
        // Rough estimation for other types
        return JSON.stringify(value).length * 2; // Assume UTF-16
    }

    estimateImageSize(img) {
        // Rough estimation: width * height * 4 bytes per pixel (RGBA)
        return (img.width || 400) * (img.height || 300) * 4;
    }

    getTotalCacheSize() {
        let totalSize = 0;
        this.cache.forEach(entry => {
            totalSize += entry.size || 0;
        });
        return totalSize;
    }

    cleanupExpired() {
        const before = this.cache.size;
        const expired = [];
        
        this.cache.forEach((entry, key) => {
            if (this.isExpired(entry) && !this.isCriticalAsset(key)) {
                expired.push(key);
            }
        });
        
        expired.forEach(key => this.cache.delete(key));
        
        if (expired.length > 0) {
            console.log(`[CacheManager] Cleaned up ${expired.length} expired entries`);
        }
    }

    warmRelatedAssets(key) {
        // If a logo is cached, try to warm other logo variants
        if (key.includes('logo')) {
            const otherLogos = Array.from(this.criticalAssets).filter(url => 
                url !== key && url.includes('logo')
            );
            
            otherLogos.forEach(logoUrl => {
                if (!this.has(logoUrl)) {
                    this.preloadAsset(logoUrl).catch(() => {
                        // Silently fail for related asset warming
                    });
                }
            });
        }
    }

    startCleanupTimer() {
        setInterval(() => {
            this.cleanupExpired();
            
            // Periodic optimization if cache is getting full
            if (this.cache.size > this.maxCacheSize * 0.9 || 
                this.getTotalCacheSize() > this.maxCacheMemory * 0.9) {
                this.optimize();
            }
        }, this.cleanupInterval);
    }

    resetStats() {
        this.cacheStats = {
            hits: 0,
            misses: 0,
            totalRequests: 0,
            evictions: 0
        };
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Public API for external monitoring
    getCacheEntries() {
        return Array.from(this.cache.entries()).map(([key, entry]) => ({
            key,
            type: entry.type,
            size: this.formatBytes(entry.size),
            hits: entry.hits,
            priority: entry.priority,
            age: Date.now() - entry.timestamp,
            lastAccessed: new Date(entry.lastAccessed).toISOString()
        }));
    }

    // Cleanup method for proper resource management
    cleanup() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        this.clear();
        console.log('[CacheManager] Cleanup completed');
    }
}