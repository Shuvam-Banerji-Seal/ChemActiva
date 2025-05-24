// Enhanced UIAnimations.js with scroll detection and modern navbar behavior
import * as AnimeJS from 'animejs';
const anime = AnimeJS.default || AnimeJS;
import { gsap } from 'gsap';

export default class UIAnimations {
    constructor() {
        this.isMobileMenuOpen = false;
        this.menuTimeline = null;
        this.lastScrollY = 0;
        this.scrollThreshold = 50; // Pixels to scroll before navbar changes
        this.isScrolled = false;
    }

    init() {
        this.initThemeToggle();
        this.initNavbar();
        this.initScrollEffects();
        this.initContactForm();
        this.initActiveNavLinks();
    }

    initScrollEffects() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const shouldBeScrolled = currentScrollY > this.scrollThreshold;

            // Add/remove scrolled class based on scroll position
            if (shouldBeScrolled !== this.isScrolled) {
                this.isScrolled = shouldBeScrolled;
                navbar.classList.toggle('scrolled', this.isScrolled);
                
                // Animate logo and navbar height changes
                if (this.isScrolled) {
                    gsap.to(navbar.querySelector('.logo img'), {
                        scale: 0.9,
                        duration: 0.4,
                        ease: "power2.out"
                    });
                } else {
                    gsap.to(navbar.querySelector('.logo img'), {
                        scale: 1,
                        duration: 0.4,
                        ease: "power2.out"
                    });
                }
            }

