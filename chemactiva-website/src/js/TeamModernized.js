/**
 * TeamModernized - Enhanced functionality for the modernized team section
 * Provides interactive features, animations, and enhanced user experience
 */
class TeamModernized {
    constructor() {
        this.isInitialized = false;
        this.teamData = [];
        this.currentIndex = 0;
        this.animationObserver = null;
        this.teamCards = [];
        this.statsAnimated = false;
        
        // Navigation elements
        this.prevBtn = null;
        this.nextBtn = null;
        this.dotsContainer = null;
        this.teamGrid = null;
        
        // Bind methods
        this.handleNavigation = this.handleNavigation.bind(this);
        this.handleDotClick = this.handleDotClick.bind(this);
        this.handleIntersection = this.handleIntersection.bind(this);
        this.animateStats = this.animateStats.bind(this);
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('[TeamModernized] Initializing modernized team section');
        
        try {
            await this.loadTeamData();
            this.setupElements();
            this.renderTeamCards();
            this.setupEventListeners();
            this.setupIntersectionObserver();
            this.setupAnimations();
            
            this.isInitialized = true;
            console.log('[TeamModernized] Initialization complete');
            
        } catch (error) {
            console.error('[TeamModernized] Initialization failed:', error);
            this.showErrorState();
        }
    }

    async loadTeamData() {
        try {
            console.log('[TeamModernized] Loading team data...');
            const response = await fetch('/team.jsonl');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            this.teamData = text.trim().split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line));
            
