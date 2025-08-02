/**
 * ProductsRedesigned - Enhanced functionality for the redesigned products section
 * Provides interactive features, animations, and enhanced user experience
 */
class ProductsRedesigned {
    constructor() {
        this.isInitialized = false;
        this.animationObserver = null;
        this.productCards = [];
        this.statsAnimated = false;
        
        // Bind methods
        this.handleLearnMoreClick = this.handleLearnMoreClick.bind(this);
        this.handleProductCardHover = this.handleProductCardHover.bind(this);
        this.animateStats = this.animateStats.bind(this);
        this.handleIntersection = this.handleIntersection.bind(this);
    }

    init() {
        if (this.isInitialized) return;
        
        console.log('[ProductsRedesigned] Initializing redesigned products section');
        
        try {
            this.setupElements();
            this.setupEventListeners();
            this.setupIntersectionObserver();
            this.setupAnimations();
            
            this.isInitialized = true;
            console.log('[ProductsRedesigned] Initialization complete');
            
        } catch (error) {
            console.error('[ProductsRedesigned] Initialization failed:', error);
        }
    }

    setupElements() {
        // Get all product cards
        this.productCards = document.querySelectorAll('.product-card-modern:not(.product-card-cta)');
        this.ctaCard = document.querySelector('.product-card-cta');
        this.statsSection = document.querySelector('.products-stats');
        this.heroCircle = document.querySelector('.product-hero-circle');
        this.featureBadges = document.querySelectorAll('.feature-badge');
        
        console.log(`[ProductsRedesigned] Found ${this.productCards.length} product cards`);
    }

    setupEventListeners() {
        // Add click handlers for "Learn More" links
        const learnMoreLinks = document.querySelectorAll('.learn-more');
        learnMoreLinks.forEach((link, index) => {
            link.addEventListener('click', (e) => this.handleLearnMoreClick(e, index));
            link.style.cursor = 'pointer';
        });

        // Add hover effects for product cards
        this.productCards.forEach((card, index) => {
            card.addEventListener('mouseenter', (e) => this.handleProductCardHover(e, index, 'enter'));
            card.addEventListener('mouseleave', (e) => this.handleProductCardHover(e, index, 'leave'));
        });

        // Add click handler for feature badges
        this.featureBadges.forEach((badge, index) => {
            badge.addEventListener('click', (e) => this.handleFeatureBadgeClick(e, index));
            badge.style.cursor = 'pointer';
        });

        // Add click handler for hero circle
        if (this.heroCircle) {
            this.heroCircle.addEventListener('click', this.handleHeroCircleClick.bind(this));
            this.heroCircle.style.cursor = 'pointer';
        }

        console.log('[ProductsRedesigned] Event listeners setup complete');
    }

    setupIntersectionObserver() {
        // Create intersection observer for animations
        const options = {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        };

        this.animationObserver = new IntersectionObserver(this.handleIntersection, options);

        // Observe elements for animation
        const elementsToObserve = [
            ...this.productCards,
            this.statsSection,
            document.querySelector('.product-hero-banner'),
            document.querySelector('.products-showcase')
        ].filter(Boolean);

        elementsToObserve.forEach(element => {
            this.animationObserver.observe(element);
        });

        console.log('[ProductsRedesigned] Intersection observer setup complete');
    }

