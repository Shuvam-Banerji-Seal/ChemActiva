/**
 * UserFeedbackManager - Provides user-friendly error feedback and loading indicators
 * Implements proper loading states, error messages, and retry controls with accessibility support
 */
export default class UserFeedbackManager {
    constructor(options = {}) {
        this.config = {
            enableAccessibility: options.enableAccessibility !== false,
            enableRetryButtons: options.enableRetryButtons !== false,
            enableLoadingIndicators: options.enableLoadingIndicators !== false,
            autoHideDelay: options.autoHideDelay || 5000,
            maxRetryAttempts: options.maxRetryAttempts || 3,
            enableSoundFeedback: options.enableSoundFeedback || false,
            theme: options.theme || 'default',
            ...options
        };

        // Feedback state tracking
        this.activeFeedback = new Map();
        this.loadingIndicators = new Map();
        this.retryCallbacks = new Map();
        this.feedbackHistory = [];
        
        // Accessibility features
        this.announcer = null;
        this.focusManager = null;
        
        // UI templates
        this.templates = {
            loadingIndicator: this.createLoadingTemplate(),
            errorMessage: this.createErrorTemplate(),
            retryButton: this.createRetryTemplate(),
            successMessage: this.createSuccessTemplate()
        };

        this.init();
    }

    init() {
        this.setupAccessibilityFeatures();
        this.setupGlobalStyles();
        this.setupEventListeners();
        
        console.log('[UserFeedbackManager] Initialized with accessibility and retry features');
    }

    setupAccessibilityFeatures() {
        if (!this.config.enableAccessibility) return;

        // Create screen reader announcer
        this.announcer = document.createElement('div');
        this.announcer.setAttribute('aria-live', 'polite');
        this.announcer.setAttribute('aria-atomic', 'true');
        this.announcer.className = 'sr-only feedback-announcer';
        this.announcer.style.cssText = `
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            white-space: nowrap !important;
            border: 0 !important;
        `;
        document.body.appendChild(this.announcer);

        // Create focus manager for keyboard navigation
        this.focusManager = {
            previousFocus: null,
            trapFocus: (container) => {
                const focusableElements = container.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                container.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        if (e.shiftKey) {
                            if (document.activeElement === firstElement) {
                                lastElement.focus();
                                e.preventDefault();
                            }
                        } else {
                            if (document.activeElement === lastElement) {
                                firstElement.focus();
                                e.preventDefault();
                            }
                        }
                    }
                });