            console.log(`[TeamModernized] Loaded ${this.teamData.length} team members`);
            
        } catch (error) {
            console.error('[TeamModernized] Failed to load team data:', error);
            // Use fallback data if loading fails
            this.teamData = this.getFallbackTeamData();
        }
    }

    getFallbackTeamData() {
        return [
            {
                id: "goutam-kulsi",
                name: "Dr. Goutam Kulsi",
                position: "Founding Director & CEO",
                image: "/assets/images/team/goutam-kulsi.jpg",
                bio: "A visionary scientist and entrepreneur with a Ph.D. from CSIR-IICB, Kolkata, and a postdoctoral fellowship from Seoul National University. He steers our mission to deliver innovative, science-based solutions.",
                responsibilities: "Leads strategic research, mentors scientific teams, and combines scientific depth with entrepreneurial insight.",
                contact: ""
            },
            {
                id: "soumitra-hazra",
                name: "Dr. Soumitra Hazra",
                position: "Scientific Manager",
                image: "",
                bio: "An accomplished professional with a Ph.D. from CSIR-IICB, Kolkata, and postdoctoral research at FIBER, Japan. He brings a unique blend of academic rigor and practical industry knowledge.",
                responsibilities: "Leads scientific initiatives, oversees R&D projects, and contributes to applied science and product development.",
                contact: ""
            },
            {
                id: "rahul-mandal",
                name: "Mr. Rahul Mandal",
                position: "Research Assistant",
                image: "",
                bio: "Holds a Master of Technology (M.Tech) from MAKAUT. Passionate about scientific research and innovation in the field of chemical and material sciences.",
                responsibilities: "Assists in key research activities and contributes to the development of our core technologies.",
                contact: ""
            }
        ];
    }

    setupElements() {
        this.teamGrid = document.getElementById('team-grid-modern');
        this.prevBtn = document.querySelector('.team-nav-prev');
        this.nextBtn = document.querySelector('.team-nav-next');
        this.dotsContainer = document.getElementById('team-nav-dots');
        this.statsSection = document.querySelector('.team-stats-inline');
        this.valuesSection = document.querySelector('.team-values');
        
        console.log(`[TeamModernized] Elements setup complete`);
    }

    renderTeamCards() {
        if (!this.teamGrid || !this.teamData.length) return;

        // Clear existing content
        this.teamGrid.innerHTML = '';

        // Create team cards
        this.teamData.forEach((member, index) => {
            const card = this.createTeamCard(member, index);
            this.teamGrid.appendChild(card);
        });

        // Create navigation dots
        this.createNavigationDots();

        // Update navigation state
        this.updateNavigationState();

        console.log(`[TeamModernized] Rendered ${this.teamData.length} team cards`);
    }

    createTeamCard(member, index) {
        const card = document.createElement('div');
        card.className = 'team-card-modern';
        card.setAttribute('data-index', index);
        
        // Create photo element
        const photoElement = member.image ? 
            `<img src="${member.image}" alt="${member.name}" class="team-member-photo-modern" loading="lazy">` :
            `<div class="photo-placeholder">${this.getInitials(member.name)}</div>`;

        card.innerHTML = `
            <div class="team-member-photo-container">
                ${photoElement}
            </div>
            <div class="team-member-info">
                <h3>${member.name}</h3>
                <p class="team-member-position">${member.position}</p>
                <p class="team-member-bio">${member.bio}</p>
                <div class="team-member-responsibilities">${member.responsibilities}</div>
                ${member.contact ? `
                    <div class="team-member-contact">
                        <a href="mailto:${member.contact}" class="contact-link">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Contact
                        </a>
                    </div>
                ` : ''}
            </div>
        `;

        // Add click handler for card interaction
        card.addEventListener('click', (e) => this.handleCardClick(e, member, index));

        return card;
    }

    getInitials(name) {
        return name.split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    createNavigationDots() {
        if (!this.dotsContainer) return;

        this.dotsContainer.innerHTML = '';
        
        this.teamData.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.className = `nav-dot ${index === this.currentIndex ? 'active' : ''}`;
            dot.setAttribute('data-index', index);
            dot.addEventListener('click', () => this.handleDotClick(index));
            this.dotsContainer.appendChild(dot);
        });
    }

    setupEventListeners() {
        // Navigation buttons
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.handleNavigation('prev'));
        }
        
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.handleNavigation('next'));
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.handleNavigation('prev');
            } else if (e.key === 'ArrowRight') {
                this.handleNavigation('next');
            }
        });

        // Touch/swipe support for mobile
        this.setupTouchNavigation();

        console.log('[TeamModernized] Event listeners setup complete');
    }

    setupTouchNavigation() {
        if (!this.teamGrid) return;

        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        this.teamGrid.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        this.teamGrid.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;

            const deltaX = endX - startX;
            const deltaY = endY - startY;

            // Only handle horizontal swipes
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                if (deltaX > 0) {
                    this.handleNavigation('prev');
                } else {
                    this.handleNavigation('next');
                }
            }
        });
    }

    setupIntersectionObserver() {
        const options = {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        };

        this.animationObserver = new IntersectionObserver(this.handleIntersection, options);

        // Observe elements for animation
        const elementsToObserve = [
            document.querySelector('.team-intro-banner'),
            this.teamGrid,
            this.statsSection,
            this.valuesSection
        ].filter(Boolean);

        elementsToObserve.forEach(element => {
            this.animationObserver.observe(element);
        });

        console.log('[TeamModernized] Intersection observer setup complete');
    }

    setupAnimations() {
        // Add initial animation states
        const teamCards = document.querySelectorAll('.team-card-modern');
        teamCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        });

        if (this.valuesSection) {
            this.valuesSection.style.opacity = '0';
            this.valuesSection.style.transform = 'translateY(20px)';
            this.valuesSection.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        }

        console.log('[TeamModernized] Animation setup complete');
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                
                if (element.classList.contains('team-intro-banner')) {
                    this.animateIntroBanner();
                } else if (element.id === 'team-grid-modern') {
                    this.animateTeamCards();
                } else if (element.classList.contains('team-stats-inline')) {
                    this.animateStats();
                } else if (element.classList.contains('team-values')) {
                    this.animateValues();
                }
                
                // Stop observing once animated
                this.animationObserver.unobserve(element);
            }
        });
    }

    animateIntroBanner() {
        const banner = document.querySelector('.team-intro-banner');
        const statsInline = document.querySelectorAll('.inline-stat');
        
        if (banner) {
            banner.style.opacity = '0';
            banner.style.transform = 'translateY(20px)';
            banner.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            
            setTimeout(() => {
                banner.style.opacity = '1';
                banner.style.transform = 'translateY(0)';
            }, 100);
        }

        // Animate inline stats with stagger
        statsInline.forEach((stat, index) => {
            stat.style.opacity = '0';
            stat.style.transform = 'translateY(20px)';
            stat.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            
            setTimeout(() => {
                stat.style.opacity = '1';
                stat.style.transform = 'translateY(0)';
            }, 600 + (index * 100));
        });
    }

    animateTeamCards() {
        const teamCards = document.querySelectorAll('.team-card-modern');
        
        teamCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }

    animateStats() {
        if (this.statsAnimated) return;
        this.statsAnimated = true;

        const statNumbers = document.querySelectorAll('.inline-stat .stat-number');
        statNumbers.forEach((statNumber, index) => {
            const finalText = statNumber.textContent;
            
            // Only animate numeric stats
            if (finalText.includes('+')) {
                const number = parseInt(finalText);
                this.countUp(statNumber, 0, number, 1000, '+');
            }
        });
    }

    animateValues() {
        const valueItems = document.querySelectorAll('.value-item');
        
        valueItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px)';
            item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });

        if (this.valuesSection) {
            setTimeout(() => {
                this.valuesSection.style.opacity = '1';
                this.valuesSection.style.transform = 'translateY(0)';
            }, 200);
        }
    }

    countUp(element, start, end, duration, suffix = '') {
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (end - start) * easeOut);
            
            element.textContent = current + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    handleNavigation(direction) {
        const totalCards = this.teamData.length;
        
        if (direction === 'prev') {
            this.currentIndex = (this.currentIndex - 1 + totalCards) % totalCards;
        } else {
            this.currentIndex = (this.currentIndex + 1) % totalCards;
        }
        
        this.updateNavigationState();
        this.scrollToCard(this.currentIndex);
        
        console.log(`[TeamModernized] Navigated ${direction} to index ${this.currentIndex}`);
    }

    handleDotClick(index) {
        this.currentIndex = index;
        this.updateNavigationState();
        this.scrollToCard(index);
        
        console.log(`[TeamModernized] Dot clicked, navigated to index ${index}`);
    }

    handleCardClick(event, member, index) {
        // Prevent navigation if clicking on contact link
        if (event.target.closest('.contact-link')) {
            return;
        }
        
        console.log(`[TeamModernized] Card clicked: ${member.name}`);
        
        // Add click animation
        const card = event.currentTarget;
        card.style.transform = 'translateY(-8px) scale(0.98)';
        
        setTimeout(() => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
        }, 150);

        // Could expand to show modal or detailed view
        this.showMemberDetails(member);
    }

    showMemberDetails(member) {
        // Create a simple notification or could be expanded to modal
        const notification = document.createElement('div');
        notification.className = 'member-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h4>${member.name}</h4>
                <p>${member.position}</p>
                <button class="close-notification">×</button>
            </div>
        `;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'var(--color-accent-primary)',
            color: 'white',
            padding: '1rem',
            borderRadius: '12px',
            zIndex: '1000',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            maxWidth: '300px',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)'
        });

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });

        // Close button handler
        const closeBtn = notification.querySelector('.close-notification');
        closeBtn.addEventListener('click', () => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });

        // Auto-remove after delay
        setTimeout(() => {
            if (notification.parentNode) {
                closeBtn.click();
            }
        }, 3000);
    }

    updateNavigationState() {
        // Update dots
        const dots = document.querySelectorAll('.nav-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });

        // Update button states (could disable at ends if not infinite)
        // For now, keeping infinite navigation
        if (this.prevBtn) {
            this.prevBtn.disabled = false;
        }
        if (this.nextBtn) {
            this.nextBtn.disabled = false;
        }
    }

    scrollToCard(index) {
        const card = document.querySelector(`[data-index="${index}"]`);
        if (card) {
            card.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }

    showErrorState() {
        if (this.teamGrid) {
            this.teamGrid.innerHTML = `
                <div class="team-error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Unable to load team information</h3>
                    <p>Please try refreshing the page or contact support if the problem persists.</p>
                    <button class="retry-button" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }

    // Public API methods
    refresh() {
        if (this.isInitialized) {
            this.destroy();
            this.init();
        }
    }

    destroy() {
        if (this.animationObserver) {
            this.animationObserver.disconnect();
            this.animationObserver = null;
        }

        // Remove event listeners
        if (this.prevBtn) {
            this.prevBtn.removeEventListener('click', this.handleNavigation);
        }
        if (this.nextBtn) {
            this.nextBtn.removeEventListener('click', this.handleNavigation);
        }

        document.removeEventListener('keydown', this.handleNavigation);

        this.isInitialized = false;
        console.log('[TeamModernized] Destroyed');
    }

    // Utility methods
    getCurrentMember() {
        return this.teamData[this.currentIndex];
    }

    getTotalMembers() {
        return this.teamData.length;
    }

    navigateToMember(memberId) {
        const index = this.teamData.findIndex(member => member.id === memberId);
        if (index !== -1) {
            this.currentIndex = index;
            this.updateNavigationState();
            this.scrollToCard(index);
        }
    }
}

export default TeamModernized;