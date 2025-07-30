/**
 * Simple test to verify ErrorRecoveryManager and UserFeedbackManager functionality
 * This test can be run directly in the browser console
 */

// Test ErrorRecoveryManager
console.log('Testing ErrorRecoveryManager...');

// Create instance
const errorRecoveryManager = new (await import('../ErrorRecoveryManager.js')).default({
    enableLogging: true,
    maxRetries: 2
});

// Test logo recovery
console.log('Testing logo recovery...');
try {
    const logoResult = await errorRecoveryManager.recover(
        new Error('Logo failed to load'),
        'logo',
        '/nonexistent/logo.png'
    );
    console.log('Logo recovery result:', logoResult);
} catch (error) {
    console.log('Logo recovery failed as expected, testing graceful degradation...');
    const textLogo = errorRecoveryManager.createTextLogo('ChemActiva');
    console.log('Text logo created:', textLogo);
}

// Test image recovery
console.log('Testing image recovery...');
try {
    const imageResult = await errorRecoveryManager.recover(
        new Error('Image failed to load'),
        'image',
        '/nonexistent/image.jpg',
        { originalElement: { width: 300, height: 200, alt: 'Test image' } }
    );
    console.log('Image recovery result:', imageResult);
} catch (error) {
    console.log('Image recovery failed as expected, testing placeholder creation...');
    const placeholder = errorRecoveryManager.createImagePlaceholder({
        width: 300,
        height: 200,
        alt: 'Test image'
    });
    console.log('Image placeholder created:', placeholder);
}

// Test metrics
console.log('Recovery metrics:', errorRecoveryManager.getRecoveryMetrics());

// Test UserFeedbackManager
console.log('Testing UserFeedbackManager...');

// Create instance
const userFeedbackManager = new (await import('../UserFeedbackManager.js')).default({
    enableAccessibility: true,
    enableRetryButtons: true
});

// Test loading indicator
console.log('Testing loading indicator...');
const testContainer = document.createElement('div');
document.body.appendChild(testContainer);

const loadingIndicator = userFeedbackManager.showLoadingIndicator('test_loading', {
    message: 'Testing loading...',
    container: testContainer,
    position: 'inline'
});
console.log('Loading indicator created:', loadingIndicator);

// Hide after 2 seconds
setTimeout(() => {
    userFeedbackManager.hideLoadingIndicator('test_loading');
    console.log('Loading indicator hidden');
}, 2000);

// Test error message
console.log('Testing error message...');
const errorMessage = userFeedbackManager.showErrorMessage('test_error', {
    title: 'Test Error',
    message: 'This is a test error message with retry functionality.',
    container: testContainer,
    position: 'inline',
    enableRetry: true,
    retryCallback: () => {
        console.log('Retry button clicked!');
        return Promise.resolve('Retry successful');
    }
});
console.log('Error message created:', errorMessage);

// Test success message after 4 seconds
setTimeout(() => {
    userFeedbackManager.showSuccessMessage('test_success', {
        message: 'Test completed successfully!',
        container: testContainer,
        position: 'inline',
        autoHide: true
    });
    console.log('Success message shown');
}, 4000);

// Test feedback stats
setTimeout(() => {
    console.log('Feedback stats:', userFeedbackManager.getFeedbackStats());
}, 5000);

// Test ErrorHandler integration
console.log('Testing ErrorHandler integration...');

// Create enhanced ErrorHandler
const errorHandler = new (await import('../ErrorHandler.js')).default();

// Test image error handling
console.log('Testing enhanced image error handling...');
const testImage = document.createElement('img');
testImage.src = '/nonexistent/test-image.jpg';
testImage.alt = 'Test image';
testImage.width = 300;
testImage.height = 200;
testContainer.appendChild(testImage);

// Simulate image error
setTimeout(async () => {
    try {
        await errorHandler.handleImageError(testImage, {
            showUserFeedback: true,
            container: testContainer,
            productType: 'test-product'
        });
        console.log('Image error handled successfully');
    } catch (error) {
        console.log('Image error handling completed with fallback:', error.message);
    }
}, 6000);

// Test comprehensive stats after 8 seconds
setTimeout(() => {
    console.log('Comprehensive error handler stats:', errorHandler.getComprehensiveStats());
}, 8000);

console.log('All tests initiated. Check console output and DOM for results.');
console.log('You can also interact with the retry buttons that appear.');

// Export for manual testing
window.testErrorRecovery = {
    errorRecoveryManager,
    userFeedbackManager,
    errorHandler,
    testContainer
};