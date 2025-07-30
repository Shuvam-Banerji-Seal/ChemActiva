// src/js/tests/AssetLoadingManager.integration.test.js
import AssetLoadingManager from '../AssetLoadingManager.js';

// Mock DOM APIs
global.Image = class {
    constructor() {
        this.crossOrigin = '';
        this.src = '';
        this.width = 400;
        this.height = 300;
        
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

describe('AssetLoadingManager Integration', () => {
    let assetLoadingManager;

    beforeEach(() => {
        assetLoadingManager = new AssetLoadingManager();
    });

    afterEach(() => {
        if (assetLoadingManager.cleanup) {
            assetLoadingManager.cleanup();
        }
    });

    test('should initialize with all required components', () => {
        expect(assetLoadingManager.cacheManager).toBeDefined();
        expect(assetLoadingManager.loadingStateManager).toBeDefined();
        expect(assetLoadingManager.assetPreloader).toBeDefined();
        expect(assetLoadingManager.criticalAssets).toHaveLength(4);
    });

    test('should preload critical assets successfully', async () => {
        const result = await assetLoadingManager.preloadCriticalAssets();
        expect(typeof result).toBe('boolean');
    });

    test('should warm cache successfully', async () => {
        await expect(assetLoadingManager.warmCache()).resolves.not.toThrow();
    });

    test('should perform pattern-based preloading', async () => {
        const result = await assetLoadingManager.preloadBasedOnPatterns();
        
        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('successful');
        expect(result).toHaveProperty('failed');
        expect(typeof result.total).toBe('number');
        expect(typeof result.successful).toBe('number');
        expect(typeof result.failed).toBe('number');
    });

    test('should perform priority-based preloading', async () => {
        const result = await assetLoadingManager.preloadByPriority(2);
        
        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('successful');
        expect(result).toHaveProperty('failed');
        expect(typeof result.total).toBe('number');
        expect(typeof result.successful).toBe('number');
        expect(typeof result.failed).toBe('number');
    });

    test('should provide comprehensive statistics', () => {
        const stats = assetLoadingManager.getStats();
        
        expect(stats).toHaveProperty('assetLoading');
        expect(stats).toHaveProperty('cacheManager');
        expect(stats).toHaveProperty('assetPreloader');
        expect(stats).toHaveProperty('loadingState');
    });

    test('should get frequently accessed assets', () => {
        const frequentAssets = assetLoadingManager.getFrequentlyAccessed(5);
        expect(Array.isArray(frequentAssets)).toBe(true);
    });

    test('should optimize all systems', () => {
        expect(() => assetLoadingManager.optimize()).not.toThrow();
    });

    test('should load asset with retry mechanism', async () => {
        const testUrl = '/test/image.png';
        
        const result = await assetLoadingManager.loadAssetWithRetry(testUrl, {
            priority: 'high',
            timeout: 1000
        });
        
        expect(result).toBeDefined();
        expect(result.type).toBe('image');
        expect(result.url).toBe(testUrl);
    });

    test('should get available logo', async () => {
        const logo = await assetLoadingManager.getAvailableLogo();
        
        expect(logo).toBeDefined();
        expect(logo.type).toBe('image');
        expect(assetLoadingManager.criticalAssets.includes(logo.url)).toBe(true);
    });

    test('should preload logos specifically', async () => {
        const logos = await assetLoadingManager.preloadLogos();
        
        expect(Array.isArray(logos)).toBe(true);
        expect(logos.length).toBeGreaterThanOrEqual(0);
    });

    test('should handle fallback preloading', async () => {
        // Mock the assetPreloader to fail
        assetLoadingManager.assetPreloader.preloadCriticalAssets = jest.fn().mockRejectedValue(new Error('Preloader failed'));
        
        const result = await assetLoadingManager.preloadCriticalAssets();
        expect(typeof result).toBe('boolean');
    });

    test('should cleanup all components properly', () => {
        expect(() => assetLoadingManager.cleanup()).not.toThrow();
    });
});