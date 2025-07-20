// src/js/ProductManager.js
// Enhanced with comprehensive error handling and graceful degradation
import ErrorHandler from './ErrorHandler.js';

export default class ProductManager {
    constructor(uiAnimations = null) {
        this.productCards = [];
        this.loadingStates = new Map();
        this.animationTimelines = new Map();
        this.uiAnimations = uiAnimations;
        this.isInitialized = false;
        this.eventListeners = new Map();
        this.intersectionObserver = null;
        this.performanceMetrics = {
            loadStartTime: performance.now(),
            cardsLoaded: 0,
            totalCards: 0
        };
        this.errorHandler = new ErrorHandler();
        this.failedCards = new Set();
    }

    init() {
        if (this.isInitialized) {
            console.warn('ProductManager already initialized');
            return;
        }

        try {
            this.initProductCards();
            this.initIntersectionObserver();
            this.initLoadingStates();
            this.initHoverAnimations();
            this.initEventHandlers();
            this.initPerformanceTracking();

            this.isInitialized = true;

            // Integrate with UIAnimations if available
            if (this.uiAnimations) {
                this.integrateWithUIAnimations();
            }

            console.log(`ProductManager initialized with ${this.productCards.length} product cards`);
        } catch (error) {
            this.errorHandler.handleJavaScriptError(error, {
                component: 'ProductManager',
                method: 'init'
            });
            
            // Attempt graceful degradation
            this.initFallbackMode();
        }
    }

    // Fallback initialization when main init fails
    initFallbackMode() {
        console.warn('ProductManager initializing in fallback mode');
        
        try {
            // Basic card detection without advanced features
            const cards = document.querySelectorAll('.product-card-enhanced, .product-card');
            this.performanceMetrics.totalCards = cards.length;
            
            cards.forEach((card, index) => {
                this.productCards.push({
                    element: card,
                    index: index,
                    isLoaded: true, // Skip loading states in fallback
                    isVisible: true,
                    images: card.querySelectorAll('img'),
                    ctaButton: card.querySelector('button, .contact-button'),
                    title: card.querySelector('h3, h2, .title'),
                    features: [],
                    categoryBadge: null,
                    specsPreview: null,
                    contactSection: null
                });
            });
            
            // Basic event handling only
            this.initBasicEventHandlers();
            this.isInitialized = true;
            
            console.log(`ProductManager fallback mode initialized with ${this.productCards.length} cards`);
        } catch (fallbackError) {
            this.errorHandler.logError('ProductManager Fallback Init Failed', {
                error: fallbackError.message,
                stack: fallbackError.stack
            });
        }
    }

