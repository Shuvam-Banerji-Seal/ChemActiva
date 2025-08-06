// src/js/ModernArticleManager.js
// Enhanced ArticleManager with modern visual elements and metadata display
import ArticleManager from './ArticleManager.js';
import ExpandableText from './ExpandableText.js';
import { gsap } from 'gsap';

export default class ModernArticleManager extends ArticleManager {
    constructor(gridSelector, jsonlPath, articleType, singleArticlePage, options = {}) {
        super(gridSelector, jsonlPath, articleType, singleArticlePage);
        
        // Enhanced options for modern functionality
        this.options = {
            enableReadingTime: true,
            enableEnhancedMetadata: true,
            enableFeaturedCards: true,
            enableModernStyling: true,
            enableSwipeGestures: true, // Enable swipe gesture support
            wordsPerMinute: 200, // Average reading speed
            ...options
        };
        
        // Cache for reading time calculations
        this.readingTimeCache = new Map();
        
        // Enhanced metadata display options
        this.metadataConfig = {
            showDate: true,
            showAuthor: true,
            showReadingTime: this.options.enableReadingTime,
            showCategory: true,
            showTags: true,
            dateFormat: 'short' // 'short', 'long', 'relative'
        };
        
        // Swipe gesture tracking
        this.swipeState = {
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            isSwipping: false,
            threshold: 50, // Minimum distance for swipe
            restraint: 100, // Maximum perpendicular distance
            allowedTime: 300 // Maximum time for swipe
        };
        
        // Initialize mobile-specific features
        this.initializeMobileFeatures();
    }
    
    /**
     * Initialize mobile-specific features and event listeners
     */
    initializeMobileFeatures() {
        if (this.options.enableSwipeGestures) {
            this.initializeSwipeGestures();
        }
        
        // Add touch-specific optimizations
        this.initializeTouchOptimizations();
    }
    
    /**
     * Initialize swipe gesture support for article navigation
     */
    initializeSwipeGestures() {
        if (!this.gridElement) return;
        
        // Add touch event listeners
        this.gridElement.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        this.gridElement.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.gridElement.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        
        // Add mouse event listeners for desktop testing
        this.gridElement.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.gridElement.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.gridElement.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.gridElement.addEventListener('mouseleave', this.handleMouseUp.bind(this));
    }
    
    /**
     * Initialize touch-specific optimizations
     */
    initializeTouchOptimizations() {
        if (!this.gridElement) return;
        
        // Add touch-friendly classes
        this.gridElement.classList.add('touch-optimized');
        
        // Optimize scroll behavior for touch
        this.gridElement.style.webkitOverflowScrolling = 'touch';
        this.gridElement.style.scrollBehavior = 'smooth';
        
        // Add touch feedback for interactive elements
        this.addTouchFeedback();
    }
    
