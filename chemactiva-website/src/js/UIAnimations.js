// src/js/UIAnimations.js
// import anime from 'animejs';// For navbar hover or other small DOM animations
// src/js/UIAnimations.js
// import { anime } from 'animejs'; // Try this first (less likely to be correct for animejs)
import { gsap } from 'gsap'; // For form validation/confirmation modal
// src/js/UIAnimations.js
// import * as animejsModule from 'animejs';
// // Then, if the main anime function is the 'default' property or just 'anime' on that object:
// const anime = animejsModule.default || animejsModule.anime || animejsModule;
// If you console.log(animejsModule) you can inspect its structure.

// src/js/UIAnimations.js
import * as AnimeJS from 'animejs';
const anime = AnimeJS.default || AnimeJS; // animejs might export its main function on .default or as the module itself

export default class UIAnimations {
    constructor() {}

    init() {
        this.initNavbar();
        this.initContactForm();
        this.initThemeToggle(); // Add this call
    }

    initNavbar() {
        const hamburger = document.getElementById('hamburger-menu');
        const navLinks = document.querySelector('#navbar .nav-links');

        if (hamburger && navLinks) {
            hamburger.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                hamburger.classList.toggle('active');
            });
        }

        // Animated hover effects for nav links using Anime.js (as requested)
        // CSS already has a basic version, Anime.js can enhance it
        document.querySelectorAll('#navbar .nav-links a').forEach(link => {
            const line = link.querySelector('::after'); // This selector is tricky with pseudo-elements
            // It's easier to add a real span inside the link for Anime.js to target,
            // or stick to the CSS animation for the underline.
            // For simplicity, we'll rely on the CSS :hover::after animation.
            // If you want Anime.js for this:
            // HTML: <a href="#">Link Text<span class="underline"></span></a>
            // CSS: .underline { position:absolute; bottom:0;left:0;height:2px;background:red;width:0; }
            // JS: anime({ targets: link.querySelector('.underline'), width: '100%', duration:300, easing:'easeOutQuad' }); on mouseenter
            //     anime({ targets: link.querySelector('.underline'), width: '0%', duration:300, easing:'easeOutQuad' }); on mouseleave
        });
    }

    initContactForm() {
        const form = document.getElementById('contact-form');
        const confirmationMessage = document.getElementById('form-confirmation');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                // Basic validation (add more as needed)
                let isValid = true;
                form.querySelectorAll('input[required], textarea[required]').forEach(input => {
                    if (!input.value.trim()) {
                        isValid = false;
                        input.style.borderColor = 'red'; // Simple visual feedback
                    } else {
                        input.style.borderColor = 'var(--color-gray-medium)';
                    }
                });

                if (isValid) {
                    // Simulate form submission
                    console.log('Form submitted:', {
                        name: form.name.value,
                        email: form.email.value,
                        subject: form.subject.value,
                        message: form.message.value,
                    });
                    
                    // Show confirmation with animation
                    confirmationMessage.style.display = 'block';
                    gsap.fromTo(confirmationMessage, 
                        { opacity: 0, y: 20 }, 
                        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', onComplete: () => {
                            form.reset(); // Clear form
                            setTimeout(() => { // Hide confirmation after a few seconds
                                gsap.to(confirmationMessage, { opacity: 0, duration: 0.5, onComplete: () => confirmationMessage.style.display = 'none' });
                            }, 3000);
                        }}
                    );

                } else {
                    // Shake animation for the form or button to indicate error
                    gsap.to(form, { x: '+=10', duration: 0.05, repeat: 5, yoyo: true, clearProps: 'x', ease: 'power1.inOut' });
                }
            });

            // Ripple animation for submit button
            const submitButton = form.querySelector('.submit-button');
            if (submitButton) {
                submitButton.addEventListener('click', function (e) {
                    const rect = e.target.getBoundingClientRect();
                    const ripple = document.createElement('span');
                    ripple.className = 'ripple';
                    ripple.style.left = `${e.clientX - rect.left}px`;
                    ripple.style.top = `${e.clientY - rect.top}px`;
                    this.appendChild(ripple);
                    setTimeout(() => ripple.remove(), 600); // Match animation duration
                });
            }
        }
    }


    // Inside UIAnimations class or as a standalone function called by App.js
initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme');

    const setGlowColorRGB = (hexColor) => {
        // Convert hex to RGB for rgba() glow
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        document.documentElement.style.setProperty('--glow-color-rgb', `${r}, ${g}, ${b}`);
    };

    if (currentTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
        setGlowColorRGB(getComputedStyle(document.documentElement).getPropertyValue('--glow-color').trim() || '#1ABC9C'); // Get from CSS or default
    } else {
        // Ensure no glow color rgb is set for light mode if it relies on the variable
        document.documentElement.style.removeProperty('--glow-color-rgb');
    }


    themeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
            setGlowColorRGB(getComputedStyle(document.documentElement).getPropertyValue('--glow-color').trim() || '#1ABC9C');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
            document.documentElement.style.removeProperty('--glow-color-rgb');
        }
    });
}

}