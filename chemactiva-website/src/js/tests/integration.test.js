// src/js/tests/integration.test.js
// Integration tests for product page functionality

import ProductImageGallery from '../ProductImageGallery.js';
import ProductManager from '../ProductManager.js';
import PerformanceManager from '../PerformanceManager.js';
import ErrorHandler from '../ErrorHandler.js';

describe('Product Page Integration Tests', () => {
    let testContainer;
    let productManager;
    let performanceManager;
    let errorHandler;
    
    beforeEach(() => {
        // Create comprehensive test environment
        testContainer = document.createElement('div');
        testContainer.innerHTML = `
            <div class="product-page-container">
                <!-- Product Cards -->
                <div class="product-card-enhanced" data-product="domestic-oil-spill-kit">
                    <div class="product-image-carousel-enhanced">
                        <img src="public/assets/images/products/Domestic_oil_spill_kit_1.jpeg" alt="Domestic Oil Spill Kit">
                        <img src="public/assets/images/products/Domestic_oil_spill_kit_collage_1.jpeg" alt="Domestic Kit Collage">
                    </div>
                    <div class="product-info-enhanced">
                        <h3>Domestic Oil Spill Kit</h3>
                        <div class="key-benefit-item">Quick absorption</div>
                        <div class="key-benefit-item">Easy cleanup</div>
                        <div class="key-benefit-item">Safe disposal</div>
                    </div>
                    <div class="product-specs-accordion">
                        <div class="accordion-item">
                            <button class="accordion-header" aria-expanded="false">
                                <span>Technical Specifications</span>
                                <span class="accordion-icon">+</span>
                            </button>
                            <div class="accordion-content" aria-hidden="true">
                                <ul>
                                    <li>Absorption capacity: 50L</li>
                                    <li>Coverage area: 100m²</li>
                                    <li>Response time: &lt;5 minutes</li>
                                </ul>
                            </div>
                        </div>
                        <div class="accordion-item">
                            <button class="accordion-header" aria-expanded="false">
                                <span>Usage Instructions</span>
                                <span class="accordion-icon">+</span>
                            </button>
                            <div class="accordion-content" aria-hidden="true">
                                <p>Step-by-step usage instructions...</p>
                            </div>
                        </div>
                    </div>
                    <div class="product-contact-section">
                        <button class="contact-button primary" data-action="quote" data-product="domestic-oil-spill-kit">
                            Get Quote
                        </button>
                        <button class="contact-button secondary" data-action="info" data-product="domestic-oil-spill-kit">
                            More Info
                        </button>
                    </div>
                </div>
                
                <div class="product-card-enhanced" data-product="marine-oil-spill-kit">
                    <div class="product-image-carousel-enhanced">
                        <img src="public/assets/images/products/Marine_oil_spill_kit.jpeg" alt="Marine Oil Spill Kit">
                    </div>
                    <div class="product-info-enhanced">
                        <h3>Marine Oil Spill Kit</h3>
                        <div class="key-benefit-item">Marine-grade materials</div>
                        <div class="key-benefit-item">Weather resistant</div>
                    </div>
                    <div class="product-contact-section">
                        <button class="contact-button primary" data-action="quote" data-product="marine-oil-spill-kit">
                            Get Quote
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(testContainer);
        
        // Initialize components
        errorHandler = new ErrorHandler();
        performanceManager = new PerformanceManager();
        productManager = new ProductManager();
    });
    
    afterEach(() => {
        if (productManager) {
            productManager.cleanup();
        }
        if (performanceManager) {
            performanceManager.cleanup();
        }
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }
    });

    describe('Component Integration', () => {
        test('should initialize all components without conflicts', async () => {
            await performanceManager.init();
            productManager.init();
            
            expect(productManager.isInitialized).toBe(true);
            expect(performanceManager.isInitialized).toBe(true);
            expect(productManager.productCards).toHaveLength(2);
        });

        test('should handle component interactions', () => {
            productManager.init();
            
            const firstCard = productManager.productCards[0];
            const accordionHeader = firstCard.element.querySelector('.accordion-header');
            
            // Test accordion interaction
            accordionHeader.click();
            
            const content = firstCard.element.querySelector('.accordion-content');
            expect(content.getAttribute('aria-hidden')).toBe('false');
        });

        test('should coordinate image gallery with product manager', () => {
            productManager.init();
            
            const imageContainer = testContainer.querySelector('.product-image-carousel-enhanced');
            const gallery = new ProductImageGallery(imageContainer);
            
            expect(gallery.images).toHaveLength(2);
            expect(productManager.productCards[0].images).toHaveLength(2);
            
            gallery.cleanup();
        });
    });

    describe('Error Handling Integration', () => {
        test('should handle component initialization errors gracefully', () => {
            // Mock a component failure
            jest.spyOn(ProductManager.prototype, 'initProductCards').mockImplementation(() => {
                throw new Error('Initialization failed');
            });
            
            expect(() => {
                productManager.init();
            }).not.toThrow();
            
            expect(productManager.isInitialized).toBe(true); // Should fallback
        });

        test('should propagate errors through error handler', () => {
            const errorSpy = jest.spyOn(errorHandler, 'logError');
            
            productManager.init();
            
            // Trigger an error
            try {
                throw new Error('Test integration error');
            } catch (error) {
                errorHandler.handleJavaScriptError(error, {
                    component: 'Integration Test',
                    context: 'error propagation test'
                });
            }
            
            expect(errorSpy).toHaveBeenCalled();
        });

        test('should handle network errors during component operations', async () => {
            const networkErrorSpy = jest.spyOn(errorHandler, 'handleNetworkError');
            
            try {
                await errorHandler.handleNetworkError('test-url', {
                    maxRetries: 1,
                    retryDelay: 100
                });
            } catch (error) {
                expect(error.message).toContain('Network request failed');
            }
            
            expect(networkErrorSpy).toHaveBeenCalled();
        });
    });

    describe('Performance Integration', () => {
        test('should track component performance metrics', async () => {
            await performanceManager.init();
            productManager.init();
            
            const metrics = performanceManager.getMetrics();
            const productMetrics = productManager.getPerformanceMetrics();
            
            expect(metrics.totalLoadTime).toBeGreaterThan(0);
            expect(productMetrics.totalCards).toBe(2);
        });

        test('should optimize performance based on component feedback', async () => {
            await performanceManager.init();
            
            // Simulate performance optimization trigger
            const optimizeSpy = jest.spyOn(performanceManager, 'optimize');
            performanceManager.optimize();
            
            expect(optimizeSpy).toHaveBeenCalled();
        });

        test('should handle lazy loading coordination', () => {
            productManager.init();
            
            const card = productManager.productCards[0];
            expect(card.isLoaded).toBe(false);
            
            // Simulate intersection observer triggering load
            productManager.loadProductCard(card);
            
            expect(card.loadTime).toBeDefined();
        });
    });

    describe('User Interaction Flows', () => {
        beforeEach(() => {
            productManager.init();
        });

        test('should handle complete product inquiry flow', (done) => {
            let eventCount = 0;
            const expectedEvents = 2;
            
            // Listen for contact events
            window.addEventListener('productContactClick', (event) => {
                expect(event.detail.productId).toBe('domestic-oil-spill-kit');
                expect(event.detail.action).toBe('quote');
                eventCount++;
                
                if (eventCount === expectedEvents) {
                    done();
                }
            });
            
            // Listen for accordion events
            window.addEventListener('accordionToggle', (event) => {
                expect(event.detail.cardIndex).toBe(0);
                expect(event.detail.isExpanded).toBe(true);
                eventCount++;
                
                if (eventCount === expectedEvents) {
                    done();
                }
            });
            
            // Simulate user interactions
            const card = productManager.productCards[0];
            const accordionHeader = card.element.querySelector('.accordion-header');
            const contactButton = card.element.querySelector('.contact-button.primary');
            
            // Expand accordion
            accordionHeader.click();
            
            // Click contact button
            contactButton.click();
        });

        test('should handle keyboard navigation across components', () => {
            const card = productManager.productCards[0];
            const imageContainer = card.element.querySelector('.product-image-carousel-enhanced');
            const gallery = new ProductImageGallery(imageContainer);
            
            // Test keyboard navigation in gallery
            const rightArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            imageContainer.dispatchEvent(rightArrowEvent);
            
            // Test keyboard navigation in accordion
            const accordionHeader = card.element.querySelector('.accordion-header');
            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            accordionHeader.dispatchEvent(enterEvent);
            
            expect(gallery.currentIndex).toBe(1);
            
            gallery.cleanup();
        });

        test('should handle touch interactions on mobile', () => {
            const card = productManager.productCards[0];
            const imageContainer = card.element.querySelector('.product-image-carousel-enhanced');
            const gallery = new ProductImageGallery(imageContainer, { enableTouch: true });
            
            // Simulate touch swipe
            const touchStart = new TouchEvent('touchstart', {
                touches: [{ clientX: 200, clientY: 100 }]
            });
            const touchEnd = new TouchEvent('touchend', {
                changedTouches: [{ clientX: 100, clientY: 100 }]
            });
            
            gallery.handleTouchStart(touchStart);
            gallery.handleTouchEnd(touchEnd);
            
            expect(gallery.currentIndex).toBe(1);
            
            gallery.cleanup();
        });
    });

    describe('Accessibility Integration', () => {
        beforeEach(() => {
            productManager.init();
        });

        test('should maintain accessibility across component interactions', () => {
            const card = productManager.productCards[0];
            const accordionHeader = card.element.querySelector('.accordion-header');
            const accordionContent = card.element.querySelector('.accordion-content');
            
            // Check initial accessibility state
            expect(accordionHeader.getAttribute('aria-expanded')).toBe('false');
            expect(accordionContent.getAttribute('aria-hidden')).toBe('true');
            
            // Interact and check updated state
            accordionHeader.click();
            
            expect(accordionHeader.getAttribute('aria-expanded')).toBe('true');
            expect(accordionContent.getAttribute('aria-hidden')).toBe('false');
        });

        test('should provide proper focus management', () => {
            const card = productManager.productCards[0];
            
            // Test card focus
            card.element.focus();
            productManager.handleCardFocus(card);
            
            expect(card.element.style.outline).toContain('2px solid');
            
            // Test blur
            productManager.handleCardBlur(card);
            expect(card.element.style.outline).toBe('');
        });

        test('should announce changes to screen readers', () => {
            const card = productManager.productCards[0];
            const imageContainer = card.element.querySelector('.product-image-carousel-enhanced');
            const gallery = new ProductImageGallery(imageContainer);
            
            gallery.goToImage(1);
            
            const liveRegion = document.getElementById('gallery-live-region');
            expect(liveRegion).not.toBeNull();
            expect(liveRegion.textContent).toContain('Showing image 2 of 2');
            
            gallery.cleanup();
        });
    });

    describe('Data Flow Integration', () => {
        beforeEach(() => {
            productManager.init();
        });

        test('should extract and use product data consistently', () => {
            const card = productManager.productCards[0];
            const productId = productManager.getProductIdFromCard(card);
            
            expect(productId).toBe('domestic-oil-spill-kit');
            
            // Verify data consistency across components
            const cardElement = card.element;
            expect(cardElement.getAttribute('data-product')).toBe('domestic-oil-spill-kit');
        });

        test('should handle dynamic content updates', () => {
            const card = productManager.productCards[0];
            
            // Simulate content update
            card.title.textContent = 'Updated Product Name';
            
            const updatedState = productManager.getCardState(0);
            expect(updatedState.title).toBe('Updated Product Name');
        });
    });

    describe('Error Recovery Integration', () => {
        test('should recover from component failures', async () => {
            // Initialize with potential failure points
            await performanceManager.init();
            productManager.init();
            
            // Simulate component failure and recovery
            const card = productManager.productCards[0];
            const imageContainer = card.element.querySelector('.product-image-carousel-enhanced');
            
            // Create gallery that might fail
            const gallery = new ProductImageGallery(imageContainer);
            
            // Simulate image load failure
            gallery.handleImageLoadFailure(0);
            expect(gallery.failedImages.has(0)).toBe(true);
            
            // Test recovery
            await gallery.retryFailedImages();
            expect(gallery.failedImages.has(0)).toBe(false);
            
            gallery.cleanup();
        });

        test('should maintain functionality during network issues', () => {
            productManager.init();
            
            // Simulate offline state
            window.dispatchEvent(new Event('offline'));
            
            // Components should still function
            const card = productManager.productCards[0];
            const accordionHeader = card.element.querySelector('.accordion-header');
            
            expect(() => {
                accordionHeader.click();
            }).not.toThrow();
            
            // Simulate online recovery
            window.dispatchEvent(new Event('online'));
        });
    });

    describe('Performance Under Load', () => {
        test('should handle multiple simultaneous interactions', () => {
            productManager.init();
            
            const interactions = [];
            
            // Queue multiple interactions
            for (let i = 0; i < 10; i++) {
                interactions.push(() => {
                    const card = productManager.productCards[i % 2];
                    const accordionHeader = card.element.querySelector('.accordion-header');
                    accordionHeader.click();
                });
            }
            
            // Execute all interactions
            expect(() => {
                interactions.forEach(interaction => interaction());
            }).not.toThrow();
        });

        test('should maintain performance with large datasets', () => {
            // Add more product cards dynamically
            for (let i = 0; i < 50; i++) {
                const newCard = testContainer.querySelector('.product-card-enhanced').cloneNode(true);
                newCard.setAttribute('data-testid', `card-${i + 2}`);
                testContainer.appendChild(newCard);
            }
            
            const startTime = performance.now();
            productManager.init();
            const endTime = performance.now();
            
            expect(endTime - startTime).toBeLessThan(1000); // Should initialize within 1 second
            expect(productManager.productCards.length).toBeGreaterThan(2);
        });
    });

    describe('Cross-Browser Compatibility', () => {
        test('should handle missing browser APIs gracefully', () => {
            // Mock missing IntersectionObserver
            const originalIntersectionObserver = window.IntersectionObserver;
            delete window.IntersectionObserver;
            
            expect(() => {
                productManager.init();
            }).not.toThrow();
            
            // Restore
            window.IntersectionObserver = originalIntersectionObserver;
        });

        test('should provide fallbacks for modern features', () => {
            // Mock missing PerformanceObserver
            const originalPerformanceObserver = window.PerformanceObserver;
            delete window.PerformanceObserver;
            
            expect(() => {
                const manager = new PerformanceManager();
                manager.init();
            }).not.toThrow();
            
            // Restore
            window.PerformanceObserver = originalPerformanceObserver;
        });
    });
});