/**
 * AccessibilityManager - Comprehensive accessibility enhancement system
 * Implements keyboard navigation, ARIA labels, screen reader support, and WCAG compliance
 */
export default class AccessibilityManager {
    constructor(options = {}) {
        this.config = {
            enableKeyboardNavigation: options.enableKeyboardNavigation !== false,
            enableARIALabels: options.enableARIALabels !== false,
            enableScreenReaderSupport: options.enableScreenReaderSupport !== false,
            enableFocusManagement: options.enableFocusManagement !== false,
            enableHighContrast: options.enableHighContrast !== false,
            enableReducedMotion: options.enableReducedMotion !== false,
            enableLogging: options.enableLogging !== false,
            focusOutlineColor: options.focusOutlineColor || '#3B82F6',
            skipLinkTarget: options.skipLinkTarget || '#main-content',
            ...options
        };

        this.focusHistory = [];
        this.currentFocusIndex = -1;
        this.keyboardNavigationActive = false;
        this.screenReaderAnnouncements = [];
        this.focusTrap = null;

        this.init();
    }

    init() {
        if (this.config.enableKeyboardNavigation) {
            this.setupKeyboardNavigation();
        }

        if (this.config.enableARIALabels) {
            this.enhanceARIALabels();
        }

        if (this.config.enableScreenReaderSupport) {
            this.setupScreenReaderSupport();
        }

        if (this.config.enableFocusManagement) {
            this.setupFocusManagement();
        }

        this.setupAccessibilityPreferences();
        this.createSkipLinks();
        this.enhanceFormAccessibility();
        this.setupLandmarkNavigation();

        if (this.config.enableLogging) {
            console.log('[AccessibilityManager] Initialized with comprehensive a11y features');
        }
    }

