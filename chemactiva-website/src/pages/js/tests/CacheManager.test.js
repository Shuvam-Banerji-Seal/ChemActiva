// src/js/tests/CacheManager.test.js
import CacheManager from '../CacheManager.js';

describe('CacheManager', () => {
    let cacheManager;

    beforeEach(() => {
        cacheManager = new CacheManager({
            maxCacheSize: 10,
            maxCacheMemory: 1024 * 1024, // 1MB
            defaultTTL: 60000 // 1 minute
        });
    });

    afterEach(() => {
        if (cacheManager.cleanup) {
            cacheManager.cleanup();
        }
    });

    test('should initialize with correct configuration', () => {
        expect(cacheManager.maxCacheSize).toBe(10);
        expect(cacheManager.maxCacheMemory).toBe(1024 * 1024);
        expect(cacheManager.defaultTTL).toBe(60000);
    });

    test('should store and retrieve assets', () => {
        const testAsset = {
            type: 'image',
            url: '/test/image.png',
            size: 1024
        };

        cacheManager.set('/test/image.png', testAsset, {
            type: 'image',
            priority: cacheManager.priorities.HIGH
        });

        const retrieved = cacheManager.get('/test/image.png');
        expect(retrieved).toEqual(testAsset);
    });

    test('should return null for non-existent assets', () => {
        const result = cacheManager.get('/non/existent.png');
        expect(result).toBeNull();
    });

    test('should check asset existence correctly', () => {
        const testAsset = { type: 'image', size: 512 };
        
        expect(cacheManager.has('/test.png')).toBe(false);
        
        cacheManager.set('/test.png', testAsset);
        expect(cacheManager.has('/test.png')).toBe(true);
    });

    test('should delete assets', () => {
        const testAsset = { type: 'image', size: 512 };
        
        cacheManager.set('/test.png', testAsset);
        expect(cacheManager.has('/test.png')).toBe(true);
        
        cacheManager.delete('/test.png');
        expect(cacheManager.has('/test.png')).toBe(false);
    });

    test('should clear all cache', () => {
        cacheManager.set('/test1.png', { type: 'image', size: 512 });
        cacheManager.set('/test2.png', { type: 'image', size: 512 });
        
        expect(cacheManager.cache.size).toBe(2);
        
        cacheManager.clear();
        expect(cacheManager.cache.size).toBe(0);
    });

    test('should provide accurate statistics', () => {
        const testAsset1 = { type: 'image', size: 1024 };
        const testAsset2 = { type: 'css', size: 512 };
        
        cacheManager.set('/test1.png', testAsset1);
        cacheManager.set('/test2.css', testAsset2);
        
        // Access one asset to increase hit count
        cacheManager.get('/test1.png');
        
        const stats = cacheManager.getStats();
        
        expect(stats.totalEntries).toBe(2);
        expect(stats.hits).toBe(1);
        expect(stats.totalRequests).toBe(3); // 2 sets + 1 get
        expect(stats.assetTypes.image).toBe(1);
        expect(stats.assetTypes.css).toBe(1);
    });

    test('should detect asset types correctly', () => {
        expect(cacheManager.detectAssetType('/test.png')).toBe('image');
        expect(cacheManager.detectAssetType('/test.jpg')).toBe('image');
        expect(cacheManager.detectAssetType('/test.css')).toBe('css');
        expect(cacheManager.detectAssetType('/test.js')).toBe('javascript');
        expect(cacheManager.detectAssetType('/logo.png')).toBe('logo');
        expect(cacheManager.detectAssetType('/test.woff')).toBe('font');
        expect(cacheManager.detectAssetType('/test.pdf')).toBe('document');
        expect(cacheManager.detectAssetType('/test.unknown')).toBe('unknown');
    });

    test('should identify critical assets', () => {
        expect(cacheManager.isCriticalAsset('/assets/images/logo.png')).toBe(true);
        expect(cacheManager.isCriticalAsset('/public/assets/images/logo.png')).toBe(true);
        expect(cacheManager.isCriticalAsset('/random/image.png')).toBe(false);
    });

    test('should format bytes correctly', () => {
        expect(cacheManager.formatBytes(0)).toBe('0 Bytes');
        expect(cacheManager.formatBytes(1024)).toBe('1 KB');
        expect(cacheManager.formatBytes(1024 * 1024)).toBe('1 MB');
        expect(cacheManager.formatBytes(1536)).toBe('1.5 KB');
    });

    test('should calculate cache value scores', () => {
        const highPriorityEntry = {
            priority: cacheManager.priorities.CRITICAL,
            hits: 10,
            timestamp: Date.now() - 1000,
            lastAccessed: Date.now() - 100
        };

        const lowPriorityEntry = {
            priority: cacheManager.priorities.LOW,
            hits: 1,
            timestamp: Date.now() - 10000,
            lastAccessed: Date.now() - 5000
        };

        const highScore = cacheManager.calculateValueScore(highPriorityEntry);
        const lowScore = cacheManager.calculateValueScore(lowPriorityEntry);

        expect(highScore).toBeGreaterThan(lowScore);
    });

    test('should handle cache size limits', () => {
        // Fill cache to capacity
        for (let i = 0; i < 15; i++) {
            cacheManager.set(`/test${i}.png`, { type: 'image', size: 100 });
        }

        // Should not exceed max cache size due to eviction
        expect(cacheManager.cache.size).toBeLessThanOrEqual(cacheManager.maxCacheSize);
    });

    test('should get frequently accessed assets', () => {
        // Add assets with different access patterns
        cacheManager.set('/frequent.png', { type: 'image', size: 100 });
        cacheManager.set('/rare.png', { type: 'image', size: 100 });

        // Access one asset multiple times
        for (let i = 0; i < 5; i++) {
            cacheManager.get('/frequent.png');
        }
        cacheManager.get('/rare.png');

        const frequentAssets = cacheManager.getFrequentlyAccessed(2);
        
        expect(frequentAssets).toHaveLength(2);
        expect(frequentAssets[0].hits).toBeGreaterThan(frequentAssets[1].hits);
        expect(frequentAssets[0].key).toBe('/frequent.png');
    });
});