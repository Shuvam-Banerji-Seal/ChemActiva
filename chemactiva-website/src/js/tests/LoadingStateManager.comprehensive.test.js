/**
 * Comprehensive unit tests for LoadingStateManager
 * Tests all error scenarios, fallback mechanisms, and cache management
 */

import LoadingStateManager from '../LoadingStateManager.js';

describe('LoadingStateManager - Comprehensive Tests', () => {
    let loadingStateManager;

    beforeEach(() => {
        loadingStateManager = new LoadingStateManager();
        jest.clearAllMocks();
    });

    afterEach(() => {
        if (loadingStateManager) {
            loadingStateManager.clearAllStates();
        }
    });

    describe('Initialization and Configuration', () => {
        test('should initialize with default configuration', () => {
            expect(loadingStateManager.loadingStates).toBeInstanceOf(Map);
            expect(loadingStateManager.assetCache).toBeInstanceOf(Map);
            expect(loadingStateManager.criticalAssets).toEqual(['logo', 'hero-images']);
            expect(loadingStateManager.loadingCallbacks).toBeInstanceOf(Map);
            expect(loadingStateManager.errorCallbacks).toBeInstanceOf(Map);
        });

        test('should initialize performance metrics', () => {
            const metrics = loadingStateManager.getPerformanceMetrics();
            expect(metrics.totalLoads).toBe(0);
            expect(metrics.successfulLoads).toBe(0);
            expect(metrics.failedLoads).toBe(0);
            expect(metrics.averageLoadTime).toBe(0);
            expect(metrics.successRate).toBe(0);
        });
    });

    describe('Loading State Registration and Management', () => {
        test('should register loading state with default values', () => {
            const assetId = 'test-asset';
            const state = loadingStateManager.registerLoadingState(assetId);

            expect(state.assetId).toBe(assetId);
            expect(state.status).toBe('loading');
            expect(state.attempts).toBe(0);
            expect(state.fallbackUsed).toBe(false);
            expect(state.errorDetails).toBeNull();
            expect(state.startTime).toBeCloseTo(Date.now(), -2);
        });

        test('should register loading state with custom initial state', () => {
            const assetId = 'test-asset';
            const initialState = {
                status: 'cached',
                attempts: 2,
                fallbackUsed: true
            };
            
            const state = loadingStateManager.registerLoadingState(assetId, initialState);

            expect(state.status).toBe('cached');
            expect(state.attempts).toBe(2);
            expect(state.fallbackUsed).toBe(true);
        });

        test('should update loading state correctly', () => {
            const assetId = 'test-asset';
            loadingStateManager.registerLoadingState(assetId);

            const updates = {
                status: 'loaded',
                attempts: 1,
                fallbackUsed: false
            };

            const updatedState = loadingStateManager.updateLoadingState(assetId, updates);

            expect(updatedState.status).toBe('loaded');
            expect(updatedState.attempts).toBe(1);
            expect(updatedState.fallbackUsed).toBe(false);
            expect(updatedState.lastAttempt).toBeCloseTo(Date.now(), -2);
        });

        test('should handle updating non-existent asset state', () => {
            const result = loadingStateManager.updateLoadingState('non-existent', { status: 'loaded' });
            expect(result).toBeNull();
            expect(console.warn).toHaveBeenCalledWith(
                expect.stringContaining('No state found for asset non-existent')
            );
        });
    });

    describe('State Query Methods', () => {
        beforeEach(() => {
            loadingStateManager.registerLoadingState('loading-asset', { status: 'loading' });
            loadingStateManager.registerLoadingState('loaded-asset', { status: 'loaded' });
            loadingStateManager.registerLoadingState('failed-asset', { status: 'failed' });
            loadingStateManager.registerLoadingState('cached-asset', { status: 'cached' });
        });

        test('should correctly identify loading assets', () => {
            expect(loadingStateManager.isLoading('loading-asset')).toBe(true);
            expect(loadingStateManager.isLoading('loaded-asset')).toBe(false);
            expect(loadingStateManager.isLoading('non-existent')).toBe(false);
        });

        test('should correctly identify loaded assets', () => {
            expect(loadingStateManager.isLoaded('loaded-asset')).toBe(true);
            expect(loadingStateManager.isLoaded('loading-asset')).toBe(false);
            expect(loadingStateManager.isLoaded('non-existent')).toBe(false);
        });

        test('should correctly identify failed assets', () => {
            expect(loadingStateManager.hasFailed('failed-asset')).toBe(true);
            expect(loadingStateManager.hasFailed('loaded-asset')).toBe(false);
            expect(loadingStateManager.hasFailed('non-existent')).toBe(false);
        });

        test('should get loading state correctly', () => {
            const state = loadingStateManager.getLoadingState('loading-asset');
            expect(state).toBeDefined();
            expect(state.status).toBe('loading');

            const nonExistent = loadingStateManager.getLoadingState('non-existent');
            expect(nonExistent).toBeNull();
        });
    });

    describe('Cache Management', () => {
        test('should set and check cached assets', () => {
            const assetId = 'test-asset';
            const cacheData = {
                url: 'test-url.jpg',
                type: 'image',
                size: 1024
            };

            loadingStateManager.registerLoadingState(assetId);
            loadingStateManager.setCached(assetId, cacheData);

            expect(loadingStateManager.isCached(assetId)).toBe(true);
            
            const retrievedCache = loadingStateManager.getCacheData(assetId);
            expect(retrievedCache.url).toBe('test-url.jpg');
            expect(retrievedCache.type).toBe('image');
            expect(retrievedCache.size).toBe(1024);
            expect(retrievedCache.cached).toBe(true);
            expect(retrievedCache.cacheTime).toBeCloseTo(Date.now(), -2);
        });

        test('should handle non-existent cache data', () => {
            expect(loadingStateManager.isCached('non-existent')).toBe(false);
            expect(loadingStateManager.getCacheData('non-existent')).toBeNull();
        });

        test('should update loading state when setting cached', () => {
            const assetId = 'test-asset';
            loadingStateManager.registerLoadingState(assetId);
            loadingStateManager.setCached(assetId);

            const state = loadingStateManager.getLoadingState(assetId);
            expect(state.status).toBe('cached');
        });
    });

    describe('Loader Decision Logic', () => {
        test('should show loader for direct navigation', () => {
            const shouldShow = loadingStateManager.shouldShowLoader('home', {
                navigationMethod: 'direct'
            });
            expect(shouldShow).toBe(true);
        });

        test('should not show loader for internal navigation with cached critical assets', () => {
            // Cache critical assets
            loadingStateManager.setCached('logo');
            loadingStateManager.setCached('hero-images');

            const shouldShow = loadingStateManager.shouldShowLoader('home', {
                navigationMethod: 'link'
            });
            expect(shouldShow).toBe(false);
        });

        test('should show loader for internal navigation with uncached critical assets', () => {
            // Only cache one critical asset
            loadingStateManager.setCached('logo');

            const shouldShow = loadingStateManager.shouldShowLoader('home', {
                navigationMethod: 'link'
            });
            expect(shouldShow).toBe(true);
        });

        test('should show loader when critical assets are loading', () => {
            loadingStateManager.registerLoadingState('logo', { status: 'loading' });

            const shouldShow = loadingStateManager.shouldShowLoader('home', {
                navigationMethod: 'back'
            });
            expect(shouldShow).toBe(true);
        });

        test('should handle empty navigation context', () => {
            const shouldShow = loadingStateManager.shouldShowLoader('home');
            expect(shouldShow).toBe(false);
        });
    });

    describe('Error Handling', () => {
        test('should handle loading failure correctly', () => {
            const assetId = 'test-asset';
            const error = new Error('Network error');
            const assetType = 'image';
            const fallbackStrategy = 'retry';

            loadingStateManager.registerLoadingState(assetId);
            loadingStateManager.handleLoadingFailure(assetId, assetType, error, fallbackStrategy);

            const state = loadingStateManager.getLoadingState(assetId);
            expect(state.status).toBe('failed');
            expect(state.attempts).toBe(1);
            expect(state.fallbackUsed).toBe(true);
            expect(state.errorDetails.message).toBe('Network error');
            expect(state.errorDetails.type).toBe('Error');
            expect(state.errorDetails.fallbackStrategy).toBe('retry');
            expect(state.errorDetails.timestamp).toBeCloseTo(Date.now(), -2);
        });

        test('should handle failure for non-existent asset', () => {
            const error = new Error('Test error');
            
            loadingStateManager.handleLoadingFailure('non-existent', 'image', error);
            
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Cannot handle failure for unknown asset non-existent')
            );
        });

        test('should trigger error callbacks on failure', () => {
            const assetId = 'test-asset';
            const error = new Error('Test error');
            const errorCallback = jest.fn();

            loadingStateManager.registerLoadingState(assetId);
            loadingStateManager.onLoadingError(assetId, errorCallback);
            loadingStateManager.handleLoadingFailure(assetId, 'image', error);

            expect(errorCallback).toHaveBeenCalledWith(
                error,
                expect.objectContaining({ status: 'failed' })
            );
        });
    });

    describe('Callback Management', () => {
        test('should register and trigger loading state change callbacks', () => {
            const assetId = 'test-asset';
            const callback1 = jest.fn();
            const callback2 = jest.fn();

            loadingStateManager.onLoadingStateChange(assetId, callback1);
            loadingStateManager.onLoadingStateChange(assetId, callback2);

            const state = loadingStateManager.registerLoadingState(assetId);

            expect(callback1).toHaveBeenCalledWith(state);
            expect(callback2).toHaveBeenCalledWith(state);
        });

        test('should handle callback errors gracefully', () => {
            const assetId = 'test-asset';
            const errorCallback = jest.fn(() => {
                throw new Error('Callback error');
            });
            const goodCallback = jest.fn();

            loadingStateManager.onLoadingStateChange(assetId, errorCallback);
            loadingStateManager.onLoadingStateChange(assetId, goodCallback);

            const state = loadingStateManager.registerLoadingState(assetId);

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('Error in state change callback'),
                expect.any(Error)
            );
            expect(goodCallback).toHaveBeenCalledWith(state);
        });

        test('should register error callbacks', () => {
            const assetId = 'test-asset';
            const errorCallback = jest.fn();

            loadingStateManager.onLoadingError(assetId, errorCallback);
            
            // Verify callback is stored
            expect(loadingStateManager.errorCallbacks.has(assetId)).toBe(true);
            expect(loadingStateManager.errorCallbacks.get(assetId)).toBe(errorCallback);
        });
    });

    describe('Performance Metrics', () => {
        test('should track successful loads', () => {
            const assetId = 'test-asset';
            loadingStateManager.registerLoadingState(assetId);
            
            // Simulate load completion
            loadingStateManager.updateLoadingState(assetId, { status: 'loaded' });

            const metrics = loadingStateManager.getPerformanceMetrics();
            expect(metrics.totalLoads).toBe(1);
            expect(metrics.successfulLoads).toBe(1);
            expect(metrics.failedLoads).toBe(0);
            expect(metrics.successRate).toBe(100);
            expect(metrics.averageLoadTime).toBeGreaterThan(0);
        });

        test('should track failed loads', () => {
            const assetId = 'test-asset';
            loadingStateManager.registerLoadingState(assetId);
            
            // Simulate load failure
            loadingStateManager.updateLoadingState(assetId, { status: 'failed' });

            const metrics = loadingStateManager.getPerformanceMetrics();
            expect(metrics.totalLoads).toBe(1);
            expect(metrics.successfulLoads).toBe(0);
            expect(metrics.failedLoads).toBe(1);
            expect(metrics.successRate).toBe(0);
        });

        test('should calculate average load time correctly', () => {
            // Create multiple assets with different load times
            const startTime = Date.now() - 1000;
            
            loadingStateManager.registerLoadingState('asset1', { startTime: startTime });
            loadingStateManager.registerLoadingState('asset2', { startTime: startTime - 500 });
            
            loadingStateManager.updateLoadingState('asset1', { status: 'loaded' });
            loadingStateManager.updateLoadingState('asset2', { status: 'loaded' });

            const metrics = loadingStateManager.getPerformanceMetrics();
            expect(metrics.averageLoadTime).toBeGreaterThan(0);
            expect(metrics.successfulLoads).toBe(2);
        });

        test('should handle zero loads gracefully', () => {
            const metrics = loadingStateManager.getPerformanceMetrics();
            expect(metrics.successRate).toBe(0);
            expect(metrics.averageLoadTime).toBe(0);
        });
    });

    describe('State Management Operations', () => {
        test('should clear individual loading state', () => {
            const assetId = 'test-asset';
            const callback = jest.fn();

            loadingStateManager.registerLoadingState(assetId);
            loadingStateManager.onLoadingStateChange(assetId, callback);
            loadingStateManager.onLoadingError(assetId, callback);

            expect(loadingStateManager.getLoadingState(assetId)).toBeDefined();

            loadingStateManager.clearLoadingState(assetId);

            expect(loadingStateManager.getLoadingState(assetId)).toBeNull();
            expect(loadingStateManager.loadingCallbacks.has(assetId)).toBe(false);
            expect(loadingStateManager.errorCallbacks.has(assetId)).toBe(false);
        });

        test('should clear all states', () => {
            loadingStateManager.registerLoadingState('asset1');
            loadingStateManager.registerLoadingState('asset2');
            loadingStateManager.onLoadingStateChange('asset1', jest.fn());

            expect(loadingStateManager.loadingStates.size).toBe(2);

            loadingStateManager.clearAllStates();

            expect(loadingStateManager.loadingStates.size).toBe(0);
            expect(loadingStateManager.loadingCallbacks.size).toBe(0);
            expect(loadingStateManager.errorCallbacks.size).toBe(0);
        });

        test('should get all states', () => {
            loadingStateManager.registerLoadingState('asset1', { status: 'loading' });
            loadingStateManager.registerLoadingState('asset2', { status: 'loaded' });

            const allStates = loadingStateManager.getAllStates();
            expect(allStates).toHaveLength(2);
            expect(allStates.some(state => state.assetId === 'asset1')).toBe(true);
            expect(allStates.some(state => state.assetId === 'asset2')).toBe(true);
        });

        test('should get states by status', () => {
            loadingStateManager.registerLoadingState('loading1', { status: 'loading' });
            loadingStateManager.registerLoadingState('loading2', { status: 'loading' });
            loadingStateManager.registerLoadingState('loaded1', { status: 'loaded' });

            const loadingStates = loadingStateManager.getStatesByStatus('loading');
            const loadedStates = loadingStateManager.getStatesByStatus('loaded');

            expect(loadingStates).toHaveLength(2);
            expect(loadedStates).toHaveLength(1);
            expect(loadingStates.every(state => state.status === 'loading')).toBe(true);
            expect(loadedStates.every(state => state.status === 'loaded')).toBe(true);
        });
    });

    describe('Edge Cases and Error Conditions', () => {
        test('should handle null or undefined asset IDs gracefully', () => {
            expect(() => loadingStateManager.registerLoadingState(null)).not.toThrow();
            expect(() => loadingStateManager.registerLoadingState(undefined)).not.toThrow();
            expect(() => loadingStateManager.updateLoadingState(null, {})).not.toThrow();
        });

        test('should handle empty updates', () => {
            const assetId = 'test-asset';
            loadingStateManager.registerLoadingState(assetId);
            
            const result = loadingStateManager.updateLoadingState(assetId, {});
            expect(result).toBeDefined();
            expect(result.lastAttempt).toBeCloseTo(Date.now(), -2);
        });

        test('should handle concurrent state updates', () => {
            const assetId = 'test-asset';
            loadingStateManager.registerLoadingState(assetId);

            // Simulate concurrent updates
            const update1 = loadingStateManager.updateLoadingState(assetId, { attempts: 1 });
            const update2 = loadingStateManager.updateLoadingState(assetId, { attempts: 2 });

            expect(update2.attempts).toBe(2);
            expect(loadingStateManager.getLoadingState(assetId).attempts).toBe(2);
        });

        test('should handle large numbers of assets', () => {
            const assetCount = 1000;
            
            // Register many assets
            for (let i = 0; i < assetCount; i++) {
                loadingStateManager.registerLoadingState(`asset-${i}`);
            }

            expect(loadingStateManager.getAllStates()).toHaveLength(assetCount);
            
            // Update all to loaded
            for (let i = 0; i < assetCount; i++) {
                loadingStateManager.updateLoadingState(`asset-${i}`, { status: 'loaded' });
            }

            const metrics = loadingStateManager.getPerformanceMetrics();
            expect(metrics.successfulLoads).toBe(assetCount);
        });
    });

    describe('Integration with Navigation Context', () => {
        test('should handle complex navigation scenarios', () => {
            // Set up various asset states
            loadingStateManager.setCached('logo');
            loadingStateManager.registerLoadingState('hero-images', { status: 'loading' });
            loadingStateManager.registerLoadingState('product-data', { status: 'failed' });

            // Test different navigation contexts
            expect(loadingStateManager.shouldShowLoader('home', { navigationMethod: 'direct' })).toBe(true);
            expect(loadingStateManager.shouldShowLoader('home', { navigationMethod: 'link' })).toBe(true); // hero-images loading
            
            // Complete hero-images loading
            loadingStateManager.setCached('hero-images');
            expect(loadingStateManager.shouldShowLoader('home', { navigationMethod: 'link' })).toBe(false);
        });

        test('should handle missing critical assets', () => {
            // No critical assets cached
            const shouldShow = loadingStateManager.shouldShowLoader('home', { navigationMethod: 'back' });
            expect(shouldShow).toBe(false); // No loading assets, so no loader needed
        });
    });
});