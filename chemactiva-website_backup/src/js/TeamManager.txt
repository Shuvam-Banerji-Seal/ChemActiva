// src/js/TeamManager.js
import { gsap } from 'gsap';

export default class TeamManager {
    constructor(gridSelector, jsonlPath) {
        this.gridElement = document.querySelector(gridSelector);
        this.jsonlPath = jsonlPath;
        this.scrollAnimator = null;
        this.hasLoaded = false; // Flag to prevent double loading

        if (!this.gridElement) {
            console.error("Team grid element not found:", gridSelector);
        }
    }

    setScrollAnimator(scrollAnimatorInstance) {
        this.scrollAnimator = scrollAnimatorInstance;
    }

    async fetchTeamData() {
        // ... (no change from your TeamManager.txt) ...
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
                    return null; // Skip invalid lines
                }
            }).filter(item => item !== null); // Filter out nulls from parse errors
        } catch (error) {
            console.error("Failed to fetch or parse team data:", error);
            if(this.gridElement) this.gridElement.innerHTML = '<p>Error loading team members.</p>';
            return [];
        }
    }

    createTeamCard(member) {
        // ... (no change from your TeamManager.txt for card structure) ...
        // Ensure CSS classes match for styling (.team-card, .team-member-photo etc.)
        const card = document.createElement('div');
        card.className = 'team-card card-style'; // Added card-style for global styling
        card.dataset.memberId = member.id;
        const imageSrc = member.image || '/assets/images/team/default-avatar.png'; // Ensure default avatar exists

        // Manually create elements for better control and event handling if needed
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = member.name;
        img.className = 'team-member-photo';

        const nameH3 = document.createElement('h3');
        nameH3.textContent = member.name;

        const positionP = document.createElement('p');
        positionP.className = 'position';
        positionP.textContent = member.position;
        
        // Add bio and responsibilities if they exist in your JSONL data
        let bioP = '';
        if (member.bio) {
            bioP = `<p class="bio">${member.bio}</p>`;
        }
        let respTitle = '';
        let respP = '';
        if (member.responsibilities) {
            respTitle = `<h4>Responsibilities:</h4>`;
            respP = `<p class="responsibilities">${member.responsibilities}</p>`;
        }

        const contactLink = document.createElement('a');
        contactLink.href = `mailto:${member.contact}`;
        contactLink.className = 'contact-link';
        contactLink.textContent = member.contact;

        card.appendChild(img);
        card.appendChild(nameH3);
        card.appendChild(positionP);
        card.innerHTML += bioP + respTitle + respP; // Append as HTML string for simplicity
        card.appendChild(contactLink);


        // Hover animations (can be enhanced with GSAP for 3D tilt if perspective is set on parent)
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
        
        card.addEventListener('click', () => {
            console.log(`Clicked on ${member.name}.`);
        });
        return card;
    }

    async loadAndDisplayTeam() {
        if (this.hasLoaded || !this.gridElement) { // Prevent double load
            console.log('[TeamManager] Already loaded or grid not found. Skipping.');
            return;
        }
        console.log('[TeamManager] Loading team data...');

        const teamMembers = await this.fetchTeamData();
        
        // Use actual PDF team members
        const pdfTeam = [
            {"id": "gk", "name": "Dr. Goutam Kulsi", "position": "Founding Director & CEO", "bio": "Visionary scientist and entrepreneur with a Ph.D. from CSIR-IICB and postdoctoral fellowship at Seoul National University. Over five years in chemical/pharmaceutical industries.", "responsibilities": "Leads strategic research, mentors teams, steers company mission for innovative solutions.", "contact": "goutam.kulsi@chemactiva.example.org", "image": "/assets/images/team/goutam-kulsi.jpg"},
            {"id": "sh", "name": "Dr. Soumitra Hazra", "position": "Scientific Manager", "bio": "Accomplished scientist with a Ph.D. from CSIR-IICB and postdoctoral research at FIBER, Japan. Over three years of industry experience.", "responsibilities": "Leads scientific initiatives, oversees R&D projects in chemical/pharmaceutical sectors.", "contact": "soumitra.hazra@chemactiva.example.org", "image": "/assets/images/team/soumitra-hazra.jpg"},
            {"id": "rm", "name": "Mr. Rahul Mandal", "position": "Research Assistant", "bio": "Holds an M.Tech from Maulana Abul Kalam Azad University of Technology (MAKAUT).", "responsibilities": "Passionate about scientific research and innovation in chemical and material sciences.", "contact": "rahul.mandal@chemactiva.example.org", "image": "/assets/images/team/rahul-mandal.jpg"}
        ];
        // For now, we'll use the PDF team directly. You can merge/replace with JSONL later.
        // const displayMembers = teamMembers.length > 0 ? teamMembers : pdfTeam;
        // const displayMembers = pdfTeam; // Forcing PDF team for now
        const displayMembers = teamMembers;

        if (displayMembers.length === 0) {
             this.gridElement.innerHTML = '<p>No team members to display.</p>';
             this.hasLoaded = true; // Mark as loaded even if empty
             return;
        }

        this.gridElement.innerHTML = ''; // Clear current content
        displayMembers.forEach(member => {
            const card = this.createTeamCard(member);
            this.gridElement.appendChild(card);
        });

        this.hasLoaded = true; // Set flag after loading
        console.log('[TeamManager] Team displayed.');

        // Card entrance animation (can be handled by ScrollTrigger for horizontal scroll if complex)
        if (this.scrollAnimator && typeof this.scrollAnimator.animateInTeamCards === 'function') {
            this.scrollAnimator.animateInTeamCards(); // This needs to work with horizontal scroll
        } else { 
            gsap.from(".team-card", {
                opacity: 0, y: 30, duration: 0.5, stagger: 0.1, ease: 'power2.out'
            });
        }
    }
}