                firstElement?.focus();
            }
        };
    }

    setupGlobalStyles() {
        const styleId = 'user-feedback-styles';
        if (document.getElementById(styleId)) return;

        const styles = document.createElement('style');
        styles.id = styleId;
        styles.textContent = `
            .feedback-container {
                position: relative;
                z-index: 1000;
            }
            
            .loading-indicator {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 12px 16px;
                background: rgba(255, 255, 255, 0.95);
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 14px;
                color: #333;
                backdrop-filter: blur(4px);
            }
            
            .loading-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid #f3f3f3;
                border-top: 2px solid #2c5530;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .error-message {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 16px;
                background: #fff5f5;
                border: 1px solid #fed7d7;
                border-left: 4px solid #e53e3e;
                border-radius: 8px;
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 14px;
                color: #742a2a;
                margin: 8px 0;
            }
            
            .error-icon {
                flex-shrink: 0;
                width: 20px;
                height: 20px;
                background: #e53e3e;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 12px;
                font-weight: bold;
            }
            
            .error-content {
                flex: 1;
            }
            
            .error-title {
                font-weight: 600;
                margin-bottom: 4px;
            }
            
            .error-description {
                margin-bottom: 12px;
                line-height: 1.4;
            }
            
            .error-actions {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .retry-button {
                background: #2c5530;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }
            
            .retry-button:hover {
                background: #1e3a21;
                transform: translateY(-1px);
            }
            
            .retry-button:active {
                transform: translateY(0);
            }
            
            .retry-button:disabled {
                background: #a0a0a0;
                cursor: not-allowed;
                transform: none;
            }
            
            .retry-button:focus {
                outline: 2px solid #2c5530;
                outline-offset: 2px;
            }
            
            .dismiss-button {
                background: transparent;
                color: #666;
                border: 1px solid #d0d0d0;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .dismiss-button:hover {
                background: #f5f5f5;
                border-color: #999;
            }
            
            .success-message {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                background: #f0fff4;
                border: 1px solid #9ae6b4;
                border-left: 4px solid #38a169;
                border-radius: 8px;
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 14px;
                color: #2f855a;
                margin: 8px 0;
            }
            
            .success-icon {
                flex-shrink: 0;
                width: 20px;
                height: 20px;
                background: #38a169;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 12px;
            }
            
            .overlay-feedback {
                position: fixed;
                top: 20px;
                right: 20px;
                max-width: 400px;
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            .inline-feedback {
                margin: 8px 0;
            }
            
            .feedback-progress {
                width: 100%;
                height: 4px;
                background: #e0e0e0;
                border-radius: 2px;
                overflow: hidden;
                margin-top: 8px;
            }
            
            .feedback-progress-bar {
                height: 100%;
                background: #2c5530;
                border-radius: 2px;
                transition: width 0.3s ease;
            }
            
            .network-status {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                color: #666;
                margin-top: 4px;
            }
            
            .network-indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #38a169;
            }
            
            .network-indicator.offline {
                background: #e53e3e;
            }
            
            .network-indicator.slow {
                background: #d69e2e;
            }
            
            @media (max-width: 768px) {
                .overlay-feedback {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }
                
                .error-actions {
                    flex-direction: column;
                }
                
                .retry-button,
                .dismiss-button {
                    width: 100%;
                    justify-content: center;
                }
            }
            
            @media (prefers-reduced-motion: reduce) {
                .loading-spinner {
                    animation: none;
                    border-top-color: #2c5530;
                }
                
                .overlay-feedback {
                    animation: none;
                }
                
                .retry-button:hover {
                    transform: none;
                }
            }
            
            @media (prefers-color-scheme: dark) {
                .loading-indicator {
                    background: rgba(40, 40, 40, 0.95);
                    border-color: #555;
                    color: #e0e0e0;
                }
                
                .error-message {
                    background: #2d1b1b;
                    border-color: #5a2a2a;
                    color: #f7b2b2;
                }
                
                .success-message {
                    background: #1a2e1a;
                    border-color: #2d5a2d;
                    color: #9ae6b4;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    setupEventListeners() {
        // Listen for network status changes
        window.addEventListener('online', () => {
            this.showNetworkStatus('online');
        });

        window.addEventListener('offline', () => {
            this.showNetworkStatus('offline');
        });

        // Listen for escape key to dismiss overlays
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.dismissAllOverlays();
            }
        });
    }

    /**
     * Show loading indicator for an operation
     */
    showLoadingIndicator(operationId, options = {}) {
        const {
            message = 'Loading...',
            container = null,
            position = 'inline',
            showProgress = false,
            progressValue = 0
        } = options;

        const indicator = this.createLoadingIndicator(message, {
            showProgress,
            progressValue
        });

        // Store reference
        this.loadingIndicators.set(operationId, {
            element: indicator,
            container: container,
            position: position,
            startTime: Date.now()
        });

        // Add to DOM
        if (position === 'overlay') {
            indicator.className += ' overlay-feedback';
            document.body.appendChild(indicator);
        } else if (container) {
            indicator.className += ' inline-feedback';
            container.appendChild(indicator);
        }

        // Announce to screen readers
        if (this.config.enableAccessibility) {
            this.announceToScreenReader(`Loading: ${message}`);
        }

        return indicator;
    }

    /**
     * Update loading progress
     */
    updateLoadingProgress(operationId, progress, message = null) {
        const loadingData = this.loadingIndicators.get(operationId);
        if (!loadingData) return;

        const progressBar = loadingData.element.querySelector('.feedback-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
        }

        if (message) {
            const messageElement = loadingData.element.querySelector('.loading-message');
            if (messageElement) {
                messageElement.textContent = message;
            }
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoadingIndicator(operationId) {
        const loadingData = this.loadingIndicators.get(operationId);
        if (!loadingData) return;

        const { element } = loadingData;
        
        // Fade out animation
        element.style.transition = 'opacity 0.3s ease';
        element.style.opacity = '0';
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);

        this.loadingIndicators.delete(operationId);
    }

    /**
     * Show error message with retry options
     */
    showErrorMessage(errorId, options = {}) {
        const {
            title = 'Something went wrong',
            message = 'An error occurred while loading content.',
            type = 'error',
            container = null,
            position = 'inline',
            enableRetry = this.config.enableRetryButtons,
            retryCallback = null,
            retryAttempts = 0,
            maxRetries = this.config.maxRetryAttempts,
            autoHide = false,
            networkStatus = null
        } = options;

        const errorElement = this.createErrorMessage({
            title,
            message,
            type,
            enableRetry: enableRetry && retryAttempts < maxRetries,
            retryAttempts,
            maxRetries,
            networkStatus
        });

        // Store retry callback
        if (retryCallback) {
            this.retryCallbacks.set(errorId, retryCallback);
        }

        // Store reference
        this.activeFeedback.set(errorId, {
            element: errorElement,
            container: container,
            position: position,
            type: 'error',
            startTime: Date.now()
        });

        // Add event listeners
        this.setupErrorEventListeners(errorElement, errorId);

        // Add to DOM
        if (position === 'overlay') {
            errorElement.className += ' overlay-feedback';
            document.body.appendChild(errorElement);
            
            // Focus management for accessibility
            if (this.config.enableAccessibility) {
                this.focusManager.previousFocus = document.activeElement;
                this.focusManager.trapFocus(errorElement);
            }
        } else if (container) {
            errorElement.className += ' inline-feedback';
            container.appendChild(errorElement);
        }

        // Announce to screen readers
        if (this.config.enableAccessibility) {
            this.announceToScreenReader(`Error: ${title}. ${message}`);
        }

        // Auto-hide if requested
        if (autoHide) {
            setTimeout(() => {
                this.dismissFeedback(errorId);
            }, this.config.autoHideDelay);
        }

        // Track in history
        this.feedbackHistory.push({
            id: errorId,
            type: 'error',
            title,
            message,
            timestamp: Date.now()
        });

        return errorElement;
    }

    /**
     * Show success message
     */
    showSuccessMessage(successId, options = {}) {
        const {
            message = 'Operation completed successfully',
            container = null,
            position = 'inline',
            autoHide = true
        } = options;

        const successElement = this.createSuccessMessage(message);

        // Store reference
        this.activeFeedback.set(successId, {
            element: successElement,
            container: container,
            position: position,
            type: 'success',
            startTime: Date.now()
        });

        // Add to DOM
        if (position === 'overlay') {
            successElement.className += ' overlay-feedback';
            document.body.appendChild(successElement);
        } else if (container) {
            successElement.className += ' inline-feedback';
            container.appendChild(successElement);
        }

        // Announce to screen readers
        if (this.config.enableAccessibility) {
            this.announceToScreenReader(`Success: ${message}`);
        }

        // Auto-hide
        if (autoHide) {
            setTimeout(() => {
                this.dismissFeedback(successId);
            }, this.config.autoHideDelay);
        }

        return successElement;
    }

    /**
     * Show network status indicator
     */
    showNetworkStatus(status) {
        const statusId = 'network-status';
        
        // Remove existing status
        this.dismissFeedback(statusId);

        // Only show connection restored message, skip offline/slow messages
        if (status === 'online') {
            this.showSuccessMessage(statusId, {
                message: 'Connection restored',
                position: 'overlay',
                autoHide: true
            });
        }
        // Disabled offline and slow connection notifications
        return;
    }

    /**
     * Create loading indicator element
     */
    createLoadingIndicator(message, options = {}) {
        const { showProgress = false, progressValue = 0 } = options;
        
        const container = document.createElement('div');
        container.className = 'loading-indicator feedback-container';
        container.setAttribute('role', 'status');
        container.setAttribute('aria-live', 'polite');

        container.innerHTML = `
            <div class="loading-spinner" aria-hidden="true"></div>
            <div class="loading-message">${message}</div>
            ${showProgress ? `
                <div class="feedback-progress">
                    <div class="feedback-progress-bar" style="width: ${progressValue}%"></div>
                </div>
            ` : ''}
        `;

        return container;
    }

    /**
     * Create error message element
     */
    createErrorMessage(options) {
        const {
            title,
            message,
            type,
            enableRetry,
            retryAttempts,
            maxRetries,
            networkStatus
        } = options;

        const container = document.createElement('div');
        container.className = 'error-message feedback-container';
        container.setAttribute('role', 'alert');
        container.setAttribute('aria-live', 'assertive');

        const retryText = retryAttempts > 0 ? ` (Attempt ${retryAttempts + 1}/${maxRetries})` : '';
        
        container.innerHTML = `
            <div class="error-icon" aria-hidden="true">!</div>
            <div class="error-content">
                <div class="error-title">${title}${retryText}</div>
                <div class="error-description">${message}</div>
                ${networkStatus ? `
                    <div class="network-status">
                        <div class="network-indicator ${networkStatus}"></div>
                        Network: ${networkStatus}
                    </div>
                ` : ''}
                <div class="error-actions">
                    ${enableRetry ? `
                        <button class="retry-button" type="button" data-action="retry">
                            <span aria-hidden="true">↻</span>
                            Try Again
                        </button>
                    ` : ''}
                    <button class="dismiss-button" type="button" data-action="dismiss">
                        Dismiss
                    </button>
                </div>
            </div>
        `;

        return container;
    }

    /**
     * Create success message element
     */
    createSuccessMessage(message) {
        const container = document.createElement('div');
        container.className = 'success-message feedback-container';
        container.setAttribute('role', 'status');
        container.setAttribute('aria-live', 'polite');

        container.innerHTML = `
            <div class="success-icon" aria-hidden="true">✓</div>
            <div class="success-content">${message}</div>
        `;

        return container;
    }

    /**
     * Setup event listeners for error messages
     */
    setupErrorEventListeners(errorElement, errorId) {
        errorElement.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            
            if (action === 'retry') {
                this.handleRetry(errorId);
            } else if (action === 'dismiss') {
                this.dismissFeedback(errorId);
            }
        });

        // Keyboard navigation
        errorElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const action = e.target.dataset.action;
                if (action) {
                    e.preventDefault();
                    e.target.click();
                }
            }
        });
    }

    /**
     * Handle retry button click
     */
    async handleRetry(errorId) {
        const retryCallback = this.retryCallbacks.get(errorId);
        if (!retryCallback) return;

        // Disable retry button
        const feedbackData = this.activeFeedback.get(errorId);
        if (feedbackData) {
            const retryButton = feedbackData.element.querySelector('.retry-button');
            if (retryButton) {
                retryButton.disabled = true;
                retryButton.innerHTML = '<span class="loading-spinner"></span> Retrying...';
            }
        }

        try {
            // Execute retry callback
            await retryCallback();
            
            // Show success message
            this.dismissFeedback(errorId);
            this.showSuccessMessage(`${errorId}_success`, {
                message: 'Operation completed successfully',
                position: feedbackData?.position || 'inline',
                autoHide: true
            });

        } catch (error) {
            // Show updated error message with incremented retry count
            const currentData = this.activeFeedback.get(errorId);
            if (currentData) {
                this.dismissFeedback(errorId);
                
                // Extract retry attempts from current error
                const retryAttempts = (currentData.retryAttempts || 0) + 1;
                
                this.showErrorMessage(errorId, {
                    title: 'Retry failed',
                    message: error.message || 'The operation failed again. Please try again or check your connection.',
                    container: currentData.container,
                    position: currentData.position,
                    retryCallback: retryCallback,
                    retryAttempts: retryAttempts,
                    networkStatus: navigator.onLine ? 'online' : 'offline'
                });
            }
        }
    }

    /**
     * Dismiss specific feedback
     */
    dismissFeedback(feedbackId) {
        const feedbackData = this.activeFeedback.get(feedbackId);
        if (!feedbackData) return;

        const { element, position } = feedbackData;
        
        // Restore focus if this was an overlay
        if (position === 'overlay' && this.config.enableAccessibility && this.focusManager.previousFocus) {
            this.focusManager.previousFocus.focus();
            this.focusManager.previousFocus = null;
        }

        // Fade out animation
        element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        element.style.opacity = '0';
        
        if (position === 'overlay') {
            element.style.transform = 'translateX(100%)';
        }
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, 300);

        // Clean up
        this.activeFeedback.delete(feedbackId);
        this.retryCallbacks.delete(feedbackId);
    }

    /**
     * Dismiss all overlay feedback
     */
    dismissAllOverlays() {
        const overlayFeedback = Array.from(this.activeFeedback.entries())
            .filter(([id, data]) => data.position === 'overlay');

        overlayFeedback.forEach(([id]) => {
            this.dismissFeedback(id);
        });
    }

    /**
     * Announce message to screen readers
     */
    announceToScreenReader(message) {
        if (!this.announcer) return;

        // Clear previous announcement
        this.announcer.textContent = '';
        
        // Add new announcement after a brief delay
        setTimeout(() => {
            this.announcer.textContent = message;
        }, 100);
    }

    /**
     * Create templates for different feedback types
     */
    createLoadingTemplate() {
        return {
            basic: (message) => `
                <div class="loading-spinner" aria-hidden="true"></div>
                <div class="loading-message">${message}</div>
            `,
            withProgress: (message, progress) => `
                <div class="loading-spinner" aria-hidden="true"></div>
                <div class="loading-message">${message}</div>
                <div class="feedback-progress">
                    <div class="feedback-progress-bar" style="width: ${progress}%"></div>
                </div>
            `
        };
    }

    createErrorTemplate() {
        return {
            basic: (title, message) => `
                <div class="error-icon" aria-hidden="true">!</div>
                <div class="error-content">
                    <div class="error-title">${title}</div>
                    <div class="error-description">${message}</div>
                </div>
            `,
            withActions: (title, message, showRetry) => `
                <div class="error-icon" aria-hidden="true">!</div>
                <div class="error-content">
                    <div class="error-title">${title}</div>
                    <div class="error-description">${message}</div>
                    <div class="error-actions">
                        ${showRetry ? '<button class="retry-button" data-action="retry">Try Again</button>' : ''}
                        <button class="dismiss-button" data-action="dismiss">Dismiss</button>
                    </div>
                </div>
            `
        };
    }

    createRetryTemplate() {
        return {
            button: (disabled = false) => `
                <button class="retry-button" type="button" data-action="retry" ${disabled ? 'disabled' : ''}>
                    <span aria-hidden="true">↻</span>
                    Try Again
                </button>
            `,
            withCount: (attempt, max) => `
                <button class="retry-button" type="button" data-action="retry">
                    <span aria-hidden="true">↻</span>
                    Try Again (${attempt}/${max})
                </button>
            `
        };
    }

    createSuccessTemplate() {
        return {
            basic: (message) => `
                <div class="success-icon" aria-hidden="true">✓</div>
                <div class="success-content">${message}</div>
            `
        };
    }

    // Public API methods
    
    /**
     * Get feedback statistics
     */
    getFeedbackStats() {
        return {
            activeIndicators: this.loadingIndicators.size,
            activeFeedback: this.activeFeedback.size,
            totalHistory: this.feedbackHistory.length,
            recentErrors: this.feedbackHistory
                .filter(item => item.type === 'error')
                .slice(-10)
        };
    }

    /**
     * Clear all feedback
     */
    clearAllFeedback() {
        // Clear loading indicators
        this.loadingIndicators.forEach((data, id) => {
            this.hideLoadingIndicator(id);
        });

        // Clear feedback messages
        this.activeFeedback.forEach((data, id) => {
            this.dismissFeedback(id);
        });
    }

    /**
     * Update configuration
     */
    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    /**
     * Cleanup method
     */
    cleanup() {
        this.clearAllFeedback();
        
        if (this.announcer && this.announcer.parentNode) {
            this.announcer.parentNode.removeChild(this.announcer);
        }
        
        // Remove global styles
        const styles = document.getElementById('user-feedback-styles');
        if (styles) {
            styles.parentNode.removeChild(styles);
        }
    }

    // Static factory method
    static create(options = {}) {
        return new UserFeedbackManager(options);
    }
}