    // Basic event handlers for fallback mode
    initBasicEventHandlers() {
        this.productCards.forEach(card => {
            try {
                // Basic click handler for CTA buttons
                if (card.ctaButton) {
                    const clickHandler = (e) => {
                        e.preventDefault();
                        console.log(`Basic CTA clicked for product: ${card.title?.textContent || 'Unknown'}`);
                        
                        // Simple button feedback
                        const button = e.target;
                        button.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            button.style.transform = 'scale(1)';
                        }, 100);
                    };
                    
                    card.ctaButton.addEventListener('click', clickHandler);
                    this.eventListeners.set(`basic-${card.index}`, clickHandler);
                }
                
                // Basic accessibility
                card.element.setAttribute('role', 'article');
                card.element.setAttribute('aria-label', `Product: ${card.title?.textContent || 'Unknown Product'}`);
                
            } catch (error) {
                this.errorHandler.logError('Basic Event Handler Error', {
                    cardIndex: card.index,
                    error: error.message
                });
            }
        });
    }

    initProductCards() {
        const cards = document.querySelectorAll('.product-card-enhanced');
        this.performanceMetrics.totalCards = cards.length;

        cards.forEach((card, index) => {
            this.productCards.push({
                element: card,
                index: index,
                isLoaded: false,
                isVisible: false,
                images: card.querySelectorAll('.product-image-carousel-enhanced img'),
                ctaButton: card.querySelector('.contact-button.primary'),
                title: card.querySelector('.product-info-enhanced h3'),
                features: card.querySelectorAll('.key-benefit-item'),
                categoryBadge: card.querySelector('.product-category-badge'),
                specsPreview: card.querySelector('.product-specs-preview'),
                contactSection: card.querySelector('.product-contact-section')
            });
        });
    }

    initIntersectionObserver() {
        // Use Intersection Observer for performance optimization
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const card = this.productCards.find(c => c.element === entry.target);
                if (card) {
                    card.isVisible = entry.isIntersecting;

                    if (entry.isIntersecting && !card.isLoaded) {
                        // Trigger loading when card becomes visible
                        this.loadProductCard(card);
                    }
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });

        // Observe all product cards
        this.productCards.forEach(card => {
            this.intersectionObserver.observe(card.element);
        });
    }

    initEventHandlers() {
        // Global event handlers for product interactions
        this.productCards.forEach(card => {
            const cardElement = card.element;

            // Click handler for CTA buttons
            if (card.ctaButton) {
                const clickHandler = (e) => this.handleCTAClick(e, card);
                card.ctaButton.addEventListener('click', clickHandler);
                this.eventListeners.set(card.ctaButton, clickHandler);
            }

            // Initialize accordion functionality
            this.initAccordionForCard(card);

            // Initialize contact button functionality
            this.initContactButtonsForCard(card);

            // Focus handlers for accessibility
            const focusHandler = () => this.handleCardFocus(card);
            const blurHandler = () => this.handleCardBlur(card);

            cardElement.addEventListener('focus', focusHandler);
            cardElement.addEventListener('blur', blurHandler);

            this.eventListeners.set(`${cardElement.id || card.index}-focus`, focusHandler);
            this.eventListeners.set(`${cardElement.id || card.index}-blur`, blurHandler);

            // Make cards focusable for keyboard navigation
            if (!cardElement.hasAttribute('tabindex')) {
                cardElement.setAttribute('tabindex', '0');
            }

            // Add ARIA labels for accessibility
            cardElement.setAttribute('role', 'article');
            cardElement.setAttribute('aria-label', `Product: ${card.title?.textContent || 'Unknown Product'}`);
        });

        // Initialize modal functionality
        this.initContactModal();
    }

    initAccordionForCard(card) {
        const accordion = card.element.querySelector('.product-specs-accordion');
        if (!accordion) return;

        const accordionItems = accordion.querySelectorAll('.accordion-item');

        accordionItems.forEach((item, index) => {
            const header = item.querySelector('.accordion-header');
            const content = item.querySelector('.accordion-content');
            const icon = header.querySelector('.accordion-icon');

            if (!header || !content) return;

            // Set up ARIA attributes
            const contentId = content.id || `accordion-content-${card.index}-${index}`;
            const headerId = `accordion-header-${card.index}-${index}`;

            content.id = contentId;
            header.id = headerId;
            header.setAttribute('aria-controls', contentId);
            content.setAttribute('aria-labelledby', headerId);
            content.setAttribute('aria-hidden', 'true');

            // Create click handler
            const clickHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleAccordionItem(header, content, icon, card);
            };

            // Create keyboard handler
            const keyHandler = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.toggleAccordionItem(header, content, icon, card);
                }
            };

            header.addEventListener('click', clickHandler);
            header.addEventListener('keydown', keyHandler);

            // Store event listeners for cleanup
            this.eventListeners.set(`accordion-${card.index}-${index}-click`, clickHandler);
            this.eventListeners.set(`accordion-${card.index}-${index}-key`, keyHandler);
        });
    }

    toggleAccordionItem(header, content, icon, card) {
        try {
            const isExpanded = header.getAttribute('aria-expanded') === 'true';
            const newState = !isExpanded;

            // Update ARIA attributes
            header.setAttribute('aria-expanded', newState.toString());
            content.setAttribute('aria-hidden', (!newState).toString());

            // Simple CSS transitions instead of GSAP
            if (newState) {
                // Expanding
                content.classList.add('expanded');
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.opacity = '1';
                if (icon) icon.style.transform = 'rotate(45deg)';
            } else {
                // Collapsing
                content.style.maxHeight = '0';
                content.style.opacity = '0';
                if (icon) icon.style.transform = 'rotate(0deg)';
                setTimeout(() => {
                    content.classList.remove('expanded');
                }, 300);
            }

            // Add CSS transitions
            content.style.transition = 'all 0.3s ease';
            if (icon) icon.style.transition = 'transform 0.3s ease';

            // Emit custom event for external handling
            const customEvent = new CustomEvent('accordionToggle', {
                detail: {
                    cardIndex: card.index,
                    isExpanded: newState,
                    header: header,
                    content: content
                }
            });

            window.dispatchEvent(customEvent);

            // Log for debugging
            console.log(`Accordion ${newState ? 'expanded' : 'collapsed'} for card ${card.index}`);
        } catch (error) {
            this.errorHandler.handleInteractionError(this, 'toggleAccordionItem', error, () => {
                // Fallback: just toggle visibility without animations
                const isExpanded = header.getAttribute('aria-expanded') === 'true';
                const newState = !isExpanded;
                header.setAttribute('aria-expanded', newState.toString());
                content.style.display = newState ? 'block' : 'none';
            });
        }
    }

    initPerformanceTracking() {
        // Track performance metrics
        this.performanceMetrics.initTime = performance.now() - this.performanceMetrics.loadStartTime;

        // Set up performance observer if available
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        if (entry.name.includes('product-image')) {
                            console.log(`Image loaded: ${entry.name} in ${entry.duration}ms`);
                        }
                    });
                });
                observer.observe({ entryTypes: ['measure', 'navigation'] });
            } catch (e) {
                console.warn('Performance Observer not supported:', e);
            }
        }
    }

    integrateWithUIAnimations() {
        // Integrate with UIAnimations for consistent timing and easing
        if (this.uiAnimations && typeof this.uiAnimations.getAnimationConfig === 'function') {
            const config = this.uiAnimations.getAnimationConfig();
            // Simple integration without GSAP timelines
            console.log('UIAnimations integration:', config);
        }

        // Listen for UI animation events
        window.addEventListener('uiAnimationStart', (e) => {
            if (e.detail.type === 'theme-change') {
                this.handleThemeChange(e.detail.isDark);
            }
        });
    }

    loadProductCard(card) {
        if (card.isLoaded) return;

        // Mark loading start time
        const loadStartTime = performance.now();

        // Simulate or handle actual image loading
        this.simulateImageLoading(card);

        // Track loading completion
        card.loadTime = performance.now() - loadStartTime;
        this.performanceMetrics.cardsLoaded++;
    }

    handleCTAClick(event, card) {
        event.preventDefault();

        // Simple button animation without GSAP
        const button = event.target;
        button.style.transform = 'scale(0.95)';
        button.style.transition = 'transform 0.1s ease';

        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 100);

        // Emit custom event for external handling
        const customEvent = new CustomEvent('productCTAClick', {
            detail: {
                productIndex: card.index,
                productTitle: card.title?.textContent,
                cardElement: card.element
            }
        });

        window.dispatchEvent(customEvent);

        // Default behavior - could be overridden by external handlers
        console.log(`CTA clicked for product: ${card.title?.textContent || 'Unknown'}`);
    }

    handleCardFocus(card) {
        if (!card.isLoaded) return;

        // Add focus styling
        card.element.style.outline = '2px solid var(--color-accent-primary)';
        card.element.style.outlineOffset = '4px';

        // Simple hover effect without GSAP
        card.element.style.transform = 'translateY(-8px) scale(1.02)';
        card.element.style.transition = 'all 0.3s ease';
    }

    handleCardBlur(card) {
        // Remove focus styling
        card.element.style.outline = '';
        card.element.style.outlineOffset = '';

        // Reset hover effect
        card.element.style.transform = 'translateY(0) scale(1)';
    }

    initLoadingStates() {
        this.productCards.forEach(card => {
            this.showLoadingState(card);
            this.simulateImageLoading(card);
        });
    }

    showLoadingState(card) {
        const imageContainer = card.element.querySelector('.product-image-carousel-enhanced');
        const infoContainer = card.element.querySelector('.product-info-enhanced');

        if (imageContainer && !card.isLoaded) {
            // Create image skeleton
            const imageSkeleton = document.createElement('div');
            imageSkeleton.className = 'product-image-skeleton';
            imageContainer.appendChild(imageSkeleton);

            // Hide actual images initially
            card.images.forEach(img => {
                img.style.opacity = '0';
            });
        }

        if (infoContainer && !card.isLoaded) {
            // Create info skeleton
            const infoSkeleton = document.createElement('div');
            infoSkeleton.className = 'product-info-skeleton';
            infoSkeleton.innerHTML = `
                <div class="skeleton-line title"></div>
                <div class="skeleton-line subtitle"></div>
                <div class="skeleton-line feature"></div>
                <div class="skeleton-line feature"></div>
                <div class="skeleton-line feature"></div>
                <div class="skeleton-line button"></div>
            `;

            // Hide actual content initially
            const actualContent = infoContainer.children;
            Array.from(actualContent).forEach(child => {
                child.style.opacity = '0';
            });

            infoContainer.appendChild(infoSkeleton);
        }
    }

    simulateImageLoading(card) {
        // Simulate loading delay (in real app, this would be actual image loading)
        const loadingDelay = 800 + (card.index * 200); // Staggered loading

        setTimeout(() => {
            this.hideLoadingState(card);
        }, loadingDelay);
    }

    hideLoadingState(card) {
        const imageContainer = card.element.querySelector('.product-image-carousel-enhanced');
        const infoContainer = card.element.querySelector('.product-info-enhanced');

        // Remove image skeleton and show images
        if (imageContainer) {
            const imageSkeleton = imageContainer.querySelector('.product-image-skeleton');
            if (imageSkeleton) {
                imageSkeleton.style.opacity = '0';
                imageSkeleton.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    imageSkeleton.remove();
                    this.revealImages(card);
                }, 300);
            }
        }

        // Remove info skeleton and show content
        if (infoContainer) {
            const infoSkeleton = infoContainer.querySelector('.product-info-skeleton');
            if (infoSkeleton) {
                infoSkeleton.style.opacity = '0';
                infoSkeleton.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    infoSkeleton.remove();
                    this.revealContent(card);
                }, 300);
            }
        }

        card.isLoaded = true;

        // Emit component event
        const customEvent = new CustomEvent('productCardLoaded', {
            detail: {
                cardIndex: card.index,
                loadTime: card.loadTime,
                productName: card.title?.textContent
            }
        });
        window.dispatchEvent(customEvent);
    }

    revealImages(card) {
        // Simple reveal animation without GSAP
        card.images.forEach((img, index) => {
            setTimeout(() => {
                img.style.opacity = '1';
                img.style.transition = 'opacity 0.6s ease';
            }, index * 200);
        });
    }

    revealContent(card) {
        const infoContainer = card.element.querySelector('.product-info-enhanced');
        const contentElements = Array.from(infoContainer.children).filter(child =>
            !child.classList.contains('product-info-skeleton')
        );

        // Simple reveal animation without GSAP
        contentElements.forEach((element, index) => {
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
                element.style.transition = 'all 0.6s ease';
            }, index * 100);
        });
    }

    initHoverAnimations() {
        this.productCards.forEach(card => {
            this.createHoverTimeline(card);
        });
    }

    createHoverTimeline(card) {
        const cardElement = card.element;

        // Add event listeners for simple hover effects
        cardElement.addEventListener('mouseenter', () => {
            if (card.isLoaded) {
                cardElement.style.transform = 'translateY(-8px) scale(1.02)';
                cardElement.style.transition = 'all 0.3s ease';
            }
        });

        cardElement.addEventListener('mouseleave', () => {
            if (card.isLoaded) {
                cardElement.style.transform = 'translateY(0) scale(1)';
            }
        });
    }

    // Method to handle theme changes
    handleThemeChange(isDark) {
        console.log(`ProductManager: Theme changed to ${isDark ? 'dark' : 'light'} mode`);
        // Simple theme handling without complex animations
    }

    // Method to refresh product cards (useful for dynamic content)
    refresh() {
        this.cleanup();
        this.productCards = [];
        this.loadingStates.clear();
        this.animationTimelines.clear();
        this.isInitialized = false;
        this.init();
    }

    // Cleanup method for proper resource management
    cleanup() {
        // Remove event listeners
        this.eventListeners.forEach((handler, element) => {
            if (typeof element === 'string') {
                // Handle string keys for focus/blur events
                const [cardId, eventType] = element.split('-');
                const card = this.productCards.find(c => c.index.toString() === cardId);
                if (card) {
                    card.element.removeEventListener(eventType, handler);
                }
            } else if (element && element.removeEventListener) {
                element.removeEventListener('click', handler);
            }
        });
        this.eventListeners.clear();

        // Disconnect intersection observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }

        // Remove custom event listeners
        window.removeEventListener('uiAnimationStart', this.handleUIAnimationStart);
    }

    // Get performance metrics
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            averageLoadTime: this.productCards.reduce((sum, card) => sum + (card.loadTime || 0), 0) / this.productCards.length,
            loadedPercentage: (this.performanceMetrics.cardsLoaded / this.performanceMetrics.totalCards) * 100
        };
    }

    // Method to programmatically trigger card interactions (useful for testing)
    triggerCardHover(cardIndex, isHover = true) {
        const card = this.productCards[cardIndex];
        if (!card || !card.isLoaded) return;

        if (isHover) {
            card.element.style.transform = 'translateY(-8px) scale(1.02)';
        } else {
            card.element.style.transform = 'translateY(0) scale(1)';
        }
        card.element.style.transition = 'all 0.3s ease';
    }

    // Method to get card state (useful for debugging)
    getCardState(cardIndex) {
        const card = this.productCards[cardIndex];
        if (!card) return null;

        return {
            index: card.index,
            isLoaded: card.isLoaded,
            isVisible: card.isVisible,
            loadTime: card.loadTime,
            title: card.title?.textContent,
            imageCount: card.images.length
        };
    }

    // Initialize contact buttons for each product card
    initContactButtonsForCard(card) {
        const contactButtons = card.element.querySelectorAll('.contact-button');

        contactButtons.forEach(button => {
            const clickHandler = (e) => this.handleContactButtonClick(e, card);
            button.addEventListener('click', clickHandler);
            this.eventListeners.set(`contact-${card.index}-${button.dataset.action || 'quote'}`, clickHandler);
        });
    }

    // Handle contact button clicks
    handleContactButtonClick(event, card) {
        event.preventDefault();

        const button = event.target.closest('.contact-button');
        const productId = button.dataset.product || this.getProductIdFromCard(card);
        const action = button.dataset.action || 'quote';

        // Simple button animation
        button.style.transform = 'scale(0.95)';
        button.style.transition = 'transform 0.1s ease';

        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 100);

        // Emit custom event for ContactManager to handle
        const customEvent = new CustomEvent('productContactClick', {
            detail: {
                productId: productId,
                action: action,
                cardIndex: card.index,
                cardElement: card.element,
                productName: card.title?.textContent || 'Unknown Product'
            }
        });

        window.dispatchEvent(customEvent);

        console.log(`Contact ${action} clicked for product: ${productId}`);
    }

    // Helper method to extract product ID from card
    getProductIdFromCard(card) {
        // Try to get product ID from various sources
        const titleElement = card.title;
        if (titleElement) {
            const title = titleElement.textContent.toLowerCase();
            if (title.includes('domestic') && title.includes('oil')) {
                return 'domestic-oil-spill-kit';
            } else if (title.includes('marine') && title.includes('oil')) {
                return 'marine-oil-spill-kit';
            } else if (title.includes('cellulose') || title.includes('nano')) {
                return 'cellulose-nanocrystals';
            }
        }
        return 'unknown-product';
    }

    // Contact modal functionality is handled by ContactManager
    initContactModal() {
        // ContactManager handles all modal functionality
        // This method is kept for compatibility but delegates to ContactManager
        console.log('Contact modal functionality delegated to ContactManager');
    }

    // Static method to check if ProductManager is supported
    static isSupported() {
        return !!(window.IntersectionObserver && window.PerformanceObserver);
    }
}