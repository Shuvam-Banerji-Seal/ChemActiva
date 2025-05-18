// src/js/App.js
import HeroLoader from './HeroLoader';
import SceneManager from './SceneManager';
import ScrollAnimations from './ScrollAnimations';
import TeamManager from './TeamManager';
import UIAnimations from './UIAnimations';
import JourneyManager from './JourneyManager'; // Add this

export default class App {
    constructor() {
        console.log('[App] Constructor');
        this.heroLoader = new HeroLoader('#hero-loader');
        this.sceneManager = new SceneManager('#hero-3d-scene-container'); 
        this.scrollAnimations = new ScrollAnimations();
        this.teamManager = new TeamManager('#team-grid', '/team.jsonl'); // Ensure team.jsonl is valid
        this.scrollAnimations.initTeamAutoScroll(); // Initialize auto-scroll for team section
        this.uiAnimations = new UIAnimations();
        this.journeyManager = new JourneyManager('.journey-timeline', '/journey.jsonl'); // Add this
    }

    async init() {
        console.log('[App] init called.');
        try {
            // Initialize theme as early as possible, before loader might need themed colors
            // UIAnimations constructor or a dedicated theme manager should handle initial theme setting from localStorage
            this.uiAnimations.initThemeToggle(); // Call it here to set up theme before loader starts

            console.log('[App] Awaiting heroLoader.start()...');
            await this.heroLoader.start(); 
            console.log('[App] heroLoader.start() RESOLVED.');
            this.showMainContent();
        } catch (error) {
            console.error("[App] Error during heroLoader.start() or it was REJECTED:", error);
            console.log("[App] Showing main content as fallback due to loader error.");
            // Ensure loader is hidden even on error
            const loaderElement = document.getElementById('hero-loader');
            if (loaderElement) loaderElement.style.display = 'none';
            this.showMainContent(); // Fallback
        }
    }

    showMainContent() {
        console.log('[App] showMainContent called.');
        const mainContainer = document.getElementById('main-container');
        if (mainContainer) {
            mainContainer.style.display = 'block';
            
            // UIAnimations init (which includes theme toggle listener) should be called once.
            // If initThemeToggle was called before loader, just regular init for other UI parts.
            // this.uiAnimations.init(); // Redundant if initThemeToggle is part of it and called above.
            // Let's ensure UIAnimations.init() is idempotent or called strategically.
            // For simplicity, let UIAnimations.init() handle all its parts.
            // We called initThemeToggle specifically early for loader theming.

            requestAnimationFrame(async () => {
                console.log('[App] rAF in showMainContent: Initializing core modules.');
                this.sceneManager.initMainScene();
                this.scrollAnimations.init(this.sceneManager); // Pass SceneManager for lighting scroll
                
                this.teamManager.setScrollAnimator(this.scrollAnimations);
                await this.journeyManager.loadAndDisplayJourney(); // Add this

                await this.teamManager.loadAndDisplayTeam();

                this.uiAnimations.init(); // This will re-run initNavbar, initContactForm. initThemeToggle will just re-add listener if not careful.
                                          // Make initThemeToggle idempotent or split its logic. For now, it's okay.

                const currentYearSpan = document.getElementById('current-year');
                this.scrollAnimations.init(this.sceneManager); // General scroll animations
                this.scrollAnimations.initTeamAutoScroll(); // SPECIFICALLY for team auto-scroll
                if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
                console.log('[App] Main content setup complete.');
            });
        } else {
            console.error('[App] Main container not found!');
        }
    }
}