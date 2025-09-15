/**
 * Example usage of the Loading Infrastructure components
 * Demonstrates how LoadingStateManager, AssetLoadingManager, and ErrorRecoveryManager work together
 */

import LoadingStateManager from './LoadingStateManager.js';
import AssetLoadingManager from './AssetLoadingManager.js';
import ErrorRecoveryManager from './ErrorRecoveryManager.js';

/**
 * Example class showing how to use the loading infrastructure
 */
class LoadingInfrastructureExample {
    constructor() {
        // Initialize the loading infrastructure
        this.loadingStateManager = new LoadingStateManager();
        this.assetLoadingManager = new AssetLoadingManager(this.loadingStateManager);
        this.errorRecoveryManager = new ErrorRecoveryManager(
            this.loadingStateManager, 
            this.assetLoadingManager
        );
        
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for loading state changes
     */
    setupEventListeners() {
        // Listen for logo loading state changes
        this.loadingStateManager.onLoadingStateChange('logo', (state) => {
            console.log('Logo loading state changed:', state);
            this.updateLogoDisplay(state);
        });

        // Listen for logo loading errors
        this.loadingStateManager.onLoadingError('logo', (error, state) => {
            console.error('Logo loading error:', error);
            this.handleLogoError(error, state);
        });
    }

    /**
     * Load critical assets (logo, hero images, etc.)
     */
    async loadCriticalAssets() {
        const criticalAssets = [
            {
                url: '/public/assets/images/logo.png',
                assetType: 'logo',
                assetId: 'logo',
                priority: 'critical'
            },
            {
                url: '/public/assets/images/hero-bg.jpg',
                assetType: 'image',
                assetId: 'hero-bg',
                priority: 'critical'
            }
        ];

        try {
            console.log('Starting critical asset preloading...');
            const results = await this.assetLoadingManager.preloadCriticalAssets(criticalAssets);
            
            console.log('Critical asset preloading completed:', results);
            return results;
            
        } catch (error) {
            console.error('Critical asset preloading failed:', error);
            
            // Use error recovery for failed assets
            for (const asset of criticalAssets) {
                try {
                    await this.errorRecoveryManager.handleAssetError(
                        asset.assetId,
                        asset.assetType,
                        error,
                        { originalUrl: asset.url }
                    );
                } catch (recoveryError) {
                    console.error(`Recovery failed for ${asset.assetId}:`, recoveryError);
                }
            }
        }
    }

    /**
     * Load logo with comprehensive error handling
     */
    async loadLogo() {
        try {
            console.log('Loading logo...');
            
            const logo = await this.assetLoadingManager.loadAssetWithRetry(
                '/public/assets/images/logo.png',
                {
                    assetType: 'logo',
                    assetId: 'logo',
                    maxRetries: 3,
                    fallbackUrls: [
                        './public/assets/images/logo.png',
                        'assets/images/logo.png'
                    ]
                }
            );

            console.log('Logo loaded successfully:', logo);
            return logo;

        } catch (error) {
            console.error('Logo loading failed, attempting recovery:', error);
            
            // Attempt error recovery
            try {
                const fallbackLogo = await this.errorRecoveryManager.handleAssetError(
                    'logo',
                    'logo',
                    error,
                    { originalUrl: '/public/assets/images/logo.png' }
                );
                
                console.log('Logo recovery successful:', fallbackLogo);
                return fallbackLogo;
                
            } catch (recoveryError) {
                console.error('Logo recovery failed:', recoveryError);
                throw recoveryError;
            }
        }
    }

    /**
     * Update logo display based on loading state
     */
    updateLogoDisplay(state) {
        const logoContainer = document.querySelector('.logo-container');
        if (!logoContainer) return;

        switch (state.status) {
            case 'loading':
                logoContainer.innerHTML = '<div class="logo-loading">Loading...</div>';
                break;
                
            case 'loaded':
                if (state.fallbackUsed) {
                    console.log('Logo loaded with fallback strategy');
                }
                // Logo will be set by the loading manager
                break;
                
            case 'failed':
                logoContainer.innerHTML = '<div class="logo-error">Logo unavailable</div>';
                break;
        }
    }

    /**
     * Handle logo loading errors
     */
    async handleLogoError(error, state) {
        console.log('Handling logo error with recovery strategies...');
        
        try {
            // Try to recover using the error recovery manager
            const recoveredLogo = await this.errorRecoveryManager.handleAssetError(
                'logo',
                'logo',
                error,
                { originalUrl: '/public/assets/images/logo.png' }
            );
            
            // Update the display with recovered logo
            const logoContainer = document.querySelector('.logo-container');
            if (logoContainer && recoveredLogo) {
                if (recoveredLogo.tagName === 'DIV') {
                    // Text fallback
                    logoContainer.appendChild(recoveredLogo);
                } else if (recoveredLogo instanceof Image) {
                    // Image fallback
                    logoContainer.appendChild(recoveredLogo);
                }
            }
            
        } catch (recoveryError) {
            console.error('All logo recovery strategies failed:', recoveryError);
        }
    }

    /**
     * Check if loader should be shown for navigation
     */
    shouldShowLoader(pageType, navigationContext) {
        return this.loadingStateManager.shouldShowLoader(pageType, navigationContext);
    }

    /**
     * Get loading performance metrics
     */
    getPerformanceMetrics() {
        const loadingStats = this.assetLoadingManager.getLoadingStats();
        const errorStats = this.errorRecoveryManager.getErrorStats();
        
        return {
            loading: loadingStats,
            errors: errorStats,
            timestamp: Date.now()
        };
    }

    /**
     * Example of how to use the infrastructure in a page load scenario
     */
    async handlePageLoad(pageType, navigationContext) {
        console.log(`Handling page load for ${pageType}:`, navigationContext);
        
        // Check if we should show the loader
        const showLoader = this.shouldShowLoader(pageType, navigationContext);
        
        if (showLoader) {
            console.log('Showing loader for page load...');
            // Show loading UI
        }

        try {
            // Load critical assets
            await this.loadCriticalAssets();
            
            // Load page-specific assets
            if (pageType === 'products') {
                await this.loadProductAssets();
            }
            
            console.log('Page load completed successfully');
            
        } catch (error) {
            console.error('Page load failed:', error);
            // Handle page load error
        } finally {
            if (showLoader) {
                console.log('Hiding loader...');
                // Hide loading UI
            }
        }
    }

    /**
     * Load product-specific assets
     */
    async loadProductAssets() {
        const productAssets = [
            {
                url: '/public/assets/images/products/product1.jpg',
                assetType: 'image',
                assetId: 'product1',
                priority: 'normal'
            }
        ];

        for (const asset of productAssets) {
            try {
                await this.assetLoadingManager.loadAssetWithRetry(asset.url, asset);
            } catch (error) {
                console.warn(`Failed to load product asset ${asset.assetId}:`, error);
                // Continue loading other assets
            }
        }
    }
}

export default LoadingInfrastructureExample;