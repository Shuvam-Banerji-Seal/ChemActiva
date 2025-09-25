/**
 * AdvisorsModernized - Enhanced functionality for the modernized advisors section
 * Provides interactive features, animations, and enhanced user experience
 */
class AdvisorsModernized {
    constructor() {
        this.isInitialized = false;
        this.animationObserver = null;
        this.advisorCards = [];
        this.advisorData = [];
        this.statsAnimated = false;
        
        // Bind methods
        this.handleCardClick = this.handleCardClick.bind(this);
        this.handleExpertiseTagClick = this.handleExpertiseTagClick.bind(this);
        this.animateStats = this.animateStats.bind(this);
        this.handleIntersection = this.handleIntersection.bind(this);
    }

    async init() {
        if (this.isInitialized) return;
        
        console.log('[AdvisorsModernized] Initializing modernized advisors section');
        
        try {
            await this.loadAdvisorData();
            this.setupElements();
            this.renderAdvisorCards();
            this.setupEventListeners();
            this.setupIntersectionObserver();
            this.setupAnimations();
            
            this.isInitialized = true;
            console.log('[AdvisorsModernized] Initialization complete');
            
        } catch (error) {
            console.error('[AdvisorsModernized] Initialization failed:', error);
        }
    }

    async loadAdvisorData() {
        try {
            console.log('[AdvisorsModernized] Loading advisor data...');
            const response = await fetch('/team.jsonl');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const text = await response.text();
            const allData = text.trim().split('\n')
                .filter(line => line.trim())
                .map(line => JSON.parse(line));
            
            // Filter to get only advisors
            this.advisorData = allData.filter(member => member.position === 'Advisor');
            
            console.log(`[AdvisorsModernized] Loaded ${this.advisorData.length} advisors`);
            
        } catch (error) {
            console.error('[AdvisorsModernized] Failed to load advisor data:', error);
            this.advisorData = [];
        }
    }

    setupElements() {
        // Get container elements
        this.advisorGrid = document.querySelector('.advisors-grid-modern');
        this.statsSection = document.querySelector('.advisors-stats-inline');
        this.impactSection = document.querySelector('.advisors-impact');
        this.introBanner = document.querySelector('.advisors-intro-banner');
        this.expertiseTags = document.querySelectorAll('.expertise-tag');
        
        console.log(`[AdvisorsModernized] Found advisor grid container`);
    }

    renderAdvisorCards() {
        if (!this.advisorGrid || !this.advisorData.length) return;

        // Clear existing content
        this.advisorGrid.innerHTML = '';

        // Create advisor cards
        this.advisorData.forEach((advisor, index) => {
            const card = this.createAdvisorCard(advisor, index);
            this.advisorGrid.appendChild(card);
        });

        // Update advisor cards reference
        this.advisorCards = document.querySelectorAll('.advisor-card-modern');

        console.log(`[AdvisorsModernized] Rendered ${this.advisorData.length} advisor cards`);
    }

    createAdvisorCard(advisor, index) {
        const card = document.createElement('div');
        card.className = 'advisor-card-modern';
        card.setAttribute('data-index', index);
        
        // Create photo element
        const photoElement = advisor.image ? 
            `<img src="${advisor.image}" alt="${advisor.name}" class="advisor-photo" loading="lazy">` :
            `<span class="advisor-initials">${this.getInitials(advisor.name)}</span>`;

        card.innerHTML = `
            <div class="advisor-card-header">
                <div class="advisor-avatar">
                    ${photoElement}
                </div>
                <div class="advisor-badge">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" fill="currentColor"/>
                    </svg>
                </div>
            </div>
            <div class="advisor-card-content">
                <h3>${advisor.name}</h3>
                <p class="advisor-description">${advisor.bio}</p>
            </div>
        `;
        
        return card;
    }

