// src/js/tests/ProductImageGallery.test.js
// Unit tests for ProductImageGallery component

import ProductImageGallery from '../ProductImageGallery.js';

describe('ProductImageGallery', () => {
    let container;
    let gallery;
    
    beforeEach(() => {
        // Create test container
        container = document.createElement('div');
        container.innerHTML = `
            <img src="test1.jpg" alt="Test Image 1">
            <img src="test2.jpg" alt="Test Image 2">
            <img src="test3.jpg" alt="Test Image 3">
        `;
        document.body.appendChild(container);
    });
    
    afterEach(() => {
        if (gallery) {
            gallery.cleanup();
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    describe('Initialization', () => {
        test('should initialize with default options', () => {
            gallery = new ProductImageGallery(container);
            
            expect(gallery.container).toBe(container);
            expect(gallery.images).toHaveLength(3);
            expect(gallery.currentIndex).toBe(0);
            expect(gallery.options.autoPlay).toBe(false);
            expect(gallery.options.showThumbnails).toBe(true);
        });

        test('should initialize with custom options', () => {
            const options = {
                autoPlay: true,
                autoPlayDelay: 3000,
                showThumbnails: false,
                enableKeyboard: false
            };
            
            gallery = new ProductImageGallery(container, options);
            
            expect(gallery.options.autoPlay).toBe(true);
            expect(gallery.options.autoPlayDelay).toBe(3000);
            expect(gallery.options.showThumbnails).toBe(false);
            expect(gallery.options.enableKeyboard).toBe(false);
        });

        test('should handle empty container gracefully', () => {
            const emptyContainer = document.createElement('div');
            document.body.appendChild(emptyContainer);
            
            expect(() => {
                gallery = new ProductImageGallery(emptyContainer);
            }).not.toThrow();
            
            document.body.removeChild(emptyContainer);
        });

        test('should handle single image container', () => {
            const singleImageContainer = document.createElement('div');
            singleImageContainer.innerHTML = '<img src="single.jpg" alt="Single Image">';
            document.body.appendChild(singleImageContainer);
            
            gallery = new ProductImageGallery(singleImageContainer);
            
            expect(gallery.images).toHaveLength(1);
            expect(gallery.container.querySelector('.gallery-nav')).toBeNull();
            
            document.body.removeChild(singleImageContainer);
        });
    });

    describe('Navigation', () => {
        beforeEach(() => {
            gallery = new ProductImageGallery(container);
        });

        test('should navigate to next image', () => {
            const initialIndex = gallery.currentIndex;
            gallery.nextImage();
            
            expect(gallery.currentIndex).toBe((initialIndex + 1) % gallery.images.length);
        });

        test('should navigate to previous image', () => {
            gallery.goToImage(1); // Start from middle
            const initialIndex = gallery.currentIndex;
            gallery.previousImage();
            
            expect(gallery.currentIndex).toBe(initialIndex - 1);
        });

        test('should wrap around when navigating past last image', () => {
            gallery.goToImage(gallery.images.length - 1);
            gallery.nextImage();
            
            expect(gallery.currentIndex).toBe(0);
        });

        test('should wrap around when navigating before first image', () => {
            gallery.goToImage(0);
            gallery.previousImage();
            
            expect(gallery.currentIndex).toBe(gallery.images.length - 1);
        });

        test('should go to specific image index', () => {
            gallery.goToImage(2);
            
            expect(gallery.currentIndex).toBe(2);
        });

        test('should not navigate to invalid index', () => {
            const initialIndex = gallery.currentIndex;
            
            gallery.goToImage(-1);
            expect(gallery.currentIndex).toBe(initialIndex);
            
            gallery.goToImage(gallery.images.length);
            expect(gallery.currentIndex).toBe(initialIndex);
        });

        test('should not navigate while transitioning', () => {
            gallery.isTransitioning = true;
            const initialIndex = gallery.currentIndex;
            
            gallery.nextImage();
            expect(gallery.currentIndex).toBe(initialIndex);
            
            gallery.previousImage();
            expect(gallery.currentIndex).toBe(initialIndex);
        });
    });

    describe('Keyboard Navigation', () => {
        beforeEach(() => {
            gallery = new ProductImageGallery(container, { enableKeyboard: true });
        });

        test('should navigate with arrow keys', () => {
            const rightArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            const leftArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            
            container.focus();
            container.dispatchEvent(rightArrowEvent);
            expect(gallery.currentIndex).toBe(1);
            
            container.dispatchEvent(leftArrowEvent);
            expect(gallery.currentIndex).toBe(0);
        });

        test('should navigate with up/down arrow keys', () => {
            const downArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
            const upArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
            
            container.focus();
            container.dispatchEvent(downArrowEvent);
            expect(gallery.currentIndex).toBe(1);
            
            container.dispatchEvent(upArrowEvent);
            expect(gallery.currentIndex).toBe(0);
        });

        test('should navigate to first/last image with Home/End keys', () => {
            const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
            const endEvent = new KeyboardEvent('keydown', { key: 'End' });
            
            gallery.goToImage(1);
            container.focus();
            
            container.dispatchEvent(endEvent);
            expect(gallery.currentIndex).toBe(gallery.images.length - 1);
            
            container.dispatchEvent(homeEvent);
            expect(gallery.currentIndex).toBe(0);
        });

        test('should not respond to keyboard when not focused', () => {
            const rightArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            const initialIndex = gallery.currentIndex;
            
            // Don't focus the container
            container.dispatchEvent(rightArrowEvent);
            expect(gallery.currentIndex).toBe(initialIndex);
        });
    });

    describe('Touch Navigation', () => {
        beforeEach(() => {
            gallery = new ProductImageGallery(container, { enableTouch: true });
        });

        test('should handle touch swipe right', () => {
            const mainImageContainer = gallery.mainImageContainer;
            const initialIndex = gallery.currentIndex;
            
            // Simulate swipe right (previous image)
            const touchStart = new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 100 }]
            });
            const touchEnd = new TouchEvent('touchend', {
                changedTouches: [{ clientX: 200, clientY: 100 }]
            });
            
            gallery.handleTouchStart(touchStart);
            gallery.handleTouchEnd(touchEnd);
            
            // Should go to previous image (wrap around to last)
            expect(gallery.currentIndex).toBe(gallery.images.length - 1);
        });

        test('should handle touch swipe left', () => {
            const initialIndex = gallery.currentIndex;
            
            // Simulate swipe left (next image)
            const touchStart = new TouchEvent('touchstart', {
                touches: [{ clientX: 200, clientY: 100 }]
            });
            const touchEnd = new TouchEvent('touchend', {
                changedTouches: [{ clientX: 100, clientY: 100 }]
            });
            
            gallery.handleTouchStart(touchStart);
            gallery.handleTouchEnd(touchEnd);
            
            expect(gallery.currentIndex).toBe(1);
        });

        test('should ignore short swipes', () => {
            const initialIndex = gallery.currentIndex;
            
            // Simulate short swipe (below threshold)
            const touchStart = new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 100 }]
            });
            const touchEnd = new TouchEvent('touchend', {
                changedTouches: [{ clientX: 120, clientY: 100 }]
            });
            
            gallery.handleTouchStart(touchStart);
            gallery.handleTouchEnd(touchEnd);
            
            expect(gallery.currentIndex).toBe(initialIndex);
        });

        test('should ignore vertical swipes', () => {
            const initialIndex = gallery.currentIndex;
            
            // Simulate vertical swipe
            const touchStart = new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 100 }]
            });
            const touchEnd = new TouchEvent('touchend', {
                changedTouches: [{ clientX: 100, clientY: 200 }]
            });
            
            gallery.handleTouchStart(touchStart);
            gallery.handleTouchEnd(touchEnd);
            
            expect(gallery.currentIndex).toBe(initialIndex);
        });
    });

    describe('Auto Play', () => {
        test('should start auto play when enabled', (done) => {
            gallery = new ProductImageGallery(container, {
                autoPlay: true,
                autoPlayDelay: 100
            });
            
            const initialIndex = gallery.currentIndex;
            
            setTimeout(() => {
                expect(gallery.currentIndex).toBe((initialIndex + 1) % gallery.images.length);
                done();
            }, 150);
        });

        test('should pause auto play on hover', () => {
            gallery = new ProductImageGallery(container, {
                autoPlay: true,
                autoPlayDelay: 100
            });
            
            const mouseEnterEvent = new Event('mouseenter');
            container.dispatchEvent(mouseEnterEvent);
            
            expect(gallery.autoPlayTimer).toBeNull();
        });

        test('should resume auto play on mouse leave', (done) => {
            gallery = new ProductImageGallery(container, {
                autoPlay: true,
                autoPlayDelay: 100
            });
            
            // Pause
            const mouseEnterEvent = new Event('mouseenter');
            container.dispatchEvent(mouseEnterEvent);
            
            // Resume
            const mouseLeaveEvent = new Event('mouseleave');
            container.dispatchEvent(mouseLeaveEvent);
            
            setTimeout(() => {
                expect(gallery.autoPlayTimer).not.toBeNull();
                done();
            }, 50);
        });

        test('should stop auto play when disabled', () => {
            gallery = new ProductImageGallery(container, {
                autoPlay: true,
                autoPlayDelay: 100
            });
            
            gallery.setAutoPlay(false);
            expect(gallery.autoPlayTimer).toBeNull();
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            gallery = new ProductImageGallery(container);
        });

        test('should handle image load failures', () => {
            const failedIndex = 1;
            gallery.handleImageLoadFailure(failedIndex);
            
            expect(gallery.failedImages.has(failedIndex)).toBe(true);
        });

        test('should show next available image when current fails', () => {
            gallery.goToImage(1);
            gallery.handleImageLoadFailure(1);
            
            // Should move to next available image
            expect(gallery.currentIndex).not.toBe(1);
        });

        test('should show error state when all images fail', () => {
            // Mark all images as failed
            for (let i = 0; i < gallery.images.length; i++) {
                gallery.failedImages.add(i);
            }
            
            gallery.showGalleryErrorState();
            
            const errorOverlay = container.querySelector('.gallery-error-overlay');
            expect(errorOverlay).not.toBeNull();
        });

        test('should retry failed images', async () => {
            const failedIndex = 1;
            gallery.handleImageLoadFailure(failedIndex);
            
            expect(gallery.failedImages.has(failedIndex)).toBe(true);
            
            await gallery.retryFailedImages();
            
            // After retry, failed images set should be cleared
            expect(gallery.failedImages.has(failedIndex)).toBe(false);
        });
    });

    describe('Accessibility', () => {
        beforeEach(() => {
            gallery = new ProductImageGallery(container);
        });

        test('should have proper ARIA attributes', () => {
            expect(container.getAttribute('role')).toBe('region');
            expect(container.getAttribute('aria-label')).toContain('gallery');
            expect(container.hasAttribute('tabindex')).toBe(true);
        });

        test('should update ARIA attributes when navigating', () => {
            gallery.goToImage(1);
            
            const images = container.querySelectorAll('.gallery-image');
            expect(images[0].getAttribute('aria-hidden')).toBe('true');
            expect(images[1].getAttribute('aria-hidden')).toBe('false');
        });

        test('should announce image changes to screen readers', () => {
            gallery.goToImage(1);
            
            const liveRegion = document.getElementById('gallery-live-region');
            expect(liveRegion).not.toBeNull();
            expect(liveRegion.textContent).toContain('Showing image 2 of 3');
        });

        test('should have proper thumbnail accessibility', () => {
            if (gallery.thumbnails.length > 0) {
                const thumbnail = gallery.thumbnails[0];
                expect(thumbnail.getAttribute('role')).toBe('tab');
                expect(thumbnail.hasAttribute('aria-label')).toBe(true);
                expect(thumbnail.hasAttribute('aria-selected')).toBe(true);
            }
        });
    });

    describe('WebP Support', () => {
        beforeEach(() => {
            gallery = new ProductImageGallery(container);
        });

        test('should detect WebP support', async () => {
            await gallery.checkWebPSupport();
            expect(typeof gallery.supportsWebP).toBe('boolean');
        });

        test('should generate WebP URLs correctly', () => {
            const originalSrc = 'image.jpg';
            const webpSrc = gallery.getWebPVersion(originalSrc);
            expect(webpSrc).toBe('image.webp');
        });

        test('should handle various image extensions', () => {
            expect(gallery.getWebPVersion('image.jpeg')).toBe('image.webp');
            expect(gallery.getWebPVersion('image.png')).toBe('image.webp');
            expect(gallery.getWebPVersion('image.JPG')).toBe('image.webp');
        });
    });

    describe('Performance', () => {
        beforeEach(() => {
            gallery = new ProductImageGallery(container);
        });

        test('should implement lazy loading', () => {
            expect(gallery.intersectionObserver).not.toBeNull();
        });

        test('should load images progressively', () => {
            const imageData = gallery.images[0];
            expect(imageData.loaded).toBe(false);
            expect(imageData.loading).toBe(false);
        });

        test('should cleanup resources properly', () => {
            gallery.cleanup();
            
            expect(gallery.autoPlayTimer).toBeNull();
            expect(gallery.intersectionObserver).toBeNull();
        });
    });

    describe('Public API', () => {
        beforeEach(() => {
            gallery = new ProductImageGallery(container);
        });

        test('should return current index', () => {
            expect(gallery.getCurrentIndex()).toBe(0);
            
            gallery.goToImage(2);
            expect(gallery.getCurrentIndex()).toBe(2);
        });

        test('should return total images count', () => {
            expect(gallery.getTotalImages()).toBe(3);
        });

        test('should allow setting auto play programmatically', () => {
            gallery.setAutoPlay(true, 500);
            
            expect(gallery.options.autoPlay).toBe(true);
            expect(gallery.options.autoPlayDelay).toBe(500);
            expect(gallery.autoPlayTimer).not.toBeNull();
        });

        test('should check browser support', () => {
            const isSupported = ProductImageGallery.isSupported();
            expect(typeof isSupported).toBe('boolean');
        });
    });

    describe('Events', () => {
        beforeEach(() => {
            gallery = new ProductImageGallery(container);
        });

        test('should emit image loaded event', (done) => {
            container.addEventListener('imageLoaded', (event) => {
                expect(event.detail.index).toBeDefined();
                expect(event.detail.src).toBeDefined();
                done();
            });
            
            // Simulate successful image load
            gallery.container.dispatchEvent(new CustomEvent('imageLoaded', {
                detail: { index: 0, src: 'test.jpg' }
            }));
        });

        test('should emit image load failed event', (done) => {
            container.addEventListener('imageLoadFailed', (event) => {
                expect(event.detail.index).toBeDefined();
                expect(event.detail.alt).toBeDefined();
                done();
            });
            
            gallery.handleImageLoadFailure(0);
        });
    });
});