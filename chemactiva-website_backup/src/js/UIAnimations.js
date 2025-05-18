// src/js/UIAnimations.js
import * as AnimeJS from 'animejs'; // Namespace import
const anime = AnimeJS.default || AnimeJS; // Access the main anime function

import { gsap } from 'gsap';

export default class UIAnimations {
    constructor() {
        console.log('[UIAnimations] Constructor');
    }

    init() {
        console.log('[UIAnimations] init called');
        this.initNavbar();
        this.initContactForm();
        this.initThemeToggle(); // Make sure this is called
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
        // Anime.js for nav links can be added here if CSS isn't enough
    }

    initThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) {
            console.warn('Theme toggle button not found.');
            return;
        }
        const currentTheme = localStorage.getItem('theme');

        const setGlowColorRGB = () => {
            if (document.body.classList.contains('dark-mode')) {
                const glowHexColor = getComputedStyle(document.documentElement).getPropertyValue('--color-glow').trim();
                if (glowHexColor && glowHexColor !== 'transparent') {
                    const r = parseInt(glowHexColor.slice(1, 3), 16);
                    const g = parseInt(glowHexColor.slice(3, 5), 16);
                    const b = parseInt(glowHexColor.slice(5, 7), 16);
                    document.documentElement.style.setProperty('--color-glow-rgb-values', `${r}, ${g}, ${b}`);

                    // For dm-bg-medium used in glassmorphic cards
                    const dmBgMediumHex = getComputedStyle(document.documentElement).getPropertyValue('--dm-bg-medium').trim();
                     const r_bg = parseInt(dmBgMediumHex.slice(1, 3), 16);
                     const g_bg = parseInt(dmBgMediumHex.slice(3, 5), 16);
                     const b_bg = parseInt(dmBgMediumHex.slice(5, 7), 16);
                    document.documentElement.style.setProperty('--dm-bg-medium-rgb', `${r_bg}, ${g_bg}, ${b_bg}`);

                    // For dm-bg-deep used in navbar glassmorphic
                    const dmBgDeepHex = getComputedStyle(document.documentElement).getPropertyValue('--dm-bg-deep').trim();
                     const r_deep_bg = parseInt(dmBgDeepHex.slice(1, 3), 16);
                     const g_deep_bg = parseInt(dmBgDeepHex.slice(3, 5), 16);
                     const b_deep_bg = parseInt(dmBgDeepHex.slice(5, 7), 16);
                    document.documentElement.style.setProperty('--dm-bg-deep-rgb', `${r_deep_bg}, ${g_deep_bg}, ${b_deep_bg}`);

                }
            } else {
                document.documentElement.style.removeProperty('--color-glow-rgb-values');
                document.documentElement.style.removeProperty('--dm-bg-medium-rgb');
                document.documentElement.style.removeProperty('--dm-bg-deep-rgb');
            }
        };

        if (currentTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
        }
        setGlowColorRGB(); // Set on initial load

        themeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
            setGlowColorRGB(); // Update on toggle
        });
    }



    // src/js/UIAnimations.js - initContactForm method

    initContactForm() {
        const form = document.getElementById('contact-form');
        const confirmationMessage = document.getElementById('form-confirmation');
        const submitButton = form.querySelector('.submit-button.modern-submit');

        // --- CONFIGURATION FOR GOOGLE FORM ---
        const GOOGLE_FORM_ACTION_URL = 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse'; // Replace YOUR_FORM_ID
        const NAME_ENTRY_ID = 'entry.123456789';         // Replace with your actual entry ID for Name
        const EMAIL_ENTRY_ID = 'entry.987654321';        // Replace with your actual entry ID for Email
        const SUBJECT_ENTRY_ID = 'entry.112233445';      // Replace with your actual entry ID for Subject
        const MESSAGE_ENTRY_ID = 'entry.556677889';      // Replace with your actual entry ID for Message
        // --- END CONFIGURATION ---

        if (form) {
            form.addEventListener('submit', async (e) => { // Make it async
                e.preventDefault();
                if (submitButton.classList.contains('is-submitting')) return; // Prevent multiple submits

                let isValid = true;
                form.querySelectorAll('input[required], textarea[required]').forEach(input => {
                    // ... (existing validation logic) ...
                    if (!input.value.trim()) {
                        isValid = false;
                        input.style.borderColor = 'red'; 
                    } else {
                        input.style.borderColor = 'var(--color-card-border)';
                    }
                });

                if (isValid) {
                    submitButton.classList.add('is-submitting');
                    submitButton.disabled = true;
                    const originalButtonText = submitButton.innerHTML; // Save original content
                    submitButton.innerHTML = 'Sending... <span class="loader-dots"><span>.</span><span>.</span><span>.</span></span>';


                    const formData = new FormData();
                    formData.append(NAME_ENTRY_ID, form.name.value);
                    formData.append(EMAIL_ENTRY_ID, form.email.value);
                    formData.append(SUBJECT_ENTRY_ID, form.subject.value);
                    formData.append(MESSAGE_ENTRY_ID, form.message.value);

                    try {
                        const response = await fetch(GOOGLE_FORM_ACTION_URL, {
                            method: 'POST',
                            mode: 'no-cors', // Important: Google Forms doesn't support CORS for POST from arbitrary origins
                            body: formData,
                        });
                        
                        // With 'no-cors', we can't actually read the response status or body.
                        // We assume success if the request doesn't throw a network error.
                        console.log('Form data sent to Google Forms (assumed success due to no-cors).');

                        confirmationMessage.textContent = "Message Sent! Thank you.";
                        confirmationMessage.style.backgroundColor = "var(--color-accent-secondary)";
                        confirmationMessage.style.display = 'block';
                        gsap.fromTo(confirmationMessage, 
                            { opacity: 0, y: 20 }, 
                            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', onComplete: () => {
                                form.reset();
                                // Reset floating labels by removing placeholder-shown state if any JS handles it
                                form.querySelectorAll('input, textarea').forEach(el => {
                                    // If you have JS that adds/removes classes for placeholder-shown behavior, reset it here
                                    // Otherwise, placeholder=" " and :not(:placeholder-shown) CSS should handle reset
                                });
                                setTimeout(() => {
                                    gsap.to(confirmationMessage, { opacity: 0, duration: 0.5, onComplete: () => confirmationMessage.style.display = 'none' });
                                }, 4000); // Increased display time
                            }}
                        );

                    } catch (error) {
                        console.error('Error submitting to Google Forms:', error);
                        confirmationMessage.textContent = "Submission Error. Please try again.";
                        confirmationMessage.style.backgroundColor = "red"; // Error color
                        confirmationMessage.style.display = 'block';
                        gsap.fromTo(confirmationMessage, { opacity: 0, y:20}, {opacity:1, y:0, duration:0.5});
                    } finally {
                        submitButton.classList.remove('is-submitting');
                        submitButton.disabled = false;
                        submitButton.innerHTML = originalButtonText; // Restore button content
                    }

                } else {
                    gsap.to(form, { x: '+=8', duration: 0.05, repeat: 5, yoyo: true, clearProps: 'x', ease: 'power1.inOut' });
                }
            });

            // Ripple effect logic for submit button (no change needed here, ensure .modern-submit is targeted if class changed)
            const modernSubmitButton = form.querySelector('.submit-button.modern-submit');
            if (modernSubmitButton) {
                modernSubmitButton.addEventListener('click', function (e) {
                    // ... (existing ripple code) ...
                    const rect = e.target.getBoundingClientRect();
                        const ripple = document.createElement('span');
                        ripple.className = 'ripple';
                        ripple.style.left = `${e.clientX - rect.left}px`;
                        ripple.style.top = `${e.clientY - rect.top}px`;
                        this.appendChild(ripple);
                        setTimeout(() => ripple.remove(), 600);
                });
            }
        }
    }
}