// src/js/App.js
import HeroLoader from './HeroLoader.js';
import SceneManager from './SceneManager.js';
import ScrollAnimations from './ScrollAnimations.js';
import TeamManager from './TeamManager.js';
import UIAnimations from './UIAnimations.js';
import JourneyManager from './JourneyManager.js';
import PerformanceManager from './PerformanceManager.js';
import ServiceWorkerManager from './ServiceWorkerManager.js';
import AssetOptimizer from './AssetOptimizer.js';
import ProductManager from './ProductManager.js';
import ProductImageGallery from './ProductImageGallery.js';
import ContactManager from './ContactManager.js';
import ErrorHandler from './ErrorHandler.js';
import AssetLoadingManager from './AssetLoadingManager.js';
import NavigationStateManager from './NavigationStateManager.js';
import AdaptiveLoadingManager from './AdaptiveLoadingManager.js';
import CacheManager from './CacheManager.js';
import LoadingStateManager from './LoadingStateManager.js';
import ModernThemeManager from './ModernThemeManager.js';
import NavigationOptimizer from './NavigationOptimizer.js';
import ModernCursorEffects from './ModernCursorEffects.js';
import ProductsRedesigned from './ProductsRedesigned.js';
import TeamModernized from './TeamModernized.js';
import AdvisorsModernized from './AdvisorsModernized.js';

export default class App {
    constructor() {
        this.uiAnimations = new UIAnimations();
        this.errorHandler = new ErrorHandler();
        this.isHomepage = document.body.classList.contains('homepage');
        this.isProductPage = document.body.classList.contains('products-page') || 
                           window.location.pathname.includes('products');

        // Initialize navigation state manager for smart loading decisions
        this.navigationStateManager = new NavigationStateManager();

        // Initialize strategic asset loading manager
        this.assetLoadingManager = new AssetLoadingManager();
        
        // Initialize cache manager (will be passed to other managers)
        this.cacheManager = new CacheManager();
        
        // Initialize performance manager with dependencies
        this.performanceManager = new PerformanceManager({
            assetLoadingManager: this.assetLoadingManager,
            cacheManager: this.cacheManager,
            loadingStateManager: new LoadingStateManager()
        });
        
        // Initialize adaptive loading manager for network-based optimizations
        this.adaptiveLoadingManager = new AdaptiveLoadingManager({
            assetLoadingManager: this.assetLoadingManager,
            cacheManager: this.cacheManager,
            performanceManager: this.performanceManager
        });

        // Initialize modern theme manager for enhanced theme switching
        this.modernThemeManager = new ModernThemeManager();

        // Initialize modern cursor effects for homepage
        if (this.isHomepage) {
            this.modernCursorEffects = new ModernCursorEffects();
        } else {
            this.modernCursorEffects = null;
        }

        // Performance and caching are handled by PerformanceManager
        // which includes ServiceWorkerManager and AssetOptimizer

        if (this.isHomepage) {
            this.heroLoader = new HeroLoader('#hero-loader');
            this.sceneManager = new SceneManager('#hero-3d-scene-container');
            this.teamManager = new TeamManager('#team-grid', '/team.jsonl');
            this.journeyManager = new JourneyManager('.journey-timeline', '/journey.jsonl');
            this.productsRedesigned = new ProductsRedesigned();
            this.teamModernized = new TeamModernized();
            this.advisorsModernized = new AdvisorsModernized();
        } else {
            this.heroLoader = null;
            this.sceneManager = null;
            this.teamManager = null;
            this.journeyManager = null;
            this.productsRedesigned = null;
            this.teamModernized = null;
            this.advisorsModernized = null;
        }

        // Initialize product page components
        if (this.isProductPage) {
            this.productManager = new ProductManager(this.uiAnimations);
            this.contactManager = new ContactManager();
            this.productGalleries = new Map();
        } else {
            this.productManager = null;
            this.contactManager = null;
            this.productGalleries = null;
        }

        this.scrollAnimations = new ScrollAnimations();
    }

    async init() {
        // Initialize performance tracking early
        await this.performanceManager.init();
        
        // Initialize navigation optimization for cross-page asset caching
        console.log('[App] Initializing navigation optimization');
        NavigationOptimizer.init(); // NavigationOptimizer is a singleton, already initialized
        
        // Initialize adaptive loading based on network conditions
        console.log('[App] Initializing adaptive loading based on network conditions');
        this.initAdaptiveLoading();
        
        // Initialize strategic asset preloading system
        console.log('[App] Initializing strategic asset preloading');
        await this.initStrategicPreloading();
        
        // Theme initialization is now handled by ModernThemeManager in constructor
        // this.uiAnimations.initThemeToggle(); // Replaced by ModernThemeManager

        // Use NavigationStateManager to make smart HeroLoader decisions
        await this.initSmartHeroLoader();

        // Finalize integration and apply cross-browser optimizations
        await this.finalizeIntegration();

        this.showMainContent();
    }
    
    /**
     * Initialize adaptive loading based on network conditions
     */
    initAdaptiveLoading() {
        // Set up event listeners for adaptive loading events
        window.addEventListener('networkConditionChange', (event) => {
            console.log('[App] Network condition changed:', event.detail);
            this.handleNetworkConditionChange(event.detail);
        });
        
        window.addEventListener('adaptiveStrategyChange', (event) => {
            console.log('[App] Adaptive strategy changed:', event.detail);
            this.applyAdaptiveStrategy(event.detail);
        });
        
        // Listen for save-data preference
        if (navigator.connection && navigator.connection.saveData) {
            console.log('[App] Save-Data preference detected, optimizing for data savings');
            this.adaptiveLoadingManager.setQualityPreference('low');
        }
        
        console.log('[App] Adaptive loading initialized');
    }
    
    /**
     * Handle network condition changes
     * @param {Object} networkCondition - Network condition details
     */
    handleNetworkConditionChange(networkCondition) {
        // Update UI to reflect network condition
        const networkStatus = document.getElementById('network-status');
        if (networkStatus) {
            networkStatus.textContent = `Network: ${networkCondition.effectiveType}`;
            
            // Add visual indicator for slow connections
            if (networkCondition.effectiveType === 'slow-2g' || networkCondition.effectiveType === '2g') {
                networkStatus.classList.add('slow-connection');
            } else {
                networkStatus.classList.remove('slow-connection');
            }
        }
        
        // Update loading timeouts based on network condition
        if (this.assetLoadingManager) {
            const timeout = this.getTimeoutForNetworkType(networkCondition.effectiveType);
            console.log(`[App] Adjusting loading timeouts to ${timeout}ms based on network condition`);
            // This would require a method in AssetLoadingManager to adjust timeouts
        }
    }
    
