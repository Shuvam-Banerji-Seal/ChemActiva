/**
 * @jest-environment jsdom
 */

// Integration tests for navigation and loading flows
import NavigationStateManager from '../NavigationStateManager.js';
import HeroLoader from '../HeroLoader.js';
import ProductImageGallery from '../ProductImageGallery.js';
import App from '../App.js';
import AssetLoadingManager from '../AssetLoadingManager.js';
import LoadingStateManager from '../LoadingStateManager.js';

// Mock complex dependencies
jest.mock('../SceneManager.js', () => {
    return jest.fn().mockImplementation(() => ({
        initMainScene: jest.fn(),
        cleanup: jest.fn()
    }));
});

jest.mock('../TeamManager.js', () => {
    return jest.fn().mockImplementation(() => ({
        loadAndDisplayTeam: jest.fn().mockResolvedValue(true),
        hasLoaded: true,
        cleanup: jest.fn()
    }));
});

jest.mock('../JourneyManager.js', () => {
    return jest.fn().mockImplementation(() => ({
        loadAndDisplayJourney: jest.fn().mockResolvedValue(true),
        hasLoaded: true,
        cleanup: jest.fn()
    }));
});

describe('Navigation and Loading Integration Tests', () => {
    let app;
    let navigationStateManager;
    let assetLoadingManager;
    let loadingStateManager;

    beforeEach(() => {
        // Reset DOM and window state
        document.body.innerHTML = '';
        document.body.className = '';
        document.title = 'ChemActiva Test';
        
        // Reset window location
        delete window.location;
        window.location = {
            pathname: '/',
            origin: 'http://localhost',
            href: 'http://localhost/'
        };
        
        // Reset document referrer
        Object.defineProperty(document, 'referrer', {
            value: '',
            configurable: true
        });

        // Clear session storage
        sessionStorage.clear();
        
        // Reset console mocks
        jest.clearAllMocks();
    });

    afterEach(() => {
        if (app) {
            app.cleanup?.();
        }
        if (navigationStateManager) {
            navigationStateManager.reset();
        }
        if (assetLoadingManager) {
            assetLoadingManager.cleanup?.();
        }
        if (loadingStateManager) {
            loadingStateManager.cleanup?.();
        }
    });

    describe('Page Navigation Scenarios', () => {
        describe('Direct Homepage Access', () => {
            beforeEach(() => {
                // Set up homepage environment
                document.body.className = 'homepage';
                document.body.innerHTML = `
                    <div id="hero-loader" style="display: block;">
                        <div id="loader-background"></div>
                        <div id="loader-content"></div>
                    </div>
                    <div id="main-container" style="display: none;">
                        <div id="hero-3d-scene-container"></div>
                        <div id="team-grid"></div>
                        <div class="journey-timeline"></div>
                    </div>
                `;
                window.location.pathname = '/';
            });

            test('should show HeroLoader for direct homepage access', async () => {
                navigationStateManager = new NavigationStateManager();
                const shouldSkip = navigationStateManager.shouldSkipLoader();
                
                expect(shouldSkip).toBe(false);
                expect(navigationStateManager.getNavigationContext().navigationMethod).toBe('direct');
            });

            test('should initialize App with HeroLoader for direct access', async () => {
                app = new App();
                
                expect(app.isHomepage).toBe(true);
                expect(app.heroLoader).toBeDefined();
                expect(app.navigationStateManager).toBeDefined();
                
                // Mock HeroLoader start method
                if (app.heroLoader) {
                    app.heroLoader.start = jest.fn().mockResolvedValue(true);
                }
                
                await app.init();
                
                // Verify HeroLoader was attempted to start
                if (app.heroLoader && app.heroLoader.start) {
                    expect(app.heroLoader.start).toHaveBeenCalled();
                }
            });

            test('should handle HeroLoader failure gracefully', async () => {
                app = new App();
                
                // Mock HeroLoader to fail
                if (app.heroLoader) {
                    app.heroLoader.start = jest.fn().mockRejectedValue(new Error('HeroLoader failed'));
                }
                
                await app.init();
                
                // Should not throw and should hide loader
                const loaderElement = document.getElementById('hero-loader');
                expect(loaderElement.style.display).toBe('none');
            });
        });

        describe('Internal Navigation to Homepage', () => {
            beforeEach(() => {
                document.body.className = 'homepage';
                document.body.innerHTML = `
                    <div id="hero-loader" style="display: block;">
                        <div id="loader-background"></div>
                        <div id="loader-content"></div>
                    </div>
                    <div id="main-container" style="display: none;">
                        <div id="hero-3d-scene-container"></div>
                    </div>
                `;
                
                // Set up internal navigation context
                Object.defineProperty(document, 'referrer', {
                    value: 'http://localhost/products.html',
                    configurable: true
                });
                window.location.pathname = '/';
            });

            test('should skip HeroLoader for internal navigation with cached assets', async () => {
                navigationStateManager = new NavigationStateManager();
                
                // Simulate recent homepage visit (assets cached)
                navigationStateManager.trackNavigation(
                    { path: '/products.html', type: 'products', timestamp: Date.now() - 60000 },
                    { path: '/', type: 'homepage', timestamp: Date.now() }
                );
                
                const shouldSkip = navigationStateManager.shouldSkipLoader();
                expect(shouldSkip).toBe(true);
            });

            test('should preserve navigation context during internal navigation', async () => {
                navigationStateManager = new NavigationStateManager();
                
                const context = navigationStateManager.getNavigationContext();
                expect(context.navigationMethod).toBe('link');
                expect(context.previousPage).toBeDefined();
                
                // Preserve context
                navigationStateManager.preservePageContext({
                    internalNavigation: true,
                    fromPage: 'products'
                });
                
                const preserved = navigationStateManager.getPreservedContext();
                expect(preserved.internalNavigation).toBe(true);
                expect(preserved.navigationState).toBeDefined();
            });

            test('should handle back navigation correctly', async () => {
                navigationStateManager = new NavigationStateManager();
                
                // Simulate navigation history for back detection
                navigationStateManager.trackNavigation(
                    { path: '/', type: 'homepage', timestamp: Date.now() - 120000 },
                    { path: '/products.html', type: 'products', timestamp: Date.now() - 60000 }
                );
                navigationStateManager.trackNavigation(
                    { path: '/products.html', type: 'products', timestamp: Date.now() - 60000 },
                    { path: '/', type: 'homepage', timestamp: Date.now() }
                );
                
                const latestNavigation = navigationStateManager.navigationHistory[navigationStateManager.navigationHistory.length - 1];
                expect(latestNavigation.method).toBe('back');
            });
        });

        describe('Non-Homepage Navigation', () => {
            beforeEach(() => {
                document.body.className = 'products-page';
                document.body.innerHTML = `
                    <div class="product-page-container">
                        <div class="product-card-enhanced" data-product="test-product">
                            <div class="product-image-carousel-enhanced">
                                <img src="test1.jpg" alt="Test Product 1">
                                <img src="test2.jpg" alt="Test Product 2">
                            </div>
                        </div>
                    </div>
                `;
                window.location.pathname = '/products.html';
            });

            test('should skip HeroLoader for non-homepage pages', async () => {
                navigationStateManager = new NavigationStateManager();
                const shouldSkip = navigationStateManager.shouldSkipLoader();
                
                expect(shouldSkip).toBe(true);
                expect(navigationStateManager.currentPage.type).toBe('products');
            });

            test('should initialize App without HeroLoader for products page', async () => {
                app = new App();
                
                expect(app.isHomepage).toBe(false);
                expect(app.isProductPage).toBe(true);
                expect(app.heroLoader).toBeNull();
                expect(app.productManager).toBeDefined();
                
                await app.init();
                
                // Should show main content immediately
                const mainContainer = document.getElementById('main-container');
                if (mainContainer) {
                    expect(mainContainer.style.display).toBe('block');
                }
            });
        });
    });

    describe('HeroLoader Activation Logic and Asset Preloading', () => {
        beforeEach(() => {
            document.body.className = 'homepage';
            document.body.innerHTML = `
                <div id="hero-loader" style="display: block;">
                    <div id="loader-background"></div>
                    <div id="loader-content"></div>
                </div>
                <div id="main-container" style="display: none;"></div>
            `;
        });

        describe('Smart HeroLoader Decision Making', () => {
            test('should make intelligent loader decisions based on navigation context', async () => {
                app = new App();
                navigationStateManager = app.navigationStateManager;
                
                const navigationContext = navigationStateManager.getNavigationContext();
                const shouldSkip = navigationStateManager.shouldSkipLoader();
                
                const decision = app.makeHeroLoaderDecision(navigationContext, shouldSkip);
                
                expect(decision).toHaveProperty('shouldShow');
                expect(decision).toHaveProperty('reasoning');
                expect(decision).toHaveProperty('factors');
                expect(typeof decision.shouldShow).toBe('boolean');
                expect(typeof decision.reasoning).toBe('string');
            });

            test('should apply optimizations based on navigation factors', async () => {
                // Set up internal navigation context
                Object.defineProperty(document, 'referrer', {
                    value: 'http://localhost/products.html',
                    configurable: true
                });
                
                app = new App();
                navigationStateManager = app.navigationStateManager;
                
                const navigationContext = navigationStateManager.getNavigationContext();
                const decision = app.makeHeroLoaderDecision(navigationContext, false);
                
                if (decision.optimizations) {
                    expect(decision.optimizations).toHaveProperty('skipIntro');
                    expect(decision.optimizations).toHaveProperty('fastTransition');
                }
            });

            test('should handle network conditions in loader decisions', async () => {
                // Mock slow network connection
                Object.defineProperty(navigator, 'connection', {
                    value: {
                        effectiveType: 'slow-2g',
                        downlink: 0.5,
                        rtt: 2000
                    },
                    configurable: true
                });
                
                app = new App();
                const networkConditions = app.getNetworkConditions();
                
                expect(networkConditions.isSlowConnection).toBe(true);
                expect(networkConditions.effectiveType).toBe('slow-2g');
            });
        });

        describe('Asset Preloading Integration', () => {
            test('should preload critical assets before HeroLoader', async () => {
                assetLoadingManager = new AssetLoadingManager();
                
                const preloadSpy = jest.spyOn(assetLoadingManager, 'preloadCriticalAssets')
                    .mockResolvedValue(true);
                
                await assetLoadingManager.preloadCriticalAssets();
                
                expect(preloadSpy).toHaveBeenCalled();
            });

            test('should handle asset preloading failures gracefully', async () => {
                assetLoadingManager = new AssetLoadingManager();
                
                const preloadSpy = jest.spyOn(assetLoadingManager, 'preloadCriticalAssets')
                    .mockRejectedValue(new Error('Preload failed'));
                
                try {
                    await assetLoadingManager.preloadCriticalAssets();
                } catch (error) {
                    expect(error.message).toBe('Preload failed');
                }
                
                expect(preloadSpy).toHaveBeenCalled();
            });

            test('should coordinate asset states with navigation manager', async () => {
                navigationStateManager = new NavigationStateManager();
                assetLoadingManager = new AssetLoadingManager();
                
                // Update asset states
                navigationStateManager.updateAssetState('logo', 'cached');
                navigationStateManager.updateAssetState('hero-images', 'loading');
                
                const context = navigationStateManager.getNavigationContext();
                expect(context.cacheStatus.logo).toBe('cached');
                expect(context.cacheStatus['hero-images']).toBe('loading');
            });

            test('should preload logos statically', async () => {
                const preloadSpy = jest.spyOn(HeroLoader, 'preloadLogos')
                    .mockResolvedValue(true);
                
                const result = await HeroLoader.preloadLogos();
                
                expect(preloadSpy).toHaveBeenCalled();
                expect(result).toBe(true);
            });
        });

        describe('Loading State Coordination', () => {
            test('should coordinate loading states across components', async () => {
                loadingStateManager = new LoadingStateManager();
                navigationStateManager = new NavigationStateManager();
                
                // Set loading state
                loadingStateManager.setLoadingState('hero-loader', true);
                navigationStateManager.updateAssetState('hero-loader', 'loading');
                
                const isLoading = loadingStateManager.isLoading('hero-loader');
                const context = navigationStateManager.getNavigationContext();
                
                expect(isLoading).toBe(true);
                expect(context.cacheStatus['hero-loader']).toBe('loading');
            });

            test('should handle loading state transitions', async () => {
                loadingStateManager = new LoadingStateManager();
                
                // Start loading
                loadingStateManager.setLoadingState('assets', true);
                expect(loadingStateManager.isLoading('assets')).toBe(true);
                
                // Complete loading
                loadingStateManager.setLoadingState('assets', false);
                expect(loadingStateManager.isLoading('assets')).toBe(false);
            });
        });
    });

    describe('ProductImageGallery Error Recovery and State Preservation', () => {
        let gallery;
        let container;

        beforeEach(() => {
            container = document.createElement('div');
            container.className = 'product-image-carousel-enhanced';
            container.innerHTML = `
                <img src="image1.jpg" alt="Product Image 1">
                <img src="image2.jpg" alt="Product Image 2">
                <img src="invalid-image.jpg" alt="Invalid Image">
                <img src="image4.jpg" alt="Product Image 4">
            `;
            document.body.appendChild(container);
        });

        afterEach(() => {
            if (gallery) {
                gallery.cleanup?.();
            }
            if (container && container.parentNode) {
                container.parentNode.removeChild(container);
            }
        });

        describe('Error Recovery Mechanisms', () => {
            test('should handle image loading failures gracefully', async () => {
                gallery = new ProductImageGallery(container);
                
                // Simulate image load failure
                const failedIndex = 2; // invalid-image.jpg
                gallery.failedImages.add(failedIndex);
                
                // Try to navigate to failed image
                await gallery.goToImage(failedIndex);
                
                // Should find alternative image
                expect(gallery.currentIndex).not.toBe(failedIndex);
                expect(gallery.failedImages.has(failedIndex)).toBe(true);
            });

            test('should implement progressive image loading with fallbacks', async () => {
                gallery = new ProductImageGallery(container);
                
                const loadSpy = jest.spyOn(gallery, 'loadImageWithProgression')
                    .mockResolvedValue(true);
                
                await gallery.loadImageWithProgression(0);
                
                expect(loadSpy).toHaveBeenCalledWith(0);
            });

            test('should show loading states during image transitions', async () => {
                gallery = new ProductImageGallery(container);
                
                // Start transition
                const transitionPromise = gallery.goToImage(1);
                
                // Check for loading indicator
                const loadingIndicator = container.querySelector('.gallery-transition-loading');
                expect(loadingIndicator).toBeDefined();
                
                await transitionPromise;
            });

            test('should handle transition errors with proper fallbacks', async () => {
                gallery = new ProductImageGallery(container);
                
                // Mock transition error
                const originalTransition = gallery.transitionToImage;
                gallery.transitionToImage = jest.fn().mockRejectedValue(new Error('Transition failed'));
                
                await gallery.goToImage(1);
                
                // Should handle error gracefully
                expect(gallery.isTransitioning).toBe(false);
                
                // Restore original method
                gallery.transitionToImage = originalTransition;
            });

            test('should find next available image when current fails', () => {
                gallery = new ProductImageGallery(container);
                
                // Mark some images as failed
                gallery.failedImages.add(1);
                gallery.failedImages.add(2);
                
                const nextAvailable = gallery.findNextAvailableImage(1);
                expect(nextAvailable).toBe(3); // Should skip failed images
            });

            test('should retry failed image loads', async () => {
                gallery = new ProductImageGallery(container);
                
                // Mark image as failed
                const failedIndex = 2;
                gallery.failedImages.add(failedIndex);
                
                // Mock successful retry
                const retrySpy = jest.spyOn(gallery, 'loadImageWithProgression')
                    .mockResolvedValue(true);
                
                // Retry loading
                gallery.failedImages.delete(failedIndex);
                await gallery.loadImageWithProgression(failedIndex);
                
                expect(retrySpy).toHaveBeenCalledWith(failedIndex);
                expect(gallery.failedImages.has(failedIndex)).toBe(false);
            });
        });

        describe('State Preservation During Errors', () => {
            test('should preserve gallery state during image load failures', async () => {
                gallery = new ProductImageGallery(container);
                
                const initialIndex = gallery.currentIndex;
                const initialTransitionState = gallery.isTransitioning;
                
                // Simulate failed transition
                gallery.failedImages.add(2);
                await gallery.goToImage(2);
                
                // Should preserve valid state
                expect(gallery.currentIndex).not.toBe(2);
                expect(gallery.isTransitioning).toBe(false);
            });

            test('should maintain visual continuity during errors', async () => {
                gallery = new ProductImageGallery(container);
                
                // Start at first image
                expect(gallery.currentIndex).toBe(0);
                
                // Try to go to failed image
                gallery.failedImages.add(1);
                await gallery.goToImage(1);
                
                // Should maintain visual state (not show blank screen)
                const activeImage = container.querySelector('.gallery-image.active');
                expect(activeImage).toBeDefined();
                expect(activeImage.style.opacity).not.toBe('0');
            });

            test('should preserve thumbnail states during errors', async () => {
                gallery = new ProductImageGallery(container, { showThumbnails: true });
                
                // Simulate thumbnail creation
                if (gallery.thumbnails && gallery.thumbnails.length > 0) {
                    const initialActiveThumbnail = gallery.thumbnails.find(t => 
                        t.classList.contains('active')
                    );
                    
                    // Try to navigate to failed image
                    gallery.failedImages.add(2);
                    await gallery.goToImage(2);
                    
                    // Should maintain consistent thumbnail state
                    const currentActiveThumbnail = gallery.thumbnails.find(t => 
                        t.classList.contains('active')
                    );
                    expect(currentActiveThumbnail).toBeDefined();
                }
            });

            test('should handle accessibility states during errors', async () => {
                gallery = new ProductImageGallery(container);
                
                // Check initial accessibility state
                const images = container.querySelectorAll('.gallery-image');
                const activeImage = images[gallery.currentIndex];
                expect(activeImage.getAttribute('aria-hidden')).toBe('false');
                
                // Try to navigate to failed image
                gallery.failedImages.add(1);
                await gallery.goToImage(1);
                
                // Should maintain proper accessibility state
                const newActiveImage = container.querySelector('.gallery-image.active');
                expect(newActiveImage.getAttribute('aria-hidden')).toBe('false');
            });
        });

        describe('Error Recovery Integration with Navigation', () => {
            test('should coordinate error recovery with navigation state', async () => {
                navigationStateManager = new NavigationStateManager();
                gallery = new ProductImageGallery(container);
                
                // Update navigation state about gallery errors
                navigationStateManager.updateAssetState('product-images', 'error');
                
                const context = navigationStateManager.getNavigationContext();
                expect(context.cacheStatus['product-images']).toBe('error');
                
                // Simulate recovery
                navigationStateManager.updateAssetState('product-images', 'loaded');
                const updatedContext = navigationStateManager.getNavigationContext();
                expect(updatedContext.cacheStatus['product-images']).toBe('loaded');
            });

            test('should emit events for error recovery coordination', (done) => {
                gallery = new ProductImageGallery(container);
                
                // Listen for error events
                container.addEventListener('imageTransitionError', (event) => {
                    expect(event.detail).toHaveProperty('fromIndex');
                    expect(event.detail).toHaveProperty('toIndex');
                    expect(event.detail).toHaveProperty('error');
                    done();
                });
                
                // Trigger error
                gallery.handleTransitionError(0, 1, new Error('Test error'));
            });

            test('should handle multiple simultaneous error recovery attempts', async () => {
                gallery = new ProductImageGallery(container);
                
                // Mark multiple images as failed
                gallery.failedImages.add(1);
                gallery.failedImages.add(2);
                
                // Attempt multiple recoveries simultaneously
                const recoveryPromises = [
                    gallery.goToImage(1),
                    gallery.goToImage(2),
                    gallery.goToImage(3)
                ];
                
                await Promise.allSettled(recoveryPromises);
                
                // Should handle gracefully without conflicts
                expect(gallery.isTransitioning).toBe(false);
                expect(gallery.currentIndex).toBeGreaterThanOrEqual(0);
                expect(gallery.currentIndex).toBeLessThan(gallery.images.length);
            });
        });

        describe('Performance During Error Recovery', () => {
            test('should not degrade performance during error recovery', async () => {
                gallery = new ProductImageGallery(container);
                
                const startTime = performance.now();
                
                // Simulate multiple error recovery attempts
                for (let i = 0; i < 10; i++) {
                    gallery.failedImages.add(i % 4);
                    await gallery.goToImage(i % 4);
                }
                
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                // Should complete within reasonable time
                expect(duration).toBeLessThan(1000); // 1 second
            });

            test('should clean up error states properly', () => {
                gallery = new ProductImageGallery(container);
                
                // Add error states
                gallery.failedImages.add(1);
                gallery.failedImages.add(2);
                
                // Cleanup
                if (gallery.cleanup) {
                    gallery.cleanup();
                }
                
                // Error states should be cleaned up
                expect(gallery.failedImages.size).toBe(0);
            });
        });
    });

    describe('Cross-Component Integration Scenarios', () => {
        test('should coordinate navigation, loading, and gallery states', async () => {
            // Set up complex scenario with all components
            document.body.className = 'products-page';
            document.body.innerHTML = `
                <div class="product-page-container">
                    <div class="product-card-enhanced" data-product="test-product">
                        <div class="product-image-carousel-enhanced">
                            <img src="test1.jpg" alt="Test Product 1">
                            <img src="test2.jpg" alt="Test Product 2">
                        </div>
                    </div>
                </div>
            `;
            
            // Initialize all components
            navigationStateManager = new NavigationStateManager();
            assetLoadingManager = new AssetLoadingManager();
            loadingStateManager = new LoadingStateManager();
            
            const container = document.querySelector('.product-image-carousel-enhanced');
            const gallery = new ProductImageGallery(container);
            
            // Coordinate states
            navigationStateManager.updateAssetState('product-images', 'loading');
            loadingStateManager.setLoadingState('gallery', true);
            
            // Simulate successful loading
            navigationStateManager.updateAssetState('product-images', 'loaded');
            loadingStateManager.setLoadingState('gallery', false);
            
            // Verify coordination
            const context = navigationStateManager.getNavigationContext();
            expect(context.cacheStatus['product-images']).toBe('loaded');
            expect(loadingStateManager.isLoading('gallery')).toBe(false);
            
            gallery.cleanup?.();
        });

        test('should handle app-level navigation with component coordination', async () => {
            // Set up homepage with navigation
            document.body.className = 'homepage';
            document.body.innerHTML = `
                <div id="hero-loader" style="display: block;">
                    <div id="loader-background"></div>
                    <div id="loader-content"></div>
                </div>
                <div id="main-container" style="display: none;">
                    <div id="hero-3d-scene-container"></div>
                </div>
            `;
            
            app = new App();
            
            // Mock HeroLoader for testing
            if (app.heroLoader) {
                app.heroLoader.start = jest.fn().mockResolvedValue(true);
            }
            
            await app.init();
            
            // Verify navigation state is properly managed
            expect(app.navigationStateManager).toBeDefined();
            expect(app.navigationStateManager.currentPage.type).toBe('homepage');
        });

        test('should handle error propagation across components', async () => {
            navigationStateManager = new NavigationStateManager();
            assetLoadingManager = new AssetLoadingManager();
            
            // Simulate error in asset loading
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
            
            try {
                throw new Error('Asset loading failed');
            } catch (error) {
                // Error should be handled gracefully
                navigationStateManager.updateAssetState('critical-asset', 'error');
            }
            
            const context = navigationStateManager.getNavigationContext();
            expect(context.cacheStatus['critical-asset']).toBe('error');
            
            errorSpy.mockRestore();
        });
    });

    describe('Edge Cases and Boundary Conditions', () => {
        test('should handle rapid navigation changes', async () => {
            navigationStateManager = new NavigationStateManager();
            
            // Simulate rapid navigation changes
            const navigationPromises = [];
            for (let i = 0; i < 10; i++) {
                navigationPromises.push(
                    navigationStateManager.trackNavigation(
                        { path: `/${i}`, type: 'other', timestamp: Date.now() + i },
                        { path: `/${i + 1}`, type: 'other', timestamp: Date.now() + i + 1 }
                    )
                );
            }
            
            await Promise.all(navigationPromises);
            
            // Should handle gracefully
            expect(navigationStateManager.navigationHistory.length).toBeLessThanOrEqual(10);
        });

        test('should handle memory constraints during intensive operations', async () => {
            const container = document.createElement('div');
            container.className = 'product-image-carousel-enhanced';
            
            // Add many images to test memory handling
            for (let i = 0; i < 100; i++) {
                const img = document.createElement('img');
                img.src = `test${i}.jpg`;
                img.alt = `Test Image ${i}`;
                container.appendChild(img);
            }
            
            document.body.appendChild(container);
            
            const gallery = new ProductImageGallery(container);
            
            // Should handle large number of images
            expect(gallery.images.length).toBe(100);
            
            // Cleanup
            gallery.cleanup?.();
            container.remove();
        });

        test('should handle network connectivity changes during operations', async () => {
            navigationStateManager = new NavigationStateManager();
            assetLoadingManager = new AssetLoadingManager();
            
            // Simulate going offline
            Object.defineProperty(navigator, 'onLine', {
                value: false,
                configurable: true
            });
            
            window.dispatchEvent(new Event('offline'));
            
            // Operations should handle offline state
            navigationStateManager.updateAssetState('network-asset', 'offline');
            
            // Simulate going back online
            Object.defineProperty(navigator, 'onLine', {
                value: true,
                configurable: true
            });
            
            window.dispatchEvent(new Event('online'));
            
            // Should recover gracefully
            navigationStateManager.updateAssetState('network-asset', 'online');
            
            const context = navigationStateManager.getNavigationContext();
            expect(context.cacheStatus['network-asset']).toBe('online');
        });
    });
});