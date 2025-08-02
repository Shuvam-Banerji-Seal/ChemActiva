/**
 * ModernThemeManager - Enhanced theme switching with smooth transitions
 * Provides modern dark mode with animations, system theme detection, and persistence
 */
class ModernThemeManager {
    constructor() {
        this.themes = {
            light: 'light',
            dark: 'dark'
        };
        this.transitionDuration = 300;
        this.isTransitioning = false;
        this.systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        // Bind methods
        this.handleSystemThemeChange = this.handleSystemThemeChange.bind(this);
        this.handleToggleChange = this.handleToggleChange.bind(this);
        
        this.init();
    }

    init() {
        this.setupThemeTransitions();
        this.initializeTheme();
        this.setupEventListeners();
        this.setupSystemThemeDetection();
    }

    setupThemeTransitions() {
        // Add CSS transition styles for smooth theme switching
        const transitionStyle = document.createElement('style');
        transitionStyle.id = 'modern-theme-transitions';
        transitionStyle.textContent = `
            :root {
                --theme-transition-duration: ${this.transitionDuration}ms;
                --theme-transition-easing: cubic-bezier(0.4, 0, 0.2, 1);
                --theme-transition-fast: 150ms;
            }
            
            /* Apply transitions only to specific elements for better performance and immediate feedback */
            body,
            .card-style,
            .content-section,
            #navbar,
            .focus-item,
            .featured-product,
            .team-card,
            .advisor-card,
            .contact-info,
            #contact-form-container,
            .cta-button,
            .submit-button {
                transition: 
                    background-color var(--theme-transition-fast) var(--theme-transition-easing),
                    border-color var(--theme-transition-fast) var(--theme-transition-easing),
                    color var(--theme-transition-fast) var(--theme-transition-easing),
                    box-shadow var(--theme-transition-duration) var(--theme-transition-easing),
                    text-shadow var(--theme-transition-fast) var(--theme-transition-easing);
            }
            
            /* Immediate theme toggle feedback */
            .theme-toggle-checkbox,
            .theme-toggle-label,
            .toggle-ball {
                transition: 
                    background-color 0.2s var(--theme-transition-easing),
                    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            
            @media (prefers-reduced-motion: reduce) {
                body,
                .card-style,
                .content-section,
                #navbar,
                .focus-item,
                .featured-product,
                .team-card,
                .advisor-card,
                .contact-info,
                #contact-form-container,
                .cta-button,
                .submit-button,
                .theme-toggle-checkbox,
                .theme-toggle-label,
                .toggle-ball {
                    transition: none !important;
                }
            }
            
            .theme-transition-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: var(--gradient-overlay);
                opacity: 0;
                pointer-events: none;
                z-index: 9999;
                transition: opacity var(--theme-transition-duration) var(--theme-transition-easing);
            }
            
            .theme-transition-overlay.active {
                opacity: 1;
            }
        `;
        
        // Remove existing transition styles if any
        const existingStyle = document.getElementById('modern-theme-transitions');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        document.head.appendChild(transitionStyle);
    }

    initializeTheme() {
        const savedTheme = this.getSavedTheme();
        const systemTheme = this.getSystemTheme();
        // Default to dark mode if no saved preference
        const initialTheme = savedTheme || this.themes.dark;
        
        this.applyTheme(initialTheme, true);
    }

    setupEventListeners() {
        const toggles = document.querySelectorAll('.theme-toggle-checkbox');
        toggles.forEach(toggle => {
            toggle.addEventListener('change', this.handleToggleChange);
        });
    }

    setupSystemThemeDetection() {
        this.systemThemeQuery.addEventListener('change', this.handleSystemThemeChange);
    }

    handleSystemThemeChange(e) {
        // Only auto-switch if user hasn't manually set a preference
        if (!localStorage.getItem('theme')) {
            const systemTheme = e.matches ? this.themes.dark : this.themes.light;
            this.switchTheme(systemTheme);
        }
    }

    handleToggleChange(e) {
        // Since dark is default, checked = light mode, unchecked = dark mode
        const targetTheme = e.target.checked ? this.themes.light : this.themes.dark;
        this.switchTheme(targetTheme);
    }

    async switchTheme(targetTheme) {
        if (this.isTransitioning) return;
        
        const currentTheme = this.getCurrentTheme();
        if (currentTheme === targetTheme) return;

        this.isTransitioning = true;

        try {
            // Apply the new theme immediately
            this.applyTheme(targetTheme);
            
            // Save preference
            this.saveThemePreference(targetTheme);
            
            // Create smooth transition effect if motion is not reduced
            if (!this.reducedMotionQuery.matches) {
                await this.createTransitionEffect();
            }
            
            // Dispatch theme change event
            this.dispatchThemeChangeEvent(targetTheme);
            
        } catch (error) {
            console.error('Error during theme transition:', error);
        } finally {
            this.isTransitioning = false;
        }
    }

    async createTransitionEffect() {
        return new Promise((resolve) => {
            // Create transition overlay
            const overlay = document.createElement('div');
            overlay.className = 'theme-transition-overlay';
            document.body.appendChild(overlay);

            // Trigger transition
            requestAnimationFrame(() => {
                overlay.classList.add('active');
                
                setTimeout(() => {
                    overlay.classList.remove('active');
                    
                    setTimeout(() => {
                        document.body.removeChild(overlay);
                        resolve();
                    }, this.transitionDuration);
                }, this.transitionDuration / 2);
            });
        });
    }

