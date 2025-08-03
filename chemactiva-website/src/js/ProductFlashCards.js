// src/js/ProductFlashCards.js
// Modern Flash Cards with Progressive Information Disclosure

export default class ProductFlashCards {
    constructor() {
        this.cards = [];
        this.isInitialized = false;
        this.eventListeners = new Map();
        this.intersectionObserver = null;
        this.touchStartY = 0;
        this.touchEndY = 0;
    }

    init() {
        if (this.isInitialized) {
            console.warn('ProductFlashCards already initialized');
            return;
        }

        try {
            this.initCards();
            this.initIntersectionObserver();
            this.initEventHandlers();
            this.initAccessibility();
            this.isInitialized = true;
            
            console.log(`ProductFlashCards initialized with ${this.cards.length} cards`);
        } catch (error) {
            console.error('ProductFlashCards initialization failed:', error);
            this.initFallbackMode();
        }
    }

    initCards() {
        const cardElements = document.querySelectorAll('.product-flash-card');
        
        cardElements.forEach((element, index) => {
            const card = {
                element: element,
                index: index,
                isVisible: false,
                isLoaded: false,
                image: element.querySelector('.flash-card-image'),
                baseContent: element.querySelector('.flash-card-base-content'),
                overlay: element.querySelector('.flash-card-content-overlay'),
                expandableTags: element.querySelectorAll('.expandable-tag'),
                collapsibleSections: element.querySelectorAll('.collapsible-section'),
                actionButtons: element.querySelectorAll('.flash-card-btn'),
                stats: element.querySelectorAll('.stat-item')
            };

            this.cards.push(card);
            this.initCardInteractions(card);
        });
    }

    initCardInteractions(card) {
        // Hover interactions for desktop
        const mouseEnterHandler = () => this.handleCardHover(card, true);
        const mouseLeaveHandler = () => this.handleCardHover(card, false);
        
        card.element.addEventListener('mouseenter', mouseEnterHandler);
        card.element.addEventListener('mouseleave', mouseLeaveHandler);
        
        this.eventListeners.set(`${card.index}-mouseenter`, mouseEnterHandler);
        this.eventListeners.set(`${card.index}-mouseleave`, mouseLeaveHandler);

        // Touch interactions for mobile
        const touchStartHandler = (e) => this.handleTouchStart(e, card);
        const touchEndHandler = (e) => this.handleTouchEnd(e, card);
        
        card.element.addEventListener('touchstart', touchStartHandler, { passive: true });
        card.element.addEventListener('touchend', touchEndHandler, { passive: true });
        
        this.eventListeners.set(`${card.index}-touchstart`, touchStartHandler);
        this.eventListeners.set(`${card.index}-touchend`, touchEndHandler);

        // Initialize expandable tags
        card.expandableTags.forEach((tag, tagIndex) => {
            const clickHandler = (e) => this.handleTagClick(e, card, tagIndex);
            tag.addEventListener('click', clickHandler);
            this.eventListeners.set(`${card.index}-tag-${tagIndex}`, clickHandler);
        });

        // Initialize collapsible sections
        card.collapsibleSections.forEach((section, sectionIndex) => {
            const trigger = section.querySelector('.collapsible-trigger');
            if (trigger) {
                const clickHandler = (e) => this.handleCollapsibleClick(e, card, sectionIndex);
                trigger.addEventListener('click', clickHandler);
                this.eventListeners.set(`${card.index}-collapsible-${sectionIndex}`, clickHandler);
            }
        });

        // Initialize action buttons
        card.actionButtons.forEach((button, buttonIndex) => {
            const clickHandler = (e) => this.handleActionClick(e, card, buttonIndex);
            button.addEventListener('click', clickHandler);
            this.eventListeners.set(`${card.index}-action-${buttonIndex}`, clickHandler);
        });
    }

