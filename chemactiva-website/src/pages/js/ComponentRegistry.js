// src/js/ComponentRegistry.js
// Component Registry and Naming Convention Documentation

/**
 * Component Naming Conventions and Structure Registry
 * 
 * This file establishes consistent naming patterns across all product-related components
 * and provides a centralized registry for component management.
 */

export const COMPONENT_SELECTORS = {
    // Product Card Components
    PRODUCT_CARD_ENHANCED: '.product-card-enhanced',
    PRODUCT_CARD_LEGACY: '.product-card:not(.product-card-enhanced)',
    
    // Product Image Components
    PRODUCT_IMAGE_CAROUSEL: '.product-image-carousel-enhanced',
    PRODUCT_IMAGE_SKELETON: '.product-image-skeleton',
    PRODUCT_IMAGE_GALLERY: '.product-image-gallery',
    
    // Product Information Components
    PRODUCT_INFO_ENHANCED: '.product-info-enhanced',
    PRODUCT_INFO_SKELETON: '.product-info-skeleton',
    PRODUCT_HEADER_SECTION: '.product-header-section',
    PRODUCT_TITLE_GROUP: '.product-title-group',
    PRODUCT_CATEGORY_BADGE: '.product-category-badge',
    PRODUCT_BENEFITS_HIGHLIGHT: '.product-benefits-highlight',
    PRODUCT_SUMMARY_SECTION: '.product-summary-section',
    PRODUCT_DESCRIPTION: '.product-description',
    PRODUCT_HIGHLIGHTS: '.product-highlights',
    PRODUCT_SPECS_PREVIEW: '.product-specs-preview',
    
    // Product Interaction Components
    PRODUCT_CONTACT_SECTION: '.product-contact-section',
    CONTACT_ACTIONS_GROUP: '.contact-actions-group',
    CONTACT_BUTTON: '.contact-button',
    CONTACT_BUTTON_PRIMARY: '.contact-button.primary',
    RESOURCE_LINKS: '.resource-links',
    RESOURCE_LINK: '.resource-link',
    
    // Product Benefits Components
    KEY_BENEFITS_GRID: '.key-benefits-grid',
    KEY_BENEFIT_ITEM: '.key-benefit-item',
    BENEFIT_ICON: '.benefit-icon',
    BENEFIT_TEXT: '.benefit-text',
    BENEFITS_TITLE: '.benefits-title',
    
    // Product Specifications Components
    SPEC_ITEM: '.spec-item',
    SPEC_VALUE: '.spec-value',
    SPEC_LABEL: '.spec-label',
    
    // Product Accordion Components
    PRODUCT_SPECS_ACCORDION: '.product-specs-accordion',
    ACCORDION_ITEM: '.accordion-item',
    ACCORDION_HEADER: '.accordion-header',
    ACCORDION_CONTENT: '.accordion-content',
    ACCORDION_ICON: '.accordion-icon',
    
    // Gallery Components
    GALLERY_MAIN_IMAGE: '.gallery-main-image',
    GALLERY_IMAGE: '.gallery-image',
    GALLERY_NAV: '.gallery-nav',
    GALLERY_PREV: '.gallery-prev',
    GALLERY_NEXT: '.gallery-next',
    GALLERY_THUMBNAILS: '.gallery-thumbnails',
    GALLERY_THUMBNAIL: '.gallery-thumbnail',
    GALLERY_INDICATORS: '.gallery-indicators',
    GALLERY_INDICATOR: '.gallery-indicator',
    
    // Modal Components
    CONTACT_MODAL: '.contact-modal',
    MODAL_CONTENT: '.modal-content',
    MODAL_HEADER: '.modal-header',
    MODAL_TITLE: '.modal-title',
    MODAL_CLOSE: '.modal-close',
    
    // Form Components
    CONTACT_FORM: '.contact-form',
    FORM_GROUP: '.form-group',
    FORM_LABEL: '.form-label',
    FORM_INPUT: '.form-input',
    FORM_TEXTAREA: '.form-textarea',
    FORM_SUBMIT: '.form-submit',
    
    // Message Components
    SUCCESS_MESSAGE: '.success-message',
    ERROR_MESSAGE: '.error-message',
    SUCCESS_ACTIONS: '.success-actions',
    
    // Skeleton Loading Components
    SKELETON_LINE: '.skeleton-line',
    SKELETON_LINE_TITLE: '.skeleton-line.title',
    SKELETON_LINE_SUBTITLE: '.skeleton-line.subtitle',
    SKELETON_LINE_FEATURE: '.skeleton-line.feature',
    SKELETON_LINE_BUTTON: '.skeleton-line.button',
    
    // Highlight Components
    HIGHLIGHT_TAG: '.highlight-tag',
    
    // Product Inquiry Components
    PRODUCT_INQUIRY_INFO: '.product-inquiry-info',
    INQUIRY_PRODUCT_NAME: '.inquiry-product-name',
    INQUIRY_PRODUCT_DETAILS: '.inquiry-product-details'
};

