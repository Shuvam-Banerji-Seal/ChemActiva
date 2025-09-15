/**
 * Tests for Loading Infrastructure Components
 * Tests LoadingStateManager, AssetLoadingManager, and ErrorRecoveryManager
 */

import LoadingStateManager from '../LoadingStateManager.js';
import AssetLoadingManager from '../AssetLoadingManager.js';
import ErrorRecoveryManager from '../ErrorRecoveryManager.js';

// Mock DOM methods for testing
global.Image = class {
    constructor() {
        this.onload = null;
        this.onerror = null;
        this.src = '';
        this.naturalWidth = 100;
        this.naturalHeight = 100;
    }
    
    set src(value) {
        this._src = value;
        // Simulate successful load for test images
        setTimeout(() => {
            if (value.includes('test-success')) {
                this.onload && this.onload();
            } else if (value.includes('test-fail')) {
                this.onerror && this.onerror();
            }
        }, 10);
    }
    
    get src() {
        return this._src;
    }
};

describe('LoadingStateManager', () => {
    let loadingStateManager;

    beforeEach(() => {
        loadingStateManager = new LoadingStateManager();
    });

    test('should register and track loading states', () => {
        const assetId = 'test-asset';
        const state = loadingStateManager.registerLoadingState(assetId);

        expect(state.assetId).toBe(assetId);
        expect(state.status).toBe('loading');
        expect(state.attempts).toBe(0);
        expect(loadingStateManager.isLoading(assetId)).toBe(true);
    });

    test('should update loading states correctly', () => {
        const assetId = 'test-asset';
        loadingStateManager.registerLoadingState(assetId);
        
        const updatedState = loadingStateManager.updateLoadingState(assetId, {
            status: 'loaded',
            attempts: 1
        });

        expect(updatedState.status).toBe('loaded');
        expect(updatedState.attempts).toBe(1);
        expect(loadingStateManager.isLoaded(assetId)).toBe(true);
    });

    test('should handle caching correctly', () => {
        const assetId = 'test-asset';
        loadingStateManager.registerLoadingState(assetId);
        
        loadingStateManager.setCached(assetId, {
            url: 'test-url',
            type: 'image'
        });

        expect(loadingStateManager.isCached(assetId)).toBe(true);
        const cacheData = loadingStateManager.getCacheData(assetId);
        expect(cacheData.url).toBe('test-url');
        expect(cacheData.type).toBe('image');
    });

    test('should determine when to show loader', () => {
        // Should show loader for direct navigation
        expect(loadingStateManager.shouldShowLoader('home', { navigationMethod: 'direct' })).toBe(true);
        
        // Should not show loader for internal navigation with cached assets
        loadingStateManager.setCached('logo');
        loadingStateManager.setCached('hero-images');
        expect(loadingStateManager.shouldShowLoader('home', { navigationMethod: 'link' })).toBe(false);
    });

    test('should track performance metrics', () => {
        const assetId = 'test-asset';
        loadingStateManager.registerLoadingState(assetId);
        
        // Simulate successful load
        loadingStateManager.updateLoadingState(assetId, { status: 'loaded' });
        
        const metrics = loadingStateManager.getPerformanceMetrics();
        expect(metrics.totalLoads).toBe(1);
        expect(metrics.successfulLoads).toBe(1);
        expect(metrics.successRate).toBe(100);
    });
});

describe('AssetLoadingManager', () => {
    let loadingStateManager;
    let assetLoadingManager;

    beforeEach(() => {
        loadingStateManager = new LoadingStateManager();
        assetLoadingManager = new AssetLoadingManager(loadingStateManager);
    });

    test('should load image successfully', async () => {
        const result = await assetLoadingManager.loadAssetWithRetry('test-success.jpg', {
            assetType: 'image',
            assetId: 'test-image'
        });

        expect(result).toBeInstanceOf(Image);
        expect(loadingStateManager.isLoaded('test-image')).toBe(true);
    });

    test('should handle loading failures with retries', async () => {
        try {
            await assetLoadingManager.loadAssetWithRetry('test-fail.jpg', {
                assetType: 'image',
                assetId: 'test-fail-image',
                maxRetries: 2
            });
        } catch (error) {
            expect(error.message).toContain('Failed to load asset');
            expect(loadingStateManager.hasFailed('test-fail-image')).toBe(true);
        }
    });

    test('should generate fallback URLs correctly', () => {
        const fallbacks = assetLoadingManager.generateFallbackUrls('logo.png', 'logo');
        expect(fallbacks.length).toBeGreaterThan(0);
        expect(fallbacks).toContain('/public/assets/images/logo.png');
    });

    test('should calculate exponential backoff correctly', () => {
        const delay1 = assetLoadingManager.calculateBackoffDelay(0);
        const delay2 = assetLoadingManager.calculateBackoffDelay(1);
        const delay3 = assetLoadingManager.calculateBackoffDelay(2);

        expect(delay2).toBeGreaterThan(delay1);
        expect(delay3).toBeGreaterThan(delay2);
        expect(delay3).toBeLessThanOrEqual(assetLoadingManager.maxDelay);
    });

    test('should validate cache correctly', () => {
        const assetUrl = 'test-asset.jpg';
        
        // Asset not cached
        expect(assetLoadingManager.validateAssetCache(assetUrl)).toBe(false);
        
        // Cache asset
        loadingStateManager.setCached(assetUrl, {
            url: assetUrl,
            type: 'image'
        });
        
        // Should be valid
        expect(assetLoadingManager.validateAssetCache(assetUrl)).toBe(true);
        
        // Should be invalid after max age
        expect(assetLoadingManager.validateAssetCache(assetUrl, { maxAge: -1 })).toBe(false);
    });

    test('should create base64 logo fallback', () => {
        const base64Logo = assetLoadingManager.createBase64LogoFallback();
        expect(base64Logo).toMatch(/^data:image\/svg\+xml;base64,/);
    });
});