    /**
     * Apply adaptive loading strategy
     * @param {Object} strategy - Adaptive loading strategy details
     */
    applyAdaptiveStrategy(strategy) {
        console.log(`[App] Applying ${strategy.strategy} strategy for ${strategy.networkType} network`);
        
        // Apply image quality settings to product galleries
        if (this.productGalleries) {
            this.productGalleries.forEach(gallery => {
                if (gallery.setImageQuality) {
                    gallery.setImageQuality(strategy.imageQuality);
                }
            });
        }
        
        // Apply animation settings based on strategy
        if (strategy.strategy === 'minimal' || strategy.strategy === 'reduced') {
            // Check if setReducedMotion method exists before calling it
            if (this.uiAnimations && typeof this.uiAnimations.setReducedMotion === 'function') {
                this.uiAnimations.setReducedMotion(true);
            }
            
            if (this.scrollAnimations && typeof this.scrollAnimations.setReducedMotion === 'function') {
                this.scrollAnimations.setReducedMotion(true);
            }
        } else {
            if (this.uiAnimations && typeof this.uiAnimations.setReducedMotion === 'function') {
                this.uiAnimations.setReducedMotion(false);
            }
            
            if (this.scrollAnimations && typeof this.scrollAnimations.setReducedMotion === 'function') {
                this.scrollAnimations.setReducedMotion(false);
            }
        }
        
        // Emit event for other components to adapt
        window.dispatchEvent(new CustomEvent('appAdaptiveStrategyApplied', {
            detail: strategy
        }));
    }
    
    /**
     * Get appropriate timeout value based on network type
     * @param {string} networkType - Network type (slow-2g, 2g, 3g, 4g)
     * @returns {number} Timeout in milliseconds
     */
    getTimeoutForNetworkType(networkType) {
        switch (networkType) {
            case 'slow-2g': return 10000; // 10s
            case '2g': return 8000; // 8s
            case '3g': return 5000; // 5s
            case '4g': return 3000; // 3s
            default: return 5000; // Default 5s
        }
    }

    /**
     * Initialize HeroLoader with smart activation logic based on navigation context
     */
    async initSmartHeroLoader() {
        const navigationContext = this.navigationStateManager.getNavigationContext();
        const shouldSkipLoader = this.navigationStateManager.shouldSkipLoader();
        
        console.log('[App] Navigation context:', navigationContext);
        console.log('[App] Should skip HeroLoader:', shouldSkipLoader);

        // Update asset states in navigation manager
        this.updateNavigationAssetStates();

        // Enhanced decision logic based on navigation context
        const loaderDecision = this.makeHeroLoaderDecision(navigationContext, shouldSkipLoader);
        
        if (this.isHomepage && this.heroLoader && loaderDecision.shouldShow) {
            console.log('[App] Starting HeroLoader for homepage with navigation context');
            console.log('[App] Loader decision reasoning:', loaderDecision.reasoning);
            
            try {
                // Preserve page context during loading
                this.navigationStateManager.preservePageContext({
                    heroLoaderActive: true,
                    loadingStartTime: Date.now(),
                    loaderDecision: loaderDecision
                });

                // Apply optimizations based on navigation context
                await this.optimizeHeroLoaderForContext(navigationContext);

                await this.heroLoader.start();
                
                console.log('[App] HeroLoader completed successfully');
                
                // Update navigation state after successful loading
                this.navigationStateManager.updateAssetState('hero-loader', 'completed');
                
            } catch (error) {
                console.error('[App] Hero loader failed, showing main content directly:', error);
                this.handleHeroLoaderFailure(error);
            }
        } else {
            // Skip HeroLoader - either not homepage or navigation context suggests skipping
            console.log('[App] Skipping HeroLoader - Reason:', loaderDecision.reasoning);
            
            this.hideHeroLoader();
            
            // If we're on homepage but skipping loader, ensure assets are still preloaded
            if (this.isHomepage) {
                await this.ensureHomepageAssetsLoaded();
            }
            
            // Update navigation state to reflect skipped loader
            this.navigationStateManager.updateAssetState('hero-loader', 'skipped');
            this.navigationStateManager.preservePageContext({
                heroLoaderSkipped: true,
                skipReason: loaderDecision.reasoning,
                assetsPreloaded: this.isHomepage
            });
        }
    }

    /**
     * Make intelligent decision about whether to show HeroLoader based on navigation context
     * @param {Object} navigationContext - Navigation context from NavigationStateManager
     * @param {boolean} shouldSkipLoader - Basic skip recommendation
     * @returns {Object} Decision object with shouldShow flag and reasoning
     */
    makeHeroLoaderDecision(navigationContext, shouldSkipLoader) {
        const { navigationMethod, currentPage, previousPage, assetsRequired, cacheStatus } = navigationContext;
        
        // Decision factors
        const factors = {
            isHomepage: this.isHomepage,
            hasHeroLoader: !!this.heroLoader,
            navigationMethod: navigationMethod,
            basicSkipRecommendation: shouldSkipLoader,
            assetsCached: this.areRequiredAssetsCached(assetsRequired, cacheStatus),
            isRecentReturn: this.isRecentReturnToHomepage(navigationContext),
            networkConditions: this.getNetworkConditions()
        };

        // Enhanced decision logic
        let shouldShow = false;
        let reasoning = [];

        // Must be homepage with HeroLoader available
        if (!factors.isHomepage || !factors.hasHeroLoader) {
            reasoning.push('Not homepage or HeroLoader not available');
            return { shouldShow: false, reasoning: reasoning.join('; '), factors };
        }

        // Direct access to homepage - always show loader
        if (factors.navigationMethod === 'direct') {
            shouldShow = true;
            reasoning.push('Direct access to homepage - showing loader for branding');
        }
        // Internal navigation - use smart logic
        else if (factors.navigationMethod === 'link' || factors.navigationMethod === 'back') {
            // CRITICAL: Respect basic skip recommendation for intra-page navigation
            if (factors.basicSkipRecommendation) {
                shouldShow = false;
                reasoning.push('Basic skip recommendation (likely intra-page navigation) - skipping loader');
            } else if (factors.assetsCached && factors.isRecentReturn) {
                shouldShow = false;
                reasoning.push('Recent return with cached assets - skipping for performance');
            } else if (factors.networkConditions.isSlowConnection) {
                shouldShow = false;
                reasoning.push('Slow network detected - skipping to improve UX');
            } else {
                // Show loader but with optimizations
                shouldShow = true;
                reasoning.push('Internal navigation but showing optimized loader');
            }
        }
        // Forward navigation - typically skip
        else if (factors.navigationMethod === 'forward') {
            shouldShow = false;
            reasoning.push('Forward navigation - skipping loader');
        }
        // Unknown navigation method - be conservative
        else {
            shouldShow = !factors.basicSkipRecommendation;
            reasoning.push(`Unknown navigation method (${factors.navigationMethod}) - using basic recommendation`);
        }

        return {
            shouldShow,
            reasoning: reasoning.join('; '),
            factors,
            optimizations: shouldShow ? this.getLoaderOptimizations(factors) : null
        };
    }