export const CSS_CLASSES = {
    // State Classes
    ACTIVE: 'active',
    EXPANDED: 'expanded',
    LOADING: 'loading',
    IS_SUBMITTING: 'is-submitting',
    
    // Theme Classes
    DARK_MODE: 'dark-mode',
    
    // Animation Classes
    FADE_IN: 'fade-in',
    FADE_OUT: 'fade-out',
    SLIDE_UP: 'slide-up',
    SLIDE_DOWN: 'slide-down',
    
    // Interaction Classes
    HOVER: 'hover',
    FOCUS: 'focus',
    DISABLED: 'disabled',
    
    // Layout Classes
    HIDDEN: 'hidden',
    VISIBLE: 'visible'
};

export const COMPONENT_EVENTS = {
    // Product Events
    PRODUCT_CTA_CLICK: 'productCTAClick',
    PRODUCT_CONTACT_CLICK: 'productContactClick',
    PRODUCT_CARD_LOADED: 'productCardLoaded',
    PRODUCT_IMAGE_LOADED: 'productImageLoaded',
    
    // Accordion Events
    ACCORDION_TOGGLE: 'accordionToggle',
    ACCORDION_EXPANDED: 'accordionExpanded',
    ACCORDION_COLLAPSED: 'accordionCollapsed',
    
    // Gallery Events
    GALLERY_IMAGE_CHANGED: 'galleryImageChanged',
    GALLERY_AUTOPLAY_STARTED: 'galleryAutoplayStarted',
    GALLERY_AUTOPLAY_PAUSED: 'galleryAutoplayPaused',
    
    // Contact Events
    CONTACT_MODAL_OPENED: 'contactModalOpened',
    CONTACT_MODAL_CLOSED: 'contactModalClosed',
    CONTACT_FORM_SUBMITTED: 'contactFormSubmitted',
    CONTACT_FORM_SUCCESS: 'contactFormSuccess',
    CONTACT_FORM_ERROR: 'contactFormError',
    
    // Theme Events
    THEME_CHANGED: 'themeChanged',
    
    // Resource Events
    RESOURCE_ACCESSED: 'resourceAccessed',
    RESOURCE_DOWNLOADED: 'resourceDownloaded',
    
    // Performance Events
    PERFORMANCE_METRICS_UPDATED: 'performanceMetricsUpdated'
};

export const ANIMATION_CONFIG = {
    // Duration Constants
    DURATION_FAST: 0.3,
    DURATION_MEDIUM: 0.4,
    DURATION_SLOW: 0.6,
    
    // Easing Constants
    EASE_STANDARD: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    EASE_BOUNCE: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    EASE_SMOOTH: 'ease-out',
    EASE_POWER2_OUT: 'power2.out',
    
    // Stagger Constants
    STAGGER_FAST: 0.05,
    STAGGER_MEDIUM: 0.1,
    STAGGER_SLOW: 0.2
};

export const COMPONENT_STATES = {
    // Loading States
    NOT_LOADED: 'not_loaded',
    LOADING: 'loading',
    LOADED: 'loaded',
    ERROR: 'error',
    
    // Visibility States
    HIDDEN: 'hidden',
    VISIBLE: 'visible',
    TRANSITIONING: 'transitioning',
    
    // Interaction States
    IDLE: 'idle',
    HOVER: 'hover',
    ACTIVE: 'active',
    DISABLED: 'disabled',
    
    // Form States
    PRISTINE: 'pristine',
    DIRTY: 'dirty',
    VALID: 'valid',
    INVALID: 'invalid',
    SUBMITTING: 'submitting',
    SUBMITTED: 'submitted'
};

/**
 * Component Registry Class
 * Manages component instances and provides centralized access
 */
export class ComponentRegistry {
    constructor() {
        this.components = new Map();
        this.eventListeners = new Map();
    }

    /**
     * Register a component instance
     * @param {string} name - Component name
     * @param {Object} instance - Component instance
     */
    register(name, instance) {
        if (this.components.has(name)) {
            console.warn(`Component '${name}' is already registered. Overwriting.`);
        }
        this.components.set(name, instance);
    }

    /**
     * Get a registered component
     * @param {string} name - Component name
     * @returns {Object|null} Component instance or null
     */
    get(name) {
        return this.components.get(name) || null;
    }

    /**
     * Unregister a component
     * @param {string} name - Component name
     */
    unregister(name) {
        const component = this.components.get(name);
        if (component && typeof component.cleanup === 'function') {
            component.cleanup();
        }
        this.components.delete(name);
    }

