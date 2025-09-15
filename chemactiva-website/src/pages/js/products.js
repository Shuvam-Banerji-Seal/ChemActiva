// Products Page JavaScript - Modern Flash Cards Experience
import UIAnimations from './UIAnimations.js';
import ProductFlashCards from './ProductFlashCards.js';
import ContactManager from './ContactManager.js';
import ModernThemeManager from './ModernThemeManager.js';
import ModernCursorEffects from './ModernCursorEffects.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize modern theme manager first for proper dark mode support
        const modernThemeManager = new ModernThemeManager();
        
        // Initialize theme toggle and navbar
        const uiAnimations = new UIAnimations();
        uiAnimations.init();
        
        // Initialize modern flash cards for products
        const productFlashCards = new ProductFlashCards();
        productFlashCards.init();
        
        // Initialize contact manager for product inquiries and quotes
        const contactManager = new ContactManager();
        contactManager.init();
        
        // Initialize modern cursor effects for enhanced interactivity
        const modernCursorEffects = new ModernCursorEffects();
        console.log('Modern cursor effects initialized for products page');
        
        // Listen for flash card events
        window.addEventListener('flashCardActionClick', (event) => {
            const { cardIndex, action, productId, buttonText } = event.detail;
            console.log(`Flash card action clicked: ${action} for ${productId} (Card: ${cardIndex})`);
            
            // Handle different actions
            if (action === 'quote' || action === 'inquiry') {
                // Trigger contact manager
                const contactEvent = new CustomEvent('productContactClick', {
                    detail: {
                        productId: productId,
                        action: action,
                        cardIndex: cardIndex,
                        productName: buttonText
                    }
                });
                window.dispatchEvent(contactEvent);
            }
        });
        
        // Listen for collapsible toggle events
        window.addEventListener('flashCardCollapsibleToggle', (event) => {
            const { cardIndex, sectionIndex, isExpanded } = event.detail;
            console.log(`Collapsible ${isExpanded ? 'expanded' : 'collapsed'} for card ${cardIndex}, section ${sectionIndex}`);
        });
        
        // Listen for tag clicks
        window.addEventListener('flashCardTagClick', (event) => {
            const { cardIndex, tagIndex, isActive, tagText } = event.detail;
            console.log(`Tag "${tagText}" ${isActive ? 'activated' : 'deactivated'} for card ${cardIndex}`);
        });
        
        // Listen for card hover events
        window.addEventListener('flashCardCardHoverEnter', (event) => {
            const { cardIndex, productId } = event.detail;
            console.log(`Card ${cardIndex} (${productId}) hovered`);
        });
        
        window.addEventListener('flashCardCardHoverLeave', (event) => {
            const { cardIndex, productId } = event.detail;
            console.log(`Card ${cardIndex} (${productId}) hover ended`);
        });
        
        // Set current year in footer
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
        
        // Store references globally for potential cleanup and debugging
        window.productFlashCards = productFlashCards;
        window.contactManager = contactManager;
        window.uiAnimations = uiAnimations;
        window.modernCursorEffects = modernCursorEffects;
        
        console.log('Products page initialized with modern flash cards');
        
    } catch (error) {
        console.error('Error initializing products page:', error);
        
        // Fallback initialization for basic functionality
        console.log('Falling back to basic product page functionality...');
        
        // Basic theme toggle
        try {
            const uiAnimations = new UIAnimations();
            uiAnimations.init();
        } catch (e) {
            console.error('Failed to initialize UIAnimations:', e);
        }
        
        // Basic product card hover effects
        const productCards = document.querySelectorAll('.product-card, .product-card-enhanced, .product-flash-card');
        productCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
                card.style.transition = 'transform 0.3s ease';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
            });
        });
        
        // Basic contact button functionality
        const contactButtons = document.querySelectorAll('.contact-button, .flash-card-btn');
        contactButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const action = button.dataset.action || 'contact';
                const productName = button.closest('.product-card, .product-card-enhanced, .product-flash-card')?.querySelector('h3, .flash-card-title')?.textContent || 'Product';
                alert(`Contact form for ${productName} - ${action} (Enhanced features temporarily unavailable)`);
            });
        });
        
        // Set current year in footer
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
        
        console.log('Basic product page functionality initialized');
    }
});