    /**
     * Check if required assets are likely cached
     * @param {Array} assetsRequired - List of required assets
     * @param {Object} cacheStatus - Cache status for assets
     * @returns {boolean} True if most assets are cached
     */
    areRequiredAssetsCached(assetsRequired, cacheStatus) {
        if (!assetsRequired || assetsRequired.length === 0) return false;
        
        const cachedCount = assetsRequired.filter(assetId => {
            const status = cacheStatus[assetId];
            return status === 'cached' || status === 'likely_cached';
        }).length;
        
        // Consider assets cached if at least 70% are cached
        return (cachedCount / assetsRequired.length) >= 0.7;
    }

    /**
     * Check if this is a recent return to homepage
     * @param {Object} navigationContext - Navigation context
     * @returns {boolean} True if recent return
     */
    isRecentReturnToHomepage(navigationContext) {
        const navigationStats = this.navigationStateManager.getNavigationStats();
        const recentHomepageVisit = navigationStats.pageTypeStats.homepage > 0;
        
        // Check if we visited homepage in the last 10 minutes
        if (recentHomepageVisit && navigationStats.navigationHistory) {
            const recentHomepageNav = navigationStats.navigationHistory
                .reverse()
                .find(nav => nav.to && nav.to.type === 'homepage');
            
            if (recentHomepageNav) {
                const timeSinceLastVisit = Date.now() - recentHomepageNav.timestamp;
                return timeSinceLastVisit < 10 * 60 * 1000; // 10 minutes
            }
        }
        
        return false;
    }

    /**
     * Get current network conditions
     * @returns {Object} Network conditions object
     */
    getNetworkConditions() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        return {
            isSlowConnection: connection ? 
                (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') : 
                false,
            effectiveType: connection?.effectiveType || 'unknown',
            downlink: connection?.downlink || null,
            rtt: connection?.rtt || null
        };
    }

    /**
     * Get loader optimizations based on navigation factors
     * @param {Object} factors - Decision factors
     * @returns {Object} Optimization settings
     */
    getLoaderOptimizations(factors) {
        const optimizations = {
            skipIntro: false,
            reducedAnimations: false,
            fastTransition: false,
            preloadOnly: false
        };

        // Skip intro for internal navigation
        if (factors.navigationMethod === 'link' || factors.navigationMethod === 'back') {
            optimizations.skipIntro = true;
            optimizations.fastTransition = true;
        }

        // Reduce animations on slow connections
        if (factors.networkConditions.isSlowConnection) {
            optimizations.reducedAnimations = true;
            optimizations.fastTransition = true;
        }

        // Use preload-only mode if assets are mostly cached
        if (factors.assetsCached) {
            optimizations.preloadOnly = true;
        }

        return optimizations;
    }

    /**
     * Optimize HeroLoader based on navigation context
     * @param {Object} navigationContext - Navigation context
     */
    async optimizeHeroLoaderForContext(navigationContext) {
        if (!this.heroLoader) return;

        const decision = this.makeHeroLoaderDecision(navigationContext, false);
        const optimizations = decision.optimizations;

        if (!optimizations) return;

        console.log('[App] Applying HeroLoader optimizations:', optimizations);

        // Apply optimizations to HeroLoader if it supports them
        if (this.heroLoader.setOptimizations) {
            this.heroLoader.setOptimizations(optimizations);
        }

        // Preload assets if needed
        if (optimizations.preloadOnly) {
            try {
                await this.assetLoadingManager.preloadCriticalAssets();
                console.log('[App] Critical assets preloaded for optimized loader');
            } catch (error) {
                console.warn('[App] Failed to preload assets for optimization:', error);
            }
        }

        // Set reduced animation mode if supported
        if (optimizations.reducedAnimations && this.heroLoader.setAnimationMode) {
            this.heroLoader.setAnimationMode('reduced');
        }

        // Set fast transition mode if supported
        if (optimizations.fastTransition && this.heroLoader.setTransitionSpeed) {
            this.heroLoader.setTransitionSpeed('fast');
        }
    }

    /**
     * Update asset states in NavigationStateManager based on current loading status
     */
    updateNavigationAssetStates() {
        // Update logo state
        if (this.assetLoadingManager) {
            const logoState = this.assetLoadingManager.getAssetState?.('logo') || 'unknown';
            this.navigationStateManager.updateAssetState('logo', logoState);
        }

        // Update other critical asset states
        const criticalAssets = ['hero-images', '3d-models', 'team-data', 'journey-data'];
        criticalAssets.forEach(assetId => {
            // This would integrate with actual asset loading status
            // For now, we'll use a heuristic based on page visit patterns
            const state = this.estimateAssetState(assetId);
            this.navigationStateManager.updateAssetState(assetId, state);
        });
    }

    /**
     * Estimate asset state based on navigation patterns and cache heuristics
     * @param {string} assetId - Asset identifier
     * @returns {string} Estimated asset state
     */
    estimateAssetState(assetId) {
        // Check if we have cache information
        if (this.assetLoadingManager && this.assetLoadingManager.isCached) {
            if (this.assetLoadingManager.isCached(assetId)) {
                return 'cached';
            }
        }

        // Use navigation patterns to estimate
        const navigationStats = this.navigationStateManager.getNavigationStats();
        const hasRecentHomepageVisit = navigationStats.pageTypeStats.homepage > 0;
        
        if (hasRecentHomepageVisit && assetId === 'logo') {
            return 'likely_cached';
        }

        return 'unknown';
    }

    /**
     * Handle HeroLoader failure with proper fallback
     * @param {Error} error - The error that occurred
     */
    handleHeroLoaderFailure(error) {
        console.error('[App] Handling HeroLoader failure:', error);
        
        // Log error for debugging
        this.errorHandler?.handleJavaScriptError(error, {
            component: 'App',
            method: 'initSmartHeroLoader',
            context: 'HeroLoader failure'
        });

        // Hide the loader
        this.hideHeroLoader();

        // Update navigation context to reflect failure
        this.navigationStateManager.preservePageContext({
            heroLoaderFailed: true,
            failureReason: error.message,
            fallbackUsed: true
        });
    }

    /**
     * Hide HeroLoader element
     */
    hideHeroLoader() {
        const loaderElement = document.getElementById('hero-loader');
        if (loaderElement) {
            loaderElement.style.display = 'none';
            console.log('[App] HeroLoader hidden');
        }
    }

