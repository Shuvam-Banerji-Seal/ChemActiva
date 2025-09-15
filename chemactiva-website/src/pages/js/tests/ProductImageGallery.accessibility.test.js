// src/js/tests/ProductImageGallery.accessibility.test.js
// Accessibility and mobile interaction tests for ProductImageGallery component

import ProductImageGallery from '../ProductImageGallery.js';

describe('ProductImageGallery Accessibility and Mobile Tests', () => {
    let container;
    let gallery;
    
    beforeEach(() => {
        // Create test container with multiple images
        container = document.createElement('div');
        container.innerHTML = `
            <img src="test1.jpg" alt="Test Product Image 1">
            <img src="test2.jpg" alt="Test Product Image 2">
            <img src="test3.jpg" alt="Test Product Image 3">
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

    describe('Accessibility Features', () => {
        test('should have proper ARIA attributes for screen readers', () => {
            gallery = new ProductImageGallery(container);
            
            // Check main container attributes
            expect(container.getAttribute('role')).toBe('region');
            expect(container.getAttribute('aria-label')).toContain('gallery');
            expect(container.hasAttribute('tabindex')).toBe(true);
            
            // Check main image container attributes
            const mainImageContainer = container.querySelector('.gallery-main-image');
            expect(mainImageContainer).not.toBeNull();
            expect(mainImageContainer.getAttribute('role')).toBe('img');
            expect(mainImageContainer.getAttribute('aria-live')).toBe('polite');
            
            // Check navigation buttons
            const prevButton = container.querySelector('.gallery-prev');
            const nextButton = container.querySelector('.gallery-next');
            expect(prevButton.getAttribute('aria-label')).toBe('Previous image');
            expect(nextButton.getAttribute('aria-label')).toBe('Next image');
        });

        test('should announce image changes to screen readers', () => {
            gallery = new ProductImageGallery(container);
            
            // Navigate to next image
            gallery.nextImage();
            
            // Check if live region was created and has appropriate content
            const liveRegion = document.getElementById('gallery-live-region');
            expect(liveRegion).not.toBeNull();
            expect(liveRegion.getAttribute('aria-live')).toBe('polite');
            expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
            expect(liveRegion.textContent).toContain('Showing image 2 of 3');
        });

        test('should support keyboard navigation', () => {
            gallery = new ProductImageGallery(container, { enableKeyboard: true });
            
            // Focus the container
            container.focus();
            
            // Test right arrow key
            const rightArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowRight' });
            container.dispatchEvent(rightArrowEvent);
            expect(gallery.currentIndex).toBe(1);
            
            // Test left arrow key
            const leftArrowEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
            container.dispatchEvent(leftArrowEvent);
            expect(gallery.currentIndex).toBe(0);
            
            // Test Home key (first image)
            gallery.goToImage(1);
            const homeEvent = new KeyboardEvent('keydown', { key: 'Home' });
            container.dispatchEvent(homeEvent);
            expect(gallery.currentIndex).toBe(0);
            
            // Test End key (last image)
            const endEvent = new KeyboardEvent('keydown', { key: 'End' });
            container.dispatchEvent(endEvent);
            expect(gallery.currentIndex).toBe(gallery.images.length - 1);
        });

        test('should make thumbnails accessible with proper ARIA attributes', () => {
            gallery = new ProductImageGallery(container, { showThumbnails: true });
            
            // Check thumbnail container
            const thumbnailContainer = container.querySelector('.gallery-thumbnails');
            expect(thumbnailContainer).not.toBeNull();
            expect(thumbnailContainer.getAttribute('role')).toBe('tablist');
            
            // Check individual thumbnails
            const thumbnails = thumbnailContainer.querySelectorAll('.gallery-thumbnail');
            expect(thumbnails.length).toBe(3);
            
            thumbnails.forEach((thumbnail, index) => {
                expect(thumbnail.getAttribute('role')).toBe('tab');
                expect(thumbnail.getAttribute('aria-selected')).toBe(index === 0 ? 'true' : 'false');
                expect(thumbnail.getAttribute('aria-label')).toContain(`View image ${index + 1}`);
            });
        });

        test('should handle keyboard navigation on thumbnails', () => {
            gallery = new ProductImageGallery(container, { 
                showThumbnails: true,
                enableKeyboard: true 
            });
            
            const thumbnails = container.querySelectorAll('.gallery-thumbnail');
            const secondThumbnail = thumbnails[1];
            
            // Focus the thumbnail
            secondThumbnail.focus();
            
            // Test Enter key on thumbnail
            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            secondThumbnail.dispatchEvent(enterEvent);
            
            // Should navigate to the corresponding image
            expect(gallery.currentIndex).toBe(1);
            expect(secondThumbnail.getAttribute('aria-selected')).toBe('true');
        });
    });

    describe('Mobile Touch Interactions', () => {
        test('should handle left swipe gesture to navigate forward', () => {
            gallery = new ProductImageGallery(container, { enableTouch: true });
            
            // Initial state
            expect(gallery.currentIndex).toBe(0);
            
            // Simulate left swipe (next image)
            const touchStartEvent = new TouchEvent('touchstart', {
                touches: [{ clientX: 200, clientY: 100 }]
            });
            
            const touchEndEvent = new TouchEvent('touchend', {
                changedTouches: [{ clientX: 100, clientY: 100 }]
            });
            
            gallery.handleTouchStart(touchStartEvent);
            gallery.handleTouchEnd(touchEndEvent);
            
            // Should navigate to next image
            expect(gallery.currentIndex).toBe(1);
        });

        test('should handle right swipe gesture to navigate backward', () => {
            gallery = new ProductImageGallery(container, { enableTouch: true });
            
            // Navigate to second image first
            gallery.goToImage(1);
            expect(gallery.currentIndex).toBe(1);
            
            // Simulate right swipe (previous image)
            const touchStartEvent = new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 100 }]
            });
            
            const touchEndEvent = new TouchEvent('touchend', {
                changedTouches: [{ clientX: 200, clientY: 100 }]
            });
            
            gallery.handleTouchStart(touchStartEvent);
            gallery.handleTouchEnd(touchEndEvent);
            
            // Should navigate to previous image
            expect(gallery.currentIndex).toBe(0);
        });

        test('should ignore vertical swipes', () => {
            gallery = new ProductImageGallery(container, { enableTouch: true });
            
            // Initial state
            expect(gallery.currentIndex).toBe(0);
            
            // Simulate vertical swipe
            const touchStartEvent = new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 100 }]
            });
            
            const touchEndEvent = new TouchEvent('touchend', {
                changedTouches: [{ clientX: 100, clientY: 200 }]
            });
            
            gallery.handleTouchStart(touchStartEvent);
            gallery.handleTouchEnd(touchEndEvent);
            
            // Should not change the current image
            expect(gallery.currentIndex).toBe(0);
        });

        test('should ignore swipes that are too short', () => {
            gallery = new ProductImageGallery(container, { enableTouch: true });
            
            // Initial state
            expect(gallery.currentIndex).toBe(0);
            
            // Simulate short swipe (less than minSwipeDistance)
            const touchStartEvent = new TouchEvent('touchstart', {
                touches: [{ clientX: 100, clientY: 100 }]
            });
            
            const touchEndEvent = new TouchEvent('touchend', {
                changedTouches: [{ clientX: 120, clientY: 100 }]
            });
            
            gallery.handleTouchStart(touchStartEvent);
            gallery.handleTouchEnd(touchEndEvent);
            
            // Should not change the current image
            expect(gallery.currentIndex).toBe(0);
        });

        test('should pause autoplay during touch interaction', () => {
            gallery = new ProductImageGallery(container, { 
                autoPlay: true,
                autoPlayDelay: 100,
                enableTouch: true 
            });
            
            // Verify autoplay is active
            expect(gallery.autoPlayTimer).not.toBeNull();
            
            // Simulate touch start
            const touchStartEvent = new TouchEvent('touchstart', {
                touches: [{ clientX: 200, clientY: 100 }]
            });
            
            gallery.handleTouchStart(touchStartEvent);
            
            // Autoplay should be paused
            expect(gallery.autoPlayTimer).toBeNull();
        });

        test('should resume autoplay after touch interaction if enabled', (done) => {
            gallery = new ProductImageGallery(container, { 
                autoPlay: true,
                autoPlayDelay: 100,
                enableTouch: true 
            });
            
            // Simulate touch interaction
            const touchStartEvent = new TouchEvent('touchstart', {
                touches: [{ clientX: 200, clientY: 100 }]
            });
            
            const touchEndEvent = new TouchEvent('touchend', {
                changedTouches: [{ clientX: 100, clientY: 100 }]
            });
            
            gallery.handleTouchStart(touchStartEvent);
            gallery.handleTouchEnd(touchEndEvent);
            
            // Check if autoplay resumes after touch
            setTimeout(() => {
                expect(gallery.autoPlayTimer).not.toBeNull();
                done();
            }, 1100); // Wait for autoplay to resume
        });
    });

    describe('Error Handling and Fallbacks', () => {
        test('should handle image load failures gracefully', () => {
            gallery = new ProductImageGallery(container);
            
            // Simulate image load failure
            gallery.handleImageLoadFailure(0);
            
            // Should mark the image as failed
            expect(gallery.failedImages.has(0)).toBe(true);
            
            // Should emit an event
            const eventSpy = jest.fn();
            container.addEventListener('imageLoadFailed', eventSpy);
            
            gallery.handleImageLoadFailure(1);
            
            expect(eventSpy).toHaveBeenCalled();
            expect(eventSpy.mock.calls[0][0].detail.index).toBe(1);
        });

        test('should show next available image when current image fails', () => {
            gallery = new ProductImageGallery(container);
            
            // Go to first image
            gallery.goToImage(0);
            
            // Simulate failure of current image
            gallery.handleImageLoadFailure(0);
            
            // Should automatically move to next available image
            expect(gallery.currentIndex).not.toBe(0);
        });

        test('should show error state when all images fail', () => {
            gallery = new ProductImageGallery(container);
            
            // Mark all images as failed
            gallery.images.forEach((_, index) => {
                gallery.handleImageLoadFailure(index);
            });
            
            // Should show error overlay
            gallery.showGalleryErrorState();
            
            const errorOverlay = container.querySelector('.gallery-error-overlay');
            expect(errorOverlay).not.toBeNull();
            expect(errorOverlay.querySelector('h3').textContent).toContain('Images Unavailable');
            expect(errorOverlay.querySelector('button.retry-button')).not.toBeNull();
        });

        test('should retry loading failed images', async () => {
            gallery = new ProductImageGallery(container);
            
            // Mark some images as failed
            gallery.handleImageLoadFailure(0);
            gallery.handleImageLoadFailure(1);
            
            expect(gallery.failedImages.size).toBe(2);
            
            // Mock the loadImageWithProgression method
            const loadSpy = jest.spyOn(gallery, 'loadImageWithProgression').mockResolvedValue();
            
            // Retry loading
            await gallery.retryFailedImages();
            
            // Should clear failed images set
            expect(gallery.failedImages.size).toBe(0);
            
            // Should attempt to reload each failed image
            expect(loadSpy).toHaveBeenCalledTimes(2);
            
            // Restore the original method
            loadSpy.mockRestore();
        });
    });
});