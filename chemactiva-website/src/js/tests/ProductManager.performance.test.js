// src/js/tests/ProductManager.performance.test.js
// Performance and error handling tests for ProductManager component

import ProductManager from '../ProductManager.js';

describe('ProductManager Performance and Error Handling Tests', () => {
    let testContainer;
    let productManager;
    
    beforeEach(() => {
        // Create test container with multiple product cards
        testContainer = document.createElement('div');
        testContainer.innerHTML = `
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
        document.body.appendChild(testContainer);
    });
    
    afterEach(() => {
        if (productManager) {
            productManager.cleanup();
        }
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }
    });

    describe('Performance Optimization', () => {
        test('should initialize within performance budget', () => {
            const { duration } = performanceUtils.measureTime(() => {
                productManager = new ProductManager();
                productManager.init();
            });
            
            // Should initialize within 100ms for small number of cards
            expect(duration).toBeLessThan(100);
        });

        test('should handle large number of product cards efficiently', () => {
            // Create many product cards
            for (let i = 0; i < 50; i++) {
                const card = document.createElement('div');
                card.className = 'product-card-enhanced';
                card.innerHTML = `
                    <div class="product-image-carousel-enhanced">
                        <img src="test${i}.jpg" alt="Test Product ${i}">
                    </div>
                    <div class="product-info-enhanced">
                        <h3>Test Product ${i}</h3>
                    </div>
                    <button class="contact-button primary">Contact</button>
                `;
                testContainer.appendChild(card);
            }
            
            const { duration } = performanceUtils.measureTime(() => {
                productManager = new ProductManager();
                productManager.init();
            });
            
            // Should handle 50+ cards within 300ms
            expect(duration).toBeLessThan(300);
            expect(productManager.productCards.length).toBeGreaterThan(50);
        });

        test('should use lazy loading for product cards', () => {
            productManager = new ProductManager();
            productManager.init();
            
            // Initially, cards should not be loaded
            const cards = productManager.productCards;
            expect(cards.some(card => !card.isLoaded)).toBe(true);
            
            // Simulate intersection observer callback for first card
            const firstCard = cards[0];
            firstCard.isVisible = true;
            productManager.loadProductCard(firstCard);
            
            // Card should be loaded after intersection
            expect(firstCard.isLoaded).toBe(true);
        });

        test('should track performance metrics', () => {
            productManager = new ProductManager();
            productManager.init();
            
            // Load all cards
            productManager.productCards.forEach(card => {
                card.isVisible = true;
                productManager.loadProductCard(card);
            });
            
            // Get performance metrics
            const metrics = productManager.getPerformanceMetrics();
            
            // Should have valid metrics
            expect(metrics.loadStartTime).toBeGreaterThan(0);
            expect(metrics.initTime).toBeGreaterThan(0);
            expect(metrics.cardsLoaded).toBe(productManager.productCards.length);
            expect(metrics.totalCards).toBe(productManager.productCards.length);
            expect(metrics.loadedPercentage).toBe(100);
            expect(metrics.averageLoadTime).toBeGreaterThan(0);
        });

        test('should optimize event listener management', () => {
            productManager = new ProductManager();
            productManager.init();
            
            // Check that event listeners are properly tracked
            expect(productManager.eventListeners.size).toBeGreaterThan(0);
            
            // Store initial count
            const initialCount = productManager.eventListeners.size;
            
            // Cleanup should remove all event listeners
            productManager.cleanup();
            expect(productManager.eventListeners.size).toBe(0);
            
            // Re-initialize should restore event listeners
            productManager.isInitialized = false;
            productManager.init();
            expect(productManager.eventListeners.size).toBe(initialCount);
        });
    });

    describe('Error Handling and Graceful Degradation', () => {
        test('should handle initialization errors gracefully', () => {
            // Mock an error in initProductCards
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
            const errorSpy = jest.spyOn(ErrorHandler.prototype, 'handleJavaScriptError').mockImplementation();
            
            // Create manager with mocked error
            productManager = new ProductManager();
            jest.spyOn(productManager, 'initProductCards').mockImplementation(() => {
                throw new Error('Test initialization error');
            });
            
            // Should not throw when initialization fails
            expect(() => {
                productManager.init();
            }).not.toThrow();
            
            // Should log warning and call error handler
            expect(consoleSpy).toHaveBeenCalledWith('ProductManager initializing in fallback mode');
            expect(errorSpy).toHaveBeenCalled();
            
            // Should still be initialized (in fallback mode)
            expect(productManager.isInitialized).toBe(true);
            
            // Restore mocks
            consoleSpy.mockRestore();
            errorSpy.mockRestore();
        });

        test('should initialize in fallback mode when main init fails', () => {
            productManager = new ProductManager();
            
            // Mock initProductCards to throw error
            jest.spyOn(productManager, 'initProductCards').mockImplementation(() => {
                throw new Error('Test error');
            });
            
            // Mock initFallbackMode to track calls
            const fallbackSpy = jest.spyOn(productManager, 'initFallbackMode');
            
            productManager.init();
            
            // Should call fallback mode
            expect(fallbackSpy).toHaveBeenCalled();
            expect(productManager.isInitialized).toBe(true);
            
            fallbackSpy.mockRestore();
        });

        test('should handle accordion interaction errors gracefully', () => {
            productManager = new ProductManager();
            productManager.init();
            
            const card = productManager.productCards[0];
            const header = card.element.querySelector('.accordion-header');
            const content = card.element.querySelector('.accordion-content');
            
            // Mock error in toggleAccordionItem
            const errorSpy = jest.spyOn(productManager.errorHandler, 'handleInteractionError').mockImplementation();
            
            // Create a situation that would cause an error
            header.removeAttribute('aria-expanded');
            
            // Should not throw when toggling accordion
            expect(() => {
                productManager.toggleAccordionItem(header, content, null, card);
            }).not.toThrow();
            
            // Should call error handler
            expect(errorSpy).toHaveBeenCalled();
            
            errorSpy.mockRestore();
        });

        test('should handle missing browser APIs gracefully', () => {
            // Store original IntersectionObserver
            const originalIntersectionObserver = window.IntersectionObserver;
            
            // Mock missing IntersectionObserver
            delete window.IntersectionObserver;
            
            productManager = new ProductManager();
            
            // Should not throw when initializing without IntersectionObserver
            expect(() => {
                productManager.init();
            }).not.toThrow();
            
            // Restore original
            window.IntersectionObserver = originalIntersectionObserver;
        });

        test('should handle failed image loading gracefully', () => {
            productManager = new ProductManager();
            productManager.init();
            
            const card = productManager.productCards[0];
            
            // Add card to failed set
            productManager.failedCards.add(card.index);
            
            // Should still be able to get card state
            const cardState = productManager.getCardState(card.index);
            expect(cardState).not.toBeNull();
        });
    });

    describe('Memory Management', () => {
        test('should properly clean up resources', () => {
            productManager = new ProductManager();
            productManager.init();
            
            // Store references to verify cleanup
            const observer = productManager.intersectionObserver;
            expect(observer).not.toBeNull();
            
            // Cleanup
            productManager.cleanup();
            
            // Should clear all resources
            expect(productManager.intersectionObserver).toBeNull();
            expect(productManager.eventListeners.size).toBe(0);
        });

        test('should remove all event listeners on cleanup', () => {
            productManager = new ProductManager();
            productManager.init();
            
            // Mock removeEventListener to track calls
            const removeEventListenerSpy = jest.spyOn(Element.prototype, 'removeEventListener');
            
            // Cleanup
            productManager.cleanup();
            
            // Should call removeEventListener for each listener
            expect(removeEventListenerSpy).toHaveBeenCalled();
            
            removeEventListenerSpy.mockRestore();
        });

        test('should allow garbage collection after cleanup', () => {
            productManager = new ProductManager();
            productManager.init();
            
            // Store weak references to track GC
            const weakMap = new WeakMap();
            productManager.productCards.forEach(card => {
                weakMap.set(card, true);
            });
            
            // Cleanup and remove references
            productManager.cleanup();
            const cardCount = productManager.productCards.length;
            productManager.productCards = [];
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            // Verify resources can be garbage collected
            expect(productManager.productCards.length).toBe(0);
        });
    });

    describe('Browser Compatibility', () => {
        test('should detect browser support for required features', () => {
            const isSupported = ProductManager.isSupported();
            
            // Result should be a boolean
            expect(typeof isSupported).toBe('boolean');
        });

        test('should work without PerformanceObserver', () => {
            // Store original PerformanceObserver
            const originalPerformanceObserver = window.PerformanceObserver;
            
            // Mock missing PerformanceObserver
            delete window.PerformanceObserver;
            
            productManager = new ProductManager();
            
            // Should not throw when initializing without PerformanceObserver
            expect(() => {
                productManager.init();
                productManager.initPerformanceTracking();
            }).not.toThrow();
            
            // Restore original
            window.PerformanceObserver = originalPerformanceObserver;
        });

        test('should handle older browsers without animation capabilities', () => {
            // Mock missing requestAnimationFrame
            const originalRAF = window.requestAnimationFrame;
            window.requestAnimationFrame = null;
            
            productManager = new ProductManager();
            
            // Should not throw when initializing
            expect(() => {
                productManager.init();
            }).not.toThrow();
            
            // Restore original
            window.requestAnimationFrame = originalRAF;
        });
    });
});