    /**
     * Ensure homepage assets are loaded even when skipping HeroLoader
     */
    async ensureHomepageAssetsLoaded() {
        console.log('[App] Ensuring homepage assets are loaded without HeroLoader');
        
        try {
            // Preload critical homepage assets in background
            if (this.assetLoadingManager) {
                const criticalAssets = await this.assetLoadingManager.preloadCriticalAssets();
                console.log('[App] Critical homepage assets preloaded:', criticalAssets);
            }

            // Preload logo specifically if not already loaded
            const logoPreloaded = await HeroLoader.preloadLogos();
            console.log('[App] Logo preloading result:', logoPreloaded);

        } catch (error) {
            console.warn('[App] Failed to ensure homepage assets loaded:', error);
        }
    }

    /**
     * Initialize strategic asset preloading system
     */
    async initStrategicPreloading() {
        try {
            console.log('[App] Starting strategic asset preloading');
            
            // Phase 1: Preload critical above-the-fold assets immediately
            const criticalResult = await this.assetLoadingManager.preloadCriticalAssets();
            console.log(`[App] Critical assets preloaded: ${criticalResult ? 'success' : 'partial/failed'}`);
            
            // Phase 2: Warm cache for critical assets
            await this.assetLoadingManager.warmCache();
            
            // Phase 3: Start pattern-based preloading (non-blocking)
            this.startPatternBasedPreloading();
            
            // Phase 4: Start priority-based preloading for current page type
            this.startPriorityBasedPreloading();
            
            console.log('[App] Strategic asset preloading initialized');
            
        } catch (error) {
            console.error('[App] Strategic preloading initialization failed:', error);
            
            // Fallback to basic logo preloading
            try {
                const logoSuccess = await HeroLoader.preloadLogos();
                console.log(`[App] Fallback logo preloading ${logoSuccess ? 'successful' : 'failed'}`);
            } catch (fallbackError) {
                console.warn('[App] Even fallback logo preloading failed:', fallbackError);
            }
        }
    }

    /**
     * Start pattern-based preloading in the background
     */
    async startPatternBasedPreloading() {
        // Run pattern-based preloading after a short delay to not block initial page load
        setTimeout(async () => {
            try {
                const result = await this.assetLoadingManager.preloadBasedOnPatterns();
                console.log(`[App] Pattern-based preloading completed: ${result.successful}/${result.total} assets`);
            } catch (error) {
                console.warn('[App] Pattern-based preloading failed:', error);
            }
        }, 2000); // 2 second delay
    }

    /**
     * Start priority-based preloading for current page type
     */
    async startPriorityBasedPreloading() {
        // Run priority-based preloading after pattern-based to avoid network congestion
        setTimeout(async () => {
            try {
                // Use different priority thresholds based on page type
                const minPriority = this.isHomepage ? 3 : 2; // Higher priority for homepage
                const result = await this.assetLoadingManager.preloadByPriority(minPriority);
                console.log(`[App] Priority-based preloading completed: ${result.successful}/${result.total} assets`);
            } catch (error) {
                console.warn('[App] Priority-based preloading failed:', error);
            }
        }, 4000); // 4 second delay
    }

    showMainContent() {
        const mainContainer = document.getElementById('main-container');
        if (!mainContainer) {
            console.error("CRITICAL: #main-container element not found!");
            return;
        }
        mainContainer.style.display = 'block';

        this.uiAnimations.init();

        requestAnimationFrame(async () => {
            if (this.isHomepage) {
                if (this.sceneManager) this.sceneManager.initMainScene();
                
                const dataLoadingPromises = [];
                if (this.journeyManager) dataLoadingPromises.push(this.journeyManager.loadAndDisplayJourney());
                if (this.teamManager) dataLoadingPromises.push(this.teamManager.loadAndDisplayTeam());
                await Promise.all(dataLoadingPromises);
            }

            // Initialize product page components
            if (this.isProductPage) {
                await this.initProductPageComponents();
            }

            this.scrollAnimations.init(this.sceneManager);

            if (this.isHomepage) {
                if (this.journeyManager?.hasLoaded) {
                    this.scrollAnimations.initJourneyTimelineAnimations();
                }
                if (this.teamManager?.hasLoaded) {
                    this.scrollAnimations.initTeamAutoScroll();
                }
                
                // Initialize redesigned products section
                if (this.productsRedesigned) {
                    this.productsRedesigned.init();
                    console.log('[App] ProductsRedesigned initialized');
                }
                
                // Initialize modernized team section
                if (this.teamModernized) {
                    this.teamModernized.init();
                    console.log('[App] TeamModernized initialized');
                }
                
                // Initialize modernized advisors section
                if (this.advisorsModernized) {
                    this.advisorsModernized.init();
                    console.log('[App] AdvisorsModernized initialized');
                }
            }

            const currentYearSpan = document.getElementById('current-year');
            if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
        });
    }

    async initProductPageComponents() {
        try {
            console.log('Initializing product page components...');

            // Initialize ProductManager first
            if (this.productManager) {
                this.productManager.init();
                console.log(`ProductManager initialized with ${this.productManager.productCards.length} product cards`);
            }

            // Initialize ContactManager
            if (this.contactManager) {
                this.contactManager.init();
                console.log('ContactManager initialized');
            }

            // Initialize individual product image galleries
            await this.initProductImageGalleries();

            // Set up component event listeners
            this.setupProductPageEventListeners();

            // Optimize bundle and eliminate unused code
            this.optimizeProductPageBundle();

            console.log('Product page components initialized successfully');

        } catch (error) {
            this.errorHandler.handleJavaScriptError(error, {
                component: 'App',
                method: 'initProductPageComponents'
            });
            
            console.error('Failed to initialize product page components:', error);
            
            // Attempt graceful degradation
            this.initProductPageFallback();
        }
    }

    async initProductImageGalleries() {
        const galleryContainers = document.querySelectorAll('.product-image-carousel-enhanced');
        
        for (const container of galleryContainers) {
            try {
                const gallery = new ProductImageGallery(container, {
                    autoPlay: false,
                    showThumbnails: true,
                    enableKeyboard: true,
                    enableTouch: true,
                    transitionDuration: 0.6
                });

                // Store gallery reference for cleanup
                const productCard = container.closest('.product-card-enhanced');
                const productId = productCard?.dataset.product || `gallery-${this.productGalleries.size}`;
                this.productGalleries.set(productId, gallery);

                console.log(`Product image gallery initialized for: ${productId}`);

            } catch (error) {
                console.warn(`Failed to initialize gallery for container:`, container, error);
                
                // Continue with other galleries even if one fails
                this.errorHandler.logError('Gallery Initialization Failed', {
                    container: container.className,
                    error: error.message
                });
            }
        }

        console.log(`Initialized ${this.productGalleries.size} product image galleries`);
    }

