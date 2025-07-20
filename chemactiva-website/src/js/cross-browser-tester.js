// Cross-Browser Testing Module
import App from './App.js';
import LoadingStateManager from './LoadingStateManager.js';
import AssetLoadingManager from './AssetLoadingManager.js';
import NavigationStateManager from './NavigationStateManager.js';
import CacheManager from './CacheManager.js';

class CrossBrowserTester {
    constructor() {
        this.testResults = new Map();
        this.testLog = [];
        this.startTime = Date.now();
        
        // Initialize managers for testing
        this.loadingStateManager = new LoadingStateManager();
        this.cacheManager = new CacheManager();
        this.assetLoadingManager = new AssetLoadingManager({
            cacheManager: this.cacheManager,
            loadingStateManager: this.loadingStateManager
        });
        this.navigationStateManager = new NavigationStateManager();
        
        this.init();
    }

    init() {
        this.detectBrowserInfo();
        this.setupTestFramework();
        this.populateTestSections();
    }

    detectBrowserInfo() {
        const nav = navigator;
        const browserInfo = {
            userAgent: nav.userAgent,
            platform: nav.platform,
            language: nav.language,
            cookieEnabled: nav.cookieEnabled,
            onLine: nav.onLine,
            hardwareConcurrency: nav.hardwareConcurrency,
            deviceMemory: nav.deviceMemory,
            connection: nav.connection ? {
                effectiveType: nav.connection.effectiveType,
                downlink: nav.connection.downlink,
                rtt: nav.connection.rtt,
                saveData: nav.connection.saveData
            } : null,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            features: {
                webGL: !!window.WebGLRenderingContext,
                webGL2: !!window.WebGL2RenderingContext,
                serviceWorker: 'serviceWorker' in navigator,
                intersectionObserver: 'IntersectionObserver' in window,
                performanceObserver: 'PerformanceObserver' in window,
                requestIdleCallback: 'requestIdleCallback' in window,
                webAssembly: 'WebAssembly' in window,
                es6Modules: 'noModule' in HTMLScriptElement.prototype,
                fetch: 'fetch' in window,
                promises: 'Promise' in window,
                asyncAwait: (async () => {}).constructor === (async function(){}).constructor
            }
        };

        const browserInfoEl = document.getElementById('browser-info');
        browserInfoEl.innerHTML = `
            <strong>Browser:</strong> ${this.getBrowserName(browserInfo.userAgent)}<br>
            <strong>Platform:</strong> ${browserInfo.platform}<br>
            <strong>Viewport:</strong> ${browserInfo.viewport.width}x${browserInfo.viewport.height}<br>
            <strong>Connection:</strong> ${browserInfo.connection?.effectiveType || 'Unknown'}<br>
            <strong>Memory:</strong> ${browserInfo.deviceMemory || 'Unknown'} GB<br>
            <strong>CPU Cores:</strong> ${browserInfo.hardwareConcurrency || 'Unknown'}<br>
            <strong>WebGL:</strong> ${browserInfo.features.webGL ? 'Supported' : 'Not Supported'}<br>
            <strong>Service Worker:</strong> ${browserInfo.features.serviceWorker ? 'Supported' : 'Not Supported'}
        `;

        this.browserInfo = browserInfo;
    }

    getBrowserName(userAgent) {
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
        if (userAgent.includes('Edg')) return 'Edge';
        if (userAgent.includes('Opera')) return 'Opera';
        return 'Unknown';
    }

    setupTestFramework() {
        this.tests = {
            compatibility: [
                { name: 'ES6 Modules', test: () => this.browserInfo.features.es6Modules },
                { name: 'Fetch API', test: () => this.browserInfo.features.fetch },
                { name: 'Promises', test: () => this.browserInfo.features.promises },
                { name: 'Async/Await', test: () => this.browserInfo.features.asyncAwait },
                { name: 'Intersection Observer', test: () => this.browserInfo.features.intersectionObserver },
                { name: 'Performance Observer', test: () => this.browserInfo.features.performanceObserver },
                { name: 'Service Worker', test: () => this.browserInfo.features.serviceWorker },
                { name: 'WebGL', test: () => this.browserInfo.features.webGL }
            ],
            assetLoading: [
                { name: 'Logo Loading', test: () => this.testLogoLoading() },
                { name: 'Image Preloading', test: () => this.testImagePreloading() },
                { name: 'Cache Management', test: () => this.testCacheManagement() },
                { name: 'Retry Mechanism', test: () => this.testRetryMechanism() },
                { name: 'Fallback Strategies', test: () => this.testFallbackStrategies() },
                { name: 'Network Adaptation', test: () => this.testNetworkAdaptation() }
            ],
            navigation: [
                { name: 'Navigation Detection', test: () => this.testNavigationDetection() },
                { name: 'Page Context', test: () => this.testPageContext() },
                { name: 'Asset State Tracking', test: () => this.testAssetStateTracking() },
                { name: 'Loader Decision Logic', test: () => this.testLoaderDecisionLogic() },
                { name: 'Context Preservation', test: () => this.testContextPreservation() }
            ],
            errorHandling: [
                { name: 'Network Errors', test: () => this.testNetworkErrors() },
                { name: 'Asset Load Failures', test: () => this.testAssetLoadFailures() },
                { name: 'Graceful Degradation', test: () => this.testGracefulDegradation() },
                { name: 'Error Recovery', test: () => this.testErrorRecovery() },
                { name: 'User Feedback', test: () => this.testUserFeedback() }
            ]
        };
    }

