/**
 * NavigationStateManager - Tracks page context and navigation patterns
 * Provides intelligent decisions about when to show loading screens
 */
class NavigationStateManager {
    constructor() {
        this.currentPage = null;
        this.previousPage = null;
        this.currentSection = null;
        this.previousSection = null;
        this.assetLoadingState = new Map();
        this.navigationHistory = [];
        this.pageAssetRequirements = new Map();
        this.sectionNavigationHistory = [];
        
        // Initialize navigation tracking
        this.initializeNavigation();
        
        console.log('[NavigationStateManager] Initialized');
    }

    /**
     * Initialize navigation tracking and detect current context
     */
    initializeNavigation() {
        // Get current page information
        this.currentPage = this.getCurrentPageInfo();
        
        // Get current section information (for intra-page navigation)
        this.currentSection = this.getCurrentSectionInfo();
        
        // Track referrer as previous page
        if (document.referrer) {
            try {
                const referrerUrl = new URL(document.referrer);
                if (referrerUrl.origin === window.location.origin) {
                    this.previousPage = this.getPageInfoFromUrl(referrerUrl);
                }
            } catch (error) {
                console.warn('[NavigationStateManager] Could not parse referrer:', error);
            }
        }
        
        // Set up asset requirements for different page types
        this.setupAssetRequirements();
        
        // Track this navigation
        this.trackNavigation(this.previousPage, this.currentPage);
        
        // Set up event listeners for future navigation
        this.setupNavigationListeners();
    }

    /**
     * Get current page information
     * @returns {Object} Page information object
     */
    getCurrentPageInfo() {
        const path = window.location.pathname;
        const pageType = this.determinePageType(path);
        
        return {
            path: path,
            type: pageType,
            timestamp: Date.now(),
            title: document.title,
            bodyClasses: Array.from(document.body.classList)
        };
    }

    /**
     * Get page information from URL
     * @param {URL} url - URL object
     * @returns {Object} Page information object
     */
    getPageInfoFromUrl(url) {
        const path = url.pathname;
        const pageType = this.determinePageType(path);
        
        return {
            path: path,
            type: pageType,
            timestamp: Date.now(),
            title: null, // Unknown for external pages
            bodyClasses: []
        };
    }

    /**
     * Determine page type based on path
     * @param {string} path - URL path
     * @returns {string} Page type
     */
    determinePageType(path) {
        if (path === '/' || path === '/index.html') {
            return 'homepage';
        } else if (path.includes('products')) {
            return 'products';
        } else if (path.includes('blog')) {
            return 'blog';
        } else if (path.includes('innovation')) {
            return 'innovation';
        } else {
            return 'other';
        }
    }

    /**
     * Set up asset requirements for different page types
     */
    setupAssetRequirements() {
        this.pageAssetRequirements.set('homepage', [
            'logo',
            'hero-images',
            '3d-models',
            'team-data',
            'journey-data'
        ]);
        
        this.pageAssetRequirements.set('products', [
            'logo',
            'product-images',
            'product-data'
        ]);
        
        this.pageAssetRequirements.set('blog', [
            'logo',
            'blog-data',
            'article-images'
        ]);
        
        this.pageAssetRequirements.set('innovation', [
            'logo',
            'innovation-images'
        ]);
        
        this.pageAssetRequirements.set('other', [
            'logo'
        ]);
    }

    /**
     * Track navigation from one page to another
     * @param {Object} fromPage - Previous page info
     * @param {Object} toPage - Current page info
     */
    trackNavigation(fromPage, toPage) {
        const navigationEvent = {
            from: fromPage,
            to: toPage,
            method: this.detectNavigationMethod(fromPage, toPage),
            timestamp: Date.now()
        };
        
        this.navigationHistory.push(navigationEvent);
        
        // Keep only last 10 navigation events
        if (this.navigationHistory.length > 10) {
            this.navigationHistory.shift();
        }
        
        console.log('[NavigationStateManager] Navigation tracked:', navigationEvent);
    }

    /**
     * Detect navigation method based on context
     * @param {Object} fromPage - Previous page info
     * @param {Object} toPage - Current page info
     * @returns {string} Navigation method
     */
    detectNavigationMethod(fromPage, toPage) {
        // Direct access (no referrer or external referrer)
        if (!fromPage || !fromPage.path) {
            return 'direct';
        }
        
        // Check if this looks like a back/forward navigation
        const recentNavigation = this.navigationHistory
            .slice(-5) // Check last 5 navigations
            .find(nav => nav.to && nav.to.path === toPage.path);
        
        if (recentNavigation) {
            return 'back';
        }
        
        // Check for forward navigation (less common)
        const forwardNavigation = this.navigationHistory
            .slice(-5)
            .find(nav => nav.from && nav.from.path === toPage.path);
        
        if (forwardNavigation) {
            return 'forward';
        }
        
        // Default to link navigation for internal navigation
        return 'link';
    }