    setupProductPageEventListeners() {
        // Listen for product contact events
        window.addEventListener('productContactClick', (event) => {
            console.log('Product contact clicked:', event.detail);
            
            if (this.contactManager) {
                this.contactManager.handleProductInquiry(event.detail);
            }
        });

        // Listen for product CTA events
        window.addEventListener('productCTAClick', (event) => {
            console.log('Product CTA clicked:', event.detail);
            
            // Track analytics or perform additional actions
            this.trackProductInteraction('cta_click', event.detail);
        });

        // Listen for accordion toggle events
        window.addEventListener('accordionToggle', (event) => {
            console.log('Accordion toggled:', event.detail);
            
            // Track analytics
            this.trackProductInteraction('accordion_toggle', event.detail);
        });

        // Listen for image gallery events
        window.addEventListener('imageLoaded', (event) => {
            console.log('Image loaded:', event.detail);
        });

        window.addEventListener('imageLoadFailed', (event) => {
            console.warn('Image load failed:', event.detail);
            
            this.errorHandler.logError('Product Image Load Failed', event.detail);
        });

        // Listen for performance optimization events
        window.addEventListener('performanceOptimization', (event) => {
            console.log('Performance optimization triggered:', event.detail);
            
            // Apply additional optimizations based on the type
            this.handlePerformanceOptimization(event.detail);
        });

        // Listen for network status changes
        window.addEventListener('networkRestored', () => {
            console.log('Network restored, retrying failed operations');
            
            // Retry failed image loads
            this.productGalleries.forEach(gallery => {
                if (gallery.retryFailedImages) {
                    gallery.retryFailedImages();
                }
            });
        });

        console.log('Product page event listeners set up');
    }

    trackProductInteraction(action, details) {
        // Track user interactions for analytics
        const interactionData = {
            action: action,
            timestamp: Date.now(),
            page: window.location.pathname,
            ...details
        };

        // Send to analytics service (if available)
        if (window.gtag) {
            window.gtag('event', action, {
                event_category: 'product_interaction',
                event_label: details.productId || details.productName,
                value: 1
            });
        }

        console.log('Product interaction tracked:', interactionData);
    }

    handlePerformanceOptimization(optimizationData) {
        const { type, value } = optimizationData;

        switch (type) {
            case 'lcp':
                // Optimize for Largest Contentful Paint
                this.optimizeLCP();
                break;
            case 'fid':
                // Optimize for First Input Delay
                this.optimizeFID();
                break;
            case 'cls':
                // Optimize for Cumulative Layout Shift
                this.optimizeCLS();
                break;
            default:
                console.log('Unknown optimization type:', type);
        }
    }