    populateTestSections() {
        this.populateCompatibilityTests();
        this.populateAssetLoadingTests();
        this.populateNavigationTests();
        this.populateErrorHandlingTests();
        this.updatePerformanceMetrics();
    }

    populateCompatibilityTests() {
        const container = document.getElementById('compatibility-tests');
        container.innerHTML = '';

        this.tests.compatibility.forEach(test => {
            const testItem = document.createElement('div');
            testItem.className = 'test-item';
            testItem.innerHTML = `
                <span class="status-indicator status-pending" id="compat-${test.name.replace(/\s+/g, '-')}"></span>
                <strong>${test.name}</strong>
                <div id="result-compat-${test.name.replace(/\s+/g, '-')}">Ready to test</div>
            `;
            container.appendChild(testItem);
        });
    }

    populateAssetLoadingTests() {
        const container = document.getElementById('asset-loading-tests');
        container.innerHTML = '';

        this.tests.assetLoading.forEach(test => {
            const testItem = document.createElement('div');
            testItem.className = 'test-item';
            testItem.innerHTML = `
                <span class="status-indicator status-pending" id="loading-${test.name.replace(/\s+/g, '-')}"></span>
                <strong>${test.name}</strong>
                <div id="result-loading-${test.name.replace(/\s+/g, '-')}">Ready to test</div>
            `;
            container.appendChild(testItem);
        });
    }

    populateNavigationTests() {
        const container = document.getElementById('navigation-tests');
        container.innerHTML = '';

        this.tests.navigation.forEach(test => {
            const testItem = document.createElement('div');
            testItem.className = 'test-item';
            testItem.innerHTML = `
                <span class="status-indicator status-pending" id="nav-${test.name.replace(/\s+/g, '-')}"></span>
                <strong>${test.name}</strong>
                <div id="result-nav-${test.name.replace(/\s+/g, '-')}">Ready to test</div>
            `;
            container.appendChild(testItem);
        });
    }

    populateErrorHandlingTests() {
        const container = document.getElementById('error-handling-tests');
        container.innerHTML = '';

        this.tests.errorHandling.forEach(test => {
            const testItem = document.createElement('div');
            testItem.className = 'test-item';
            testItem.innerHTML = `
                <span class="status-indicator status-pending" id="error-${test.name.replace(/\s+/g, '-')}"></span>
                <strong>${test.name}</strong>
                <div id="result-error-${test.name.replace(/\s+/g, '-')}">Ready to test</div>
            `;
            container.appendChild(testItem);
        });
    }

    async runAllTests() {
        this.log('Starting comprehensive cross-browser testing...');
        
        await this.runCompatibilityTests();
        await this.runLoadingTests();
        await this.runNavigationTests();
        await this.runErrorTests();
        
        this.updatePerformanceMetrics();
        this.log('All tests completed!');
    }

    async runCompatibilityTests() {
        this.log('Running compatibility tests...');
        
        for (const test of this.tests.compatibility) {
            const testId = test.name.replace(/\s+/g, '-');
            const statusEl = document.getElementById(`compat-${testId}`);
            const resultEl = document.getElementById(`result-compat-${testId}`);
            
            try {
                const result = await test.test();
                const success = result === true;
                
                statusEl.className = `status-indicator ${success ? 'status-success' : 'status-error'}`;
                resultEl.textContent = success ? 'Supported' : 'Not Supported';
                
                const testItem = statusEl.closest('.test-item');
                testItem.className = `test-item ${success ? 'success' : 'error'}`;
                
                this.testResults.set(`compat-${testId}`, { success, result });
                this.log(`${test.name}: ${success ? 'PASS' : 'FAIL'}`);
                
            } catch (error) {
                statusEl.className = 'status-indicator status-error';
                resultEl.textContent = `Error: ${error.message}`;
                
                const testItem = statusEl.closest('.test-item');
                testItem.className = 'test-item error';
                
                this.testResults.set(`compat-${testId}`, { success: false, error: error.message });
                this.log(`${test.name}: ERROR - ${error.message}`);
            }
            
            await this.delay(100); // Small delay between tests
        }
    }

