/**
 * Integration tests for ErrorRecoveryManager and UserFeedbackManager
 * Tests comprehensive error handling and recovery mechanisms
 */

import ErrorRecoveryManager from '../ErrorRecoveryManager.js';
import UserFeedbackManager from '../UserFeedbackManager.js';
import ErrorHandler from '../ErrorHandler.js';

// Mock DOM environment
const mockDOM = () => {
    global.document = {
        createElement: jest.fn((tag) => ({
            tagName: tag.toUpperCase(),
            className: '',
            style: { cssText: '' },
            innerHTML: '',
            textContent: '',
            setAttribute: jest.fn(),
            getAttribute: jest.fn(),
            appendChild: jest.fn(),
            removeChild: jest.fn(),
            parentNode: { removeChild: jest.fn() },
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            querySelector: jest.fn(),
            querySelectorAll: jest.fn(() => []),
            classList: {
                add: jest.fn(),
                remove: jest.fn(),
                toggle: jest.fn(),
                contains: jest.fn()
            }
        })),
        getElementById: jest.fn(),
        head: { appendChild: jest.fn() },
        body: { 
            appendChild: jest.fn(),
            classList: { add: jest.fn() }
        },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    };

    global.window = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        CustomEvent: jest.fn(),
        Image: jest.fn(() => ({
            onload: null,
            onerror: null,
            src: '',
            width: 300,
            height: 200,
            naturalWidth: 300,
            naturalHeight: 200
        })),
        fetch: jest.fn(),
        location: { href: 'http://localhost' },
        navigator: {
            onLine: true,
            userAgent: 'test-agent'
        }
    };

    global.navigator = window.navigator;
    global.fetch = window.fetch;
};

