// src/js/App.js
import HeroLoader from './HeroLoader';
import SceneManager from './SceneManager';
import ScrollAnimations from './ScrollAnimations';
import TeamManager from './TeamManager';
import UIAnimations from './UIAnimations';

export default class App {
    constructor() {
        this.heroLoader = new HeroLoader('#hero-loader');
        
        // Pass the container for the main 3D scene
        this.sceneManager = new SceneManager('#hero-3d-scene-container'); 
        
        this.scrollAnimations = new ScrollAnimations();
        this.teamManager = new TeamManager('#team-grid', '/team.jsonl');
        this.uiAnimations = new UIAnimations();
    }

    async init() {
         console.log('[App] init called.'); // << NEW
        // Start hero loader animation
        // It will resolve when it's done, then we show main content
        try {
            console.log('[App] Awaiting heroLoader.start()...'); // << NEW
            await this.heroLoader.start(); 
            console.log('[App] heroLoader.start() RESOLVED.');
          
            this.showMainContent();
        } catch (error) {
            console.error("Hero loader failed, showing main content directly.", error);
            console.log("[App] Showing main content as fallback due to loader error."); // << 
            console.error("[App] Error during heroLoader.start() or it was REJECTED:", error); // << MODIFIED
            this.showMainContent(); // Fallback
        }
    }

    showMainContent() {
        const mainContainer = document.getElementById('main-container');
        if (mainContainer) {
            mainContainer.style.display = 'block';
              this.uiAnimations.initThemeToggle();
            // Initialize other components after main content is visible
            requestAnimationFrame(() => { // Ensure DOM is ready for these inits
                this.sceneManager.initMainScene();
                this.scrollAnimations.init();
                this.teamManager.loadAndDisplayTeam();
                this.uiAnimations.init();
                document.getElementById('current-year').textContent = new Date().getFullYear();
            });
        }
    }

    // src/js/App.js (snippet)
// ...
    async init() {
        try {
            await this.heroLoader.start();
            this.showMainContent();
        } catch (error) {
            console.error("Hero loader failed, showing main content directly.", error);
            this.showMainContent();
        }
    }

    showMainContent() {
        const mainContainer = document.getElementById('main-container');
        if (mainContainer) {
            mainContainer.style.display = 'block';
            requestAnimationFrame(async () => { // Make it async for team data
                this.sceneManager.initMainScene();
                // Pass sceneManager to scrollAnimations if it directly manipulates Three.js lights/camera
                this.scrollAnimations.init(this.sceneManager); 
                
                // Make teamManager.loadAndDisplayTeam() call scrollAnimations.animateInTeamCards()
                // A bit of coupling, but effective. Or use custom events.
                // window.scrollAnimations = this.scrollAnimations; // Make it globally accessible (less ideal)
                // Better: TeamManager can take scrollAnimations as a dependency or scrollAnimations can listen for an event.
                // For now, let's modify TeamManager to accept scrollAnimations instance.
                this.teamManager.setScrollAnimator(this.scrollAnimations); // Add this method to TeamManager
                await this.teamManager.loadAndDisplayTeam(); // Make sure this completes before certain scroll anims expect cards

                this.uiAnimations.init();
                document.getElementById('current-year').textContent = new Date().getFullYear();
            });
        }
    }
// ...
}