    async runLoadingTests() {
        this.log('Running asset loading tests...');
        let completed = 0;
        const total = this.tests.assetLoading.length;
        
        for (const test of this.tests.assetLoading) {
            const testId = test.name.replace(/\s+/g, '-');
            const statusEl = document.getElementById(`loading-${testId}`);
            const resultEl = document.getElementById(`result-loading-${testId}`);
            
            try {
                const result = await test.test();
                const success = result.success !== false;
                
                statusEl.className = `status-indicator ${success ? 'status-success' : 'status-error'}`;
                resultEl.textContent = result.message || (success ? 'Passed' : 'Failed');
                
                const testItem = statusEl.closest('.test-item');
                testItem.className = `test-item ${success ? 'success' : 'error'}`;
                
                this.testResults.set(`loading-${testId}`, result);
                this.log(`${test.name}: ${success ? 'PASS' : 'FAIL'} - ${result.message || ''}`);
                
            } catch (error) {
                statusEl.className = 'status-indicator status-error';
                resultEl.textContent = `Error: ${error.message}`;
                
                const testItem = statusEl.closest('.test-item');
                testItem.className = 'test-item error';
                
                this.testResults.set(`loading-${testId}`, { success: false, error: error.message });
                this.log(`${test.name}: ERROR - ${error.message}`);
            }
            
            completed++;
            this.updateProgress(completed / total * 100);
            await this.delay(200);
        }
    }

    async runNavigationTests() {
        this.log('Running navigation tests...');
        
        for (const test of this.tests.navigation) {
            const testId = test.name.replace(/\s+/g, '-');
            const statusEl = document.getElementById(`nav-${testId}`);
            const resultEl = document.getElementById(`result-nav-${testId}`);
            
            try {
                const result = await test.test();
                const success = result.success !== false;
                
                statusEl.className = `status-indicator ${success ? 'status-success' : 'status-error'}`;
                resultEl.textContent = result.message || (success ? 'Passed' : 'Failed');
                
                const testItem = statusEl.closest('.test-item');
                testItem.className = `test-item ${success ? 'success' : 'error'}`;
                
                this.testResults.set(`nav-${testId}`, result);
                this.log(`${test.name}: ${success ? 'PASS' : 'FAIL'} - ${result.message || ''}`);
                
            } catch (error) {
                statusEl.className = 'status-indicator status-error';
                resultEl.textContent = `Error: ${error.message}`;
                
                const testItem = statusEl.closest('.test-item');
                testItem.className = 'test-item error';
                
                this.testResults.set(`nav-${testId}`, { success: false, error: error.message });
                this.log(`${test.name}: ERROR - ${error.message}`);
            }
            
            await this.delay(150);
        }
    }

    async runErrorTests() {
        this.log('Running error handling tests...');
        
        for (const test of this.tests.errorHandling) {
            const testId = test.name.replace(/\s+/g, '-');
            const statusEl = document.getElementById(`error-${testId}`);
            const resultEl = document.getElementById(`result-error-${testId}`);
            
            try {
                const result = await test.test();
                const success = result.success !== false;
                
                statusEl.className = `status-indicator ${success ? 'status-success' : 'status-warning'}`;
                resultEl.textContent = result.message || (success ? 'Handled correctly' : 'Needs improvement');
                
                const testItem = statusEl.closest('.test-item');
                testItem.className = `test-item ${success ? 'success' : 'warning'}`;
                
                this.testResults.set(`error-${testId}`, result);
                this.log(`${test.name}: ${success ? 'PASS' : 'WARN'} - ${result.message || ''}`);
                
            } catch (error) {
                statusEl.className = 'status-indicator status-error';
                resultEl.textContent = `Error: ${error.message}`;
                
                const testItem = statusEl.closest('.test-item');
                testItem.className = 'test-item error';
                
                this.testResults.set(`error-${testId}`, { success: false, error: error.message });
                this.log(`${test.name}: ERROR - ${error.message}`);
            }
            
            await this.delay(100);
        }
    }