    setupAnimations() {
        // Add initial animation states
        this.productCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        });

        if (this.statsSection) {
            this.statsSection.style.opacity = '0';
            this.statsSection.style.transform = 'translateY(20px)';
            this.statsSection.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        }

        console.log('[ProductsRedesigned] Animation setup complete');
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                
                if (element.classList.contains('product-card-modern')) {
                    // Animate product card
                    const index = Array.from(this.productCards).indexOf(element);
                    setTimeout(() => {
                        element.style.opacity = '1';
                        element.style.transform = 'translateY(0)';
                    }, index * 150);
                    
                } else if (element.classList.contains('products-stats')) {
                    // Animate stats section
                    setTimeout(() => {
                        element.style.opacity = '1';
                        element.style.transform = 'translateY(0)';
                        this.animateStats();
                    }, 300);
                    
                } else if (element.classList.contains('product-hero-banner')) {
                    // Animate hero banner
                    this.animateHeroBanner();
                    
                } else if (element.classList.contains('products-showcase')) {
                    // Animate showcase title
                    this.animateShowcaseTitle();
                }
                
                // Stop observing once animated
                this.animationObserver.unobserve(element);
            }
        });
    }

    animateHeroBanner() {
        const heroBanner = document.querySelector('.product-hero-banner');
        const heroText = document.querySelector('.product-hero-text');
        const heroVisual = document.querySelector('.product-hero-visual');
        
        if (heroBanner) {
            heroBanner.style.opacity = '0';
            heroBanner.style.transform = 'translateY(20px)';
            heroBanner.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            
            setTimeout(() => {
                heroBanner.style.opacity = '1';
                heroBanner.style.transform = 'translateY(0)';
            }, 100);
        }

        // Animate feature badges with stagger
        this.featureBadges.forEach((badge, index) => {
            badge.style.opacity = '0';
            badge.style.transform = 'translateX(-20px)';
            badge.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            setTimeout(() => {
                badge.style.opacity = '1';
                badge.style.transform = 'translateX(0)';
            }, 600 + (index * 100));
        });
    }

    animateShowcaseTitle() {
        const showcaseTitle = document.querySelector('.showcase-title');
        if (showcaseTitle) {
            showcaseTitle.style.opacity = '0';
            showcaseTitle.style.transform = 'translateY(20px)';
            showcaseTitle.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            
            setTimeout(() => {
                showcaseTitle.style.opacity = '1';
                showcaseTitle.style.transform = 'translateY(0)';
            }, 200);
        }
    }

    animateStats() {
        if (this.statsAnimated) return;
        this.statsAnimated = true;

        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach((statNumber, index) => {
            const finalText = statNumber.textContent;
            
            // Only animate numeric stats
            if (finalText.includes('%') || !isNaN(finalText.charAt(0))) {
                this.animateNumber(statNumber, finalText, index * 200);
            }
        });
    }

    animateNumber(element, finalText, delay) {
        setTimeout(() => {
            if (finalText === '100%') {
                this.countUp(element, 0, 100, 1000, '%');
            } else if (finalText === '2+') {
                this.countUp(element, 0, 2, 800, '+');
            }
        }, delay);
    }

    countUp(element, start, end, duration, suffix = '') {
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (end - start) * easeOut);
            
            element.textContent = current + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    handleLearnMoreClick(event, index) {
        event.preventDefault();
        
        const productCard = this.productCards[index];
        const productTitle = productCard.querySelector('h4').textContent;
        
        console.log(`[ProductsRedesigned] Learn more clicked for: ${productTitle}`);
        
        // Add click animation
        const learnMore = event.target;
        learnMore.style.transform = 'translateX(10px)';
        
        setTimeout(() => {
            learnMore.style.transform = 'translateX(0)';
        }, 200);

        // Navigate to products page with specific product focus
        const productSlug = productTitle.toLowerCase().replace(/\s+/g, '-');
        window.location.href = `/products.html#${productSlug}`;
    }

    handleProductCardHover(event, index, type) {
        const card = event.currentTarget;
        const image = card.querySelector('.product-card-image img');
        const category = card.querySelector('.product-category');
        
        if (type === 'enter') {
            // Enhanced hover effects
            if (image) {
                image.style.transform = 'scale(1.1)';
            }
            
            if (category) {
                category.style.transform = 'translateY(-5px)';
                category.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            }
            
            // Add subtle glow effect
            card.style.boxShadow = `
                0 20px 40px rgba(var(--color-accent-rgb-values), 0.15),
                0 10px 25px rgba(0, 0, 0, 0.1),
                0 0 0 1px rgba(var(--color-accent-rgb-values), 0.2)
            `;
            
        } else if (type === 'leave') {
            // Reset hover effects
            if (image) {
                image.style.transform = 'scale(1)';
            }
            
            if (category) {
                category.style.transform = 'translateY(0)';
                category.style.boxShadow = '';
            }
            
            // Reset glow effect
            card.style.boxShadow = '';
        }
    }

    handleFeatureBadgeClick(event, index) {
        const badge = event.currentTarget;
        const featureText = badge.textContent.trim();
        
        console.log(`[ProductsRedesigned] Feature badge clicked: ${featureText}`);
        
        // Add click animation
        badge.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            badge.style.transform = 'scale(1)';
        }, 150);

        // Show feature information (could be expanded to show modal or tooltip)
        this.showFeatureInfo(featureText, badge);
    }

    handleHeroCircleClick(event) {
        console.log('[ProductsRedesigned] Hero circle clicked');
        
        // Add click animation
        const circle = event.currentTarget;
        circle.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            circle.style.transform = 'scale(1)';
        }, 200);

        // Navigate to products page
        window.location.href = '/products.html';
    }

    showFeatureInfo(featureText, element) {
        // Create a simple tooltip or notification
        const tooltip = document.createElement('div');
        tooltip.className = 'feature-tooltip';
        tooltip.textContent = this.getFeatureDescription(featureText);
        
        // Style the tooltip
        Object.assign(tooltip.style, {
            position: 'absolute',
            background: 'var(--color-accent-primary)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            fontSize: '0.9rem',
            zIndex: '1000',
            opacity: '0',
            transform: 'translateY(10px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            pointerEvents: 'none',
            maxWidth: '200px',
            textAlign: 'center'
        });

        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.bottom + 10}px`;
        tooltip.style.transform = 'translateX(-50%) translateY(10px)';

        document.body.appendChild(tooltip);

        // Animate in
        requestAnimationFrame(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Remove after delay
        setTimeout(() => {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateX(-50%) translateY(-10px)';
            
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            }, 300);
        }, 2000);
    }

    getFeatureDescription(featureText) {
        const descriptions = {
            '100% Biodegradable': 'Completely breaks down naturally without harming the environment',
            'High Performance': 'Superior technical properties for demanding applications',
            'Plant-Based': 'Derived entirely from renewable plant sources',
            'Kitchen Safe': 'Safe for use in food preparation areas',
            'Easy to Use': 'Simple application with clear instructions',
            'Non-Toxic': 'Completely safe for humans and pets',
            'Marine Grade': 'Specially formulated for marine environments',
            'Fast Acting': 'Quick response time for effective cleanup'
        };
        
        return descriptions[featureText] || 'Learn more about this feature';
    }

    // Public API methods
    refresh() {
        if (this.isInitialized) {
            this.destroy();
            this.init();
        }
    }

    destroy() {
        if (this.animationObserver) {
            this.animationObserver.disconnect();
            this.animationObserver = null;
        }

        // Remove event listeners
        const learnMoreLinks = document.querySelectorAll('.learn-more');
        learnMoreLinks.forEach(link => {
            link.removeEventListener('click', this.handleLearnMoreClick);
        });

        this.productCards.forEach(card => {
            card.removeEventListener('mouseenter', this.handleProductCardHover);
            card.removeEventListener('mouseleave', this.handleProductCardHover);
        });

        this.featureBadges.forEach(badge => {
            badge.removeEventListener('click', this.handleFeatureBadgeClick);
        });

        if (this.heroCircle) {
            this.heroCircle.removeEventListener('click', this.handleHeroCircleClick);
        }

        this.isInitialized = false;
        console.log('[ProductsRedesigned] Destroyed');
    }

    // Utility method to check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Method to trigger animations manually
    triggerAnimations() {
        if (this.statsSection && this.isInViewport(this.statsSection)) {
            this.animateStats();
        }
    }
}

export default ProductsRedesigned;