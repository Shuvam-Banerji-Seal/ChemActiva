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
        this.animationQuality = this.detectAnimationQuality();
        this.teamInteractionTimeout = null; 
        this.activeCardIndex = 0; 
        this.teamDraggable = null; 
        this.resizeTimeout = null;
        this.tapSpeedMultiplier = 1; // For team scroll speed up
        this.lastTapTime = 0;      // For team scroll speed up
        this.maxSpeedMultiplier = 3; // For team scroll speed up

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
            if (wasMobile !== this.isMobile && document.body.classList.contains('homepage')) {
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
            const config = this.getCurrentTeamConfig();
            if (this.teamScrollTween && config.enableAutoScroll) {
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
        // Only run homepage-specific animations on the homepage
        if (document.body.classList.contains('homepage')) {
            this.initHeroTextFade();
            this.initLightingScroll();
            this.initCoreFocusAnimations();
            this.initGenericCardAnimations();
            this.initScrollProgress();
            this.initParallaxElements();
        }
    }

    initHeroTextFade() {
        gsap.to(".hero-text-area", {
            opacity: 1, y: 0, duration: 1.2, delay: 0.5, ease: "power2.out",
            scrollTrigger: {
                trigger: "#homepage-hero",
                start: "top 80%",
                toggleActions: "play none none reverse"
            }
        });
    }

    initLightingScroll() {
        if (this.sceneManager && typeof this.sceneManager.updateLighting === 'function') {
            ScrollTrigger.create({
                trigger: "body", start: "top top", end: "bottom bottom", 
                scrub: this.animationQuality === 'high' ? 1.2 : 1.8,
                onUpdate: (self) => this.sceneManager.updateLighting(self.progress)
            });
        }
    }
    
    initScrollProgress() {
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

    initParallaxElements() {
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

    initJourneyTimelineAnimations() {
        const timelineItems = gsap.utils.toArray('.timeline-item');
        if(timelineItems.length === 0) return;
        timelineItems.forEach((item, index) => {
            const isOdd = index % 2 === 0; 
            gsap.fromTo(item,
                { opacity: 0, y: 50, x: isOdd ? -50 : 50, scale: 0.95 }, // Adjusted x for directness
                {
                    opacity: 1, y: 0, x: 0, scale: 1,
                    duration: this.animationQuality === 'high' ? 0.9 : 0.7, 
                    ease: 'power2.out',
                    scrollTrigger: { trigger: item, start: "top 90%", toggleActions: "play none none reverse" }
                }
            );
        });
    }

    initCoreFocusAnimations() {
        const focusItems = gsap.utils.toArray('.focus-item.card-style');
        if (focusItems.length === 0) return;
        gsap.fromTo(focusItems, 
            { opacity: 0, y: 60, scale: 0.9, rotationX: this.animationQuality === 'high' ? 5 : 0 },
            { opacity: 1, y: 0, scale: 1, rotationX: 0, 
              duration: this.animationQuality === 'high' ? 0.8 : 0.6,
              stagger: 0.08, ease: "back.out(1.4)",
              scrollTrigger: { trigger: '.focus-grid', start: "top 88%", toggleActions: "play none none reverse" }
            }
        );
    }
    
    initTeamAutoScroll() {
        const teamGrid = document.querySelector('#team-grid.team-flex-container');
        const teamScrollerWrapper = document.querySelector('.team-scroller-wrapper');

        if (!teamGrid || !teamScrollerWrapper || teamGrid.children.length === 0 || !teamGrid.children[0].classList.contains('team-card')) {
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
            gsap.set(teamGrid, { justifyContent: 'center', width: '100%' });
            this.animateInTeamCards(); 
            return;
        }
        gsap.set(teamGrid, { justifyContent: 'flex-start', width: 'max-content' });

        if (config.enableAutoScroll) {
            const fragment = document.createDocumentFragment();
            originalCards.forEach(card => {
                const clone = card.cloneNode(true);
                clone.classList.add('team-card-clone');
                fragment.appendChild(clone);
            });
            teamGrid.appendChild(fragment);
        }

        if (this.isMobile && config.enableTouchScroll) {
            this.teamDraggable = Draggable.create(teamGrid, {
                type: "x", edgeResistance: 0.65, bounds: teamScrollerWrapper, inertia: true,
                snap: config.snapToCards ? { x: endValue => Math.round(endValue / (cardWidth + gap)) * (cardWidth + gap) } : false,
                onDragStart: () => {
                    if (this.teamScrollTween && config.pauseOnInteraction) this.teamScrollTween.pause();
                    clearTimeout(this.teamInteractionTimeout);
                },
                onDragEnd: () => {
                    if (config.enableAutoScroll && this.teamScrollTween) {
                        const currentX = gsap.getProperty(teamGrid, "x");
                        const newDistance = oneSetWidth + gap;
                        const newDuration = newDistance / (config.scrollSpeed * this.tapSpeedMultiplier);
                        this.teamScrollTween.kill();
                        this.teamScrollTween = gsap.to(teamGrid, {
                            x: `-=${newDistance}`, duration: newDuration, ease: "none", repeat: -1,
                            modifiers: { x: gsap.utils.unitize(x => parseFloat(x) % newDistance) },
                            onUpdate: () => this.updateMobileScrollIndicators(teamGrid, originalCards.length)
                        });
                        this.teamScrollTween.seek(Math.abs(currentX / newDistance) * newDuration).play();
                    }
                    this.updateMobileScrollIndicators(teamGrid, originalCards.length);
                },
                onDrag: () => this.updateMobileScrollIndicators(teamGrid, originalCards.length)
            })[0];
        } else if (this.isMobile) {
            teamGrid.style.overflowX = 'auto';
            teamGrid.addEventListener('scroll', () => {
                if (this.teamScrollTween && config.pauseOnInteraction) this.teamScrollTween.pause();
                clearTimeout(this.teamInteractionTimeout);
                this.teamInteractionTimeout = setTimeout(() => {
                    this.updateMobileScrollIndicators(teamGrid, originalCards.length);
                    if (this.teamScrollTween && config.enableAutoScroll) this.teamScrollTween.play();
                }, config.autoResumeDelay);
            });
        }

        if (config.enableAutoScroll) {
            const scrollDistance = oneSetWidth + gap;
            this.teamScrollTween = gsap.to(teamGrid, {
                x: `-=${scrollDistance}`, duration: scrollDistance / (config.scrollSpeed * this.tapSpeedMultiplier),
                ease: "none", repeat: -1,
                modifiers: { x: gsap.utils.unitize(x => parseFloat(x) % scrollDistance) },
                onUpdate: this.isMobile ? () => this.updateMobileScrollIndicators(teamGrid, originalCards.length) : null,
                paused: this.isMobile && config.enableTouchScroll // Start paused if draggable exists
            });

            if (config.pauseOnInteraction && !this.isMobile) {
                teamScrollerWrapper.addEventListener('mouseenter', () => this.teamScrollTween && this.teamScrollTween.pause());
                teamScrollerWrapper.addEventListener('mouseleave', () => this.teamScrollTween && this.teamScrollTween.play());
            }
            
            if (this.isMobile) {
                let tapResetTimeout;
                teamScrollerWrapper.addEventListener('pointerdown', (e) => {
                    if (e.target.closest('.team-card') || e.target.closest('.scroll-indicator-dot')) return; // Don't interfere with card/dot clicks
                    
                    const now = Date.now();
                    if (now - this.lastTapTime < 300) return; // Debounce
                    this.lastTapTime = now;

                    if (this.teamScrollTween) {
                         if(this.teamScrollTween.paused()) this.teamScrollTween.play();

                        if (this.tapSpeedMultiplier < this.maxSpeedMultiplier) {
                            this.tapSpeedMultiplier += 0.2;
                        } else {
                            this.tapSpeedMultiplier = 1; // Cycle back
                        }
                        this.teamScrollTween.duration(scrollDistance / (config.scrollSpeed * this.tapSpeedMultiplier));
                    }
                    clearTimeout(tapResetTimeout);
                    tapResetTimeout = setTimeout(() => {
                        this.tapSpeedMultiplier = 1;
                        if (this.teamScrollTween) this.teamScrollTween.duration(scrollDistance / config.scrollSpeed);
                    }, 8000);
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
        this.animateInTeamCards();
    }

    setupMobileTapToEnlarge(cards, config) {
        cards.forEach((card) => {
            let isEnlarged = false;
            let tapTimeout;
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
            dot.dataset.index = i; // Store index for click handling
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
        if (!this.isMobile || numOriginalCards === 0 || !teamGrid.parentElement) return;
        const indicatorContainer = teamGrid.parentElement.querySelector('.team-scroll-indicators');
        if (!indicatorContainer || indicatorContainer.children.length === 0) return; // Ensure dots are present

        let currentScrollX;
        if (this.teamDraggable && typeof this.teamDraggable.x !== 'undefined') {
            currentScrollX = -this.teamDraggable.x;
        } else {
            currentScrollX = teamGrid.scrollLeft;
        }
        
        const cardWidth = teamGrid.children[0]?.offsetWidth || 280;
        const gap = parseFloat(getComputedStyle(teamGrid).gap) || 25;
        const cardWidthPlusGap = cardWidth + gap;
        
        if (cardWidthPlusGap === 0) return;

        let activeIndexFloat = currentScrollX / cardWidthPlusGap;
        
        if ((this.teamDraggable || this.teamScrollTween) && this.getCurrentTeamConfig().enableAutoScroll && teamGrid.children.length > numOriginalCards) { 
             activeIndexFloat = (currentScrollX % (cardWidthPlusGap * numOriginalCards)) / cardWidthPlusGap;
             if (activeIndexFloat < 0) activeIndexFloat += numOriginalCards;
        }

        this.activeCardIndex = Math.round(activeIndexFloat) % numOriginalCards;
        if (this.activeCardIndex < 0) this.activeCardIndex += numOriginalCards;

        Array.from(indicatorContainer.children).forEach((dot, index) => {
            dot.classList.toggle('active', index === this.activeCardIndex);
        });
    }

    initGenericCardAnimations() {
        const genericCards = gsap.utils.toArray('.card-style:not(.team-card):not(.focus-item):not(.timeline-content)');
        genericCards.forEach((card) => {
             gsap.fromTo(card,
                { opacity: 0, y: 40, scale:0.95, filter: this.animationQuality !== 'high' ? 'none' : 'blur(1px)' },
                {
                    opacity: 1, y: 0, scale:1, filter: 'blur(0px)',
                    duration: this.animationQuality === 'high' ? 0.7 : 0.5, 
                    ease: "power2.out",
                    scrollTrigger: { trigger: card, start: "top 88%", toggleActions: "play none none reverse" }
                }
            );
        });
    }

    animateInTeamCards() {
        const cards = gsap.utils.toArray('.team-card');
        if (cards.length === 0) return;
        const triggerElement = cards[0].closest('.team-scroller-wrapper') || cards[0].closest('#our-team') || document.querySelector('#our-team');
        if (!triggerElement) return;

        gsap.fromTo(cards,
            { opacity: 0, scale: 0.85, y: 40, rotationY: this.animationQuality === 'high' ? 8 : 0 },
            {
                opacity: 1, scale: 1, y: 0, rotationY: 0,
                duration: this.animationQuality === 'high' ? 0.7 : 0.5,
                stagger: 0.08, ease: "back.out(1.4)",
                scrollTrigger: {
                    trigger: triggerElement, start: "top 85%",
                    toggleActions: "play none none none", // Play once
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
            if (st.vars.trigger && (
                (typeof st.vars.trigger === 'string' && st.vars.trigger.includes('team')) ||
                (st.vars.trigger.id && (st.vars.trigger.id === 'team-grid' || st.vars.trigger.id === 'our-team')) ||
                (st.vars.trigger.classList && st.vars.trigger.classList.contains('team-scroller-wrapper'))
            )) {
                st.kill();
            }
        });

        const teamGrid = document.querySelector('#team-grid.team-flex-container');
        if (teamGrid) {
            const clones = teamGrid.querySelectorAll('.team-card-clone');
            clones.forEach(clone => clone.remove());
            gsap.set(teamGrid, {x: 0, clearProps: 'all'}); // Reset position and other GSAP props
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