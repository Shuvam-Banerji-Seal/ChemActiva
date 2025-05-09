// src/js/TeamManager.js
import { gsap } from 'gsap'; // For card animations on load/hover

export default class TeamManager {
    constructor(gridSelector, jsonlPath) {
        this.gridElement = document.querySelector(gridSelector);
        this.jsonlPath = jsonlPath;
        this.scrollAnimator = null; // Add this
        if (!this.gridElement) {
            console.error("Team grid element not found:", gridSelector);
        }
    }

    setScrollAnimator(scrollAnimatorInstance) { // Add this method
        this.scrollAnimator = scrollAnimatorInstance;
    }

    async fetchTeamData() {
        try {
            const response = await fetch(this.jsonlPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            // JSONL: each line is a JSON object. Split by newline, parse each.
            return text.trim().split('\n').map(line => JSON.parse(line));
        } catch (error) {
            console.error("Failed to fetch or parse team data:", error);
            this.gridElement.innerHTML = '<p>Error loading team members.</p>';
            return [];
        }
    }

    createTeamCard(member) {
        const card = document.createElement('div');
        card.className = 'team-card';
        // Data attributes for potential filtering or individual page links later
        card.dataset.memberId = member.id;

        // Use a placeholder if image path is invalid or missing
        const imageSrc = member.image || '/assets/images/team/default-avatar.png';

        card.innerHTML = `
            <img src="${imageSrc}" alt="${member.name}" class="team-member-photo">
            <h3>${member.name}</h3>
            <p class="position">${member.position}</p>
            <p class="bio">${member.bio}</p>
            <h4>Responsibilities:</h4>
            <p class="responsibilities">${member.responsibilities}</p>
            <a href="mailto:${member.contact}" class="contact-link">${member.contact}</a>
        `;

        // Add hover animations (tilt & zoom)
        // Can be done with CSS :hover for simple effects, or JS for more complex
        card.addEventListener('mouseenter', () => {
            gsap.to(card, { 
                scale: 1.05, 
                // y: -5, // Slight lift
                // rotationY: 5, // Slight tilt - requires perspective on parent
                boxShadow: "0px 10px 20px rgba(0, 75, 58, 0.15)", // Enhanced shadow
                duration: 0.3, 
                ease: 'power1.out' 
            });
        });
        card.addEventListener('mouseleave', () => {
            gsap.to(card, { 
                scale: 1, 
                // y: 0,
                // rotationY: 0,
                boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                duration: 0.3, 
                ease: 'power1.out' 
            });
        });
        
        // Click -> transitions to individual team profile pages (using page.js or a JS router)
        // For now, just a log. If using a router: router.navigate(`/team/${member.id}`);
        card.addEventListener('click', () => {
            console.log(`Clicked on ${member.name}. Implement profile page transition or modal.`);
            // Example: Show modal with more details
            // this.showProfileModal(member);
        });

        return card;
    }

    async loadAndDisplayTeam() {
        if (!this.gridElement) return;
        const teamMembers = await this.fetchTeamData();
        if (teamMembers.length === 0 && !this.gridElement.innerHTML.includes('Error')) {
             this.gridElement.innerHTML = '<p>No team members to display.</p>';
             return;
        }

        this.gridElement.innerHTML = ''; // Clear current content/placeholders
        teamMembers.forEach(member => {
            const card = this.createTeamCard(member);
            this.gridElement.appendChild(card);
        });

        // Initial load animation for cards (flip or fade in)
        // This could be delegated to ScrollAnimations.js if cards are below the fold
        // For now, a simple stagger animation on load.
        // Ensure this is called AFTER cards are in DOM.
        // We'll use ScrollTrigger for this, so let ScrollAnimations handle it.
        // The ScrollAnimations module should have a method to re-scan for new elements if needed.
        // For simplicity, if ScrollAnimations is initialized after App.js calls this, it should pick them up.
        // A better way is to explicitly call an animation function from ScrollAnimations.
        // if (window.scrollAnimations && typeof window.scrollAnimations.animateInTeamCards === 'function') {
        //     window.scrollAnimations.animateInTeamCards();
        teamMembers.forEach(member => {
        const card = this.createTeamCard(member);
        this.gridElement.appendChild(card);
        });

        // Now use the passed scrollAnimator instance
        if (this.scrollAnimator && typeof this.scrollAnimator.animateInTeamCards === 'function') {
            this.scrollAnimator.animateInTeamCards();
        } else { // Fallback simple animation if scrollAnimations module not ready or method unavailable
            gsap.from(".team-card", {
                opacity: 0,
                y: 30,
                duration: 0.5,
                stagger: 0.1,
                ease: 'power2.out'
            });
        }
    }


}