    handleCardHover(card, isHovering) {
        if (!card.isLoaded) return;

        const overlay = card.overlay;
        const image = card.image;
        const baseContent = card.baseContent;
        
        if (!overlay) return;

        if (isHovering) {
            // Enhanced hover entrance animation
            this.animateCardHoverEnter(card, overlay, image, baseContent);
            this.emitCardEvent('cardHoverEnter', card);
        } else {
            // Enhanced hover exit animation
            this.animateCardHoverExit(card, overlay, image, baseContent);
            this.emitCardEvent('cardHoverLeave', card);
        }
    }

    animateCardHoverEnter(card, overlay, image, baseContent) {
        // Smooth overlay reveal with backdrop blur
        overlay.style.transform = 'translateY(0)';
        overlay.style.opacity = '1';
        overlay.style.backdropFilter = 'blur(10px)';
        
        // Enhanced image animation
        if (image) {
            image.style.transform = 'scale(1.1) rotate(1deg)';
            image.style.filter = 'brightness(1.1) contrast(1.05) saturate(1.1)';
        }
        
        // Base content lift animation
        if (baseContent) {
            baseContent.style.transform = 'translateY(-5px)';
        }
        
        // Staggered section animations with enhanced timing
        const sections = overlay.querySelectorAll('.overlay-section');
        sections.forEach((section, index) => {
            // Reset section state
            section.style.opacity = '0';
            section.style.transform = 'translateY(15px)';
            
            // Animate with stagger
            setTimeout(() => {
                section.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                section.style.opacity = '1';
                section.style.transform = 'translateY(0)';
                
                // Add micro-bounce effect
                setTimeout(() => {
                    section.style.transform = 'translateY(-2px)';
                    setTimeout(() => {
                        section.style.transform = 'translateY(0)';
                    }, 100);
                }, 200);
            }, index * 100 + 100);
        });
        
        // Animate stats with shimmer effect
        const stats = overlay.querySelectorAll('.stat-item');
        stats.forEach((stat, index) => {
            setTimeout(() => {
                stat.style.transform = 'translateY(-3px) scale(1.05)';
                stat.style.background = 'rgba(var(--color-accent-rgb-values), 0.15)';
                
                // Add shimmer effect
                const shimmer = stat.querySelector('::before');
                if (shimmer) {
                    shimmer.style.left = '100%';
                }
            }, index * 50 + 200);
        });
        
        // Animate tags with ripple effect
        const tags = overlay.querySelectorAll('.expandable-tag');
        tags.forEach((tag, index) => {
            setTimeout(() => {
                tag.style.transform = 'translateY(-2px) scale(1.02)';
            }, index * 30 + 300);
        });
    }

    animateCardHoverExit(card, overlay, image, baseContent) {
        // Smooth overlay hide
        overlay.style.transform = 'translateY(60%)';
        overlay.style.opacity = '0';
        overlay.style.backdropFilter = 'blur(0px)';
        
        // Reset image animation
        if (image) {
            image.style.transform = 'scale(1) rotate(0deg)';
            image.style.filter = 'brightness(1) contrast(1) saturate(1)';
        }
        
        // Reset base content
        if (baseContent) {
            baseContent.style.transform = 'translateY(0)';
        }
        
        // Reset overlay sections
        const sections = overlay.querySelectorAll('.overlay-section');
        sections.forEach((section, index) => {
            setTimeout(() => {
                section.style.opacity = '0';
                section.style.transform = 'translateY(10px)';
            }, index * 50);
        });
        
        // Reset stats
        const stats = overlay.querySelectorAll('.stat-item');
        stats.forEach(stat => {
            stat.style.transform = 'translateY(0) scale(1)';
            stat.style.background = 'rgba(var(--color-accent-rgb-values), 0.08)';
        });
        
        // Reset tags
        const tags = overlay.querySelectorAll('.expandable-tag');
        tags.forEach(tag => {
            tag.style.transform = 'translateY(0) scale(1)';
        });
    }

    handleTouchStart(e, card) {
        this.touchStartY = e.touches[0].clientY;
    }

