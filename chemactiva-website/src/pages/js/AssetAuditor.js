/**
 * AssetAuditor - Utility to audit and fix missing asset references
 * Identifies broken asset links and provides fallback solutions
 */
export default class AssetAuditor {
    constructor(options = {}) {
        this.config = {
            enableLogging: options.enableLogging !== false,
            enableAutoFix: options.enableAutoFix !== false,
            checkInterval: options.checkInterval || 30000, // 30 seconds
            ...options
        };

        this.auditResults = {
            missingAssets: new Set(),
            brokenLinks: new Set(),
            fixedAssets: new Set(),
            lastAudit: null
        };

        this.assetCache = new Map();
        this.auditTimer = null;
    }

    async init() {
        if (this.config.enableLogging) {
            console.log('[AssetAuditor] Initializing asset audit system');
        }

        // Run initial audit
        await this.runFullAudit();

        // Start periodic auditing if enabled
        if (this.config.checkInterval > 0) {
            this.startPeriodicAudit();
        }
    }

    async runFullAudit() {
        const startTime = Date.now();
        
        if (this.config.enableLogging) {
            console.log('[AssetAuditor] Starting full asset audit...');
        }

        // Clear previous results
        this.auditResults.missingAssets.clear();
        this.auditResults.brokenLinks.clear();

        // Audit different types of assets
        await Promise.all([
            this.auditImages(),
            this.auditCSS(),
            this.auditJS(),
            this.auditFavicons(),
            this.auditFonts()
        ]);

        // Auto-fix if enabled
        if (this.config.enableAutoFix) {
            await this.autoFixMissingAssets();
        }

        this.auditResults.lastAudit = Date.now();
        const duration = Date.now() - startTime;

        if (this.config.enableLogging) {
            console.log(`[AssetAuditor] Audit completed in ${duration}ms`);
            this.generateAuditReport();
        }

        return this.auditResults;
    }

    async auditImages() {
        const images = document.querySelectorAll('img[src]');
        const checks = Array.from(images).map(img => this.checkAsset(img.src, 'image', img));
        await Promise.allSettled(checks);
    }

    async auditCSS() {
        const styleSheets = document.querySelectorAll('link[rel="stylesheet"]');
        const checks = Array.from(styleSheets).map(link => this.checkAsset(link.href, 'css', link));
        await Promise.allSettled(checks);
    }

    async auditJS() {
        const scripts = document.querySelectorAll('script[src]');
        const checks = Array.from(scripts).map(script => this.checkAsset(script.src, 'js', script));
        await Promise.allSettled(checks);
    }

    async auditFavicons() {
        const favicons = document.querySelectorAll('link[rel*="icon"]');
        const checks = Array.from(favicons).map(link => this.checkAsset(link.href, 'favicon', link));
        await Promise.allSettled(checks);
    }

    async auditFonts() {
        const fonts = document.querySelectorAll('link[rel="preload"][as="font"]');
        const checks = Array.from(fonts).map(link => this.checkAsset(link.href, 'font', link));
        await Promise.allSettled(checks);
    }

    async checkAsset(url, type, element) {
        if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
            return; // Skip data URLs and blob URLs
        }

        // Check cache first
        if (this.assetCache.has(url)) {
            const cached = this.assetCache.get(url);
            if (Date.now() - cached.timestamp < 300000) { // 5 minutes cache
                if (!cached.exists) {
                    this.auditResults.missingAssets.add({ url, type, element });
                }
                return;
            }
        }