    getInitials(name) {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    setupEventListeners() {
        // Add click handlers for advisor cards
        this.advisorCards.forEach((card, index) => {
            card.addEventListener('click', (e) => this.handleCardClick(e, index));
            card.style.cursor = 'pointer';
        });

        // Add click handlers for expertise tags
        this.expertiseTags.forEach((tag, index) => {
            tag.addEventListener('click', (e) => this.handleExpertiseTagClick(e, index));
            tag.style.cursor = 'pointer';
        });

        // Add hover effects for impact items
        const impactItems = document.querySelectorAll('.impact-item');
        impactItems.forEach((item, index) => {
            item.addEventListener('mouseenter', (e) => this.handleImpactItemHover(e, index, 'enter'));
            item.addEventListener('mouseleave', (e) => this.handleImpactItemHover(e, index, 'leave'));
        });

        console.log('[AdvisorsModernized] Event listeners setup complete');
    }

    setupIntersectionObserver() {
        // Create intersection observer for animations
        const options = {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        };

        this.animationObserver = new IntersectionObserver(this.handleIntersection, options);

        // Observe elements for animation
        const elementsToObserve = [
            this.introBanner,
            document.querySelector('.advisors-showcase'),
            this.statsSection,
            this.impactSection
        ].filter(Boolean);

        elementsToObserve.forEach(element => {
            this.animationObserver.observe(element);
        });

        console.log('[AdvisorsModernized] Intersection observer setup complete');
    }

    setupAnimations() {
        // Add initial animation states
        this.advisorCards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        });

        if (this.impactSection) {
            this.impactSection.style.opacity = '0';
            this.impactSection.style.transform = 'translateY(20px)';
            this.impactSection.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        }

        console.log('[AdvisorsModernized] Animation setup complete');
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                
                if (element.classList.contains('advisors-intro-banner')) {
                    this.animateIntroBanner();
                } else if (element.classList.contains('advisors-showcase')) {
                    this.animateAdvisorCards();
                } else if (element.classList.contains('advisors-stats-inline')) {
                    this.animateStats();
                } else if (element.classList.contains('advisors-impact')) {
                    this.animateImpactSection();
                }
                
