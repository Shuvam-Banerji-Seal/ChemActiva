// src/js/tests/AssetLoadingManager.test.js
import AssetLoadingManager from '../AssetLoadingManager.js';

describe('AssetLoadingManager', () => {
    let assetManager;

    beforeEach(() => {
        assetManager = new AssetLoadingManager();
        // Clear any existing cache
        assetManager.clearCache();
    });

    afterEach(() => {
        if (assetManager) {
            assetManager.clearCache();
        }
    });

    describe('Initialization', () => {
        test('should initialize with empty cache', () => {
            expect(assetManager.cache.size).toBe(0);
            expect(assetManager.loadingPromises.size).toBe(0);
            expect(assetManager.retryAttempts.size).toBe(0);
        });

        test('should have critical assets defined', () => {
            expect(assetManager.criticalAssets).toBeDefined();
            expect(assetManager.criticalAssets.length).toBeGreaterThan(0);
            expect(assetManager.criticalAssets).toContain('/assets/images/logo.png');
        });
    });

    describe('Cache Management', () => {
        test('should cache assets correctly', () => {
            const mockAsset = {
                type: 'image',
                url: '/test/image.png',
                size: 1024
            };

            assetManager.cacheAsset('/test/image.png', mockAsset, { priority: 'high' });

            expect(assetManager.cache.size).toBe(1);
            const cached = assetManager.getCachedAsset('/test/image.png');
            expect(cached).toBeDefined();
            expect(cached.data).toEqual(mockAsset);
            expect(cached.priority).toBe('high');
        });

        test('should validate cache expiry', () => {
            const mockAsset = { type: 'image', url: '/test/image.png' };
            assetManager.cacheAsset('/test/image.png', mockAsset);

            const cached = assetManager.getCachedAsset('/test/image.png');
            expect(assetManager.isValidCache(cached)).toBe(true);

            // Simulate expired cache
            cached.timestamp = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
            expect(assetManager.isValidCache(cached)).toBe(false);
        });

        test('should clean up old cache entries', () => {
            // Add more than maxCacheSize entries
            for (let i = 0; i < 55; i++) {
                const mockAsset = { type: 'image', url: `/test/image${i}.png` };
                assetManager.cacheAsset(`/test/image${i}.png`, mockAsset);
            }

            expect(assetManager.cache.size).toBeLessThanOrEqual(50);
        });
    });

    describe('Asset Type Detection', () => {
        test('should detect image types correctly', () => {
            expect(assetManager.getAssetType('/path/image.jpg')).toBe('image');
            expect(assetManager.getAssetType('/path/image.png')).toBe('image');
            expect(assetManager.getAssetType('/path/image.webp')).toBe('image');
            expect(assetManager.getAssetType('/path/image.svg')).toBe('image');
        });

        test('should detect CSS types correctly', () => {
            expect(assetManager.getAssetType('/path/styles.css')).toBe('css');
        });

        test('should detect JavaScript types correctly', () => {
            expect(assetManager.getAssetType('/path/script.js')).toBe('javascript');
        });

        test('should handle unknown types', () => {
            expect(assetManager.getAssetType('/path/file.unknown')).toBe('unknown');
        });
    });

    describe('Cache Key Generation', () => {
        test('should generate valid cache keys', () => {
            const url = '/assets/images/logo.png';
            const key = assetManager.getCacheKey(url);
            
            expect(key).toBe('_assets_images_logo_png');
            expect(key).toMatch(/^[a-zA-Z0-9_]+$/);
        });

        test('should handle complex URLs', () => {
            const url = 'https://example.com/path/to/image.jpg?v=123&size=large';
            const key = assetManager.getCacheKey(url);
            
            expect(key).toMatch(/^[a-zA-Z0-9_]+$/);
            expect(key.length).toBeGreaterThan(0);
        });
    });

    describe('Utility Methods', () => {
        test('should format bytes correctly', () => {
            expect(assetManager.formatBytes(0)).toBe('0 Bytes');
            expect(assetManager.formatBytes(1024)).toBe('1 KB');
            expect(assetManager.formatBytes(1048576)).toBe('1 MB');
            expect(assetManager.formatBytes(1073741824)).toBe('1 GB');
        });

        test('should estimate image size', () => {
            const mockImg = { width: 100, height: 100 };
            const size = assetManager.estimateImageSize(mockImg);
            expect(size).toBe(40000); // 100 * 100 * 4 bytes
        });

        test('should create delay promise', async () => {
            const start = Date.now();
            await assetManager.delay(100);
            const end = Date.now();
            
            expect(end - start).toBeGreaterThanOrEqual(90); // Allow some variance
        });
    });

    describe('Cache Statistics', () => {
        test('should provide accurate cache statistics', () => {
            // Add some test entries
            const assets = [
                { url: '/test1.png', size: 1000, priority: 'high' },
                { url: '/test2.jpg', size: 2000, priority: 'normal' },
                { url: '/test3.css', size: 500, priority: 'low' }
            ];

            assets.forEach(asset => {
                assetManager.cacheAsset(asset.url, asset, { priority: asset.priority });
            });

            const stats = assetManager.getCacheStats();
            
            expect(stats.totalEntries).toBe(3);
            expect(stats.totalSize).toBe(3500);
            expect(stats.priorities.high).toBe(1);
            expect(stats.priorities.normal).toBe(1);
            expect(stats.priorities.low).toBe(1);
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid cache entries gracefully', () => {
            const invalidEntry = null;
            expect(() => assetManager.isValidCache(invalidEntry)).not.toThrow();
        });

        test('should handle missing cache entries', () => {
            const cached = assetManager.getCachedAsset('/nonexistent.png');
            expect(cached).toBeUndefined();
        });
    });
});