    /**
     * Get current section information for intra-page navigation
     * @returns {Object} Section information object
     */
    getCurrentSectionInfo() {
        const hash = window.location.hash;
        const sectionId = hash ? hash.substring(1) : null;
        
        // Detect section based on URL hash or scroll position
        let detectedSection = this.detectCurrentSection(sectionId);
        
        return {
            id: sectionId,
            detected: detectedSection,
            timestamp: Date.now(),
            scrollPosition: window.scrollY
        };
    }

    /**
     * Detect current section based on various indicators
     * @param {string} hashSection - Section from URL hash
     * @returns {string} Detected section name
     */
    detectCurrentSection(hashSection) {
        // If we have a hash, use it as primary indicator
        if (hashSection) {
            return this.normalizeSectionName(hashSection);
        }
        
        // Fallback: detect based on scroll position or visible elements
        const sections = ['hero', 'about-us', 'our-journey', 'products', 'our-team', 'contact'];
        
        for (const sectionName of sections) {
            const element = document.getElementById(sectionName) || 
                           document.querySelector(`[data-section="${sectionName}"]`) ||
                           document.querySelector(`.${sectionName}-section`);
            
            if (element && this.isElementInViewport(element)) {
                return sectionName;
            }
        }
        
        return 'hero'; // Default to hero section
    }

    /**
     * Normalize section names for consistent tracking
     * @param {string} sectionName - Raw section name
     * @returns {string} Normalized section name
     */
    normalizeSectionName(sectionName) {
        const sectionMap = {
            'homepage-hero': 'hero',
            'hero': 'hero',
            'about-us': 'about',
            'about': 'about',
            'our-journey': 'journey',
            'journey': 'journey',
            'products': 'products',
            'our-team': 'team',
            'team': 'team',
            'contact': 'contact'
        };
        
        return sectionMap[sectionName] || sectionName;
    }

    /**
     * Check if element is in viewport (simplified check)
     * @param {Element} element - DOM element to check
     * @returns {boolean} True if element is visible
     */
    isElementInViewport(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        
        // Consider element visible if at least 30% is in viewport
        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        const elementHeight = rect.bottom - rect.top;
        
        return visibleHeight > 0 && (visibleHeight / elementHeight) >= 0.3;
    }

    /**
     * Track section navigation within the same page
     * @param {Object} fromSection - Previous section info
     * @param {Object} toSection - Current section info
     */
    trackSectionNavigation(fromSection, toSection) {
        if (!fromSection || !toSection) return;
        
        const sectionNavigationEvent = {
            from: fromSection,
            to: toSection,
            method: this.detectSectionNavigationMethod(fromSection, toSection),
            timestamp: Date.now(),
            isIntraPage: true
        };
        
        this.sectionNavigationHistory.push(sectionNavigationEvent);
        
        // Keep only last 20 section navigation events
        if (this.sectionNavigationHistory.length > 20) {
            this.sectionNavigationHistory.shift();
        }
        
        console.log('[NavigationStateManager] Section navigation tracked:', sectionNavigationEvent);
    }

    /**
     * Detect section navigation method
     * @param {Object} fromSection - Previous section
     * @param {Object} toSection - Current section
     * @returns {string} Navigation method
     */
    detectSectionNavigationMethod(fromSection, toSection) {
        // Check if this is a hash change
        if (toSection.id && fromSection.id !== toSection.id) {
            return 'hash-link';
        }
        
        // Check if this is scroll-based navigation
        if (Math.abs(toSection.scrollPosition - fromSection.scrollPosition) > 100) {
            return 'scroll';
        }
        
        return 'unknown';
    }

