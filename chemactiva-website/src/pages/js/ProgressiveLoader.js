// ProgressiveLoader.js - Implements lazy loading and skeleton screens
export default class ProgressiveLoader {
    constructor() {
        this.observers = new Map();
        this.skeletonElements = new Map();
        this.loadedModules = new Set();
        this.isInitialized = false;
        console.log('[ProgressiveLoader] Initialized');
    }
    
    /**
     * Initialize the progressive loader
     */
    init() {
        if (this.isInitialized) return;
        
        this.initializeIntersectionObserver();
        this.setupInitialSkeletons();
        this.setupLazyLoading();
        
        this.isInitialized = true;
        console.log('[ProgressiveLoader] Fully initialized with lazy loading');
    }
    
    /**
     * Initialize intersection observer for lazy loading
     */
    initializeIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.handleElementVisible(entry.target);
                    }
                });
            },
            {
                root: null,
                rootMargin: '50px',
                threshold: 0.1
            }
        );
    }
    
    /**
     * Set up initial skeleton screens for key sections
     */
    setupInitialSkeletons() {
        // Only show skeletons for sections that exist and aren't immediately visible
        const sectionsToSkeletonize = [
            { id: 'products-section', type: 'products' },
            { id: 'blog-section', type: 'articles' }
        ];
        
        sectionsToSkeletonize.forEach(({ id, type }) => {
            const element = document.getElementById(id);
            if (element && !this.isElementInViewport(element)) {
                this.showSkeleton(id, type);
                this.intersectionObserver.observe(element);
            } else if (element) {
                // If element is in viewport, just observe it for other lazy loading behavior
                this.intersectionObserver.observe(element);
            }
        });
        
        console.log(`[ProgressiveLoader] Set up ${sectionsToSkeletonize.length} sections for progressive loading`);
    }
    
    /**
     * Set up lazy loading for images and other assets
     */
    setupLazyLoading() {
        // Lazy load images with loading="lazy" attribute
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        lazyImages.forEach(img => {
            this.intersectionObserver.observe(img);
        });
        
        // Lazy load sections marked with data-lazy
        const lazySections = document.querySelectorAll('[data-lazy]');
        lazySections.forEach(section => {
            this.intersectionObserver.observe(section);
        });
        
        console.log(`[ProgressiveLoader] Set up lazy loading for ${lazyImages.length} images and ${lazySections.length} sections`);
    }
    
    /**
     * Check if element is in viewport
     */
    isElementInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    /**
     * Show skeleton screen for a section
     */
    showSkeleton(sectionId, type = 'default') {
        const section = document.getElementById(sectionId);
        if (!section) return;
        
        const skeleton = this.createSkeleton(type);
        skeleton.id = `${sectionId}-skeleton`;
        skeleton.className = `skeleton skeleton-${type}`;
        
        // Store original content
        const originalContent = section.innerHTML;
        this.skeletonElements.set(sectionId, {
            skeleton,
            originalContent,
            section
        });
        
        // Replace with skeleton
        section.innerHTML = '';
        section.appendChild(skeleton);
        section.classList.add('loading');
        
        console.log(`[ProgressiveLoader] Showing skeleton for ${sectionId}`);
    }
    
    /**
     * Hide skeleton and restore original content
     */
    hideSkeleton(sectionId) {
        const skeletonData = this.skeletonElements.get(sectionId);
        if (!skeletonData) return;
        
        const { section, originalContent } = skeletonData;
        
        // Restore original content
        section.innerHTML = originalContent;
        section.classList.remove('loading');
        section.classList.add('loaded');
        
        // Clean up
        this.skeletonElements.delete(sectionId);
        
        console.log(`[ProgressiveLoader] Hidden skeleton for ${sectionId}`);
    }
    
    /**
     * Create skeleton based on type
     */
    createSkeleton(type) {
        const skeleton = document.createElement('div');
        
        switch (type) {
            case 'team':
                skeleton.innerHTML = this.getTeamSkeleton();
                break;
            case 'products':
                skeleton.innerHTML = this.getProductsSkeleton();
                break;
            case 'articles':
                skeleton.innerHTML = this.getArticlesSkeleton();
                break;
            case 'hero':
                skeleton.innerHTML = this.getHeroSkeleton();
                break;
            default:
                skeleton.innerHTML = this.getDefaultSkeleton();
        }
        
        return skeleton;
    }
    
    /**
     * Team section skeleton
     */
    getTeamSkeleton() {
        return `
            <div class="skeleton-team">
                <div class="skeleton-header">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-subtitle"></div>
                </div>
                <div class="skeleton-grid">
                    ${Array(3).fill(0).map(() => `
                        <div class="skeleton-card">
                            <div class="skeleton-avatar"></div>
                            <div class="skeleton-name"></div>
                            <div class="skeleton-role"></div>
                            <div class="skeleton-text"></div>
                            <div class="skeleton-text short"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Products section skeleton
     */
    getProductsSkeleton() {
        return `
            <div class="skeleton-products">
                <div class="skeleton-header">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-subtitle"></div>
                </div>
                <div class="skeleton-grid">
                    ${Array(2).fill(0).map(() => `
                        <div class="skeleton-product-card">
                            <div class="skeleton-image"></div>
                            <div class="skeleton-content">
                                <div class="skeleton-title"></div>
                                <div class="skeleton-text"></div>
                                <div class="skeleton-tags">
                                    <div class="skeleton-tag"></div>
                                    <div class="skeleton-tag"></div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Articles section skeleton
     */
    getArticlesSkeleton() {
        return `
            <div class="skeleton-articles">
                ${Array(3).fill(0).map(() => `
                    <div class="skeleton-article">
                        <div class="skeleton-image"></div>
                        <div class="skeleton-content">
                            <div class="skeleton-title"></div>
                            <div class="skeleton-text"></div>
                            <div class="skeleton-text short"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Hero section skeleton
     */
    getHeroSkeleton() {
        return `
            <div class="skeleton-hero">
                <div class="skeleton-hero-content">
                    <div class="skeleton-title large"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-button"></div>
                </div>
                <div class="skeleton-hero-visual">
                    <div class="skeleton-circle"></div>
                </div>
            </div>
        `;
    }
    
    /**
     * Default skeleton
     */
    getDefaultSkeleton() {
        return `
            <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text short"></div>
            </div>
        `;
    }
    
    /**
     * Reveal content with smooth animation
     */
    revealContent(sectionId, content = null) {
        const skeletonData = this.skeletonElements.get(sectionId);
        if (!skeletonData) return;
        
        const { section, originalContent } = skeletonData;
        
        // Create content container
        const contentContainer = document.createElement('div');
        contentContainer.innerHTML = content || originalContent;
        contentContainer.style.opacity = '0';
        contentContainer.style.transform = 'translateY(20px)';
        contentContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        
        // Replace skeleton with content
        section.innerHTML = '';
        section.appendChild(contentContainer);
        section.classList.remove('loading');
        section.classList.add('loaded');
        
        // Animate in
        requestAnimationFrame(() => {
            contentContainer.style.opacity = '1';
            contentContainer.style.transform = 'translateY(0)';
        });
        
        // Cleanup
        this.skeletonElements.delete(sectionId);
        
        console.log(`[ProgressiveLoader] Revealed content for ${sectionId}`);
    }
    
    /**
     * Lazy load module when element becomes visible
     */
    lazyLoadModule(element, moduleLoader, options = {}) {
        const { threshold = 0.1, rootMargin = '50px' } = options;
        
        const observer = new IntersectionObserver(
            async (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        observer.unobserve(element);
                        
                        try {
                            console.log(`[ProgressiveLoader] Loading module for element:`, element);
                            await moduleLoader();
                        } catch (error) {
                            console.error('[ProgressiveLoader] Module loading failed:', error);
                        }
                    }
                }
            },
            { threshold, rootMargin }
        );
        
        observer.observe(element);
        this.observers.set(element, observer);
    }
    
    /**
     * Handle element becoming visible
     */
    async handleElementVisible(element) {
        // Stop observing the element
        this.intersectionObserver.unobserve(element);
        
        // Handle skeleton removal for sections
        const sectionId = element.id;
        if (this.skeletonElements.has(sectionId)) {
            this.hideSkeleton(sectionId);
        }
        
        // Handle lazy loading for images
        if (element.tagName === 'IMG' && element.hasAttribute('data-src')) {
            this.loadLazyImage(element);
        }
        
        // Handle data loading for sections
        const moduleLoader = element.dataset.moduleLoader;
        if (moduleLoader && !this.loadedModules.has(moduleLoader)) {
            this.loadedModules.add(moduleLoader);
            
            try {
                switch (moduleLoader) {
                    case 'team':
                        await this.loadTeamModule();
                        break;
                    case 'products':
                        await this.loadProductsModule();
                        break;
                    case 'articles':
                        await this.loadArticlesModule();
                        break;
                    default:
                        console.log(`[ProgressiveLoader] Section ${moduleLoader} visible, no special loading needed`);
                }
            } catch (error) {
                console.error(`[ProgressiveLoader] Failed to load ${moduleLoader}:`, error);
                // Continue without failing
            }
        }
        
        console.log(`[ProgressiveLoader] Element visible: ${element.id || element.tagName}`);
    }
    
    /**
     * Load lazy image
     */
    loadLazyImage(img) {
        const src = img.getAttribute('data-src');
        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
        }
    }
    
    /**
     * Lazy load team module
     */
    async loadTeamModule() {
        console.log('[ProgressiveLoader] Team section visible - no additional loading needed');
        // Since team data is likely already in the HTML, just reveal it
        this.revealContent('our-team');
    }
    
    /**
     * Lazy load products module
     */
    async loadProductsModule() {
        console.log('[ProgressiveLoader] Products section visible - no additional loading needed');
        // Since product data is likely already in the HTML, just reveal it
        this.revealContent('products');
    }
    
    /**
     * Lazy load articles module
     */
    async loadArticlesModule() {
        console.log('[ProgressiveLoader] Articles section visible - no additional loading needed');
        // Since article data is likely already in the HTML, just reveal it
        this.revealContent('articles');
    }
    
    /**
     * Setup lazy loading for all marked elements
     */
    setupLazyLoading() {
        const lazyElements = document.querySelectorAll('[data-lazy-load]');
        
        lazyElements.forEach(element => {
            const moduleLoader = element.dataset.lazyLoad;
            
            this.lazyLoadModule(element, async () => {
                await this.handleElementVisible(element);
            });
        });
        
        console.log(`[ProgressiveLoader] Setup lazy loading for ${lazyElements.length} elements`);
    }
    
    /**
     * Preload above-the-fold content
     */
    async preloadAboveFold() {
        const aboveFoldElements = document.querySelectorAll('[data-above-fold]');
        
        for (const element of aboveFoldElements) {
            const sectionId = element.id;
            if (sectionId && !this.skeletonElements.has(sectionId)) {
                this.showSkeleton(sectionId, element.dataset.skeletonType || 'default');
            }
        }
        
        // Load critical above-fold modules immediately
        try {
            const { default: HeroLoader } = await import('/js/HeroLoader.js');
            const heroLoader = new HeroLoader();
            await heroLoader.init();
            this.revealContent('homepage-hero');
        } catch (error) {
            console.error('[ProgressiveLoader] Failed to load hero:', error);
        }
    }
    
    /**
     * Clean up observers
     */
    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        this.intersectionObserver?.disconnect();
        this.skeletonElements.clear();
        this.loadedModules.clear();
        console.log('[ProgressiveLoader] Cleanup complete');
    }
}