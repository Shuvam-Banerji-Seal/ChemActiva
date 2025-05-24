// src/js/ScrollAnimations.js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default class ScrollAnimations {
    constructor() {
        this.sceneManager = null;
        this.teamScrollTween = null; 
    }

    init(sceneManagerInstance) {
        this.sceneManager = sceneManagerInstance;
        // console.log("[ScrollAnimations] Initializing scroll effects...");

        this.initNavbarScroll();
        this.initHeroTextFade();
        this.initLightingScroll();
        // initJourneyTimelineAnimations is called by App.js after JourneyManager populates DOM
        this.initCoreFocusAnimations();
        // initTeamAutoScroll is called by App.js AFTER TeamManager populates DOM
        this.initGenericCardAnimations();
        
        // console.log("Scroll animations setup complete.");
    }

    initNavbarScroll() {
        const navbar = document.getElementById('navbar');
        if (!navbar) return;
        ScrollTrigger.create({
            start: "top top", end: 99999, // Effectively always active
            onUpdate: (self) => {
                const isScrolled = self.scroll() > 50;
                navbar.classList.toggle('scrolled', isScrolled);
            }
        });
    }

    initHeroTextFade() {
        gsap.to(".hero-text-area", {
            opacity: 1, y: 0, duration: 1, delay: 0.3, // Delay after loader
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
        if(timelineItems.length === 0) return;
        // console.log(`[ScrollAnimations] Animating ${timelineItems.length} journey items.`);
        timelineItems.forEach(item => {
            // Determine if item is odd/even for staggered animation direction
            const isOdd = Array.from(item.parentElement.children).indexOf(item) % 2 === 0; 
            gsap.fromTo(item,
                { opacity: 0, y: 50, x: isOdd ? 50 : -50 },
                {
                    opacity: 1, y: 0, x: 0, duration: 0.8, ease: 'power2.out',
                    scrollTrigger: {
                        trigger: item, start: "top 90%", 
                        toggleActions: "play none none none"
                    }
                }
            );
        });
    }

    initCoreFocusAnimations() {
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

    initTeamAutoScroll() {
        const teamGrid = document.querySelector('#team-grid.team-flex-container');
        const teamScrollerWrapper = document.querySelector('.team-scroller-wrapper');

        if (!teamGrid || !teamScrollerWrapper || teamGrid.children.length === 0) {
            // console.warn('[TeamAutoScroll] Team grid/wrapper not found or empty. Attempting fallback animation.');
            this.animateInTeamCards(); 
            return;
        }
        
        ScrollTrigger.getAll().forEach(st => {
            if (st.vars.trigger === teamScrollerWrapper || st.vars.trigger === teamGrid) {
                st.kill();
            }
        });
        if (this.teamScrollTween) {
            this.teamScrollTween.kill();
        }

        let originalCards = gsap.utils.toArray(teamGrid.children);
        if (originalCards.length === 0) {
             this.animateInTeamCards(); // Fallback if somehow cards array is empty after checks
             return;
        }

        // Ensure images are loaded or have dimensions before calculating cardWidth
        // This is a common pitfall. For simplicity, we assume CSS sets a fixed/min-width on cards.
        let cardWidth = originalCards[0].offsetWidth; 
        const gap = parseFloat(getComputedStyle(teamGrid).gap) || 25; // Use gap from CSS
        let oneSetWidth = (cardWidth + gap) * originalCards.length - gap; 

        const viewportWidth = teamScrollerWrapper.clientWidth;

        if (oneSetWidth <= viewportWidth || originalCards.length < 3) { // Don't scroll if not enough content or too few cards
            // console.log('[TeamAutoScroll] Not enough card width or too few cards to scroll. Centering content.');
            teamGrid.style.justifyContent = 'center';
            this.animateInTeamCards(); // Apply simple fade-in for cards if not scrolling
            return;
        }
        teamGrid.style.justifyContent = 'flex-start'; // Ensure left alignment for scrolling

        // Clone cards for seamless loop
        const fragment = document.createDocumentFragment();
        originalCards.forEach(card => {
            const clone = card.cloneNode(true);
            fragment.appendChild(clone);
        });
        teamGrid.appendChild(fragment); // Append all clones at once

        const scrollSpeed = 40; // pixels per second

        this.teamScrollTween = gsap.to(teamGrid, {
            x: `-=${oneSetWidth + gap}`, 
            duration: (oneSetWidth + gap) / scrollSpeed,
            ease: "none",
            repeat: -1,
            modifiers: {
                x: gsap.utils.unitize(x => parseFloat(x) % (oneSetWidth + gap))
            }
        });

        teamScrollerWrapper.addEventListener('mouseenter', () => { if(this.teamScrollTween) this.teamScrollTween.pause() });
        teamScrollerWrapper.addEventListener('mouseleave', () => { if(this.teamScrollTween) this.teamScrollTween.play() });

        // console.log('[TeamAutoScroll] Auto-scroll initialized.');
         gsap.fromTo(gsap.utils.toArray(teamGrid.children), // Animate all children (originals + clones)
            { opacity: 0, scale: 0.95 }, // Start more transparent for a nicer fade-in
            { opacity: 1, scale: 1, duration: 0.8, stagger:0.08, ease: 'power1.out',
              scrollTrigger: {trigger: teamScrollerWrapper, start: "top 88%", toggleActions: "play none none none"}
            }
        );
    }

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
                        start: "top 88%", // Trigger slightly earlier
                        toggleActions: "play none none none",
                    }
                }
            );
        });
    }

    animateInTeamCards() { 
        // console.log("[ScrollAnimations] animateInTeamCards (fallback or non-scrolling team).");
        const cards = gsap.utils.toArray('.team-card');
        if (cards.length === 0) return;
        
        const triggerElement = cards[0].closest('.team-scroller-wrapper') || cards[0].closest('#our-team') || document.querySelector('#our-team');
        if (!triggerElement) return; // No valid trigger

        gsap.fromTo(cards,
            { opacity: 0, scale: 0.85, y: 40 },
            {
                opacity: 1, scale: 1, y: 0, duration: 0.6,
                stagger: 0.1, ease: "power2.out",
                scrollTrigger: {
                    trigger: triggerElement,
                    start: "top 85%",
                    toggleActions: "play none none none",
                }
            }
        );
    }
}