/**
 * LoadingStateManager - Centrally coordinates all loading operations and states
 * Manages loading states, asset cache, and critical asset loading
 */
class LoadingStateManager {
    constructor() {
        this.loadingStates = new Map();
        this.assetCache = new Map();
        this.criticalAssets = ['logo', 'hero-images'];
        this.loadingCallbacks = new Map();
        this.errorCallbacks = new Map();
        
        // Initialize performance tracking
        this.performanceMetrics = {
            totalLoads: 0,
            successfulLoads: 0,
            failedLoads: 0,
            averageLoadTime: 0
        };
    }

    /**
     * Register a loading state for an asset
     * @param {string} assetId - Unique identifier for the asset
     * @param {Object} initialState - Initial loading state
     */
    registerLoadingState(assetId, initialState = {}) {
        const state = {
            assetId,
            status: 'loading',
            attempts: 0,
            lastAttempt: Date.now(),
            fallbackUsed: false,
            errorDetails: null,
            startTime: Date.now(),
            ...initialState
        };
        
        this.loadingStates.set(assetId, state);
        this.notifyStateChange(assetId, state);
        return state;
    }

    /**
     * Update loading state for an asset
     * @param {string} assetId - Asset identifier
     * @param {Object} updates - State updates
     */
    updateLoadingState(assetId, updates) {
        const currentState = this.loadingStates.get(assetId);
        if (!currentState) {
            console.warn(`LoadingStateManager: No state found for asset ${assetId}`);
            return null;
        }

        const updatedState = {
            ...currentState,
            ...updates,
            lastAttempt: Date.now()
        };

        this.loadingStates.set(assetId, updatedState);
        this.notifyStateChange(assetId, updatedState);
        
        // Update performance metrics
        this.updatePerformanceMetrics(updatedState);
        
        return updatedState;
    }

    /**
     * Get current loading state for an asset
     * @param {string} assetId - Asset identifier
     * @returns {Object|null} Current state or null if not found
     */
    getLoadingState(assetId) {
        return this.loadingStates.get(assetId) || null;
    }

    /**
     * Check if an asset is currently loading
     * @param {string} assetId - Asset identifier
     * @returns {boolean} True if asset is loading
     */
    isLoading(assetId) {
        const state = this.loadingStates.get(assetId);
        return state && state.status === 'loading';
    }

    /**
     * Check if an asset has loaded successfully
     * @param {string} assetId - Asset identifier
     * @returns {boolean} True if asset is loaded
     */
    isLoaded(assetId) {
        const state = this.loadingStates.get(assetId);
        return state && state.status === 'loaded';
    }

    /**
     * Check if an asset has failed to load
     * @param {string} assetId - Asset identifier
     * @returns {boolean} True if asset failed to load
     */
    hasFailed(assetId) {
        const state = this.loadingStates.get(assetId);
        return state && state.status === 'failed';
    }

    /**
     * Mark an asset as cached
     * @param {string} assetId - Asset identifier
     * @param {Object} cacheData - Cache metadata
     */
    setCached(assetId, cacheData = {}) {
        this.assetCache.set(assetId, {
            cached: true,
            cacheTime: Date.now(),
            ...cacheData
        });
        
        this.updateLoadingState(assetId, { status: 'cached' });
    }

    /**
     * Check if an asset is cached
     * @param {string} assetId - Asset identifier
     * @returns {boolean} True if asset is cached
     */
    isCached(assetId) {
        const cacheData = this.assetCache.get(assetId);
        return cacheData && cacheData.cached;
    }

    /**
     * Get cache data for an asset
     * @param {string} assetId - Asset identifier
     * @returns {Object|null} Cache data or null if not cached
     */
    getCacheData(assetId) {
        return this.assetCache.get(assetId) || null;
    }

    /**
     * Determine if loader should be shown based on loading states
     * @param {string} pageType - Type of page being loaded
     * @param {Object} navigationContext - Navigation context information
     * @returns {boolean} True if loader should be shown
     */
    shouldShowLoader(pageType, navigationContext = {}) {
        // Skip loader if navigating internally and critical assets are cached
        if (navigationContext.navigationMethod === 'link' || navigationContext.navigationMethod === 'back') {
            const criticalAssetsCached = this.criticalAssets.every(assetId => this.isCached(assetId));
            if (criticalAssetsCached) {
                return false;
            }
        }

        // Show loader for initial loads or when critical assets are loading
        const hasLoadingAssets = Array.from(this.loadingStates.values())
            .some(state => state.status === 'loading' && this.criticalAssets.includes(state.assetId));

        return hasLoadingAssets || navigationContext.navigationMethod === 'direct';
    }

