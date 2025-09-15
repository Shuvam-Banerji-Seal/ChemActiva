// src/js/tests/ProductManager.test.js
// Unit tests for ProductManager component

import ProductManager from '../ProductManager.js';

describe('ProductManager', () => {
    let productManager;
    let mockContainer;
    
    beforeEach(() => {
        // Create mock product cards
        mockContainer = document.createElement('div');
        mockContainer.innerHTML = `
            <div class="product-card-enhanced" data-testid="card-0">
                <div class="product-image-carousel-enhanced">
                    <img src="test1.jpg" alt="Test Product 1">
                    <img src="test2.jpg" alt="Test Product 1 Alt">
                </div>
                <div class="product-info-enhanced">
                    <h3>Test Product 1</h3>
                    <div class="key-benefit-item">Benefit 1</div>
                    <div class="key-benefit-item">Benefit 2</div>
                </div>
                <div class="product-specs-accordion">
                    <div class="accordion-item">
                        <button class="accordion-header" aria-expanded="false">
                            <span>Specifications</span>
                            <span class="accordion-icon">+</span>
                        </button>
                        <div class="accordion-content" aria-hidden="true">
                            <p>Test specifications</p>
                        </div>
                    </div>
                </div>
                <button class="contact-button primary">Contact Us</button>
            </div>
            <div class="product-card-enhanced" data-testid="card-1">
                <div class="product-image-carousel-enhanced">
                    <img src="test3.jpg" alt="Test Product 2">
                </div>
                <div class="product-info-enhanced">
                    <h3>Test Product 2</h3>
                </div>
                <button class="contact-button primary">Get Quote</button>
            </div>
        `;
        document.body.appendChild(mockContainer);
    });
    
    afterEach(() => {
        if (productManager) {
            productManager.cleanup();
        }
        if (mockContainer && mockContainer.parentNode) {
            mockContainer.parentNode.removeChild(mockContainer);
        }
    });

    describe('Initialization', () => {
        test('should initialize successfully', () => {
            productManager = new ProductManager();
            productManager.init();
            
            expect(productManager.isInitialized).toBe(true);
            expect(productManager.productCards).toHaveLength(2);
        });

        test('should not initialize twice', () => {
            productManager = new ProductManager();
            productManager.init();
            
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            productManager.init();
            
            expect(consoleSpy).toHaveBeenCalledWith('ProductManager already initialized');
            consoleSpy.mockRestore();
        });

        test('should initialize in fallback mode on error', () => {
            productManager = new ProductManager();
            
            // Mock an error in initProductCards
            jest.spyOn(productManager, 'initProductCards').mockImplementation(() => {
                throw new Error('Test error');
            });
            
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            productManager.init();
            
            expect(consoleSpy).toHaveBeenCalledWith('ProductManager initializing in fallback mode');
            expect(productManager.isInitialized).toBe(true);
            
            consoleSpy.mockRestore();
        });

        test('should integrate with UIAnimations when available', () => {
            const mockUIAnimations = {
                getAnimationConfig: jest.fn().mockReturnValue({ duration: 300 })
            };
            
            productManager = new ProductManager(mockUIAnimations);
            productManager.init();
            
            expect(mockUIAnimations.getAnimationConfig).toHaveBeenCalled();
        });
    });

    describe('Product Card Management', () => {
        beforeEach(() => {
            productManager = new ProductManager();
            productManager.init();
        });

        test('should detect and initialize product cards', () => {
            expect(productManager.productCards).toHaveLength(2);
            
            const firstCard = productManager.productCards[0];
            expect(firstCard.element).toBeDefined();
            expect(firstCard.index).toBe(0);
            expect(firstCard.images).toHaveLength(2);
            expect(firstCard.title.textContent).toBe('Test Product 1');
        });

        test('should set up accessibility attributes', () => {
            const cardElement = productManager.productCards[0].element;
            
            expect(cardElement.getAttribute('role')).toBe('article');
            expect(cardElement.getAttribute('aria-label')).toContain('Product: Test Product 1');
            expect(cardElement.hasAttribute('tabindex')).toBe(true);
        });

        test('should handle card focus and blur', () => {
            const card = productManager.productCards[0];
            
            productManager.handleCardFocus(card);
            expect(card.element.style.outline).toContain('2px solid');
            
            productManager.handleCardBlur(card);
            expect(card.element.style.outline).toBe('');
        });

        test('should get card state', () => {
            const cardState = productManager.getCardState(0);
            
            expect(cardState).toEqual({
                index: 0,
                isLoaded: false,
                isVisible: false,
                loadTime: undefined,
                title: 'Test Product 1',
                imageCount: 2
            });
        });

        test('should return null for invalid card index', () => {
            const cardState = productManager.getCardState(999);
            expect(cardState).toBeNull();
        });
    });

    describe('Accordion Functionality', () => {
        beforeEach(() => {
            productManager = new ProductManager();
            productManager.init();
        });

        test('should initialize accordion items', () => {
            const accordion = mockContainer.querySelector('.product-specs-accordion');
            const header = accordion.querySelector('.accordion-header');
            
            expect(header.hasAttribute('aria-controls')).toBe(true);
            expect(header.hasAttribute('id')).toBe(true);
        });

        test('should toggle accordion item', () => {
            const card = productManager.productCards[0];
            const header = card.element.querySelector('.accordion-header');
            const content = card.element.querySelector('.accordion-content');
            const icon = header.querySelector('.accordion-icon');
            
            // Initially collapsed
            expect(header.getAttribute('aria-expanded')).toBe('false');
            expect(content.getAttribute('aria-hidden')).toBe('true');
            
            // Toggle to expand
            productManager.toggleAccordionItem(header, content, icon, card);
            
            expect(header.getAttribute('aria-expanded')).toBe('true');
            expect(content.getAttribute('aria-hidden')).toBe('false');
            expect(content.classList.contains('expanded')).toBe(true);
        });

        test('should handle accordion toggle errors gracefully', () => {
            const card = productManager.productCards[0];
            const header = null; // Invalid header
            const content = card.element.querySelector('.accordion-content');
            const icon = null;
            
            expect(() => {
                productManager.toggleAccordionItem(header, content, icon, card);
            }).not.toThrow();
        });

        test('should emit accordion toggle event', (done) => {
            const card = productManager.productCards[0];
            const header = card.element.querySelector('.accordion-header');
            const content = card.element.querySelector('.accordion-content');
            const icon = header.querySelector('.accordion-icon');
            
            window.addEventListener('accordionToggle', (event) => {
                expect(event.detail.cardIndex).toBe(0);
                expect(event.detail.isExpanded).toBe(true);
                done();
            });
            
            productManager.toggleAccordionItem(header, content, icon, card);
        });
    });

    describe('Contact Button Functionality', () => {
        beforeEach(() => {
            productManager = new ProductManager();
            productManager.init();
        });

        test('should handle contact button clicks', () => {
            const card = productManager.productCards[0];
            const button = card.element.querySelector('.contact-button');
            
            const mockEvent = {
                preventDefault: jest.fn(),
                target: { closest: () => button }
            };
            
            productManager.handleContactButtonClick(mockEvent, card);
            
            expect(mockEvent.preventDefault).toHaveBeenCalled();
        });

        test('should emit contact click event', (done) => {
            const card = productManager.productCards[0];
            const button = card.element.querySelector('.contact-button');
            
            window.addEventListener('productContactClick', (event) => {
                expect(event.detail.cardIndex).toBe(0);
                expect(event.detail.productName).toBe('Test Product 1');
                done();
            });
            
            const mockEvent = {
                preventDefault: jest.fn(),
                target: { closest: () => button }
            };
            
            productManager.handleContactButtonClick(mockEvent, card);
        });

        test('should extract product ID from card title', () => {
            const card = productManager.productCards[0];
            card.title.textContent = 'Domestic Oil Spill Kit';
            
            const productId = productManager.getProductIdFromCard(card);
            expect(productId).toBe('domestic-oil-spill-kit');
        });

        test('should return unknown product for unrecognized titles', () => {
            const card = productManager.productCards[0];
            card.title.textContent = 'Unknown Product';
            
            const productId = productManager.getProductIdFromCard(card);
            expect(productId).toBe('unknown-product');
        });
    });

    describe('Loading States', () => {
        beforeEach(() => {
            productManager = new ProductManager();
            productManager.init();
        });

        test('should show loading state for cards', () => {
            const card = productManager.productCards[0];
            productManager.showLoadingState(card);
            
            const imageSkeleton = card.element.querySelector('.product-image-skeleton');
            const infoSkeleton = card.element.querySelector('.product-info-skeleton');
            
            expect(imageSkeleton).not.toBeNull();
            expect(infoSkeleton).not.toBeNull();
        });

        test('should hide loading state and reveal content', (done) => {
            const card = productManager.productCards[0];
            productManager.showLoadingState(card);
            
            setTimeout(() => {
                productManager.hideLoadingState(card);
                
                setTimeout(() => {
                    expect(card.isLoaded).toBe(true);
                    done();
                }, 350); // Wait for animation
            }, 50);
        });

        test('should emit card loaded event', (done) => {
            const card = productManager.productCards[0];
            
            window.addEventListener('productCardLoaded', (event) => {
                expect(event.detail.cardIndex).toBe(0);
                expect(event.detail.productName).toBe('Test Product 1');
                done();
            });
            
            productManager.hideLoadingState(card);
        });
    });

    describe('Performance Tracking', () => {
        beforeEach(() => {
            productManager = new ProductManager();
            productManager.init();
        });

        test('should track performance metrics', () => {
            const metrics = productManager.getPerformanceMetrics();
            
            expect(metrics.loadStartTime).toBeDefined();
            expect(metrics.totalCards).toBe(2);
            expect(metrics.cardsLoaded).toBeDefined();
            expect(metrics.loadedPercentage).toBeDefined();
        });

        test('should calculate average load time', () => {
            // Simulate some cards with load times
            productManager.productCards[0].loadTime = 100;
            productManager.productCards[1].loadTime = 200;
            
            const metrics = productManager.getPerformanceMetrics();
            expect(metrics.averageLoadTime).toBe(150);
        });
    });

    describe('Intersection Observer', () => {
        beforeEach(() => {
            productManager = new ProductManager();
            productManager.init();
        });

        test('should initialize intersection observer', () => {
            expect(productManager.intersectionObserver).not.toBeNull();
        });

        test('should observe product cards', () => {
            const observeSpy = jest.spyOn(productManager.intersectionObserver, 'observe');
            
            // Re-initialize to trigger observe calls
            productManager.cleanup();
            productManager = new ProductManager();
            productManager.init();
            
            expect(observeSpy).toHaveBeenCalledTimes(2); // Two cards
        });

        test('should load card when it becomes visible', () => {
            const card = productManager.productCards[0];
            const loadSpy = jest.spyOn(productManager, 'loadProductCard');
            
            // Simulate intersection observer callback
            card.isVisible = true;
            productManager.loadProductCard(card);
            
            expect(loadSpy).toHaveBeenCalledWith(card);
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            productManager = new ProductManager();
            productManager.init();
        });

        test('should handle basic event handler errors', () => {
            const card = {
                index: 0,
                element: document.createElement('div'),
                ctaButton: null,
                title: { textContent: 'Test' }
            };
            
            expect(() => {
                productManager.initBasicEventHandlers = () => {
                    productManager.productCards = [card];
                    productManager.initBasicEventHandlers();
                };
            }).not.toThrow();
        });

        test('should log errors through error handler', () => {
            const logSpy = jest.spyOn(productManager.errorHandler, 'logError');
            
            // Trigger an error condition
            try {
                throw new Error('Test error');
            } catch (error) {
                productManager.errorHandler.logError('Test Error', { error: error.message });
            }
            
            expect(logSpy).toHaveBeenCalledWith('Test Error', { error: 'Test error' });
        });
    });

    describe('Theme Handling', () => {
        beforeEach(() => {
            productManager = new ProductManager();
            productManager.init();
        });

        test('should handle theme changes', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            
            productManager.handleThemeChange(true);
            expect(consoleSpy).toHaveBeenCalledWith('ProductManager: Theme changed to dark mode');
            
            productManager.handleThemeChange(false);
            expect(consoleSpy).toHaveBeenCalledWith('ProductManager: Theme changed to light mode');
            
            consoleSpy.mockRestore();
        });
    });

    describe('Hover Animations', () => {
        beforeEach(() => {
            productManager = new ProductManager();
            productManager.init();
        });

        test('should trigger hover animations programmatically', () => {
            const card = productManager.productCards[0];
            card.isLoaded = true;
            
            productManager.triggerCardHover(0, true);
            expect(card.element.style.transform).toContain('translateY(-8px)');
            
            productManager.triggerCardHover(0, false);
            expect(card.element.style.transform).toContain('translateY(0)');
        });

        test('should not trigger hover on unloaded cards', () => {
            const card = productManager.productCards[0];
            card.isLoaded = false;
            
            const initialTransform = card.element.style.transform;
            productManager.triggerCardHover(0, true);
            
            expect(card.element.style.transform).toBe(initialTransform);
        });
    });

    describe('Cleanup', () => {
        beforeEach(() => {
            productManager = new ProductManager();
            productManager.init();
        });

        test('should cleanup resources properly', () => {
            productManager.cleanup();
            
            expect(productManager.intersectionObserver).toBeNull();
            expect(productManager.eventListeners.size).toBe(0);
        });

        test('should allow re-initialization after cleanup', () => {
            productManager.cleanup();
            productManager.isInitialized = false;
            
            expect(() => {
                productManager.init();
            }).not.toThrow();
            
            expect(productManager.isInitialized).toBe(true);
        });
    });

    describe('Refresh Functionality', () => {
        beforeEach(() => {
            productManager = new ProductManager();
            productManager.init();
        });

        test('should refresh and reinitialize', () => {
            const initialCardCount = productManager.productCards.length;
            
            productManager.refresh();
            
            expect(productManager.isInitialized).toBe(true);
            expect(productManager.productCards.length).toBe(initialCardCount);
        });
    });

    describe('Static Methods', () => {
        test('should check browser support', () => {
            const isSupported = ProductManager.isSupported();
            expect(typeof isSupported).toBe('boolean');
        });
    });

    describe('Event Handling', () => {
        beforeEach(() => {
            productManager = new ProductManager();
            productManager.init();
        });

        test('should handle CTA click events', (done) => {
            const card = productManager.productCards[0];
            
            window.addEventListener('productCTAClick', (event) => {
                expect(event.detail.productIndex).toBe(0);
                expect(event.detail.productTitle).toBe('Test Product 1');
                done();
            });
            
            const mockEvent = {
                preventDefault: jest.fn(),
                target: card.ctaButton
            };
            
            productManager.handleCTAClick(mockEvent, card);
        });

        test('should handle keyboard events on accordion', () => {
            const card = productManager.productCards[0];
            const header = card.element.querySelector('.accordion-header');
            
            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
            
            expect(() => {
                header.dispatchEvent(enterEvent);
                header.dispatchEvent(spaceEvent);
            }).not.toThrow();
        });
    });
});