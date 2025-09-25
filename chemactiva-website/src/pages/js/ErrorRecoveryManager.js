/**
 * ErrorRecoveryManager - Enhanced error recovery system with smarter offline detection
 * Provides automatic retry mechanisms with exponential backoff and graceful degradation
 */
export default class ErrorRecoveryManager {
    constructor(options = {}) {
        this.config = {
            maxRetries: options.maxRetries || 3,
            baseRetryDelay: options.baseRetryDelay || 1000,
            maxRetryDelay: options.maxRetryDelay || 10000,
            enableLogging: options.enableLogging !== false,
            enableMetrics: options.enableMetrics !== false,
            fallbackStrategies: options.fallbackStrategies || {},
            networkTimeoutMs: options.networkTimeoutMs || 8000, // Increased timeout
            offlineThreshold: options.offlineThreshold || 3, // Failures needed to consider offline
            onlineCheckInterval: options.onlineCheckInterval || 30000, // Check connectivity every 30s
            ...options
        };

        // Enhanced recovery state tracking
        this.recoveryAttempts = new Map();
        this.fallbackCache = new Map();
        this.networkStatus = 'online';
        this.consecutiveFailures = 0;
        this.lastOnlineCheck = Date.now();
        this.offlineStartTime = null;
        this.recoveryMetrics = {
            totalRecoveries: 0,
            successfulRecoveries: 0,
            failedRecoveries: 0,
            fallbacksUsed: 0,
            averageRecoveryTime: 0,
            falseOfflineDetections: 0
        };

        // User feedback system
        this.userNotifications = {
            element: null,
            timeouts: new Set(),
            queue: []
        };

        // Asset type specific strategies
        this.assetStrategies = {
            logo: {
                fallbacks: [
                    '/assets/images/logo.png',
                    '/assets/images/logo-small_size.png',
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTAwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjUwIiB5PSIyMCIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+Q2hlbUFjdGl2YTwvdGV4dD48L3N2Zz4=',
                    'text:ChemActiva'
                ],
                retryStrategy: 'exponential',
                maxRetries: 4,
                timeout: 3000
            },
            image: {
                fallbacks: [
                    'webp-to-jpeg',
                    '/assets/images/placeholder-product.svg',
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmNWY1ZjUiLz48dGV4dCB4PSIxNTAiIHk9IjEwMCIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SW1hZ2UgVW5hdmFpbGFibGU8L3RleHQ+PC9zdmc+',
                    'placeholder'
                ],
                retryStrategy: 'exponential',
                maxRetries: 3,
                timeout: 5000
            },
            css: {
                fallbacks: [
                    'inline-critical',
                    'minimal-styles'
                ],
                retryStrategy: 'linear',
                maxRetries: 2,
                timeout: 3000
            },
            javascript: {
                fallbacks: [
                    'polyfill',
                    'graceful-degradation'
                ],
                retryStrategy: 'exponential',
                maxRetries: 2,
                timeout: 5000
            },
            network: {
                fallbacks: [
                    'cache-first',
                    'offline-mode'
                ],
                retryStrategy: 'exponential',
                maxRetries: 3,
                timeout: 8000
            }
        };

        this.init();
    }

    init() {
        this.setupNetworkMonitoring();
        this.setupGlobalErrorHandling();
        this.preloadFallbackAssets();
        this.startPeriodicConnectivityCheck();
        
        // Initial connectivity check
        setTimeout(() => {
            this.smartOfflineDetection();
        }, 1000);
        
        if (this.config.enableLogging) {
            console.log('[ErrorRecoveryManager] Initialized with enhanced recovery strategies and smart offline detection');
        }
    }

    setupNetworkMonitoring() {
        // Monitor network status
        window.addEventListener('online', () => {
            this.networkStatus = 'online';
            this.handleNetworkRestore();
        });

        window.addEventListener('offline', () => {
            this.networkStatus = 'offline';
            this.handleNetworkLoss();
        });

        // Enhanced network monitoring if available
        if ('connection' in navigator) {
            const connection = navigator.connection;
            connection.addEventListener('change', () => {
                this.updateNetworkQuality(connection);
            });
            this.updateNetworkQuality(connection);
        }
    }