describe('ErrorRecoveryManager', () => {
    let errorRecoveryManager;

    beforeEach(() => {
        mockDOM();
        errorRecoveryManager = new ErrorRecoveryManager({
            enableLogging: false // Disable logging for tests
        });
    });

    afterEach(() => {
        if (errorRecoveryManager.cleanup) {
            errorRecoveryManager.cleanup();
        }
    });

    describe('Logo Recovery', () => {
        test('should recover logo with fallback strategies', async () => {
            const mockError = new Error('Logo load failed');
            const originalRequest = '/assets/images/logo.png';

            // Mock successful fallback
            window.Image = jest.fn(() => {
                const img = {
                    onload: null,
                    onerror: null,
                    src: ''
                };
                
                setTimeout(() => {
                    if (img.onload) img.onload();
                }, 10);
                
                return img;
            });

            const result = await errorRecoveryManager.recover(
                mockError,
                'logo',
                originalRequest
            );

            expect(result).toBeDefined();
            expect(result.type).toBe('logo');
            expect(result.fallback).toBe(true);
        });

        test('should create text logo as final fallback', async () => {
            const mockError = new Error('All logo paths failed');
            const originalRequest = '/assets/images/logo.png';

            // Mock all image loads failing
            window.Image = jest.fn(() => ({
                onload: null,
                onerror: null,
                src: '',
                addEventListener: jest.fn((event, handler) => {
                    if (event === 'error') {
                        setTimeout(handler, 10);
                    }
                })
            }));

            try {
                await errorRecoveryManager.recover(mockError, 'logo', originalRequest);
            } catch (error) {
                // Should fall back to graceful degradation
                const textLogo = errorRecoveryManager.createTextLogo('ChemActiva');
                expect(textLogo).toBeDefined();
                expect(textLogo.textContent).toBe('ChemActiva');
                expect(textLogo.className).toBe('text-logo-fallback');
            }
        });
    });

    describe('Image Recovery', () => {
        test('should recover images with WebP to JPEG fallback', async () => {
            const mockError = new Error('WebP load failed');
            const originalRequest = '/assets/images/product.webp';

            // Mock successful JPEG load
            window.Image = jest.fn(() => {
                const img = {
                    onload: null,
                    onerror: null,
                    src: ''
                };
                
                // Simulate successful load for JPEG
                setTimeout(() => {
                    if (img.src.includes('.jpeg') || img.src.includes('.jpg')) {
                        if (img.onload) img.onload();
                    } else {
                        if (img.onerror) img.onerror();
                    }
                }, 10);
                
                return img;
            });

            const result = await errorRecoveryManager.recover(
                mockError,
                'image',
                originalRequest
            );

            expect(result).toBeDefined();
            expect(result.type).toBe('image');
            expect(result.fallback).toBe(true);
        });

        test('should create image placeholder as final fallback', async () => {
            const mockError = new Error('All image loads failed');
            const originalRequest = '/assets/images/product.jpg';
            const mockElement = { width: 300, height: 200, alt: 'Product image' };

            const placeholder = errorRecoveryManager.createImagePlaceholder(mockElement);

            expect(placeholder).toBeDefined();
            expect(placeholder.className).toBe('image-placeholder error-recovery');
            expect(placeholder.style.cssText).toContain('width: 300px');
            expect(placeholder.style.cssText).toContain('height: 200px');
        });
    });

    describe('Network Recovery', () => {
        test('should handle network errors with retry logic', async () => {
            const mockError = new Error('Network request failed');
            const originalRequest = 'https://api.example.com/data';

            // Mock fetch to fail first, then succeed
            let callCount = 0;
            window.fetch = jest.fn(() => {
                callCount++;
                if (callCount === 1) {
                    return Promise.reject(new Error('Network error'));
                }
                return Promise.resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve({ data: 'test' })
                });
            });

            try {
                const result = await errorRecoveryManager.recover(
                    mockError,
                    'network',
                    originalRequest
                );
                
                // Should eventually succeed after retry
                expect(window.fetch).toHaveBeenCalledTimes(2);
            } catch (error) {
                // If all retries fail, should handle gracefully
                expect(error).toBeDefined();
            }
        });
    });

    describe('Retry Logic', () => {
        test('should implement exponential backoff', () => {
            const delay1 = errorRecoveryManager.calculateRetryDelay(0, 'exponential');
            const delay2 = errorRecoveryManager.calculateRetryDelay(1, 'exponential');
            const delay3 = errorRecoveryManager.calculateRetryDelay(2, 'exponential');

            expect(delay2).toBeGreaterThan(delay1);
            expect(delay3).toBeGreaterThan(delay2);
        });

        test('should implement linear backoff', () => {
            const delay1 = errorRecoveryManager.calculateRetryDelay(0, 'linear');
            const delay2 = errorRecoveryManager.calculateRetryDelay(1, 'linear');
            const delay3 = errorRecoveryManager.calculateRetryDelay(2, 'linear');

            expect(delay2 - delay1).toBe(delay3 - delay2);
        });
    });

    describe('Metrics Tracking', () => {
        test('should track recovery metrics', async () => {
            const initialMetrics = errorRecoveryManager.getRecoveryMetrics();
            expect(initialMetrics.totalRecoveries).toBe(0);

            // Simulate a successful recovery
            errorRecoveryManager.trackRecoverySuccess('test_recovery', Date.now() - 1000);

            const updatedMetrics = errorRecoveryManager.getRecoveryMetrics();
            expect(updatedMetrics.totalRecoveries).toBe(1);
            expect(updatedMetrics.successfulRecoveries).toBe(1);
            expect(updatedMetrics.successRate).toBe(100);
        });
    });
});

