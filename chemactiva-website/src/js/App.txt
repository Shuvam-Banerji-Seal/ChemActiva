// src/js/App.js
import HeroLoader from './HeroLoader.js';
import SceneManager from './SceneManager.js';
import ScrollAnimations from './ScrollAnimations.js';
import TeamManager from './TeamManager.js';
import UIAnimations from './UIAnimations.js';
import JourneyManager from './JourneyManager.js';

export default class App {
    constructor() {
        console.log('[App] Constructor starting. Current page:', window.location.pathname);
        this.uiAnimations = new UIAnimations();

        // Determine if this is the homepage by checking for a unique homepage element
        const heroElement = document.getElementById('homepage-hero');
        this.isHomepage = !!heroElement; // Convert to boolean

        if (this.isHomepage) {
            console.log('[App] Homepage detected (found #homepage-hero).');
            // Instantiate homepage-specific modules
            this.heroLoader = new HeroLoader('#hero-loader'); // Assumes #hero-loader exists on homepage
            this.sceneManager = new SceneManager('#hero-3d-scene-container'); // Assumes #hero-3d-scene-container exists
            this.teamManager = new TeamManager('#team-grid', '/team.jsonl'); // Assumes #team-grid exists
            this.journeyManager = new JourneyManager('.journey-timeline', '/journey.jsonl'); // Assumes .journey-timeline exists
        } else {
            console.log('[App] Subpage detected (did not find #homepage-hero).');
            this.heroLoader = null;
            this.sceneManager = null;
            this.teamManager = null;
            this.journeyManager = null;
        }

        this.scrollAnimations = new ScrollAnimations();
        console.log('[App] Constructor finished.');
    }

    async init() {
        console.log('[App] init() called. Is homepage:', this.isHomepage);
        
        // Initialize theme immediately, critical for styling loader background correctly too
        if (this.uiAnimations) {
            this.uiAnimations.initThemeToggle();
        } else {
            console.error("[App] uiAnimations not initialized in constructor!");
        }


        if (this.isHomepage && this.heroLoader) {
            console.log('[App] Homepage: Attempting to start hero loader...');
            try {
                await this.heroLoader.start();
                console.log('[App] Homepage: Hero loader finished successfully.');
                // heroLoader.start() should hide the loader itself upon completion
                this.showMainContent(); // showMainContent will make main-container visible
            } catch (error) {
                console.error("[App] Homepage: Error during heroLoader.start():", error);
                const loaderElement = document.getElementById('hero-loader');
                if (loaderElement) {
                    console.log('[App] Homepage: Hiding hero-loader due to error.');
                    loaderElement.style.display = 'none';
                }
                this.showMainContent(); // Still try to show main content
            }
        } else {
            // This block runs for sub-pages OR if heroLoader isn't used on homepage
            console.log('[App] Subpage or no heroLoader: Ensuring loader is hidden and main content is shown.');
            const loaderElement = document.getElementById('hero-loader');
            if (loaderElement) { // If loader DIV exists on a subpage by mistake, hide it
                console.log('[App] Hiding hero-loader (if present on subpage).');
                loaderElement.style.display = 'none';
            }
            
            // For sub-pages, #main-container should NOT have display:none in its HTML.
            // If it does (e.g., copied from index.html by mistake), this will show it.
            const mainContainer = document.getElementById('main-container');
            if (mainContainer && mainContainer.style.display === 'none') {
                console.warn('[App] #main-container was display:none on a page that should show content directly. Forcing display:block.');
                mainContainer.style.display = 'block';
            } else if (!mainContainer) {
                console.error("[App] CRITICAL: #main-container element not found on this page!");
                return; // Can't proceed without main container
            }
            this.showMainContent();
        }
    }

    showMainContent() {
        console.log('[App] showMainContent() called. Is homepage:', this.isHomepage);

        const mainContainer = document.getElementById('main-container');
        if (!mainContainer) {
            console.error("[App] CRITICAL (in showMainContent): #main-container not found!");
            return;
        }

        // This handles the specific case for index.html where main-container starts as display:none
        if (this.isHomepage && mainContainer.style.display === 'none') {
            console.log('[App] Homepage: Making #main-container visible.');
            mainContainer.style.display = 'block';
        }
        // For sub-pages, main-container should already be visible from HTML structure.
        // If it was `display:none` and caught in `init()`, it's already fixed.

        if (this.uiAnimations) {
            console.log('[App] Initializing full UIAnimations (navbar, contact, etc.)...');
            this.uiAnimations.init(); // Call full init for navbar listeners etc.
        } else {
            console.error("[App] uiAnimations not initialized, cannot call init() on it.");
        }

        requestAnimationFrame(async () => {
            console.log('[App] rAF callback in showMainContent executing.');
            if (this.isHomepage) {
                console.log('[App] Homepage: Initializing scene, journey, team...');
                if (this.sceneManager) this.sceneManager.initMainScene();
                
                if (this.journeyManager) {
                    await this.journeyManager.loadAndDisplayJourney();
                }
                if (this.teamManager) {
                    await this.teamManager.loadAndDisplayTeam();
                }
            }

            console.log('[App] Initializing ScrollAnimations...');
            this.scrollAnimations.init(this.sceneManager); // sceneManager will be null on subpages, ScrollAnimations should handle this
            
            if (this.isHomepage) {
                console.log('[App] Homepage: Triggering scroll animations for dynamic content...');
                if (this.journeyManager && this.journeyManager.hasLoaded) {
                    this.scrollAnimations.initJourneyTimelineAnimations();
                }
                if (this.teamManager && this.teamManager.hasLoaded) {
                    this.scrollAnimations.initTeamAutoScroll();
                } else if (this.teamManager) { 
                    this.scrollAnimations.animateInTeamCards();
                }
            }

            const currentYearSpan = document.getElementById('current-year');
            if (currentYearSpan && !currentYearSpan.textContent.trim()) { 
                 currentYearSpan.textContent = new Date().getFullYear();
            }
            console.log('[App] showMainContent() rAF callback finished.');
        });
        console.log('[App] showMainContent() finished.');
    }
}