// src/js/tests/performance.test.js
// Performance tests for product page components

import ProductImageGallery from '../ProductImageGallery.js';
import ProductManager from '../ProductManager.js';
import PerformanceManager from '../PerformanceManager.js';

describe('Performance Tests', () => {
    let testContainer;
    
    beforeEach(() => {
        testContainer = document.createElement('div');
        document.body.appendChild(testContainer);
    });
    
    afterEach(() => {
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }
    });

    describe('Component Initialization Performance', () => {
        test('ProductImageGallery should initialize within performance budget', () => {
            // Create test images
            testContainer.innerHTML = Array.from({ length: 10 }, (_, i) => 
                `<img src="test${i}.jpg" alt="Test Image ${i}">`
            ).join('');
            
            const { duration } = performanceUtils.measureTime(() => {
                const gallery = new ProductImageGallery(testContainer);
                gallery.cleanup();
            });
            
            // Should initialize within 100ms
            expect(duration).toBeLessThan(100);
        });

        test('ProductManager should initialize within performance budget', () => {
            // Create multiple product cards
            testContainer.innerHTML = Array.from({ length: 20 }, (_, i) => `
                <div class="product-card-enhanced">
                    <div class="product-image-carousel-enhanced">
                        <img src="test${i}.jpg" alt="Product ${i}">
                    </div>
                    <div class="product-info-enhanced">
                        <h3>Product ${i}</h3>
                    </div>
                    <button class="contact-button primary">Contact</button>
                </div>
            `).join('');
            
            const { duration } = performanceUtils.measureTime(() => {
                const manager = new ProductManager();
                manager.init();
                manager.cleanup();
            });
            
            // Should initialize within 200ms for 20 cards
            expect(duration).toBeLessThan(200);
        });

        test('PerformanceManager should initialize within performance budget', async () => {
            const { duration } = await performanceUtils.measureAsyncTime(async () => {
                const perfManager = new PerformanceManager();
                await perfManager.init();
                perfManager.cleanup();
            });
            
            // Should initialize within 150ms
            expect(duration).toBeLessThan(150);
        });
    });

    describe('Memory Usage', () => {
        test('ProductImageGallery should not leak memory', () => {
            const initialMemory = performance.memory.usedJSHeapSize;
            const galleries = [];
            
            // Create and destroy multiple galleries
            for (let i = 0; i < 10; i++) {
                const container = document.createElement('div');
                container.innerHTML = `<img src="test${i}.jpg" alt="Test ${i}">`;
                document.body.appendChild(container);
                
                const gallery = new ProductImageGallery(container);
                galleries.push({ gallery, container });
            }
            
            // Cleanup all galleries
            galleries.forEach(({ gallery, container }) => {
                gallery.cleanup();
                container.remove();
            });
            
            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }
            
            const finalMemory = performance.memory.usedJSHeapSize;
            const memoryIncrease = finalMemory - initialMemory;
            
            // Memory increase should be minimal (less than 1MB)
            expect(memoryIncrease).toBeLessThan(1024 * 1024);
        });

        test('ProductManager should cleanup event listeners properly', () => {
            testContainer.innerHTML = Array.from({ length: 5 }, (_, i) => `
                <div class="product-card-enhanced">
                    <div class="product-specs-accordion">
                        <div class="accordion-item">
                            <button class="accordion-header">Header ${i}</button>
                            <div class="accordion-content">Content ${i}</div>
                        </div>
                    </div>
                    <button class="contact-button primary">Contact ${i}</button>
                </div>
            `).join('');
            
            const manager = new ProductManager();
            manager.init();
            
            const initialListenerCount = manager.eventListeners.size;
            expect(initialListenerCount).toBeGreaterThan(0);
            
            manager.cleanup();
            
            expect(manager.eventListeners.size).toBe(0);
        });
    });

    describe('Rendering Performance', () => {
        test('Image gallery transitions should be smooth', (done) => {
            testContainer.innerHTML = Array.from({ length: 5 }, (_, i) => 
                `<img src="test${i}.jpg" alt="Test Image ${i}">`
            ).join('');
            
            const gallery = new ProductImageGallery(testContainer);
            
            const transitionTimes = [];
            let transitionCount = 0;
            const maxTransitions = 3;
            
            const measureTransition = () => {
                const startTime = performance.now();
                
                gallery.nextImage();
                
                // Wait for transition to complete
                setTimeout(() => {
                    const endTime = performance.now();
                    transitionTimes.push(endTime - startTime);
                    transitionCount++;
                    
                    if (transitionCount < maxTransitions) {
                        measureTransition();
                    } else {
                        // All transitions should complete within reasonable time
                        const avgTransitionTime = transitionTimes.reduce((a, b) => a + b) / transitionTimes.length;
                        expect(avgTransitionTime).toBeLessThan(1000); // Less than 1 second
                        
                        gallery.cleanup();
                        done();
                    }
                }, gallery.options.transitionDuration * 1000 + 100);
            };
            
            measureTransition();
        });

        test('Accordion animations should not block UI', () => {
            testContainer.innerHTML = `
                <div class="product-card-enhanced">
                    <div class="product-specs-accordion">
                        ${Array.from({ length: 10 }, (_, i) => `
                            <div class="accordion-item">
                                <button class="accordion-header" aria-expanded="false">
                                    Header ${i}
                                    <span class="accordion-icon">+</span>
                                </button>
                                <div class="accordion-content" aria-hidden="true">
                                    <p>Content ${i} with lots of text to make it substantial...</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
            
            const manager = new ProductManager();
            manager.init();
            
            const card = manager.productCards[0];
            const headers = card.element.querySelectorAll('.accordion-header');
            
            // Measure time to toggle all accordions
            const { duration } = performanceUtils.measureTime(() => {
                headers.forEach(header => {
                    const content = header.nextElementSibling;
                    const icon = header.querySelector('.accordion-icon');
                    manager.toggleAccordionItem(header, content, icon, card);
                });
            });
            
            // Should complete all toggles within 50ms
            expect(duration).toBeLessThan(50);
            
            manager.cleanup();
        });
    });

    describe('Network Performance', () => {
        test('Image loading should handle concurrent requests efficiently', async () => {
            const imageUrls = Array.from({ length: 10 }, (_, i) => `test${i}.jpg`);
            
            testContainer.innerHTML = imageUrls.map(url => 
                `<img src="${url}" alt="Test Image">`
            ).join('');
            
            const gallery = new ProductImageGallery(testContainer);
            
            const { duration } = await performanceUtils.measureAsyncTime(async () => {
                // Simulate loading all images
                const loadPromises = gallery.images.map((_, index) => 
                    gallery.loadImageWithProgression(index)
                );
                
                await Promise.all(loadPromises);
            });
            
            // Should load all images within reasonable time
            expect(duration).toBeLessThan(2000); // 2 seconds for 10 images
            
            gallery.cleanup();
        });

        test('Error handling should not impact performance significantly', async () => {
            testContainer.innerHTML = Array.from({ length: 5 }, (_, i) => 
                `<img src="invalid${i}.jpg" alt="Invalid Image ${i}">`
            ).join('');
            
            const gallery = new ProductImageGallery(testContainer);
            
            const { duration } = await performanceUtils.measureAsyncTime(async () => {
                // Try to load all images (they will fail)
                const loadPromises = gallery.images.map((_, index) => 
                    gallery.loadImageWithProgression(index).catch(() => {})
                );
                
                await Promise.all(loadPromises);
            });
            
            // Error handling should not add significant overhead
            expect(duration).toBeLessThan(1000);
            
            gallery.cleanup();
        });
    });

    describe('Scalability', () => {
        test('should handle large number of product cards efficiently', () => {
            const cardCount = 100;
            
            testContainer.innerHTML = Array.from({ length: cardCount }, (_, i) => `
                <div class="product-card-enhanced">
                    <div class="product-image-carousel-enhanced">
                        <img src="test${i}.jpg" alt="Product ${i}">
                    </div>
                    <div class="product-info-enhanced">
                        <h3>Product ${i}</h3>
                        <div class="key-benefit-item">Benefit 1</div>
                        <div class="key-benefit-item">Benefit 2</div>
                    </div>
                    <div class="product-specs-accordion">
                        <div class="accordion-item">
                            <button class="accordion-header">Specs</button>
                            <div class="accordion-content">Content</div>
                        </div>
                    </div>
                    <button class="contact-button primary">Contact</button>
                </div>
            `).join('');
            
            const { duration } = performanceUtils.measureTime(() => {
                const manager = new ProductManager();
                manager.init();
                manager.cleanup();
            });
            
            // Should handle 100 cards within 500ms
            expect(duration).toBeLessThan(500);
        });

        test('should maintain performance with complex interactions', () => {
            testContainer.innerHTML = Array.from({ length: 20 }, (_, i) => `
                <div class="product-card-enhanced">
                    <div class="product-image-carousel-enhanced">
                        ${Array.from({ length: 5 }, (_, j) => 
                            `<img src="test${i}-${j}.jpg" alt="Product ${i} Image ${j}">`
                        ).join('')}
                    </div>
                    <div class="product-specs-accordion">
                        ${Array.from({ length: 3 }, (_, k) => `
                            <div class="accordion-item">
                                <button class="accordion-header">Section ${k}</button>
                                <div class="accordion-content">Content ${k}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
            
            const manager = new ProductManager();
            manager.init();
            
            // Simulate complex user interactions
            const { duration } = performanceUtils.measureTime(() => {
                manager.productCards.forEach((card, cardIndex) => {
                    // Simulate gallery interactions
                    const imageContainer = card.element.querySelector('.product-image-carousel-enhanced');
                    if (imageContainer) {
                        const gallery = new ProductImageGallery(imageContainer);
                        gallery.nextImage();
                        gallery.previousImage();
                        gallery.cleanup();
                    }
                    
                    // Simulate accordion interactions
                    const headers = card.element.querySelectorAll('.accordion-header');
                    headers.forEach(header => {
                        const content = header.nextElementSibling;
                        const icon = header.querySelector('.accordion-icon');
                        manager.toggleAccordionItem(header, content, icon, card);
                    });
                });
            });
            
            // Complex interactions should complete within 1 second
            expect(duration).toBeLessThan(1000);
            
            manager.cleanup();
        });
    });

    describe('Core Web Vitals', () => {
        test('should meet Largest Contentful Paint (LCP) requirements', async () => {
            // Simulate LCP measurement
            const lcpStart = performance.now();
            
            testContainer.innerHTML = `
                <div class="product-card-enhanced">
                    <div class="product-image-carousel-enhanced">
                        <img src="large-hero-image.jpg" alt="Hero Product Image" style="width: 800px; height: 600px;">
                    </div>
                </div>
            `;
            
            const manager = new ProductManager();
            manager.init();
            
            // Simulate image load completion
            const img = testContainer.querySelector('img');
            img.onload();
            
            const lcpTime = performance.now() - lcpStart;
            
            // LCP should be under 2.5 seconds (2500ms)
            expect(lcpTime).toBeLessThan(2500);
            
            manager.cleanup();
        });

        test('should meet First Input Delay (FID) requirements', () => {
            testContainer.innerHTML = `
                <div class="product-card-enhanced">
                    <button class="contact-button primary">Contact Us</button>
                </div>
            `;
            
            const manager = new ProductManager();
            manager.init();
            
            const button = testContainer.querySelector('.contact-button');
            
            // Measure input delay
            const inputStart = performance.now();
            
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true
            });
            
            button.dispatchEvent(clickEvent);
            
            const inputDelay = performance.now() - inputStart;
            
            // FID should be under 100ms
            expect(inputDelay).toBeLessThan(100);
            
            manager.cleanup();
        });

        test('should minimize Cumulative Layout Shift (CLS)', () => {
            // Create elements that might cause layout shift
            testContainer.innerHTML = `
                <div class="product-card-enhanced">
                    <div class="product-image-carousel-enhanced">
                        <img src="test.jpg" alt="Test" style="width: 300px; height: 200px;">
                    </div>
                    <div class="product-specs-accordion">
                        <div class="accordion-item">
                            <button class="accordion-header">Specifications</button>
                            <div class="accordion-content">
                                <p>Content that might cause layout shift</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            const manager = new ProductManager();
            manager.init();
            
            const card = manager.productCards[0];
            const header = card.element.querySelector('.accordion-header');
            const content = card.element.querySelector('.accordion-content');
            const icon = header.querySelector('.accordion-icon');
            
            // Measure layout before and after accordion toggle
            const initialRect = testContainer.getBoundingClientRect();
            
            manager.toggleAccordionItem(header, content, icon, card);
            
            const finalRect = testContainer.getBoundingClientRect();
            
            // Layout shift should be minimal
            const layoutShift = Math.abs(finalRect.height - initialRect.height) / initialRect.height;
            expect(layoutShift).toBeLessThan(0.1); // CLS threshold
            
            manager.cleanup();
        });
    });

    describe('Resource Optimization', () => {
        test('should lazy load images efficiently', () => {
            testContainer.innerHTML = Array.from({ length: 20 }, (_, i) => 
                `<img src="test${i}.jpg" alt="Test Image ${i}" loading="lazy">`
            ).join('');
            
            const gallery = new ProductImageGallery(testContainer);
            
            // Initially, only first few images should be loaded
            const loadedImages = gallery.images.filter(img => img.loaded);
            expect(loadedImages.length).toBeLessThan(gallery.images.length);
            
            gallery.cleanup();
        });

        test('should optimize WebP usage', async () => {
            testContainer.innerHTML = `<img src="test.jpg" alt="Test Image">`;
            
            const gallery = new ProductImageGallery(testContainer);
            
            await gallery.checkWebPSupport();
            
            const webpUrl = gallery.getWebPVersion('test.jpg');
            expect(webpUrl).toBe('test.webp');
            
            gallery.cleanup();
        });
    });
});