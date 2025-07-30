// src/js/ErrorHandler.js
// Comprehensive error handling utility for product page components
import ErrorRecoveryManager from './ErrorRecoveryManager.js';
import UserFeedbackManager from './UserFeedbackManager.js';

export default class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.retryAttempts = new Map();
        this.fallbackImages = new Map();
        this.networkStatus = 'online';
        this.maxRetries = 3;
        this.retryDelay = 1000; // Base delay in ms
        this.isInitialized = false;
        
        // Configuration
        this.config = {
            enableLogging: true,
            enableRetry: true,
            enableFallbacks: true,
            maxErrorLogSize: 100,
            fallbackImagePath: '/assets/images/placeholder-product.jpg',
            networkCheckInterval: 5000, // 5 seconds
            errorReportingEndpoint: null // Can be set for remote error reporting
        };

        // Initialize enhanced error recovery and user feedback systems
        this.errorRecoveryManager = new ErrorRecoveryManager({
            maxRetries: this.maxRetries,
            baseRetryDelay: this.retryDelay,
            enableLogging: this.config.enableLogging
        });

        this.userFeedbackManager = new UserFeedbackManager({
            enableAccessibility: true,
            enableRetryButtons: this.config.enableRetry,
            enableLoadingIndicators: true,
            maxRetryAttempts: this.maxRetries
        });
        
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.setupGlobalErrorHandling();
        this.setupNetworkMonitoring();
        this.setupFallbackImages();
        this.isInitialized = true;
        
        console.log('ErrorHandler initialized');
    }

    setupGlobalErrorHandling() {
        // Handle uncaught JavaScript errors
        window.addEventListener('error', (event) => {
            this.logError('JavaScript Error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.stack
            });
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError('Unhandled Promise Rejection', {
                reason: event.reason,
                promise: event.promise
            });
        });

        // Handle resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleResourceError(event);
            }
        }, true);
    }

    setupNetworkMonitoring() {
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.networkStatus = 'online';
            console.log('Network connection restored');
            this.retryFailedOperations();
        });

        window.addEventListener('offline', () => {
            this.networkStatus = 'offline';
            console.warn('Network connection lost');
        });

        // Monitor connection quality if available
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            const updateConnectionStatus = () => {
                this.networkStatus = {
                    online: navigator.onLine,
                    effectiveType: connection.effectiveType,
                    downlink: connection.downlink,
                    rtt: connection.rtt
                };
            };
            
            connection.addEventListener('change', updateConnectionStatus);
            updateConnectionStatus();
        }
    }

    setupFallbackImages() {
        // Define fallback images for different product types
        this.fallbackImages.set('domestic-oil-spill-kit', '/assets/images/products/fallback-domestic.jpg');
        this.fallbackImages.set('marine-oil-spill-kit', '/assets/images/products/fallback-marine.jpg');
        this.fallbackImages.set('cellulose-nanocrystals', '/assets/images/products/fallback-cellulose.jpg');
        this.fallbackImages.set('default', this.config.fallbackImagePath);
    }

    // Enhanced image loading error handling with comprehensive recovery and user feedback
    async handleImageError(imageElement, options = {}) {
        const {
            maxRetries = this.maxRetries,
            retryDelay = this.retryDelay,
            fallbackSrc = null,
            productType = 'default',
            onRetry = null,
            onFallback = null,
            onFinalFailure = null,
            showUserFeedback = true,
            container = null
        } = options;

        const originalSrc = imageElement.src || imageElement.dataset.src;
        const errorId = `image_error_${this.generateErrorId(originalSrc)}`;
        
        // Show loading indicator if user feedback is enabled
        if (showUserFeedback) {
            this.userFeedbackManager.showLoadingIndicator(errorId, {
                message: 'Loading image...',
                container: container || imageElement.parentElement,
                position: 'inline'
            });
        }

        try {
            // Use ErrorRecoveryManager for comprehensive recovery
            const recoveryResult = await this.errorRecoveryManager.recover(
                new Error(`Failed to load image: ${originalSrc}`),
                'image',
                originalSrc,
                {
                    originalElement: imageElement,
                    productType: productType,
                    fallbackSrc: fallbackSrc,
                    onRetry: onRetry,
                    onFallback: onFallback
                }
            );

            // Hide loading indicator
            if (showUserFeedback) {
                this.userFeedbackManager.hideLoadingIndicator(errorId);
            }

            // Handle successful recovery
            if (recoveryResult && recoveryResult.element) {
                if (recoveryResult.fallback) {
                    imageElement.classList.add('fallback-image');
                }
                
                if (recoveryResult.element !== imageElement) {
                    imageElement.parentNode.replaceChild(recoveryResult.element, imageElement);
                }

                // Show success message for fallback usage
                if (showUserFeedback && recoveryResult.fallback) {
                    this.userFeedbackManager.showSuccessMessage(`${errorId}_success`, {
                        message: 'Alternative image loaded',
                        container: container || recoveryResult.element.parentElement,
                        position: 'inline',
                        autoHide: true
                    });
                }

                if (onFallback && recoveryResult.fallback) {
                    onFallback(recoveryResult.url || recoveryResult.text);
                }

                return recoveryResult;
            }

        } catch (recoveryError) {
            // Hide loading indicator
            if (showUserFeedback) {
                this.userFeedbackManager.hideLoadingIndicator(errorId);
            }

            // Show error message with retry option
            if (showUserFeedback) {
                this.userFeedbackManager.showErrorMessage(errorId, {
                    title: 'Image Loading Failed',
                    message: 'Unable to load the image. You can try again or continue without it.',
                    container: container || imageElement.parentElement,
                    position: 'inline',
                    enableRetry: true,
                    retryCallback: () => this.handleImageError(imageElement, options),
                    networkStatus: this.isNetworkAvailable() ? 'online' : 'offline'
                });
            }

            // Apply final fallback
            const placeholder = this.createImagePlaceholder(imageElement);
            if (placeholder && imageElement.parentNode) {
                imageElement.parentNode.replaceChild(placeholder, imageElement);
            }

            if (onFinalFailure) {
                onFinalFailure(imageElement);
            }

            throw recoveryError;
        }
    }

    async retryImageLoad(imageElement, retryKey, currentRetries, options = {}) {
        const { retryDelay, onRetry } = options;
        
        // Increment retry count
        this.retryAttempts.set(retryKey, currentRetries + 1);
        
        // Calculate exponential backoff delay
        const delay = retryDelay * Math.pow(2, currentRetries);
        
        console.log(`Retrying image load (attempt ${currentRetries + 1}) after ${delay}ms`);
        
        if (onRetry) {
            onRetry(currentRetries + 1, delay);
        }

        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                try {
                    const success = await this.loadImageWithValidation(imageElement);
                    if (success) {
                        // Reset retry count on success
                        this.retryAttempts.delete(retryKey);
                        resolve(true);
                    } else {
                        reject(new Error('Image validation failed'));
                    }
                } catch (error) {
                    reject(error);
                }
            }, delay);
        });
    }

    async loadImageWithValidation(imageElement) {
        const src = imageElement.src || imageElement.dataset.src;
        
        return new Promise((resolve) => {
            const testImage = new Image();
            
            testImage.onload = () => {
                // Validate image dimensions and file size
                if (testImage.naturalWidth > 0 && testImage.naturalHeight > 0) {
                    imageElement.src = src;
                    resolve(true);
                } else {
                    resolve(false);
                }
            };
            
            testImage.onerror = () => {
                resolve(false);
            };
            
            // Set timeout for slow loading images
            setTimeout(() => {
                resolve(false);
            }, 10000); // 10 second timeout
            
            testImage.src = src;
        });
    }

    async loadFallbackImage(imageElement, fallbackSrc, onFallback) {
        console.log(`Loading fallback image: ${fallbackSrc}`);
        
        if (onFallback) {
            onFallback(fallbackSrc);
        }

        try {
            const success = await this.loadImageWithValidation({
                src: fallbackSrc,
                dataset: { src: fallbackSrc }
            });
            
            if (success) {
                imageElement.src = fallbackSrc;
                imageElement.classList.add('fallback-image');
                return true;
            }
        } catch (error) {
            console.warn('Fallback image also failed to load:', error);
        }
        
        return false;
    }

    handleFinalImageFailure(imageElement, onFinalFailure) {
        console.warn('All image loading attempts failed, applying final fallback');
        
        // Create placeholder element
        const placeholder = this.createImagePlaceholder(imageElement);
        
        if (placeholder) {
            imageElement.parentNode.replaceChild(placeholder, imageElement);
        } else {
            // Hide the image container
            imageElement.style.display = 'none';
            imageElement.setAttribute('aria-hidden', 'true');
        }
        
        if (onFinalFailure) {
            onFinalFailure(imageElement);
        }
    }

    createImagePlaceholder(originalImage) {
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder error-fallback';
        placeholder.style.cssText = `
            width: ${originalImage.width || '300'}px;
            height: ${originalImage.height || '200'}px;
            background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px dashed #ccc;
            border-radius: 8px;
            color: #666;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            text-align: center;
            position: relative;
        `;
        
        placeholder.innerHTML = `
            <div>
                <div style="font-size: 24px; margin-bottom: 8px;">📷</div>
                <div>Image unavailable</div>
                <div style="font-size: 12px; margin-top: 4px; opacity: 0.7;">
                    ${this.isNetworkAvailable() ? 'Loading failed' : 'Check connection'}
                </div>
            </div>
        `;
        
        // Copy accessibility attributes
        if (originalImage.alt) {
            placeholder.setAttribute('aria-label', `Image placeholder: ${originalImage.alt}`);
        }
        
        return placeholder;
    }

    // JavaScript error handling with graceful degradation
    handleJavaScriptError(error, context = {}) {
        this.logError('JavaScript Execution Error', {
            message: error.message,
            stack: error.stack,
            context: context
        });

        // Provide graceful degradation based on error type
        if (error.name === 'TypeError' && error.message.includes('Cannot read property')) {
            return this.handlePropertyAccessError(error, context);
        }
        
        if (error.name === 'ReferenceError') {
            return this.handleReferenceError(error, context);
        }
        
        // Generic error handling
        return this.handleGenericError(error, context);
    }

    handlePropertyAccessError(error, context) {
        console.warn('Property access error detected, applying safe defaults');
        
        // Return safe default values for common property access patterns
        const safeDefaults = {
            length: 0,
            textContent: '',
            innerHTML: '',
            style: {},
            classList: { add: () => {}, remove: () => {}, toggle: () => {} },
            addEventListener: () => {},
            removeEventListener: () => {}
        };
        
        return safeDefaults;
    }

    handleReferenceError(error, context) {
        console.warn('Reference error detected, checking for missing dependencies');
        
        // Check for common missing dependencies
        const missingDeps = [];
        
        if (typeof IntersectionObserver === 'undefined') {
            missingDeps.push('IntersectionObserver');
        }
        
        if (typeof PerformanceObserver === 'undefined') {
            missingDeps.push('PerformanceObserver');
        }
        
        if (missingDeps.length > 0) {
            console.warn(`Missing browser APIs: ${missingDeps.join(', ')}`);
            return this.loadPolyfills(missingDeps);
        }
        
        return null;
    }

    handleGenericError(error, context) {
        // Emit error event for external handling
        window.dispatchEvent(new CustomEvent('productPageError', {
            detail: {
                error: error,
                context: context,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                url: window.location.href
            }
        }));
        
        return null;
    }

    // Enhanced network error handling with comprehensive recovery and user feedback
    async handleNetworkError(request, options = {}) {
        const {
            maxRetries = this.maxRetries,
            retryDelay = this.retryDelay,
            onRetry = null,
            onFinalFailure = null,
            showUserFeedback = true,
            container = null
        } = options;

        const requestUrl = request.url || request;
        const errorId = `network_error_${this.generateErrorId(requestUrl)}`;
        
        // Show loading indicator if user feedback is enabled
        if (showUserFeedback) {
            this.userFeedbackManager.showLoadingIndicator(errorId, {
                message: 'Loading content...',
                container: container,
                position: container ? 'inline' : 'overlay'
            });
        }

        try {
            // Use ErrorRecoveryManager for comprehensive network recovery
            const recoveryResult = await this.errorRecoveryManager.recover(
                new Error(`Network request failed: ${requestUrl}`),
                'network',
                request,
                {
                    onRetry: onRetry,
                    onFinalFailure: onFinalFailure
                }
            );

            // Hide loading indicator
            if (showUserFeedback) {
                this.userFeedbackManager.hideLoadingIndicator(errorId);
            }

            // Show success message if recovery used fallback
            if (showUserFeedback && recoveryResult && recoveryResult.fallback) {
                this.userFeedbackManager.showSuccessMessage(`${errorId}_success`, {
                    message: 'Content loaded from cache',
                    container: container,
                    position: container ? 'inline' : 'overlay',
                    autoHide: true
                });
            }

            return recoveryResult;

        } catch (recoveryError) {
            // Hide loading indicator
            if (showUserFeedback) {
                this.userFeedbackManager.hideLoadingIndicator(errorId);
            }

            // Show error message with retry option
            if (showUserFeedback) {
                this.userFeedbackManager.showErrorMessage(errorId, {
                    title: 'Network Error',
                    message: 'Unable to load content. Please check your connection and try again.',
                    container: container,
                    position: container ? 'inline' : 'overlay',
                    enableRetry: true,
                    retryCallback: () => this.handleNetworkError(request, options),
                    networkStatus: this.isNetworkAvailable() ? 'online' : 'offline'
                });
            }

            if (onFinalFailure) {
                onFinalFailure(request);
            }

            throw recoveryError;
        }
    }

    // Component interaction error handling
    handleInteractionError(component, action, error, fallbackAction = null) {
        this.logError('Interaction Error', {
            component: component.constructor.name,
            action: action,
            error: error.message,
            stack: error.stack
        });

        // Try fallback action if provided
        if (fallbackAction && typeof fallbackAction === 'function') {
            try {
                return fallbackAction();
            } catch (fallbackError) {
                console.warn('Fallback action also failed:', fallbackError);
            }
        }

        // Disable the problematic component gracefully
        this.disableComponent(component, action);
    }

    disableComponent(component, action) {
        console.warn(`Disabling component interaction: ${component.constructor.name}.${action}`);
        
        // Add error state class if component has an element
        if (component.container || component.element) {
            const element = component.container || component.element;
            element.classList.add('component-error');
            element.setAttribute('aria-disabled', 'true');
            
            // Add visual indicator
            const errorIndicator = document.createElement('div');
            errorIndicator.className = 'error-indicator';
            errorIndicator.innerHTML = '⚠️ Feature temporarily unavailable';
            errorIndicator.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 193, 7, 0.9);
                color: #856404;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 1000;
                pointer-events: none;
            `;
            
            element.style.position = 'relative';
            element.appendChild(errorIndicator);
        }
    }

    // Utility methods
    isNetworkAvailable() {
        if (typeof this.networkStatus === 'object') {
            return this.networkStatus.online;
        }
        return this.networkStatus === 'online' && navigator.onLine;
    }

    getFallbackImage(productType) {
        return this.fallbackImages.get(productType) || this.fallbackImages.get('default');
    }

    generateErrorId(input) {
        // Generate a unique error ID based on input
        let hash = 0;
        const str = typeof input === 'string' ? input : JSON.stringify(input);
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
    }

    retryFailedOperations() {
        console.log('Retrying failed operations after network restoration');
        
        // Clear retry counts to allow fresh attempts
        this.retryAttempts.clear();
        
        // Emit event for components to retry their operations
        window.dispatchEvent(new CustomEvent('networkRestored', {
            detail: { timestamp: Date.now() }
        }));
    }

    async loadPolyfills(missingDeps) {
        console.log('Loading polyfills for missing dependencies:', missingDeps);
        
        const polyfillPromises = [];
        
        if (missingDeps.includes('IntersectionObserver')) {
            polyfillPromises.push(this.loadIntersectionObserverPolyfill());
        }
        
        if (missingDeps.includes('PerformanceObserver')) {
            polyfillPromises.push(this.loadPerformanceObserverPolyfill());
        }
        
        try {
            await Promise.all(polyfillPromises);
            console.log('Polyfills loaded successfully');
            return true;
        } catch (error) {
            console.error('Failed to load polyfills:', error);
            return false;
        }
    }

    async loadIntersectionObserverPolyfill() {
        if (typeof IntersectionObserver !== 'undefined') return;
        
        // Simple IntersectionObserver polyfill
        window.IntersectionObserver = class {
            constructor(callback, options = {}) {
                this.callback = callback;
                this.options = options;
                this.elements = new Set();
            }
            
            observe(element) {
                this.elements.add(element);
                // Simulate intersection for all elements
                setTimeout(() => {
                    this.callback([{
                        target: element,
                        isIntersecting: true,
                        intersectionRatio: 1
                    }]);
                }, 100);
            }
            
            unobserve(element) {
                this.elements.delete(element);
            }
            
            disconnect() {
                this.elements.clear();
            }
        };
    }

    async loadPerformanceObserverPolyfill() {
        if (typeof PerformanceObserver !== 'undefined') return;
        
        // Simple PerformanceObserver polyfill
        window.PerformanceObserver = class {
            constructor(callback) {
                this.callback = callback;
            }
            
            observe(options) {
                // Mock performance entries
                setTimeout(() => {
                    this.callback({
                        getEntries: () => []
                    });
                }, 100);
            }
            
            disconnect() {}
        };
    }

    logError(type, details) {
        if (!this.config.enableLogging) return;
        
        const errorEntry = {
            type: type,
            details: details,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        this.errorLog.push(errorEntry);
        
        // Limit log size
        if (this.errorLog.length > this.config.maxErrorLogSize) {
            this.errorLog = this.errorLog.slice(-this.config.maxErrorLogSize / 2);
        }
        
        // Console logging
        console.error(`[${type}]`, details);
        
        // Remote error reporting if configured
        if (this.config.errorReportingEndpoint) {
            this.reportError(errorEntry);
        }
    }

    async reportError(errorEntry) {
        try {
            await fetch(this.config.errorReportingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(errorEntry)
            });
        } catch (error) {
            console.warn('Failed to report error to remote endpoint:', error);
        }
    }

    // Enhanced public API methods with new error recovery and user feedback capabilities
    getErrorLog() {
        return [...this.errorLog];
    }

    clearErrorLog() {
        this.errorLog = [];
    }

    getRetryStatus() {
        return Object.fromEntries(this.retryAttempts);
    }

    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Update sub-managers with new config
        if (this.errorRecoveryManager) {
            this.errorRecoveryManager.setConfig({
                maxRetries: this.config.maxRetries || this.maxRetries,
                baseRetryDelay: this.config.retryDelay || this.retryDelay,
                enableLogging: this.config.enableLogging
            });
        }
        
        if (this.userFeedbackManager) {
            this.userFeedbackManager.setConfig({
                enableRetryButtons: this.config.enableRetry,
                maxRetryAttempts: this.config.maxRetries || this.maxRetries
            });
        }
    }

    // New methods to expose enhanced error recovery and user feedback functionality
    
    /**
     * Show loading indicator for any operation
     */
    showLoadingIndicator(operationId, options = {}) {
        return this.userFeedbackManager.showLoadingIndicator(operationId, options);
    }

    /**
     * Hide loading indicator
     */
    hideLoadingIndicator(operationId) {
        return this.userFeedbackManager.hideLoadingIndicator(operationId);
    }

    /**
     * Show error message with retry functionality
     */
    showErrorMessage(errorId, options = {}) {
        return this.userFeedbackManager.showErrorMessage(errorId, options);
    }

    /**
     * Show success message
     */
    showSuccessMessage(successId, options = {}) {
        return this.userFeedbackManager.showSuccessMessage(successId, options);
    }

    /**
     * Dismiss specific feedback message
     */
    dismissFeedback(feedbackId) {
        return this.userFeedbackManager.dismissFeedback(feedbackId);
    }

    /**
     * Get comprehensive error recovery metrics
     */
    getRecoveryMetrics() {
        return this.errorRecoveryManager.getRecoveryMetrics();
    }

    /**
     * Get user feedback statistics
     */
    getFeedbackStats() {
        return this.userFeedbackManager.getFeedbackStats();
    }

    /**
     * Handle resource loading errors with enhanced recovery
     */
    handleResourceError(event) {
        const element = event.target;
        const assetType = this.getAssetTypeFromElement(element);
        const url = element.src || element.href;
        
        console.error(`[ErrorHandler] Resource error for ${assetType}:`, url);
        
        // Use appropriate handler based on asset type
        if (assetType === 'image') {
            this.handleImageError(element, {
                showUserFeedback: true,
                container: element.parentElement
            }).catch(error => {
                console.error(`[ErrorHandler] Image recovery failed:`, error);
            });
        } else {
            // Handle other resource types
            this.handleNetworkError(url, {
                showUserFeedback: true,
                container: element.parentElement
            }).catch(error => {
                console.error(`[ErrorHandler] Resource recovery failed:`, error);
            });
        }
    }

    /**
     * Get asset type from DOM element
     */
    getAssetTypeFromElement(element) {
        if (element.tagName === 'IMG') return 'image';
        if (element.tagName === 'LINK' && element.rel === 'stylesheet') return 'css';
        if (element.tagName === 'SCRIPT') return 'javascript';
        return 'unknown';
    }

    /**
     * Comprehensive error recovery for any asset type
     */
    async recoverAsset(assetType, originalRequest, options = {}) {
        try {
            return await this.errorRecoveryManager.recover(
                new Error(`Failed to load ${assetType}`),
                assetType,
                originalRequest,
                options
            );
        } catch (error) {
            console.error(`[ErrorHandler] Asset recovery failed for ${assetType}:`, error);
            throw error;
        }
    }

    /**
     * Clear all active feedback and reset state
     */
    clearAllFeedback() {
        this.userFeedbackManager.clearAllFeedback();
        this.errorRecoveryManager.clearRecoveryHistory();
    }

    /**
     * Get comprehensive error handling statistics
     */
    getComprehensiveStats() {
        return {
            errorLog: this.getErrorLog().slice(-10), // Last 10 errors
            retryStatus: this.getRetryStatus(),
            recoveryMetrics: this.getRecoveryMetrics(),
            feedbackStats: this.getFeedbackStats(),
            networkStatus: this.networkStatus,
            config: this.config
        };
    }

    /**
     * Cleanup method for proper resource management
     */
    cleanup() {
        // Clear all feedback
        this.clearAllFeedback();
        
        // Cleanup sub-managers
        if (this.errorRecoveryManager && this.errorRecoveryManager.cleanup) {
            this.errorRecoveryManager.cleanup();
        }
        
        if (this.userFeedbackManager && this.userFeedbackManager.cleanup) {
            this.userFeedbackManager.cleanup();
        }
        
        // Clear local state
        this.errorLog = [];
        this.retryAttempts.clear();
        this.fallbackImages.clear();
        
        console.log('[ErrorHandler] Cleanup completed');
    }

    // Static method to create error handler with custom config
    static create(config = {}) {
        const handler = new ErrorHandler();
        handler.setConfig(config);
        return handler;
    }
}