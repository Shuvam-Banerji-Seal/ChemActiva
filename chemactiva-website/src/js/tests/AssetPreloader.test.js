// src/js/tests/AssetPreloader.test.js
import AssetPreloader from '../AssetPreloader.js';
import CacheManager from '../CacheManager.js';
import LoadingStateManager from '../LoadingStateManager.js';

// Mock DOM APIs
global.Image = class {
    constructor() {
        this.crossOrigin = '';
        this.src = '';
        this.width = 400;
        this.height = 300;
        
        // Simulate successful image load after a short delay
        setTimeout(() => {
            if (this.onload) {
                this.onload();
            }
        }, 10);
    }
};

global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        blob: () => Promise.resolve({ size: 1024 })
    })
);

// Mock document
global.document = {
    createElement: jest.fn(() => ({
        rel: '',
        as: '',
        href: '',
        onload: null,
        onerror: null
    })),
    head: {
        appendChild: jest.fn()
    }
};

describe('AssetPreloader', () => {
    let assetPreloader;
    let cacheManager;
    let loadingStateManager;

    beforeEach(() => {
        cacheManager = new CacheManager();
        loadingStateManager = new LoadingStateManager();
        assetPreloader = new AssetPreloader({
            cacheManager,
            loadingStateManager,
            maxConcurrentLoads: 2,
            preloadTimeout: 1000
        });
    });

    afterEach(() => {
        if (assetPreloader.cleanup) {
            assetPreloader.cleanup();
        }
    });

    test('should initialize with correct configuration', () => {
        expect(assetPreloader.config.maxConcurrentLoads).toBe(2);
        expect(assetPreloader.config.preloadTimeout).toBe(1000);
        expect(assetPreloader.criticalAssets).toHaveLength(8); // 4 logos + 2 hero images + 2 CSS files
    });

    test('should detect asset types correctly', () => {
        expect(assetPreloader.detectAssetType('/test.png')).toBe('image');
        expect(assetPreloader.detectAssetType('/test.css')).toBe('css');
        expect(assetPreloader.detectAssetType('/test.js')).toBe('javascript');
        expect(assetPreloader.detectAssetType('/test.woff')).toBe('font');
        expect(assetPreloader.detectAssetType('/test.pdf')).toBe('document');
        expect(assetPreloader.detectAssetType('/test.unknown')).toBe('unknown');
    });

    test('should detect device type', () => {
        const deviceType = assetPreloader.detectDeviceType();
        expect(['mobile', 'desktop']).toContain(deviceType);
    });

    test('should identify asset URLs correctly', () => {
        expect(assetPreloader.isAssetUrl('/test.png')).toBe(true);
        expect(assetPreloader.isAssetUrl('/test.css')).toBe(true);
        expect(assetPreloader.isAssetUrl('/test.js')).toBe(true);
        expect(assetPreloader.isAssetUrl('/page.html')).toBe(false);
        expect(assetPreloader.isAssetUrl('/api/data')).toBe(false);
    });

    test('should generate consistent asset IDs', () => {
        const id1 = assetPreloader.generateAssetId('/test/image.png');
        const id2 = assetPreloader.generateAssetId('/test/image.png');
        const id3 = assetPreloader.generateAssetId('/different/image.png');

        expect(id1).toBe(id2);
        expect(id1).not.toBe(id3);
        expect(id1).toMatch(/^[a-zA-Z0-9_]+$/);
    });

    test('should estimate image sizes', () => {
        const mockImg = { width: 800, height: 600 };
        const estimatedSize = assetPreloader.estimateImageSize(mockImg);
        
        expect(estimatedSize).toBe(800 * 600 * 4); // RGBA estimation
    });

    test('should preload single asset successfully', async () => {
        const assetUrl = '/test/image.png';
        
        const result = await assetPreloader.preloadAsset(assetUrl, {
            type: 'image',
            priority: assetPreloader.priorities.HIGH
        });

        expect(result).toBeDefined();
        expect(result.type).toBe('image');
        expect(result.url).toBe(assetUrl);
        expect(cacheManager.has(assetUrl)).toBe(true);
    });

    test('should handle preload failures gracefully', async () => {
        // Mock Image to simulate failure
        global.Image = class {
            constructor() {
                setTimeout(() => {
                    if (this.onerror) {
                        this.onerror();
                    }
                }, 10);
            }
        };

        const assetUrl = '/test/failing-image.png';
        
        await expect(assetPreloader.preloadAsset(assetUrl, {
            type: 'image',
            priority: assetPreloader.priorities.HIGH
        })).rejects.toThrow();
    });

    test('should skip preloading for already cached assets', async () => {
        const assetUrl = '/test/cached-image.png';
        const cachedAsset = { type: 'image', url: assetUrl };
        
        // Pre-cache the asset
        cacheManager.set(assetUrl, cachedAsset);
        
        const result = await assetPreloader.preloadAsset(assetUrl);
        expect(result).toEqual(cachedAsset);
    });

    test('should prioritize preload candidates correctly', () => {
        const candidates = [
            { url: '/low.png', priority: 1, probability: 0.5 },
            { url: '/high.png', priority: 4, probability: 0.3 },
            { url: '/medium.png', priority: 2, probability: 0.8 }
        ];

        const prioritized = assetPreloader.prioritizePreloadCandidates(candidates);
        
        expect(prioritized[0].url).toBe('/high.png'); // Highest priority
        expect(prioritized[1].url).toBe('/medium.png'); // Medium priority, high probability
        expect(prioritized[2].url).toBe('/low.png'); // Lowest priority
    });

    test('should get page-specific assets', () => {
        const productAssets = assetPreloader.getPageAssets('/products', 1);
        const blogAssets = assetPreloader.getPageAssets('/blog', 1);

        expect(productAssets.length).toBeGreaterThan(0);
        expect(blogAssets.length).toBeGreaterThan(0);
        
        expect(productAssets.some(asset => asset.url.includes('products'))).toBe(true);
        expect(blogAssets.some(asset => asset.url.includes('css'))).toBe(true);
    });

    test('should get mobile-optimized assets', () => {
        const mobileAssets = assetPreloader.getMobileOptimizedAssets();
        
        expect(mobileAssets.length).toBeGreaterThan(0);
        expect(mobileAssets.some(asset => 
            asset.url.includes('small') || asset.url.includes('mobile')
        )).toBe(true);
    });

    test('should get business hour assets', () => {
        const businessAssets = assetPreloader.getBusinessHourAssets();
        
        expect(businessAssets.length).toBeGreaterThan(0);
        expect(businessAssets.some(asset => 
            asset.url.includes('products') || asset.url.includes('datasheet')
        )).toBe(true);
    });

    test('should track page visits', () => {
        const testPage = '/test-page';
        
        assetPreloader.trackPageVisit(testPage);
        
        const pageData = assetPreloader.navigationPatterns.pageVisits.get(testPage);
        expect(pageData).toBeDefined();
        expect(pageData.totalVisits).toBe(1);
    });

    test('should record asset requests', () => {
        const testUrl = '/test/asset.png';
        
        assetPreloader.recordAssetRequest(testUrl);
        
        const requestCount = assetPreloader.navigationPatterns.assetRequests.get(testUrl);
        expect(requestCount).toBe(1);
    });

    test('should provide comprehensive statistics', () => {
        const stats = assetPreloader.getStats();
        
        expect(stats).toHaveProperty('totalPreloads');
        expect(stats).toHaveProperty('successful');
        expect(stats).toHaveProperty('failed');
        expect(stats).toHaveProperty('successRate');
        expect(stats).toHaveProperty('activePreloads');
        expect(stats).toHaveProperty('cacheStats');
        expect(stats).toHaveProperty('navigationPatterns');
        
        expect(stats.navigationPatterns).toHaveProperty('deviceType');
        expect(['mobile', 'desktop']).toContain(stats.navigationPatterns.deviceType);
    });

    test('should handle delay utility correctly', async () => {
        const startTime = Date.now();
        await assetPreloader.delay(100);
        const endTime = Date.now();
        
        expect(endTime - startTime).toBeGreaterThanOrEqual(90); // Allow some tolerance
    });

    test('should cleanup resources properly', () => {
        const initialPreloads = assetPreloader.activePreloads.size;
        const initialResults = assetPreloader.preloadResults.size;
        
        assetPreloader.cleanup();
        
        expect(assetPreloader.activePreloads.size).toBe(0);
        expect(assetPreloader.preloadResults.size).toBe(0);
    });
});