    setupKeyboardNavigation() {
        // Global keyboard event handler
        document.addEventListener('keydown', (event) => {
            this.handleKeyboardNavigation(event);
        });

        // Track when keyboard navigation is being used
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                this.keyboardNavigationActive = true;
                document.body.classList.add('keyboard-navigation');
            }
        });

        // Remove keyboard navigation class on mouse use
        document.addEventListener('mousedown', () => {
            this.keyboardNavigationActive = false;
            document.body.classList.remove('keyboard-navigation');
        });

        // Custom focus styles for keyboard navigation
        this.addFocusStyles();
    }

    handleKeyboardNavigation(event) {
        switch (event.key) {
            case 'Escape':
                this.handleEscapeKey(event);
                break;
            case 'Enter':
            case ' ':
                this.handleActivationKeys(event);
                break;
            case 'ArrowUp':
            case 'ArrowDown':
            case 'ArrowLeft':
            case 'ArrowRight':
                this.handleArrowNavigation(event);
                break;
            case 'Home':
            case 'End':
                this.handleHomeEndNavigation(event);
                break;
            case 'F6':
                this.handleLandmarkNavigation(event);
                break;
        }
    }

    handleEscapeKey(event) {
        // Close modals, dropdowns, etc.
        const activeModal = document.querySelector('.modal.active, .dropdown.open, .menu.open');
        if (activeModal) {
            event.preventDefault();
            this.closeInteractiveElement(activeModal);
        }

        // Exit focus trap
        if (this.focusTrap) {
            this.releaseFocusTrap();
        }
    }

    handleActivationKeys(event) {
        const target = event.target;
        
        // Handle custom interactive elements
        if (target.hasAttribute('role')) {
            const role = target.getAttribute('role');
            
            if (['button', 'menuitem', 'tab', 'option'].includes(role)) {
                event.preventDefault();
                target.click();
            }
        }

        // Handle card-like elements that should be clickable
        if (target.classList.contains('card') || target.closest('.card')) {
            const card = target.classList.contains('card') ? target : target.closest('.card');
            const link = card.querySelector('a');
            if (link) {
                event.preventDefault();
                link.click();
            }
        }
    }

    handleArrowNavigation(event) {
        const target = event.target;
        const parent = target.parentElement;

        // Handle tab navigation
        if (target.getAttribute('role') === 'tab') {
            event.preventDefault();
            this.navigateTabs(target, event.key);
        }

        // Handle menu navigation
        if (target.getAttribute('role') === 'menuitem' || parent.getAttribute('role') === 'menu') {
            event.preventDefault();
            this.navigateMenu(target, event.key);
        }

        // Handle grid/list navigation
        if (target.closest('[role="grid"], .grid, .card-grid')) {
            this.navigateGrid(target, event.key);
        }
    }

    handleHomeEndNavigation(event) {
        const target = event.target;
        const container = target.closest('[role="tablist"], [role="menu"], .grid, .card-grid');
        
        if (container) {
            event.preventDefault();
            const focusableElements = this.getFocusableElements(container);
            
            if (event.key === 'Home') {
                focusableElements[0]?.focus();
            } else if (event.key === 'End') {
                focusableElements[focusableElements.length - 1]?.focus();
            }
        }
    }

    handleLandmarkNavigation(event) {
        event.preventDefault();
        this.navigateToNextLandmark();
    }

    navigateTabs(currentTab, direction) {
        const tablist = currentTab.closest('[role="tablist"]');
        const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
        const currentIndex = tabs.indexOf(currentTab);
        
        let nextIndex;
        if (direction === 'ArrowLeft' || direction === 'ArrowUp') {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        } else {
            nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        }
        
        tabs[nextIndex].focus();
        tabs[nextIndex].click(); // Activate the tab
    }

    navigateMenu(currentItem, direction) {
        const menu = currentItem.closest('[role="menu"]');
        const items = Array.from(menu.querySelectorAll('[role="menuitem"]'));
        const currentIndex = items.indexOf(currentItem);
        
        let nextIndex;
        if (direction === 'ArrowUp') {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        } else if (direction === 'ArrowDown') {
            nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        }
        
        if (nextIndex !== undefined) {
            items[nextIndex].focus();
        }
    }

    navigateGrid(currentElement, direction) {
        const grid = currentElement.closest('[role="grid"], .grid, .card-grid');
        const items = Array.from(grid.querySelectorAll('[tabindex="0"], a, button, [role="button"]'));
        const currentIndex = items.indexOf(currentElement);
        
        if (currentIndex === -1) return;
        
        const computedStyle = window.getComputedStyle(grid);
        const gridTemplateColumns = computedStyle.gridTemplateColumns;
        const columnsCount = gridTemplateColumns.split(' ').length;
        
        let nextIndex;
        switch (direction) {
            case 'ArrowLeft':
                nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                break;
            case 'ArrowRight':
                nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                break;
            case 'ArrowUp':
                nextIndex = currentIndex - columnsCount;
                if (nextIndex < 0) nextIndex = currentIndex;
                break;
            case 'ArrowDown':
                nextIndex = currentIndex + columnsCount;
                if (nextIndex >= items.length) nextIndex = currentIndex;
                break;
        }
        
        if (nextIndex !== undefined && items[nextIndex]) {
            items[nextIndex].focus();
        }
    }

    enhanceARIALabels() {
        // Add missing ARIA labels to images
        const images = document.querySelectorAll('img:not([alt])');
        images.forEach(img => {
            const src = img.src || '';
            const filename = src.split('/').pop() || 'image';
            const altText = this.generateAltText(filename);
            img.setAttribute('alt', altText);
            img.setAttribute('aria-label', altText);
        });

        // Add ARIA labels to buttons without text
        const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
        buttons.forEach(button => {
            if (!button.textContent.trim()) {
                const label = this.generateButtonLabel(button);
                if (label) {
                    button.setAttribute('aria-label', label);
                }
            }
        });

        // Add ARIA labels to links without text
        const links = document.querySelectorAll('a:not([aria-label]):not([aria-labelledby])');
        links.forEach(link => {
            if (!link.textContent.trim()) {
                const label = this.generateLinkLabel(link);
                if (label) {
                    link.setAttribute('aria-label', label);
                }
            }
        });

        // Add ARIA roles to semantic elements
        this.addSemanticRoles();
        
        // Add ARIA expanded states to collapsible elements
        this.addExpandedStates();
        
        // Add ARIA live regions for dynamic content
        this.setupLiveRegions();
    }

    generateAltText(filename) {
        // Convert filename to readable text
        return filename
            .replace(/\.(jpg|jpeg|png|gif|webp|svg)$/i, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    generateButtonLabel(button) {
        // Try to infer button purpose from classes, icons, or context
        const classList = Array.from(button.classList);
        
        if (classList.includes('close')) return 'Close';
        if (classList.includes('menu')) return 'Menu';
        if (classList.includes('search')) return 'Search';
        if (classList.includes('submit')) return 'Submit';
        if (classList.includes('back')) return 'Go back';
        if (classList.includes('next')) return 'Next';
        if (classList.includes('prev') || classList.includes('previous')) return 'Previous';
        
        // Check for icons
        const icon = button.querySelector('i, svg, [class*="icon"]');
        if (icon) {
            const iconClass = icon.className;
            if (iconClass.includes('search')) return 'Search';
            if (iconClass.includes('menu')) return 'Menu';
            if (iconClass.includes('close')) return 'Close';
        }
        
        return 'Button';
    }

    generateLinkLabel(link) {
        const href = link.getAttribute('href') || '';
        
        if (href.includes('mailto:')) return 'Send email';
        if (href.includes('tel:')) return 'Call phone number';
        if (href.includes('download')) return 'Download file';
        if (href.includes('#')) return 'Jump to section';
        
        return 'Link';
    }

    addSemanticRoles() {
        // Add navigation role to nav elements
        const navs = document.querySelectorAll('nav:not([role])');
        navs.forEach(nav => nav.setAttribute('role', 'navigation'));

        // Add main role to main content area
        const main = document.querySelector('main:not([role])');
        if (main) {
            main.setAttribute('role', 'main');
        } else {
            // Try to find main content area
            const mainContent = document.querySelector('#main-content, .main-content, .content-main');
            if (mainContent) {
                mainContent.setAttribute('role', 'main');
            }
        }

        // Add banner role to header
        const header = document.querySelector('header:not([role])');
        if (header) {
            header.setAttribute('role', 'banner');
        }

        // Add contentinfo role to footer
        const footer = document.querySelector('footer:not([role])');
        if (footer) {
            footer.setAttribute('role', 'contentinfo');
        }

        // Add complementary role to sidebars
        const sidebars = document.querySelectorAll('aside:not([role]), .sidebar:not([role])');
        sidebars.forEach(sidebar => sidebar.setAttribute('role', 'complementary'));
    }

    addExpandedStates() {
        // Add expanded states to collapsible elements
        const collapsibles = document.querySelectorAll('[data-toggle], .dropdown-toggle, .menu-toggle');
        collapsibles.forEach(toggle => {
            if (!toggle.hasAttribute('aria-expanded')) {
                toggle.setAttribute('aria-expanded', 'false');
            }
            
            // Set up click handler to update aria-expanded
            toggle.addEventListener('click', () => {
                const expanded = toggle.getAttribute('aria-expanded') === 'true';
                toggle.setAttribute('aria-expanded', !expanded);
            });
        });
    }

    setupLiveRegions() {
        // Create polite live region for non-urgent announcements
        if (!document.getElementById('aria-live-polite')) {
            const politeRegion = document.createElement('div');
            politeRegion.id = 'aria-live-polite';
            politeRegion.setAttribute('aria-live', 'polite');
            politeRegion.setAttribute('aria-atomic', 'true');
            politeRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
            document.body.appendChild(politeRegion);
        }

        // Create assertive live region for urgent announcements
        if (!document.getElementById('aria-live-assertive')) {
            const assertiveRegion = document.createElement('div');
            assertiveRegion.id = 'aria-live-assertive';
            assertiveRegion.setAttribute('aria-live', 'assertive');
            assertiveRegion.setAttribute('aria-atomic', 'true');
            assertiveRegion.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
            document.body.appendChild(assertiveRegion);
        }
    }

    setupScreenReaderSupport() {
        // Add screen reader only text for context
        this.addScreenReaderText();
        
        // Handle form field relationships
        this.enhanceFormRelationships();
        
        // Add skip navigation
        this.enhanceSkipNavigation();
        
        // Handle page title updates for SPA behavior
        this.setupPageTitleUpdates();
    }

    addScreenReaderText() {
        // Add screen reader text to cards
        const cards = document.querySelectorAll('.card, .product-card');
        cards.forEach(card => {
            if (!card.querySelector('.sr-only')) {
                const srText = document.createElement('span');
                srText.className = 'sr-only';
                srText.textContent = 'Card content: ';
                card.insertBefore(srText, card.firstChild);
            }
        });

        // Add screen reader text to external links
        const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="' + window.location.hostname + '"])');
        externalLinks.forEach(link => {
            if (!link.querySelector('.sr-only')) {
                const srText = document.createElement('span');
                srText.className = 'sr-only';
                srText.textContent = ' (opens in new tab)';
                link.appendChild(srText);
                
                // Set target and rel for external links
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    enhanceFormRelationships() {
        // Associate labels with form controls
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            const id = input.id || this.generateId('input');
            input.id = id;
            
            // Find associated label
            let label = document.querySelector(`label[for="${id}"]`);
            if (!label) {
                label = input.closest('label');
            }
            
            if (label && !input.hasAttribute('aria-labelledby')) {
                const labelId = label.id || this.generateId('label');
                label.id = labelId;
                input.setAttribute('aria-labelledby', labelId);
            }
            
            // Add required indicators
            if (input.required && !input.hasAttribute('aria-required')) {
                input.setAttribute('aria-required', 'true');
            }
            
            // Add invalid states
            input.addEventListener('invalid', () => {
                input.setAttribute('aria-invalid', 'true');
            });
            
            input.addEventListener('input', () => {
                if (input.validity.valid) {
                    input.removeAttribute('aria-invalid');
                }
            });
        });
    }

    setupFocusManagement() {
        // Track focus changes
        document.addEventListener('focusin', (event) => {
            this.focusHistory.push(event.target);
            this.currentFocusIndex = this.focusHistory.length - 1;
        });

        // Manage focus for modal dialogs
        this.setupModalFocusManagement();
        
        // Manage focus for single-page app navigation
        this.setupSPAFocusManagement();
    }

    setupModalFocusManagement() {
        // When modal opens, trap focus
        document.addEventListener('modalOpened', (event) => {
            this.trapFocus(event.detail.modal);
        });

        // When modal closes, restore focus
        document.addEventListener('modalClosed', () => {
            this.releaseFocusTrap();
        });
    }

    trapFocus(container) {
        const focusableElements = this.getFocusableElements(container);
        
        if (focusableElements.length === 0) return;
        
        this.focusTrap = {
            container,
            firstElement: focusableElements[0],
            lastElement: focusableElements[focusableElements.length - 1],
            previousFocus: document.activeElement
        };

        // Focus first element
        this.focusTrap.firstElement.focus();

        // Add event listener for tab trapping
        this.trapFocusHandler = (event) => {
            if (event.key === 'Tab') {
                if (event.shiftKey) {
                    if (document.activeElement === this.focusTrap.firstElement) {
                        event.preventDefault();
                        this.focusTrap.lastElement.focus();
                    }
                } else {
                    if (document.activeElement === this.focusTrap.lastElement) {
                        event.preventDefault();
                        this.focusTrap.firstElement.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', this.trapFocusHandler);
    }

    releaseFocusTrap() {
        if (this.focusTrap) {
            // Remove event listener
            document.removeEventListener('keydown', this.trapFocusHandler);
            
            // Restore previous focus
            if (this.focusTrap.previousFocus) {
                this.focusTrap.previousFocus.focus();
            }
            
            this.focusTrap = null;
        }
    }

    getFocusableElements(container) {
        const focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[role="button"]:not([disabled])',
            '[role="link"]',
            '[role="menuitem"]',
            '[role="tab"]'
        ].join(',');
        
        return Array.from(container.querySelectorAll(focusableSelectors))
            .filter(el => !el.hasAttribute('inert') && this.isVisible(el));
    }

    isVisible(element) {
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               element.offsetWidth > 0 && 
               element.offsetHeight > 0;
    }

    createSkipLinks() {
        // Create skip link container
        if (!document.getElementById('skip-links')) {
            const skipContainer = document.createElement('div');
            skipContainer.id = 'skip-links';
            skipContainer.className = 'skip-links';
            
            const skipToMain = document.createElement('a');
            skipToMain.href = this.config.skipLinkTarget;
            skipToMain.textContent = 'Skip to main content';
            skipToMain.className = 'skip-link';
            
            const skipToNav = document.createElement('a');
            skipToNav.href = '#navigation';
            skipToNav.textContent = 'Skip to navigation';
            skipToNav.className = 'skip-link';
            
            skipContainer.appendChild(skipToMain);
            skipContainer.appendChild(skipToNav);
            
            // Insert at the beginning of body
            document.body.insertBefore(skipContainer, document.body.firstChild);
            
            // Add styles
            this.addSkipLinkStyles();
        }
    }

    addSkipLinkStyles() {
        if (!document.getElementById('skip-link-styles')) {
            const styles = document.createElement('style');
            styles.id = 'skip-link-styles';
            styles.textContent = `
                .skip-links {
                    position: absolute;
                    top: -100px;
                    left: 0;
                    z-index: 10000;
                }
                
                .skip-link {
                    position: absolute;
                    top: -100px;
                    left: 0;
                    background: ${this.config.focusOutlineColor};
                    color: white;
                    padding: 8px 16px;
                    text-decoration: none;
                    border-radius: 0 0 4px 0;
                    font-weight: bold;
                    transition: top 0.3s ease;
                }
                
                .skip-link:focus {
                    top: 0;
                }
                
                .skip-link:focus + .skip-link {
                    top: 40px;
                }
            `;
            document.head.appendChild(styles);
        }
    }

    addFocusStyles() {
        if (!document.getElementById('keyboard-focus-styles')) {
            const styles = document.createElement('style');
            styles.id = 'keyboard-focus-styles';
            styles.textContent = `
                .keyboard-navigation *:focus {
                    outline: 2px solid ${this.config.focusOutlineColor} !important;
                    outline-offset: 2px !important;
                }
                
                .keyboard-navigation .card:focus,
                .keyboard-navigation [role="button"]:focus,
                .keyboard-navigation [role="tab"]:focus {
                    box-shadow: 0 0 0 3px ${this.config.focusOutlineColor}40 !important;
                }
            `;
            document.head.appendChild(styles);
        }
    }

    setupAccessibilityPreferences() {
        // Respect user's reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.body.classList.add('reduced-motion');
        }

        // Respect user's high contrast preference
        if (window.matchMedia('(prefers-contrast: high)').matches) {
            document.body.classList.add('high-contrast');
        }

        // Respect user's color scheme preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
        }
    }

    // Public API methods
    announceToScreenReader(message, priority = 'polite') {
        const regionId = priority === 'assertive' ? 'aria-live-assertive' : 'aria-live-polite';
        const region = document.getElementById(regionId);
        
        if (region) {
            // Clear previous message
            region.textContent = '';
            
            // Add new message after a brief delay to ensure it's announced
            setTimeout(() => {
                region.textContent = message;
                this.screenReaderAnnouncements.push({
                    message,
                    priority,
                    timestamp: Date.now()
                });
            }, 100);
        }
    }

    generateId(prefix = 'element') {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    }

    enhanceFormAccessibility() {
        // Add form error announcements
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (event) => {
                const errors = form.querySelectorAll('[aria-invalid="true"], .error');
                if (errors.length > 0) {
                    event.preventDefault();
                    this.announceToScreenReader(`Form has ${errors.length} error${errors.length === 1 ? '' : 's'}. Please review and correct.`, 'assertive');
                    errors[0].focus();
                }
            });
        });
    }

    setupLandmarkNavigation() {
        const landmarks = document.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], header, nav, main, aside, footer');
        this.landmarks = Array.from(landmarks);
        this.currentLandmarkIndex = -1;
    }

    navigateToNextLandmark() {
        if (this.landmarks.length === 0) return;
        
        this.currentLandmarkIndex = (this.currentLandmarkIndex + 1) % this.landmarks.length;
        const landmark = this.landmarks[this.currentLandmarkIndex];
        
        // Make landmark focusable temporarily
        const originalTabIndex = landmark.getAttribute('tabindex');
        landmark.setAttribute('tabindex', '-1');
        landmark.focus();
        
        // Announce landmark
        const role = landmark.getAttribute('role') || landmark.tagName.toLowerCase();
        const label = landmark.getAttribute('aria-label') || this.getLandmarkLabel(role);
        this.announceToScreenReader(`Navigated to ${label}`, 'polite');
        
        // Restore original tabindex
        if (originalTabIndex !== null) {
            landmark.setAttribute('tabindex', originalTabIndex);
        } else {
            landmark.removeAttribute('tabindex');
        }
    }

    getLandmarkLabel(role) {
        const labels = {
            banner: 'header',
            navigation: 'navigation menu',
            main: 'main content',
            complementary: 'sidebar',
            contentinfo: 'footer',
            header: 'header',
            nav: 'navigation',
            aside: 'sidebar',
            footer: 'footer'
        };
        
        return labels[role] || role;
    }

    closeInteractiveElement(element) {
        element.classList.remove('active', 'open');
        element.setAttribute('aria-expanded', 'false');
        
        // Focus the trigger element if available
        const trigger = document.querySelector(`[aria-controls="${element.id}"]`);
        if (trigger) {
            trigger.focus();
        }
    }

    setupPageTitleUpdates() {
        // For single-page applications, update page title and announce page changes
        const originalTitle = document.title;
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.target === document.head) {
                    const titleElement = document.querySelector('title');
                    if (titleElement && titleElement.textContent !== originalTitle) {
                        this.announceToScreenReader(`Page changed to ${titleElement.textContent}`, 'polite');
                    }
                }
            });
        });
        
        observer.observe(document.head, { childList: true, subtree: true });
    }

    setupSPAFocusManagement() {
        // For single-page app navigation, focus the main content
        window.addEventListener('popstate', () => {
            const mainContent = document.querySelector('[role="main"], main, #main-content');
            if (mainContent) {
                mainContent.setAttribute('tabindex', '-1');
                mainContent.focus();
                mainContent.removeAttribute('tabindex');
            }
        });
    }

    enhanceSkipNavigation() {
        // Handle skip link activation
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('skip-link')) {
                const targetId = event.target.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                if (target) {
                    target.setAttribute('tabindex', '-1');
                    target.focus();
                    target.removeAttribute('tabindex');
                }
            }
        });
    }

    // Utility methods
    getAccessibilityReport() {
        return {
            keyboardNavigationEnabled: this.config.enableKeyboardNavigation,
            ariaLabelsEnhanced: this.config.enableARIALabels,
            screenReaderSupported: this.config.enableScreenReaderSupport,
            focusManagementEnabled: this.config.enableFocusManagement,
            announcements: this.screenReaderAnnouncements,
            landmarksCount: this.landmarks?.length || 0,
            focusHistoryLength: this.focusHistory.length
        };
    }

    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    destroy() {
        // Clean up event listeners and modifications
        if (this.trapFocusHandler) {
            document.removeEventListener('keydown', this.trapFocusHandler);
        }
        
        this.releaseFocusTrap();
    }

    // Static factory method
    static create(options = {}) {
        return new AccessibilityManager(options);
    }
}