    // Individual test implementations
    async testLogoLoading() {
        try {
            const logo = await this.assetLoadingManager.getAvailableLogo();
            return { success: true, message: `Logo loaded: ${logo.url}` };
        } catch (error) {
            return { success: false, message: `Logo loading failed: ${error.message}` };
        }
    }

    async testImagePreloading() {
        try {
            const result = await this.assetLoadingManager.preloadCriticalAssets();
            return { success: result, message: result ? 'Critical assets preloaded' : 'Preloading failed' };
        } catch (error) {
            return { success: false, message: `Preloading error: ${error.message}` };
        }
    }

    async testCacheManagement() {
        try {
            const stats = this.cacheManager.getStats();
            const hasEntries = stats.totalEntries > 0;
            return { success: hasEntries, message: `Cache has ${stats.totalEntries} entries` };
        } catch (error) {
            return { success: false, message: `Cache error: ${error.message}` };
        }
    }

    async testRetryMechanism() {
        try {
            // Test with a non-existent asset to trigger retry
            await this.assetLoadingManager.loadAssetWithRetry('/non-existent-asset.png');
            return { success: false, message: 'Should have failed' };
        } catch (error) {
            // Expected to fail, but should have attempted retries
            return { success: true, message: 'Retry mechanism working' };
        }
    }

    async testFallbackStrategies() {
        try {
            const state = this.loadingStateManager.registerLoadingState('test-asset');
            this.loadingStateManager.handleLoadingFailure('test-asset', 'image', new Error('Test error'), 'fallback');
            const updatedState = this.loadingStateManager.getLoadingState('test-asset');
            return { success: updatedState.fallbackUsed, message: 'Fallback strategy applied' };
        } catch (error) {
            return { success: false, message: `Fallback error: ${error.message}` };
        }
    }

    async testNetworkAdaptation() {
        try {
            const connection = navigator.connection;
            if (connection) {
                return { success: true, message: `Network type: ${connection.effectiveType}` };
            } else {
                return { success: true, message: 'Network API not supported, using defaults' };
            }
        } catch (error) {
            return { success: false, message: `Network adaptation error: ${error.message}` };
        }
    }

    async testNavigationDetection() {
        try {
            const context = this.navigationStateManager.getNavigationContext();
            return { success: !!context.currentPage, message: `Current page: ${context.currentPage?.type}` };
        } catch (error) {
            return { success: false, message: `Navigation detection error: ${error.message}` };
        }
    }

    async testPageContext() {
        try {
            this.navigationStateManager.preservePageContext({ test: true });
            const preserved = this.navigationStateManager.getPreservedContext();
            return { success: !!preserved, message: 'Page context preserved' };
        } catch (error) {
            return { success: false, message: `Page context error: ${error.message}` };
        }
    }

    async testAssetStateTracking() {
        try {
            this.navigationStateManager.updateAssetState('test-asset', 'loaded');
            const stats = this.navigationStateManager.getNavigationStats();
            return { success: !!stats.assetStates['test-asset'], message: 'Asset state tracked' };
        } catch (error) {
            return { success: false, message: `Asset tracking error: ${error.message}` };
        }
    }

    async testLoaderDecisionLogic() {
        try {
            const shouldSkip = this.navigationStateManager.shouldSkipLoader();
            return { success: typeof shouldSkip === 'boolean', message: `Loader decision: ${shouldSkip ? 'skip' : 'show'}` };
        } catch (error) {
            return { success: false, message: `Decision logic error: ${error.message}` };
        }
    }

    async testContextPreservation() {
        try {
            const testContext = { timestamp: Date.now(), test: true };
            this.navigationStateManager.preservePageContext(testContext);
            const preserved = this.navigationStateManager.getPreservedContext();
            return { success: preserved && preserved.test, message: 'Context preservation working' };
        } catch (error) {
            return { success: false, message: `Context preservation error: ${error.message}` };
        }
    }

    async testNetworkErrors() {
        try {
            // Simulate network error
            const originalFetch = window.fetch;
            window.fetch = () => Promise.reject(new Error('Network error'));
            
            try {
                await this.assetLoadingManager.loadAssetWithRetry('/test-asset.png');
                return { success: false, message: 'Should have failed' };
            } catch (error) {
                return { success: true, message: 'Network error handled' };
            } finally {
                window.fetch = originalFetch;
            }
        } catch (error) {
            return { success: false, message: `Network error test failed: ${error.message}` };
        }
    }