    /**
     * Handle loading failure with comprehensive error handling
     * @param {string} assetId - Asset identifier
     * @param {string} assetType - Type of asset (logo, image, etc.)
     * @param {Error} error - Error object
     * @param {string} fallbackStrategy - Fallback strategy to use
     */
    handleLoadingFailure(assetId, assetType, error, fallbackStrategy = 'default') {
        const state = this.getLoadingState(assetId);
        if (!state) {
            console.error(`LoadingStateManager: Cannot handle failure for unknown asset ${assetId}`);
            return;
        }

        const updatedState = {
            status: 'failed',
            attempts: state.attempts + 1,
            errorDetails: {
                message: error.message,
                type: error.name,
                timestamp: Date.now(),
                fallbackStrategy
            },
            fallbackUsed: true
        };

        this.updateLoadingState(assetId, updatedState);
        
        // Trigger error callbacks
        const errorCallback = this.errorCallbacks.get(assetId);
        if (errorCallback) {
            errorCallback(error, updatedState);
        }

        // Log error for debugging
        console.error(`LoadingStateManager: Asset ${assetId} failed to load:`, error);
    }

    /**
     * Register callback for loading state changes
     * @param {string} assetId - Asset identifier
     * @param {Function} callback - Callback function
     */
    onLoadingStateChange(assetId, callback) {
        if (!this.loadingCallbacks.has(assetId)) {
            this.loadingCallbacks.set(assetId, []);
        }
        this.loadingCallbacks.get(assetId).push(callback);
    }

    /**
     * Register callback for loading errors
     * @param {string} assetId - Asset identifier
     * @param {Function} callback - Error callback function
     */
    onLoadingError(assetId, callback) {
        this.errorCallbacks.set(assetId, callback);
    }

    /**
     * Notify registered callbacks of state changes
     * @param {string} assetId - Asset identifier
     * @param {Object} state - Current state
     */
    notifyStateChange(assetId, state) {
        const callbacks = this.loadingCallbacks.get(assetId);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(state);
                } catch (error) {
                    console.error(`LoadingStateManager: Error in state change callback for ${assetId}:`, error);
                }
            });
        }
    }

    /**
     * Update performance metrics based on loading state
     * @param {Object} state - Loading state
     */
    updatePerformanceMetrics(state) {
        if (state.status === 'loaded' || state.status === 'failed') {
            this.performanceMetrics.totalLoads++;
            
            if (state.status === 'loaded') {
                this.performanceMetrics.successfulLoads++;
                
                // Calculate average load time
                const loadTime = Date.now() - state.startTime;
                const currentAvg = this.performanceMetrics.averageLoadTime;
                const totalSuccessful = this.performanceMetrics.successfulLoads;
                this.performanceMetrics.averageLoadTime = 
                    ((currentAvg * (totalSuccessful - 1)) + loadTime) / totalSuccessful;
            } else {
                this.performanceMetrics.failedLoads++;
            }
        }
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            successRate: this.performanceMetrics.totalLoads > 0 
                ? (this.performanceMetrics.successfulLoads / this.performanceMetrics.totalLoads) * 100 
                : 0
        };
    }

    /**
     * Clear loading state for an asset
     * @param {string} assetId - Asset identifier
     */
    clearLoadingState(assetId) {
        this.loadingStates.delete(assetId);
        this.loadingCallbacks.delete(assetId);
        this.errorCallbacks.delete(assetId);
    }

    /**
     * Clear all loading states
     */
    clearAllStates() {
        this.loadingStates.clear();
        this.loadingCallbacks.clear();
        this.errorCallbacks.clear();
    }

    /**
     * Get all current loading states
     * @returns {Array} Array of all loading states
     */
    getAllStates() {
        return Array.from(this.loadingStates.values());
    }

    /**
     * Get loading states by status
     * @param {string} status - Status to filter by
     * @returns {Array} Array of states with matching status
     */
    getStatesByStatus(status) {
        return Array.from(this.loadingStates.values())
            .filter(state => state.status === status);
    }
}

export default LoadingStateManager;