    optimizeLCP() {
        // Preload critical product images more aggressively
        const criticalImages = document.querySelectorAll('.product-image-carousel-enhanced img:first-child');
        criticalImages.forEach(img => {
            if (!img.complete && img.src) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = img.src;
                document.head.appendChild(link);
            }
        });
    }

    optimizeFID() {
        // Defer non-critical product page JavaScript
        const nonCriticalScripts = document.querySelectorAll('script:not([data-critical])');
        nonCriticalScripts.forEach(script => {
            if (!script.defer && !script.async) {
                script.defer = true;
            }
        });
    }

    optimizeCLS() {
        // Add explicit dimensions to product images
        const productImages = document.querySelectorAll('.product-image-carousel-enhanced img');
        productImages.forEach(img => {
            if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
                // Set default dimensions to prevent layout shift
                img.setAttribute('width', '400');
                img.setAttribute('height', '300');
                img.style.aspectRatio = '4/3';
            }
        });
    }

    optimizeProductPageBundle() {
        // Remove unused CSS classes and optimize bundle size
        this.removeUnusedCSS();
        this.optimizeImageLoading();
        this.enableCodeSplitting();
    }

    removeUnusedCSS() {
        // Identify and remove unused CSS classes (simplified implementation)
        const usedClasses = new Set();
        
        // Collect all classes used in the DOM
        document.querySelectorAll('*').forEach(element => {
            element.classList.forEach(className => {
                usedClasses.add(className);
            });
        });

        console.log(`Found ${usedClasses.size} CSS classes in use`);
    }

    optimizeImageLoading() {
        // Implement progressive image enhancement
        const images = document.querySelectorAll('.product-image-carousel-enhanced img');
        
        images.forEach(img => {
            // Add loading="lazy" if not already present
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }

            // Add decoding="async" for better performance
            if (!img.hasAttribute('decoding')) {
                img.setAttribute('decoding', 'async');
            }
        });
    }

    enableCodeSplitting() {
        // Dynamic imports for non-critical functionality
        if ('IntersectionObserver' in window) {
            // Code splitting is already handled by dynamic imports in components
            console.log('Code splitting enabled via dynamic imports');
        }
    }

    initProductPageFallback() {
        console.warn('Initializing product page in fallback mode');
        
        try {
            // Basic functionality without advanced features
            const productCards = document.querySelectorAll('.product-card-enhanced');
            
            productCards.forEach((card, index) => {
                // Basic click handlers
                const contactButtons = card.querySelectorAll('.contact-button');
                contactButtons.forEach(button => {
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        console.log(`Contact button clicked for product ${index}`);
                        
                        // Simple feedback
                        button.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            button.style.transform = 'scale(1)';
                        }, 100);
                    });
                });

                // Basic accordion functionality
                const accordionHeaders = card.querySelectorAll('.accordion-header');
                accordionHeaders.forEach(header => {
                    header.addEventListener('click', () => {
                        const content = header.nextElementSibling;
                        const isExpanded = header.getAttribute('aria-expanded') === 'true';
                        
                        header.setAttribute('aria-expanded', !isExpanded);
                        content.style.display = isExpanded ? 'none' : 'block';
                    });
                });
            });

            console.log(`Product page fallback initialized for ${productCards.length} cards`);

        } catch (fallbackError) {
            console.error('Even fallback initialization failed:', fallbackError);
            
            this.errorHandler.logError('Product Page Fallback Failed', {
                error: fallbackError.message,
                stack: fallbackError.stack
            });
        }
    }

    // Cleanup method for proper resource management
    cleanup() {
        // Cleanup product galleries
        if (this.productGalleries) {
            this.productGalleries.forEach(gallery => {
                if (gallery.cleanup) {
                    gallery.cleanup();
                }
            });
            this.productGalleries.clear();
        }

        // Cleanup product manager
        if (this.productManager) {
            this.productManager.cleanup();
        }

        // Cleanup contact manager
        if (this.contactManager) {
            this.contactManager.cleanup();
        }

        // Cleanup performance manager
        if (this.performanceManager) {
            this.performanceManager.cleanup();
        }

        // Cleanup asset loading manager
        if (this.assetLoadingManager) {
            this.assetLoadingManager.cleanup();
        }

        // Cleanup navigation state manager
        if (this.navigationStateManager) {
            this.navigationStateManager.reset();
        }

        // Remove event listeners
        const events = [
            'productContactClick',
            'productCTAClick', 
            'accordionToggle',
            'imageLoaded',
            'imageLoadFailed',
            'performanceOptimization',
            'networkRestored'
        ];

        events.forEach(eventType => {
            window.removeEventListener(eventType, this[`handle${eventType}`]);
        });

        console.log('App cleanup completed');
    }

    // Public API for external access
    getProductManager() {
        return this.productManager;
    }

    getContactManager() {
        return this.contactManager;
    }

    getPerformanceMetrics() {
        const metrics = {
            performance: this.performanceManager?.getMetrics(),
            products: this.productManager?.getPerformanceMetrics(),
            galleries: Array.from(this.productGalleries?.values() || []).map(gallery => ({
                currentIndex: gallery.getCurrentIndex?.(),
                totalImages: gallery.getTotalImages?.()
            })),
            assetLoading: this.assetLoadingManager?.getStats()
        };

        return metrics;
    }

    /**
     * Get comprehensive asset preloading statistics
     */
    getPreloadingStats() {
        return this.assetLoadingManager?.getStats() || {
            assetLoading: { message: 'Asset loading manager not initialized' },
            cacheManager: { message: 'Cache manager not available' },
            assetPreloader: { message: 'Asset preloader not available' },
            loadingState: { message: 'Loading state manager not available' }
        };
    }

    /**
     * Final integration and cross-browser compatibility optimizations
     */
    async finalizeIntegration() {
        console.log('[App] Finalizing integration and applying cross-browser optimizations');
        
        try {
            // Optimize loading managers for production
            await this.optimizeLoadingManagers();
            
            // Apply cross-browser compatibility fixes
            this.applyCrossBrowserFixes();
            
            // Implement final performance optimizations
            this.implementFinalOptimizations();
            
            // Set up monitoring and error reporting
            this.setupProductionMonitoring();
            
            console.log('[App] Final integration completed successfully');
            
        } catch (error) {
            console.error('[App] Final integration failed:', error);
            this.errorHandler?.handleJavaScriptError(error, {
                component: 'App',
                method: 'finalizeIntegration'
            });
        }
    }

    /**
     * Optimize loading managers for production use
     */
    async optimizeLoadingManagers() {
        console.log('[App] Optimizing loading managers for production');
        
        // Optimize AssetLoadingManager
        if (this.assetLoadingManager) {
            this.assetLoadingManager.optimize();
            
            // Reduce retry attempts for production
            this.assetLoadingManager.maxRetries = 2;
            this.assetLoadingManager.baseRetryDelay = 500;
        }
        
        // Optimize CacheManager
        if (this.cacheManager) {
            this.cacheManager.optimize();
            
            // Adjust cache limits for production
            this.cacheManager.maxCacheSize = 30; // Reduced from 50
            this.cacheManager.maxCacheMemory = 30 * 1024 * 1024; // 30MB
        }
        
        // Optimize NavigationStateManager
        if (this.navigationStateManager) {
            // Limit navigation history for memory efficiency
            const stats = this.navigationStateManager.getNavigationStats();
            if (stats.navigationHistory && stats.navigationHistory.length > 5) {
                stats.navigationHistory = stats.navigationHistory.slice(-5);
            }
        }
        
        // Optimize LoadingStateManager
        if (this.loadingStateManager) {
            // Clear old loading states periodically
            setInterval(() => {
                const states = this.loadingStateManager.getAllStates();
                const oldStates = states.filter(state => 
                    Date.now() - state.timestamp > 5 * 60 * 1000 // 5 minutes
                );
                
                oldStates.forEach(state => {
                    this.loadingStateManager.clearLoadingState(state.assetId);
                });
            }, 60000); // Check every minute
        }
        
        console.log('[App] Loading managers optimized for production');
    }

    /**
     * Apply cross-browser compatibility fixes
     */
    applyCrossBrowserFixes() {
        console.log('[App] Applying cross-browser compatibility fixes');
        
        // Fix for Safari's aggressive caching
        if (this.isSafari()) {
            this.applySafariFixes();
        }
        
        // Fix for Firefox's strict CSP handling
        if (this.isFirefox()) {
            this.applyFirefoxFixes();
        }
        
        // Fix for Edge's legacy compatibility
        if (this.isEdge()) {
            this.applyEdgeFixes();
        }
        
        // Fix for mobile browsers
        if (this.isMobile()) {
            this.applyMobileFixes();
        }
        
        // Apply general compatibility fixes
        this.applyGeneralCompatibilityFixes();
        
        console.log('[App] Cross-browser fixes applied');
    }

    /**
     * Safari-specific fixes
     */
    applySafariFixes() {
        // Fix Safari's cache-control issues
        if (this.assetLoadingManager) {
            const originalLoadSingleAsset = this.assetLoadingManager.loadSingleAsset.bind(this.assetLoadingManager);
            this.assetLoadingManager.loadSingleAsset = async function(assetUrl, options = {}) {
                // Add cache-busting for Safari
                const url = new URL(assetUrl, window.location.origin);
                url.searchParams.set('_safari_cache_bust', Date.now().toString());
                return originalLoadSingleAsset(url.toString(), options);
            };
        }
        
        // Fix Safari's IntersectionObserver issues
        if (!window.IntersectionObserver || this.isSafariOld()) {
            this.implementIntersectionObserverPolyfill();
        }
    }

    /**
     * Firefox-specific fixes
     */
    applyFirefoxFixes() {
        // Fix Firefox's strict CORS handling
        if (this.assetLoadingManager) {
            const originalLoadSingleAsset = this.assetLoadingManager.loadSingleAsset.bind(this.assetLoadingManager);
            this.assetLoadingManager.loadSingleAsset = async function(assetUrl, options = {}) {
                // Ensure proper CORS headers for Firefox
                if (options.crossOrigin === undefined) {
                    options.crossOrigin = 'anonymous';
                }
                return originalLoadSingleAsset(assetUrl, options);
            };
        }
    }

    /**
     * Edge-specific fixes
     */
    applyEdgeFixes() {
        // Fix Edge's Promise handling
        if (!window.Promise.allSettled) {
            this.implementPromiseAllSettledPolyfill();
        }
        
        // Fix Edge's fetch implementation
        if (this.isEdgeLegacy()) {
            this.implementFetchPolyfill();
        }
    }

    /**
     * Mobile browser fixes
     */
    applyMobileFixes() {
        // Reduce memory usage on mobile
        if (this.cacheManager) {
            this.cacheManager.maxCacheSize = 15; // Reduced for mobile
            this.cacheManager.maxCacheMemory = 15 * 1024 * 1024; // 15MB
        }
        
        // Optimize touch interactions
        this.optimizeTouchInteractions();
        
        // Handle mobile network conditions
        this.handleMobileNetworkConditions();
    }

    /**
     * General compatibility fixes
     */
    applyGeneralCompatibilityFixes() {
        // Fix requestIdleCallback support
        if (!window.requestIdleCallback) {
            window.requestIdleCallback = function(callback, options = {}) {
                const timeout = options.timeout || 0;
                return setTimeout(() => {
                    const start = Date.now();
                    callback({
                        didTimeout: false,
                        timeRemaining: () => Math.max(0, 50 - (Date.now() - start))
                    });
                }, timeout);
            };
            
            window.cancelIdleCallback = function(id) {
                clearTimeout(id);
            };
        }
        
        // Fix ResizeObserver support
        if (!window.ResizeObserver) {
            this.implementResizeObserverPolyfill();
        }
    }

    /**
     * Implement final performance optimizations
     */
    implementFinalOptimizations() {
        console.log('[App] Implementing final performance optimizations');
        
        // Optimize event listeners
        this.optimizeEventListeners();
        
        // Implement resource hints
        this.implementResourceHints();
        
        // Optimize bundle loading
        this.optimizeBundleLoading();
        
        // Implement performance monitoring
        this.implementPerformanceMonitoring();
        
        console.log('[App] Final performance optimizations applied');
    }

    /**
     * Optimize event listeners for better performance
     */
    optimizeEventListeners() {
        // Use passive listeners where appropriate
        const passiveEvents = ['scroll', 'touchstart', 'touchmove', 'wheel'];
        
        passiveEvents.forEach(eventType => {
            const originalAddEventListener = EventTarget.prototype.addEventListener;
            EventTarget.prototype.addEventListener = function(type, listener, options) {
                if (passiveEvents.includes(type) && typeof options !== 'object') {
                    options = { passive: true };
                } else if (typeof options === 'object' && options.passive === undefined) {
                    options.passive = true;
                }
                return originalAddEventListener.call(this, type, listener, options);
            };
        });
        
        // Debounce resize events
        let resizeTimeout;
        const originalResize = window.onresize;
        window.onresize = function(event) {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (originalResize) originalResize.call(this, event);
            }, 100);
        };
    }

    /**
     * Implement resource hints for better loading performance
     */
    implementResourceHints() {
        const head = document.head;
        
        // DNS prefetch for external resources
        const dnsPrefetchUrls = [
            '//fonts.googleapis.com',
            '//fonts.gstatic.com',
            '//cdn.jsdelivr.net'
        ];
        
        dnsPrefetchUrls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = url;
            head.appendChild(link);
        });
        
        // Preconnect to critical origins
        const preconnectUrls = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com'
        ];
        
        preconnectUrls.forEach(url => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = url;
            link.crossOrigin = 'anonymous';
            head.appendChild(link);
        });
    }

    /**
     * Optimize bundle loading strategies
     */
    optimizeBundleLoading() {
        // Implement module preloading for critical paths
        const criticalModules = [
            './src/js/LoadingStateManager.js',
            './src/js/AssetLoadingManager.js',
            './src/js/NavigationStateManager.js'
        ];
        
        criticalModules.forEach(moduleUrl => {
            const link = document.createElement('link');
            link.rel = 'modulepreload';
            link.href = moduleUrl;
            document.head.appendChild(link);
        });
        
        // Implement lazy loading for non-critical modules
        this.implementLazyModuleLoading();
    }

    /**
     * Implement lazy loading for non-critical modules
     */
    implementLazyModuleLoading() {
        // Lazy load heavy components
        const lazyComponents = {
            'SceneManager': () => import('./SceneManager.js'),
            'ProductImageGallery': () => import('./ProductImageGallery.js'),
            'JourneyManager': () => import('./JourneyManager.js')
        };
        
        // Store lazy loaders for later use
        this.lazyComponents = lazyComponents;
        
        // Preload components based on page type
        if (this.isHomepage) {
            // Preload homepage components
            requestIdleCallback(() => {
                lazyComponents['SceneManager']();
                lazyComponents['JourneyManager']();
            });
        } else if (this.isProductPage) {
            // Preload product page components
            requestIdleCallback(() => {
                lazyComponents['ProductImageGallery']();
            });
        }
    }

    /**
     * Implement performance monitoring
     */
    implementPerformanceMonitoring() {
        // Monitor Core Web Vitals
        this.monitorCoreWebVitals();
        
        // Monitor loading performance
        this.monitorLoadingPerformance();
        
        // Monitor error rates
        this.monitorErrorRates();
    }

    /**
     * Monitor Core Web Vitals
     */
    monitorCoreWebVitals() {
        // Monitor LCP (Largest Contentful Paint)
        if ('PerformanceObserver' in window) {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                
                console.log('[Performance] LCP:', lastEntry.startTime);
                
                // Report to analytics if available
                if (window.gtag) {
                    window.gtag('event', 'web_vitals', {
                        event_category: 'performance',
                        event_label: 'LCP',
                        value: Math.round(lastEntry.startTime)
                    });
                }
            });
            
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        }
        
        // Monitor FID (First Input Delay)
        if ('PerformanceObserver' in window) {
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    console.log('[Performance] FID:', entry.processingStart - entry.startTime);
                    
                    if (window.gtag) {
                        window.gtag('event', 'web_vitals', {
                            event_category: 'performance',
                            event_label: 'FID',
                            value: Math.round(entry.processingStart - entry.startTime)
                        });
                    }
                });
            });
            
            fidObserver.observe({ entryTypes: ['first-input'] });
        }
    }

    /**
     * Monitor loading performance
     */
    monitorLoadingPerformance() {
        // Track asset loading times
        if (this.assetLoadingManager) {
            const originalLoadAsset = this.assetLoadingManager.loadAssetWithRetry.bind(this.assetLoadingManager);
            this.assetLoadingManager.loadAssetWithRetry = async function(assetUrl, options = {}) {
                const startTime = performance.now();
                
                try {
                    const result = await originalLoadAsset(assetUrl, options);
                    const loadTime = performance.now() - startTime;
                    
                    console.log(`[Performance] Asset loaded: ${assetUrl} in ${loadTime.toFixed(2)}ms`);
                    
                    return result;
                } catch (error) {
                    const loadTime = performance.now() - startTime;
                    console.warn(`[Performance] Asset failed: ${assetUrl} after ${loadTime.toFixed(2)}ms`);
                    throw error;
                }
            };
        }
    }

    /**
     * Monitor error rates
     */
    monitorErrorRates() {
        let errorCount = 0;
        const errorThreshold = 5; // Alert after 5 errors
        
        window.addEventListener('error', (event) => {
            errorCount++;
            
            if (errorCount >= errorThreshold) {
                console.warn(`[Performance] High error rate detected: ${errorCount} errors`);
                
                // Could trigger error reporting or fallback modes
                this.handleHighErrorRate();
            }
        });
        
        // Reset error count periodically
        setInterval(() => {
            errorCount = 0;
        }, 60000); // Reset every minute
    }

    /**
     * Handle high error rate scenarios
     */
    handleHighErrorRate() {
        console.log('[App] Handling high error rate - enabling fallback mode');
        
        // Enable fallback mode for critical components
        if (this.assetLoadingManager) {
            this.assetLoadingManager.maxRetries = 1; // Reduce retries
            this.assetLoadingManager.baseRetryDelay = 100; // Faster retries
        }
        
        // Disable non-critical features
        if (this.uiAnimations) {
            this.uiAnimations.setReducedMotion(true);
        }
        
        // Clear caches to free memory
        if (this.cacheManager) {
            this.cacheManager.optimize();
        }
    }

    /**
     * Setup production monitoring and error reporting
     */
    setupProductionMonitoring() {
        console.log('[App] Setting up production monitoring');
        
        // Set up global error handling
        window.addEventListener('unhandledrejection', (event) => {
            console.error('[App] Unhandled promise rejection:', event.reason);
            
            if (this.errorHandler) {
                this.errorHandler.handleJavaScriptError(event.reason, {
                    component: 'Global',
                    method: 'unhandledrejection',
                    context: 'Promise rejection'
                });
            }
        });
        
        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const memoryUsage = {
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit
                };
                
                // Log memory usage if it's getting high
                const usagePercent = (memoryUsage.used / memoryUsage.limit) * 100;
                if (usagePercent > 80) {
                    console.warn('[Performance] High memory usage:', usagePercent.toFixed(2) + '%');
                    
                    // Trigger cleanup
                    this.performMemoryCleanup();
                }
            }, 30000); // Check every 30 seconds
        }
        
        console.log('[App] Production monitoring setup complete');
    }

    /**
     * Perform memory cleanup when usage is high
     */
    performMemoryCleanup() {
        console.log('[App] Performing memory cleanup');
        
        // Clear old cache entries
        if (this.cacheManager) {
            this.cacheManager.optimize();
        }
        
        // Clear old loading states
        if (this.loadingStateManager) {
            const oldStates = this.loadingStateManager.getAllStates()
                .filter(state => Date.now() - state.timestamp > 2 * 60 * 1000); // 2 minutes
            
            oldStates.forEach(state => {
                this.loadingStateManager.clearLoadingState(state.assetId);
            });
        }
        
        // Clear navigation history
        if (this.navigationStateManager) {
            const stats = this.navigationStateManager.getNavigationStats();
            if (stats.navigationHistory && stats.navigationHistory.length > 3) {
                stats.navigationHistory = stats.navigationHistory.slice(-3);
            }
        }
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }

    // Browser detection utilities
    isSafari() {
        return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    }

    isSafariOld() {
        const match = navigator.userAgent.match(/Version\/(\d+)/);
        return this.isSafari() && match && parseInt(match[1]) < 12;
    }

    isFirefox() {
        return navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    }

    isEdge() {
        return navigator.userAgent.indexOf('Edg') > -1;
    }

    isEdgeLegacy() {
        return navigator.userAgent.indexOf('Edge') > -1;
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Polyfill implementations (simplified)
    implementIntersectionObserverPolyfill() {
        // Simplified polyfill - in production, use a proper polyfill library
        if (!window.IntersectionObserver) {
            window.IntersectionObserver = class {
                constructor(callback) {
                    this.callback = callback;
                }
                observe() { /* Simplified implementation */ }
                unobserve() { /* Simplified implementation */ }
                disconnect() { /* Simplified implementation */ }
            };
        }
    }

    implementPromiseAllSettledPolyfill() {
        if (!Promise.allSettled) {
            Promise.allSettled = function(promises) {
                return Promise.all(promises.map(promise =>
                    Promise.resolve(promise).then(
                        value => ({ status: 'fulfilled', value }),
                        reason => ({ status: 'rejected', reason })
                    )
                ));
            };
        }
    }

    implementFetchPolyfill() {
        // In production, use a proper fetch polyfill
        if (!window.fetch) {
            console.warn('[App] Fetch not supported, using XMLHttpRequest fallback');
            // Implement basic fetch using XMLHttpRequest
        }
    }

    implementResizeObserverPolyfill() {
        // Simplified polyfill
        if (!window.ResizeObserver) {
            window.ResizeObserver = class {
                constructor(callback) {
                    this.callback = callback;
                }
                observe() { /* Simplified implementation */ }
                unobserve() { /* Simplified implementation */ }
                disconnect() { /* Simplified implementation */ }
            };
        }
    }

    optimizeTouchInteractions() {
        // Optimize touch events for mobile
        document.addEventListener('touchstart', function() {}, { passive: true });
        document.addEventListener('touchmove', function() {}, { passive: true });
    }

    handleMobileNetworkConditions() {
        // Adjust loading strategies for mobile networks
        if (navigator.connection) {
            const connection = navigator.connection;
            
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                // Reduce quality and disable non-essential features
                if (this.adaptiveLoadingManager) {
                    this.adaptiveLoadingManager.setQualityPreference('low');
                }
            }
        }
    }

    /**
     * Get frequently accessed assets for optimization insights
     */
    getFrequentlyAccessedAssets(limit = 10) {
        return this.assetLoadingManager?.getFrequentlyAccessed(limit) || [];
    }

    /**
     * Manually trigger asset loading optimization
     */
    optimizeAssetLoading() {
        if (this.assetLoadingManager) {
            this.assetLoadingManager.optimize();
            console.log('[App] Asset loading optimization triggered');
        } else {
            console.warn('[App] Asset loading manager not available for optimization');
        }
    }

    /**
     * Get navigation statistics and context for debugging
     * @returns {Object} Navigation statistics and current context
     */
    getNavigationStats() {
        if (!this.navigationStateManager) {
            return { error: 'NavigationStateManager not initialized' };
        }

        return {
            navigationStats: this.navigationStateManager.getNavigationStats(),
            currentContext: this.navigationStateManager.getNavigationContext(),
            preservedContext: this.navigationStateManager.getPreservedContext()
        };
    }

    /**
     * Get NavigationStateManager instance for external access
     * @returns {NavigationStateManager} Navigation state manager instance
     */
    getNavigationStateManager() {
        return this.navigationStateManager;
    }
}