            this.lastScrollY = currentScrollY;
        };

        // Throttle scroll events for better performance
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Initial check
        handleScroll();
    }

    initActiveNavLinks() {
        const navLinks = document.querySelectorAll('#navbar .nav-links a[href^="#"]');
        const sections = Array.from(navLinks).map(link => {
            const href = link.getAttribute('href');
            return document.querySelector(href);
        }).filter(Boolean);

        if (sections.length === 0) return;

        const setActiveLink = () => {
            let currentSection = null;
            const scrollPos = window.scrollY + 100; // Offset for navbar height

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                
                if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                    currentSection = section;
                }
            });

            // Remove active class from all links
            navLinks.forEach(link => link.classList.remove('active-nav-link'));

            // Add active class to current section's link
            if (currentSection) {
                const activeLink = document.querySelector(`#navbar .nav-links a[href="#${currentSection.id}"]`);
                if (activeLink) {
                    activeLink.classList.add('active-nav-link');
                }
            }
        };

        // Throttled scroll listener for active links
        let activeNavTicking = false;
        window.addEventListener('scroll', () => {
            if (!activeNavTicking) {
                requestAnimationFrame(() => {
                    setActiveLink();
                    activeNavTicking = false;
                });
                activeNavTicking = true;
            }
        });

        // Initial check
        setActiveLink();
    }

    initNavbar() {
        const navbar = document.getElementById('navbar');
        const hamburger = document.getElementById('hamburger-menu');
        const navLinksContainer = document.querySelector('#navbar .nav-links');
        
        if (!navbar || !navLinksContainer || !hamburger) {
            console.warn("[UIAnimations] Navbar elements not found. Skipping navbar init.");
            return;
        }

        const mobileMenuItemsToAnimate = gsap.utils.toArray('#navbar .nav-links > *');
        const navLinkAnchorsOnly = gsap.utils.toArray('#navbar .nav-links > a');
        
        const handleResize = () => {
            const isMobileView = window.innerWidth <= 768;
            navbar.classList.toggle('is-fab-mode', isMobileView);
            navLinksContainer.classList.toggle('mobile-menu', isMobileView);
            
            if (!isMobileView && this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        // Enhanced mobile menu timeline
        if (mobileMenuItemsToAnimate.length > 0) {
            this.menuTimeline = gsap.timeline({ paused: true });
            this.menuTimeline
                .set(mobileMenuItemsToAnimate, { opacity: 0, y: 30 })
                .to(mobileMenuItemsToAnimate, {
                    opacity: 1,
                    y: 0,
                    duration: 0.4,
                    stagger: 0.08,
                    ease: "back.out(1.2)"
                }, 0.2);
        }
        
        hamburger.addEventListener('click', () => {
            if (navbar.classList.contains('is-fab-mode')) {
                this.toggleMobileMenu();
            }
        });

        // Close mobile menu when clicking nav links
        navLinkAnchorsOnly.forEach(link => {
            link.addEventListener('click', (e) => {
                if (navbar.classList.contains('is-fab-mode') && this.isMobileMenuOpen) {
                    // Small delay to allow smooth transition before closing
                    setTimeout(() => {
                        this.closeMobileMenu();
                    }, 150);
                }
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMobileMenuOpen && 
                !navLinksContainer.contains(e.target) && 
                !hamburger.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Enhanced logo hover effect
        const logo = navbar.querySelector('.logo img');
        if (logo) {
            logo.addEventListener('mouseenter', () => {
                gsap.to(logo, {
                    scale: 1.05,
                    rotation: 5,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });

            logo.addEventListener('mouseleave', () => {
                gsap.to(logo, {
                    scale: 1,
                    rotation: 0,
                    duration: 0.3,
                    ease: "power2.out"
                });
            });
        }
    }

    toggleMobileMenu() {
        const navbar = document.getElementById('navbar');
        const hamburger = document.getElementById('hamburger-menu');
        const navLinksContainer = document.querySelector('#navbar .nav-links');

        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        
        navLinksContainer.classList.toggle('active', this.isMobileMenuOpen);
        hamburger.classList.toggle('active', this.isMobileMenuOpen);

        if (this.menuTimeline) {
            if (this.isMobileMenuOpen) {
                this.menuTimeline.timeScale(1).play();
                // Prevent body scroll when menu is open
                document.body.style.overflow = 'hidden';
            } else {
                this.menuTimeline.timeScale(1.5).reverse();
                // Restore body scroll
                document.body.style.overflow = '';
            }
        }

        // Add/remove body class for additional styling
        document.body.classList.toggle('mobile-menu-open', this.isMobileMenuOpen);
    }

    closeMobileMenu() {
        if (!this.isMobileMenuOpen) return;

        const hamburger = document.getElementById('hamburger-menu');
        const navLinksContainer = document.querySelector('#navbar .nav-links');

        this.isMobileMenuOpen = false;
        navLinksContainer.classList.remove('active');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';
        document.body.classList.remove('mobile-menu-open');

        if (this.menuTimeline) {
            this.menuTimeline.timeScale(1.5).reverse();
        }
    }


    initThemeToggle() {
        const desktopToggleInput = document.getElementById('theme-toggle'); // Your original desktop toggle ID
        const mobileToggleInput = document.getElementById('theme-toggle-mobile'); // The ID for the mobile toggle
        
        const toggles = [desktopToggleInput, mobileToggleInput].filter(Boolean); // Array of existing toggle inputs

        if (toggles.length === 0) {
            // console.warn('No theme toggle input elements found.');
            return;
        }
        // console.log(`[UIAnimations] Initializing ${toggles.length} theme toggle(s).`);
        
        const currentTheme = localStorage.getItem('theme');

        const setDerivedColors = () => { 
            const isDark = document.body.classList.contains('dark-mode');
            const rootStyle = document.documentElement.style;
            const computedRootStyle = getComputedStyle(document.documentElement);
            
            const colorMappings = [
                { prefix: isDark ? '--dm-' : '--lm-', name: 'bg-deep',        cssVarPart: '-rgb' },
                { prefix: isDark ? '--dm-' : '--lm-', name: 'bg-medium',       cssVarPart: '-rgb' },
                { prefix: isDark ? '--dm-' : '--lm-', name: 'accent-primary',  cssVarPart: '-rgb-values' }, // Used for accent-rgb-values
                { prefix: isDark ? '--dm-' : '--lm-', name: 'glow-color',      cssVarPart: '-rgb-values' }  // Used for glow-rgb-values
            ];
            
            colorMappings.forEach(mapping => {
                const sourceVarName = `${mapping.prefix}${mapping.name}`;
                const targetVarName = `${sourceVarName}${mapping.cssVarPart}`; // e.g., --lm-bg-deep-rgb
                
                const hexColor = computedRootStyle.getPropertyValue(sourceVarName).trim();

                if (hexColor && hexColor.startsWith('#') && hexColor.length >= 7) { // Basic hex check
                    try {
                        const r = parseInt(hexColor.slice(1, 3), 16);
                        const g = parseInt(hexColor.slice(3, 5), 16);
                        const b = parseInt(hexColor.slice(5, 7), 16);
                        if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
                             rootStyle.setProperty(targetVarName, `${r}, ${g}, ${b}`);
                            // Set global semantic RGB vars based on current theme
                            if (mapping.name === 'glow-color' && isDark) {
                                rootStyle.setProperty('--color-glow-rgb-values', `${r}, ${g}, ${b}`);
                            } else if (mapping.name === 'glow-color' && !isDark) { // Light mode glow is transparent
                                rootStyle.setProperty('--color-glow-rgb-values', `var(--lm-glow-color-rgb-values)`); // default 0,0,0
                            }
                            if (mapping.name === 'accent-primary' && !isDark) {
                                rootStyle.setProperty('--color-accent-rgb-values', `${r}, ${g}, ${b}`);
                            } else if (mapping.name === 'accent-primary' && isDark){ // Use glow for dark mode accent rgb
                                const dmGlowHex = computedRootStyle.getPropertyValue('--dm-glow-color').trim();
                                if(dmGlowHex && dmGlowHex.startsWith('#') && dmGlowHex.length >= 7) {
                                    const rGlow = parseInt(dmGlowHex.slice(1, 3), 16);
                                    const gGlow = parseInt(dmGlowHex.slice(3, 5), 16);
                                    const bGlow = parseInt(dmGlowHex.slice(5, 7), 16);
                                    rootStyle.setProperty('--color-accent-rgb-values', `${rGlow}, ${gGlow}, ${bGlow}`);
                                }
                            }
                        } else {
                             rootStyle.removeProperty(targetVarName);
                        }
                    } catch (e) {
                        console.warn(`Error parsing hex color ${hexColor} for ${sourceVarName}:`, e);
                        rootStyle.removeProperty(targetVarName);
                    }
                } else {
                    rootStyle.removeProperty(targetVarName);
                    // Ensure global semantic vars are cleared or set to default if source is transparent/invalid
                    if (mapping.name === 'glow-color' && isDark) rootStyle.removeProperty('--color-glow-rgb-values');
                    if (mapping.name === 'accent-primary' && !isDark) rootStyle.removeProperty('--color-accent-rgb-values');

                }
            });
            // Fallback if accent-primary for dark mode wasn't set via glow-color
            if (isDark && !computedRootStyle.getPropertyValue('--color-accent-rgb-values').trim()) {
                 const dmGlowHex = computedRootStyle.getPropertyValue('--dm-glow-color').trim();
                 if(dmGlowHex && dmGlowHex.startsWith('#') && dmGlowHex.length >= 7) {
                    const rGlow = parseInt(dmGlowHex.slice(1, 3), 16);
                    const gGlow = parseInt(dmGlowHex.slice(3, 5), 16);
                    const bGlow = parseInt(dmGlowHex.slice(5, 7), 16);
                    rootStyle.setProperty('--color-accent-rgb-values', `${rGlow}, ${gGlow}, ${bGlow}`);
                 }
            }
        };

        const applyThemeAndSyncToggles = (isDarkRequested) => {
            if (isDarkRequested) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
            toggles.forEach(toggle => { if(toggle) toggle.checked = isDarkRequested; });
            setDerivedColors(); 
        };
        
        applyThemeAndSyncToggles(currentTheme === 'dark');

        toggles.forEach(toggle => {
            toggle.addEventListener('change', function() {
                applyThemeAndSyncToggles(this.checked);
            });
        });
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

        // IMPORTANT: Replace these placeholders with your actual Google Form details
        const GOOGLE_FORM_ACTION_URL = 'https://docs.google.com/forms/d/e/YOUR_FORM_ID_HERE/formResponse'; 
        const NAME_ENTRY_ID = 'entry.YOUR_NAME_FIELD_ID';        
        const EMAIL_ENTRY_ID = 'entry.YOUR_EMAIL_FIELD_ID';       
        const SUBJECT_ENTRY_ID = 'entry.YOUR_SUBJECT_FIELD_ID';     
        const MESSAGE_ENTRY_ID = 'entry.YOUR_MESSAGE_FIELD_ID';     
        
        const isFormConfigured = !GOOGLE_FORM_ACTION_URL.includes('YOUR_FORM_ID_HERE');
        if (!isFormConfigured) {
            console.warn("Contact form GOOGLE_FORM_ACTION_URL is not configured in UIAnimations.js. Form submission will simulate success without sending data.");
        }

        form.addEventListener('submit', async (e) => { 
            e.preventDefault();
            if (submitButton.classList.contains('is-submitting')) return;

            let isValid = true;
            form.querySelectorAll('input[required], textarea[required]').forEach(input => {
                 if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = 'red'; 
                    // Simple shake, can be improved
                    gsap.fromTo(input, {x:0}, {x:5, duration:0.05, repeat: 3, yoyo:true, ease:'power1.inOut', clearProps:'x'});
                } else {
                    input.style.borderColor = ''; // Reset if previously error
                }
            });

            if (isValid) {
                submitButton.classList.add('is-submitting');
                submitButton.disabled = true;
                const originalButtonHTML = submitButton.innerHTML; 
                submitButton.innerHTML = 'Sending... <span class="loader-dots"><span>.</span><span>.</span><span>.</span></span>';

                if (isFormConfigured) {
                    const formData = new FormData();
                    formData.append(NAME_ENTRY_ID, form.name.value);
                    formData.append(EMAIL_ENTRY_ID, form.email.value);
                    formData.append(SUBJECT_ENTRY_ID, form.subject.value);
                    formData.append(MESSAGE_ENTRY_ID, form.message.value);

                    try {
                        await fetch(GOOGLE_FORM_ACTION_URL, {
                            method: 'POST',
                            mode: 'no-cors', 
                            body: formData,
                        });
                        // console.log('Form data sent to Google Forms (assumed success due to no-cors).');
                        showConfirmation(true);
                    } catch (error) {
                        console.error('Error submitting to Google Forms:', error);
                        showConfirmation(false, "Submission Error. Please try again.");
                    } finally {
                        finalizeSubmission(originalButtonHTML);
                    }
                } else { // Simulate submission if not configured
                    console.log("Simulating form submission as it's not configured.");
                    setTimeout(() => {
                        showConfirmation(true, "Message Sent! (Simulation)");
                        finalizeSubmission(originalButtonHTML);
                    }, 1500);
                }
            } else {
                // Optional: Shake the whole form if multiple errors
                // gsap.to(form, { x: '+=8', duration: 0.05, repeat: 5, yoyo: true, clearProps: 'x', ease: 'power1.inOut' });
            }
        });

        function showConfirmation(success, messageText) {
            confirmationMessage.textContent = messageText || (success ? "Message Sent! Thank you." : "An error occurred.");
            confirmationMessage.style.backgroundColor = success ? "var(--color-accent-secondary)" : "red";
            confirmationMessage.style.color = success 
                ? (document.body.classList.contains('dark-mode') ? "var(--dm-bg-deep)" : "var(--lm-bg-deep)") 
                : "white";
            confirmationMessage.style.display = 'block';
            
            gsap.fromTo(confirmationMessage, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', onComplete: () => {
                if (success) form.reset();
                // Auto-hide confirmation
                setTimeout(() => {
                    gsap.to(confirmationMessage, { opacity: 0, duration: 0.5, onComplete: () => confirmationMessage.style.display = 'none' });
                }, success ? 4000 : 5000);
            }});
        }
        function finalizeSubmission(originalButtonHTML) {
            submitButton.classList.remove('is-submitting');
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonHTML;
        }

        // Ripple on submit - ensure CSS for .ripple is present
        submitButton.addEventListener('mousedown', function (e) { // Use mousedown for earlier ripple
            if(this.classList.contains('is-submitting')) return;
            const rect = e.target.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = `${e.clientX - rect.left}px`;
            ripple.style.top = `${e.clientY - rect.top}px`;
            this.appendChild(ripple);
            gsap.to(ripple, {scale: 4, opacity: 0, duration: 0.6, ease: "linear", onComplete: () => ripple.remove()});
        });
    }
}