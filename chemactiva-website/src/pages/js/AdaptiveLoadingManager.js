/**
 * AdaptiveLoadingManager - Implements adaptive loading strategies based on network conditions
 * Detects network conditions and adjusts loading behavior accordingly
 */
class AdaptiveLoadingManager {
    constructor(options = {}) {
        this.assetLoadingManager = options.assetLoadingManager;
        this.cacheManager = options.cacheManager;
        this.performanceManager = options.performanceManager;
        
        // Network condition states
        this.networkCondition = {
            effectiveType: 'unknown',
            downlink: 0,
            rtt: 0,
            saveData: false,
            lastChecked: Date.now()
        };
        
        // Adaptive loading strategies
        this.strategies = {
            'slow-2g': {
                name: 'minimal',
                imageQuality: 'low',
                preloadDistance: 0,
                videosEnabled: false,
                animationsEnabled: false,
                maxConcurrentRequests: 2,
                prioritizeText: true,
                lazyLoadThreshold: 0.5, // 50% of viewport
                timeout: 10000 // 10s timeout
            },
            '2g': {
                name: 'reduced',
                imageQuality: 'low',
                preloadDistance: 100,
                videosEnabled: false,
                animationsEnabled: false,
                maxConcurrentRequests: 4,
                prioritizeText: true,
                lazyLoadThreshold: 0.3, // 30% of viewport
                timeout: 8000 // 8s timeout
            },
            '3g': {
                name: 'balanced',
                imageQuality: 'medium',
                preloadDistance: 200,
                videosEnabled: true,
                animationsEnabled: true,
                maxConcurrentRequests: 6,
                prioritizeText: true,
                lazyLoadThreshold: 0.2, // 20% of viewport
                timeout: 5000 // 5s timeout
            },
            '4g': {
                name: 'full',
                imageQuality: 'high',
                preloadDistance: 300,
                videosEnabled: true,
                animationsEnabled: true,
                maxConcurrentRequests: 10,
                prioritizeText: false,
                lazyLoadThreshold: 0.1, // 10% of viewport
                timeout: 3000 // 3s timeout
            }
        };
        
        // Current active strategy
        this.activeStrategy = this.strategies['3g']; // Default to balanced
        
        // Device capability detection
        this.deviceCapabilities = {
            memory: navigator.deviceMemory || 4, // Default to 4GB if not available
            cpuCores: navigator.hardwareConcurrency || 4, // Default to 4 cores
            isLowEndDevice: false,
            isHighEndDevice: false
        };
        
        // Initialize device capability detection
        this.detectDeviceCapabilities();
        
        // Metrics
        this.metrics = {
            strategySwitches: 0,
            adaptiveModeActive: false,
            currentStrategy: 'balanced',
            lowQualityAssetsServed: 0,
            savedBandwidth: 0,
            lastStrategyChange: null
        };
        
        // Initialize network monitoring
        this.initNetworkMonitoring();
    }

