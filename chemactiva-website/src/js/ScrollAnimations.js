// src/js/ScrollAnimations.js
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from "gsap/Draggable"; 

gsap.registerPlugin(ScrollTrigger, Draggable);

export default class ScrollAnimations {
    constructor() {
        this.sceneManager = null;
        this.teamScrollTween = null;
        this.teamAnimationConfig = {
            mobile: {
                enableAutoScroll: true,
                scrollSpeed: 30, 
                pauseOnInteraction: true,
                snapToCards: true,      
                showScrollbar: false,
                enableTouchScroll: true,
                enableTapToEnlarge: true,
                autoResumeDelay: 4000, 
                enlargeScale: 1.08,     
            },
            desktop: {
                enableAutoScroll: true,
                scrollSpeed: 40,
                pauseOnInteraction: true,
                snapToCards: false,
                showScrollbar: false,
                enableTouchScroll: false, 
                enableTapToEnlarge: false,
                autoResumeDelay: 3000,
                enlargeScale: 1.05,
            }
        };
        this.isMobile = this.detectMobile();
        this.animationQuality = this.detectAnimationQuality(); // Keep this
        this.teamInteractionTimeout = null; 
        this.activeCardIndex = 0; 
        this.teamDraggable = null; 
        this.resizeTimeout = null;

        this.handleResize = this.handleResize.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        
        window.addEventListener('resize', this.handleResize);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }

    detectMobile() {
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
        return (window.innerWidth <= 768 && hasTouch) || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    detectAnimationQuality() {
        // ... (Keep your existing detectAnimationQuality logic) ...
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'minimal';
        const hasDedicatedGPU = () => { 
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    return renderer && (renderer.toLowerCase().includes('nvidia') || renderer.toLowerCase().includes('amd'));
                }
            }
            return false;
        };
        if (hasDedicatedGPU() && (navigator.hardwareConcurrency || 4) >= 4) return 'high';
        if ((navigator.hardwareConcurrency || 2) >= 2) return 'medium';
        return 'low';
    }

    handleResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            const wasMobile = this.isMobile;
            this.isMobile = this.detectMobile();
            if (wasMobile !== this.isMobile) {
                this.reinitializeTeamAnimations();
            }
            ScrollTrigger.refresh();
        }, 250);
    }

    handleVisibilityChange() {
        if (document.hidden) {
            if (this.teamScrollTween) this.teamScrollTween.pause();
            gsap.globalTimeline.pause();
        } else {
            // Only resume teamScrollTween if autoScroll is enabled for the current mode
            // AND if it wasn't paused by user interaction (this part is tricky without more state)
            // For now, simple resume if autoScroll is generally enabled.
            const config = this.getCurrentTeamConfig();
            if (this.teamScrollTween && config.enableAutoScroll) {
                 // Check if it was paused by user interaction before resuming
                if (!this.teamDraggable || (this.teamDraggable && !this.teamDraggable.isDragging && !this.teamDraggable.isThrowing)) {
                    this.teamScrollTween.play();
                }
            }
            gsap.globalTimeline.resume();
        }
    }

    getCurrentTeamConfig() {
        return this.isMobile ? this.teamAnimationConfig.mobile : this.teamAnimationConfig.desktop;
    }

    init(sceneManagerInstance) {
        this.sceneManager = sceneManagerInstance;
        this.initNavbarScroll(); // From your provided simpler version
        this.initHeroTextFade();   // Use the simpler, direct version for hero text
        this.initLightingScroll();
        this.initCoreFocusAnimations();
        this.initGenericCardAnimations();
        this.initScrollProgress();     // From the more feature-rich version
        this.initParallaxElements();   // From the more feature-rich version
    }

    initNavbarScroll() { // Using the simpler version you provided
        const navbar = document.getElementById('navbar');
        if (!navbar) return;
        ScrollTrigger.create({
            start: "top top", end: 99999,
            onUpdate: (self) => {
                navbar.classList.toggle('scrolled', self.scroll() > 50);
            }
        });
    }

    initHeroTextFade() { // Using the simpler version you provided that worked for the tagline
        gsap.to(".hero-text-area", { // This targets the container of H1 and P
            opacity: 1, y: 0, duration: 1, delay: 0.3, 
            scrollTrigger: {
                trigger: "#homepage-hero", start: "top 70%",
                toggleActions: "play none none none"
            }
        });
    }

    initLightingScroll() { /* ... same as your last working version ... */ 
        if (this.sceneManager && typeof this.sceneManager.updateLighting === 'function') {
            ScrollTrigger.create({
                trigger: "body", start: "top top", end: "bottom bottom", 
                scrub: this.animationQuality === 'high' ? 1.2 : 1.8,
                onUpdate: (self) => this.sceneManager.updateLighting(self.progress)
            });
        }
    }
    
    initScrollProgress() { /* ... same as your last working version ... */ 
        let progressBar = document.querySelector('.scroll-progress');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'scroll-progress';
            Object.assign(progressBar.style, {
                position: 'fixed', top: '0', left: '0', width: '0%', height: '3px',
                background: 'var(--color-accent-primary)', zIndex: '10000', opacity: '0.8'
            });
            document.body.appendChild(progressBar);
        }
        ScrollTrigger.create({
            trigger: "body", start: "top top", end: "bottom bottom",
            onUpdate: (self) => {
                gsap.to(progressBar, { width: `${self.progress * 100}%`, duration: 0.05, ease: "none" });
            }
        });
    }

    initParallaxElements() { /* ... same as your last working version ... */ 
        if (this.animationQuality === 'low') return;
        const parallaxElements = gsap.utils.toArray('[data-parallax-speed]');
        parallaxElements.forEach(element => {
            const speed = parseFloat(element.dataset.parallaxSpeed) || 0.2;
            gsap.to(element, {
                yPercent: -30 * speed, 
                ease: "none",
                scrollTrigger: {
                    trigger: element.parentElement.closest('section') || element,
                    start: "top bottom", end: "bottom top",
                    scrub: 1.8 
                }
            });
        });
    }

    initJourneyTimelineAnimations() { /* ... same as your last working version ... */ 
        const timelineItems = gsap.utils.toArray('.timeline-item');
        if(timelineItems.length === 0) return;
        timelineItems.forEach((item, index) => {
            const isOdd = Array.from(item.parentElement.children).indexOf(item) % 2 === 0; 
            gsap.fromTo(item,
                { opacity: 0, y: 50, x: isOdd ? 50 : -50, scale: 0.95, rotationY: isOdd ? 5 : -5 },
                {
                    opacity: 1, y: 0, x: 0, scale: 1, rotationY: 0,
                    duration: this.animationQuality === 'high' ? 0.9 : 0.7, 
                    ease: 'power2.out',
                    scrollTrigger: { trigger: item, start: "top 90%", toggleActions: "play none none none" }
                }
            );
        });
    }

    initCoreFocusAnimations() { /* ... same as your last working version ... */ 
        const focusItems = gsap.utils.toArray('.focus-item.card-style');
        if (focusItems.length === 0) return;
        focusItems.forEach((item, index) => {
            gsap.fromTo(item, 
                { opacity: 0, y: 60, scale: 0.9, rotationX: 5 },
                { opacity: 1, y: 0, scale: 1, rotationX: 0, 
                  duration: this.animationQuality === 'high' ? 0.8 : 0.6,
                  delay: index * 0.08, ease: "back.out(1.4)",
                  scrollTrigger: { trigger: item, start: "top 88%", toggleActions: "play none none none" }
                }
            );
        });
    }
    
