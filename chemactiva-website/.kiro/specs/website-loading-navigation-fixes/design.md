# Design Document

## Overview

This design addresses critical loading and navigation issues in the ChemActiva website that significantly impact user experience. The problems stem from unreliable asset loading, unnecessary HeroLoader activation, and image gallery failures. The solution implements robust loading state management, intelligent caching strategies, and comprehensive error handling to ensure consistent performance across all pages and navigation scenarios.

The design builds upon the existing architecture while introducing fail-safe mechanisms, improved asset preloading, and smart navigation detection to eliminate the current loading issues.

## Architecture

### Loading State Management Architecture
The design introduces a centralized LoadingStateManager that coordinates all loading operations:

- **AssetLoadingManager**: Handles logo, image, and critical asset loading with retry mechanisms
- **NavigationStateManager**: Tracks page context and prevents unnecessary loading screens
- **CacheManager**: Manages asset caching and cache validation
- **ErrorRecoveryManager**: Provides fallback strategies for failed operations

### Navigation Flow Architecture
Enhanced navigation logic that distinguishes between:

- **Initial page loads**: Require full loading sequence
- **Page transitions**: Use cached assets and skip unnecessary loaders
- **Asset-dependent loads**: Only show loading for genuinely new content
- **Error recovery**: Graceful fallbacks when assets fail

### Image Loading Architecture
Robust image loading system with:

- **Progressive loading**: Multiple fallback strategies for images
- **Preloading optimization**: Critical images loaded with higher priority
- **Error state management**: Proper handling of failed image loads
- **Gallery state preservation**: Maintains gallery functionality during transitions

## Components and Interfaces

### LoadingStateManager
```javascript
class LoadingStateManager {
  constructor() {
    this.loadingStates = new Map();
    this.assetCache = new Map();
    this.criticalAssets = ['logo', 'hero-images'];
  }

  async loadCriticalAssets() {
    // Preload logo and essential assets with retry logic
  }

  shouldShowLoader(pageType, navigationContext) {
    // Intelligent decision on when to show loading screens
  }

  handleLoadingFailure(assetType, fallbackStrategy) {
    // Comprehensive error handling with fallbacks
  }
}
```

### AssetLoadingManager
```javascript
class AssetLoadingManager {
  async loadAssetWithRetry(assetUrl, options = {}) {
    // Exponential backoff retry mechanism
    // Multiple path attempts for assets
    // WebP/fallback format handling
  }

  preloadCriticalAssets(assetList) {
    // Strategic preloading of critical assets
  }

  validateAssetCache(assetUrl) {
    // Cache validation and invalidation logic
  }
}
```

### NavigationStateManager
```javascript
class NavigationStateManager {
  constructor() {
    this.currentPage = null;
    this.previousPage = null;
    this.assetLoadingState = new Map();
  }

  trackNavigation(fromPage, toPage) {
    // Track navigation context
  }

  shouldSkipLoader(targetPage) {
    // Determine if loader should be skipped
  }

  preservePageContext() {
    // Maintain page context during navigation
  }
}
```

### Enhanced ProductImageGallery
```javascript
class ProductImageGallery {
  constructor(container, options = {}) {
    this.errorRecovery = new ImageErrorRecovery();
    this.loadingStates = new Map();
    this.fallbackStrategies = ['webp', 'jpeg', 'placeholder'];
  }

  async loadImageWithFallbacks(imageData) {
    // Multiple fallback attempts
    // Progressive enhancement
    // Error state management
  }

  handleImageTransition(fromIndex, toIndex) {
    // Smooth transitions without white screens
    // Loading state preservation
  }
}
```

## Data Models

### Loading State Model
```javascript
{
  assetId: string,
  status: 'loading' | 'loaded' | 'failed' | 'cached',
  attempts: number,
  lastAttempt: timestamp,
  fallbackUsed: boolean,
  errorDetails: object
}
```

### Navigation Context Model
```javascript
{
  currentPage: string,
  previousPage: string,
  navigationMethod: 'direct' | 'link' | 'back' | 'forward',
  assetsRequired: string[],
  cacheStatus: object,
  shouldShowLoader: boolean
}
```