    /**
     * Get all registered components
     * @returns {Map} All registered components
     */
    getAll() {
        return new Map(this.components);
    }

    /**
     * Check if a component is registered
     * @param {string} name - Component name
     * @returns {boolean} True if registered
     */
    has(name) {
        return this.components.has(name);
    }

    /**
     * Clean up all registered components
     */
    cleanup() {
        this.components.forEach((component, name) => {
            if (typeof component.cleanup === 'function') {
                component.cleanup();
            }
        });
        this.components.clear();
        
        // Clean up event listeners
        this.eventListeners.forEach((handler, element) => {
            if (element && element.removeEventListener) {
                element.removeEventListener('click', handler);
                element.removeEventListener('change', handler);
                element.removeEventListener('submit', handler);
            }
        });
        this.eventListeners.clear();
    }

    /**
     * Add global event listener with cleanup tracking
     * @param {Element} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     */
    addEventListener(element, event, handler) {
        element.addEventListener(event, handler);
        this.eventListeners.set(`${element.id || 'anonymous'}-${event}`, { element, event, handler });
    }

    /**
     * Remove tracked event listener
     * @param {Element} element - Target element
     * @param {string} event - Event type
     */
    removeEventListener(element, event) {
        const key = `${element.id || 'anonymous'}-${event}`;
        const listener = this.eventListeners.get(key);
        if (listener) {
            listener.element.removeEventListener(listener.event, listener.handler);
            this.eventListeners.delete(key);
        }
    }
}

// Create global component registry instance
export const componentRegistry = new ComponentRegistry();

// Export utility functions for consistent component behavior
export const ComponentUtils = {
    /**
     * Create a consistent component selector
     * @param {string} baseClass - Base CSS class
     * @param {string} modifier - Optional modifier
     * @returns {string} Complete selector
     */
    createSelector(baseClass, modifier = null) {
        return modifier ? `.${baseClass}.${modifier}` : `.${baseClass}`;
    },

    /**
     * Add consistent state classes
     * @param {Element} element - Target element
     * @param {string} state - State to add
     */
    addState(element, state) {
        if (element && CSS_CLASSES[state.toUpperCase()]) {
            element.classList.add(CSS_CLASSES[state.toUpperCase()]);
        }
    },

    /**
     * Remove consistent state classes
     * @param {Element} element - Target element
     * @param {string} state - State to remove
     */
    removeState(element, state) {
        if (element && CSS_CLASSES[state.toUpperCase()]) {
            element.classList.remove(CSS_CLASSES[state.toUpperCase()]);
        }
    },

    /**
     * Toggle consistent state classes
     * @param {Element} element - Target element
     * @param {string} state - State to toggle
     * @returns {boolean} True if state is now active
     */
    toggleState(element, state) {
        if (element && CSS_CLASSES[state.toUpperCase()]) {
            return element.classList.toggle(CSS_CLASSES[state.toUpperCase()]);
        }
        return false;
    },

    /**
     * Check if element has state
     * @param {Element} element - Target element
     * @param {string} state - State to check
     * @returns {boolean} True if element has state
     */
    hasState(element, state) {
        if (element && CSS_CLASSES[state.toUpperCase()]) {
            return element.classList.contains(CSS_CLASSES[state.toUpperCase()]);
        }
        return false;
    },

    /**
     * Emit consistent component event
     * @param {string} eventName - Event name from COMPONENT_EVENTS
     * @param {Object} detail - Event detail data
     * @param {Element} target - Optional target element
     */
    emitEvent(eventName, detail = {}, target = window) {
        const event = new CustomEvent(eventName, {
            detail,
            bubbles: true,
            cancelable: true
        });
        target.dispatchEvent(event);
    },

    /**
     * Create consistent ARIA attributes
     * @param {Element} element - Target element
     * @param {Object} attributes - ARIA attributes to set
     */
    setAriaAttributes(element, attributes) {
        if (!element) return;
        
        Object.entries(attributes).forEach(([key, value]) => {
            const ariaKey = key.startsWith('aria-') ? key : `aria-${key}`;
            element.setAttribute(ariaKey, value);
        });
    },

    /**
     * Create consistent touch-friendly sizing
     * @param {Element} element - Target element
     * @param {number} minSize - Minimum touch target size (default: 44px)
     */
    makeTouchFriendly(element, minSize = 44) {
        if (!element) return;
        
        element.style.minWidth = `${minSize}px`;
        element.style.minHeight = `${minSize}px`;
        element.style.touchAction = 'manipulation';
        element.style.webkitTapHighlightColor = 'transparent';
    }
};

// Export default registry instance
export default componentRegistry;