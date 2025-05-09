// src/js/ScrollAnimations.js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default class ScrollAnimations {
    constructor() {
        // Reference to SceneManager needed if Three.js elements are animated by scroll
        // This can be passed in init or constructor
        this.sceneManager = null; // Will be set by App.js or main if needed for lighting
    }

    init(sceneManagerInstance) {
        this.sceneManager = sceneManagerInstance; // If App.js passes it

        // Navbar scroll effect
        const navbar = document.getElementById('navbar');
        ScrollTrigger.create({
            start: "top top",
            end: 99999,
            onUpdate: (self) => {
                if (self.scroll() > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            }
        });

        // Hero Text Fade-in (triggered slightly after scroll starts or on load if visible)
        gsap.to(".hero-text-area", {
            opacity: 1,
            y: 0,
            duration: 1,
            scrollTrigger: {
                trigger: "#homepage-hero",
                start: "top 80%", // Start when 80% of hero is visible
                toggleActions: "play none none none"
            }
        });
        
        // Lighting Theme Scroll (affecting Three.js scene and CSS vars)
        // This assumes the main scrollable content determines the "time of day"
        if (this.sceneManager && typeof this.sceneManager.updateLighting === 'function') {
            ScrollTrigger.create({
                trigger: "body", // Whole page scroll
                start: "top top",
                end: "bottom bottom", // Entire scroll length
                scrub: 1, // Smooth scrubbing
                onUpdate: (self) => {
                    this.sceneManager.updateLighting(self.progress);
                    // Also update CSS variables for background gradient on #homepage-hero
                    const heroSection = document.getElementById('homepage-hero');
                    if(heroSection) {
                        // This logic is simplified from SceneManager's updateLighting
                        // You may want to consolidate it
                        let startColor, endColor;
                        if (self.progress < 0.33) { 
                            startColor = '#FFFACD'; endColor = '#F0E68C';
                        } else if (self.progress < 0.66) {
                            startColor = '#FFFFFF'; endColor = '#E0FFFF';
                        } else {
                            startColor = '#90EE90'; endColor = '#FFD700';
                        }
                        heroSection.style.background = `linear-gradient(135deg, ${startColor}, ${endColor})`;
                    }
                }
            });
        }


        // "Our Goals" icons animation
        gsap.utils.toArray('.goal-item').forEach(item => {
            gsap.fromTo(item, 
                { opacity: 0, y: 50 },
                { 
                    opacity: 1, y: 0, duration: 0.8, stagger: 0.2,
                    scrollTrigger: {
                        trigger: item,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    }
                }
            );
        });

        // "Our Team" cards animation
        // This will be triggered after TeamManager loads cards.
        // We can set up a generic trigger for elements with a class like .animate-on-scroll
        // Or call this after team cards are added to DOM.
        // For now, let's assume cards will be there. TeamManager can call a method here.
        // See TeamManager for actual triggering.

        // "Awards" items animation
        gsap.utils.toArray('.award-item').forEach(item => {
            gsap.fromTo(item,
                { opacity: 0, x: -50, scale: 0.9 },
                {
                    opacity: 1, x: 0, scale: 1, duration: 0.8,
                    ease: "back.out(1.7)", // Bounce effect
                    scrollTrigger: {
                        trigger: item,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    }
                }
            );
        });

        // Parallax effect for backgrounds (Example for #goals section)
        // Add a background element inside #goals: <div class="parallax-bg"></div>
        // Style .parallax-bg: position: absolute, background-image, z-index: -1, etc.
        /*
        gsap.to("#goals .parallax-bg", { // Assuming #goals has a child with class .parallax-bg
            backgroundPosition: "50% 100px", // Move background slower than scroll
            ease: "none",
            scrollTrigger: {
                trigger: "#goals",
                start: "top bottom", // When top of #goals hits bottom of viewport
                end: "bottom top",   // When bottom of #goals hits top of viewport
                scrub: true
            }
        });
        */

        // "Our Vision" - 3D Timeline: This is very advanced.
        // For a 2D timeline with ScrollTrigger:
        // Create HTML for milestones. Animate them based on scroll position within #vision-timeline-container.
        // Example: Line drawing animation for connections, items fading/sliding in.
        // If using Three.js: camera moves along a path, highlighting 3D objects representing milestones.
        // This would need significant dedicated code in SceneManager or a new VisionTimeline.js module.
        // For now, placeholder in HTML.
        console.log("Scroll animations initialized.");
    }

    animateInTeamCards() {
        gsap.utils.toArray('.team-card').forEach((card, index) => {
            gsap.fromTo(card,
                { opacity: 0, scale: 0.8, y: 50 },
                {
                    opacity: 1, scale: 1, y: 0, duration: 0.6,
                    delay: index * 0.1, // Staggered animation
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: card,
                        start: "top 90%", // Animate when card is 90% into view
                        toggleActions: "play none none none",
                    }
                }
            );
        });
    }
}