    /**
     * Initialize network condition monitoring
     */
    initNetworkMonitoring() {
        // Check if Network Information API is available
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            // Initial network check
            this.updateNetworkCondition(connection);
            
            // Listen for network changes
            connection.addEventListener('change', () => {
                this.updateNetworkCondition(connection);
            });
            
            console.log('AdaptiveLoadingManager: Network monitoring initialized');
        } else {
            // Fallback to periodic checks using performance data
            console.log('AdaptiveLoadingManager: Network Information API not available, using fallback detection');
            this.initFallbackNetworkDetection();
        }
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            console.log('AdaptiveLoadingManager: Device is online');
            this.handleOnlineStatus(true);
        });
        
        window.addEventListener('offline', () => {
            console.log('AdaptiveLoadingManager: Device is offline');
            this.handleOnlineStatus(false);
        });
    }

    /**
     * Update network condition and adapt loading strategy
     */
    updateNetworkCondition(connection) {
        const previousType = this.networkCondition.effectiveType;
        
        // Update network condition data
        this.networkCondition = {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData,
            lastChecked: Date.now()
        };
        
        console.log(`AdaptiveLoadingManager: Network condition updated - ${connection.effectiveType}, ${connection.downlink}Mbps, RTT: ${connection.rtt}ms`);
        
        // Adapt loading strategy if network type changed
        if (previousType !== connection.effectiveType) {
            this.adaptToNetworkCondition();
            
            // Update metrics
            this.metrics.strategySwitches++;
            this.metrics.lastStrategyChange = Date.now();
        }
        
        // Emit network condition change event
        window.dispatchEvent(new CustomEvent('networkConditionChange', {
            detail: this.networkCondition
        }));
    }

    /**
     * Fallback network detection using performance data
     */
    initFallbackNetworkDetection() {
        // Check network speed periodically
        setInterval(() => {
            this.checkNetworkSpeedWithResourceTiming();
        }, 30000); // Check every 30 seconds
        
        // Initial check
        this.checkNetworkSpeedWithResourceTiming();
    }

    /**
     * Check network speed using Resource Timing API
     */
    checkNetworkSpeedWithResourceTiming() {
        const resources = performance.getEntriesByType('resource');
        if (resources.length === 0) return;
        
        // Calculate average download speed from recent resources
        const recentResources = resources
            .filter(res => res.transferSize > 0 && res.duration > 0)
            .slice(-5); // Use last 5 resources
            
        if (recentResources.length === 0) return;
        
        const totalBytes = recentResources.reduce((sum, res) => sum + res.transferSize, 0);
        const totalTime = recentResources.reduce((sum, res) => sum + res.duration, 0);
        
        // Calculate speed in Mbps
        const speedMbps = (totalBytes * 8) / (totalTime * 1000);
        
        // Determine effective connection type based on speed
        let effectiveType;
        if (speedMbps < 0.1) {
            effectiveType = 'slow-2g';
        } else if (speedMbps < 0.5) {
            effectiveType = '2g';
        } else if (speedMbps < 2) {
            effectiveType = '3g';
        } else {
            effectiveType = '4g';
        }
        
        // Update network condition if changed
        if (effectiveType !== this.networkCondition.effectiveType) {
            this.networkCondition = {
                effectiveType,
                downlink: speedMbps,
                rtt: this.estimateRTT(recentResources),
                saveData: false,
                lastChecked: Date.now()
            };
            
            console.log(`AdaptiveLoadingManager: Network condition estimated - ${effectiveType}, ${speedMbps.toFixed(2)}Mbps`);
            
            // Adapt loading strategy
            this.adaptToNetworkCondition();
            
            // Update metrics
            this.metrics.strategySwitches++;
            this.metrics.lastStrategyChange = Date.now();
            
            // Emit network condition change event
            window.dispatchEvent(new CustomEvent('networkConditionChange', {
                detail: this.networkCondition
            }));
        }
    }

    /**
     * Estimate RTT from resource timing data
     */
    estimateRTT(resources) {
        // Use connection time as RTT estimate
        const connectionTimes = resources
            .filter(res => res.connectEnd > 0 && res.connectStart > 0)
            .map(res => res.connectEnd - res.connectStart);
            
        if (connectionTimes.length === 0) return 100; // Default value
        
        return connectionTimes.reduce((sum, time) => sum + time, 0) / connectionTimes.length;
    }

    /**
     * Detect device capabilities
     */
    detectDeviceCapabilities() {
        // Check memory
        if (this.deviceCapabilities.memory <= 2) {
            this.deviceCapabilities.isLowEndDevice = true;
        } else if (this.deviceCapabilities.memory >= 8) {
            this.deviceCapabilities.isHighEndDevice = true;
        }
        
        // Check CPU cores
        if (this.deviceCapabilities.cpuCores <= 2) {
            this.deviceCapabilities.isLowEndDevice = true;
        } else if (this.deviceCapabilities.cpuCores >= 8) {
            this.deviceCapabilities.isHighEndDevice = true;
        }
        
        // Check for battery API
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                // If battery is low, treat as low-end device
                if (battery.level < 0.2 && !battery.charging) {
                    this.deviceCapabilities.isLowEndDevice = true;
                    this.deviceCapabilities.isHighEndDevice = false;
                }
            });
        }
        
        console.log(`AdaptiveLoadingManager: Device capabilities - Memory: ${this.deviceCapabilities.memory}GB, CPU: ${this.deviceCapabilities.cpuCores} cores, Low-end: ${this.deviceCapabilities.isLowEndDevice}, High-end: ${this.deviceCapabilities.isHighEndDevice}`);
    }

    /**
     * Adapt loading strategy based on network condition
     */
    adaptToNetworkCondition() {
        const effectiveType = this.networkCondition.effectiveType;
        const strategy = this.strategies[effectiveType] || this.strategies['3g'];
        
        // Adjust strategy based on device capabilities
        if (this.deviceCapabilities.isLowEndDevice) {
            // For low-end devices, reduce quality further
            strategy.imageQuality = this.downgradeQuality(strategy.imageQuality);
            strategy.maxConcurrentRequests = Math.max(2, strategy.maxConcurrentRequests - 2);
            strategy.preloadDistance = Math.max(0, strategy.preloadDistance - 100);
        } else if (this.deviceCapabilities.isHighEndDevice && effectiveType === '4g') {
            // For high-end devices on good connections, increase quality
            strategy.imageQuality = 'high';
            strategy.preloadDistance = 400;
            strategy.maxConcurrentRequests = 12;
        }
        
        // Apply save-data preference if enabled
        if (this.networkCondition.saveData) {
            strategy.imageQuality = 'low';
            strategy.videosEnabled = false;
            strategy.preloadDistance = Math.max(0, strategy.preloadDistance - 100);
        }
        
        // Set active strategy
        this.activeStrategy = strategy;
        this.metrics.adaptiveModeActive = true;
        this.metrics.currentStrategy = strategy.name;
        
        console.log(`AdaptiveLoadingManager: Adapted to ${effectiveType} network - Strategy: ${strategy.name}, Image quality: ${strategy.imageQuality}`);
        
        // Apply strategy to the page
        this.applyAdaptiveStrategy(strategy);
        
        // Emit strategy change event
        window.dispatchEvent(new CustomEvent('adaptiveStrategyChange', {
            detail: {
                strategy: strategy.name,
                networkType: effectiveType,
                imageQuality: strategy.imageQuality
            }
        }));
    }

    /**
     * Apply adaptive loading strategy to the page
     */
    applyAdaptiveStrategy(strategy) {
        // 1. Adjust image quality
        this.adjustImageQuality(strategy.imageQuality);
        
        // 2. Configure video playback
        this.configureVideoPlayback(strategy.videosEnabled);
        
        // 3. Adjust animation settings
        this.configureAnimations(strategy.animationsEnabled);
        
        // 4. Update lazy loading thresholds
        this.updateLazyLoadingThresholds(strategy.lazyLoadThreshold);
        
        // 5. Configure request concurrency if AssetLoadingManager is available
        if (this.assetLoadingManager) {
            // This would require a method in AssetLoadingManager to adjust concurrency
            console.log(`AdaptiveLoadingManager: Setting max concurrent requests to ${strategy.maxConcurrentRequests}`);
        }
        
        // 6. Update request timeouts
        this.updateRequestTimeouts(strategy.timeout);
        
        // 7. Configure preloading distance
        this.updatePreloadDistance(strategy.preloadDistance);
    }

    /**
     * Adjust image quality based on network conditions
     */
    adjustImageQuality(quality) {
        // Find all images with data-src-low, data-src-medium, data-src-high attributes
        const adaptiveImages = document.querySelectorAll('img[data-src-low], img[data-src-medium], img[data-src-high]');
        
        adaptiveImages.forEach(img => {
            const currentSrc = img.src;
            let newSrc;
            
            switch (quality) {
                case 'low':
                    newSrc = img.dataset.srcLow || img.dataset.srcMedium || img.dataset.srcHigh || img.src;
                    break;
                case 'medium':
                    newSrc = img.dataset.srcMedium || img.dataset.srcHigh || img.dataset.srcLow || img.src;
                    break;
                case 'high':
                    newSrc = img.dataset.srcHigh || img.dataset.srcMedium || img.dataset.srcLow || img.src;
                    break;
                default:
                    newSrc = img.src;
            }
            
            // Only update if source is different
            if (newSrc && newSrc !== currentSrc) {
                img.src = newSrc;
                
                // Track metrics
                if (quality === 'low') {
                    this.metrics.lowQualityAssetsServed++;
                    
                    // Estimate bandwidth saved
                    if (img.dataset.srcHigh) {
                        // Rough estimation based on typical file size differences
                        const highQualitySize = this.estimateImageSize(img, 'high');
                        const lowQualitySize = this.estimateImageSize(img, 'low');
                        this.metrics.savedBandwidth += (highQualitySize - lowQualitySize);
                    }
                }
            }
        });
        
        console.log(`AdaptiveLoadingManager: Adjusted ${adaptiveImages.length} images to ${quality} quality`);
    }

    /**
     * Configure video playback based on network conditions
     */
    configureVideoPlayback(enabled) {
        const videos = document.querySelectorAll('video');
        
        videos.forEach(video => {
            if (!enabled) {
                // Disable autoplay
                video.autoplay = false;
                
                // Pause any playing videos
                if (!video.paused) {
                    video.pause();
                }
                
                // Add poster image if available
                if (video.dataset.poster && !video.poster) {
                    video.poster = video.dataset.poster;
                }
                
                // Add play button overlay
                if (!video.nextElementSibling?.classList.contains('video-play-button')) {
                    const playButton = document.createElement('button');
                    playButton.className = 'video-play-button';
                    playButton.innerHTML = '▶';
                    playButton.setAttribute('aria-label', 'Play video');
                    playButton.style.cssText = `
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: rgba(0,0,0,0.6);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 60px;
                        height: 60px;
                        font-size: 24px;
                        cursor: pointer;
                        z-index: 2;
                    `;
                    
                    // Add click handler
                    playButton.addEventListener('click', () => {
                        video.play();
                        playButton.style.display = 'none';
                    });
                    
                    // Add to DOM
                    const videoContainer = video.parentElement;
                    if (videoContainer) {
                        videoContainer.style.position = 'relative';
                        videoContainer.appendChild(playButton);
                    }
                }
            } else {
                // Enable autoplay if it was originally enabled
                if (video.dataset.autoplay === 'true') {
                    video.autoplay = true;
                }
                
                // Remove play button overlay if exists
                const playButton = video.nextElementSibling?.classList.contains('video-play-button') 
                    ? video.nextElementSibling 
                    : null;
                    
                if (playButton) {
                    playButton.remove();
                }
            }
        });
        
        console.log(`AdaptiveLoadingManager: ${enabled ? 'Enabled' : 'Disabled'} video autoplay for ${videos.length} videos`);
    }

    /**
     * Configure animations based on network conditions
     */
    configureAnimations(enabled) {
        // Set a CSS class on the body to control animations via CSS
        if (enabled) {
            document.body.classList.remove('reduce-motion');
        } else {
            document.body.classList.add('reduce-motion');
        }
        
        // Disable JavaScript animations if needed
        if (!enabled) {
            // Emit event for animation managers to respond to
            window.dispatchEvent(new CustomEvent('reduceAnimations', {
                detail: { enabled: false }
            }));
        } else {
            window.dispatchEvent(new CustomEvent('reduceAnimations', {
                detail: { enabled: true }
            }));
        }
        
        console.log(`AdaptiveLoadingManager: ${enabled ? 'Enabled' : 'Disabled'} animations`);
    }

    /**
     * Update lazy loading thresholds
     */
    updateLazyLoadingThresholds(threshold) {
        // Emit event for lazy loading systems to adjust
        window.dispatchEvent(new CustomEvent('lazyLoadThresholdChange', {
            detail: { threshold }
        }));
        
        console.log(`AdaptiveLoadingManager: Updated lazy loading threshold to ${threshold}`);
    }

    /**
     * Update request timeouts
     */
    updateRequestTimeouts(timeout) {
        // Store timeout value for future requests
        this.requestTimeout = timeout;
        
        // Emit event for loading managers
        window.dispatchEvent(new CustomEvent('requestTimeoutChange', {
            detail: { timeout }
        }));
        
        console.log(`AdaptiveLoadingManager: Updated request timeout to ${timeout}ms`);
    }

    /**
     * Update preload distance
     */
    updatePreloadDistance(distance) {
        // Update preload distance for intersection observers
        this.preloadDistance = distance;
        
        // Emit event for preloading systems
        window.dispatchEvent(new CustomEvent('preloadDistanceChange', {
            detail: { distance }
        }));
        
        console.log(`AdaptiveLoadingManager: Updated preload distance to ${distance}px`);
    }

    /**
     * Handle online/offline status changes
     */
    handleOnlineStatus(isOnline) {
        if (!isOnline) {
            // Switch to minimal strategy when offline
            this.activeStrategy = this.strategies['slow-2g'];
            this.applyAdaptiveStrategy(this.activeStrategy);
            
            // Show offline notification
            this.showOfflineNotification();
        } else {
            // Re-check network condition when coming back online
            if ('connection' in navigator) {
                this.updateNetworkCondition(navigator.connection);
            } else {
                this.checkNetworkSpeedWithResourceTiming();
            }
            
            // Hide offline notification
            this.hideOfflineNotification();
        }
    }

    /**
     * Show offline notification
     */
    showOfflineNotification() {
        // Offline notification disabled - no longer showing offline banner
        return;
    }

    /**
     * Hide offline notification
     */
    hideOfflineNotification() {
        const notification = document.getElementById('offline-notification');
        if (notification) {
            notification.remove();
        }
    }

    /**
     * Downgrade quality level
     */
    downgradeQuality(quality) {
        switch (quality) {
            case 'high': return 'medium';
            case 'medium': return 'low';
            default: return 'low';
        }
    }

    /**
     * Estimate image size based on quality level
     */
    estimateImageSize(img, quality) {
        // Get image dimensions
        const width = img.naturalWidth || img.width || 300;
        const height = img.naturalHeight || img.height || 200;
        const pixels = width * height;
        
        // Estimate bytes per pixel based on quality
        let bytesPerPixel;
        switch (quality) {
            case 'high': bytesPerPixel = 0.5; break;
            case 'medium': bytesPerPixel = 0.25; break;
            case 'low': bytesPerPixel = 0.1; break;
            default: bytesPerPixel = 0.25;
        }
        
        return pixels * bytesPerPixel;
    }

    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            networkCondition: this.networkCondition,
            activeStrategy: this.activeStrategy.name,
            deviceCapabilities: this.deviceCapabilities,
            savedBandwidthMB: (this.metrics.savedBandwidth / (1024 * 1024)).toFixed(2)
        };
    }

    /**
     * Manually set quality level (for user preference)
     */
    setQualityPreference(quality) {
        if (['low', 'medium', 'high', 'auto'].includes(quality)) {
            if (quality === 'auto') {
                // Reset to network-based adaptation
                this.adaptToNetworkCondition();
            } else {
                // Override with user preference
                const currentStrategy = { ...this.activeStrategy };
                currentStrategy.imageQuality = quality;
                this.applyAdaptiveStrategy(currentStrategy);
            }
            
            console.log(`AdaptiveLoadingManager: Quality preference set to ${quality}`);
            return true;
        }
        return false;
    }

    /**
     * Cleanup method
     */
    cleanup() {
        // Remove event listeners
        if ('connection' in navigator && navigator.connection.removeEventListener) {
            navigator.connection.removeEventListener('change', this.updateNetworkCondition);
        }
        
        window.removeEventListener('online', this.handleOnlineStatus);
        window.removeEventListener('offline', this.handleOnlineStatus);
        
        console.log('AdaptiveLoadingManager: Cleaned up');
    }
}

export default AdaptiveLoadingManager;