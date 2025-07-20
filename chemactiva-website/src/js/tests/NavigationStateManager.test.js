/**
 * @jest-environment jsdom
 */

import NavigationStateManager from '../NavigationStateManager.js';

// Mock sessionStorage
const mockSessionStorage = {
    store: {},
    getItem: jest.fn((key) => mockSessionStorage.store[key] || null),
    setItem: jest.fn((key, value) => {
        mockSessionStorage.store[key] = value;
    }),
    removeItem: jest.fn((key) => {
        delete mockSessionStorage.store[key];
    }),
    clear: jest.fn(() => {
        mockSessionStorage.store = {};
    })
};

Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage
});

describe('NavigationStateManager', () => {
    let navigationStateManager;

    beforeEach(() => {
        // Reset DOM
        document.body.className = '';
        document.title = 'Test Page';
        
        // Reset window location
        delete window.location;
        window.location = {
            pathname: '/',
            origin: 'http://localhost'
        };
        
        // Reset document referrer
        Object.defineProperty(document, 'referrer', {
            value: '',
            configurable: true
        });
        
        // Clear session storage mock
        mockSessionStorage.clear();
        
        navigationStateManager = new NavigationStateManager();
    });

    afterEach(() => {
        if (navigationStateManager) {
            navigationStateManager.reset();
        }
    });

    describe('Initialization', () => {
        test('should initialize with current page info', () => {
            expect(navigationStateManager.currentPage).toBeDefined();
            expect(navigationStateManager.currentPage.path).toBe('/');
            expect(navigationStateManager.currentPage.type).toBe('homepage');
        });

        test('should detect page type correctly', () => {
            // Test homepage
            window.location.pathname = '/';
            const manager1 = new NavigationStateManager();
            expect(manager1.currentPage.type).toBe('homepage');

            // Test products page
            window.location.pathname = '/products.html';
            const manager2 = new NavigationStateManager();
            expect(manager2.currentPage.type).toBe('products');

            // Test blog page
            window.location.pathname = '/blog.html';
            const manager3 = new NavigationStateManager();
            expect(manager3.currentPage.type).toBe('blog');
        });

        test('should set up asset requirements for different page types', () => {
            const homepageAssets = navigationStateManager.pageAssetRequirements.get('homepage');
            expect(homepageAssets).toContain('logo');
            expect(homepageAssets).toContain('hero-images');
            expect(homepageAssets).toContain('3d-models');

            const productsAssets = navigationStateManager.pageAssetRequirements.get('products');
            expect(productsAssets).toContain('logo');
            expect(productsAssets).toContain('product-images');
        });
    });

    describe('Navigation Detection', () => {
        test('should detect direct navigation', () => {
            // No referrer = direct navigation
            const context = navigationStateManager.getNavigationContext();
            expect(context.navigationMethod).toBe('direct');
        });

        test('should detect link navigation', () => {
            // Set up referrer from same origin
            Object.defineProperty(document, 'referrer', {
                value: 'http://localhost/products.html',
                configurable: true
            });

            const manager = new NavigationStateManager();
            const context = manager.getNavigationContext();
            expect(context.navigationMethod).toBe('link');
        });

        test('should detect back navigation', () => {
            // Simulate navigation history
            navigationStateManager.trackNavigation(
                { path: '/products.html', type: 'products' },
                { path: '/', type: 'homepage' }
            );
            
            // Navigate back to products
            navigationStateManager.trackNavigation(
                { path: '/', type: 'homepage' },
                { path: '/products.html', type: 'products' }
            );

            const latestNavigation = navigationStateManager.navigationHistory[navigationStateManager.navigationHistory.length - 1];
            expect(latestNavigation.method).toBe('back');
        });
    });

    describe('Loader Decision Logic', () => {
        test('should not skip loader for direct homepage access', () => {
            window.location.pathname = '/';
            document.body.className = 'homepage';
            
            const manager = new NavigationStateManager();
            expect(manager.shouldSkipLoader()).toBe(false);
        });

        test('should skip loader for non-homepage pages', () => {
            window.location.pathname = '/products.html';
            document.body.className = 'products-page';
            
            const manager = new NavigationStateManager();
            expect(manager.shouldSkipLoader()).toBe(true);
        });

        test('should skip loader for internal navigation with cached assets', () => {
            // Set up internal navigation context
            Object.defineProperty(document, 'referrer', {
                value: 'http://localhost/products.html',
                configurable: true
            });

            window.location.pathname = '/';
            document.body.className = 'homepage';
            
            const manager = new NavigationStateManager();
            
            // Simulate recent homepage visit (assets likely cached)
            manager.trackNavigation(
                { path: '/products.html', type: 'products', timestamp: Date.now() - 60000 }, // 1 minute ago
                { path: '/', type: 'homepage', timestamp: Date.now() }
            );

            expect(manager.shouldSkipLoader()).toBe(true);
        });
    });

    describe('Asset State Management', () => {
        test('should update and retrieve asset states', () => {
            navigationStateManager.updateAssetState('logo', 'cached');
            navigationStateManager.updateAssetState('hero-images', 'loading');

            const context = navigationStateManager.getNavigationContext();
            expect(context.cacheStatus.logo).toBe('cached');
            expect(context.cacheStatus['hero-images']).toBe('loading');
        });

        test('should get required assets for current page', () => {
            const assets = navigationStateManager.getRequiredAssets();
            expect(assets).toContain('logo');
            expect(assets).toContain('hero-images'); // homepage assets
        });
    });

    describe('Context Preservation', () => {
        test('should preserve and retrieve page context', () => {
            const testContext = {
                heroLoaderActive: true,
                loadingStartTime: Date.now()
            };

            navigationStateManager.preservePageContext(testContext);
            const preserved = navigationStateManager.getPreservedContext();

            expect(preserved).toBeDefined();
            expect(preserved.heroLoaderActive).toBe(true);
            expect(preserved.navigationState).toBeDefined();
        });

        test('should handle sessionStorage errors gracefully', () => {
            // Mock sessionStorage to throw error
            mockSessionStorage.setItem.mockImplementationOnce(() => {
                throw new Error('Storage quota exceeded');
            });

            // Should not throw error
            expect(() => {
                navigationStateManager.preservePageContext({ test: true });
            }).not.toThrow();
        });
    });

    describe('Navigation Statistics', () => {
        test('should provide navigation statistics', () => {
            // Add some navigation history
            navigationStateManager.trackNavigation(
                { path: '/', type: 'homepage' },
                { path: '/products.html', type: 'products' }
            );
            navigationStateManager.trackNavigation(
                { path: '/products.html', type: 'products' },
                { path: '/', type: 'homepage' }
            );

            const stats = navigationStateManager.getNavigationStats();
            
            expect(stats.totalNavigations).toBeGreaterThan(0);
            expect(stats.currentPage).toBeDefined();
            expect(stats.pageTypeStats).toBeDefined();
            expect(stats.methodStats).toBeDefined();
        });
    });

    describe('Reset Functionality', () => {
        test('should reset all state', () => {
            // Add some state
            navigationStateManager.updateAssetState('logo', 'cached');
            navigationStateManager.preservePageContext({ test: true });
            navigationStateManager.trackNavigation(
                { path: '/', type: 'homepage' },
                { path: '/products.html', type: 'products' }
            );

            // Reset
            navigationStateManager.reset();

            // Verify reset
            expect(navigationStateManager.currentPage).toBeNull();
            expect(navigationStateManager.previousPage).toBeNull();
            expect(navigationStateManager.navigationHistory).toHaveLength(0);
            expect(navigationStateManager.assetLoadingState.size).toBe(0);
        });
    });
});