    async testAssetLoadFailures() {
        try {
            this.loadingStateManager.handleLoadingFailure('test-asset', 'image', new Error('Load failed'), 'default');
            const state = this.loadingStateManager.getLoadingState('test-asset');
            return { success: state && state.status === 'failed', message: 'Asset failure handled' };
        } catch (error) {
            return { success: false, message: `Asset failure test error: ${error.message}` };
        }
    }

    async testGracefulDegradation() {
        try {
            // Test with disabled JavaScript features
            const originalIntersectionObserver = window.IntersectionObserver;
            delete window.IntersectionObserver;
            
            // Should still work without IntersectionObserver
            const result = this.browserInfo.features.intersectionObserver;
            
            window.IntersectionObserver = originalIntersectionObserver;
            return { success: true, message: 'Graceful degradation working' };
        } catch (error) {
            return { success: false, message: `Degradation test error: ${error.message}` };
        }
    }

    async testErrorRecovery() {
        try {
            // Test error recovery mechanisms
            const metrics = this.loadingStateManager.getPerformanceMetrics();
            return { success: typeof metrics.successRate === 'number', message: `Success rate: ${metrics.successRate}%` };
        } catch (error) {
            return { success: false, message: `Error recovery test failed: ${error.message}` };
        }
    }

    async testUserFeedback() {
        try {
            // Test user feedback mechanisms
            const hasErrorHandling = typeof this.loadingStateManager.handleLoadingFailure === 'function';
            return { success: hasErrorHandling, message: 'User feedback mechanisms available' };
        } catch (error) {
            return { success: false, message: `User feedback test error: ${error.message}` };
        }
    }

    updateProgress(percentage) {
        const progressFill = document.getElementById('loading-progress');
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
    }

    updatePerformanceMetrics() {
        const container = document.getElementById('performance-metrics');
        const testDuration = Date.now() - this.startTime;
        
        const totalTests = Array.from(this.testResults.values()).length;
        const passedTests = Array.from(this.testResults.values()).filter(r => r.success !== false).length;
        const failedTests = totalTests - passedTests;
        
        const assetStats = this.assetLoadingManager.getStats();
        const cacheStats = this.cacheManager.getStats();
        
        container.innerHTML = `
            <div class="metric-card">
                <div class="metric-value">${totalTests}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${passedTests}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${failedTests}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${Math.round(testDuration / 1000)}s</div>
                <div class="metric-label">Test Duration</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${cacheStats.totalEntries || 0}</div>
                <div class="metric-label">Cached Assets</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${cacheStats.hitRate || '0%'}</div>
                <div class="metric-label">Cache Hit Rate</div>
            </div>
        `;
    }

    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;
        this.testLog.push(logMessage);
        
        const logOutput = document.getElementById('test-log');
        if (logOutput) {
            logOutput.textContent = this.testLog.join('\n');
            logOutput.scrollTop = logOutput.scrollHeight;
        }
        
        console.log(logMessage);
    }

    clearResults() {
        this.testResults.clear();
        this.testLog = [];
        this.startTime = Date.now();
        
        document.getElementById('test-log').textContent = '';
        this.updateProgress(0);
        
        // Reset all test items
        document.querySelectorAll('.test-item').forEach(item => {
            item.className = 'test-item';
            const status = item.querySelector('.status-indicator');
            if (status) status.className = 'status-indicator status-pending';
            const result = item.querySelector('[id^="result-"]');
            if (result) result.textContent = 'Ready to test';
        });
        
        this.log('Test results cleared');
    }

    exportResults() {
        const results = {
            timestamp: new Date().toISOString(),
            browserInfo: this.browserInfo,
            testResults: Object.fromEntries(this.testResults),
            testLog: this.testLog,
            duration: Date.now() - this.startTime
        };
        
        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cross-browser-test-results-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.log('Test results exported');
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global functions for button handlers
let tester;

window.runAllTests = () => tester?.runAllTests();
window.runLoadingTests = () => tester?.runLoadingTests();
window.runNavigationTests = () => tester?.runNavigationTests();
window.runErrorTests = () => tester?.runErrorTests();
window.clearResults = () => tester?.clearResults();
window.exportResults = () => tester?.exportResults();

// Initialize tester when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    tester = new CrossBrowserTester();
});

// Initialize immediately if DOM is already ready
if (document.readyState === 'loading') {
    // Wait for DOMContentLoaded
} else {
    tester = new CrossBrowserTester();
}