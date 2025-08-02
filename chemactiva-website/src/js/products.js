// Products Page JavaScript - Enhanced Product Experience
import UIAnimations from './UIAnimations.js';
import ProductManager from './ProductManager.js';
import ProductImageGallery from './ProductImageGallery.js';
import ContactManager from './ContactManager.js';
import ModernThemeManager from './ModernThemeManager.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize modern theme manager first for proper dark mode support
        const modernThemeManager = new ModernThemeManager();
        
        // Initialize theme toggle and navbar
        const uiAnimations = new UIAnimations();
        uiAnimations.init();
        
        // Initialize enhanced product manager with UIAnimations integration
        const productManager = new ProductManager(uiAnimations);
        productManager.init();
        
        // Initialize contact manager for product inquiries and quotes
        const contactManager = new ContactManager();
        contactManager.init();
        
        // Initialize ProductImageGallery for enhanced product cards
        const enhancedProductCards = document.querySelectorAll('.product-card-enhanced');
        const galleries = [];
        
        enhancedProductCards.forEach(card => {
            const imageContainer = card.querySelector('.product-image-carousel-enhanced');
            if (imageContainer) {
                const images = imageContainer.querySelectorAll('img');
                
                // Only initialize gallery if there are multiple images
                if (images.length > 1) {
                    const gallery = new ProductImageGallery(imageContainer, {
                        autoPlay: true,
                        autoPlayDelay: 4000,
                        showThumbnails: true,
                        enableKeyboard: true,
                        enableTouch: true,
                        transitionDuration: 0.6
                    });
                    galleries.push(gallery);
                }
            }
        });
        
        // Initialize legacy product image carousels (for backward compatibility)
        const legacyProductCards = document.querySelectorAll('.product-card:not(.product-card-enhanced)');
        
        legacyProductCards.forEach(card => {
            const images = card.querySelectorAll('.product-image-carousel img');
            if (images.length > 1) {
                let currentIndex = 0;
                
                // Set initial image
                images[0].style.opacity = 1;
                
                // Rotate images every 5 seconds
                setInterval(() => {
                    images[currentIndex].style.opacity = 0;
                    currentIndex = (currentIndex + 1) % images.length;
                    images[currentIndex].style.opacity = 1;
                }, 5000);
            }
        });
        
        // Listen for theme changes to update product card animations
        window.addEventListener('themeChanged', (event) => {
            if (productManager) {
                productManager.handleThemeChange(event.detail.isDark);
            }
        });
        
        // Listen for product CTA clicks for enhanced interactivity
        window.addEventListener('productCTAClick', (event) => {
            const { productIndex, productTitle, cardElement } = event.detail;
            console.log(`Product CTA clicked: ${productTitle} (Index: ${productIndex})`);
            
            // Add custom behavior here - could open modal, navigate to product page, etc.
            // For now, just add a visual feedback
            cardElement.style.transform = 'scale(0.98)';
            setTimeout(() => {
                cardElement.style.transform = '';
            }, 150);
        });
        
        // Listen for accordion toggle events
        window.addEventListener('accordionToggle', (event) => {
            const { cardIndex, isExpanded } = event.detail;
            console.log(`Accordion ${isExpanded ? 'expanded' : 'collapsed'} for card ${cardIndex}`);
        });
        
        // Set current year in footer
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
        
        // Store references globally for potential cleanup and debugging
        window.productManager = productManager;
        window.contactManager = contactManager;
        window.productGalleries = galleries;
        window.uiAnimations = uiAnimations;
        
        // Log performance metrics after initialization
        setTimeout(() => {
            if (productManager) {
                const metrics = productManager.getPerformanceMetrics();
                console.log('ProductManager Performance Metrics:', metrics);
            }
        }, 2000);
        
        console.log('Products page initialized with enhanced functionality');
        
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
        const productCards = document.querySelectorAll('.product-card, .product-card-enhanced');
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
        const contactButtons = document.querySelectorAll('.contact-button');
        contactButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const action = button.dataset.action || 'contact';
                const productName = button.closest('.product-card, .product-card-enhanced')?.querySelector('h3')?.textContent || 'Product';
                alert(`Contact form for ${productName} - ${action} (Enhanced features temporarily unavailable)`);
            });
        });
        
        // Set current year in footer
        const currentYearSpan = document.getElementById('current-year');
        if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
        
        console.log('Basic product page functionality initialized');
    }
});