describe('ErrorRecoveryManager', () => {
    let loadingStateManager;
    let assetLoadingManager;
    let errorRecoveryManager;

    beforeEach(() => {
        loadingStateManager = new LoadingStateManager();
        assetLoadingManager = new AssetLoadingManager(loadingStateManager);
        errorRecoveryManager = new ErrorRecoveryManager(loadingStateManager, assetLoadingManager);
    });

    test('should log errors correctly', () => {
        const error = new Error('Test error');
        errorRecoveryManager.logError('test-asset', 'image', error, {});
        
        const stats = errorRecoveryManager.getErrorStats();
        expect(stats.totalErrors).toBe(1);
        expect(stats.errorsByType.image).toBe(1);
    });

    test('should create base64 logo fallback', () => {
        const base64Logo = errorRecoveryManager.createBase64Logo();
        expect(base64Logo).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    test('should create placeholder image', () => {
        const placeholder = errorRecoveryManager.createPlaceholderImage();
        expect(placeholder).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    test('should generate alternative paths', () => {
        const paths = errorRecoveryManager.generateAlternativePaths('logo.png', 'logo');
        expect(paths.length).toBeGreaterThan(0);
        expect(paths).toContain('/public/assets/images/logo.png');
    });

    test('should handle styled text fallback', async () => {
        const result = await errorRecoveryManager.useStyledTextFallback('logo', 'logo', {});
        expect(result.tagName).toBe('DIV');
        expect(result.textContent).toBe('ChemActiva');
        expect(result.className).toBe('logo-text-fallback');
    });

    test('should handle base64 fallback', async () => {
        const result = await errorRecoveryManager.useBase64Fallback('logo', 'logo');
        expect(result).toBeInstanceOf(Image);
        expect(result.src).toMatch(/^data:image\/svg\+xml;base64,/);
    });

    test('should track recovery attempts', () => {
        const assetId = 'test-asset';
        const error = new Error('Test error');
        
        // This will fail but should track the attempt
        errorRecoveryManager.handleAssetError(assetId, 'image', error).catch(() => {});
        
        expect(errorRecoveryManager.recoveryAttempts.has(assetId)).toBe(true);
    });

    test('should clear error log', () => {
        const error = new Error('Test error');
        errorRecoveryManager.logError('test-asset', 'image', error, {});
        
        expect(errorRecoveryManager.getErrorStats().totalErrors).toBe(1);
        
        errorRecoveryManager.clearErrorLog();
        expect(errorRecoveryManager.getErrorStats().totalErrors).toBe(0);
    });
});

describe('Integration Tests', () => {
    let loadingStateManager;
    let assetLoadingManager;
    let errorRecoveryManager;

    beforeEach(() => {
        loadingStateManager = new LoadingStateManager();
        assetLoadingManager = new AssetLoadingManager(loadingStateManager);
        errorRecoveryManager = new ErrorRecoveryManager(loadingStateManager, assetLoadingManager);
    });

    test('should integrate all components correctly', () => {
        expect(assetLoadingManager.loadingStateManager).toBe(loadingStateManager);
        expect(errorRecoveryManager.loadingStateManager).toBe(loadingStateManager);
        expect(errorRecoveryManager.assetLoadingManager).toBe(assetLoadingManager);
    });

    test('should handle complete loading workflow', async () => {
        const assetId = 'integration-test';
        const assetUrl = 'test-success.jpg';

        // Start loading
        const result = await assetLoadingManager.loadAssetWithRetry(assetUrl, {
            assetType: 'image',
            assetId
        });

        // Verify state management
        expect(loadingStateManager.isLoaded(assetId)).toBe(true);
        expect(loadingStateManager.isCached(assetId)).toBe(true);
        expect(result).toBeInstanceOf(Image);

        // Verify performance metrics
        const metrics = loadingStateManager.getPerformanceMetrics();
        expect(metrics.successfulLoads).toBeGreaterThan(0);
        expect(metrics.successRate).toBeGreaterThan(0);
    });
});