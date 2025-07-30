// src/js/ContactManager.js
// Simplified version without GSAP dependency for now

export default class ContactManager {
    constructor() {
        this.activeModal = null;
        this.eventListeners = new Map();
        this.isInitialized = false;
        this.formSubmissionInProgress = false;
        
        // Contact form configuration
        this.formConfig = {
            googleFormUrl: 'https://docs.google.com/forms/d/e/YOUR_FORM_ID_HERE/formResponse',
            formFields: {
                name: 'entry.YOUR_NAME_FIELD_ID',
                email: 'entry.YOUR_EMAIL_FIELD_ID',
                subject: 'entry.YOUR_SUBJECT_FIELD_ID',
                message: 'entry.YOUR_MESSAGE_FIELD_ID',
                product: 'entry.YOUR_PRODUCT_FIELD_ID'
            },
            isConfigured: false
        };
        
        this.formConfig.isConfigured = !this.formConfig.googleFormUrl.includes('YOUR_FORM_ID_HERE');
    }

    init() {
        if (this.isInitialized) {
            console.warn('ContactManager already initialized');
            return;
        }

        this.initEventListeners();
        this.initContactModals();
        this.initProductContactButtons();
        
        this.isInitialized = true;
        console.log('ContactManager initialized');
    }

    initEventListeners() {
        // Listen for product contact events
        window.addEventListener('productContactClick', (e) => {
            this.handleProductContactClick(e.detail);
        });

        // Listen for theme changes to update modal styles
        window.addEventListener('themeChanged', (e) => {
            this.handleThemeChange(e.detail.isDark);
        });

        // Handle escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.closeModal();
            }
        });
    }

    initContactModals() {
        // Create modal container if it doesn't exist
        let modalContainer = document.getElementById('contact-modal-container');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'contact-modal-container';
            document.body.appendChild(modalContainer);
        }
    }

    initProductContactButtons() {
        // Initialize contact buttons that aren't handled by ProductManager
        const contactButtons = document.querySelectorAll('.contact-button:not([data-handled])');
        
        contactButtons.forEach(button => {
            const clickHandler = (e) => this.handleContactButtonClick(e);
            button.addEventListener('click', clickHandler);
            button.setAttribute('data-handled', 'true');
            
            this.eventListeners.set(button, clickHandler);
        });
    }

    handleContactButtonClick(event) {
        event.preventDefault();
        
        const button = event.target.closest('.contact-button');
        const action = button.dataset.action || 'quote';
        const productId = button.dataset.product || 'general';
        
        // Simple button animation without GSAP
        button.style.transform = 'scale(0.95)';
        button.style.transition = 'transform 0.1s ease';
        
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 100);

        // Open appropriate modal based on action
        this.openContactModal(action, productId);
    }

    handleProductContactClick(detail) {
        const { productId, action, productName } = detail;
        
        // Open contact modal with product context
        this.openContactModal(action, productId, productName);
    }

    openContactModal(action = 'quote', productId = 'general', productName = null) {
        // Create modal HTML
        const modalHtml = this.createModalHtml(action, productId, productName);
        
        // Insert modal into container
        const modalContainer = document.getElementById('contact-modal-container');
        modalContainer.innerHTML = modalHtml;
        
        // Get modal element
        const modal = modalContainer.querySelector('.contact-modal');
        this.activeModal = modal;
        
        // Set up modal event listeners
        this.setupModalEventListeners(modal);
        
        // Show modal with simple animation
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus first input for accessibility
        const firstInput = modal.querySelector('.form-input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 300);
        }
    }

    createModalHtml(action, productId, productName) {
        const actionTitles = {
            quote: 'Request Quote',
            info: 'Request Information',
            demo: 'Request Demo',
            contact: 'Contact Us'
        };
        
        const title = actionTitles[action] || 'Contact Us';
        const productInfo = productName ? `
            <div class="product-inquiry-info">
                <div class="inquiry-product-name">${productName}</div>
                <div class="inquiry-product-details">Product inquiry for: ${productId}</div>
            </div>
        ` : '';

        return `
            <div class="contact-modal" role="dialog" aria-labelledby="modal-title" aria-modal="true">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="modal-title" class="modal-title">${title}</h2>
                        <button type="button" class="modal-close" aria-label="Close modal">×</button>
                    </div>
                    
                    ${productInfo}
                    
                    <form class="contact-form" data-action="${action}" data-product="${productId}">
                        <div class="form-group">
                            <label for="contact-name" class="form-label">Name *</label>
                            <input type="text" id="contact-name" name="name" class="form-input" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="contact-email" class="form-label">Email *</label>
                            <input type="email" id="contact-email" name="email" class="form-input" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="contact-subject" class="form-label">Subject</label>
                            <input type="text" id="contact-subject" name="subject" class="form-input" 
                                   value="${title}${productName ? ` - ${productName}` : ''}">
                        </div>
                        
                        <div class="form-group">
                            <label for="contact-message" class="form-label">Message *</label>
                            <textarea id="contact-message" name="message" class="form-textarea" 
                                      rows="5" required placeholder="Please provide details about your inquiry..."></textarea>
                        </div>
                        
                        <button type="submit" class="form-submit">
                            Send ${title}
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    setupModalEventListeners(modal) {
        // Close button
        const closeButton = modal.querySelector('.modal-close');
        const closeHandler = () => this.closeModal();
        closeButton.addEventListener('click', closeHandler);
        this.eventListeners.set(closeButton, closeHandler);

        // Click outside to close
        const backdropHandler = (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        };
        modal.addEventListener('click', backdropHandler);
        this.eventListeners.set(modal, backdropHandler);

        // Form submission
        const form = modal.querySelector('.contact-form');
        const submitHandler = (e) => this.handleFormSubmission(e);
        form.addEventListener('submit', submitHandler);
        this.eventListeners.set(form, submitHandler);
    }

    async handleFormSubmission(event) {
        event.preventDefault();
        
        if (this.formSubmissionInProgress) return;
        
        const form = event.target;
        const submitButton = form.querySelector('.form-submit');
        const formData = new FormData(form);
        
        // Get form context
        const action = form.dataset.action;
        const productId = form.dataset.product;
        
        // Set loading state
        this.formSubmissionInProgress = true;
        submitButton.disabled = true;
        const originalButtonText = submitButton.textContent;
        submitButton.innerHTML = 'Sending... <span class="loader-dots"><span>.</span><span>.</span><span>.</span></span>';

        try {
            // Prepare form data for submission
            const submissionData = new FormData();
            submissionData.append(this.formConfig.formFields.name, formData.get('name'));
            submissionData.append(this.formConfig.formFields.email, formData.get('email'));
            submissionData.append(this.formConfig.formFields.subject, formData.get('subject'));
            submissionData.append(this.formConfig.formFields.message, formData.get('message'));
            submissionData.append(this.formConfig.formFields.product, `${action}:${productId}`);

            // Submit form
            if (this.formConfig.isConfigured) {
                await fetch(this.formConfig.googleFormUrl, {
                    method: 'POST',
                    body: submissionData,
                    mode: 'no-cors'
                });
            } else {
                console.warn("Contact form not configured. Simulating success.");
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            // Show success message
            this.showSuccessMessage(action);
            
        } catch (error) {
            console.error('Form submission error:', error);
            this.showErrorMessage();
        } finally {
            // Reset form state
            this.formSubmissionInProgress = false;
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }

    showSuccessMessage(action) {
        const modal = this.activeModal;
        const modalContent = modal.querySelector('.modal-content');
        
        const actionMessages = {
            quote: 'Your quote request has been submitted successfully!',
            info: 'Your information request has been submitted successfully!',
            demo: 'Your demo request has been submitted successfully!',
            contact: 'Your message has been sent successfully!'
        };
        
        const message = actionMessages[action] || 'Your message has been sent successfully!';
        
        const successHtml = `
            <div class="success-message">
                <h3>Thank You!</h3>
                <p><strong>${message}</strong></p>
                <p>We'll get back to you within 24 hours.</p>
                <div class="success-actions">
                    <button type="button" class="contact-button primary" onclick="window.contactManager.closeModal()">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        // Simple content change without GSAP
        modalContent.style.opacity = '0';
        modalContent.style.transition = 'opacity 0.3s ease';
        
        setTimeout(() => {
            modalContent.innerHTML = successHtml;
            modalContent.style.opacity = '1';
        }, 300);
    }

    showErrorMessage() {
        const modal = this.activeModal;
        const form = modal.querySelector('.contact-form');
        
        // Create or update error message
        let errorMessage = modal.querySelector('.error-message');
        if (!errorMessage) {
            errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            form.parentNode.insertBefore(errorMessage, form);
        }
        
        errorMessage.innerHTML = `
            <p><strong>Submission Error</strong></p>
            <p>There was an error sending your message. Please try again or contact us directly.</p>
        `;
        
        // Simple animation without GSAP
        errorMessage.style.opacity = '0';
        errorMessage.style.transform = 'translateY(-10px)';
        errorMessage.style.transition = 'all 0.3s ease';
        
        requestAnimationFrame(() => {
            errorMessage.style.opacity = '1';
            errorMessage.style.transform = 'translateY(0)';
        });
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorMessage.style.opacity = '0';
            setTimeout(() => errorMessage.remove(), 300);
        }, 5000);
    }

    closeModal() {
        if (!this.activeModal) return;
        
        const modal = this.activeModal;
        
        // Simple modal close animation
        modal.classList.remove('active');
        
        // Clean up after animation
        setTimeout(() => {
            // Remove event listeners
            this.cleanupModalEventListeners(modal);
            
            // Remove modal from DOM
            const modalContainer = document.getElementById('contact-modal-container');
            modalContainer.innerHTML = '';
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            this.activeModal = null;
        }, 300);
    }

    cleanupModalEventListeners(modal) {
        // Remove all event listeners associated with this modal
        const elementsToClean = [
            modal.querySelector('.modal-close'),
            modal,
            modal.querySelector('.contact-form')
        ].filter(Boolean);
        
        elementsToClean.forEach(element => {
            const handler = this.eventListeners.get(element);
            if (handler) {
                element.removeEventListener('click', handler);
                element.removeEventListener('submit', handler);
                this.eventListeners.delete(element);
            }
        });
    }

    handleThemeChange(isDark) {
        // Update modal styles if modal is open
        if (this.activeModal) {
            // Theme changes are handled by CSS, no additional JS needed
            console.log(`ContactManager: Theme changed to ${isDark ? 'dark' : 'light'} mode`);
        }
    }

    // Public API methods
    isModalOpen() {
        return !!this.activeModal;
    }

    openQuoteModal(productId, productName) {
        this.openContactModal('quote', productId, productName);
    }

    openInfoModal(productId, productName) {
        this.openContactModal('info', productId, productName);
    }

    openDemoModal(productId, productName) {
        this.openContactModal('demo', productId, productName);
    }

    // Cleanup method for proper resource management
    cleanup() {
        // Close any open modal
        if (this.activeModal) {
            this.closeModal();
        }
        
        // Remove all event listeners
        this.eventListeners.forEach((handler, element) => {
            if (element && element.removeEventListener) {
                element.removeEventListener('click', handler);
                element.removeEventListener('submit', handler);
            }
        });
        this.eventListeners.clear();
        
        // Remove global event listeners
        window.removeEventListener('productContactClick', this.handleProductContactClick);
        window.removeEventListener('themeChanged', this.handleThemeChange);
        document.removeEventListener('keydown', this.handleEscapeKey);
        
        // Remove modal container
        const modalContainer = document.getElementById('contact-modal-container');
        if (modalContainer) {
            modalContainer.remove();
        }
        
        this.isInitialized = false;
    }

    // Static method to check if ContactManager is supported
    static isSupported() {
        return !!(window.FormData && window.fetch);
    }
}