initTeamAutoScroll() {
    const teamGrid = document.querySelector('#team-grid.team-flex-container');
    const teamScrollerWrapper = document.querySelector('.team-scroller-wrapper');

    if (!teamGrid || !teamScrollerWrapper || teamGrid.children.length === 0) {
        this.animateInTeamCards(); 
        return;
    }
    this.cleanupTeamAnimations();
    
    const config = this.getCurrentTeamConfig();
    let originalCards = gsap.utils.toArray(teamGrid.children).filter(child => child.classList.contains('team-card'));

    if (originalCards.length === 0) {
        this.animateInTeamCards(); 
        return;
    }

    let cardWidth = originalCards[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(teamGrid).gap) || 25;
    let oneSetWidth = (cardWidth + gap) * originalCards.length - gap;
    const viewportWidth = teamScrollerWrapper.clientWidth;

    const needsScrolling = oneSetWidth > viewportWidth && originalCards.length >= (this.isMobile ? 1 : 3);

    if (!needsScrolling) {
        teamGrid.style.justifyContent = 'center';
        this.animateInTeamCards(); 
        return;
    }
    teamGrid.style.justifyContent = 'flex-start';

    // Clone cards if needed
    if (config.enableAutoScroll) {
        const fragment = document.createDocumentFragment();
        originalCards.forEach(card => {
            const clone = card.cloneNode(true);
            clone.classList.add('team-card-clone');
            fragment.appendChild(clone);
        });
        teamGrid.appendChild(fragment);
    }

    // Touch scroll via Draggable
    if (this.isMobile && config.enableTouchScroll) {
        if (this.teamDraggable) this.teamDraggable.kill();
        this.teamDraggable = Draggable.create(teamGrid, {
            type: "x",
            edgeResistance: 0.65,
            bounds: teamScrollerWrapper,
            inertia: true,
            snap: config.snapToCards ? { x: endValue => Math.round(endValue / (cardWidth + gap)) * (cardWidth + gap) } : false,
            onDragStart: () => {
                if (this.teamScrollTween && config.pauseOnInteraction) this.teamScrollTween.pause();
                clearTimeout(this.teamInteractionTimeout);
            },
            onDragEnd: () => {
                    // Resume auto-scroll after drag ends
                    if (config.enableAutoScroll && this.teamScrollTween) {
                        // Restart the tween to ensure it's smooth and based on current x
                        const currentX = gsap.getProperty(teamGrid, "x");
                        const newDistance = oneSetWidth + gap;
                        const newDuration = newDistance / (config.scrollSpeed * this.tapSpeedMultiplier);

                        this.teamScrollTween.kill(); // Kill old tween
                        this.teamScrollTween = gsap.to(teamGrid, {
                            x: `-=${newDistance}`,
                            duration: newDuration,
                            ease: "none",
                            repeat: -1,
                            modifiers: {
                                x: gsap.utils.unitize(x => parseFloat(x) % newDistance)
                            },
                            onUpdate: () => this.updateMobileScrollIndicators(teamGrid, originalCards.length)
                        });
                    }

                    this.updateMobileScrollIndicators(teamGrid, originalCards.length);
                },
            onDrag: () => this.updateMobileScrollIndicators(teamGrid, originalCards.length)
        })[0];
        teamGrid.style.overflowX = 'hidden';
    } else if (this.isMobile) {
        teamGrid.style.overflowX = 'auto';
        teamGrid.addEventListener('scroll', () => {
            clearTimeout(this.teamInteractionTimeout);
            this.teamInteractionTimeout = setTimeout(() => this.updateMobileScrollIndicators(teamGrid, originalCards.length), 50);
            if (this.teamScrollTween && config.pauseOnInteraction) this.teamScrollTween.pause();
            this.teamInteractionTimeout = setTimeout(() => {
                if (this.teamScrollTween && config.enableAutoScroll) this.teamScrollTween.play();
            }, config.autoResumeDelay);
        });
    }

    // Set up initial speed multiplier
    this.tapSpeedMultiplier = 1;
    this.maxSpeedMultiplier = 3;
    this.lastTapTime = 0;

    // Auto-scroll tween
    if (config.enableAutoScroll) {
        const scrollDistance = oneSetWidth + gap;
        this.teamScrollTween = gsap.to(teamGrid, {
            x: `-=${scrollDistance}`,
            duration: scrollDistance / config.scrollSpeed,
            ease: "none",
            repeat: -1,
            modifiers: {
                x: gsap.utils.unitize(x => parseFloat(x) % scrollDistance)
            },
            onUpdate: this.isMobile ? () => this.updateMobileScrollIndicators(teamGrid, originalCards.length) : null,
            paused: this.isMobile && config.enableTouchScroll
        });

        // Pause on hover (desktop)
        if (config.pauseOnInteraction && !this.isMobile) {
            teamScrollerWrapper.addEventListener('mouseenter', () => {
                if (this.teamScrollTween) this.teamScrollTween.pause();
            });
            teamScrollerWrapper.addEventListener('mouseleave', () => {
                if (this.teamScrollTween) this.teamScrollTween.play();
            });
        }

        // Mobile: tap to resume & speed up
        if (this.isMobile) {
            let tapResetTimeout;
            document.addEventListener('pointerdown', () => {
                const now = Date.now();
                if (now - this.lastTapTime < 300) return;
                this.lastTapTime = now;

                if (this.teamScrollTween && this.teamScrollTween.paused()) {
                    this.teamScrollTween.play();
                }

                if (this.tapSpeedMultiplier < this.maxSpeedMultiplier) {
                    this.tapSpeedMultiplier += 0.2;
                    const newDuration = scrollDistance / (config.scrollSpeed * this.tapSpeedMultiplier);
                    this.teamScrollTween.duration(newDuration);
                }

                clearTimeout(tapResetTimeout);
                tapResetTimeout = setTimeout(() => {
                    this.tapSpeedMultiplier = 1;
                    const resetDuration = scrollDistance / config.scrollSpeed;
                    if (this.teamScrollTween) {
                        this.teamScrollTween.duration(resetDuration);
                    }
                }, 8000); // Reset after 8s idle
            });
        }
    }

    if (this.isMobile && config.enableTapToEnlarge) {
        this.setupMobileTapToEnlarge(originalCards, config);
    }
    if (this.isMobile) {
        this.addMobileScrollIndicators(teamScrollerWrapper, teamGrid, originalCards.length);
        this.updateMobileScrollIndicators(teamGrid, originalCards.length);
    }

    gsap.fromTo(gsap.utils.toArray(teamGrid.children),
        { opacity: 0.3, scale: 0.9 },
        {
            opacity: 1, scale: 1, duration: 0.8, stagger: 0.08, ease: 'power1.out',
            scrollTrigger: {
                trigger: teamScrollerWrapper,
                start: "top 88%",
                toggleActions: "play none none none"
            }
        });
}


    setupMobileTapToEnlarge(cards, config) {
        cards.forEach((card) => {
            let isEnlarged = false;
            let tapTimeout; // Use a different name than teamInteractionTimeout

            card.addEventListener('click', (e) => { 
                if (this.teamDraggable && (this.teamDraggable.isDragging || this.teamDraggable.isThrowing)) return; 
                e.preventDefault(); 
                clearTimeout(this.teamInteractionTimeout); 
                clearTimeout(tapTimeout); 

                if (isEnlarged) {
                    gsap.to(card, { scale: 1, zIndex: 1, duration: 0.3, ease: 'power2.out' });
                    isEnlarged = false;
                    if (this.teamScrollTween && config.enableAutoScroll && config.pauseOnInteraction) {
                        this.teamInteractionTimeout = setTimeout(() => { if (this.teamScrollTween) this.teamScrollTween.play(); }, config.autoResumeDelay / 2);
                    }
                } else {
                    if (this.teamScrollTween && config.pauseOnInteraction) this.teamScrollTween.pause();
                    gsap.to(card, { scale: config.enlargeScale, zIndex: 10, duration: 0.3, ease: 'back.out(1.7)' });
                    isEnlarged = true;
                    
                    tapTimeout = setTimeout(() => {
                        if (isEnlarged) { 
                            gsap.to(card, { scale: 1, zIndex: 1, duration: 0.3, ease: 'power2.out' });
                            isEnlarged = false;
                            if (this.teamScrollTween && config.enableAutoScroll && config.pauseOnInteraction) {
                                this.teamScrollTween.play(); 
                            }
                        }
                    }, config.autoResumeDelay);
                }
            });
        });
    }

    addMobileScrollIndicators(wrapper, teamGrid, numOriginalCards) {
        // ... (same as your previous version, ensure CSS for .scroll-indicator-dot is present) ...
        let indicatorContainer = wrapper.querySelector('.team-scroll-indicators');
        if (!indicatorContainer) {
            indicatorContainer = document.createElement('div');
            indicatorContainer.className = 'team-scroll-indicators';
            wrapper.appendChild(indicatorContainer);
        }
        indicatorContainer.innerHTML = ''; 

        for (let i = 0; i < numOriginalCards; i++) {
            const dot = document.createElement('div');
            dot.className = 'scroll-indicator-dot';
            dot.addEventListener('click', () => {
                if (this.teamScrollTween && this.getCurrentTeamConfig().pauseOnInteraction) this.teamScrollTween.pause();
                const cardWidthPlusGap = (teamGrid.children[0]?.offsetWidth || 280) + (parseFloat(getComputedStyle(teamGrid).gap) || 25);
                const targetScrollX = i * cardWidthPlusGap;

                if (this.teamDraggable) {
                    gsap.to(this.teamDraggable.target, { x: -targetScrollX, duration: 0.5, ease: 'power2.inOut' });
                } else {
                    teamGrid.scrollTo({ left: targetScrollX, behavior: 'smooth' });
                }
                this.activeCardIndex = i;
                this.updateMobileScrollIndicators(teamGrid, numOriginalCards);
                
                clearTimeout(this.teamInteractionTimeout);
                if (this.getCurrentTeamConfig().enableAutoScroll) {
                    this.teamInteractionTimeout = setTimeout(() => { if (this.teamScrollTween) this.teamScrollTween.play(); }, this.getCurrentTeamConfig().autoResumeDelay);
                }
            });
            indicatorContainer.appendChild(dot);
        }
    }

    updateMobileScrollIndicators(teamGrid, numOriginalCards) {
        // ... (same as your previous version, ensure CSS for active dot is handled) ...
        if (!this.isMobile || numOriginalCards === 0 || !teamGrid.parentElement) return;
        const indicatorContainer = teamGrid.parentElement.querySelector('.team-scroll-indicators');
        if (!indicatorContainer || indicatorContainer.children.length !== numOriginalCards) return;

        let currentScrollX;
        if (this.teamDraggable && this.teamDraggable.x !== undefined) {
            currentScrollX = -this.teamDraggable.x;
        } else {
            currentScrollX = teamGrid.scrollLeft;
        }
        
        const cardWidth = teamGrid.children[0]?.offsetWidth || 280;
        const gap = parseFloat(getComputedStyle(teamGrid).gap) || 25;
        const cardWidthPlusGap = cardWidth + gap;
        
        if (cardWidthPlusGap === 0) return;

        let activeIndexFloat = currentScrollX / cardWidthPlusGap;
        
        // Handle looped content with Draggable or auto-scroll
        if ((this.teamDraggable || this.teamScrollTween) && this.getCurrentTeamConfig().enableAutoScroll) { 
             activeIndexFloat = (currentScrollX % (cardWidthPlusGap * numOriginalCards)) / cardWidthPlusGap;
             if (activeIndexFloat < 0) activeIndexFloat += numOriginalCards; // Ensure positive index
        }

        this.activeCardIndex = Math.round(activeIndexFloat) % numOriginalCards;
        if (this.activeCardIndex < 0) this.activeCardIndex += numOriginalCards;

        Array.from(indicatorContainer.children).forEach((dot, index) => {
            const isActive = index === this.activeCardIndex;
            dot.style.backgroundColor = isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)';
            dot.style.transform = isActive ? 'scale(1.3)' : 'scale(1)';
        });
    }

    initGenericCardAnimations() { /* ... same as your previous version ... */ 
        const genericCards = gsap.utils.toArray('.card-style:not(.team-card):not(.focus-item):not(.timeline-content)');
        genericCards.forEach((card, index) => {
             gsap.fromTo(card,
                { opacity: 0, y: 40, scale:0.95, filter: 'blur(1px)' },
                {
                    opacity: 1, y: 0, scale:1, filter: 'blur(0px)',
                    duration: this.animationQuality === 'high' ? 0.7 : 0.5, 
                    delay: index * 0.05, ease: "power2.out",
                    scrollTrigger: { trigger: card, start: "top 88%", toggleActions: "play none none none" }
                }
            );
        });
    }

    animateInTeamCards() { /* ... same as your previous version (the fallback) ... */ 
        const cards = gsap.utils.toArray('.team-card');
        if (cards.length === 0) return;
        const triggerElement = cards[0].closest('.team-scroller-wrapper') || cards[0].closest('#our-team') || document.querySelector('#our-team');
        if (!triggerElement) return;

        gsap.fromTo(cards,
            { opacity: 0, scale: 0.85, y: 40, rotationY: this.animationQuality === 'high' ? 8 : 0 },
            {
                opacity: 1, scale: 1, y: 0, rotationY: 0,
                duration: this.animationQuality === 'high' ? 0.7 : 0.5,
                stagger: 0.08, ease: "back.out(1.4)", // Adjusted stagger and ease
                scrollTrigger: {
                    trigger: triggerElement, start: "top 85%",
                    toggleActions: "play none none none",
                }
            }
        );
    }
    
    reinitializeTeamAnimations() {
        this.cleanupTeamAnimations(); 
        setTimeout(() => { this.initTeamAutoScroll(); }, 100); 
    }

    cleanupTeamAnimations() {
        if (this.teamScrollTween) { this.teamScrollTween.kill(); this.teamScrollTween = null; }
        if (this.teamDraggable) { this.teamDraggable.kill(); this.teamDraggable = null; }
        
        ScrollTrigger.getAll().forEach(st => {
            const triggerEl = st.vars.trigger;
            if (triggerEl && ((typeof triggerEl === 'string' && triggerEl.includes('team')) ||
                (triggerEl.classList && (triggerEl.classList.contains('team-scroller-wrapper') || triggerEl.id === 'team-grid' || triggerEl.id === 'our-team'))
            )) {
                st.kill();
            }
        });

        const teamGrid = document.querySelector('#team-grid.team-flex-container');
        if (teamGrid) {
            const clones = teamGrid.querySelectorAll('.team-card-clone');
            clones.forEach(clone => clone.remove());
            teamGrid.style.transform = ''; teamGrid.style.webkitTransform = '';
            teamGrid.style.overflowX = ''; 
        }
        const indicators = document.querySelector('.team-scroll-indicators');
        if (indicators) indicators.remove();
    }
    
    destroy() {
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        this.cleanupTeamAnimations();
        ScrollTrigger.getAll().forEach(st => st.kill());
        gsap.globalTimeline.clear();
        
        const progressBar = document.querySelector('.scroll-progress');
        if (progressBar) progressBar.remove();
    }
}