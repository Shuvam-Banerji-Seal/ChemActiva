// src/js/UIAnimations.js
import { gsap } from 'gsap';

export default class UIAnimations {
    constructor() {
        this.isMobileMenuOpen = false;
        this.menuTimeline = null;
        this.lastScrollY = 0;
        this.isScrolled = false;
    }

    init() {
        // Theme is now handled by ModernThemeManager in App.js
        this.initNavbar();
        this.initScrollEffects();
        this.initContactForm();
        this.initActiveNavLinks();
        this.initScrollDownIndicator();
    }

    initScrollEffects() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const shouldBeScrolled = currentScrollY > 50;

            if (shouldBeScrolled !== this.isScrolled) {
                this.isScrolled = shouldBeScrolled;
                navbar.classList.toggle('scrolled', this.isScrolled);
            }
            this.lastScrollY = currentScrollY;
        };

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });
        handleScroll();
    }

    initActiveNavLinks() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('#navbar .nav-links a');
        
        // Activate link based on current page URL
        navLinks.forEach(link => {
            if (link.pathname === currentPath && currentPath !== '/index.html' && currentPath !== '/') {
                link.classList.add('active-nav-link');
            }
        });

        // Homepage IntersectionObserver logic for section scrolling
        if (document.body.classList.contains('homepage')) {
            const sectionLinks = document.querySelectorAll('#navbar .nav-links a[href^="#"]');
            const sections = Array.from(sectionLinks)
                .map(link => {
                    const id = link.getAttribute('href');
                    try { return document.querySelector(id); } catch (e) { return null; }
                })
                .filter(Boolean);

            if (sections.length === 0) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const id = entry.target.getAttribute('id');
                        sectionLinks.forEach(link => {
                            link.classList.remove('active-nav-link');
                            if (link.getAttribute('href') === `#${id}`) {
                                link.classList.add('active-nav-link');
                            }
                        });
                    }
                });
            }, { rootMargin: "-50% 0px -50% 0px" });

            sections.forEach(section => observer.observe(section));
        }
    }

    initNavbar() {
        const hamburger = document.getElementById('hamburger-menu');
        const navLinksContainer = document.querySelector('#navbar .nav-links');
        if (!hamburger || !navLinksContainer) return;

        const mobileMenuItems = gsap.utils.toArray('#navbar .nav-links > *');

        this.menuTimeline = gsap.timeline({
            paused: true,
            onReverseComplete: () => {
                gsap.set(mobileMenuItems, { clearProps: 'all' });
            }
        }).to(mobileMenuItems, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: "power2.out"
        });
            
        hamburger.addEventListener('click', () => this.toggleMobileMenu());
        
        navLinksContainer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                if (this.isMobileMenuOpen) {
                    // For hash links, we need to prevent default and manually scroll after closing menu
                    const href = link.getAttribute('href');
                    if(href.startsWith('#')) {
                        e.preventDefault();
                        const targetElement = document.querySelector(href);
                        this.closeMobileMenu();
                        if (targetElement) {
                           setTimeout(() => { // Delay to allow menu to close
                                targetElement.scrollIntoView({ behavior: 'smooth' });
                           }, 400);
                        }
                    } else {
                       this.closeMobileMenu();
                    }
                }
            });
        });
    }

    toggleMobileMenu() {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        
        const hamburger = document.getElementById('hamburger-menu');
        const navLinksContainer = document.querySelector('#navbar .nav-links');

        hamburger.classList.toggle('active', this.isMobileMenuOpen);
        navLinksContainer.classList.toggle('active', this.isMobileMenuOpen);
        document.body.style.overflow = this.isMobileMenuOpen ? 'hidden' : '';

        if (this.isMobileMenuOpen) {
            gsap.set(gsap.utils.toArray('#navbar .nav-links > *'), { opacity: 0, y: 30 });
            this.menuTimeline.play();
        } else {
            this.menuTimeline.reverse();
        }
    }

    closeMobileMenu() {
        if (!this.isMobileMenuOpen) return;
        this.toggleMobileMenu();
    }



    initContactForm() {
        const form = document.getElementById('contact-form');
        if (!form) return;
        const confirmationMessage = document.getElementById('form-confirmation');
        const submitButton = form.querySelector('.submit-button');

        const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/YOUR_FORM_ID_HERE/formResponse';
        const FORM_FIELDS = {
            name: 'entry.YOUR_NAME_FIELD_ID',
            email: 'entry.YOUR_EMAIL_FIELD_ID',
            subject: 'entry.YOUR_SUBJECT_FIELD_ID',
            message: 'entry.YOUR_MESSAGE_FIELD_ID'
        };
        const isConfigured = !GOOGLE_FORM_URL.includes('YOUR_FORM_ID_HERE');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (submitButton.classList.contains('is-submitting')) return;

            submitButton.classList.add('is-submitting');
            submitButton.disabled = true;
            const originalButtonHTML = submitButton.innerHTML;
            submitButton.innerHTML = 'Sending... <span class="loader-dots"><span>.</span><span>.</span><span>.</span></span>';

            const formData = new FormData();
            formData.append(FORM_FIELDS.name, form.name.value);
            formData.append(FORM_FIELDS.email, form.email.value);
            formData.append(FORM_FIELDS.subject, form.subject.value);
            formData.append(FORM_FIELDS.message, form.message.value);

            try {
                if (isConfigured) {
                    await fetch(GOOGLE_FORM_URL, { method: 'POST', body: formData, mode: 'no-cors' });
                } else {
                    console.warn("Contact form not configured. Simulating success.");
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
                showConfirmation(true, "Message Sent! Thank you.");
                form.reset();
            } catch (error) {
                console.error('Form submission error:', error);
                showConfirmation(false, "Submission Error. Please try again.");
            } finally {
                submitButton.classList.remove('is-submitting');
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonHTML;
            }
        });

        function showConfirmation(success, text) {
            confirmationMessage.textContent = text;
            confirmationMessage.style.backgroundColor = success ? 'var(--color-accent-secondary)' : '#e74c3c';
            confirmationMessage.style.color = success ? (document.body.classList.contains('dark-mode') ? 'var(--dm-bg-deep)' : 'var(--lm-bg-deep)') : 'white';
            
            gsap.fromTo(confirmationMessage, 
                { y: 20, opacity: 0, display: 'block' }, 
                { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', onComplete: () => {
                    setTimeout(() => {
                        gsap.to(confirmationMessage, { opacity: 0, duration: 0.5, onComplete: () => confirmationMessage.style.display = 'none' });
                    }, 4000);
                }});
        }
    }

    initScrollDownIndicator() {
        const scrollDownIndicator = document.querySelector('.scroll-down-indicator');
        if (!scrollDownIndicator) return;

        scrollDownIndicator.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = scrollDownIndicator.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Smooth scroll to target element
                targetElement.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });

        // Add floating animation to the scroll down indicator
        if (scrollDownIndicator) {
            gsap.to(scrollDownIndicator, {
                y: -10,
                duration: 2,
                ease: "power2.inOut",
                yoyo: true,
                repeat: -1
            });
        }
    }
}