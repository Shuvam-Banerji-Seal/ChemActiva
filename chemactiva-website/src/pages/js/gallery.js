/**
 * Gallery Page JavaScript
 * Handles filtering, lightbox functionality, and interactive features
 */

// Import ModernCursorEffects for custom cursor
import ModernCursorEffects from './ModernCursorEffects.js';

class GalleryManager {
    constructor() {
        this.galleryItems = [];
        this.filteredItems = [];
        this.currentFilter = 'all';
        this.lightboxIndex = 0;
        this.isLightboxOpen = false;
        
        this.init();
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.loadGalleryItems();
        this.setupIntersectionObserver();
    }

    cacheElements() {
        this.galleryGrid = document.getElementById('galleryGrid');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        this.lightbox = document.getElementById('lightbox');
        this.lightboxImage = document.getElementById('lightboxImage');
        this.lightboxTitle = document.getElementById('lightboxTitle');
        this.lightboxDescription = document.getElementById('lightboxDescription');
        this.lightboxClose = document.getElementById('lightboxClose');
        this.lightboxPrev = document.getElementById('lightboxPrev');
        this.lightboxNext = document.getElementById('lightboxNext');
    }

    setupEventListeners() {
        // Filter buttons
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilterClick(e.target.dataset.filter);
            });
        });

        // Gallery items
        this.galleryGrid.addEventListener('click', (e) => {
            const galleryItem = e.target.closest('.gallery-item');
            if (galleryItem) {
                this.openLightbox(galleryItem);
            }
        });

        // Lightbox controls
        this.lightboxClose.addEventListener('click', () => this.closeLightbox());
        this.lightboxPrev.addEventListener('click', () => this.navigateLightbox(-1));
        this.lightboxNext.addEventListener('click', () => this.navigateLightbox(1));

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (this.isLightboxOpen) {
                switch (e.key) {
                    case 'Escape':
                        this.closeLightbox();
                        break;
                    case 'ArrowLeft':
                        this.navigateLightbox(-1);
                        break;
                    case 'ArrowRight':
                        this.navigateLightbox(1);
                        break;
                }
            }
        });

        // Click outside lightbox to close
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.closeLightbox();
            }
        });

        // Load more button
        if (this.loadMoreBtn) {
            this.loadMoreBtn.addEventListener('click', () => this.loadMoreImages());
        }
    }

    loadGalleryItems() {
        const items = document.querySelectorAll('.gallery-item');
        this.galleryItems = Array.from(items).map((item, index) => ({
            element: item,
            category: item.dataset.category,
            image: item.querySelector('img'),
            title: item.querySelector('.gallery-overlay h3')?.textContent || '',
            description: item.querySelector('.gallery-overlay p')?.textContent || '',
            index: index
        }));

        this.filteredItems = [...this.galleryItems];
        this.updateLightboxNavigation();
    }

    handleFilterClick(filter) {
        // Update active filter button
        this.filterBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        this.currentFilter = filter;
        this.filterGallery(filter);
    }

    filterGallery(filter) {
        this.galleryItems.forEach((item, index) => {
            const shouldShow = filter === 'all' || item.category === filter;
            
            if (shouldShow) {
                item.element.classList.remove('hidden');
                item.element.classList.add('visible');
                // Stagger animation
                setTimeout(() => {
                    item.element.style.animationDelay = `${index * 0.1}s`;
                }, 50);
            } else {
                item.element.classList.add('hidden');
                item.element.classList.remove('visible');
            }
        });

        // Update filtered items array for lightbox navigation
        this.filteredItems = this.galleryItems.filter(item => 
            filter === 'all' || item.category === filter
        );

        this.updateLightboxNavigation();
    }

    openLightbox(galleryItem) {
        const itemData = this.galleryItems.find(item => item.element === galleryItem);
        if (!itemData) return;

        // Find index in filtered items
        this.lightboxIndex = this.filteredItems.findIndex(item => item.element === galleryItem);
        
        this.updateLightboxContent(itemData);
        this.lightbox.classList.add('active');
        this.isLightboxOpen = true;
        document.body.style.overflow = 'hidden';

        // Focus management for accessibility
        this.lightboxClose.focus();
    }

    closeLightbox() {
        this.lightbox.classList.remove('active');
        this.isLightboxOpen = false;
        document.body.style.overflow = '';
    }

    navigateLightbox(direction) {
        if (this.filteredItems.length <= 1) return;

        this.lightboxIndex += direction;
        
        if (this.lightboxIndex >= this.filteredItems.length) {
            this.lightboxIndex = 0;
        } else if (this.lightboxIndex < 0) {
            this.lightboxIndex = this.filteredItems.length - 1;
        }

        const currentItem = this.filteredItems[this.lightboxIndex];
        this.updateLightboxContent(currentItem);
    }

    updateLightboxContent(itemData) {
        this.lightboxImage.src = itemData.image.src;
        this.lightboxImage.alt = itemData.image.alt;
        this.lightboxTitle.textContent = itemData.title;
        this.lightboxDescription.textContent = itemData.description;

        // Show/hide navigation buttons
        const showNavigation = this.filteredItems.length > 1;
        this.lightboxPrev.style.display = showNavigation ? 'flex' : 'none';
        this.lightboxNext.style.display = showNavigation ? 'flex' : 'none';
    }

    updateLightboxNavigation() {
        // This method is called when filtering changes to update navigation
        if (this.isLightboxOpen && this.lightboxIndex >= this.filteredItems.length) {
            this.lightboxIndex = 0;
        }
    }

    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe gallery items
        this.galleryItems.forEach(item => {
            observer.observe(item.element);
        });
    }

    loadMoreImages() {
        // Simulate loading more images
        // In a real application, this would fetch more data from an API
        this.loadMoreBtn.textContent = 'Loading...';
        this.loadMoreBtn.disabled = true;

        setTimeout(() => {
            // For now, just hide the button
            this.loadMoreBtn.style.display = 'none';
            
            // In a real implementation, you would:
            // 1. Fetch more images from your API
            // 2. Create new gallery items
            // 3. Add them to the gallery grid
            // 4. Update the galleryItems array
            // 5. Re-run the intersection observer setup
        }, 1000);
    }

    // Utility method to preload images
    preloadImages(imageUrls) {
        imageUrls.forEach(url => {
            const img = new Image();
            img.src = url;
        });
    }

    // Method to add new gallery items dynamically
    addGalleryItem(itemData) {
        const galleryItem = this.createGalleryItemElement(itemData);
        this.galleryGrid.appendChild(galleryItem);
        
        // Update arrays
        const newItem = {
            element: galleryItem,
            category: itemData.category,
            image: galleryItem.querySelector('img'),
            title: itemData.title,
            description: itemData.description,
            index: this.galleryItems.length
        };
        
        this.galleryItems.push(newItem);
        
        // Apply current filter
        this.filterGallery(this.currentFilter);
    }

    createGalleryItemElement(itemData) {
        const galleryItem = document.createElement('div');
        galleryItem.className = 'gallery-item';
        galleryItem.dataset.category = itemData.category;
        
        galleryItem.innerHTML = `
            <div class="gallery-image-container">
                <img src="${itemData.imageSrc}" alt="${itemData.alt}" loading="lazy">
                <div class="gallery-overlay">
                    <h3>${itemData.title}</h3>
                    <p>${itemData.description}</p>
                </div>
            </div>
        `;
        
        return galleryItem;
    }

    // Performance optimization: lazy load images
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }
}

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.galleryManager = new GalleryManager();
    
    // Remove any existing offline banners
    removeOfflineBanners();
    
    // Check if mobile device
    const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Use default cursor on mobile
        document.body.classList.add('cursor-fallback');
        document.body.classList.add('mobile');
    } else {
        // Initialize custom cursor effects with fallback for desktop
        try {
            window.cursorEffects = new ModernCursorEffects();
            
            // Check if custom cursor is working after a short delay
            setTimeout(() => {
                const customCursor = document.querySelector('.custom-cursor');
                if (!customCursor || getComputedStyle(customCursor).display === 'none') {
                    // Custom cursor failed, enable fallback
                    document.body.classList.add('cursor-fallback');
                    console.log('[Gallery] Custom cursor failed, using fallback');
                }
            }, 1000);
        } catch (error) {
            console.error('[Gallery] Custom cursor initialization failed:', error);
            document.body.classList.add('cursor-fallback');
        }
    }
    
    // Initialize mobile navbar functionality
    initializeMobileNavbar();
});

// Mobile navbar functionality
function initializeMobileNavbar() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        navLinks.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            }
        });
    }
}

// Utility function to remove any existing offline banners
function removeOfflineBanners() {
    // Remove offline indicator
    const offlineIndicator = document.getElementById('offline-indicator');
    if (offlineIndicator) {
        offlineIndicator.remove();
    }
    
    // Remove offline notification
    const offlineNotification = document.getElementById('offline-notification');
    if (offlineNotification) {
        offlineNotification.remove();
    }
    
    // Remove any network status feedbacks
    const networkStatus = document.getElementById('network-status');
    if (networkStatus) {
        networkStatus.remove();
    }
    
    // Remove offline mode class from body
    document.body.classList.remove('offline-mode');
    
    console.log('[Gallery] Removed any existing offline banners');
}

// Export for potential external use
export default GalleryManager;