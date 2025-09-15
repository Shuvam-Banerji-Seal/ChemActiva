// UnifiedAssetManager.js - Consolidates all asset management functionality
export default class UnifiedAssetManager {
    constructor() {
        this.criticalAssets = new Set();
        this.loadedAssets = new Map();
        this.failedAssets = new Set();
        this.retryCount = new Map();
        this.maxRetries = 3;
        this.loadingPromises = new Map();
        
        // Asset priorities
        this.priorities = {
            CRITICAL: 4,
            HIGH: 3,
            NORMAL: 2,
            LOW: 1
        };
        
        // Critical assets that must load first
        this.criticalAssetList = [
            { url: '/assets/images/logo.png', type: 'image', priority: this.priorities.CRITICAL },
            { url: '/assets/images/logo-small_size.png', type: 'image', priority: this.priorities.CRITICAL },
            { url: '/css/base.css', type: 'css', priority: this.priorities.CRITICAL },
            { url: '/css/theme.css', type: 'css', priority: this.priorities.CRITICAL }
        ];
        
        console.log('[UnifiedAssetManager] Initialized');
    }
    
    /**
     * Initialize the asset manager and preload critical assets
     */
    async init() {
        try {
            await this.preloadCritical();
            this.setupCacheWarming();
            console.log('[UnifiedAssetManager] Initialization complete');
            return true;
        } catch (error) {
            console.error('[UnifiedAssetManager] Initialization failed:', error);
            return false;
        }
    }
    
    /**
     * Preload only critical assets for fast initial render
     */
    async preloadCritical() {
        console.log('[UnifiedAssetManager] Starting critical asset preload');
        const results = await Promise.allSettled(
            this.criticalAssetList.map(asset => this.preloadAsset(asset))
        );
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const total = this.criticalAssetList.length;
        
        console.log(`[UnifiedAssetManager] Critical preload complete: ${successful}/${total} assets`);
        return { successful, total, results };
    }
    
    /**
     * Preload a single asset with retry logic
     */
    async preloadAsset(asset) {
        const { url, type, priority } = asset;
        
        // Return existing promise if already loading
        if (this.loadingPromises.has(url)) {
            return this.loadingPromises.get(url);
        }
        
        // Return cached result if already loaded
        if (this.loadedAssets.has(url)) {
            return this.loadedAssets.get(url);
        }
        
        const promise = this._loadAssetWithRetry(url, type, priority);
        this.loadingPromises.set(url, promise);
        
        try {
            const result = await promise;
            this.loadedAssets.set(url, result);
            this.loadingPromises.delete(url);
            console.log(`[UnifiedAssetManager] Loaded: ${url}`);
            return result;
        } catch (error) {
            this.failedAssets.add(url);
            this.loadingPromises.delete(url);
            console.warn(`[UnifiedAssetManager] Failed to load: ${url}`, error);
            throw error;
        }
    }
    
    /**
     * Load asset with retry logic
     */
    async _loadAssetWithRetry(url, type, priority, attempt = 1) {
        try {
            return await this._loadAsset(url, type);
        } catch (error) {
            if (attempt < this.maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
                console.log(`[UnifiedAssetManager] Retry ${attempt + 1} for ${url} in ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this._loadAssetWithRetry(url, type, priority, attempt + 1);
            }
            throw error;
        }
    }
    
    /**
     * Load asset based on type
     */
    async _loadAsset(url, type) {
        switch (type) {
            case 'image':
                return this._loadImage(url);
            case 'css':
                return this._loadCSS(url);
            case 'js':
                return this._loadScript(url);
            case 'font':
                return this._loadFont(url);
            default:
                return this._loadGeneric(url);
        }
    }
    
    /**
     * Load image asset
     */
    _loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ url, type: 'image', element: img });
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
        });
    }
    
    /**
     * Load CSS asset
     */
    _loadCSS(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = url;
            link.onload = () => resolve({ url, type: 'css', element: link });
            link.onerror = () => reject(new Error(`Failed to load CSS: ${url}`));
            document.head.appendChild(link);
        });
    }
    
    /**
     * Load JavaScript asset
     */
    _loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('link');
            script.rel = 'preload';
            script.as = 'script';
            script.href = url;
            script.onload = () => resolve({ url, type: 'js', element: script });
            script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
            document.head.appendChild(script);
        });
    }
    
    /**
     * Load font asset
     */
    _loadFont(url) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'font';
            link.type = 'font/woff2';
            link.crossOrigin = 'anonymous';
            link.href = url;
            link.onload = () => resolve({ url, type: 'font', element: link });
            link.onerror = () => reject(new Error(`Failed to load font: ${url}`));
            document.head.appendChild(link);
        });
    }
    
    /**
     * Load generic asset
     */
    async _loadGeneric(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status}`);
        }
        return { url, type: 'generic', response };
    }
    
    /**
     * Set up cache warming for non-critical assets
     */
    setupCacheWarming() {
        // Warm cache for likely-needed assets after critical load
        requestIdleCallback(() => {
            this.warmCache();
        });
    }
    
    /**
     * Warm cache with non-critical assets
     */
    async warmCache() {
        const nonCriticalAssets = [
            { url: '/assets/images/products/Domestic_oil_spill_kit_1.webp', type: 'image', priority: this.priorities.NORMAL },
            { url: '/assets/images/products/Marine_oil_spill_kit.webp', type: 'image', priority: this.priorities.NORMAL },
            { url: '/css/products.css', type: 'css', priority: this.priorities.LOW },
            { url: '/css/articles.css', type: 'css', priority: this.priorities.LOW }
        ];
        
        console.log('[UnifiedAssetManager] Starting cache warming');
        
        // Load assets with delays to avoid overwhelming the browser
        for (let i = 0; i < nonCriticalAssets.length; i++) {
            setTimeout(() => {
                this.preloadAsset(nonCriticalAssets[i]).catch(() => {
                    // Silently handle non-critical asset failures
                });
            }, i * 200); // 200ms delay between each asset
        }
    }
    
    /**
     * Lazy load assets based on patterns or user behavior
     */
    async lazyLoad(assets, condition = () => true) {
        if (!condition()) return;
        
        const results = await Promise.allSettled(
            assets.map(asset => this.preloadAsset(asset))
        );
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`[UnifiedAssetManager] Lazy loaded ${successful}/${assets.length} assets`);
        return results;
    }
    
    /**
     * Get asset loading statistics
     */
    getStats() {
        return {
            loaded: this.loadedAssets.size,
            failed: this.failedAssets.size,
            loading: this.loadingPromises.size,
            failureRate: this.failedAssets.size / (this.loadedAssets.size + this.failedAssets.size) || 0
        };
    }
    
    /**
     * Check if asset is loaded
     */
    isLoaded(url) {
        return this.loadedAssets.has(url);
    }
    
    /**
     * Check if asset failed to load
     */
    hasFailed(url) {
        return this.failedAssets.has(url);
    }
    
    /**
     * Clear caches and reset state
     */
    reset() {
        this.loadedAssets.clear();
        this.failedAssets.clear();
        this.loadingPromises.clear();
        this.retryCount.clear();
        console.log('[UnifiedAssetManager] Reset complete');
    }
}