// src/js/ProductImageGallery.js
// Enhanced with comprehensive error handling and fallbacks
import ErrorHandler from './ErrorHandler.js';

export default class ProductImageGallery {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            autoPlay: options.autoPlay || false,
            autoPlayDelay: options.autoPlayDelay || 5000,
            showThumbnails: options.showThumbnails !== false,
            enableKeyboard: options.enableKeyboard !== false,
            enableTouch: options.enableTouch !== false,
            transitionDuration: options.transitionDuration || 0.6,
            ...options
        };

        this.images = [];
        this.thumbnails = [];
        this.currentIndex = 0;
        this.isTransitioning = false;
        this.autoPlayTimer = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.minSwipeDistance = 50;
        this.intersectionObserver = null;
        this.supportsWebP = null;
        this.errorHandler = new ErrorHandler();
        this.failedImages = new Set();
        this.retryAttempts = new Map();

        this.init();
    }

    async init() {
        // Check WebP support
        await this.checkWebPSupport();
        
        this.setupGalleryStructure();
        this.setupLazyLoading();
        this.bindEvents();
        this.setupKeyboardNavigation();
        this.setupTouchNavigation();
        
        if (this.options.autoPlay && this.images.length > 1) {
            this.startAutoPlay();
        }
    }

    setupGalleryStructure() {
        // Get all images from the container
        const existingImages = this.container.querySelectorAll('img');
        
        if (existingImages.length === 0) {
            console.warn('ProductImageGallery: No images found in container');
            return;
        }

        // Store image data with WebP optimization
        existingImages.forEach((img, index) => {
            const originalSrc = img.src;
            const webpSrc = this.getWebPVersion(originalSrc);
            
            this.images.push({
                element: img,
                src: originalSrc,
                webp: webpSrc,
                alt: img.alt || `Product image ${index + 1}`,
                loaded: false,
                loading: false
            });
        });

        // Only setup gallery if there are multiple images
        if (this.images.length <= 1) {
            return;
        }

        // Clear container and rebuild structure
        this.container.innerHTML = '';
        this.container.classList.add('product-image-gallery');

        // Create main image container
        this.mainImageContainer = document.createElement('div');
        this.mainImageContainer.className = 'gallery-main-image';
        this.mainImageContainer.setAttribute('role', 'img');
        this.mainImageContainer.setAttribute('aria-live', 'polite');

        // Create navigation buttons
        this.createNavigationButtons();

        // Create main images
        this.images.forEach((imageData, index) => {
            const img = document.createElement('img');
            img.src = imageData.src;
            img.alt = imageData.alt;
            img.className = `gallery-image ${index === 0 ? 'active' : ''}`;
            img.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');
            img.loading = 'lazy';
            
            this.mainImageContainer.appendChild(img);
        });

        this.container.appendChild(this.mainImageContainer);

        // Create thumbnails if enabled
        if (this.options.showThumbnails && this.images.length > 1) {
            this.createThumbnails();
        }

        // Create indicators for accessibility
        this.createIndicators();
    }

    createNavigationButtons() {
        // Previous button
        this.prevButton = document.createElement('button');
        this.prevButton.className = 'gallery-nav gallery-prev';
        this.prevButton.innerHTML = '‹';
        this.prevButton.setAttribute('aria-label', 'Previous image');
        this.prevButton.setAttribute('type', 'button');

        // Next button
        this.nextButton = document.createElement('button');
        this.nextButton.className = 'gallery-nav gallery-next';
        this.nextButton.innerHTML = '›';
        this.nextButton.setAttribute('aria-label', 'Next image');
        this.nextButton.setAttribute('type', 'button');

        this.mainImageContainer.appendChild(this.prevButton);
        this.mainImageContainer.appendChild(this.nextButton);
    }

    createThumbnails() {
        this.thumbnailContainer = document.createElement('div');
        this.thumbnailContainer.className = 'gallery-thumbnails';
        this.thumbnailContainer.setAttribute('role', 'tablist');
        this.thumbnailContainer.setAttribute('aria-label', 'Product image thumbnails');

        this.images.forEach((imageData, index) => {
            const thumbnailWrapper = document.createElement('button');
            thumbnailWrapper.className = `gallery-thumbnail ${index === 0 ? 'active' : ''}`;
            thumbnailWrapper.setAttribute('type', 'button');
            thumbnailWrapper.setAttribute('role', 'tab');
            thumbnailWrapper.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
            thumbnailWrapper.setAttribute('aria-label', `View image ${index + 1}: ${imageData.alt}`);
            thumbnailWrapper.dataset.index = index;

            const thumbnail = document.createElement('img');
            thumbnail.src = imageData.src;
            thumbnail.alt = '';
            thumbnail.loading = 'lazy';

            thumbnailWrapper.appendChild(thumbnail);
            this.thumbnailContainer.appendChild(thumbnailWrapper);
            this.thumbnails.push(thumbnailWrapper);
        });

        this.container.appendChild(this.thumbnailContainer);
    }

    createIndicators() {
        if (this.images.length <= 1) return;

        this.indicatorContainer = document.createElement('div');
        this.indicatorContainer.className = 'gallery-indicators';
        this.indicatorContainer.setAttribute('aria-hidden', 'true');

        this.images.forEach((_, index) => {
            const indicator = document.createElement('span');
            indicator.className = `gallery-indicator ${index === 0 ? 'active' : ''}`;
            this.indicatorContainer.appendChild(indicator);
        });

        this.container.appendChild(this.indicatorContainer);
    }

    bindEvents() {
        if (this.images.length <= 1) return;

        // Navigation button events
        this.prevButton?.addEventListener('click', () => this.previousImage());
        this.nextButton?.addEventListener('click', () => this.nextImage());

        // Thumbnail events
        this.thumbnails.forEach((thumbnail, index) => {
            thumbnail.addEventListener('click', () => this.goToImage(index));
        });

        // Pause autoplay on hover
        this.container.addEventListener('mouseenter', () => this.pauseAutoPlay());
        this.container.addEventListener('mouseleave', () => {
            if (this.options.autoPlay) {
                this.startAutoPlay();
            }
        });

        // Focus events for accessibility
        this.container.addEventListener('focusin', () => this.pauseAutoPlay());
        this.container.addEventListener('focusout', () => {
            if (this.options.autoPlay) {
                this.startAutoPlay();
            }
        });
    }

    setupKeyboardNavigation() {
        if (!this.options.enableKeyboard || this.images.length <= 1) return;

        this.container.addEventListener('keydown', (e) => {
            // Only handle keyboard events when gallery is focused
            if (!this.container.contains(document.activeElement)) return;

            switch (e.key) {
                case 'ArrowLeft':
                case 'ArrowUp':
                    e.preventDefault();
                    this.previousImage();
                    break;
                case 'ArrowRight':
                case 'ArrowDown':
                    e.preventDefault();
                    this.nextImage();
                    break;
                case 'Home':
                    e.preventDefault();
                    this.goToImage(0);
                    break;
                case 'End':
                    e.preventDefault();
                    this.goToImage(this.images.length - 1);
                    break;
                case ' ':
                case 'Enter':
                    if (e.target.classList.contains('gallery-thumbnail')) {
                        e.preventDefault();
                        const index = parseInt(e.target.dataset.index);
                        this.goToImage(index);
                    }
                    break;
            }
        });

        // Make container focusable for keyboard navigation
        this.container.setAttribute('tabindex', '0');
        this.container.setAttribute('role', 'region');
        this.container.setAttribute('aria-label', 'Product image gallery');
    }

    setupTouchNavigation() {
        if (!this.options.enableTouch || this.images.length <= 1) return;

        // Touch events
        this.mainImageContainer.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e);
        }, { passive: false });

        this.mainImageContainer.addEventListener('touchmove', (e) => {
            this.handleTouchMove(e);
        }, { passive: false });

        this.mainImageContainer.addEventListener('touchend', (e) => {
            this.handleTouchEnd(e);
        }, { passive: true });
    }

    handleTouchStart(e) {
        if (this.isTransitioning) return;

        this.pauseAutoPlay();

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        }
    }

    handleTouchMove(e) {
        if (this.isTransitioning) return;

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.touchEndX = touch.clientX;
            this.touchEndY = touch.clientY;
        }
    }

    handleTouchEnd(e) {
        if (this.isTransitioning) return;

        if (e.changedTouches.length === 1) {
            const deltaX = this.touchEndX - this.touchStartX;
            const deltaY = this.touchEndY - this.touchStartY;
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);

            // Check for swipe (sufficient distance and horizontal movement)
            if (absDeltaX > this.minSwipeDistance && absDeltaX > absDeltaY) {
                if (deltaX > 0) {
                    this.previousImage();
                } else {
                    this.nextImage();
                }
            }
        }

        // Reset touch coordinates
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;

        // Resume autoplay after touch interaction
        if (this.options.autoPlay) {
            setTimeout(() => this.startAutoPlay(), 1000);
        }
    }

    previousImage() {
        if (this.isTransitioning || this.images.length <= 1) return;
        
        const newIndex = this.currentIndex === 0 ? this.images.length - 1 : this.currentIndex - 1;
        this.goToImage(newIndex);
    }

    nextImage() {
        if (this.isTransitioning || this.images.length <= 1) return;
        
        const newIndex = this.currentIndex === this.images.length - 1 ? 0 : this.currentIndex + 1;
        this.goToImage(newIndex);
    }

    async goToImage(index) {
        if (this.isTransitioning || index === this.currentIndex || index < 0 || index >= this.images.length) {
            return;
        }

        this.isTransitioning = true;
        const previousIndex = this.currentIndex;
        
        try {
            // Pre-validate the target image before starting transition
            const isImageAvailable = await this.validateImageForTransition(index);
            
            if (!isImageAvailable) {
                // Try to find an alternative image
                const alternativeIndex = this.findNextAvailableImage(index);
                if (alternativeIndex !== -1 && alternativeIndex !== previousIndex) {
                    index = alternativeIndex;
                } else {
                    // No alternatives available, show error and abort
                    this.showTransitionError(index);
                    this.isTransitioning = false;
                    return;
                }
            }
            
            this.currentIndex = index;

            // Show loading indicator during transition
            this.showTransitionLoadingIndicator();

            // Update images with smooth transition
            await this.transitionToImage(previousIndex, index);

            // Update thumbnails
            this.updateThumbnails(index);

            // Update indicators
            this.updateIndicators(index);

            // Update accessibility attributes
            this.updateAccessibility(index);

            // Announce change to screen readers
            this.announceImageChange(index);
            
            // Hide loading indicator
            this.hideTransitionLoadingIndicator();

        } catch (error) {
            console.error('Error during image transition:', error);
            this.handleTransitionError(previousIndex, index, error);
        }
    }

    async validateImageForTransition(index) {
        // Check if image has already failed
        if (this.failedImages.has(index)) {
            return false;
        }

        // Ensure image is loaded or can be loaded
        try {
            const imageData = this.images[index];
            if (imageData.loaded) {
                return true;
            }

            // Try to load the image
            const loadSuccess = await this.loadImageWithProgression(index);
            return loadSuccess;
        } catch (error) {
            console.warn(`Image validation failed for index ${index}:`, error);
            return false;
        }
    }

    showTransitionLoadingIndicator() {
        // Create or show transition loading indicator
        let indicator = this.container.querySelector('.gallery-transition-loading');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'gallery-transition-loading';
            indicator.innerHTML = `
                <div class="transition-spinner"></div>
            `;
            indicator.style.cssText = `
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: rgba(var(--color-background-card), 0.9);
                border: 1px solid var(--color-border);
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 15;
                backdrop-filter: blur(4px);
                transition: opacity 0.2s ease;
            `;
            this.container.appendChild(indicator);
        }
        
        indicator.style.opacity = '1';
    }

    hideTransitionLoadingIndicator() {
        const indicator = this.container.querySelector('.gallery-transition-loading');
        if (indicator) {
            indicator.style.opacity = '0';
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 200);
        }
    }

    showTransitionError(failedIndex) {
        const imageData = this.images[failedIndex];
        
        // Create temporary error notification
        const errorNotification = document.createElement('div');
        errorNotification.className = 'gallery-transition-error-notification';
        errorNotification.innerHTML = `
            <div class="error-notification-content">
                <span class="error-icon">⚠️</span>
                <span class="error-text">Image unavailable: ${imageData.alt}</span>
            </div>
        `;
        
        errorNotification.style.cssText = `
            position: absolute;
            top: 1rem;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 193, 7, 0.95);
            color: #856404;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 500;
            z-index: 20;
            backdrop-filter: blur(4px);
            animation: slideInDown 0.3s ease;
        `;
        
        this.container.appendChild(errorNotification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (errorNotification.parentNode) {
                errorNotification.style.animation = 'slideOutUp 0.3s ease';
                setTimeout(() => {
                    if (errorNotification.parentNode) {
                        errorNotification.parentNode.removeChild(errorNotification);
                    }
                }, 300);
            }
        }, 3000);
    }

    handleTransitionError(fromIndex, toIndex, error) {
        console.error('Transition error:', error);
        
        // Reset transition state
        this.isTransitioning = false;
        this.currentIndex = fromIndex; // Revert to previous index
        
        // Hide loading indicator
        this.hideTransitionLoadingIndicator();
        
        // Show error notification
        this.showTransitionError(toIndex);
        
        // Emit error event
        this.container.dispatchEvent(new CustomEvent('imageTransitionError', {
            detail: { 
                fromIndex, 
                toIndex, 
                error: error.message,
                timestamp: Date.now()
            }
        }));
    }

    async transitionToImage(fromIndex, toIndex) {
        const currentImage = this.mainImageContainer.querySelector('.gallery-image.active');
        const nextImage = this.mainImageContainer.children[toIndex];

        if (!currentImage || !nextImage) {
            this.isTransitioning = false;
            return;
        }

        // Ensure the target image is loaded before transitioning
        await this.ensureImageLoaded(toIndex);

        // Add loading state to prevent white screens
        this.showLoadingState(nextImage);

        // Check if the target image failed to load
        if (this.failedImages.has(toIndex)) {
            // Try to show an alternative image or handle gracefully
            this.handleTransitionToFailedImage(fromIndex, toIndex);
            return;
        }

        // Smooth transition with loading state preservation
        this.performSmoothTransition(currentImage, nextImage, fromIndex, toIndex);
    }

    async ensureImageLoaded(index) {
        const imageData = this.images[index];
        
        // If image is already loaded or currently loading, wait for it
        if (imageData.loaded) {
            return true;
        }

        if (imageData.loading) {
            // Wait for current loading to complete
            return new Promise((resolve) => {
                const checkLoading = () => {
                    if (!imageData.loading) {
                        resolve(imageData.loaded);
                    } else {
                        setTimeout(checkLoading, 50);
                    }
                };
                checkLoading();
            });
        }

        // Load the image if not already loading
        return this.loadImageWithProgression(index);
    }

    showLoadingState(imageElement) {
        // Add loading class to show loading indicator
        imageElement.classList.add('gallery-image-loading');
        
        // Create or update loading overlay
        let loadingOverlay = imageElement.parentNode.querySelector('.gallery-loading-overlay');
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'gallery-loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading image...</div>
            `;
            loadingOverlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(248, 249, 250, 0.9);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 5;
                transition: opacity 0.3s ease;
            `;
            imageElement.parentNode.appendChild(loadingOverlay);
        }
        
        loadingOverlay.style.opacity = '1';
    }

    hideLoadingState(imageElement) {
        imageElement.classList.remove('gallery-image-loading');
        
        const loadingOverlay = imageElement.parentNode.querySelector('.gallery-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                if (loadingOverlay.parentNode) {
                    loadingOverlay.parentNode.removeChild(loadingOverlay);
                }
            }, 300);
        }
    }

    handleTransitionToFailedImage(fromIndex, toIndex) {
        console.warn(`Cannot transition to failed image at index ${toIndex}`);
        
        // Try to find the next available image
        const nextAvailableIndex = this.findNextAvailableImage(toIndex);
        
        if (nextAvailableIndex !== -1 && nextAvailableIndex !== fromIndex) {
            // Transition to the next available image instead
            this.currentIndex = nextAvailableIndex;
            this.transitionToImage(fromIndex, nextAvailableIndex);
        } else {
            // No available images, show error state
            this.showImageTransitionError(toIndex);
            this.isTransitioning = false;
        }
    }

    findNextAvailableImage(startIndex) {
        // Look for next available image, wrapping around
        for (let i = 1; i < this.images.length; i++) {
            const checkIndex = (startIndex + i) % this.images.length;
            if (!this.failedImages.has(checkIndex)) {
                return checkIndex;
            }
        }
        return -1; // No available images found
    }

    showImageTransitionError(failedIndex) {
        const imageData = this.images[failedIndex];
        
        // Create error overlay for the specific transition
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'gallery-transition-error';
        errorOverlay.innerHTML = `
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <div class="error-message">Image unavailable</div>
                <div class="error-description">${imageData.alt}</div>
                <button class="error-retry-btn" type="button">Try Again</button>
            </div>
        `;
        
        errorOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(248, 249, 250, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            text-align: center;
            font-family: system-ui, -apple-system, sans-serif;
            color: #666;
        `;
        
        // Add retry functionality
        const retryButton = errorOverlay.querySelector('.error-retry-btn');
        retryButton.addEventListener('click', async () => {
            errorOverlay.remove();
            
            // Remove from failed images and retry loading
            this.failedImages.delete(failedIndex);
            this.images[failedIndex].loaded = false;
            this.images[failedIndex].loading = false;
            
            // Retry the transition
            await this.loadImageWithProgression(failedIndex);
            if (!this.failedImages.has(failedIndex)) {
                this.goToImage(failedIndex);
            }
        });
        
        this.mainImageContainer.style.position = 'relative';
        this.mainImageContainer.appendChild(errorOverlay);
        
        // Auto-remove error after 5 seconds
        setTimeout(() => {
            if (errorOverlay.parentNode) {
                errorOverlay.remove();
            }
        }, 5000);
    }

    performSmoothTransition(currentImage, nextImage, fromIndex, toIndex) {
        // Ensure visual continuity during transition
        const transitionDuration = this.options.transitionDuration * 1000; // Convert to ms
        
        // Phase 1: Fade out current image
        currentImage.style.transition = `opacity ${transitionDuration / 2}ms ease-out`;
        currentImage.style.opacity = '0';
        
        setTimeout(() => {
            // Phase 2: Switch active states and prepare next image
            currentImage.classList.remove('active');
            nextImage.classList.add('active');
            
            // Hide loading state once image is ready
            this.hideLoadingState(nextImage);
            
            // Set initial state for next image
            nextImage.style.opacity = '0';
            nextImage.style.transform = 'scale(1.05)';
            nextImage.style.transition = `opacity ${transitionDuration / 2}ms ease-out, transform ${transitionDuration / 2}ms ease-out`;
            
            // Phase 3: Fade in next image
            requestAnimationFrame(() => {
                nextImage.style.opacity = '1';
                nextImage.style.transform = 'scale(1)';
            });
            
            // Phase 4: Complete transition
            setTimeout(() => {
                // Clean up transition styles
                nextImage.style.transition = '';
                nextImage.style.transform = '';
                currentImage.style.transition = '';
                
                this.isTransitioning = false;
                
                // Emit transition complete event
                this.container.dispatchEvent(new CustomEvent('imageTransitionComplete', {
                    detail: { 
                        fromIndex, 
                        toIndex, 
                        currentImage: this.images[toIndex] 
                    }
                }));
            }, transitionDuration / 2);
            
        }, transitionDuration / 2);
    }

    updateThumbnails(activeIndex) {
        if (!this.thumbnails.length) return;

        this.thumbnails.forEach((thumbnail, index) => {
            const isActive = index === activeIndex;
            thumbnail.classList.toggle('active', isActive);
            thumbnail.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
    }

    updateIndicators(activeIndex) {
        if (!this.indicatorContainer) return;

        const indicators = this.indicatorContainer.querySelectorAll('.gallery-indicator');
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === activeIndex);
        });
    }

    updateAccessibility(activeIndex) {
        const images = this.mainImageContainer.querySelectorAll('.gallery-image');
        images.forEach((img, index) => {
            img.setAttribute('aria-hidden', index === activeIndex ? 'false' : 'true');
        });

        // Update main container aria-label
        const currentImage = this.images[activeIndex];
        this.mainImageContainer.setAttribute('aria-label', 
            `Image ${activeIndex + 1} of ${this.images.length}: ${currentImage.alt}`
        );
    }

    announceImageChange(index) {
        // Create or update live region for screen reader announcements
        let liveRegion = document.getElementById('gallery-live-region');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'gallery-live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
        }

        const currentImage = this.images[index];
        liveRegion.textContent = `Showing image ${index + 1} of ${this.images.length}: ${currentImage.alt}`;
    }

    startAutoPlay() {
        if (!this.options.autoPlay || this.images.length <= 1) return;

        this.clearAutoPlay();
        this.autoPlayTimer = setInterval(() => {
            this.nextImage();
        }, this.options.autoPlayDelay);
    }

    pauseAutoPlay() {
        this.clearAutoPlay();
    }

    clearAutoPlay() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
    }

    // WebP Support Detection
    async checkWebPSupport() {
        if (this.supportsWebP !== null) return this.supportsWebP;

        return new Promise((resolve) => {
            const webP = new Image();
            webP.onload = webP.onerror = () => {
                this.supportsWebP = (webP.height === 2);
                resolve(this.supportsWebP);
            };
            webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        });
    }

    // Get WebP version of image URL
    getWebPVersion(originalSrc) {
        if (!originalSrc) return null;
        
        // Convert .jpeg/.jpg/.png to .webp
        return originalSrc.replace(/\.(jpe?g|png)$/i, '.webp');
    }

    // Setup Lazy Loading with Intersection Observer
    setupLazyLoading() {
        if (!('IntersectionObserver' in window)) {
            // Fallback: load all images immediately
            this.loadAllImages();
            return;
        }

        const options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const index = parseInt(img.dataset.imageIndex);
                    
                    if (index !== undefined && !this.images[index].loaded && !this.images[index].loading) {
                        this.loadImageWithProgression(index);
                    }
                }
            });
        }, options);

        // Observe all gallery images
        const galleryImages = this.mainImageContainer?.querySelectorAll('.gallery-image');
        galleryImages?.forEach((img, index) => {
            img.dataset.imageIndex = index;
            this.intersectionObserver.observe(img);
        });

        // Load the first image immediately
        if (this.images.length > 0) {
            this.loadImageWithProgression(0);
        }
    }

    // Load all images (fallback for browsers without Intersection Observer)
    loadAllImages() {
        this.images.forEach((_, index) => {
            this.loadImageWithProgression(index);
        });
    }

    // Progressive Image Loading with robust error handling
    async loadImageWithProgression(index) {
        if (index < 0 || index >= this.images.length) return false;
        
        const imageData = this.images[index];
        if (imageData.loaded) return true;
        if (imageData.loading) {
            // Wait for current loading to complete
            return new Promise((resolve) => {
                const checkLoading = () => {
                    if (!imageData.loading) {
                        resolve(imageData.loaded);
                    } else {
                        setTimeout(checkLoading, 50);
                    }
                };
                checkLoading();
            });
        }

        imageData.loading = true;

        try {
            // Get gallery and thumbnail image elements
            const galleryImg = this.mainImageContainer?.querySelector(`.gallery-image:nth-child(${index + 1})`);
            const thumbnailImg = this.thumbnailContainer?.querySelector(`.gallery-thumbnail:nth-child(${index + 1}) img`);
            
            if (!galleryImg) {
                throw new Error(`Gallery image element not found for index ${index}`);
            }

            // Show loading state during image loading
            galleryImg.classList.add('loading');

            // Determine product type for fallback selection
            const productType = this.getProductTypeFromImage(imageData);
            
            // Use error handler for robust image loading
            const success = await this.errorHandler.handleImageError(galleryImg, {
                maxRetries: 3,
                retryDelay: 1000,
                productType: productType,
                onRetry: (attempt, delay) => {
                    console.log(`Retrying image load for index ${index}, attempt ${attempt}, delay ${delay}ms`);
                },
                onFallback: (fallbackSrc) => {
                    console.log(`Using fallback image for index ${index}: ${fallbackSrc}`);
                    // Update thumbnail with fallback too
                    if (thumbnailImg) {
                        thumbnailImg.src = fallbackSrc;
                    }
                },
                onFinalFailure: (element) => {
                    console.warn(`All image loading attempts failed for index ${index}`);
                    this.handleImageLoadFailure(index, element);
                }
            });

            // Remove loading state
            galleryImg.classList.remove('loading');

            if (success) {
                // If main image loaded successfully, update thumbnail
                if (thumbnailImg && galleryImg.src) {
                    thumbnailImg.src = galleryImg.src;
                }
                
                imageData.loaded = true;
                imageData.loading = false;
                
                // Emit success event
                this.container.dispatchEvent(new CustomEvent('imageLoaded', {
                    detail: { index, src: galleryImg.src }
                }));
                
                return true;
            } else {
                throw new Error('Image loading failed after all retry attempts');
            }

        } catch (error) {
            this.errorHandler.logError('Gallery Image Load Error', {
                index: index,
                src: imageData.src,
                webp: imageData.webp,
                error: error.message
            });
            
            imageData.loading = false;
            this.handleImageLoadFailure(index);
            return false;
        }
    }

    // Handle complete image load failure
    handleImageLoadFailure(index, failedElement = null) {
        const imageData = this.images[index];
        this.failedImages.add(index);
        
        // Get the actual DOM elements
        const galleryImg = failedElement || this.mainImageContainer?.querySelector(`.gallery-image:nth-child(${index + 1})`);
        const thumbnailWrapper = this.thumbnailContainer?.querySelector(`.gallery-thumbnail:nth-child(${index + 1})`);
        
        if (galleryImg) {
            // Add error state class
            galleryImg.classList.add('image-load-error');
            galleryImg.setAttribute('aria-label', `Image ${index + 1} failed to load: ${imageData.alt}`);
        }
        
        if (thumbnailWrapper) {
            thumbnailWrapper.classList.add('thumbnail-error');
            thumbnailWrapper.setAttribute('aria-label', `Thumbnail ${index + 1} unavailable: ${imageData.alt}`);
        }
        
        // If this was the current image, try to show next available image
        if (index === this.currentIndex && this.images.length > 1) {
            this.showNextAvailableImage();
        }
        
        // Emit failure event
        this.container.dispatchEvent(new CustomEvent('imageLoadFailed', {
            detail: { index, alt: imageData.alt }
        }));
    }

    // Show next available (non-failed) image
    showNextAvailableImage() {
        for (let i = 0; i < this.images.length; i++) {
            const nextIndex = (this.currentIndex + i + 1) % this.images.length;
            if (!this.failedImages.has(nextIndex)) {
                this.goToImage(nextIndex);
                return;
            }
        }
        
        // If all images failed, show error state
        this.showGalleryErrorState();
    }

    // Show error state when all images fail
    showGalleryErrorState() {
        const errorOverlay = document.createElement('div');
        errorOverlay.className = 'gallery-error-overlay';
        errorOverlay.innerHTML = `
            <div class="gallery-error-content">
                <div class="error-icon">📷</div>
                <h3>Images Unavailable</h3>
                <p>Unable to load product images. Please check your connection and try again.</p>
                <button class="retry-button" type="button">Retry Loading</button>
            </div>
        `;
        
        errorOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(248, 249, 250, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            text-align: center;
            font-family: system-ui, -apple-system, sans-serif;
        `;
        
        // Add retry functionality
        const retryButton = errorOverlay.querySelector('.retry-button');
        retryButton.addEventListener('click', () => {
            this.retryFailedImages();
            errorOverlay.remove();
        });
        
        this.container.style.position = 'relative';
        this.container.appendChild(errorOverlay);
    }

    // Retry loading all failed images
    async retryFailedImages() {
        console.log('Retrying failed image loads...');
        
        // Clear failed images set and retry attempts
        const failedIndexes = Array.from(this.failedImages);
        this.failedImages.clear();
        this.retryAttempts.clear();
        
        // Remove error classes
        failedIndexes.forEach(index => {
            const galleryImg = this.mainImageContainer?.querySelector(`.gallery-image:nth-child(${index + 1})`);
            const thumbnailWrapper = this.thumbnailContainer?.querySelector(`.gallery-thumbnail:nth-child(${index + 1})`);
            
            if (galleryImg) {
                galleryImg.classList.remove('image-load-error');
            }
            if (thumbnailWrapper) {
                thumbnailWrapper.classList.remove('thumbnail-error');
            }
        });
        
        // Retry loading each failed image
        for (const index of failedIndexes) {
            this.images[index].loaded = false;
            this.images[index].loading = false;
            await this.loadImageWithProgression(index);
        }
    }

    // Get product type from image data for fallback selection
    getProductTypeFromImage(imageData) {
        const src = imageData.src.toLowerCase();
        const alt = imageData.alt.toLowerCase();
        
        if (src.includes('domestic') || alt.includes('domestic')) {
            return 'domestic-oil-spill-kit';
        } else if (src.includes('marine') || alt.includes('marine')) {
            return 'marine-oil-spill-kit';
        } else if (src.includes('cellulose') || src.includes('nano') || alt.includes('cellulose') || alt.includes('nano')) {
            return 'cellulose-nanocrystals';
        }
        
        return 'default';
    }

    // Public API methods
    getCurrentIndex() {
        return this.currentIndex;
    }

    getTotalImages() {
        return this.images.length;
    }

    setAutoPlay(enabled, delay = null) {
        this.options.autoPlay = enabled;
        if (delay !== null) {
            this.options.autoPlayDelay = delay;
        }

        if (enabled) {
            this.startAutoPlay();
        } else {
            this.pauseAutoPlay();
        }
    }

    // Cleanup method for proper resource management
    cleanup() {
        // Clear autoplay timer
        this.clearAutoPlay();
        
        // Disconnect intersection observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
        
        // Remove event listeners
        if (this.prevButton) {
            this.prevButton.removeEventListener('click', () => this.previousImage());
        }
        if (this.nextButton) {
            this.nextButton.removeEventListener('click', () => this.nextImage());
        }
        
        this.thumbnails.forEach((thumbnail, index) => {
            thumbnail.removeEventListener('click', () => this.goToImage(index));
        });
        
        // Remove container event listeners
        this.container.removeEventListener('mouseenter', () => this.pauseAutoPlay());
        this.container.removeEventListener('mouseleave', () => {
            if (this.options.autoPlay) {
                this.startAutoPlay();
            }
        });
        
        this.container.removeEventListener('focusin', () => this.pauseAutoPlay());
        this.container.removeEventListener('focusout', () => {
            if (this.options.autoPlay) {
                this.startAutoPlay();
            }
        });
        
        // Remove live region if it exists
        const liveRegion = document.getElementById('gallery-live-region');
        if (liveRegion) {
            liveRegion.remove();
        }
        
        // Reset container
        this.container.classList.remove('product-image-gallery');
        this.container.removeAttribute('tabindex');
        this.container.removeAttribute('role');
        this.container.removeAttribute('aria-label');
    }

    // Static method to check if ProductImageGallery is supported
    static isSupported() {
        return !!(window.IntersectionObserver);
    }
}