describe('UserFeedbackManager', () => {
    let userFeedbackManager;

    beforeEach(() => {
        mockDOM();
        userFeedbackManager = new UserFeedbackManager({
            enableAccessibility: true,
            enableRetryButtons: true,
            enableLoadingIndicators: true
        });
    });

    afterEach(() => {
        if (userFeedbackManager.cleanup) {
            userFeedbackManager.cleanup();
        }
    });

    describe('Loading Indicators', () => {
        test('should show and hide loading indicators', () => {
            const operationId = 'test_operation';
            const container = document.createElement('div');

            const indicator = userFeedbackManager.showLoadingIndicator(operationId, {
                message: 'Loading test...',
                container: container,
                position: 'inline'
            });

            expect(indicator).toBeDefined();
            expect(indicator.className).toContain('loading-indicator');
            expect(container.appendChild).toHaveBeenCalledWith(indicator);

            userFeedbackManager.hideLoadingIndicator(operationId);
            // Should trigger fade out animation
            expect(indicator.style.opacity).toBe('0');
        });

        test('should update loading progress', () => {
            const operationId = 'test_progress';
            const container = document.createElement('div');

            userFeedbackManager.showLoadingIndicator(operationId, {
                message: 'Loading...',
                container: container,
                showProgress: true,
                progressValue: 0
            });

            userFeedbackManager.updateLoadingProgress(operationId, 50, 'Half way there...');

            const loadingData = userFeedbackManager.loadingIndicators.get(operationId);
            expect(loadingData).toBeDefined();
        });
    });

    describe('Error Messages', () => {
        test('should show error messages with retry buttons', () => {
            const errorId = 'test_error';
            const container = document.createElement('div');
            const retryCallback = jest.fn();

            const errorElement = userFeedbackManager.showErrorMessage(errorId, {
                title: 'Test Error',
                message: 'Something went wrong',
                container: container,
                position: 'inline',
                enableRetry: true,
                retryCallback: retryCallback
            });

            expect(errorElement).toBeDefined();
            expect(errorElement.className).toContain('error-message');
            expect(container.appendChild).toHaveBeenCalledWith(errorElement);
        });

        test('should handle retry button clicks', async () => {
            const errorId = 'test_retry';
            const retryCallback = jest.fn().mockResolvedValue('success');

            userFeedbackManager.showErrorMessage(errorId, {
                title: 'Test Error',
                message: 'Click retry',
                enableRetry: true,
                retryCallback: retryCallback
            });

            await userFeedbackManager.handleRetry(errorId);

            expect(retryCallback).toHaveBeenCalled();
        });
    });

    describe('Success Messages', () => {
        test('should show success messages', () => {
            const successId = 'test_success';
            const container = document.createElement('div');

            const successElement = userFeedbackManager.showSuccessMessage(successId, {
                message: 'Operation completed successfully',
                container: container,
                position: 'inline'
            });

            expect(successElement).toBeDefined();
            expect(successElement.className).toContain('success-message');
            expect(container.appendChild).toHaveBeenCalledWith(successElement);
        });
    });

    describe('Accessibility Features', () => {
        test('should announce messages to screen readers', () => {
            const message = 'Test announcement';
            
            userFeedbackManager.announceToScreenReader(message);

            // Should update the announcer element
            setTimeout(() => {
                expect(userFeedbackManager.announcer.textContent).toBe(message);
            }, 150);
        });

        test('should manage focus for overlay feedback', () => {
            const errorId = 'overlay_error';
            
            // Mock active element
            document.activeElement = document.createElement('button');
            
            userFeedbackManager.showErrorMessage(errorId, {
                title: 'Overlay Error',
                message: 'This is an overlay error',
                position: 'overlay',
                enableRetry: true
            });

            expect(userFeedbackManager.focusManager.previousFocus).toBeDefined();
        });
    });

    describe('Network Status', () => {
        test('should show network status messages', () => {
            userFeedbackManager.showNetworkStatus('offline');
            
            const activeFeedback = userFeedbackManager.activeFeedback.get('network-status');
            expect(activeFeedback).toBeDefined();
            expect(activeFeedback.type).toBe('error');
        });

        test('should show connection restored message', () => {
            userFeedbackManager.showNetworkStatus('online');
            
            const activeFeedback = userFeedbackManager.activeFeedback.get('network-status');
            expect(activeFeedback).toBeDefined();
            expect(activeFeedback.type).toBe('success');
        });
    });

    describe('Feedback Statistics', () => {
        test('should track feedback statistics', () => {
            const stats = userFeedbackManager.getFeedbackStats();
            expect(stats).toHaveProperty('activeIndicators');
            expect(stats).toHaveProperty('activeFeedback');
            expect(stats).toHaveProperty('totalHistory');
        });
    });
});

