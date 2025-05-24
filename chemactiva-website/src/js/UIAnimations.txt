// src/js/UIAnimations.js
import * as AnimeJS from 'animejs';
const anime = AnimeJS.default || AnimeJS; // Handles both ESM and CJS animejs versions
import { gsap } from 'gsap';

export default class UIAnimations {
    constructor() {
        // console.log('[UIAnimations] Constructor');
        this.isMobileMenuOpen = false; 
        this.menuTimeline = null; 
    }

    init() {
        // console.log('[UIAnimations] init called');
        this.initNavbar();
        this.initContactForm(); 
        this.initThemeToggle(); // Listener part of theme toggle
    }

// src/js/UIAnimations.js


    initNavbar() {
        const logo = document.getElementById('navbar-logo-link');
        const navbar = document.getElementById('navbar');
        const hamburger = document.getElementById('hamburger-menu'); 
        const navLinksContainer = document.querySelector('#navbar .nav-links'); // This is the <nav> element
        
        if (!navbar || !navLinksContainer) {
            console.warn("[UIAnimations] Navbar or navLinksContainer not found. Skipping navbar init.");
            return;
        }
        if (!hamburger) {
            console.error("[UIAnimations] CRITICAL: Hamburger menu button with id 'hamburger-menu' NOT FOUND. Clicks will not work.");
            return; 
        } else {
            // console.log("[UIAnimations] Hamburger menu button FOUND.", hamburger); 
        }

        // Select all direct children of .nav-links.mobile-menu to animate them
        // This includes <a> tags and the .theme-switcher-mobile div
        const mobileMenuItemsToAnimate = gsap.utils.toArray('#navbar .nav-links > *:not(#theme-switcher-desktop)');
        const navLinkAnchorsOnly = gsap.utils.toArray('#navbar .nav-links > a');
        

        const handleResize = () => {
            const isMobileView = window.innerWidth <= 768;
            navbar.classList.toggle('is-fab-mode', isMobileView);
            
            // The .mobile-menu class is primarily for CSS to know when the navLinksContainer
            // should behave as a full-screen menu (styling-wise, not just display block/none)
            navLinksContainer.classList.toggle('mobile-menu', isMobileView); 
            
            if (!isMobileView) { // Resized to desktop
                if (this.isMobileMenuOpen) { // If mobile menu was open
                    navLinksContainer.classList.remove('active'); 
                    if (hamburger) hamburger.classList.remove('active');
                    if (this.menuTimeline) this.menuTimeline.progress(0).pause(); 
                    this.isMobileMenuOpen = false;
                }
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check

        // Setup GSAP timeline for menu items if they exist
        if (mobileMenuItemsToAnimate.length > 0) {
            this.menuTimeline = gsap.timeline({ paused: true }); 
            this.menuTimeline.to(mobileMenuItemsToAnimate, {
                opacity: 1,
                y: 0,
                duration: 0.3,
                stagger: 0.06,
                ease: "power1.out"
            }, 0.1); // Start slightly after menu container CSS transition (if any)
        } else {
            // console.warn("[UIAnimations] No items found for mobile menu animation.");
        }
        
        // Hamburger click listener
        hamburger.addEventListener('click', () => {
            // console.log("[UIAnimations] Hamburger clicked! Is FAB mode?", navbar.classList.contains('is-fab-mode')); 
            
            // The menu should only toggle if navbar is in 'is-fab-mode' (mobile view)
            if (navbar.classList.contains('is-fab-mode')) { 
                this.isMobileMenuOpen = !this.isMobileMenuOpen;

                navLinksContainer.classList.toggle('active', this.isMobileMenuOpen);
                hamburger.classList.toggle('active', this.isMobileMenuOpen);

                if (this.menuTimeline) { 
                    if (this.isMobileMenuOpen) {
                        this.menuTimeline.timeScale(1).play();
                    } else {
                        this.menuTimeline.timeScale(1.5).reverse(); 
                    }
                } else {
                    // console.warn("[UIAnimations] menuTimeline not initialized, animations for menu items won't run.");
                }
            }
        });


        // Close mobile menu when a nav link (anchor tag) is clicked
        if (navLinkAnchorsOnly.length > 0) {
            navLinkAnchorsOnly.forEach(link => { 
                link.addEventListener('click', () => {
                    if (navbar.classList.contains('is-fab-mode') && this.isMobileMenuOpen) {
                        this.isMobileMenuOpen = false;
                        navLinksContainer.classList.remove('active');
                        if (hamburger) hamburger.classList.remove('active');
                        if (this.menuTimeline) this.menuTimeline.timeScale(1.5).reverse();
                    }
                });
            });
        }
    }

    initThemeToggle() {
        const desktopToggle = document.getElementById('theme-toggle'); // Checkbox for desktop
        const mobileToggle = document.getElementById('theme-toggle-mobile'); // Checkbox for mobile

        if (!desktopToggle && !mobileToggle) {
            // console.warn('No theme toggle checkboxes found.');
            return;
        }
        
        const currentTheme = localStorage.getItem('theme');

        const setDerivedColors = () => { 
            const isDark = document.body.classList.contains('dark-mode');
            const rootStyle = document.documentElement.style;
            const computedRootStyle = getComputedStyle(document.documentElement);
            
            const colorsToProcess = [
                { name: 'bg-deep', themePrefixSpecific: true }, 
                { name: 'bg-medium', themePrefixSpecific: true },
                { name: 'glow-color', globalVar: '--color-glow-rgb-values', currentThemePrefix: isDark ? '--dm-' : '--lm-' },
                { name: 'accent-primary', globalVar: '--color-accent-rgb-values', currentThemePrefix: isDark ? '--dm-' : '--lm-' }
            ];
            
            colorsToProcess.forEach(colorInfo => {
                let hexColorSourcePath;
                if (colorInfo.themePrefixSpecific) {
                    const themePrefix = isDark ? '--dm-' : '--lm-';
                    hexColorSourcePath = `${themePrefix}${colorInfo.name}`;
                } else if (colorInfo.currentThemePrefix) {
                    if (isDark && colorInfo.name === 'accent-primary' && colorInfo.globalVar === '--color-accent-rgb-values') {
                        hexColorSourcePath = `${colorInfo.currentThemePrefix}glow-color`; 
                    } else {
                        hexColorSourcePath = `${colorInfo.currentThemePrefix}${colorInfo.name}`;
                    }
                } else { return; }

                const hexColor = computedRootStyle.getPropertyValue(hexColorSourcePath).trim();

                if (hexColor && hexColor !== 'transparent' && hexColor.startsWith('#')) {
                    const r = parseInt(hexColor.slice(1, 3), 16);
                    const g = parseInt(hexColor.slice(3, 5), 16);
                    const b = parseInt(hexColor.slice(5, 7), 16);

                    if (colorInfo.themePrefixSpecific) {
                        rootStyle.setProperty(`${hexColorSourcePath}-rgb`, `${r}, ${g}, ${b}`);
                    }
                    if (colorInfo.globalVar) {
                        rootStyle.setProperty(colorInfo.globalVar, `${r}, ${g}, ${b}`);
                    }
                } else {
                    if (colorInfo.themePrefixSpecific) rootStyle.removeProperty(`${hexColorSourcePath}-rgb`);
                    if (colorInfo.globalVar) rootStyle.removeProperty(colorInfo.globalVar); 
                }
            });

            if (!isDark) rootStyle.removeProperty('--color-glow-rgb-values');
        };

        const applyThemeAndSyncToggles = (isDarkRequested) => {
            if (isDarkRequested) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }

            if (desktopToggle) desktopToggle.checked = isDarkRequested;
            if (mobileToggle) mobileToggle.checked = isDarkRequested;
            
            setDerivedColors(); 
        };
        
        if (currentTheme === 'dark') {
            applyThemeAndSyncToggles(true);
        } else {
            applyThemeAndSyncToggles(false); 
        }

        if (desktopToggle) {
            desktopToggle.addEventListener('change', function() {
                applyThemeAndSyncToggles(this.checked);
            });
        }
        if (mobileToggle) {
            mobileToggle.addEventListener('change', function() {
                applyThemeAndSyncToggles(this.checked);
            });
        }
    }

    initContactForm() {
        const form = document.getElementById('contact-form');
        const confirmationMessage = document.getElementById('form-confirmation');
        if (!form || !confirmationMessage) {
            // console.warn("Contact form or confirmation message element not found.");
            return;
        }
        const submitButton = form.querySelector('.submit-button.modern-submit');
        if (!submitButton) {
            // console.warn("Contact form submit button not found.");
            return;
        }

        // --- CONFIGURATION FOR GOOGLE FORM ---
        // IMPORTANT: Replace these with your actual Google Form details
        const GOOGLE_FORM_ACTION_URL = 'https://docs.google.com/forms/d/e/YOUR_FORM_ID_HERE/formResponse'; 
        const NAME_ENTRY_ID = 'entry.YOUR_NAME_FIELD_ID';        
        const EMAIL_ENTRY_ID = 'entry.YOUR_EMAIL_FIELD_ID';       
        const SUBJECT_ENTRY_ID = 'entry.YOUR_SUBJECT_FIELD_ID';     
        const MESSAGE_ENTRY_ID = 'entry.YOUR_MESSAGE_FIELD_ID';     
        // --- END CONFIGURATION ---

        // Basic check if placeholders are still there
        if (GOOGLE_FORM_ACTION_URL.includes('YOUR_FORM_ID_HERE')) {
            console.warn("Contact form GOOGLE_FORM_ACTION_URL is not configured in UIAnimations.js. Form submission will not work correctly.");
            // Optionally disable the form or show a message
            // submitButton.disabled = true;
            // submitButton.textContent = "Form Not Configured";
            // return; 
        }

        form.addEventListener('submit', async (e) => { 
            e.preventDefault();
            if (submitButton.classList.contains('is-submitting')) return;

            let isValid = true;
            form.querySelectorAll('input[required], textarea[required]').forEach(input => {
                 if (!input.value.trim()) {
                    isValid = false;
                    // Indicate error, e.g., by changing border color, or use a more sophisticated validation library
                    input.style.borderColor = 'red'; 
                    gsap.fromTo(input, {x:0}, {x:5, duration:0.05, repeat: 3, yoyo:true, ease:'power1.inOut', clearProps:'x'});
                } else {
                    input.style.borderColor = ''; // Reset border color
                }
            });

            if (isValid) {
                submitButton.classList.add('is-submitting');
                submitButton.disabled = true;
                const originalButtonHTML = submitButton.innerHTML; 
                submitButton.innerHTML = 'Sending... <span class="loader-dots"><span>.</span><span>.</span><span>.</span></span>';

                const formData = new FormData();
                formData.append(NAME_ENTRY_ID, form.name.value);
                formData.append(EMAIL_ENTRY_ID, form.email.value);
                formData.append(SUBJECT_ENTRY_ID, form.subject.value);
                formData.append(MESSAGE_ENTRY_ID, form.message.value);

                try {
                    if (GOOGLE_FORM_ACTION_URL.includes('YOUR_FORM_ID_HERE')) { // Prevent actual submission if not configured
                        throw new Error("Form not configured for submission.");
                    }
                    await fetch(GOOGLE_FORM_ACTION_URL, {
                        method: 'POST',
                        mode: 'no-cors', // Important for Google Forms to avoid CORS errors client-side
                        body: formData,
                    });
                    
                    // console.log('Form data sent to Google Forms.');
                    confirmationMessage.textContent = "Message Sent! Thank you.";
                    // Apply themed success colors
                    confirmationMessage.style.backgroundColor = "var(--color-accent-secondary)"; 
                    confirmationMessage.style.color = document.body.classList.contains('dark-mode') ? "var(--dm-bg-deep)" : "var(--lm-bg-deep)";
                    confirmationMessage.style.display = 'block';
                    
                    gsap.fromTo(confirmationMessage, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', onComplete: () => {
                        form.reset();
                         // Reset floating labels by removing focus/content simulation if any
                        form.querySelectorAll('input, textarea').forEach(el => el.blur());

                        setTimeout(() => {
                            gsap.to(confirmationMessage, { opacity: 0, duration: 0.5, onComplete: () => confirmationMessage.style.display = 'none' });
                        }, 4000);
                    }});
                } catch (error) {
                    console.error('Error submitting to Google Forms (or form not configured):', error);
                    confirmationMessage.textContent = error.message.includes("Form not configured") ? "Form submission is currently disabled." : "Submission Error. Please try again.";
                    confirmationMessage.style.backgroundColor = "red"; 
                    confirmationMessage.style.color = "white";
                    confirmationMessage.style.display = 'block';
                    gsap.fromTo(confirmationMessage, { opacity: 0, y:20}, {opacity:1, y:0, duration:0.5});
                     setTimeout(() => { // Also hide error message after a while
                            gsap.to(confirmationMessage, { opacity: 0, duration: 0.5, onComplete: () => confirmationMessage.style.display = 'none' });
                        }, 5000);
                } finally {
                    submitButton.classList.remove('is-submitting');
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonHTML;
                }
            } else {
                // Form shake animation handled by individual input field shakes
                // gsap.to(form, { x: '+=8', duration: 0.05, repeat: 5, yoyo: true, clearProps: 'x', ease: 'power1.inOut' });
            }
        });
    }
}