    handleTouchEnd(e, card) {
        this.touchEndY = e.changedTouches[0].clientY;
        const touchDiff = this.touchStartY - this.touchEndY;

        // If it's a tap (minimal movement), toggle card state
        if (Math.abs(touchDiff) < 10) {
            this.toggleCardState(card);
        }
    }

    toggleCardState(card) {
        const overlay = card.overlay;
        if (!overlay) return;

        const isRevealed = overlay.style.opacity === '1';
        
        if (isRevealed) {
            this.handleCardHover(card, false);
        } else {
            this.handleCardHover(card, true);
        }
    }

    handleTagClick(e, card, tagIndex) {
        e.preventDefault();
        e.stopPropagation();

        const tag = card.expandableTags[tagIndex];
        const isActive = tag.classList.contains('active');

        // Toggle active state
        if (isActive) {
            tag.classList.remove('active');
        } else {
            // Remove active from other tags in the same card
            card.expandableTags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
        }

        // Emit custom event
        this.emitCardEvent('tagClick', card, {
            tagIndex: tagIndex,
            isActive: !isActive,
            tagText: tag.textContent
        });
    }

    handleCollapsibleClick(e, card, sectionIndex) {
        e.preventDefault();
        e.stopPropagation();

        const section = card.collapsibleSections[sectionIndex];
        const trigger = section.querySelector('.collapsible-trigger');
        const content = section.querySelector('.collapsible-content');
        const icon = trigger.querySelector('.trigger-icon');

        if (!trigger || !content) return;

        const isExpanded = trigger.classList.contains('active');
        const newState = !isExpanded;

        // Update trigger state
        trigger.classList.toggle('active', newState);
        trigger.setAttribute('aria-expanded', newState.toString());

        // Update content state
        content.classList.toggle('active', newState);
        content.setAttribute('aria-hidden', (!newState).toString());

        // Update icon rotation
        if (icon) {
            icon.style.transform = newState ? 'rotate(45deg)' : 'rotate(0deg)';
        }

        // Emit custom event
        this.emitCardEvent('collapsibleToggle', card, {
            sectionIndex: sectionIndex,
            isExpanded: newState
        });
    }

    handleActionClick(e, card, buttonIndex) {
        e.preventDefault();

        const button = card.actionButtons[buttonIndex];
        const action = button.dataset.action || 'primary';
        const productId = this.getProductIdFromCard(card);

        // Button animation
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 100);

