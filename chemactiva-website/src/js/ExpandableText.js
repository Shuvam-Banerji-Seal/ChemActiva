// src/js/ExpandableText.js
// Expandable text component with "read more" functionality and smooth transitions

export default class ExpandableText {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            maxLines: 3,
            readMoreText: 'Read more',
            readLessText: 'Read less',
            animationDuration: 300,
            enableAnimation: true,
            truncateWords: false,
            wordLimit: 50,
            ...options
        };
        
        this.isExpanded = false;
        this.originalText = '';
        this.truncatedText = '';
        this.expandButton = null;
        this.textContainer = null;
        
        this.init();
    }

    /**
     * Initialize the expandable text component
     */
    init() {
        if (!this.element) return;
        
        this.originalText = this.element.textContent.trim();
        
        // Don't initialize if text is too short
        if (this.shouldTruncate()) {
            this.setupExpandableText();
        }
    }

    /**
     * Check if text should be truncated
     * @returns {boolean} Whether text needs truncation
     */
    shouldTruncate() {
        if (this.options.truncateWords) {
            const wordCount = this.originalText.split(/\s+/).length;
            return wordCount > this.options.wordLimit;
        }
        
        // Create a temporary element to measure line height
        const tempElement = document.createElement('div');
        tempElement.style.cssText = `
            position: absolute;
            visibility: hidden;
            width: ${this.element.offsetWidth}px;
            font-family: ${getComputedStyle(this.element).fontFamily};
            font-size: ${getComputedStyle(this.element).fontSize};
            line-height: ${getComputedStyle(this.element).lineHeight};
            word-wrap: break-word;
        `;
        tempElement.textContent = this.originalText;
        document.body.appendChild(tempElement);
        
        const lineHeight = parseInt(getComputedStyle(tempElement).lineHeight);
        const totalHeight = tempElement.offsetHeight;
        const lineCount = Math.ceil(totalHeight / lineHeight);
        
        document.body.removeChild(tempElement);
        
        return lineCount > this.options.maxLines;
    }

    /**
     * Setup the expandable text structure
     */
    setupExpandableText() {
        // Clear existing content
        this.element.innerHTML = '';
        
        // Create text container
        this.textContainer = document.createElement('span');
        this.textContainer.className = 'expandable-text-content';
        
        // Create expand button
        this.expandButton = document.createElement('button');
        this.expandButton.className = 'expandable-text-button';
        this.expandButton.type = 'button';
        this.expandButton.setAttribute('aria-expanded', 'false');
        
        // Set initial state
        this.updateContent();
        
        // Add event listeners
        this.expandButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
        });
        
        // Add keyboard support
        this.expandButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                this.toggle();
            }
        });
        
        // Assemble the component
        this.element.appendChild(this.textContainer);
        this.element.appendChild(this.expandButton);
        
        // Add CSS classes for styling
        this.element.classList.add('expandable-text-container');
    }

    /**
     * Get truncated text based on configuration
     * @returns {string} Truncated text
     */
    getTruncatedText() {
        if (this.options.truncateWords) {
            const words = this.originalText.split(/\s+/);
            return words.slice(0, this.options.wordLimit).join(' ') + '...';
        }
        
        // Use CSS line clamping approach for line-based truncation
        return this.originalText;
    }

    /**
     * Update content based on current state
     */
    updateContent() {
        if (this.isExpanded) {
            this.textContainer.textContent = this.originalText;
            this.expandButton.textContent = this.options.readLessText;
            this.expandButton.setAttribute('aria-expanded', 'true');
            this.element.classList.add('expanded');
            this.element.classList.remove('collapsed');
        } else {
            if (this.options.truncateWords) {
                this.textContainer.textContent = this.getTruncatedText();
            } else {
                this.textContainer.textContent = this.originalText;
                this.textContainer.style.webkitLineClamp = this.options.maxLines;
                this.textContainer.style.display = '-webkit-box';
                this.textContainer.style.webkitBoxOrient = 'vertical';
                this.textContainer.style.overflow = 'hidden';
            }
            this.expandButton.textContent = this.options.readMoreText;
            this.expandButton.setAttribute('aria-expanded', 'false');
            this.element.classList.add('collapsed');
            this.element.classList.remove('expanded');
        }
    }

    /**
     * Toggle expanded/collapsed state with animation
     */
    async toggle() {
        if (this.options.enableAnimation) {
            await this.animateToggle();
        } else {
            this.isExpanded = !this.isExpanded;
            this.updateContent();
        }
        
        // Dispatch custom event
        this.element.dispatchEvent(new CustomEvent('expandableTextToggle', {
            detail: {
                isExpanded: this.isExpanded,
                element: this.element
            },
            bubbles: true
        }));
    }

    /**
     * Animate the toggle transition
     * @returns {Promise} Promise that resolves when animation completes
     */
    animateToggle() {
        return new Promise((resolve) => {
            const startHeight = this.textContainer.offsetHeight;
            
            // Toggle state
            this.isExpanded = !this.isExpanded;
            this.updateContent();
            
            // Get end height
            const endHeight = this.textContainer.offsetHeight;
            
            // Reset to start height for animation
            this.textContainer.style.height = `${startHeight}px`;
            this.textContainer.style.overflow = 'hidden';
            
            // Force reflow
            this.textContainer.offsetHeight;
            
            // Animate to end height
            this.textContainer.style.transition = `height ${this.options.animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
            this.textContainer.style.height = `${endHeight}px`;
            
            // Clean up after animation
            setTimeout(() => {
                this.textContainer.style.height = '';
                this.textContainer.style.overflow = '';
                this.textContainer.style.transition = '';
                
                if (!this.isExpanded && !this.options.truncateWords) {
                    this.textContainer.style.webkitLineClamp = this.options.maxLines;
                    this.textContainer.style.display = '-webkit-box';
                    this.textContainer.style.webkitBoxOrient = 'vertical';
                    this.textContainer.style.overflow = 'hidden';
                } else {
                    this.textContainer.style.webkitLineClamp = '';
                    this.textContainer.style.display = '';
                    this.textContainer.style.webkitBoxOrient = '';
                }
                
                resolve();
            }, this.options.animationDuration);
        });
    }

    /**
     * Expand the text
     */
    expand() {
        if (!this.isExpanded) {
            this.toggle();
        }
    }

    /**
     * Collapse the text
     */
    collapse() {
        if (this.isExpanded) {
            this.toggle();
        }
    }

    /**
     * Update the original text content
     * @param {string} newText - New text content
     */
    updateText(newText) {
        this.originalText = newText.trim();
        
        if (this.shouldTruncate()) {
            if (!this.textContainer) {
                this.setupExpandableText();
            } else {
                this.updateContent();
            }
        } else {
            // Text is short enough, remove expandable functionality
            this.destroy();
            this.element.textContent = this.originalText;
        }
    }

    /**
     * Update configuration options
     * @param {Object} newOptions - New options to merge
     */
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        
        if (this.textContainer) {
            this.updateContent();
        }
    }

    /**
     * Get current state
     * @returns {Object} Current state information
     */
    getState() {
        return {
            isExpanded: this.isExpanded,
            originalText: this.originalText,
            truncatedText: this.getTruncatedText(),
            shouldTruncate: this.shouldTruncate()
        };
    }

    /**
     * Destroy the component and clean up
     */
    destroy() {
        if (this.expandButton) {
            this.expandButton.removeEventListener('click', this.toggle);
            this.expandButton.removeEventListener('keydown', this.toggle);
        }
        
        if (this.element) {
            this.element.classList.remove('expandable-text-container', 'expanded', 'collapsed');
            this.element.innerHTML = '';
        }
        
        this.textContainer = null;
        this.expandButton = null;
    }

    /**
     * Static method to create expandable text from selector
     * @param {string} selector - CSS selector for elements
     * @param {Object} options - Configuration options
     * @returns {Array} Array of ExpandableText instances
     */
    static createFromSelector(selector, options = {}) {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements).map(element => new ExpandableText(element, options));
    }

    /**
     * Static method to create expandable text for article abstracts
     * @param {string} selector - CSS selector for abstract elements
     * @param {Object} options - Configuration options
     * @returns {Array} Array of ExpandableText instances
     */
    static createForArticleAbstracts(selector = '.modern-article-abstract', options = {}) {
        const defaultOptions = {
            maxLines: 3,
            readMoreText: 'Read more',
            readLessText: 'Show less',
            animationDuration: 400,
            enableAnimation: true,
            truncateWords: false,
            ...options
        };
        
        return ExpandableText.createFromSelector(selector, defaultOptions);
    }
}