    applyTheme(theme, isInitial = false) {
        const isDark = theme === this.themes.dark;
        
        // Apply theme classes - remove both first, then add the correct one
        document.body.classList.remove('dark-mode', 'light-mode');
        if (isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.add('light-mode');
        }
        
        // Update toggle states - for dark mode default, checked = light mode
        const toggles = document.querySelectorAll('.theme-toggle-checkbox');
        toggles.forEach(toggle => {
            toggle.checked = !isDark; // Inverted because dark is default
        });
        
        // Save theme preference
        if (!isInitial) {
            localStorage.setItem('theme', theme);
        }
        
        // Set derived colors for enhanced theme
        this.setDerivedColors(isDark);
        
        // Apply enhanced theme effects
        if (isDark) {
            this.applyEnhancedDarkMode();
        } else {
            this.applyLightMode();
        }
    }

    applyEnhancedDarkMode() {
        const root = document.documentElement;
        
        // Apply enhanced dark mode styling
        root.style.setProperty('--current-theme', 'dark');
        
        // Add glow effects to interactive elements
        this.addGlowEffects();
        
        // Update 3D scene lighting if available
        this.updateSceneLighting(true);
    }

    applyLightMode() {
        const root = document.documentElement;
        
        // Apply light mode styling
        root.style.setProperty('--current-theme', 'light');
        
        // Remove glow effects
        this.removeGlowEffects();
        
        // Update 3D scene lighting if available
        this.updateSceneLighting(false);
    }

    addGlowEffects() {
        // Add glow effects to cards and interactive elements
        const cards = document.querySelectorAll('.card, .product-card, .team-card');
        cards.forEach(card => {
            if (!card.classList.contains('glow-effect')) {
                card.classList.add('glow-effect');
            }
        });

        // Add text glow to headings
        const headings = document.querySelectorAll('h1, h2, h3');
        headings.forEach(heading => {
            if (!heading.classList.contains('text-glow')) {
                heading.classList.add('text-glow');
            }
        });
    }

    removeGlowEffects() {
        // Remove glow effects
        const glowElements = document.querySelectorAll('.glow-effect, .text-glow');
        glowElements.forEach(element => {
            element.classList.remove('glow-effect', 'text-glow');
        });
    }

    updateSceneLighting(isDark) {
        // Update 3D scene lighting if SceneManager is available
        if (window.sceneManager && typeof window.sceneManager.updateThemeLighting === 'function') {
            window.sceneManager.updateThemeLighting(isDark);
        }
    }

    setDerivedColors(isDark) {
        const root = document.documentElement;
        const computedStyle = getComputedStyle(root);
        
        const getRgbFromHex = (hex) => {
            if (!hex || !hex.startsWith('#') || hex.length < 4) return '0, 0, 0';
            let r, g, b;
            if (hex.length === 4) {
                r = parseInt(hex[1] + hex[1], 16);
                g = parseInt(hex[2] + hex[2], 16);
                b = parseInt(hex[3] + hex[3], 16);
            } else {
                r = parseInt(hex.slice(1, 3), 16);
                g = parseInt(hex.slice(3, 5), 16);
                b = parseInt(hex.slice(5, 7), 16);
            }
            return `${r}, ${g}, ${b}`;
        };

        if (isDark) {
            // Set enhanced dark mode RGB values
            root.style.setProperty('--dm-bg-deep-rgb', '10, 18, 8');
            root.style.setProperty('--dm-bg-medium-rgb', '26, 38, 23');
            root.style.setProperty('--dm-bg-card-rgb', '36, 51, 41');
            root.style.setProperty('--dm-glow-color-rgb-values', '50, 223, 110');
            root.style.setProperty('--color-accent-rgb-values', '50, 223, 110');
        } else {
            // Set light mode RGB values
            root.style.setProperty('--lm-accent-primary-rgb-values', '50, 142, 110');
            root.style.setProperty('--color-accent-rgb-values', '50, 142, 110');
        }
    }

    dispatchThemeChangeEvent(theme) {
        const isDark = theme === this.themes.dark;
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { 
                theme,
                isDark,
                timestamp: Date.now()
            }
        }));
    }

    getCurrentTheme() {
        return document.body.classList.contains('dark-mode') ? this.themes.dark : this.themes.light;
    }

    getSavedTheme() {
        return localStorage.getItem('theme');
    }

    getSystemTheme() {
        return this.systemThemeQuery.matches ? this.themes.dark : this.themes.light;
    }

    saveThemePreference(theme) {
        localStorage.setItem('theme', theme);
    }

    // Public API methods
    isDarkMode() {
        return this.getCurrentTheme() === this.themes.dark;
    }

    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const targetTheme = currentTheme === this.themes.dark ? this.themes.light : this.themes.dark;
        this.switchTheme(targetTheme);
    }

    setTheme(theme) {
        if (this.themes[theme]) {
            this.switchTheme(this.themes[theme]);
        }
    }

    // Cleanup method
    destroy() {
        this.systemThemeQuery.removeEventListener('change', this.handleSystemThemeChange);
        
        const toggles = document.querySelectorAll('.theme-toggle-checkbox');
        toggles.forEach(toggle => {
            toggle.removeEventListener('change', this.handleToggleChange);
        });

        const transitionStyle = document.getElementById('modern-theme-transitions');
        if (transitionStyle) {
            transitionStyle.remove();
        }
    }
}

export default ModernThemeManager;