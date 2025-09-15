// main.js
import App from './App.js';
import ProgressiveLoader from './ProgressiveLoader.js';
import PerformanceMonitor from './PerformanceMonitor.js';
import SEOManager from './SEOManager.js';
import AssetAuditor from './AssetAuditor.js';
import AccessibilityManager from './AccessibilityManager.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize accessibility features first for immediate keyboard/screen reader support
    const accessibilityManager = new AccessibilityManager({
        enableKeyboardNavigation: true,
        enableARIALabels: true,
        enableScreenReaderSupport: true,
        enableFocusManagement: true,
        enableLogging: true
    });
    
    // Initialize SEO manager for meta tags
    const seoManager = new SEOManager({
        siteName: 'ChemActiva',
        siteUrl: 'https://chemactiva.com',
        defaultDescription: 'Leading provider of innovative chemical solutions and research services.',
        enableLogging: true
    });
    
    // Set SEO based on current page
    const currentPage = getCurrentPage();
    setSEOForCurrentPage(seoManager, currentPage);
    
    // Initialize asset auditor for missing asset detection and fixing
    const assetAuditor = new AssetAuditor({
        enableLogging: true,
        enableAutoFix: true,
        checkInterval: 60000 // Check every minute
    });
    assetAuditor.init();
    
    // Initialize performance monitoring
    const performanceMonitor = new PerformanceMonitor({
        enableLogging: true,
        enableAnalytics: true,
        reportingInterval: 60000 // Report every minute
    });
    
    // Initialize progressive loader for immediate skeleton display
    const progressiveLoader = new ProgressiveLoader();
    progressiveLoader.init();
    
    // Initialize main app
    const app = new App();
    app.init();
    
    // Announce page load completion to screen readers
    setTimeout(() => {
        accessibilityManager.announceToScreenReader('Page loaded successfully. Use Tab to navigate or F6 to jump between sections.', 'polite');
    }, 1000);
    
    // Make managers globally available for debugging
    window.accessibilityManager = accessibilityManager;
    window.seoManager = seoManager;
    window.performanceMonitor = performanceMonitor;
    window.assetAuditor = assetAuditor;
});

function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    
    if (filename.includes('index') || path === '/') return 'home';
    if (filename.includes('products')) return 'products';
    if (filename.includes('team')) return 'team';
    if (filename.includes('research')) return 'research';
    if (filename.includes('blog')) return 'blog';
    if (filename.includes('journey')) return 'journey';
    
    return 'home'; // Default fallback
}

function setSEOForCurrentPage(seoManager, page) {
    switch (page) {
        case 'home':
            seoManager.setHomepageSEO();
            break;
        case 'products':
            seoManager.setProductsSEO();
            break;
        case 'team':
            seoManager.setTeamSEO();
            break;
        case 'research':
            seoManager.setResearchSEO();
            break;
        case 'blog':
            seoManager.setBlogSEO();
            break;
        case 'journey':
            seoManager.setJourneySEO();
            break;
        default:
            seoManager.setHomepageSEO();
    }
}