                // Stop observing once animated
                this.animationObserver.unobserve(element);
            }
        });
    }

    animateIntroBanner() {
        const banner = this.introBanner;
        const statsInline = document.querySelectorAll('.advisors-stats-inline .inline-stat');
        
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

    animateAdvisorCards() {
        this.advisorCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }

    animateStats() {
        if (this.statsAnimated) return;
        this.statsAnimated = true;

        const statNumbers = document.querySelectorAll('.advisors-stats-inline .stat-number');
        statNumbers.forEach((statNumber, index) => {
            const finalText = statNumber.textContent;
            
            // Only animate numeric stats
            if (finalText.includes('+')) {
                const number = parseInt(finalText);
                this.countUp(statNumber, 0, number, 1000, '+');
            } else if (!isNaN(parseInt(finalText))) {
                const number = parseInt(finalText);
                this.countUp(statNumber, 0, number, 800, '');
            }
        });
    }

    animateImpactSection() {
        const impactItems = document.querySelectorAll('.impact-item');
        
        impactItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px)';
            item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 100);
        });

        if (this.impactSection) {
            setTimeout(() => {
                this.impactSection.style.opacity = '1';
                this.impactSection.style.transform = 'translateY(0)';
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

    handleCardClick(event, index) {
        const card = event.currentTarget;
        const advisorName = card.querySelector('h3').textContent;
        const advisorRole = card.querySelector('.advisor-role').textContent;
        
        console.log(`[AdvisorsModernized] Advisor card clicked: ${advisorName}`);
        
        // Add click animation
        card.style.transform = 'translateY(-8px) scale(0.98)';
        
        setTimeout(() => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
        }, 150);

        // Show advisor details
        this.showAdvisorDetails({
            name: advisorName,
            role: advisorRole,
            index: index
        });
    }

    handleExpertiseTagClick(event, index) {
        const tag = event.currentTarget;
        const expertise = tag.textContent.trim();
        
        console.log(`[AdvisorsModernized] Expertise tag clicked: ${expertise}`);
        
        // Add click animation
        tag.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            tag.style.transform = 'scale(1)';
        }, 150);

        // Show expertise information
        this.showExpertiseInfo(expertise, tag);
    }

    handleImpactItemHover(event, index, type) {
        const item = event.currentTarget;
        const icon = item.querySelector('.impact-icon');
        
        if (type === 'enter') {
            // Enhanced hover effects
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
                icon.style.boxShadow = '0 8px 20px rgba(var(--color-accent-rgb-values), 0.3)';
            }
            
            // Add subtle glow effect
            item.style.boxShadow = `
                0 12px 30px rgba(var(--color-accent-rgb-values), 0.15),
                0 0 0 1px rgba(var(--color-accent-rgb-values), 0.1)
            `;
            
        } else if (type === 'leave') {
            // Reset hover effects
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0deg)';
                icon.style.boxShadow = '';
            }
            
            // Reset glow effect
            item.style.boxShadow = '';
        }
    }

    showAdvisorDetails(advisor) {
        // Create a detailed notification
        const notification = document.createElement('div');
        notification.className = 'advisor-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <h4>${advisor.name}</h4>
                    <button class="close-notification">×</button>
                </div>
                <p class="notification-role">${advisor.role}</p>
                <p class="notification-message">Click to learn more about our distinguished advisor's contributions to scientific research.</p>
            </div>
        `;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary))',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            zIndex: '1000',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            maxWidth: '350px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
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
        }, 4000);
    }

    showExpertiseInfo(expertise, element) {
        // Create a tooltip for expertise information
        const tooltip = document.createElement('div');
        tooltip.className = 'expertise-tooltip';
        tooltip.textContent = this.getExpertiseDescription(expertise);
        
        // Style the tooltip
        Object.assign(tooltip.style, {
            position: 'absolute',
            background: 'var(--color-accent-primary)',
            color: 'white',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            fontSize: '0.9rem',
            zIndex: '1000',
            opacity: '0',
            transform: 'translateY(10px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            pointerEvents: 'none',
            maxWidth: '250px',
            textAlign: 'center',
            boxShadow: '0 8px 20px rgba(var(--color-accent-rgb-values), 0.3)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)'
        });

        // Position tooltip
        const rect = element.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.bottom + 10}px`;
        tooltip.style.transform = 'translateX(-50%) translateY(10px)';

        document.body.appendChild(tooltip);

        // Animate in
        requestAnimationFrame(() => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Remove after delay
        setTimeout(() => {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateX(-50%) translateY(-10px)';
            
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            }, 300);
        }, 2500);
    }

    getExpertiseDescription(expertise) {
        const descriptions = {
            'Polymer Chemistry': 'Advanced study of large molecules and their applications in sustainable materials',
            'Biodegradable Materials': 'Development of materials that naturally decompose without environmental harm',
            'Sustainability': 'Focus on environmentally responsible and resource-efficient practices',
            'Materials Chemistry': 'Research into the chemical properties and applications of various materials',
            'Energy Systems': 'Development of efficient and sustainable energy solutions',
            'Industry Bridge': 'Connecting academic research with practical industrial applications',
            'Organic Chemistry': 'Study of carbon-based compounds and their reactions',
            'Bio-Catalysis': 'Use of biological catalysts to accelerate chemical reactions',
            'Biomaterials': 'Materials designed to interact with biological systems',
            'Water Management': 'Sustainable approaches to water resource conservation and treatment',
            'Sustainable Agriculture': 'Farming practices that maintain environmental health',
            'Environmental Science': 'Interdisciplinary study of environmental problems and solutions'
        };
        
        return descriptions[expertise] || 'Specialized expertise in cutting-edge scientific research';
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
        this.advisorCards.forEach(card => {
            card.removeEventListener('click', this.handleCardClick);
        });

        this.expertiseTags.forEach(tag => {
            tag.removeEventListener('click', this.handleExpertiseTagClick);
        });

        this.isInitialized = false;
        console.log('[AdvisorsModernized] Destroyed');
    }

    // Utility methods
    getTotalAdvisors() {
        return this.advisorCards.length;
    }

    getAdvisorByIndex(index) {
        const card = this.advisorCards[index];
        if (card) {
            return {
                name: card.querySelector('h3').textContent,
                role: card.querySelector('.advisor-role').textContent,
                description: card.querySelector('.advisor-description').textContent,
                expertise: Array.from(card.querySelectorAll('.expertise-tag')).map(tag => tag.textContent)
            };
        }
        return null;
    }

    highlightExpertise(expertiseArea) {
        // Highlight cards that have the specified expertise
        this.advisorCards.forEach(card => {
            const expertiseTags = card.querySelectorAll('.expertise-tag');
            const hasExpertise = Array.from(expertiseTags).some(tag => 
                tag.textContent.toLowerCase().includes(expertiseArea.toLowerCase())
            );
            
            if (hasExpertise) {
                card.style.boxShadow = '0 0 20px rgba(var(--color-accent-rgb-values), 0.4)';
                setTimeout(() => {
                    card.style.boxShadow = '';
                }, 2000);
            }
        });
    }

    // Method to trigger animations manually
    triggerAnimations() {
        if (this.statsSection && this.isInViewport(this.statsSection)) {
            this.animateStats();
        }
    }

    // Utility method to check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
}

export default AdvisorsModernized;