        // Emit custom event for external handling
        this.emitCardEvent('actionClick', card, {
            buttonIndex: buttonIndex,
            action: action,
            productId: productId,
            buttonText: button.textContent
        });
    }

    getProductIdFromCard(card) {
        const title = card.element.querySelector('.flash-card-title');
        if (title) {
            const titleText = title.textContent.toLowerCase();
            if (titleText.includes('domestic') && titleText.includes('oil')) {
                return 'domestic-oil-spill-kit';
            } else if (titleText.includes('marine') && titleText.includes('oil')) {
                return 'marine-oil-spill-kit';
            } else if (titleText.includes('cellulose') || titleText.includes('nano')) {
                return 'cellulose-nanocrystals';
            }
        }
        return 'unknown-product';
    }

    initIntersectionObserver() {
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const card = this.cards.find(c => c.element === entry.target);
                if (card) {
                    card.isVisible = entry.isIntersecting;
                    
                    if (entry.isIntersecting && !card.isLoaded) {
                        this.loadCard(card);
                    }
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.1
        });

        this.cards.forEach(card => {
            this.intersectionObserver.observe(card.element);
        });
    }

    loadCard(card) {
        if (card.isLoaded) return;

        // Simulate loading delay for staggered appearance
        const loadDelay = card.index * 200;

        setTimeout(() => {
            // Remove skeleton if present
            const skeleton = card.element.querySelector('.flash-card-skeleton');
            if (skeleton) {
                skeleton.style.opacity = '0';
                setTimeout(() => skeleton.remove(), 300);
            }

            // Fade in the card content
            card.element.style.opacity = '1';
            card.element.style.transform = 'translateY(0)';

            card.isLoaded = true;

            // Emit loaded event
            this.emitCardEvent('cardLoaded', card);
        }, loadDelay);
    }

    initEventHandlers() {
        // Global event handlers
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleResize() {
        // Recalculate card dimensions if needed
        this.cards.forEach(card => {
            if (card.overlay) {
                // Reset overlay state on resize
                card.overlay.style.transform = 'translateY(60%)';
                card.overlay.style.opacity = '0';
            }
        });
    }

    handleKeyDown(e) {
        // Handle keyboard navigation for accessibility
        if (e.key === 'Escape') {
            // Close all expanded overlays
            this.cards.forEach(card => {
                this.handleCardHover(card, false);
            });
        }
    }

    initAccessibility() {
        this.cards.forEach((card, index) => {
            // Add ARIA labels
            card.element.setAttribute('role', 'article');
            card.element.setAttribute('aria-label', `Product card ${index + 1}`);
            card.element.setAttribute('tabindex', '0');

            // Add focus handlers
            const focusHandler = () => this.handleCardFocus(card);
            const blurHandler = () => this.handleCardBlur(card);

            card.element.addEventListener('focus', focusHandler);
            card.element.addEventListener('blur', blurHandler);

            this.eventListeners.set(`${card.index}-focus`, focusHandler);
            this.eventListeners.set(`${card.index}-blur`, blurHandler);
        });
    }

    handleCardFocus(card) {
        // Show focus outline
        card.element.style.outline = '2px solid var(--color-accent-primary)';
        card.element.style.outlineOffset = '4px';
    }

    handleCardBlur(card) {
        // Remove focus outline
        card.element.style.outline = '';
        card.element.style.outlineOffset = '';
    }

    emitCardEvent(eventType, card, data = {}) {
        const customEvent = new CustomEvent(`flashCard${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`, {
            detail: {
                cardIndex: card.index,
                cardElement: card.element,
                productId: this.getProductIdFromCard(card),
                ...data
            }
        });

        window.dispatchEvent(customEvent);
    }

    initFallbackMode() {
        console.warn('ProductFlashCards initializing in fallback mode');
        
        try {
            const cards = document.querySelectorAll('.product-flash-card');
            cards.forEach((card, index) => {
                // Basic click handler for fallback
                const clickHandler = () => {
                    console.log(`Flash card ${index} clicked (fallback mode)`);
                };
                
                card.addEventListener('click', clickHandler);
                this.eventListeners.set(`fallback-${index}`, clickHandler);
            });
            
            this.isInitialized = true;
        } catch (error) {
            console.error('ProductFlashCards fallback mode failed:', error);
        }
    }

    // Public methods for external control
    revealCard(cardIndex) {
        const card = this.cards[cardIndex];
        if (card) {
            this.handleCardHover(card, true);
        }
    }

    hideCard(cardIndex) {
        const card = this.cards[cardIndex];
        if (card) {
            this.handleCardHover(card, false);
        }
    }

    getCardState(cardIndex) {
        const card = this.cards[cardIndex];
        if (!card) return null;

        return {
            index: card.index,
            isVisible: card.isVisible,
            isLoaded: card.isLoaded,
            productId: this.getProductIdFromCard(card)
        };
    }

    cleanup() {
        // Remove all event listeners
        this.eventListeners.forEach((handler, key) => {
            if (typeof key === 'string' && key.includes('-')) {
                const [cardIndex, eventType] = key.split('-');
                const card = this.cards[parseInt(cardIndex)];
                if (card && card.element) {
                    card.element.removeEventListener(eventType, handler);
                }
            }
        });
        this.eventListeners.clear();

        // Disconnect intersection observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }

        // Remove global event listeners
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('keydown', this.handleKeyDown);

        this.cards = [];
        this.isInitialized = false;
    }

    // Static method to check browser support
    static isSupported() {
        return !!(window.IntersectionObserver && window.addEventListener);
    }
}