        try {
            const response = await fetch(url, { 
                method: 'HEAD',
                signal: AbortSignal.timeout(5000) // 5 second timeout
            });

            const exists = response.ok;
            this.assetCache.set(url, { exists, timestamp: Date.now() });

            if (!exists) {
                this.auditResults.missingAssets.add({ url, type, element });
                
                if (this.config.enableLogging) {
                    console.warn(`[AssetAuditor] Missing ${type}:`, url);
                }
            }
        } catch (error) {
            // Network error or timeout - assume missing
            this.auditResults.missingAssets.add({ url, type, element });
            this.assetCache.set(url, { exists: false, timestamp: Date.now() });
            
            if (this.config.enableLogging) {
                console.warn(`[AssetAuditor] Failed to check ${type}:`, url, error.message);
            }
        }
    }

    async autoFixMissingAssets() {
        const fixes = [];

        for (const asset of this.auditResults.missingAssets) {
            const fix = await this.attemptFix(asset);
            if (fix) {
                fixes.push(fix);
                this.auditResults.fixedAssets.add(asset);
            }
        }

        if (fixes.length > 0 && this.config.enableLogging) {
            console.log(`[AssetAuditor] Auto-fixed ${fixes.length} assets`);
        }

        return fixes;
    }

    async attemptFix(asset) {
        const { url, type, element } = asset;

        switch (type) {
            case 'image':
                return this.fixMissingImage(url, element);
            case 'css':
                return this.fixMissingCSS(url, element);
            case 'js':
                return this.fixMissingJS(url, element);
            case 'favicon':
                return this.fixMissingFavicon(url, element);
            case 'font':
                return this.fixMissingFont(url, element);
            default:
                return null;
        }
    }

    async fixMissingImage(url, imgElement) {
        const fallbacks = [
            '/assets/images/placeholder-product.svg',
            this.generatePlaceholderImage(url),
            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGM0Y0RjYiLz48dGV4dCB4PSIxNTAiIHk9IjEwMCIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg=='
        ];

        for (const fallback of fallbacks) {
            try {
                if (fallback.startsWith('data:')) {
                    imgElement.src = fallback;
                    imgElement.alt = imgElement.alt || 'Image not available';
                    return { original: url, replacement: fallback, method: 'data-url' };
                }

                const response = await fetch(fallback, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
                if (response.ok) {
                    imgElement.src = fallback;
                    imgElement.alt = imgElement.alt || 'Image not available';
                    return { original: url, replacement: fallback, method: 'fallback' };
                }
            } catch (error) {
                continue; // Try next fallback
            }
        }

        return null;
    }

    async fixMissingCSS(url, linkElement) {
        // For missing CSS, we can disable the link or provide a minimal fallback
        if (linkElement) {
            linkElement.disabled = true;
            linkElement.setAttribute('data-missing', 'true');
            return { original: url, replacement: 'disabled', method: 'disable' };
        }
        return null;
    }

    async fixMissingJS(url, scriptElement) {
        // For missing JS, we can provide error handling
        if (scriptElement) {
            scriptElement.onerror = () => {
                console.warn('[AssetAuditor] Failed to load script:', url);
                // Dispatch event so other parts of the app can handle gracefully
                window.dispatchEvent(new CustomEvent('scriptLoadError', {
                    detail: { url, element: scriptElement }
                }));
            };
            return { original: url, replacement: 'error-handled', method: 'error-handler' };
        }
        return null;
    }

    async fixMissingFavicon(url, linkElement) {
        // Use a data URL favicon as fallback
        const fallbackFavicon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNSIgZmlsbD0iIzNCODJGNiIvPjx0ZXh0IHg9IjE2IiB5PSIyMCIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DPC90ZXh0Pjwvc3ZnPg==';
        
        if (linkElement) {
            linkElement.href = fallbackFavicon;
            return { original: url, replacement: fallbackFavicon, method: 'data-url' };
        }
        return null;
    }

    async fixMissingFont(url, linkElement) {
        // Disable font preload and let the browser fall back to system fonts
        if (linkElement) {
            linkElement.disabled = true;
            linkElement.setAttribute('data-missing', 'true');
            return { original: url, replacement: 'disabled', method: 'disable' };
        }
        return null;
    }

    generatePlaceholderImage(originalUrl) {
        // Extract filename for a more descriptive placeholder
        const filename = originalUrl.split('/').pop() || 'image';
        const name = filename.split('.')[0] || 'image';
        
        const svg = `
            <svg width="300" height="200" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="200" fill="#F3F4F6"/>
                <rect x="1" y="1" width="298" height="198" stroke="#E5E7EB" stroke-width="2" stroke-dasharray="8 8"/>
                <circle cx="150" cy="80" r="20" fill="#9CA3AF"/>
                <path d="M140 70L160 70L150 90L140 70Z" fill="white"/>
                <text x="150" y="130" font-family="system-ui, sans-serif" font-size="12" fill="#6B7280" text-anchor="middle">${name}</text>
                <text x="150" y="150" font-family="system-ui, sans-serif" font-size="10" fill="#9CA3AF" text-anchor="middle">Image not found</text>
            </svg>
        `;
        
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    generateAuditReport() {
        const report = {
            summary: {
                totalMissing: this.auditResults.missingAssets.size,
                totalFixed: this.auditResults.fixedAssets.size,
                lastAudit: new Date(this.auditResults.lastAudit).toISOString()
            },
            missingAssets: Array.from(this.auditResults.missingAssets).map(asset => ({
                url: asset.url,
                type: asset.type,
                element: asset.element.tagName.toLowerCase()
            })),
            fixedAssets: Array.from(this.auditResults.fixedAssets).map(asset => ({
                url: asset.url,
                type: asset.type
            }))
        };

        console.group('[AssetAuditor] Audit Report');
        console.log('Summary:', report.summary);
        
        if (report.missingAssets.length > 0) {
            console.warn('Missing Assets:', report.missingAssets);
        }
        
        if (report.fixedAssets.length > 0) {
            console.log('Fixed Assets:', report.fixedAssets);
        }
        
        console.groupEnd();

        return report;
    }

    startPeriodicAudit() {
        if (this.auditTimer) {
            clearInterval(this.auditTimer);
        }

        this.auditTimer = setInterval(() => {
            this.runFullAudit();
        }, this.config.checkInterval);
    }

    stopPeriodicAudit() {
        if (this.auditTimer) {
            clearInterval(this.auditTimer);
            this.auditTimer = null;
        }
    }

    // Public API methods
    getAuditResults() {
        return {
            ...this.auditResults,
            missingAssets: Array.from(this.auditResults.missingAssets),
            brokenLinks: Array.from(this.auditResults.brokenLinks),
            fixedAssets: Array.from(this.auditResults.fixedAssets)
        };
    }

    clearCache() {
        this.assetCache.clear();
    }

    setConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    destroy() {
        this.stopPeriodicAudit();
        this.clearCache();
    }

    // Static factory method
    static create(options = {}) {
        return new AssetAuditor(options);
    }
}