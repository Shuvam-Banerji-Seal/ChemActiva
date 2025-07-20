// src/js/tests/product-page-integration.test.js
// Integration tests for product page components and their interactions

import ProductManager from '../ProductManager.js';
import ProductImageGallery from '../ProductImageGallery.js';
import ErrorHandler from '../ErrorHandler.js';

describe('Product Page Integration Tests', () => {
    let testContainer;
    let productManager;
    
    beforeEach(() => {
        // Create comprehensive test environment with realistic product cards
        testContainer = document.createElement('div');
        testContainer.innerHTML = `
            <div class="product-grid">
                <!-- Domestic Oil Spill Kit Product Card -->
                <div class="product-card-enhanced" data-product="domestic-oil-spill-kit">
                    <div class="product-image-carousel-enhanced">
                        <img src="test-domestic-1.jpg" alt="Domestic Oil Spill Kit - Main View">
                        <img src="test-domestic-2.jpg" alt="Domestic Kit Collage - Usage Examples">
                    </div>
                    <div class="product-info-enhanced">
                        <div class="product-header-section">
                            <div class="product-title-group">
                                <span class="product-category-badge">Oil Spill Solution</span>
                                <h3>Domestic Oil Spill Kit</h3>
                            </div>
                            <p class="product-description">
                                Revolutionary nano-cellulose based oil absorption kit designed for safe domestic use.
                            </p>
                        </div>
                        <div class="product-benefits-highlight">
                            <div class="benefits-title">Key Benefits</div>
                            <ul class="key-benefits-grid">
                                <li class="key-benefit-item">
                                    <span class="benefit-icon">✓</span>
                                    <span class="benefit-text">Non-toxic & Food-Safe</span>
                                </li>
                                <li class="key-benefit-item">
                                    <span class="benefit-icon">⚡</span>
                                    <span class="benefit-text">High Efficiency</span>
                                </li>
                            </ul>
                        </div>
                        <div class="product-specs-accordion">
                            <div class="accordion-item">
                                <button class="accordion-header" aria-expanded="false" aria-controls="test-specs-1">
                                    <span>Technical Specifications</span>
                                    <span class="accordion-icon">+</span>
                                </button>
                                <div class="accordion-content" id="test-specs-1" aria-hidden="true">
                                    <ul>
                                        <li><strong>Porosity:</strong> 97.3%</li>
                                        <li><strong>Absorption Capacity:</strong> 15-20x its weight</li>
                                    </ul>
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
                </div>
                
                <!-- Marine Oil Spill Kit Product Card -->
                <div class="product-card-enhanced" data-product="marine-oil-spill-kit">
                    <div class="product-image-carousel-enhanced">
                        <img src="test-marine-1.jpg" alt="Marine Oil Spill Kit">
                    </div>
                    <div class="product-info-enhanced">
                        <div class="product-header-section">
                            <div class="product-title-group">
                                <span class="product-category-badge">Marine Solution</span>
                                <h3>Marine Oil Spill Kit</h3>
                            </div>
                        </div>
                        <div class="product-specs-accordion">
                            <div class="accordion-item">
                                <button class="accordion-header" aria-expanded="false" aria-controls="test-specs-2">
                                    <span>Technical Specifications</span>
                                    <span class="accordion-icon">+</span>
                                </button>
                                <div class="accordion-content" id="test-specs-2" aria-hidden="true">
                                    <ul>
                                        <li><strong>Absorption Ratio:</strong> Up to 50:1</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div class="product-contact-section">
                            <button class="contact-button primary" data-action="quote" data-product="marine-oil-spill-kit">
                                Get Quote
                            </button>
                        </div>
                    </div>
                </div>
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

    describe('Component Integration', () => {
        test('should initialize ProductManager and ProductImageGallery without conflicts', () => {
            // Initialize ProductManager
            productManager = new ProductManager();
            productManager.init();
            
            // Initialize ProductImageGallery for first product
            const firstCardImageContainer = testContainer.querySelector('.product-card-enhanced:first-child .product-image-carousel-enhanced');
            const gallery = new ProductImageGallery(firstCardImageContainer);
            
            // Verify both components initialized successfully
            expect(productManager.isInitialized).toBe(true);
            expect(productManager.productCards.length).toBe(2);
            expect(gallery.images.length).toBe(2);
            
            // Cleanup gallery
            gallery.cleanup();
        });

        test('should coordinate loading states between components', () => {
            // Initialize ProductManager
            productManager = new ProductManager();
            productManager.init();
            
            // Get first product card
            const firstCard = productManager.productCards[0];
            expect(firstCard.isLoaded).toBe(false);
            
            // Simulate intersection observer triggering load
            firstCard.isVisible = true;
            productManager.loadProductCard(firstCard);
            
            // Card should be loaded
            expect(firstCard.isLoaded).toBe(true);
            
            // Initialize gallery after card is loaded
            const imageContainer = firstCard.element.querySelector('.product-image-carousel-enhanced');
            const gallery = new ProductImageGallery(imageContainer);
            
            // Gallery should have same number of images as card
            expect(gallery.images.length).toBe(firstCard.images.length);
            
            gallery.cleanup();
        });

        test('should handle accordion interactions properly', () => {
            // Initialize ProductManager
            productManager = new ProductManager();
            productManager.init();
            
            // Get first product card and accordion elements
            const firstCard = productManager.productCards[0];
            const header = firstCard.element.querySelector('.accordion-header');
            const content = firstCard.element.querySelector('.accordion-content');
            
            // Initial state should be collapsed
            expect(header.getAttribute('aria-expanded')).toBe('false');
            expect(content.getAttribute('aria-hidden')).toBe('true');
            
            // Toggle accordion
            testUtils.simulateClick(header);
            
            // Accordion should be expanded
            expect(header.getAttribute('aria-expanded')).toBe('true');
            expect(content.getAttribute('aria-hidden')).toBe('false');
            expect(content.classList.contains('expanded')).toBe(true);
        });

        test('should handle contact button clicks and emit events', (done) => {
            // Initialize ProductManager
            productManager = new ProductManager();
            productManager.init();
            
            // Get first product card and contact button
            const firstCard = productManager.productCards[0];
            const contactButton = firstCard.element.querySelector('.contact-button.primary');
            
            // Listen for contact event
            window.addEventListener('productContactClick', (event) => {
                expect(event.detail.productId).toBe('domestic-oil-spill-kit');
                expect(event.detail.action).toBe('quote');
                expect(event.detail.cardIndex).toBe(0);
                done();
            });
            
            // Click contact button
            testUtils.simulateClick(contactButton);
        });
    });

    describe('User Interaction Flows', () => {
        beforeEach(() => {
            productManager = new ProductManager();
            productManager.init();
        });

        test('should handle complete product exploration flow', () => {
            // Get first product card
            const card = productManager.productCards[0];
            
            // 1. Card hover interaction
            productManager.triggerCardHover(0, true);
            expect(card.element.style.transform).toContain('translateY(-8px)');
            
            // 2. Expand accordion to view specifications
            const header = card.element.querySelector('.accordion-header');
            testUtils.simulateClick(header);
            
            const content = card.element.querySelector('.accordion-content');
            expect(content.getAttribute('aria-hidden')).toBe('false');
            
            // 3. Collapse accordion
            testUtils.simulateClick(header);
            expect(content.getAttribute('aria-hidden')).toBe('true');
            
            // 4. End hover state
            productManager.triggerCardHover(0, false);
            expect(card.element.style.transform).toContain('translateY(0)');
        });

        test('should handle keyboard navigation flow', () => {
            // Get first product card
            const card = productManager.productCards[0];
            
            // 1. Focus card with keyboard
            card.element.focus();
            productManager.handleCardFocus(card);
            
            expect(card.element.style.outline).toContain('2px solid');
            
            // 2. Navigate to accordion with keyboard
            const header = card.element.querySelector('.accordion-header');
            header.focus();
            
            // 3. Activate accordion with Enter key
            testUtils.simulateKeydown(header, 'Enter');
            
            const content = card.element.querySelector('.accordion-content');
            expect(content.getAttribute('aria-hidden')).toBe('false');
            
            // 4. Blur card to end interaction
            productManager.handleCardBlur(card);
            expect(card.element.style.outline).toBe('');
        });

        test('should handle image gallery interaction flow', () => {
            // Get first product card
            const card = productManager.productCards[0];
            const imageContainer = card.element.querySelector('.product-image-carousel-enhanced');
            
            // Initialize gallery
            const gallery = new ProductImageGallery(imageContainer);
            
            // 1. Navigate to next image
            gallery.nextImage();
            expect(gallery.currentIndex).toBe(1);
            
            // 2. Navigate back to first image
            gallery.previousImage();
            expect(gallery.currentIndex).toBe(0);
            
            // 3. Use keyboard navigation
            imageContainer.focus();
            testUtils.simulateKeydown(imageContainer, 'ArrowRight');
            expect(gallery.currentIndex).toBe(1);
            
            // Cleanup
            gallery.cleanup();
        });

        test('should handle mobile touch interaction flow', () => {
            // Get first product card
            const card = productManager.productCards[0];
            const imageContainer = card.element.querySelector('.product-image-carousel-enhanced');
            
            // Initialize gallery with touch support
            const gallery = new ProductImageGallery(imageContainer, { enableTouch: true });
            
            // 1. Swipe left to next image
            testUtils.simulateTouch(imageContainer, 200, 100);
            expect(gallery.currentIndex).toBe(1);
            
            // 2. Swipe right to previous image
            testUtils.simulateTouch(imageContainer, 100, 200);
            expect(gallery.currentIndex).toBe(0);
            
            // Cleanup
            gallery.cleanup();
        });
    });

    describe('Accessibility Integration', () => {
        beforeEach(() => {
            productManager = new ProductManager();
            productManager.init();
        });

        test('should maintain ARIA attributes across component interactions', () => {
            // Get first product card
            const card = productManager.productCards[0];
            
            // Check initial ARIA attributes
            expect(card.element.getAttribute('role')).toBe('article');
            expect(card.element.getAttribute('aria-label')).toContain('Product:');
            
            // Initialize gallery
            const imageContainer = card.element.querySelector('.product-image-carousel-enhanced');
            const gallery = new ProductImageGallery(imageContainer);
            
            // Check gallery ARIA attributes
            expect(imageContainer.getAttribute('role')).toBe('region');
            expect(imageContainer.getAttribute('aria-label')).toContain('gallery');
            
            // Toggle accordion
            const header = card.element.querySelector('.accordion-header');
            const content = card.element.querySelector('.accordion-content');
            
            testUtils.simulateClick(header);
            
            // Check accordion ARIA attributes after interaction
            expect(header.getAttribute('aria-expanded')).toBe('true');
            expect(content.getAttribute('aria-hidden')).toBe('false');
            
            // Navigate gallery
            gallery.nextImage();
            
            // Check if live region was created for screen readers
            const liveRegion = document.getElementById('gallery-live-region');
            expect(liveRegion).not.toBeNull();
            expect(liveRegion.getAttribute('aria-live')).toBe('polite');
            
            // Cleanup
            gallery.cleanup();
        });

        test('should support keyboard navigation across components', () => {
            // Get first product card
            const card = productManager.productCards[0];
            
            // Initialize gallery
            const imageContainer = card.element.querySelector('.product-image-carousel-enhanced');
            const gallery = new ProductImageGallery(imageContainer, { enableKeyboard: true });
            
            // Focus gallery and use keyboard navigation
            imageContainer.focus();
            testUtils.simulateKeydown(imageContainer, 'ArrowRight');
            expect(gallery.currentIndex).toBe(1);
            
            // Focus accordion header and use keyboard
            const header = card.element.querySelector('.accordion-header');
            header.focus();
            testUtils.simulateKeydown(header, 'Enter');
            
            const content = card.element.querySelector('.accordion-content');
            expect(content.getAttribute('aria-hidden')).toBe('false');
            
            // Focus contact button and use keyboard
            const contactButton = card.element.querySelector('.contact-button');
            contactButton.focus();
            testUtils.simulateKeydown(contactButton, 'Enter');
            
            // Cleanup
            gallery.cleanup();
        });

        test('should handle focus management properly', () => {
            // Get first product card
            const card = productManager.productCards[0];
            
            // Focus card
            card.element.focus();
            productManager.handleCardFocus(card);
            
            expect(card.element.style.outline).toContain('2px solid');
            
            // Tab to accordion header
            const header = card.element.querySelector('.accordion-header');
            document.activeElement = header; // Simulate tab navigation
            
            // Expand accordion with keyboard
            testUtils.simulateKeydown(header, 'Enter');
            
            const content = card.element.querySelector('.accordion-content');
            expect(content.getAttribute('aria-hidden')).toBe('false');
            
            // Tab to contact button
            const contactButton = card.element.querySelector('.contact-button');
            document.activeElement = contactButton; // Simulate tab navigation
            
            // Blur card when tabbing out
            card.element.blur();
            productManager.handleCardBlur(card);
            
            expect(card.element.style.outline).toBe('');
        });
    });

    describe('Error Recovery and Edge Cases', () => {
        test('should recover from component initialization errors', () => {
            // Create error handler to track errors
            const errorHandler = new ErrorHandler();
            const errorSpy = jest.spyOn(errorHandler, 'handleJavaScriptError').mockImplementation();
            
            // Create ProductManager with error handler
            productManager = new ProductManager();
            productManager.errorHandler = errorHandler;
            
            // Mock initialization error
            jest.spyOn(productManager, 'initProductCards').mockImplementation(() => {
                throw new Error('Test initialization error');
            });
            
            // Should not throw when initializing
            expect(() => {
                productManager.init();
            }).not.toThrow();
            
            // Should call error handler
            expect(errorSpy).toHaveBeenCalled();
            
            // Should still be initialized (in fallback mode)
            expect(productManager.isInitialized).toBe(true);
            
            errorSpy.mockRestore();
        });

        test('should handle image loading failures gracefully', () => {
            // Initialize ProductManager
            productManager = new ProductManager();
            productManager.init();
            
            // Get first product card
            const card = productManager.productCards[0];
            const imageContainer = card.element.querySelector('.product-image-carousel-enhanced');
            
            // Initialize gallery
            const gallery = new ProductImageGallery(imageContainer);
            
            // Simulate image load failure
            gallery.handleImageLoadFailure(0);
            
            // Should mark image as failed
            expect(gallery.failedImages.has(0)).toBe(true);
            
            // Should still be able to navigate to other images
            gallery.nextImage();
            expect(gallery.currentIndex).toBe(1);
            
            // Cleanup
            gallery.cleanup();
        });

        test('should handle network connectivity issues', () => {
            // Initialize ProductManager
            productManager = new ProductManager();
            productManager.init();
            
            // Simulate offline state
            const originalOnline = navigator.onLine;
            Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
            
            // Dispatch offline event
            window.dispatchEvent(new Event('offline'));
            
            // Should still be able to interact with components
            const card = productManager.productCards[0];
            const header = card.element.querySelector('.accordion-header');
            
            expect(() => {
                testUtils.simulateClick(header);
            }).not.toThrow();
            
            // Restore online state
            Object.defineProperty(navigator, 'onLine', { value: originalOnline, configurable: true });
            window.dispatchEvent(new Event('online'));
        });

        test('should handle missing DOM elements gracefully', () => {
            // Initialize ProductManager
            productManager = new ProductManager();
            productManager.init();
            
            // Get first product card
            const card = productManager.productCards[0];
            
            // Remove accordion content
            const content = card.element.querySelector('.accordion-content');
            content.remove();
            
            // Should not throw when trying to toggle accordion
            const header = card.element.querySelector('.accordion-header');
            expect(() => {
                testUtils.simulateClick(header);
            }).not.toThrow();
        });
    });

    describe('Performance Under Load', () => {
        test('should handle multiple simultaneous interactions', () => {
            // Initialize ProductManager
            productManager = new ProductManager();
            productManager.init();
            
            // Create array of interaction functions
            const interactions = [];
            
            // Add accordion toggles
            productManager.productCards.forEach(card => {
                const header = card.element.querySelector('.accordion-header');
                if (header) {
                    interactions.push(() => testUtils.simulateClick(header));
                }
            });
            
            // Add contact button clicks
            productManager.productCards.forEach(card => {
                const button = card.element.querySelector('.contact-button');
                if (button) {
                    interactions.push(() => testUtils.simulateClick(button));
                }
            });
            
            // Execute all interactions rapidly
            const { duration } = performanceUtils.measureTime(() => {
                interactions.forEach(interaction => interaction());
            });
            
            // Should handle all interactions within reasonable time
            expect(duration).toBeLessThan(100);
        });

        test('should maintain performance with many product cards', () => {
            // Create many product cards
            for (let i = 0; i < 20; i++) {
                const card = testUtils.createMockProductCard({
                    title: `Product ${i}`,
                    benefits: ['Benefit 1', 'Benefit 2'],
                    accordion: true
                });
                testContainer.querySelector('.product-grid').appendChild(card);
            }
            
            // Measure initialization time
            const { duration } = performanceUtils.measureTime(() => {
                productManager = new ProductManager();
                productManager.init();
            });
            
            // Should initialize within reasonable time
            expect(duration).toBeLessThan(200);
            expect(productManager.productCards.length).toBeGreaterThan(20);
            
            // Measure interaction time for all accordions
            const headers = testContainer.querySelectorAll('.accordion-header');
            
            const { duration: toggleDuration } = performanceUtils.measureTime(() => {
                headers.forEach(header => testUtils.simulateClick(header));
            });
            
            // Should handle all toggles within reasonable time
            expect(toggleDuration).toBeLessThan(200);
        });
    });
});