    /**
     * Set up event listeners for navigation tracking
     */
    setupNavigationListeners() {
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.handlePageVisible();
            }
        });
        
        // Track beforeunload for navigation preparation
        window.addEventListener('beforeunload', () => {
            this.handlePageUnload();
        });
        
        // Track popstate for back/forward navigation
        window.addEventListener('popstate', (event) => {
            this.handlePopState(event);
        });
        
        // Track hash changes for section navigation
        window.addEventListener('hashchange', (event) => {
            this.handleHashChange(event);
        });
        
        // Track scroll for section detection (throttled)
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.handleScroll();
            }, 150); // Throttle to every 150ms
        });
    }

    /**
     * Handle page becoming visible
     */
    handlePageVisible() {
        // Update current page timestamp
        if (this.currentPage) {
            this.currentPage.timestamp = Date.now();
        }
    }

    /**
     * Handle page unload
     */
    handlePageUnload() {
        // Store navigation state for potential return
        try {
            sessionStorage.setItem('navigationState', JSON.stringify({
                currentPage: this.currentPage,
                timestamp: Date.now()
            }));
        } catch (error) {
            console.warn('[NavigationStateManager] Could not store navigation state:', error);
        }
    }

    /**
     * Handle popstate event (back/forward navigation)
     * @param {PopStateEvent} event - Popstate event
     */
    handlePopState(event) {
        const newPage = this.getCurrentPageInfo();
        this.trackNavigation(this.currentPage, newPage);
        this.previousPage = this.currentPage;
        this.currentPage = newPage;
    }

    /**
     * Handle hash change event (section navigation)
     * @param {HashChangeEvent} event - Hash change event
     */
    handleHashChange(event) {
        const newSection = this.getCurrentSectionInfo();
        
        // Track section navigation if we're on the same page
        if (this.currentSection) {
            this.trackSectionNavigation(this.currentSection, newSection);
        }
        
        this.previousSection = this.currentSection;
        this.currentSection = newSection;
        
        console.log('[NavigationStateManager] Hash changed - Section navigation:', {
            from: this.previousSection?.detected,
            to: this.currentSection?.detected
        });
    }

    /**
     * Handle scroll event for section detection
     */
    handleScroll() {
        const newSection = this.getCurrentSectionInfo();
        
        // Only track if section actually changed
        if (this.currentSection && 
            newSection.detected !== this.currentSection.detected) {
            
            this.trackSectionNavigation(this.currentSection, newSection);
            this.previousSection = this.currentSection;
            this.currentSection = newSection;
        }
    }

    /**
     * Check if current navigation is intra-page (within same page, different sections)
     * @returns {boolean} True if this is intra-page navigation
     */
    isIntraPageNavigation() {
        // Check if we have recent section navigation history
        if (this.sectionNavigationHistory.length > 0) {
            const recentSectionNav = this.sectionNavigationHistory[this.sectionNavigationHistory.length - 1];
            const timeSinceLastSectionNav = Date.now() - recentSectionNav.timestamp;
            
            // If we had section navigation in the last 2 seconds, this is likely intra-page
            if (timeSinceLastSectionNav < 2000) {
                return true;
            }
        }
        
        // Check if URL hash indicates section navigation
        const currentHash = window.location.hash;
        if (currentHash && this.currentPage.type === 'homepage') {
            const sectionName = this.normalizeSectionName(currentHash.substring(1));
            
            // These are known homepage sections
            const homepageSections = ['hero', 'about', 'journey', 'products', 'team', 'contact'];
            if (homepageSections.includes(sectionName)) {
                return true;
            }
        }
        
        // Check if we're on homepage and have previous section information
        if (this.currentPage.type === 'homepage' && this.previousSection) {
            return true;
        }
        
        // Check navigation history for same-page navigation patterns
        const recentNavigation = this.navigationHistory[this.navigationHistory.length - 1];
        if (recentNavigation && 
            recentNavigation.from && 
            recentNavigation.to &&
            recentNavigation.from.path === recentNavigation.to.path &&
            recentNavigation.to.type === 'homepage') {
            return true;
        }
        
        return false;
    }

    /**
     * Determine if HeroLoader should be skipped for current navigation
     * @returns {boolean} True if loader should be skipped
     */
    shouldSkipLoader() {
        const navigationContext = this.getNavigationContext();
        
        // Skip loader for non-homepage pages
        if (this.currentPage.type !== 'homepage') {
            return true;
        }
        
        // CRITICAL: Skip loader for intra-page section navigation
        // This handles navigation between sections on the same page (products -> journey/team)
        if (this.isIntraPageNavigation()) {
            console.log('[NavigationStateManager] Intra-page navigation detected - skipping HeroLoader');
            return true;
        }
        
        // Always show loader for direct access to homepage (first visit)
        if (navigationContext.navigationMethod === 'direct') {
            return false;
        }
        
        // Skip loader for internal navigation to homepage if assets are likely cached
        if (navigationContext.navigationMethod === 'link' || navigationContext.navigationMethod === 'back') {
            return this.areRequiredAssetsCached();
        }
        
        return false;
    }

    /**
     * Get current navigation context
     * @returns {Object} Navigation context object
     */
    getNavigationContext() {
        const latestNavigation = this.navigationHistory[this.navigationHistory.length - 1];
        
        return {
            currentPage: this.currentPage,
            previousPage: this.previousPage,
            navigationMethod: latestNavigation ? latestNavigation.method : 'direct',
            assetsRequired: this.getRequiredAssets(),
            cacheStatus: this.getAssetCacheStatus(),
            shouldShowLoader: null // Will be computed separately to avoid circular dependency
        };
    }

    /**
     * Get required assets for current page
     * @returns {Array} Array of required asset IDs
     */
    getRequiredAssets() {
        return this.pageAssetRequirements.get(this.currentPage.type) || ['logo'];
    }

    /**
     * Check if required assets are likely cached
     * @returns {boolean} True if assets are likely cached
     */
    areRequiredAssetsCached() {
        // This is a heuristic check - in a real implementation,
        // this would check with the actual cache manager
        const requiredAssets = this.getRequiredAssets();
        
        // Check if we've been to this page type recently
        const recentSimilarNavigation = this.navigationHistory
            .slice(-5)
            .find(nav => nav.to && nav.to.type === this.currentPage.type);
        
        if (recentSimilarNavigation) {
            const timeSinceLastVisit = Date.now() - recentSimilarNavigation.timestamp;
            // Assume assets are cached if we visited similar page in last 5 minutes
            return timeSinceLastVisit < 5 * 60 * 1000;
        }
        
        return false;
    }

    /**
     * Get asset cache status for required assets
     * @returns {Object} Cache status object
     */
    getAssetCacheStatus() {
        const requiredAssets = this.getRequiredAssets();
        const cacheStatus = {};
        
        requiredAssets.forEach(assetId => {
            // This would integrate with actual cache manager
            cacheStatus[assetId] = this.assetLoadingState.get(assetId) || 'unknown';
        });
        
        return cacheStatus;
    }

    /**
     * Update asset loading state
     * @param {string} assetId - Asset identifier
     * @param {string} state - Loading state
     */
    updateAssetState(assetId, state) {
        this.assetLoadingState.set(assetId, state);
    }

    /**
     * Preserve page context during navigation
     * @param {Object} context - Context to preserve
     */
    preservePageContext(context = {}) {
        const preservedContext = {
            ...context,
            navigationState: this.getNavigationContext(),
            timestamp: Date.now()
        };
        
        try {
            sessionStorage.setItem('preservedPageContext', JSON.stringify(preservedContext));
        } catch (error) {
            console.warn('[NavigationStateManager] Could not preserve page context:', error);
        }
    }

    /**
     * Get preserved page context
     * @returns {Object|null} Preserved context or null
     */
    getPreservedContext() {
        try {
            const preserved = sessionStorage.getItem('preservedPageContext');
            return preserved ? JSON.parse(preserved) : null;
        } catch (error) {
            console.warn('[NavigationStateManager] Could not retrieve preserved context:', error);
            return null;
        }
    }

    /**
     * Get navigation statistics for debugging
     * @returns {Object} Navigation statistics
     */
    getNavigationStats() {
        const pageTypeStats = {};
        const methodStats = {};
        
        this.navigationHistory.forEach(nav => {
            if (nav.to && nav.to.type) {
                pageTypeStats[nav.to.type] = (pageTypeStats[nav.to.type] || 0) + 1;
            }
            methodStats[nav.method] = (methodStats[nav.method] || 0) + 1;
        });
        
        return {
            totalNavigations: this.navigationHistory.length,
            currentPage: this.currentPage,
            previousPage: this.previousPage,
            pageTypeStats,
            methodStats,
            assetStates: Object.fromEntries(this.assetLoadingState)
        };
    }

    /**
     * Reset navigation state (useful for testing)
     */
    reset() {
        this.currentPage = null;
        this.previousPage = null;
        this.assetLoadingState.clear();
        this.navigationHistory = [];
        
        // Clear stored state
        try {
            sessionStorage.removeItem('navigationState');
            sessionStorage.removeItem('preservedPageContext');
        } catch (error) {
            console.warn('[NavigationStateManager] Could not clear stored state:', error);
        }
    }
}

export default NavigationStateManager;