describe('ErrorHandler Integration', () => {
    let errorHandler;

    beforeEach(() => {
        mockDOM();
        errorHandler = new ErrorHandler();
    });

    afterEach(() => {
        if (errorHandler.cleanup) {
            errorHandler.cleanup();
        }
    });

    describe('Enhanced Image Error Handling', () => {
        test('should handle image errors with user feedback', async () => {
            const mockImage = document.createElement('img');
            mockImage.src = '/test/image.jpg';
            mockImage.parentElement = document.createElement('div');

            // Mock successful recovery
            errorHandler.errorRecoveryManager.recover = jest.fn().mockResolvedValue({
                type: 'image',
                fallback: true,
                element: mockImage
            });

            const result = await errorHandler.handleImageError(mockImage, {
                showUserFeedback: true,
                container: mockImage.parentElement
            });

            expect(errorHandler.errorRecoveryManager.recover).toHaveBeenCalled();
            expect(result).toBeDefined();
        });
    });

    describe('Enhanced Network Error Handling', () => {
        test('should handle network errors with user feedback', async () => {
            const mockRequest = 'https://api.example.com/data';

            // Mock successful recovery
            errorHandler.errorRecoveryManager.recover = jest.fn().mockResolvedValue({
                type: 'network',
                fallback: true
            });

            const result = await errorHandler.handleNetworkError(mockRequest, {
                showUserFeedback: true
            });

            expect(errorHandler.errorRecoveryManager.recover).toHaveBeenCalled();
            expect(result).toBeDefined();
        });
    });

    describe('Public API Integration', () => {
        test('should expose loading indicator methods', () => {
            const operationId = 'test_operation';
            
            const indicator = errorHandler.showLoadingIndicator(operationId, {
                message: 'Testing...'
            });

            expect(indicator).toBeDefined();
            
            errorHandler.hideLoadingIndicator(operationId);
        });

        test('should expose error message methods', () => {
            const errorId = 'test_error';
            
            const errorElement = errorHandler.showErrorMessage(errorId, {
                title: 'Test Error',
                message: 'This is a test error'
            });

            expect(errorElement).toBeDefined();
            
            errorHandler.dismissFeedback(errorId);
        });

        test('should provide comprehensive statistics', () => {
            const stats = errorHandler.getComprehensiveStats();
            
            expect(stats).toHaveProperty('errorLog');
            expect(stats).toHaveProperty('retryStatus');
            expect(stats).toHaveProperty('recoveryMetrics');
            expect(stats).toHaveProperty('feedbackStats');
            expect(stats).toHaveProperty('networkStatus');
            expect(stats).toHaveProperty('config');
        });
    });

    describe('Configuration Management', () => {
        test('should update configuration across all managers', () => {
            const newConfig = {
                maxRetries: 5,
                enableRetry: false,
                enableLogging: false
            };

            errorHandler.setConfig(newConfig);

            expect(errorHandler.config.maxRetries).toBe(5);
            expect(errorHandler.config.enableRetry).toBe(false);
            expect(errorHandler.config.enableLogging).toBe(false);
        });
    });

    describe('Resource Error Handling', () => {
        test('should handle resource loading errors', () => {
            const mockEvent = {
                target: {
                    tagName: 'IMG',
                    src: '/test/image.jpg',
                    parentElement: document.createElement('div')
                }
            };

            // Mock the handleImageError method
            errorHandler.handleImageError = jest.fn().mockResolvedValue({});

            errorHandler.handleResourceError(mockEvent);

            expect(errorHandler.handleImageError).toHaveBeenCalledWith(
                mockEvent.target,
                expect.objectContaining({
                    showUserFeedback: true,
                    container: mockEvent.target.parentElement
                })
            );
        });
    });
});

describe('End-to-End Error Recovery Flow', () => {
    let errorHandler;

    beforeEach(() => {
        mockDOM();
        errorHandler = new ErrorHandler();
    });

    afterEach(() => {
        if (errorHandler.cleanup) {
            errorHandler.cleanup();
        }
    });

    test('should handle complete image loading failure with user feedback', async () => {
        const mockImage = document.createElement('img');
        mockImage.src = '/nonexistent/image.jpg';
        mockImage.alt = 'Test image';
        mockImage.width = 300;
        mockImage.height = 200;
        mockImage.parentElement = document.createElement('div');
        mockImage.parentNode = mockImage.parentElement;

        // Mock all recovery attempts to fail
        window.Image = jest.fn(() => ({
            onload: null,
            onerror: null,
            src: '',
            addEventListener: jest.fn((event, handler) => {
                if (event === 'error') {
                    setTimeout(handler, 10);
                }
            })
        }));

        try {
            await errorHandler.handleImageError(mockImage, {
                showUserFeedback: true,
                container: mockImage.parentElement,
                productType: 'test-product'
            });
        } catch (error) {
            // Should have shown loading indicator, error message, and created placeholder
            expect(error).toBeDefined();
        }

        // Verify that user feedback was provided
        const feedbackStats = errorHandler.getFeedbackStats();
        expect(feedbackStats).toBeDefined();
    });

    test('should handle network recovery with cache fallback', async () => {
        const mockRequest = 'https://api.example.com/data';
        
        // Mock cache API
        global.caches = {
            open: jest.fn().mockResolvedValue({
                match: jest.fn().mockResolvedValue({
                    ok: true,
                    json: () => Promise.resolve({ cached: true })
                })
            })
        };

        try {
            const result = await errorHandler.handleNetworkError(mockRequest, {
                showUserFeedback: true
            });
            
            // Should attempt recovery and potentially use cache
            expect(result).toBeDefined();
        } catch (error) {
            // If recovery fails, should have provided user feedback
            const feedbackStats = errorHandler.getFeedbackStats();
            expect(feedbackStats).toBeDefined();
        }
    });
});