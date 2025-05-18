// src/js/ScrollAnimations.js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default class ScrollAnimations {
    constructor() {
        this.sceneManager = null;
    }

    init(sceneManagerInstance) {
        this.sceneManager = sceneManagerInstance;
        console.log("[ScrollAnimations] Initializing...");

        this.initNavbarScroll();
        this.initHeroTextFade();
        this.initLightingScroll();
        this.initJourneyTimelineAnimations(); // New for journey section
        this.initCoreFocusAnimations();       // New for core focus
        // this.initTeamScroll();                // Updated for horizontal scroll
        this.initTeamAutoScroll();            // New for team auto-scroll
        this.initGenericCardAnimations();     // For awards, products, advisors etc.
        
        console.log("Scroll animations initialized with new structure.");
    }

    initNavbarScroll() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;
        ScrollTrigger.create({
            start: "top top", end: 99999,
            onUpdate: (self) => {
                navbar.classList.toggle('scrolled', self.scroll() > 50);
            }
        });
    }

    initHeroTextFade() {
        gsap.to(".hero-text-area", {
            opacity: 1, y: 0, duration: 1, delay: 0.2, // Small delay after loader
            scrollTrigger: {
                trigger: "#homepage-hero", start: "top 70%",
                toggleActions: "play none none none"
            }
        });
    }

    initLightingScroll() {
        if (this.sceneManager && typeof this.sceneManager.updateLighting === 'function') {
            ScrollTrigger.create({
                trigger: "body", start: "top top", end: "bottom bottom", scrub: 1.2,
                onUpdate: (self) => this.sceneManager.updateLighting(self.progress)
            });
        }
    }

    initJourneyTimelineAnimations() {
        const timelineItems = gsap.utils.toArray('.timeline-item');
        timelineItems.forEach(item => {
            gsap.fromTo(item,
                { opacity: 0, y: 50, x: item.matches(':nth-child(odd)') ? 50 : -50 },
                {
                    opacity: 1, y: 0, x: 0, duration: 0.8, ease: 'power2.out',
                    scrollTrigger: {
                        trigger: item,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    }
                }
            );
        });
    }

    initCoreFocusAnimations() {
        // Similar to old .goal-item animation, now for .focus-item
        gsap.utils.toArray('.focus-item.card-style').forEach((item, index) => {
            gsap.fromTo(item, 
                { opacity: 0, y: 50, scale: 0.9 },
                { 
                    opacity: 1, y: 0, scale: 1, duration: 0.7, delay: index * 0.1,
                    scrollTrigger: {
                        trigger: item, start: "top 85%",
                        toggleActions: "play none none none"
                    }
                }
            );
        });
    }

    // src/js/ScrollAnimations.js (or new TeamScroller.js module)

    // Method to be called from App.js after team cards are loaded
    initTeamAutoScroll() {
        const teamGrid = document.querySelector('#team-grid.team-flex-container');
        if (!teamGrid || teamGrid.children.length === 0) {
            console.warn('[TeamAutoScroll] Team grid not found or empty.');
            return;
        }

        // Calculate total width of all cards + gaps
        let totalWidth = 0;
        const cards = gsap.utils.toArray(teamGrid.children);
        const gap = parseFloat(getComputedStyle(teamGrid).gap) || 30; // Get gap from CSS

        cards.forEach(card => {
            totalWidth += card.offsetWidth;
        });
        totalWidth += (cards.length - 1) * gap; // Add total gap width

        const viewportWidth = teamGrid.parentElement.clientWidth; // Width of .team-scroller-wrapper or similar

        if (totalWidth <= viewportWidth) {
            console.log('[TeamAutoScroll] Not enough cards to scroll.');
            // If not enough cards, we might not need the old ScrollTrigger based horizontal scroll either.
            // Consider removing the ScrollTrigger part for team if auto-scroll is primary.
            // Fallback to simple card animation:
            this.animateInTeamCards(); // (The old vertical reveal one)
            return;
        }

        // To make it loop, duplicate the cards
        cards.forEach(card => {
            const clone = card.cloneNode(true);
            teamGrid.appendChild(clone);
        });
        // totalWidth *= 2; // Now double the width

        const scrollSpeed = 50; // Pixels per second

        // GSAP timeline for continuous scroll
        this.teamScrollTween = gsap.to(teamGrid, {
            x: `-=${totalWidth + gap}`, // Scroll one full set of original cards + one gap
            duration: (totalWidth + gap) / scrollSpeed,
            ease: "none",
            repeat: -1, // Infinite loop
            modifiers: {
                x: gsap.utils.unitize(x => parseFloat(x) % (totalWidth + gap)) // Wrap around
            }
        });

        // Pause on hover
        teamGrid.parentElement.addEventListener('mouseenter', () => {
            if (this.teamScrollTween) this.teamScrollTween.pause();
        });
        teamGrid.parentElement.addEventListener('mouseleave', () => {
            if (this.teamScrollTween) this.teamScrollTween.play();
        });

        // Initial fade-in for cards (can be simpler now)
        gsap.fromTo(gsap.utils.toArray(teamGrid.children), 
            { opacity: 0.3, scale: 0.9 },
            { 
                opacity: 1, scale: 1, duration: 0.8, stagger: 0.1, ease: 'power2.out',
                scrollTrigger: { // Still useful to only animate when section is somewhat visible
                    trigger: teamGrid.parentElement,
                    start: "top 80%",
                    toggleActions: "play none none none"
                }
            }
        );

        // Remove old team scroll trigger if it exists from previous setup
        ScrollTrigger.getAll().forEach(st => {
            if (st.vars.trigger === teamGrid.parentElement && st.vars.pin === true) { // Identify old pin
                console.log('[TeamAutoScroll] Killing old team scroll trigger pin.');
                st.kill();
            }
        });
        console.log('[TeamAutoScroll] Auto-scroll initialized.');
    }

// In your ScrollAnimations.js 'init' method, remove the old team scroll code
// And in App.js, call this.scrollAnimations.initTeamAutoScroll() AFTER teamManager.loadAndDisplayTeam()

// The old animateInTeamCards method can be kept as a fallback or for other sections if needed.
// animateInTeamCards() { ... }
    
    // For cards that are not part of a special scroller (awards, products, advisors)
    initGenericCardAnimations() {
        const genericCards = gsap.utils.toArray('.card-style:not(.team-card):not(.focus-item):not(.timeline-content)');
        genericCards.forEach((card, index) => {
             gsap.fromTo(card,
                { opacity: 0, y: 40, scale:0.95 },
                {
                    opacity: 1, y: 0, scale:1, duration: 0.6, delay: index * 0.05,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: card,
                        start: "top 88%",
                        toggleActions: "play none none none",
                    }
                }
            );
        });
    }

    // Kept for fallback if team section doesn't scroll
    animateInTeamCards() {
        console.log("[ScrollAnimations] animateInTeamCards (fallback for vertical).")
        gsap.utils.toArray('.team-card').forEach((card, index) => {
            gsap.fromTo(card,
                { opacity: 0, scale: 0.8, y: 50 },
                {
                    opacity: 1, scale: 1, y: 0, duration: 0.6,
                    delay: index * 0.1,
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: card,
                        start: "top 90%",
                        toggleActions: "play none none none",
                    }
                }
            );
        });
    }
}