    /**
     * Add touch feedback to interactive elements
     */
    addTouchFeedback() {
        // This will be called after articles are loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.setupTouchFeedbackForCards();
        });
    }
    
    /**
     * Setup touch feedback for article cards
     */
    setupTouchFeedbackForCards() {
        const cards = this.gridElement?.querySelectorAll('.modern-article-card');
        if (!cards) return;
        
        cards.forEach(card => {
            // Add touch start feedback
            card.addEventListener('touchstart', (e) => {
                card.classList.add('touch-active');
                this.createTouchRipple(e, card);
            }, { passive: true });
            
            // Remove touch feedback
            card.addEventListener('touchend', () => {
                setTimeout(() => {
                    card.classList.remove('touch-active');
                }, 150);
            }, { passive: true });
            
            card.addEventListener('touchcancel', () => {
                card.classList.remove('touch-active');
            }, { passive: true });
        });
    }
    
    /**
     * Create touch ripple effect
     * @param {TouchEvent} e - Touch event
     * @param {HTMLElement} element - Target element
     */
    createTouchRipple(e, element) {
        const rect = element.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        const ripple = document.createElement('div');
        ripple.className = 'touch-ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        element.appendChild(ripple);
        
        // Animate ripple
        gsap.fromTo(ripple, 
            {
                scale: 0,
                opacity: 0.6
            },
            {
                scale: 3,
                opacity: 0,
                duration: 0.6,
                ease: "power2.out",
                onComplete: () => {
                    ripple.remove();
                }
            }
        );
    }
    
    /**
     * Handle touch start events
     * @param {TouchEvent} e - Touch event
     */
    handleTouchStart(e) {
        const touch = e.touches[0];
        this.swipeState.startX = touch.clientX;
        this.swipeState.startY = touch.clientY;
        this.swipeState.startTime = Date.now();
        this.swipeState.isSwipping = true;
    }
    
    /**
     * Handle touch move events
     * @param {TouchEvent} e - Touch event
     */
    handleTouchMove(e) {
        if (!this.swipeState.isSwipping) return;
        
        const touch = e.touches[0];
        this.swipeState.currentX = touch.clientX;
        this.swipeState.currentY = touch.clientY;
        
        // Calculate swipe distance
        const deltaX = this.swipeState.currentX - this.swipeState.startX;
        const deltaY = this.swipeState.currentY - this.swipeState.startY;
        
        // If horizontal swipe is detected, prevent default scrolling
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            e.preventDefault();
        }
    }
    
    /**
     * Handle touch end events
     * @param {TouchEvent} e - Touch event
     */
    handleTouchEnd(e) {
        if (!this.swipeState.isSwipping) return;
        
        const deltaX = this.swipeState.currentX - this.swipeState.startX;
        const deltaY = this.swipeState.currentY - this.swipeState.startY;
        const deltaTime = Date.now() - this.swipeState.startTime;
        
        // Check if swipe meets criteria
        if (deltaTime <= this.swipeState.allowedTime) {
            if (Math.abs(deltaX) >= this.swipeState.threshold && Math.abs(deltaY) <= this.swipeState.restraint) {
                // Horizontal swipe detected
                if (deltaX > 0) {
                    this.handleSwipeRight();
                } else {
                    this.handleSwipeLeft();
                }
            } else if (Math.abs(deltaY) >= this.swipeState.threshold && Math.abs(deltaX) <= this.swipeState.restraint) {
                // Vertical swipe detected
                if (deltaY > 0) {
                    this.handleSwipeDown();
                } else {
                    this.handleSwipeUp();
                }
            }
        }
        
        this.resetSwipeState();
    }
    
    /**
     * Handle mouse down events (for desktop testing)
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseDown(e) {
        this.swipeState.startX = e.clientX;
        this.swipeState.startY = e.clientY;
        this.swipeState.startTime = Date.now();
        this.swipeState.isSwipping = true;
    }
    
    /**
     * Handle mouse move events
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseMove(e) {
        if (!this.swipeState.isSwipping) return;
        
        this.swipeState.currentX = e.clientX;
        this.swipeState.currentY = e.clientY;
    }
    
    /**
     * Handle mouse up events
     * @param {MouseEvent} e - Mouse event
     */
    handleMouseUp(e) {
        if (!this.swipeState.isSwipping) return;
        
        const deltaX = this.swipeState.currentX - this.swipeState.startX;
        const deltaY = this.swipeState.currentY - this.swipeState.startY;
        const deltaTime = Date.now() - this.swipeState.startTime;
        
        // Check if swipe meets criteria (more lenient for mouse)
        if (deltaTime <= this.swipeState.allowedTime * 2) {
            if (Math.abs(deltaX) >= this.swipeState.threshold && Math.abs(deltaY) <= this.swipeState.restraint) {
                if (deltaX > 0) {
                    this.handleSwipeRight();
                } else {
                    this.handleSwipeLeft();
                }
            }
        }
        
        this.resetSwipeState();
    }
    
    /**
     * Reset swipe state
     */
    resetSwipeState() {
        this.swipeState.isSwipping = false;
        this.swipeState.startX = 0;
        this.swipeState.startY = 0;
        this.swipeState.currentX = 0;
        this.swipeState.currentY = 0;
    }
    
    /**
     * Handle swipe right gesture
     */
    handleSwipeRight() {
        // Dispatch custom event for swipe right
        this.gridElement.dispatchEvent(new CustomEvent('swipeRight', {
            detail: { direction: 'right', manager: this },
            bubbles: true
        }));
        
        // Visual feedback
        this.showSwipeFeedback('right');
    }
    
    /**
     * Handle swipe left gesture
     */
    handleSwipeLeft() {
        // Dispatch custom event for swipe left
        this.gridElement.dispatchEvent(new CustomEvent('swipeLeft', {
            detail: { direction: 'left', manager: this },
            bubbles: true
        }));
        
        // Visual feedback
        this.showSwipeFeedback('left');
    }
    
    /**
     * Handle swipe up gesture
     */
    handleSwipeUp() {
        // Scroll to top or previous section
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        
        this.showSwipeFeedback('up');
    }
    
    /**
     * Handle swipe down gesture
     */
    handleSwipeDown() {
        // Scroll to next section or bottom
        const nextSection = this.gridElement.closest('section')?.nextElementSibling;
        if (nextSection) {
            nextSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        this.showSwipeFeedback('down');
    }
    
    /**
     * Show visual feedback for swipe gestures
     * @param {string} direction - Swipe direction
     */
    showSwipeFeedback(direction) {
        const feedback = document.createElement('div');
        feedback.className = `swipe-feedback swipe-${direction}`;
        feedback.innerHTML = this.getSwipeIcon(direction);
        
        document.body.appendChild(feedback);
        
        // Animate feedback
        gsap.fromTo(feedback,
            {
                opacity: 0,
                scale: 0.5,
                x: direction === 'left' ? 50 : direction === 'right' ? -50 : 0,
                y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0
            },
            {
                opacity: 1,
                scale: 1,
                x: 0,
                y: 0,
                duration: 0.3,
                ease: "back.out(1.7)",
                onComplete: () => {
                    gsap.to(feedback, {
                        opacity: 0,
                        scale: 0.8,
                        duration: 0.2,
                        delay: 0.5,
                        onComplete: () => feedback.remove()
                    });
                }
            }
        );
    }
    
    /**
     * Get swipe direction icon
     * @param {string} direction - Swipe direction
     * @returns {string} SVG icon HTML
     */
    getSwipeIcon(direction) {
        const icons = {
            left: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>',
            right: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>',
            up: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>',
            down: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>'
        };
        return icons[direction] || '';
    }

    /**
     * Calculate estimated reading time for article content
     * @param {string} content - Article content or abstract
     * @param {number} wordCount - Optional pre-calculated word count
     * @returns {number} Estimated reading time in minutes
     */
    calculateReadingTime(content, wordCount = null) {
        if (!content) return 0;
        
        // Use cached result if available
        const cacheKey = content.substring(0, 100); // Use first 100 chars as cache key
        if (this.readingTimeCache.has(cacheKey)) {
            return this.readingTimeCache.get(cacheKey);
        }
        
        // Calculate word count if not provided
        const words = wordCount || content.trim().split(/\s+/).length;
        
        // Estimate reading time (accounting for images, code blocks, etc.)
        let baseTime = Math.ceil(words / this.options.wordsPerMinute);
        
        // Add time for images (30 seconds per image)
        const imageCount = (content.match(/!\[.*?\]/g) || []).length;
        const imageTime = Math.ceil(imageCount * 0.5); // 30 seconds = 0.5 minutes
        
        // Add time for code blocks (slower reading)
        const codeBlockCount = (content.match(/```[\s\S]*?```/g) || []).length;
        const codeTime = Math.ceil(codeBlockCount * 1); // 1 minute per code block
        
        const totalTime = Math.max(1, baseTime + imageTime + codeTime); // Minimum 1 minute
        
        // Cache the result
        this.readingTimeCache.set(cacheKey, totalTime);
        
        return totalTime;
    }

    /**
     * Format date according to configuration
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        if (!date) return '';
        
        const dateObj = new Date(date);
        const now = new Date();
        const diffTime = Math.abs(now - dateObj);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (this.metadataConfig.dateFormat) {
            case 'relative':
                if (diffDays === 0) return 'Today';
                if (diffDays === 1) return 'Yesterday';
                if (diffDays < 7) return `${diffDays} days ago`;
                if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
                if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
                return `${Math.ceil(diffDays / 365)} years ago`;
            
            case 'long':
                return dateObj.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            
            case 'short':
            default:
                return dateObj.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
        }
    }

    /**
     * Create enhanced metadata display with modern styling
     * @param {Object} article - Article data
     * @returns {HTMLElement} Enhanced metadata container
     */
    createEnhancedMetadata(article) {
        const metaDiv = document.createElement('div');
        metaDiv.className = 'modern-article-meta';
        
        const metaItems = [];
        
        // Date metadata
        if (this.metadataConfig.showDate && article.date) {
            const dateItem = document.createElement('span');
            dateItem.className = 'modern-article-meta-item';
            dateItem.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
                <span>${this.formatDate(article.date)}</span>
            `;
            metaItems.push(dateItem);
        }
        
        // Enhanced author metadata with avatar support
        if (this.metadataConfig.showAuthor && (article.author || article.authors)) {
            const authorItem = this.createEnhancedAuthorDisplay(article);
            metaItems.push(authorItem);
        }
        
        // Reading time metadata
        if (this.metadataConfig.showReadingTime && this.options.enableReadingTime) {
            const readingTime = this.calculateReadingTime(article.abstract || article.content || '');
            if (readingTime > 0) {
                const readingTimeItem = document.createElement('span');
                readingTimeItem.className = 'modern-article-meta-item';
                readingTimeItem.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
                    </svg>
                    <span>${readingTime} min read</span>
                `;
                metaItems.push(readingTimeItem);
            }
        }
        
        // Category/Journal metadata for research articles
        if (this.metadataConfig.showCategory) {
            if (article.journal) {
                const journalItem = document.createElement('span');
                journalItem.className = 'modern-article-meta-item modern-article-journal';
                journalItem.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    <span>${article.journal}</span>
                `;
                metaItems.push(journalItem);
            } else if (article.category) {
                const categoryItem = document.createElement('span');
                categoryItem.className = 'modern-article-meta-item modern-article-category';
                categoryItem.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12,2L13.09,8.26L22,9L13.09,9.74L12,16L10.91,9.74L2,9L10.91,8.26L12,2Z"/>
                    </svg>
                    <span>${article.category}</span>
                `;
                metaItems.push(categoryItem);
            }
        }
        
        // Add separators between metadata items
        metaItems.forEach((item, index) => {
            metaDiv.appendChild(item);
            if (index < metaItems.length - 1) {
                const separator = document.createElement('span');
                separator.className = 'modern-article-meta-separator';
                separator.setAttribute('aria-hidden', 'true');
                metaDiv.appendChild(separator);
            }
        });
        
        return metaDiv;
    }

    /**
     * Create enhanced author display with avatar support
     * @param {Object} article - Article data
     * @returns {HTMLElement} Enhanced author display element
     */
    createEnhancedAuthorDisplay(article) {
        const authorItem = document.createElement('span');
        authorItem.className = 'modern-article-meta-item modern-article-author';
        
        const authors = Array.isArray(article.authors) ? article.authors : [article.author];
        
        // If multiple authors, create a container
        if (authors.length > 1) {
            authorItem.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm9 9c-1.11 0-2-.89-2-2s.89-2 2-2 2 .89 2 2-.89 2-2 2zm3 7.5c0 .83-.67 1.5-1.5 1.5S13 21.33 13 20.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm-6 0c0 .83-.67 1.5-1.5 1.5S7 21.33 7 20.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5zm-6 0c0 .83-.67 1.5-1.5 1.5S1 21.33 1 20.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5z"/>
                </svg>
                <span class="authors-list">${authors.join(', ')}</span>
            `;
        } else {
            // Single author with potential avatar
            const author = authors[0];
            const avatar = this.getAuthorAvatar(author);
            
            if (avatar) {
                authorItem.innerHTML = `
                    <img src="${avatar}" alt="${author}" class="author-avatar" loading="lazy">
                    <span class="author-name">${author}</span>
                `;
            } else {
                authorItem.innerHTML = `
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    <span class="author-name">${author}</span>
                `;
            }
        }
        
        return authorItem;
    }

    /**
     * Get author avatar from team data
     * @param {string} authorName - Author name to look up
     * @returns {string|null} Avatar URL or null if not found
     */
    getAuthorAvatar(authorName) {
        // This would ideally be loaded from team data, but for now we'll use a simple mapping
        const authorAvatarMap = {
            'Dr. Goutam Kulsi': '/assets/images/team/goutam-kulsi.jpg',
            'Dr. G. Kulsi': '/assets/images/team/goutam-kulsi.jpg',
            'Dr. Soumitra Hazra': '/assets/images/team/default-avatar.jpg',
            'Dr. S. Hazra': '/assets/images/team/default-avatar.jpg',
            'Mr. Rahul Mandal': '/assets/images/team/default-avatar.jpg',
            'R. Mandal': '/assets/images/team/default-avatar.jpg'
        };
        
        return authorAvatarMap[authorName] || null;
    }

    /**
     * Create interactive tags and category elements with hover states
     * @param {Object} article - Article data
     * @returns {HTMLElement|null} Tags container or null if no tags
     */
    createInteractiveTags(article) {
        if (!this.metadataConfig.showTags || !article.tags || article.tags.length === 0) {
            return null;
        }

        const tagsContainer = document.createElement('div');
        tagsContainer.className = 'modern-article-tags';
        tagsContainer.setAttribute('aria-label', 'Article tags');

        article.tags.forEach((tag, index) => {
            const tagElement = document.createElement('span');
            tagElement.className = 'modern-article-tag';
            tagElement.textContent = tag;
            tagElement.setAttribute('role', 'button');
            tagElement.setAttribute('tabindex', '0');
            tagElement.setAttribute('aria-label', `Filter by tag: ${tag}`);
            tagElement.setAttribute('data-tag', tag);

            // Add click handler for potential filtering functionality
            tagElement.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.handleTagClick(tag, tagElement);
            });

            // Add keyboard support
            tagElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleTagClick(tag, tagElement);
                }
            });

            // Add hover effects with micro-interactions
            tagElement.addEventListener('mouseenter', () => {
                this.animateTagHover(tagElement, true);
            });

            tagElement.addEventListener('mouseleave', () => {
                this.animateTagHover(tagElement, false);
            });

            tagsContainer.appendChild(tagElement);
        });

        return tagsContainer;
    }

    /**
     * Handle tag click events
     * @param {string} tag - The clicked tag
     * @param {HTMLElement} tagElement - The tag element
     */
    handleTagClick(tag, tagElement) {
        // Toggle active state
        tagElement.classList.toggle('active');
        
        // Dispatch custom event for potential filtering integration
        this.gridElement.dispatchEvent(new CustomEvent('tagClicked', {
            detail: {
                tag: tag,
                element: tagElement,
                isActive: tagElement.classList.contains('active')
            },
            bubbles: true
        }));

        // Visual feedback
        this.animateTagClick(tagElement);
    }

    /**
     * Animate tag hover effects
     * @param {HTMLElement} tagElement - The tag element
     * @param {boolean} isHovering - Whether mouse is hovering
     */
    animateTagHover(tagElement, isHovering) {
        if (isHovering) {
            gsap.to(tagElement, {
                scale: 1.05,
                y: -2,
                duration: 0.2,
                ease: "power2.out"
            });
        } else {
            gsap.to(tagElement, {
                scale: 1,
                y: 0,
                duration: 0.2,
                ease: "power2.out"
            });
        }
    }

    /**
     * Animate tag click feedback
     * @param {HTMLElement} tagElement - The tag element
     */
    animateTagClick(tagElement) {
        // Create ripple effect
        const ripple = document.createElement('span');
        ripple.className = 'tag-ripple';
        tagElement.appendChild(ripple);

        // Animate ripple
        gsap.fromTo(ripple, 
            {
                scale: 0,
                opacity: 0.6
            },
            {
                scale: 2,
                opacity: 0,
                duration: 0.6,
                ease: "power2.out",
                onComplete: () => {
                    ripple.remove();
                }
            }
        );

        // Animate tag itself
        gsap.to(tagElement, {
            scale: 0.95,
            duration: 0.1,
            ease: "power2.inOut",
            yoyo: true,
            repeat: 1
        });
    }

    /**
     * Create modern article card with enhanced visual elements
     * @param {Object} article - Article data
     * @param {boolean} featured - Whether this is a featured article
     * @returns {HTMLElement} Modern article card element
     */
    createModernArticleCard(article, featured = false) {
        const cardLink = document.createElement('a');
        cardLink.href = `${this.singleArticlePage}?type=${this.articleType}&id=${article.id}`;
        cardLink.className = `modern-article-card${featured ? ' featured' : ''}`;
        cardLink.setAttribute('aria-label', `Read article: ${article.title}`);
        cardLink.setAttribute('data-article-id', article.id);
        cardLink.setAttribute('data-article-type', this.articleType);

        // Enhanced image container with overlay
        const imageContainer = document.createElement('div');
        imageContainer.className = 'modern-article-image-container';

        const coverImage = document.createElement('img');
        coverImage.src = article.coverImage || '/public/assets/images/covers/default-cover.svg';
        coverImage.alt = `Cover image for ${article.title}`;
        coverImage.className = 'modern-article-image';
        coverImage.loading = 'lazy';
        coverImage.setAttribute('decoding', 'async');
        
        // Add error handling for images
        coverImage.onerror = () => {
            coverImage.src = '/public/assets/images/covers/default-cover.svg';
            coverImage.alt = 'Default article cover';
        };

        // Image overlay for better text readability
        const imageOverlay = document.createElement('div');
        imageOverlay.className = 'modern-article-image-overlay';
        imageOverlay.setAttribute('aria-hidden', 'true');

        imageContainer.appendChild(coverImage);
        imageContainer.appendChild(imageOverlay);

        // Enhanced content section
        const contentDiv = document.createElement('div');
        contentDiv.className = 'modern-article-content-section';

        // Modern title with enhanced typography
        const titleH3 = document.createElement('h3');
        titleH3.className = 'modern-article-title';
        titleH3.textContent = article.title;

        // Enhanced metadata display
        const metaDiv = this.createEnhancedMetadata(article);

        // Enhanced abstract with expandable functionality
        const abstractP = document.createElement('p');
        abstractP.className = 'modern-article-abstract';
        abstractP.textContent = article.abstract || 'Discover more about this topic...';

        // Initialize expandable text for the abstract
        const expandableText = new ExpandableText(abstractP, {
            maxLines: 3,
            readMoreText: 'Read more',
            readLessText: 'Show less',
            animationDuration: 400,
            enableAnimation: true,
            truncateWords: false
        });

        // Modern call-to-action button
        const ctaButton = document.createElement('span');
        ctaButton.className = 'modern-article-cta';
        ctaButton.innerHTML = `
            Read Article
            <span class="modern-article-cta-icon" aria-hidden="true">→</span>
        `;
        ctaButton.setAttribute('role', 'button');
        ctaButton.setAttribute('tabindex', '0');

        // Interactive tags display
        const tagsContainer = this.createInteractiveTags(article);

        // Assemble content section
        if (tagsContainer) {
            contentDiv.appendChild(tagsContainer);
        }
        contentDiv.appendChild(titleH3);
        contentDiv.appendChild(metaDiv);
        contentDiv.appendChild(abstractP);
        contentDiv.appendChild(ctaButton);

        // Assemble card
        cardLink.appendChild(imageContainer);
        cardLink.appendChild(contentDiv);

        // Add keyboard navigation support
        cardLink.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                cardLink.click();
            }
        });

        return cardLink;
    }

    /**
     * Enhanced article loading with modern card rendering and loading states
     * @override
     */
    async loadAndDisplayArticles() {
        if (this.hasLoaded || !this.gridElement) return;
        
        // Show loading state with skeleton loaders
        this.showLoadingState(6);
        
        // Add small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const articles = await this.fetchArticles();

        if (articles.length === 0) {
            this.gridElement.innerHTML = `
                <div class="modern-article-empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    <h3>No ${this.articleType} posts available</h3>
                    <p>Check back soon for new content!</p>
                </div>
            `;
            this.hasLoaded = true;
            return;
        }

        // Fade out skeleton loaders first
        await this.fadeOutSkeletons();
        
        // Clear existing content and add modern grid class
        this.gridElement.innerHTML = '';
        this.gridElement.classList.add('modern-article-grid');
        
        const fragment = document.createDocumentFragment();
        
        articles.forEach((article, index) => {
            // Determine if this should be a featured card (first article or marked as featured)
            const isFeatured = this.options.enableFeaturedCards && 
                             (index === 0 || article.featured === true);
            
            const card = this.options.enableModernStyling 
                ? this.createModernArticleCard(article, isFeatured)
                : this.createArticleCard(article); // Fallback to original method
            
            fragment.appendChild(card);
        });
        
        this.gridElement.appendChild(fragment);
        this.hasLoaded = true;

        // Setup touch feedback for newly created cards
        this.setupTouchFeedbackForCards();

        // Use enhanced staggered entrance animations
        this.animateCardsEntrance(this.options.animationType || 'cascade');
    }

    /**
     * Fade out skeleton loaders with animation
     * @returns {Promise} Promise that resolves when animation completes
     */
    fadeOutSkeletons() {
        return new Promise(resolve => {
            const skeletons = this.gridElement.querySelectorAll('.modern-article-skeleton');
            if (skeletons.length === 0) {
                resolve();
                return;
            }

            gsap.to(skeletons, {
                opacity: 0,
                scale: 0.95,
                y: -20,
                duration: 0.4,
                stagger: 0.05,
                ease: "power2.in",
                onComplete: () => {
                    this.gridElement.classList.remove('loading-state');
                    resolve();
                }
            });
        });
    }

    /**
     * Create skeleton loader for better perceived performance
     * @returns {HTMLElement} Skeleton loader element
     */
    createSkeletonLoader() {
        const skeleton = document.createElement('div');
        skeleton.className = 'modern-article-skeleton';
        skeleton.setAttribute('aria-label', 'Loading article...');
        skeleton.innerHTML = `
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-meta">
                    <div class="skeleton-meta-item"></div>
                    <div class="skeleton-meta-item"></div>
                    <div class="skeleton-meta-item"></div>
                </div>
                <div class="skeleton-text">
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                </div>
                <div class="skeleton-button"></div>
            </div>
        `;
        return skeleton;
    }

    /**
     * Show loading state with skeleton loaders
     * @param {number} count - Number of skeleton loaders to show
     */
    showLoadingState(count = 6) {
        if (!this.gridElement) return;
        
        this.gridElement.innerHTML = '';
        this.gridElement.classList.add('modern-article-grid', 'loading-state');
        
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
            const skeleton = this.createSkeletonLoader();
            fragment.appendChild(skeleton);
        }
        
        this.gridElement.appendChild(fragment);
        
        // Animate skeleton loaders in
        const skeletons = this.gridElement.querySelectorAll('.modern-article-skeleton');
        gsap.from(skeletons, {
            opacity: 0,
            y: 30,
            duration: 0.4,
            stagger: 0.08,
            ease: "power2.out"
        });
    }

    /**
     * Advanced staggered entrance animations with GSAP
     * @param {string} animationType - Type of animation ('default', 'cascade', 'wave', 'spiral')
     */
    animateCardsEntrance(animationType = 'cascade') {
        const cards = this.gridElement.querySelectorAll('.modern-article-card, .article-card');
        if (cards.length === 0) return;

        // Remove loading state
        this.gridElement.classList.remove('loading-state');
        
        // Create timeline for coordinated animations
        const tl = gsap.timeline({
            onComplete: () => {
                // Clean up transform properties after animation
                gsap.set(cards, { clearProps: "all" });
            }
        });

        switch (animationType) {
            case 'cascade':
                this.animateCascade(tl, cards);
                break;
            case 'wave':
                this.animateWave(tl, cards);
                break;
            case 'spiral':
                this.animateSpiral(tl, cards);
                break;
            case 'default':
            default:
                this.animateDefault(tl, cards);
                break;
        }
    }

    /**
     * Default staggered animation with enhanced easing
     * @param {gsap.Timeline} tl - GSAP timeline
     * @param {NodeList} cards - Card elements
     */
    animateDefault(tl, cards) {
        // Set initial state
        gsap.set(cards, {
            opacity: 0,
            y: 80,
            scale: 0.9,
            rotationX: 15
        });

        // Animate cards in with stagger
        tl.to(cards, {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationX: 0,
            duration: 0.8,
            stagger: {
                amount: 0.6,
                ease: "power2.out"
            },
            ease: "back.out(1.2)"
        });

        // Add subtle secondary animation for visual interest
        tl.from(cards, {
            boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
            duration: 0.6,
            stagger: {
                amount: 0.4,
                ease: "power2.out"
            },
            ease: "power2.out"
        }, "-=0.4");
    }

    /**
     * Cascade animation with directional flow
     * @param {gsap.Timeline} tl - GSAP timeline
     * @param {NodeList} cards - Card elements
     */
    animateCascade(tl, cards) {
        // Set initial state with varied positions
        gsap.set(cards, {
            opacity: 0,
            y: (i) => 100 + (i * 20), // Increasing offset
            x: (i) => (i % 2 === 0 ? -50 : 50), // Alternating sides
            scale: 0.8,
            rotation: (i) => (i % 2 === 0 ? -5 : 5) // Alternating rotation
        });

        // Main cascade animation
        tl.to(cards, {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            rotation: 0,
            duration: 1,
            stagger: {
                amount: 0.8,
                ease: "power3.out"
            },
            ease: "back.out(1.1)"
        });

        // Add floating effect
        tl.to(cards, {
            y: -5,
            duration: 0.3,
            stagger: {
                amount: 0.2,
                ease: "sine.inOut"
            },
            ease: "sine.inOut",
            yoyo: true,
            repeat: 1
        }, "-=0.3");
    }

    /**
     * Wave animation with rhythmic flow
     * @param {gsap.Timeline} tl - GSAP timeline
     * @param {NodeList} cards - Card elements
     */
    animateWave(tl, cards) {
        // Set initial state
        gsap.set(cards, {
            opacity: 0,
            y: 120,
            scale: 0.7,
            transformOrigin: "center bottom"
        });

        // Create wave effect
        tl.to(cards, {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            stagger: {
                amount: 1.2,
                ease: "sine.inOut",
                from: "start"
            },
            ease: "elastic.out(1, 0.5)"
        });

        // Add ripple effect
        tl.from(cards, {
            scaleX: 1.1,
            scaleY: 0.9,
            duration: 0.4,
            stagger: {
                amount: 0.6,
                ease: "sine.inOut"
            },
            ease: "sine.inOut"
        }, "-=0.6");
    }

    /**
     * Spiral animation with radial flow
     * @param {gsap.Timeline} tl - GSAP timeline
     * @param {NodeList} cards - Card elements
     */
    animateSpiral(tl, cards) {
        // Set initial state with spiral positioning
        gsap.set(cards, {
            opacity: 0,
            scale: 0.5,
            rotation: (i) => i * 45, // Spiral rotation
            transformOrigin: "center center"
        });

        // Spiral entrance
        tl.to(cards, {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 1.2,
            stagger: {
                amount: 1,
                ease: "power2.out",
                from: "center"
            },
            ease: "back.out(1.3)"
        });

        // Add pulsing effect
        tl.to(cards, {
            scale: 1.05,
            duration: 0.2,
            stagger: {
                amount: 0.3,
                ease: "power2.inOut"
            },
            ease: "power2.inOut",
            yoyo: true,
            repeat: 1
        }, "-=0.4");
    }

    /**
     * Smooth page transition animations
     * @param {string} direction - Transition direction ('in' or 'out')
     * @param {Function} callback - Callback function after transition
     */
    animatePageTransition(direction = 'in', callback = null) {
        const tl = gsap.timeline({
            onComplete: callback
        });

        if (direction === 'out') {
            // Animate out
            const cards = this.gridElement.querySelectorAll('.modern-article-card, .article-card');
            tl.to(cards, {
                opacity: 0,
                y: -50,
                scale: 0.95,
                duration: 0.4,
                stagger: {
                    amount: 0.2,
                    ease: "power2.in"
                },
                ease: "power2.in"
            });
        } else {
            // Animate in (use the selected animation type)
            this.animateCardsEntrance(this.options.animationType || 'cascade');
        }
    }

    /**
     * Add loading state animations and skeleton loaders
     * @param {boolean} show - Whether to show or hide loading state
     */
    toggleLoadingState(show = true) {
        if (!this.gridElement) return;

        if (show) {
            this.showLoadingState();
        } else {
            // Fade out skeleton loaders
            const skeletons = this.gridElement.querySelectorAll('.modern-article-skeleton');
            if (skeletons.length > 0) {
                gsap.to(skeletons, {
                    opacity: 0,
                    scale: 0.95,
                    duration: 0.3,
                    stagger: 0.05,
                    ease: "power2.in",
                    onComplete: () => {
                        this.gridElement.classList.remove('loading-state');
                    }
                });
            }
        }
    }

    /**
     * Update metadata configuration
     * @param {Object} config - New metadata configuration
     */
    updateMetadataConfig(config) {
        this.metadataConfig = { ...this.metadataConfig, ...config };
    }

    /**
     * Update reading time calculation options
     * @param {number} wordsPerMinute - New words per minute rate
     */
    updateReadingSpeed(wordsPerMinute) {
        this.options.wordsPerMinute = wordsPerMinute;
        this.readingTimeCache.clear(); // Clear cache to recalculate
    }

    /**
     * Get article statistics
     * @returns {Object} Statistics about loaded articles
     */
    getArticleStats() {
        const articles = this.gridElement.querySelectorAll('.modern-article-card, .article-card');
        const featuredCount = this.gridElement.querySelectorAll('.modern-article-card.featured').length;
        
        return {
            total: articles.length,
            featured: featuredCount,
            regular: articles.length - featuredCount,
            type: this.articleType
        };
    }

    /**
     * Cleanup method for proper resource management
     */
    destroy() {
        // Clear caches
        this.readingTimeCache.clear();
        
        // Remove event listeners
        const cards = this.gridElement?.querySelectorAll('.modern-article-card');
        cards?.forEach(card => {
            card.removeEventListener('keydown', this.handleKeydown);
        });
        
        // Reset grid element
        if (this.gridElement) {
            this.gridElement.classList.remove('modern-article-grid');
            this.gridElement.innerHTML = '';
        }
        
        this.hasLoaded = false;
    }
}