### Asset Cache Model
```javascript
{
  url: string,
  type: 'image' | 'css' | 'js' | 'font',
  cached: boolean,
  cacheTime: timestamp,
  size: number,
  fallbackUrl: string,
  priority: 'critical' | 'high' | 'normal' | 'low'
}
```

## Error Handling

### Logo Loading Fallbacks
- **Primary**: Load from `/assets/images/logo.png`
- **Secondary**: Try alternative paths (`./public/assets/images/logo.png`, etc.)
- **Tertiary**: Use base64-encoded fallback logo
- **Final**: Display styled text logo with proper branding

### Image Gallery Error Recovery
- **Progressive loading**: WebP → JPEG → placeholder
- **Retry mechanism**: Exponential backoff with max 3 attempts
- **State preservation**: Maintain gallery functionality during errors
- **User feedback**: Clear loading states instead of white screens

### Navigation Error Handling
- **Asset validation**: Check asset availability before navigation
- **Graceful degradation**: Skip animations if assets unavailable
- **Context preservation**: Maintain page state during errors
- **Recovery mechanisms**: Automatic retry and fallback strategies

### Network Error Recovery
- **Connection detection**: Identify slow/poor network conditions
- **Adaptive loading**: Reduce quality/complexity on poor connections
- **Offline handling**: Provide cached content when possible
- **User notification**: Clear feedback about connection issues

## Testing Strategy

### Loading Performance Testing
- **Asset loading times**: Measure and optimize critical asset loading
- **Network simulation**: Test under various connection conditions
- **Cache effectiveness**: Validate caching strategies and hit rates
- **Error recovery**: Test all fallback mechanisms

### Navigation Flow Testing
- **Page transition scenarios**: Test all navigation paths
- **Cache validation**: Ensure proper cache usage and invalidation
- **Context preservation**: Verify page state maintenance
- **Error scenarios**: Test navigation under error conditions

### Image Gallery Testing
- **Image loading scenarios**: Test various image formats and sizes
- **Error conditions**: Simulate network failures and asset unavailability
- **User interactions**: Test gallery functionality during loading states
- **Accessibility**: Ensure proper screen reader support during errors

### Cross-browser Compatibility
- **Modern browsers**: Chrome, Firefox, Safari, Edge
- **Mobile browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **Legacy support**: Graceful degradation for older browsers
- **Feature detection**: Proper fallbacks for unsupported features

## Implementation Approach

### Phase 1: Critical Asset Loading
- Implement robust logo loading with multiple fallback strategies
- Add asset preloading for critical resources
- Create retry mechanisms with exponential backoff
- Establish proper loading state indicators

### Phase 2: Navigation Intelligence
- Implement NavigationStateManager to track page context
- Add logic to skip unnecessary loading screens
- Create cache validation and management system
- Establish proper page transition handling

### Phase 3: Image Gallery Fixes
- Fix ProductImageGallery white screen issues
- Implement progressive image loading with fallbacks
- Add proper error states and user feedback
- Create smooth transition handling

### Phase 4: Performance Optimization
- Optimize asset caching strategies
- Implement intelligent preloading based on user behavior
- Add performance monitoring and metrics
- Create adaptive loading for different network conditions

## Integration Points

### Existing HeroLoader Integration
- Modify HeroLoader to use new AssetLoadingManager
- Add intelligent loading decision logic
- Preserve existing animation capabilities
- Maintain backward compatibility

### App.js Integration
- Integrate LoadingStateManager into main App class
- Update navigation handling logic
- Add error recovery mechanisms
- Maintain existing component initialization

### ProductImageGallery Integration
- Enhance existing gallery with error recovery
- Add progressive loading capabilities
- Implement proper state management
- Maintain existing accessibility features

### Performance Manager Integration
- Extend existing PerformanceManager with loading metrics
- Add cache management capabilities
- Integrate with error handling systems
- Maintain existing optimization features

This design ensures robust, reliable loading and navigation behavior while maintaining the existing user experience and performance characteristics of the ChemActiva website.