// src/js/TeamManager.js
import { gsap } from 'gsap';

export default class TeamManager {
    constructor(gridSelector, jsonlPath) {
        this.gridElement = document.querySelector(gridSelector);
        this.jsonlPath = jsonlPath;
        this.scrollAnimator = null; // This can be used by ScrollAnimations if needed
        this.hasLoaded = false;

        if (!this.gridElement) {
            console.error("Team grid element not found:", gridSelector);
        }
    }

    setScrollAnimator(scrollAnimatorInstance) {
        this.scrollAnimator = scrollAnimatorInstance;
    }

    async fetchTeamData() {
        try {
            const response = await fetch(this.jsonlPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            return text.trim().split('\n').map(line => {
                try {
                    return JSON.parse(line);
                } catch (e) {
                    console.error('Error parsing JSON line:', line, e);
                    return null; 
                }
            }).filter(item => item !== null); 
        } catch (error) {
            console.error("Failed to fetch or parse team data:", error);
            if(this.gridElement) this.gridElement.innerHTML = '<p class="placeholder-text">Error loading team members.</p>';
            return [];
        }
    }

    createTeamCard(member) {
        const card = document.createElement('div');
        card.className = 'team-card card-style'; 
        card.dataset.memberId = member.id;
        
        // Use a default image path that exists in your public/assets/images/team/
        const imageSrc = member.image && member.image.trim() !== "" ? member.image : '/assets/images/team/default-avatar.png'; 

        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = member.name;
        img.className = 'team-member-photo';
        img.loading = 'lazy'; // Lazy load team member images

        const nameH3 = document.createElement('h3');
        nameH3.textContent = member.name;

        const positionP = document.createElement('p');
        positionP.className = 'position';
        positionP.textContent = member.position;
        
        card.appendChild(img);
        card.appendChild(nameH3);
        card.appendChild(positionP);

        if (member.bio) {
            const bioP = document.createElement('p');
            bioP.className = 'bio';
            bioP.textContent = member.bio;
            card.appendChild(bioP);
        }
        if (member.responsibilities) {
            // const respTitle = document.createElement('h4'); // Optional title for responsibilities
            // respTitle.textContent = "Responsibilities:";
            // card.appendChild(respTitle);
            const respP = document.createElement('p');
            respP.className = 'responsibilities';
            respP.textContent = member.responsibilities;
            card.appendChild(respP);
        }

        if (member.contact) {
            const contactLink = document.createElement('a');
            contactLink.href = `mailto:${member.contact}`;
            contactLink.className = 'contact-link';
            contactLink.textContent = member.contact;
            card.appendChild(contactLink);
        }

        // Hover animations (subtle scale)
        card.addEventListener('mouseenter', () => {
            gsap.to(card, { 
                scale: 1.03, 
                duration: 0.3, 
                ease: 'power1.out' 
            });
        });
        card.addEventListener('mouseleave', () => {
            gsap.to(card, { 
                scale: 1, 
                duration: 0.3, 
                ease: 'power1.out' 
            });
        });
        
        // card.addEventListener('click', () => {
        //     console.log(`Clicked on ${member.name}. Modal/details could open here.`);
        // });
        return card;
    }

    async loadAndDisplayTeam() {
        if (this.hasLoaded || !this.gridElement) { 
            // console.log('[TeamManager] Already loaded or grid not found. Skipping.');
            return;
        }
        // console.log('[TeamManager] Loading team data...');

        const teamMembers = await this.fetchTeamData();
        
        if (teamMembers.length === 0) {
             if(this.gridElement) this.gridElement.innerHTML = '<p class="placeholder-text">No team members to display currently.</p>';
             this.hasLoaded = true; 
             return;
        }

        this.gridElement.innerHTML = ''; // Clear current content (placeholder)
        const fragment = document.createDocumentFragment(); // Use fragment for performance
        teamMembers.forEach(member => {
            const card = this.createTeamCard(member);
            fragment.appendChild(card);
        });
        this.gridElement.appendChild(fragment);

        this.hasLoaded = true; 
        // console.log('[TeamManager] Team displayed.');

        // Animations for team cards are handled by ScrollAnimations.initTeamAutoScroll() or animateInTeamCards()
        // which is called from App.js after teamManager.loadAndDisplayTeam() completes.
    }
}