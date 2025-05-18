// src/js/JourneyManager.js
// import { gsap } from 'gsap'; // Not strictly needed here if animations are handled by ScrollAnimations

export default class JourneyManager {
    constructor(timelineSelector, jsonlPath) {
        this.timelineElement = document.querySelector(timelineSelector);
        this.jsonlPath = jsonlPath;
        this.hasLoaded = false;
        
        if (!this.timelineElement) {
            console.error("Journey timeline element not found:", timelineSelector);
        }
    }

    async fetchJourneyData() {
        try {
            const response = await fetch(this.jsonlPath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            return text.trim().split('\n').map(line => {
                try { return JSON.parse(line); }
                catch (e) { console.error('Error parsing journey JSON line:', line, e); return null; }
            }).filter(item => item !== null);
        } catch (error) {
            console.error("Failed to fetch or parse journey data:", error);
            if (this.timelineElement) this.timelineElement.innerHTML = '<p>Error loading journey information.</p>';
            return [];
        }
    }

    createTimelineItem(itemData) { // index parameter removed as it's not used for styling here
        const itemDiv = document.createElement('div');
        itemDiv.className = 'timeline-item';
        // nth-child odd/even for alignment will be handled by CSS based on DOM order

        const dateDiv = document.createElement('div');
        dateDiv.className = 'timeline-date';
        dateDiv.innerHTML = itemData.date; // Use innerHTML because of <sup>

        const contentDiv = document.createElement('div');
        contentDiv.className = 'timeline-content card-style';
        
        const eventH4 = document.createElement('h4');
        eventH4.textContent = itemData.event;
        contentDiv.appendChild(eventH4);

        if (itemData.details) {
            const detailsP = document.createElement('p');
            detailsP.textContent = itemData.details;
            contentDiv.appendChild(detailsP);
        }

        itemDiv.appendChild(dateDiv);
        itemDiv.appendChild(contentDiv);
        return itemDiv;
    }

    async loadAndDisplayJourney() {
        if (this.hasLoaded || !this.timelineElement) {
            // console.log('[JourneyManager] Already loaded or timeline element not found.');
            return;
        }
        // console.log('[JourneyManager] Loading journey data...');

        const journeyData = await this.fetchJourneyData();

        if (journeyData.length === 0) {
            if (this.timelineElement) this.timelineElement.innerHTML = '<p>No journey milestones to display.</p>';
            this.hasLoaded = true; // Still mark as loaded
            return;
        }

        this.timelineElement.innerHTML = ''; // Clear placeholders
        journeyData.forEach((item) => { // Index removed from forEach as createTimelineItem doesn't use it
            const timelineItemElement = this.createTimelineItem(item);
            this.timelineElement.appendChild(timelineItemElement);
        });

        this.hasLoaded = true;
        // console.log('[JourneyManager] Journey timeline displayed.');
    }
}