    setupGlobalErrorHandling() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleUnhandledError(event.reason, 'promise-rejection');
        });

        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.handleResourceError(event);
            } else {
                this.handleJavaScriptError(event.error, event);
            }
        }, true);
    }

    async preloadFallbackAssets() {
        // Preload critical fallback assets
        const criticalFallbacks = [
            '/assets/images/placeholder-product.svg'
        ];

        for (const fallback of criticalFallbacks) {
            try {
                await this.preloadAsset(fallback);
                this.fallbackCache.set(fallback, true);
            } catch (error) {
                if (this.config.enableLogging) {
                    console.warn(`[ErrorRecoveryManager] Failed to preload fallback: ${fallback}`);
                }
            }
        }
    }

    /**
     * Main recovery method - attempts to recover from any type of error
     */
    async recover(error, assetType, originalRequest, options = {}) {
        const recoveryId = this.generateRecoveryId(assetType, originalRequest);
        const startTime = Date.now();

        try {
            if (this.config.enableLogging) {
                console.log(`[ErrorRecoveryManager] Starting recovery for ${assetType}:`, error.message);
            }

            // Get recovery strategy for asset type
            const strategy = this.assetStrategies[assetType] || this.assetStrategies.image;
            
            // Attempt recovery with retries
            const result = await this.attemptRecoveryWithRetries(
                error, 
                assetType, 
                originalRequest, 
                strategy, 
                options
            );

            // Track successful recovery
            this.trackRecoverySuccess(recoveryId, startTime);
            
            return result;

        } catch (recoveryError) {
            // Track failed recovery
            this.trackRecoveryFailure(recoveryId, startTime, recoveryError);
            
            // Attempt graceful degradation
            return await this.gracefulDegradation(assetType, originalRequest, options);
        }
    }

    async attemptRecoveryWithRetries(error, assetType, originalRequest, strategy, options) {
        const recoveryKey = `${assetType}_${this.hashRequest(originalRequest)}`;
        let attempts = this.recoveryAttempts.get(recoveryKey) || 0;
        const maxRetries = strategy.maxRetries || this.config.maxRetries;

        while (attempts < maxRetries) {
            try {
                // Calculate delay based on strategy
                const delay = this.calculateRetryDelay(attempts, strategy.retryStrategy);
                
                if (attempts > 0) {
                    if (this.config.enableLogging) {
                        console.log(`[ErrorRecoveryManager] Retry attempt ${attempts + 1}/${maxRetries} after ${delay}ms`);
                    }
                    await this.delay(delay);
                }

                // Attempt recovery based on asset type
                const result = await this.performRecovery(assetType, originalRequest, strategy, options);
                
                // Success - clear retry count
                this.recoveryAttempts.delete(recoveryKey);
                return result;

            } catch (retryError) {
                attempts++;
                this.recoveryAttempts.set(recoveryKey, attempts);
                
                if (attempts >= maxRetries) {
                    throw retryError;
                }
            }
        }
    }

    async performRecovery(assetType, originalRequest, strategy, options) {
        switch (assetType) {
            case 'logo':
                return await this.recoverLogo(originalRequest, strategy, options);
            case 'image':
                return await this.recoverImage(originalRequest, strategy, options);
            case 'css':
                return await this.recoverCSS(originalRequest, strategy, options);
            case 'javascript':
                return await this.recoverJavaScript(originalRequest, strategy, options);
            case 'network':
                return await this.recoverNetwork(originalRequest, strategy, options);
            default:
                return await this.recoverGeneric(originalRequest, strategy, options);
        }
    }

    async recoverLogo(originalRequest, strategy, options) {
        const logoUrl = typeof originalRequest === 'string' ? originalRequest : originalRequest.url;
        
        // Try each fallback logo
        for (const fallback of strategy.fallbacks) {
            try {
                if (fallback.startsWith('data:')) {
                    // Base64 encoded fallback
                    return {
                        type: 'logo',
                        url: fallback,
                        fallback: true,
                        element: await this.createImageFromDataUrl(fallback)
                    };
                } else if (fallback.startsWith('text:')) {
                    // Text fallback
                    const text = fallback.substring(5);
                    return {
                        type: 'logo',
                        text: text,
                        fallback: true,
                        element: this.createTextLogo(text)
                    };
                } else {
                    // Try alternative logo path
                    const result = await this.loadAssetWithTimeout(fallback, strategy.timeout);
                    return {
                        type: 'logo',
                        url: fallback,
                        fallback: true,
                        element: result
                    };
                }
            } catch (fallbackError) {
                continue; // Try next fallback
            }
        }
        
        throw new Error('All logo fallbacks failed');
    }

    async recoverImage(originalRequest, strategy, options) {
        const imageUrl = typeof originalRequest === 'string' ? originalRequest : originalRequest.url;
        
        for (const fallback of strategy.fallbacks) {
            try {
                if (fallback === 'webp-to-jpeg') {
                    // Convert WebP to JPEG
                    const jpegUrl = imageUrl.replace(/\.webp$/i, '.jpeg').replace(/\.webp$/i, '.jpg');
                    const result = await this.loadAssetWithTimeout(jpegUrl, strategy.timeout);
                    return {
                        type: 'image',
                        url: jpegUrl,
                        fallback: true,
                        element: result
                    };
                } else if (fallback === 'placeholder') {
                    // Create placeholder element
                    return {
                        type: 'image',
                        placeholder: true,
                        element: this.createImagePlaceholder(options.originalElement)
                    };
                } else if (fallback.startsWith('data:')) {
                    // Base64 placeholder
                    return {
                        type: 'image',
                        url: fallback,
                        fallback: true,
                        element: await this.createImageFromDataUrl(fallback)
                    };
                } else {
                    // Try fallback image path
                    const result = await this.loadAssetWithTimeout(fallback, strategy.timeout);
                    return {
                        type: 'image',
                        url: fallback,
                        fallback: true,
                        element: result
                    };
                }
            } catch (fallbackError) {
                continue;
            }
        }
        
        throw new Error('All image fallbacks failed');
    }

    async recoverCSS(originalRequest, strategy, options) {
        const cssUrl = typeof originalRequest === 'string' ? originalRequest : originalRequest.url;
        
        for (const fallback of strategy.fallbacks) {
            try {
                if (fallback === 'inline-critical') {
                    // Inline critical CSS
                    return this.inlineCriticalCSS();
                } else if (fallback === 'minimal-styles') {
                    // Apply minimal fallback styles
                    return this.applyMinimalStyles();
                } else {
                    // Try alternative CSS path
                    const result = await this.loadAssetWithTimeout(fallback, strategy.timeout);
                    return {
                        type: 'css',
                        url: fallback,
                        fallback: true,
                        element: result
                    };
                }
            } catch (fallbackError) {
                continue;
            }
        }
        
        throw new Error('All CSS fallbacks failed');
    }

    async recoverJavaScript(originalRequest, strategy, options) {
        const jsUrl = typeof originalRequest === 'string' ? originalRequest : originalRequest.url;
        
        for (const fallback of strategy.fallbacks) {
            try {
                if (fallback === 'polyfill') {
                    // Load polyfills for missing functionality
                    return await this.loadPolyfills(options.missingFeatures || []);
                } else if (fallback === 'graceful-degradation') {
                    // Enable graceful degradation mode
                    return this.enableGracefulDegradation();
                } else {
                    // Try alternative JS path
                    const result = await this.loadAssetWithTimeout(fallback, strategy.timeout);
                    return {
                        type: 'javascript',
                        url: fallback,
                        fallback: true,
                        element: result
                    };
                }
            } catch (fallbackError) {
                continue;
            }
        }
        
        throw new Error('All JavaScript fallbacks failed');
    }

    async recoverNetwork(originalRequest, strategy, options) {
        for (const fallback of strategy.fallbacks) {
            try {
                if (fallback === 'cache-first') {
                    // Try to serve from cache
                    return await this.serveFromCache(originalRequest);
                } else if (fallback === 'offline-mode') {
                    // Enable offline mode
                    return this.enableOfflineMode();
                }
            } catch (fallbackError) {
                continue;
            }
        }
        
        throw new Error('All network fallbacks failed');
    }

    async recoverGeneric(originalRequest, strategy, options) {
        // Generic recovery for unknown asset types
        try {
            // Attempt simple retry with timeout
            return await this.loadAssetWithTimeout(originalRequest, strategy.timeout);
        } catch (error) {
            // Return null to indicate graceful failure
            return null;
        }
    }

    async gracefulDegradation(assetType, originalRequest, options) {
        if (this.config.enableLogging) {
            console.warn(`[ErrorRecoveryManager] Applying graceful degradation for ${assetType}`);
        }

        this.recoveryMetrics.fallbacksUsed++;

        switch (assetType) {
            case 'logo':
                return this.createTextLogo('ChemActiva');
            case 'image':
                return this.createImagePlaceholder(options.originalElement);
            case 'css':
                return this.applyMinimalStyles();
            case 'javascript':
                return this.enableGracefulDegradation();
            default:
                return null;
        }
    }

    // Helper methods for specific recovery actions
    async loadAssetWithTimeout(url, timeout) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Timeout loading asset: ${url}`));
            }, timeout);

            if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                // Image loading
                const img = new Image();
                img.onload = () => {
                    clearTimeout(timeoutId);
                    resolve(img);
                };
                img.onerror = () => {
                    clearTimeout(timeoutId);
                    reject(new Error(`Failed to load image: ${url}`));
                };
                img.src = url;
            } else {
                // Generic fetch
                fetch(url)
                    .then(response => {
                        clearTimeout(timeoutId);
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }
                        resolve(response);
                    })
                    .catch(error => {
                        clearTimeout(timeoutId);
                        reject(error);
                    });
            }
        });
    }

    async createImageFromDataUrl(dataUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to create image from data URL'));
            img.src = dataUrl;
        });
    }

    createTextLogo(text) {
        const logoElement = document.createElement('div');
        logoElement.className = 'text-logo-fallback';
        logoElement.textContent = text;
        logoElement.style.cssText = `
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 24px;
            font-weight: bold;
            color: #2c5530;
            text-decoration: none;
            display: inline-block;
            padding: 8px 12px;
            border: 2px solid #2c5530;
            border-radius: 4px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        `;
        return logoElement;
    }

    createImagePlaceholder(originalElement) {
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder error-recovery';
        
        const width = originalElement?.width || originalElement?.offsetWidth || 300;
        const height = originalElement?.height || originalElement?.offsetHeight || 200;
        
        placeholder.style.cssText = `
            width: ${width}px;
            height: ${height}px;
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
                    ${this.networkStatus === 'offline' ? 'Check connection' : 'Loading failed'}
                </div>
            </div>
        `;
        
        // Copy accessibility attributes
        if (originalElement?.alt) {
            placeholder.setAttribute('aria-label', `Image placeholder: ${originalElement.alt}`);
        }
        
        return placeholder;
    }

    inlineCriticalCSS() {
        const criticalCSS = `
            body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; }
            .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
            .error-recovery { opacity: 0.8; }
            .component-error { position: relative; }
            .loading-indicator { 
                display: inline-block; 
                width: 20px; 
                height: 20px; 
                border: 2px solid #f3f3f3; 
                border-top: 2px solid #3498db; 
                border-radius: 50%; 
                animation: spin 1s linear infinite; 
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `;
        
        const style = document.createElement('style');
        style.textContent = criticalCSS;
        document.head.appendChild(style);
        
        return { type: 'css', inline: true, element: style };
    }

    applyMinimalStyles() {
        // Apply minimal styles to ensure basic functionality
        document.body.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        document.body.style.lineHeight = '1.6';
        document.body.style.color = '#333';
        
        return { type: 'css', minimal: true };
    }

    async loadPolyfills(missingFeatures) {
        const polyfills = [];
        
        if (missingFeatures.includes('IntersectionObserver') && !window.IntersectionObserver) {
            polyfills.push(this.createIntersectionObserverPolyfill());
        }
        
        if (missingFeatures.includes('fetch') && !window.fetch) {
            polyfills.push(this.createFetchPolyfill());
        }
        
        await Promise.all(polyfills);
        return { type: 'javascript', polyfills: true };
    }

    createIntersectionObserverPolyfill() {
        window.IntersectionObserver = class {
            constructor(callback, options = {}) {
                this.callback = callback;
                this.options = options;
                this.elements = new Set();
            }
            
            observe(element) {
                this.elements.add(element);
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

    createFetchPolyfill() {
        if (!window.fetch) {
            window.fetch = function(url, options = {}) {
                return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open(options.method || 'GET', url);
                    
                    xhr.onload = () => {
                        resolve({
                            ok: xhr.status >= 200 && xhr.status < 300,
                            status: xhr.status,
                            statusText: xhr.statusText,
                            text: () => Promise.resolve(xhr.responseText),
                            json: () => Promise.resolve(JSON.parse(xhr.responseText))
                        });
                    };
                    
                    xhr.onerror = () => reject(new Error('Network error'));
                    xhr.send(options.body);
                });
            };
        }
    }

    enableGracefulDegradation() {
        // Set global flag for graceful degradation
        window.GRACEFUL_DEGRADATION_MODE = true;
        
        // Emit event for components to adapt
        window.dispatchEvent(new CustomEvent('gracefulDegradationEnabled', {
            detail: { timestamp: Date.now() }
        }));
        
        return { type: 'javascript', gracefulDegradation: true };
    }

    async serveFromCache(request) {
        // Try to serve from browser cache or service worker cache
        if ('caches' in window) {
            const cache = await caches.open('error-recovery-cache');
            const response = await cache.match(request);
            if (response) {
                return response;
            }
        }
        
        throw new Error('No cached version available');
    }

    enableOfflineMode() {
        // Enable offline mode functionality
        document.body.classList.add('offline-mode');
        
        // Show offline indicator
        this.showOfflineIndicator();
        
        return { type: 'network', offline: true };
    }

    showOfflineIndicator() {
        // Offline indicator disabled - no longer showing offline banner
        return;
    }

    // Network event handlers
    handleNetworkRestore() {
        if (this.config.enableLogging) {
            console.log('[ErrorRecoveryManager] Network restored, retrying failed operations');
        }
        
        // Hide offline indicator
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.style.transform = 'translateY(-100%)';
        }
        
        // Clear recovery attempts to allow fresh retries
        this.recoveryAttempts.clear();
        
        // Emit network restored event
        window.dispatchEvent(new CustomEvent('networkRestored', {
            detail: { timestamp: Date.now() }
        }));
    }

    handleNetworkLoss() {
        if (this.config.enableLogging) {
            console.warn('[ErrorRecoveryManager] Network connection lost');
        }
        
        this.enableOfflineMode();
    }

    updateNetworkQuality(connection) {
        this.networkStatus = {
            online: navigator.onLine,
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            quality: this.assessNetworkQuality(connection)
        };
    }

    assessNetworkQuality(connection) {
        if (!navigator.onLine) return 'offline';
        if (connection.effectiveType === '4g' && connection.downlink > 1.5) return 'good';
        if (connection.effectiveType === '3g' || connection.downlink > 0.5) return 'fair';
        return 'poor';
    }

    // Error handling methods
    handleUnhandledError(error, type) {
        if (this.config.enableLogging) {
            console.error(`[ErrorRecoveryManager] Unhandled ${type}:`, error);
        }
        
        // Attempt generic recovery
        this.recover(error, 'javascript', null, { type });
    }

    handleResourceError(event) {
        const element = event.target;
        const assetType = this.getAssetTypeFromElement(element);
        const url = element.src || element.href;
        
        if (this.config.enableLogging) {
            console.error(`[ErrorRecoveryManager] Resource error for ${assetType}:`, url);
        }
        
        // Attempt recovery
        this.recover(new Error(`Failed to load ${assetType}`), assetType, url, {
            originalElement: element
        }).then(result => {
            if (result && result.element) {
                element.parentNode.replaceChild(result.element, element);
            }
        }).catch(error => {
            if (this.config.enableLogging) {
                console.error(`[ErrorRecoveryManager] Recovery failed for ${assetType}:`, error);
            }
        });
    }

    handleJavaScriptError(error, event) {
        if (this.config.enableLogging) {
            console.error('[ErrorRecoveryManager] JavaScript error:', error);
        }
        
        // Attempt JavaScript recovery
        this.recover(error, 'javascript', null, {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    }

    // Utility methods
    calculateRetryDelay(attempt, strategy) {
        const baseDelay = this.config.baseRetryDelay;
        const maxDelay = this.config.maxRetryDelay;
        
        let delay;
        if (strategy === 'exponential') {
            delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        } else if (strategy === 'linear') {
            delay = Math.min(baseDelay * (attempt + 1), maxDelay);
        } else {
            delay = baseDelay;
        }
        
        // Add jitter to prevent thundering herd
        return delay + (Math.random() * 1000);
    }

    generateRecoveryId(assetType, request) {
        const requestStr = typeof request === 'string' ? request : JSON.stringify(request);
        return `${assetType}_${this.hashRequest(requestStr)}_${Date.now()}`;
    }

    hashRequest(request) {
        // Simple hash function for request identification
        let hash = 0;
        const str = typeof request === 'string' ? request : JSON.stringify(request);
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    getAssetTypeFromElement(element) {
        if (element.tagName === 'IMG') return 'image';
        if (element.tagName === 'LINK' && element.rel === 'stylesheet') return 'css';
        if (element.tagName === 'SCRIPT') return 'javascript';
        return 'unknown';
    }

    async preloadAsset(url) {
        return new Promise((resolve, reject) => {
            if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = url;
            } else {
                fetch(url)
                    .then(response => response.ok ? resolve(response) : reject(new Error(`HTTP ${response.status}`)))
                    .catch(reject);
            }
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Metrics and tracking
    trackRecoverySuccess(recoveryId, startTime) {
        const recoveryTime = Date.now() - startTime;
        this.recoveryMetrics.totalRecoveries++;
        this.recoveryMetrics.successfulRecoveries++;
        
        // Update average recovery time
        const currentAvg = this.recoveryMetrics.averageRecoveryTime;
        const totalSuccessful = this.recoveryMetrics.successfulRecoveries;
        this.recoveryMetrics.averageRecoveryTime = 
            ((currentAvg * (totalSuccessful - 1)) + recoveryTime) / totalSuccessful;
    }

    trackRecoveryFailure(recoveryId, startTime, error) {
        this.recoveryMetrics.totalRecoveries++;
        this.recoveryMetrics.failedRecoveries++;
        
        if (this.config.enableLogging) {
            console.error(`[ErrorRecoveryManager] Recovery failed for ${recoveryId}:`, error);
        }
    }

    // Public API methods
    // Enhanced offline detection methods
    async smartOfflineDetection() {
        // Don't rely solely on navigator.onLine
        const tests = await Promise.allSettled([
            this.testConnectivity('/favicon.ico'),
            this.testConnectivity('/assets/images/logo.png'),
            this.pingNetworkEndpoint()
        ]);

        const successfulTests = tests.filter(result => result.status === 'fulfilled').length;
        const isActuallyOnline = successfulTests >= 1; // At least one test must pass

        if (!isActuallyOnline && this.networkStatus === 'online') {
            this.consecutiveFailures++;
            if (this.consecutiveFailures >= this.config.offlineThreshold) {
                this.transitionToOffline();
            }
        } else if (isActuallyOnline && this.networkStatus === 'offline') {
            this.transitionToOnline();
        } else if (isActuallyOnline) {
            this.consecutiveFailures = 0; // Reset failure counter
        }

        return isActuallyOnline;
    }

    async testConnectivity(url) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        try {
            const response = await fetch(url, {
                method: 'HEAD',
                signal: controller.signal,
                cache: 'no-cache'
            });
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    async pingNetworkEndpoint() {
        // Try to reach a reliable endpoint
        try {
            const response = await fetch('https://httpbin.org/status/200', {
                method: 'HEAD',
                signal: AbortSignal.timeout(2000),
                cache: 'no-cache'
            });
            return response.ok;
        } catch {
            // Fallback to DNS resolution test
            try {
                await fetch('https://dns.google', {
                    method: 'HEAD',
                    signal: AbortSignal.timeout(2000),
                    cache: 'no-cache'
                });
                return true;
            } catch {
                return false;
            }
        }
    }

    transitionToOffline() {
        if (this.networkStatus !== 'offline') {
            this.networkStatus = 'offline';
            this.offlineStartTime = Date.now();
            this.showUserNotification('You appear to be offline. Some features may be limited.', 'warning', 5000);
            
            if (this.config.enableLogging) {
                console.warn('[ErrorRecoveryManager] Transitioned to offline mode after', this.consecutiveFailures, 'consecutive failures');
            }
        }
    }

    transitionToOnline() {
        if (this.networkStatus === 'offline') {
            const offlineDuration = this.offlineStartTime ? Date.now() - this.offlineStartTime : 0;
            this.networkStatus = 'online';
            this.consecutiveFailures = 0;
            this.offlineStartTime = null;
            
            // Check if this was a false positive
            if (offlineDuration < 10000) { // Less than 10 seconds
                this.recoveryMetrics.falseOfflineDetections++;
            }
            
            this.showUserNotification('Connection restored!', 'success', 3000);
            this.handleNetworkRestore();
            
            if (this.config.enableLogging) {
                console.log('[ErrorRecoveryManager] Back online after', Math.round(offlineDuration / 1000), 'seconds');
            }
        }
    }

    // Enhanced user feedback system
    showUserNotification(message, type = 'info', duration = 4000) {
        // Create notification container if it doesn't exist
        if (!this.userNotifications.element) {
            this.createNotificationContainer();
        }

        const notification = this.createNotificationElement(message, type);
        this.userNotifications.element.appendChild(notification);

        // Auto-dismiss after duration
        const timeoutId = setTimeout(() => {
            this.dismissNotification(notification);
            this.userNotifications.timeouts.delete(timeoutId);
        }, duration);
        
        this.userNotifications.timeouts.add(timeoutId);

        // Allow manual dismissal
        notification.addEventListener('click', () => {
            clearTimeout(timeoutId);
            this.dismissNotification(notification);
            this.userNotifications.timeouts.delete(timeoutId);
        });
    }

    createNotificationContainer() {
        this.userNotifications.element = document.createElement('div');
        this.userNotifications.element.id = 'error-notifications';
        this.userNotifications.element.className = 'error-notifications';
        this.userNotifications.element.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 350px;
            pointer-events: none;
        `;
        document.body.appendChild(this.userNotifications.element);
    }

    createNotificationElement(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-size: 14px;
            line-height: 1.4;
            cursor: pointer;
            pointer-events: auto;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            position: relative;
        `;
        
        notification.innerHTML = `
            <div style="padding-right: 20px;">${message}</div>
            <div style="position: absolute; top: 8px; right: 8px; font-size: 16px; opacity: 0.7;">×</div>
        `;

        // Trigger animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        return notification;
    }

    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    dismissNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    clearAllNotifications() {
        this.userNotifications.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
        this.userNotifications.timeouts.clear();
        
        if (this.userNotifications.element) {
            this.userNotifications.element.innerHTML = '';
        }
    }

    // Enhanced recovery with better feedback
    async recoverWithFeedback(originalFunction, context = {}) {
        const startTime = Date.now();
        this.showUserNotification('Attempting to recover...', 'info', 2000);
        
        try {
            const result = await this.recover(originalFunction, context.type || 'unknown', context.element, context);
            
            if (result.success) {
                this.showUserNotification('Recovery successful!', 'success', 2000);
            } else {
                this.showUserNotification('Recovery failed. Using fallback.', 'warning', 3000);
            }
            
            return result;
        } catch (error) {
            this.showUserNotification('Recovery failed completely.', 'error', 4000);
            throw error;
        }
    }

    // Periodic connectivity checks
    startPeriodicConnectivityCheck() {
        if (this.connectivityCheckInterval) {
            clearInterval(this.connectivityCheckInterval);
        }

        this.connectivityCheckInterval = setInterval(async () => {
            if (Date.now() - this.lastOnlineCheck > this.config.onlineCheckInterval) {
                this.lastOnlineCheck = Date.now();
                await this.smartOfflineDetection();
            }
        }, this.config.onlineCheckInterval);
    }

    stopPeriodicConnectivityCheck() {
        if (this.connectivityCheckInterval) {
            clearInterval(this.connectivityCheckInterval);
            this.connectivityCheckInterval = null;
        }
    }

    getRecoveryMetrics() {
        return {
            ...this.recoveryMetrics,
            successRate: this.recoveryMetrics.totalRecoveries > 0 
                ? (this.recoveryMetrics.successfulRecoveries / this.recoveryMetrics.totalRecoveries) * 100 
                : 0,
            networkStatus: this.networkStatus,
            activeRecoveries: this.recoveryAttempts.size,
            falseOfflineDetections: this.recoveryMetrics.falseOfflineDetections,
            consecutiveFailures: this.consecutiveFailures
        };
    }

    clearRecoveryHistory() {
        this.recoveryAttempts.clear();
        this.recoveryMetrics = {
            totalRecoveries: 0,
            successfulRecoveries: 0,
            failedRecoveries: 0,
            fallbacksUsed: 0,
            averageRecoveryTime: 0,
            falseOfflineDetections: 0
        };
        this.consecutiveFailures = 0;
    }

    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    // Cleanup method
    destroy() {
        this.stopPeriodicConnectivityCheck();
        this.clearAllNotifications();
        
        if (this.userNotifications.element) {
            this.userNotifications.element.remove();
        }
    }

    // Static factory method
    static create(options = {}) {
        return new ErrorRecoveryManager(options);
    }
}