
// src/js/HeroLoader.js
import * as THREE from 'three';
import { gsap } from 'gsap';
import AssetLoadingManager from './AssetLoadingManager.js';

const IS_MOBILE = window.innerWidth <= 768;
const PARTICLE_COUNT = IS_MOBILE ? 3000 : 5500;

export default class HeroLoader {
    /**
     * Static method to preload logos before HeroLoader initialization
     * This should be called early in the application lifecycle
     */
    static async preloadLogos() {
        console.log('[HeroLoader] Static preloading of logos initiated');
        const assetManager = new AssetLoadingManager();
        
        try {
            const preloadedLogos = await assetManager.preloadLogos();
            console.log(`[HeroLoader] Successfully preloaded ${preloadedLogos.length} logo variants`);
            return preloadedLogos.length > 0;
        } catch (error) {
            console.warn('[HeroLoader] Logo preloading failed:', error);
            return false;
        }
    }

    /**
     * Get cache statistics for debugging
     */
    static getCacheStats() {
        const assetManager = new AssetLoadingManager();
        return assetManager.getCacheStats();
    }

    constructor(loaderSelector, logoPath = '/assets/images/logo.png', options = {}) {
        this.loaderElement = document.querySelector(loaderSelector);
        if (!this.loaderElement) {
            console.error('[HeroLoader] Loader element not found:', loaderSelector);
            return;
        }

        this.backgroundElement = this.loaderElement.querySelector('#loader-background');
        this.contentElement = this.loaderElement.querySelector('#loader-content');
        
        if (!this.backgroundElement || !this.contentElement) {
            console.error('[HeroLoader] Required child elements not found');
            return;
        }

        // Configuration
        this.logoPath = logoPath;
        this.options = {
            particleSize: IS_MOBILE ? 0.06 : 0.08,
            animationDuration: 2.8,
            formationDelay: 1.0,
            colorPalette: [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
                '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
                '#82E0AA', '#F8C471', '#D7BDE2', '#AED6F1', '#A3E4D7'
            ],
            logoScale: IS_MOBILE ? 0.8 : 1.2,
            edgeSpawnDistance: 2.5,
            transitionIntensity: 0.8,
            glowIntensity: 1.2,
            flashDuration: 0.3,
            logoFadeInDuration: 0.8,
            ...options
        };

        // Three.js setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            alpha: true, 
            antialias: !IS_MOBILE,
            powerPreference: 'high-performance'
        });

        // Animation state
        this.particles = null;
        this.particleMaterial = null;
        this.isAnimating = false;
        this.animationFrameId = null;
        this.clock = new THREE.Clock();
        
        // Logo data
        this.logoPositions = [];
        this.logoColors = [];
        this.logoCanvas = null;
        this.logoContext = null;
        this.logoImage = null;
        this.logoElement = null;
        
        // Asset loading manager for preloading and caching
        this.assetManager = new AssetLoadingManager();
        
        console.log('[HeroLoader] Initialized successfully');
    }

    async loadLogoImage() {
        console.log('[HeroLoader] Starting logo loading with asset manager');
        this.logoLoadingState = 'loading';
        this.showLogoLoadingState();
        
        try {
            // First, try to get logo from asset manager (with preloading and caching)
            const logoAsset = await this.assetManager.getAvailableLogo();
            
            if (logoAsset && logoAsset.element) {
                console.log('[HeroLoader] Logo loaded via asset manager');
                this.logoImage = logoAsset.element;
                this.logoLoadingState = 'loaded';
                
                // Create canvas to analyze the image
                this.logoCanvas = document.createElement('canvas');
                this.logoContext = this.logoCanvas.getContext('2d');
                
                const maxSize = IS_MOBILE ? 150 : 200;
                const scale = Math.min(maxSize / this.logoImage.width, maxSize / this.logoImage.height);
                
                this.logoCanvas.width = this.logoImage.width * scale;
                this.logoCanvas.height = this.logoImage.height * scale;
                
                this.logoContext.drawImage(this.logoImage, 0, 0, this.logoCanvas.width, this.logoCanvas.height);
                this.extractLogoPositions();
                
                this.hideLogoLoadingState();
                return;
            }
        } catch (error) {
            console.warn('[HeroLoader] Asset manager logo loading failed:', error);
        }
        
        // Fallback to original loading method if asset manager fails
        console.log('[HeroLoader] Falling back to direct logo loading');
        return new Promise((resolve) => {
            this.logoLoadAttempts = 0;
            this.maxLogoAttempts = 3;
            this.attemptLogoLoad(resolve);
        });
    }

    async attemptLogoLoad(resolve) {
        this.logoLoadAttempts++;
        console.log(`[HeroLoader] Logo load attempt ${this.logoLoadAttempts}/${this.maxLogoAttempts}`);
        
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        // Set up timeout for each attempt
        const loadTimeout = setTimeout(() => {
            console.warn(`[HeroLoader] Logo load timeout on attempt ${this.logoLoadAttempts}`);
            this.handleLogoLoadFailure(resolve);
        }, 3000); // 3 second timeout per attempt
        
        img.onload = () => {
            clearTimeout(loadTimeout);
            console.log('[HeroLoader] Logo image loaded successfully:', img.width, 'x', img.height);
            this.logoImage = img;
            this.logoLoadingState = 'loaded';
            
            // Create canvas to analyze the image
            this.logoCanvas = document.createElement('canvas');
            this.logoContext = this.logoCanvas.getContext('2d');
            
            // Set canvas size (optimize for performance while maintaining quality)
            const maxSize = IS_MOBILE ? 150 : 200;
            const scale = Math.min(maxSize / img.width, maxSize / img.height);
            
            this.logoCanvas.width = img.width * scale;
            this.logoCanvas.height = img.height * scale;
            
            // Draw and analyze the image
            this.logoContext.drawImage(img, 0, 0, this.logoCanvas.width, this.logoCanvas.height);
            this.extractLogoPositions();
            
            this.hideLogoLoadingState();
            resolve();
        };
        
        img.onerror = () => {
            clearTimeout(loadTimeout);
            console.warn(`[HeroLoader] Logo image failed to load on attempt ${this.logoLoadAttempts}`);
            this.handleLogoLoadFailure(resolve);
        };
        
        // Try different path variations with exponential backoff
        const paths = [
            this.logoPath,
            '/public/assets/images/logo.png',
            './public/assets/images/logo.png',
            '/assets/images/logo.png',
            './assets/images/logo.png',
            '/public/assets/images/logo-small_size.png',
            './public/assets/images/logo-small_size.png'
        ];
        
        this.tryLoadImagePaths(img, paths, 0, resolve);
    }

    tryLoadImagePaths(img, paths, index, resolve) {
        if (index >= paths.length) {
            console.warn('[HeroLoader] All logo paths failed for this attempt');
            this.handleLogoLoadFailure(resolve);
            return;
        }

        const currentPath = paths[index];
        console.log(`[HeroLoader] Trying logo path: ${currentPath}`);
        
        // Set up individual path timeout
        const pathTimeout = setTimeout(() => {
            console.warn(`[HeroLoader] Path timeout: ${currentPath}`);
            this.tryLoadImagePaths(img, paths, index + 1, resolve);
        }, 1000); // 1 second per path
        
        const originalOnLoad = img.onload;
        const originalOnError = img.onerror;
        
        // Override handlers for this specific path attempt
        img.onload = () => {
            clearTimeout(pathTimeout);
            if (originalOnLoad) originalOnLoad();
        };
        
        img.onerror = () => {
            clearTimeout(pathTimeout);
            console.warn(`[HeroLoader] Failed to load: ${currentPath}`);
            this.tryLoadImagePaths(img, paths, index + 1, resolve);
        };
        
        img.src = currentPath;
    }

    handleLogoLoadFailure(resolve) {
        if (this.logoLoadAttempts < this.maxLogoAttempts) {
            // Exponential backoff: wait longer between attempts
            const backoffDelay = Math.pow(2, this.logoLoadAttempts - 1) * 1000; // 1s, 2s, 4s
            console.log(`[HeroLoader] Retrying logo load in ${backoffDelay}ms`);
            
            setTimeout(() => {
                this.attemptLogoLoad(resolve);
            }, backoffDelay);
        } else {
            console.warn('[HeroLoader] All logo load attempts failed, using fallback strategies');
            this.logoLoadingState = 'failed';
            this.useLogoFallbackStrategies(resolve);
        }
    }

    async useLogoFallbackStrategies(resolve) {
        console.log('[HeroLoader] Implementing logo fallback strategies');
        
        // Strategy 1: Try base64 fallback logo
        try {
            await this.tryBase64FallbackLogo();
            this.logoLoadingState = 'fallback_base64';
            this.hideLogoLoadingState();
            resolve();
            return;
        } catch (error) {
            console.warn('[HeroLoader] Base64 fallback failed:', error);
        }
        
        // Strategy 2: Create styled text logo
        console.log('[HeroLoader] Using styled text logo fallback');
        this.logoLoadingState = 'fallback_text';
        this.createStyledTextFallback();
        this.hideLogoLoadingState();
        resolve();
    }

    async tryBase64FallbackLogo() {
        return new Promise((resolve, reject) => {
            // Simple base64 encoded ChemActiva logo placeholder
            const base64Logo = 'data:image/svg+xml;base64,' + btoa(`
                <svg width="200" height="80" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#4ECDC4;stop-opacity:1" />
                            <stop offset="50%" style="stop-color:#45B7D1;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#96CEB4;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <rect width="200" height="80" rx="8" fill="url(#logoGradient)" opacity="0.1"/>
                    <text x="100" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="bold" 
                          text-anchor="middle" fill="url(#logoGradient)">ChemActiva</text>
                    <text x="100" y="50" font-family="Arial, sans-serif" font-size="12" 
                          text-anchor="middle" fill="#666">Innovations</text>
                    <circle cx="30" cy="40" r="8" fill="#4ECDC4" opacity="0.7"/>
                    <circle cx="170" cy="40" r="6" fill="#45B7D1" opacity="0.7"/>
                    <circle cx="100" cy="65" r="4" fill="#96CEB4" opacity="0.7"/>
                </svg>
            `);
            
            const img = new Image();
            img.onload = () => {
                console.log('[HeroLoader] Base64 fallback logo loaded');
                this.logoImage = img;
                
                // Create canvas for the base64 logo
                this.logoCanvas = document.createElement('canvas');
                this.logoContext = this.logoCanvas.getContext('2d');
                
                const maxSize = IS_MOBILE ? 150 : 200;
                const scale = Math.min(maxSize / img.width, maxSize / img.height);
                
                this.logoCanvas.width = img.width * scale;
                this.logoCanvas.height = img.height * scale;
                
                this.logoContext.drawImage(img, 0, 0, this.logoCanvas.width, this.logoCanvas.height);
                this.extractLogoPositions();
                
                resolve();
            };
            
            img.onerror = () => {
                console.warn('[HeroLoader] Base64 fallback logo failed');
                reject(new Error('Base64 logo failed'));
            };
            
            img.src = base64Logo;
        });
    }

    createStyledTextFallback() {
        console.log('[HeroLoader] Creating styled text fallback');
        
        // Create enhanced text-based logo positions
        const text = 'ChemActiva';
        const positions = [];
        const colors = [];
        
        // Enhanced letter positioning with better spacing
        const letterSpacing = 0.25;
        const startX = -(text.length * letterSpacing) / 2;
        
        for (let i = 0; i < text.length; i++) {
            const letterX = startX + (i * letterSpacing);
            const letterPositions = this.generateEnhancedLetterPositions(text[i], letterX, 0);
            positions.push(...letterPositions);
            
            // Use gradient colors for text
            const colorIndex = Math.floor((i / text.length) * this.options.colorPalette.length);
            const letterColor = new THREE.Color(this.options.colorPalette[colorIndex]);
            
            for (let j = 0; j < letterPositions.length; j++) {
                colors.push(letterColor.clone());
            }
        }
        
        // Add decorative elements
        const decorativePositions = this.createDecorativeElements();
        positions.push(...decorativePositions.positions);
        colors.push(...decorativePositions.colors);
        
        this.logoPositions = positions;
        this.logoColors = colors;
        
        console.log('[HeroLoader] Created styled text fallback with', positions.length, 'positions');
    }

    generateEnhancedLetterPositions(letter, centerX, centerY) {
        const positions = [];
        const density = IS_MOBILE ? 8 : 12; // Points per letter
        
        // Enhanced letter patterns with more detail
        const patterns = {
            'C': this.createCurvedLetter(centerX, centerY, 0.15, 0.3, 180, 540, density),
            'h': this.createVerticalLetter(centerX, centerY, 0.3, density).concat(
                 this.createHorizontalLetter(centerX, centerY - 0.05, 0.12, density/2)),
            'e': this.createCurvedLetter(centerX, centerY, 0.12, 0.25, 0, 270, density/2).concat(
                 this.createHorizontalLetter(centerX, centerY, 0.12, density/3)),
            'm': this.createVerticalLetter(centerX - 0.08, centerY, 0.25, density/3).concat(
                 this.createVerticalLetter(centerX, centerY, 0.25, density/3),
                 this.createVerticalLetter(centerX + 0.08, centerY, 0.25, density/3)),
            'A': this.createTriangleLetter(centerX, centerY, 0.15, 0.3, density),
            'c': this.createCurvedLetter(centerX, centerY, 0.1, 0.2, 90, 450, density/2),
            't': this.createVerticalLetter(centerX, centerY, 0.25, density/2).concat(
                 this.createHorizontalLetter(centerX, centerY + 0.1, 0.1, density/3)),
            'i': this.createVerticalLetter(centerX, centerY - 0.05, 0.2, density/2).concat(
                 [[centerX, centerY + 0.15, 0]]),
            'v': this.createVLetter(centerX, centerY, 0.12, 0.25, density),
            'a': this.createCurvedLetter(centerX, centerY, 0.1, 0.2, 0, 360, density/2)
        };

        const pattern = patterns[letter.toLowerCase()];
        if (pattern) {
            pattern.forEach(([x, y, z = 0]) => {
                positions.push(new THREE.Vector3(
                    x + (Math.random() - 0.5) * 0.02,
                    y + (Math.random() - 0.5) * 0.02,
                    z + (Math.random() - 0.5) * 0.1
                ));
            });
        } else {
            // Default pattern for unknown letters
            this.createVerticalLetter(centerX, centerY, 0.25, density).forEach(([x, y, z]) => {
                positions.push(new THREE.Vector3(x, y, z));
            });
        }

        return positions;
    }

    createCurvedLetter(centerX, centerY, radiusX, radiusY, startAngle, endAngle, density) {
        const positions = [];
        const angleStep = (endAngle - startAngle) / density;
        
        for (let i = 0; i <= density; i++) {
            const angle = (startAngle + i * angleStep) * Math.PI / 180;
            const x = centerX + Math.cos(angle) * radiusX;
            const y = centerY + Math.sin(angle) * radiusY;
            positions.push([x, y, 0]);
        }
        
        return positions;
    }

    createVerticalLetter(centerX, centerY, height, density) {
        const positions = [];
        const step = height / density;
        
        for (let i = 0; i <= density; i++) {
            const y = centerY + height/2 - i * step;
            positions.push([centerX, y, 0]);
        }
        
        return positions;
    }

    createHorizontalLetter(centerX, centerY, width, density) {
        const positions = [];
        const step = width / density;
        
        for (let i = 0; i <= density; i++) {
            const x = centerX - width/2 + i * step;
            positions.push([x, centerY, 0]);
        }
        
        return positions;
    }

    createTriangleLetter(centerX, centerY, width, height, density) {
        const positions = [];
        
        // Left side
        for (let i = 0; i <= density/3; i++) {
            const t = i / (density/3);
            const x = centerX - width/2 + t * width/2;
            const y = centerY - height/2 + t * height;
            positions.push([x, y, 0]);
        }
        
        // Right side
        for (let i = 0; i <= density/3; i++) {
            const t = i / (density/3);
            const x = centerX + t * width/2;
            const y = centerY + height/2 - t * height;
            positions.push([x, y, 0]);
        }
        
        // Cross bar
        for (let i = 0; i <= density/3; i++) {
            const t = i / (density/3);
            const x = centerX - width/4 + t * width/2;
            const y = centerY;
            positions.push([x, y, 0]);
        }
        
        return positions;
    }

    createVLetter(centerX, centerY, width, height, density) {
        const positions = [];
        
        // Left side
        for (let i = 0; i <= density/2; i++) {
            const t = i / (density/2);
            const x = centerX - width/2 + t * width/2;
            const y = centerY + height/2 - t * height;
            positions.push([x, y, 0]);
        }
        
        // Right side
        for (let i = 0; i <= density/2; i++) {
            const t = i / (density/2);
            const x = centerX + t * width/2;
            const y = centerY - height/2 + t * height;
            positions.push([x, y, 0]);
        }
        
        return positions;
    }

    createDecorativeElements() {
        const positions = [];
        const colors = [];
        
        // Add some decorative particles around the text
        const decorativeCount = IS_MOBILE ? 20 : 40;
        
        for (let i = 0; i < decorativeCount; i++) {
            // Create orbital positions around the text
            const angle = (i / decorativeCount) * Math.PI * 2;
            const radius = 1.2 + Math.random() * 0.5;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius * 0.3; // Flatten the orbit
            const z = (Math.random() - 0.5) * 0.3;
            
            positions.push(new THREE.Vector3(x, y, z));
            
            // Use accent colors for decorative elements
            const accentColors = ['#4ECDC4', '#45B7D1', '#96CEB4'];
            const color = new THREE.Color(accentColors[i % accentColors.length]);
            colors.push(color);
        }
        
        return { positions, colors };
    }

    showLogoLoadingState() {
        // Create or update loading indicator
        if (!this.logoLoadingIndicator) {
            this.logoLoadingIndicator = document.createElement('div');
            this.logoLoadingIndicator.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: #4ECDC4;
                font-family: Arial, sans-serif;
                font-size: ${IS_MOBILE ? '14px' : '16px'};
                text-align: center;
                z-index: 5;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            this.contentElement.appendChild(this.logoLoadingIndicator);
        }
        
        this.logoLoadingIndicator.innerHTML = `
            <div style="margin-bottom: 10px;">
                <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #4ECDC4; border-radius: 50%; border-top-color: transparent; animation: spin 1s linear infinite;"></div>
            </div>
            <div>Loading ChemActiva...</div>
            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;
        
        // Fade in the loading indicator
        setTimeout(() => {
            if (this.logoLoadingIndicator) {
                this.logoLoadingIndicator.style.opacity = '1';
            }
        }, 100);
    }

    hideLogoLoadingState() {
        if (this.logoLoadingIndicator) {
            this.logoLoadingIndicator.style.opacity = '0';
            setTimeout(() => {
                if (this.logoLoadingIndicator && this.logoLoadingIndicator.parentNode) {
                    this.logoLoadingIndicator.parentNode.removeChild(this.logoLoadingIndicator);
                    this.logoLoadingIndicator = null;
                }
            }, 300);
        }
    }

    extractLogoPositions() {
        if (!this.logoContext) return;

        const imageData = this.logoContext.getImageData(0, 0, this.logoCanvas.width, this.logoCanvas.height);
        const data = imageData.data;
        const positions = [];
        const colors = [];
        
        // Sample pixels from the image (skip some for performance)
        const step = IS_MOBILE ? 3 : 2;
        const centerX = this.logoCanvas.width / 2;
        const centerY = this.logoCanvas.height / 2;
        
        for (let y = 0; y < this.logoCanvas.height; y += step) {
            for (let x = 0; x < this.logoCanvas.width; x += step) {
                const index = (y * this.logoCanvas.width + x) * 4;
                const r = data[index];
                const g = data[index + 1];
                const b = data[index + 2];
                const a = data[index + 3];
                
                // Only include pixels that are not transparent and not pure white
                if (a > 50 && !(r > 240 && g > 240 && b > 240)) {
                    // Convert pixel coordinates to 3D world coordinates
                    const worldX = ((x - centerX) / centerX) * this.options.logoScale;
                    const worldY = -((y - centerY) / centerY) * this.options.logoScale;
                    const worldZ = (Math.random() - 0.5) * 0.2; // Reduced Z variation
                    
                    positions.push(new THREE.Vector3(worldX, worldY, worldZ));
                    
                    // Use original image colors with some enhancement
                    const color = new THREE.Color(r / 255, g / 255, b / 255);
                    color.multiplyScalar(1.1); // Slight enhancement
                    colors.push(color);
                }
            }
        }
        
        this.logoPositions = positions;
        this.logoColors = colors;
        
        console.log('[HeroLoader] Extracted', positions.length, 'logo positions from image');
    }

    createFallbackLogo() {
        // Create a simple fallback logo pattern
        const text = 'LOGO';
        const positions = [];
        const colors = [];
        
        for (let i = 0; i < text.length; i++) {
            const letterPositions = this.generateLetterPositions(text[i], (i - text.length/2) * 0.6, 0);
            positions.push(...letterPositions);
            
            // Add colors for each position
            const letterColor = new THREE.Color(this.options.colorPalette[i % this.options.colorPalette.length]);
            for (let j = 0; j < letterPositions.length; j++) {
                colors.push(letterColor.clone());
            }
        }
        
        this.logoPositions = positions;
        this.logoColors = colors;
        
        console.log('[HeroLoader] Created fallback logo with', positions.length, 'positions');
    }

    generateLetterPositions(letter, centerX, centerY) {
        const positions = [];
        const patterns = {
            'L': [[0,0.5],[0,0.25],[0,0],[0,-0.25],[0,-0.5],[0.2,-0.5],[0.4,-0.5]],
            'O': [[0,0.5],[0.2,0.4],[0.3,0.2],[0.3,0],[0.3,-0.2],[0.2,-0.4],[0,-0.5],[-0.2,-0.4],[-0.3,-0.2],[-0.3,0],[-0.3,0.2],[-0.2,0.4]],
            'G': [[0.3,0.5],[0.1,0.5],[-0.1,0.5],[-0.3,0.3],[-0.3,0.1],[-0.3,-0.1],[-0.3,-0.3],[-0.1,-0.5],[0.1,-0.5],[0.3,-0.5],[0.3,-0.2],[0.1,-0.2]],
            default: [[0,0.5],[0,0.25],[0,0],[0,-0.25],[0,-0.5],[0.15,0.3],[0.15,0],[0.15,-0.3]]
        };

        const pattern = patterns[letter.toUpperCase()] || patterns.default;
        pattern.forEach(([x, y]) => {
            positions.push(new THREE.Vector3(
                centerX + x + (Math.random() - 0.5) * 0.05,
                centerY + y + (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.2
            ));
        });

        return positions;
    }

    createLogoElement() {
        // Create the appropriate logo element based on loading state
        if (this.logoLoadingState === 'fallback_text') {
            // Create styled text element instead of image
            this.logoElement = document.createElement('div');
            this.logoElement.innerHTML = `
                <div style="font-family: Arial, sans-serif; font-weight: bold; color: #4ECDC4; text-align: center;">
                    <div style="font-size: ${IS_MOBILE ? '24px' : '32px'}; margin-bottom: 4px;">ChemActiva</div>
                    <div style="font-size: ${IS_MOBILE ? '12px' : '16px'}; color: #45B7D1;">Innovations</div>
                </div>
            `;
        } else {
            // Create image element for successful loads or base64 fallback
            this.logoElement = document.createElement('img');
            this.logoElement.src = this.logoImage ? this.logoImage.src : this.logoPath;
            
            // Add error handling for the final logo element
            this.logoElement.onerror = () => {
                console.warn('[HeroLoader] Final logo element failed to load, replacing with text');
                this.replaceLogoWithText();
            };
        }
        
        this.logoElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0);
            max-width: ${IS_MOBILE ? '150px' : '200px'};
            max-height: ${IS_MOBILE ? '150px' : '200px'};
            opacity: 0;
            z-index: 10;
            pointer-events: none;
        `;
        
        this.contentElement.appendChild(this.logoElement);
    }

    replaceLogoWithText() {
        if (this.logoElement && this.logoElement.parentNode) {
            const textElement = document.createElement('div');
            textElement.innerHTML = `
                <div style="font-family: Arial, sans-serif; font-weight: bold; color: #4ECDC4; text-align: center;">
                    <div style="font-size: ${IS_MOBILE ? '24px' : '32px'}; margin-bottom: 4px;">ChemActiva</div>
                    <div style="font-size: ${IS_MOBILE ? '12px' : '16px'}; color: #45B7D1;">Innovations</div>
                </div>
            `;
            
            textElement.style.cssText = this.logoElement.style.cssText;
            
            this.logoElement.parentNode.replaceChild(textElement, this.logoElement);
            this.logoElement = textElement;
            this.logoLoadingState = 'fallback_text';
        }
    }

    initThreeScene() {
        if (!this.contentElement) {
            console.error('[HeroLoader] Content element not available');
            return;
        }

        // Set up renderer
        const width = this.contentElement.clientWidth || 800;
        const height = this.contentElement.clientHeight || 600;
        
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.camera.position.z = 5;

        // Clear canvas area only (preserve logo element)
        const existingCanvas = this.contentElement.querySelector('canvas');
        if (existingCanvas) {
            this.contentElement.removeChild(existingCanvas);
        }
        this.contentElement.appendChild(this.renderer.domElement);

        // Create logo element for transition
        this.createLogoElement();

        // Create particles
        this.createParticles();
        
        console.log('[HeroLoader] Three.js scene initialized');
    }

    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
        const colors = new Float32Array(PARTICLE_COUNT * 3);
        const sizes = new Float32Array(PARTICLE_COUNT);
        const opacities = new Float32Array(PARTICLE_COUNT);
        const velocities = new Float32Array(PARTICLE_COUNT * 3);

        // Calculate screen dimensions in world space
        const frustumHeight = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2) * this.camera.position.z;
        const frustumWidth = frustumHeight * this.camera.aspect;
        const spawnDistance = this.options.edgeSpawnDistance;

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;

            // Spawn particles from screen edges
            const edge = Math.floor(Math.random() * 4);
            let spawnX, spawnY;

            switch (edge) {
                case 0: // Top edge
                    spawnX = (Math.random() - 0.5) * frustumWidth * 1.2;
                    spawnY = frustumHeight * 0.6 + Math.random() * spawnDistance;
                    break;
                case 1: // Right edge
                    spawnX = frustumWidth * 0.6 + Math.random() * spawnDistance;
                    spawnY = (Math.random() - 0.5) * frustumHeight * 1.2;
                    break;
                case 2: // Bottom edge
                    spawnX = (Math.random() - 0.5) * frustumWidth * 1.2;
                    spawnY = -frustumHeight * 0.6 - Math.random() * spawnDistance;
                    break;
                case 3: // Left edge
                    spawnX = -frustumWidth * 0.6 - Math.random() * spawnDistance;
                    spawnY = (Math.random() - 0.5) * frustumHeight * 1.2;
                    break;
            }

            positions[i3] = spawnX;
            positions[i3 + 1] = spawnY;
            positions[i3 + 2] = -2 + Math.random() * 2;

            // Target positions from logo
            if (this.logoPositions.length > 0) {
                const targetIndex = i % this.logoPositions.length;
                const target = this.logoPositions[targetIndex];
                const jitter = 0.06; // Reduced jitter for cleaner formation
                
                targetPositions[i3] = target.x + (Math.random() - 0.5) * jitter;
                targetPositions[i3 + 1] = target.y + (Math.random() - 0.5) * jitter;
                targetPositions[i3 + 2] = target.z + (Math.random() - 0.5) * jitter;

                // Use logo colors if available
                if (this.logoColors.length > 0) {
                    const logoColor = this.logoColors[targetIndex];
                    colors[i3] = logoColor.r;
                    colors[i3 + 1] = logoColor.g;
                    colors[i3 + 2] = logoColor.b;
                } else {
                    const paletteColor = new THREE.Color(this.options.colorPalette[i % this.options.colorPalette.length]);
                    colors[i3] = paletteColor.r;
                    colors[i3 + 1] = paletteColor.g;
                    colors[i3 + 2] = paletteColor.b;
                }
            } else {
                // Fallback positions and colors
                targetPositions[i3] = (Math.random() - 0.5) * 2;
                targetPositions[i3 + 1] = (Math.random() - 0.5) * 2;
                targetPositions[i3 + 2] = 0;

                const paletteColor = new THREE.Color(this.options.colorPalette[i % this.options.colorPalette.length]);
                colors[i3] = paletteColor.r;
                colors[i3 + 1] = paletteColor.g;
                colors[i3 + 2] = paletteColor.b;
            }

            // Initial velocity toward center
            const directionX = -spawnX * 0.08;
            const directionY = -spawnY * 0.08;
            velocities[i3] = directionX + (Math.random() - 0.5) * 0.01;
            velocities[i3 + 1] = directionY + (Math.random() - 0.5) * 0.01;
            velocities[i3 + 2] = (Math.random() - 0.5) * 0.005;

            // Particle properties
            sizes[i] = this.options.particleSize * (0.8 + Math.random() * 0.4);
            opacities[i] = 0;
        }

        // Set geometry attributes
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('target', new THREE.BufferAttribute(targetPositions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('alpha', new THREE.BufferAttribute(opacities, 1));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

        // Simplified shader material (removed rotation effects)
        const vertexShader = `
            attribute float size;
            attribute float alpha;
            attribute vec3 velocity;
            varying vec3 vColor;
            varying float vAlpha;
            varying float vSize;
            uniform float time;
            uniform float transitionProgress;
            
            void main() {
                vColor = color;
                vAlpha = alpha;
                vSize = size;
                
                vec3 pos = position;
                
                // Subtle movement during transition
                pos += velocity * sin(time * 1.5 + length(position) * 0.3) * (1.0 - transitionProgress) * 0.2;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (200.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const fragmentShader = `
            varying vec3 vColor;
            varying float vAlpha;
            varying float vSize;
            uniform float time;
            uniform float glowIntensity;
            
            void main() {
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                
                // Create a soft circular particle
                float alpha = (1.0 - dist * 2.0) * vAlpha;
                alpha = max(0.0, alpha);
                
                // Add subtle glow effect
                float glow = 1.0 / (1.0 + dist * 15.0);
                glow *= glowIntensity;
                
                vec3 finalColor = vColor + vec3(glow * 0.2);
                float finalAlpha = alpha + glow * 0.2;
                
                gl_FragColor = vec4(finalColor, finalAlpha);
            }
        `;

        this.particleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                transitionProgress: { value: 0 },
                glowIntensity: { value: this.options.glowIntensity }
            },
            vertexShader,
            fragmentShader,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            vertexColors: true
        });

        this.particles = new THREE.Points(geometry, this.particleMaterial);
        this.scene.add(this.particles);

        console.log('[HeroLoader] Particles created:', PARTICLE_COUNT);
    }

    async start() {
        console.log('[HeroLoader] Starting');
        this.isAnimating = true;

        // Network detection
        const connection = navigator.connection;
        const isSlowNetwork = connection ? 
            (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') : 
            false;

        try {
            // Load logo image first
            await this.loadLogoImage();
            
            if (isSlowNetwork) {
                console.log('[HeroLoader] Slow network detected, using simplified animation');
                return this.showSimplifiedAnimation();
            }

            // Show loader
            gsap.to(this.contentElement, { opacity: 1, duration: 0.6 });
            
            // Initialize scene
            this.initThreeScene();
            this.animate();

            if (!this.particles) {
                throw new Error('Particles not initialized');
            }

            return new Promise((resolve, reject) => {
                // Get particle data
                const positions = this.particles.geometry.attributes.position.array;
                const targets = this.particles.geometry.attributes.target.array;
                const opacities = this.particles.geometry.attributes.alpha.array;

                // Create main timeline
                const mainTimeline = gsap.timeline({
                    onUpdate: () => {
                        if (this.particles) {
                            this.particles.geometry.attributes.position.needsUpdate = true;
                            this.particles.geometry.attributes.alpha.needsUpdate = true;
                        }
                    },
                    onComplete: () => {
                        // Hold the logo formation briefly
                        gsap.to({}, {
                            duration: 0.8,
                            onComplete: () => {
                                // Start the flash and transition to PNG
                                this.transitionToPngLogo().then(() => {
                                    // Final fade out
                                    const fadeTimeline = gsap.timeline({
                                        onComplete: () => {
                                            if (this.loaderElement) {
                                                this.loaderElement.style.display = 'none';
                                            }
                                            this.stopAnimation();
                                            resolve();
                                        }
                                    });

                                    fadeTimeline
                                        .to(this.backgroundElement, { opacity: 0, duration: 0.8 })
                                        .to(this.contentElement, { opacity: 0, duration: 0.6 }, "-=0.4");
                                });
                            }
                        });
                    }
                });

                // Reduce particle count on mobile
                const particleCount = this.options.particleCount || (IS_MOBILE ? 1500 : 3000);
                const step = Math.ceil(positions.length / 3 / particleCount) || 1;

                for (let i = 0; i < positions.length / 3; i += step) {
                    const i3 = i * 3;
                    const delay = Math.random() * this.options.formationDelay;
                    const duration = this.options.animationDuration * (0.8 + Math.random() * 0.4);

                    // Position convergence
                    mainTimeline.to(positions, {
                        [i3]: targets[i3],
                        [i3 + 1]: targets[i3 + 1],
                        [i3 + 2]: targets[i3 + 2],
                        duration: duration,
                        ease: "power3.out"
                    }, delay);

                    // Opacity fade in
                    mainTimeline.to(opacities, {
                        [i]: 1.0,
                        duration: duration * 0.7,
                        ease: "power2.out"
                    }, delay + duration * 0.2);
                }

                // Update transition progress for shader
                mainTimeline.to(this.particleMaterial.uniforms.transitionProgress, {
                    value: 1.0,
                    duration: this.options.animationDuration,
                    ease: "power2.inOut"
                }, 0);

                // Gentle camera zoom
                mainTimeline.to(this.camera.position, {
                    z: 4.2,
                    duration: this.options.animationDuration * 1.1,
                    ease: "power2.inOut"
                }, 0.3);
            });

        } catch (error) {
            console.error('[HeroLoader] Error in start():', error);
            this.showSimplifiedAnimation();
        }
    }

    async showSimplifiedAnimation() {
        console.log('[HeroLoader] Showing simplified animation');
        
        // Show loader immediately
        gsap.to(this.contentElement, { opacity: 1, duration: 0.3 });
        
        // Create logo element
        this.createLogoElement();
        
        // Animate logo appearance
        gsap.fromTo(this.logoElement, {
            opacity: 0,
            scale: 0.8
        }, {
            opacity: 1,
            scale: 1,
            duration: 1.2,
            ease: "elastic.out(1, 0.5)",
            onComplete: () => {
                // Fade out after delay
                gsap.to(this.backgroundElement, { opacity: 0, duration: 0.8, delay: 0.5 });
                gsap.to(this.contentElement, { 
                    opacity: 0, 
                    duration: 0.8,
                    delay: 0.7,
                    onComplete: () => {
                        if (this.loaderElement) {
                            this.loaderElement.style.display = 'none';
                        }
                        this.stopAnimation();
                    }
                });
            }
        });
    }

    transitionToPngLogo() {
        return new Promise((resolve) => {
            if (!this.logoElement || !this.particles) {
                resolve();
                return;
            }

        const transitionTL = gsap.timeline({
            onComplete: resolve
        });

        // Create localized flash effect around logo area
        const flashOverlay = document.createElement('div');
        const logoSize = IS_MOBILE ? '180px' : '240px';
        flashOverlay.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: ${logoSize};
            height: ${logoSize};
            transform: translate(-50%, -50%);
            background: radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 30%, rgba(255,255,255,0.4) 60%, transparent 100%);
            border-radius: 50%;
            opacity: 0;
            z-index: 5;
            pointer-events: none;
        `;
        this.contentElement.appendChild(flashOverlay);

        // Flash sequence
        transitionTL
            // Intensify particles briefly
            .to(this.particleMaterial.uniforms.glowIntensity, {
                value: 4.0,
                duration: 0.12,
                ease: "power2.out"
            })
            // Flash overlay (localized)
            .to(flashOverlay, {
                opacity: 1,
                scale: 1.2,
                duration: this.options.flashDuration * 0.6,
                ease: "power3.out"
            }, 0.08)
            // Immediately hide all particles
            .call(() => {
                const alphas = this.particles.geometry.attributes.alpha.array;
                for (let i = 0; i < alphas.length; i++) {
                    alphas[i] = 0;
                }
                this.particles.geometry.attributes.alpha.needsUpdate = true;
                this.particles.visible = false;
            }, [], 0.1)
            // Start fading out flash while scaling in PNG logo
            .to(flashOverlay, {
                opacity: 0,
                scale: 1,
                duration: 0.5,
                ease: "power2.inOut"
            }, this.options.flashDuration * 0.5)
            // Scale and fade in PNG logo with slight delay for smoother transition
            .to(this.logoElement, {
                opacity: 1,
                scale: 1,
                duration: this.options.logoFadeInDuration,
                ease: "back.out(1.4)"
            }, this.options.flashDuration * 0.3)
            // Hold logo
            .to({}, { duration: 1.2 })
            // Clean up flash overlay
            .call(() => {
                if (flashOverlay.parentNode) {
                    flashOverlay.parentNode.removeChild(flashOverlay);
                }
            });
    });
}

    animate() {
        if (!this.isAnimating) return;

        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
        
        const elapsedTime = this.clock.getElapsedTime();
        
        if (this.particles && this.particleMaterial.uniforms) {
            // Update shader uniforms (removed rotation)
            this.particleMaterial.uniforms.time.value = elapsedTime;
        }

        this.renderer.render(this.scene, this.camera);
    }

    stopAnimation() {
        this.isAnimating = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        console.log('[HeroLoader] Animation stopped');
    }

    // Cleanup method
    destroy() {
        this.stopAnimation();
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
            this.scene.remove(this.particles);
        }
        if (this.logoElement && this.logoElement.parentNode) {
            this.logoElement.parentNode.removeChild(this.logoElement);
        }
        if (this.logoCanvas) {
            this.logoCanvas = null;
            this.logoContext = null;
        }
        console.log('[HeroLoader] Destroyed');
    }
}
