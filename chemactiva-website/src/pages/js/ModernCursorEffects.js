// src/js/ModernCursorEffects.js
/**
 * Modern Cursor Effects - Custom cursor with trail and interactive hover effects
 */
class ModernCursorEffects {
    constructor() {
        this.cursor = null;
        this.cursorTrail = [];
        this.trailLength = 8;
        this.mouseX = 0;
        this.mouseY = 0;
        this.isHovering = false;
        this.isMobile = window.innerWidth <= 768;
        
        // Bind methods
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.updateCursor = this.updateCursor.bind(this);
        this.updateTrail = this.updateTrail.bind(this);
        
        this.init();
    }

    init() {
        // Don't initialize on mobile devices
        if (this.isMobile) {
            return;
        }

        // Check if user prefers reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        this.createCursor();
        this.createTrail();
        this.setupEventListeners();
        this.startAnimation();
        
        console.log('[ModernCursorEffects] Initialized');
    }

    createCursor() {
        this.cursor = document.createElement('div');
        this.cursor.className = 'custom-cursor';
        document.body.appendChild(this.cursor);
    }

    createTrail() {
        for (let i = 0; i < this.trailLength; i++) {
            const trailDot = document.createElement('div');
            trailDot.className = 'cursor-trail';
            trailDot.style.opacity = (1 - i / this.trailLength) * 0.6;
            trailDot.style.transform = `scale(${1 - i / this.trailLength})`;
            document.body.appendChild(trailDot);
            
            this.cursorTrail.push({
                element: trailDot,
                x: 0,
                y: 0,
                targetX: 0,
                targetY: 0
            });
        }
    }

    setupEventListeners() {
        // Mouse movement
        document.addEventListener('mousemove', this.handleMouseMove);
        
        // Hover effects for interactive elements
        const interactiveElements = document.querySelectorAll(`
            a, button, .focus-item, .featured-product, .cta-button,
            .card-style, .product-card, .article-card, .contact-button,
            input, textarea, select, [role="button"], [tabindex="0"]
        `);
        
        interactiveElements.forEach(element => {
            element.addEventListener('mouseenter', this.handleMouseEnter);
            element.addEventListener('mouseleave', this.handleMouseLeave);
        });

        // Handle dynamic content
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const newInteractiveElements = node.querySelectorAll(`
                            a, button, .focus-item, .featured-product, .cta-button,
                            .card-style, .product-card, .article-card, .contact-button,
                            input, textarea, select, [role="button"], [tabindex="0"]
                        `);
                        
                        newInteractiveElements.forEach(element => {
                            element.addEventListener('mouseenter', this.handleMouseEnter);
                            element.addEventListener('mouseleave', this.handleMouseLeave);
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
            if (this.isMobile) {
                this.destroy();
            }
        });

        // Handle page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimation();
            } else {
                this.resumeAnimation();
            }
        });
    }

    handleMouseMove(e) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
    }

    handleMouseEnter(e) {
        this.isHovering = true;
        if (this.cursor) {
            this.cursor.classList.add('hover');
        }
        
        // Add special effects for specific elements
        const element = e.target;
        if (element.classList.contains('focus-item') || 
            element.classList.contains('featured-product')) {
            this.addRippleEffect(e);
        }
    }

    handleMouseLeave() {
        this.isHovering = false;
        if (this.cursor) {
            this.cursor.classList.remove('hover');
        }
    }

    addRippleEffect(e) {
        const element = e.currentTarget;
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('div');
        
        ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(var(--color-accent-rgb-values), 0.1);
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
            z-index: 1;
        `;
        
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        
        element.style.position = 'relative';
        element.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    updateCursor() {
        if (!this.cursor) return;
        
        this.cursor.style.left = this.mouseX + 'px';
        this.cursor.style.top = this.mouseY + 'px';
    }

    updateTrail() {
        // Update trail positions with smooth following
        this.cursorTrail.forEach((trail, index) => {
            if (index === 0) {
                trail.targetX = this.mouseX;
                trail.targetY = this.mouseY;
            } else {
                trail.targetX = this.cursorTrail[index - 1].x;
                trail.targetY = this.cursorTrail[index - 1].y;
            }
            
            // Smooth interpolation
            const speed = 0.2 - (index * 0.02);
            trail.x += (trail.targetX - trail.x) * speed;
            trail.y += (trail.targetY - trail.y) * speed;
            
            trail.element.style.left = trail.x + 'px';
            trail.element.style.top = trail.y + 'px';
        });
    }

    startAnimation() {
        this.animationId = requestAnimationFrame(() => {
            this.updateCursor();
            this.updateTrail();
            this.startAnimation();
        });
    }

    pauseAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    resumeAnimation() {
        if (!this.animationId && !this.isMobile) {
            this.startAnimation();
        }
    }

    destroy() {
        // Remove cursor
        if (this.cursor && this.cursor.parentNode) {
            this.cursor.parentNode.removeChild(this.cursor);
            this.cursor = null;
        }
        
        // Remove trail
        this.cursorTrail.forEach(trail => {
            if (trail.element && trail.element.parentNode) {
                trail.element.parentNode.removeChild(trail.element);
            }
        });
        this.cursorTrail = [];
        
        // Remove event listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        
        // Cancel animation
        this.pauseAnimation();
        
        // Reset body cursor
        document.body.style.cursor = 'auto';
        
        console.log('[ModernCursorEffects] Destroyed');
    }

    // Public methods for external control
    enable() {
        if (!this.isMobile && !this.cursor) {
            this.init();
        }
    }

    disable() {
        this.destroy();
    }

    setHoverState(isHovering) {
        this.isHovering = isHovering;
        if (this.cursor) {
            if (isHovering) {
                this.cursor.classList.add('hover');
            } else {
                this.cursor.classList.remove('hover');
            }
        }
    }
}

// Add ripple animation CSS
const rippleCSS = `
@keyframes ripple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}
`;

// Inject CSS if not already present
if (!document.querySelector('#ripple-animation-css')) {
    const style = document.createElement('style');
    style.id = 'ripple-animation-css';
    style.textContent = rippleCSS;
    document.head.appendChild(style);
}

export default ModernCursorEffects;