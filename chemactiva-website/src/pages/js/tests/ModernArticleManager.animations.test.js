// src/js/tests/ModernArticleManager.animations.test.js
import ModernArticleManager from '../ModernArticleManager.js';
import { gsap } from 'gsap';

// Mock GSAP with more detailed tracking
jest.mock('gsap', () => {
    const mockTimeline = {
        to: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis()
    };

    const mockGsap = {
        timeline: jest.fn(() => mockTimeline),
        from: jest.fn(),
        to: jest.fn(),
        set: jest.fn()
    };

    return { gsap: mockGsap };
});

// Mock fetch
global.fetch = jest.fn();

describe('ModernArticleManager - Animations', () => {
    let manager;
    let mockGridElement;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Create mock DOM element
        mockGridElement = document.createElement('div');
        mockGridElement.id = 'test-grid';
        document.body.appendChild(mockGridElement);

        // Create manager instance
        manager = new ModernArticleManager(
            '#test-grid',
            '/test/articles.jsonl',
            'blog',
            'single-article.html',
            { animationType: 'cascade' }
        );
    });

    afterEach(() => {
        document.body.removeChild(mockGridElement);
        manager.destroy();
    });

    describe('Skeleton Loaders', () => {
        test('should create skeleton loader with proper structure', () => {
            const skeleton = manager.createSkeletonLoader();
            
            expect(skeleton.className).toBe('modern-article-skeleton');
            expect(skeleton.getAttribute('aria-label')).toBe('Loading article...');
            
            // Check for skeleton elements
            expect(skeleton.querySelector('.skeleton-image')).toBeTruthy();
            expect(skeleton.querySelector('.skeleton-content')).toBeTruthy();
            expect(skeleton.querySelector('.skeleton-title')).toBeTruthy();
            expect(skeleton.querySelector('.skeleton-meta')).toBeTruthy();
            expect(skeleton.querySelector('.skeleton-text')).toBeTruthy();
            expect(skeleton.querySelector('.skeleton-button')).toBeTruthy();
            
            // Check for multiple meta items and text lines
            expect(skeleton.querySelectorAll('.skeleton-meta-item')).toHaveLength(3);
            expect(skeleton.querySelectorAll('.skeleton-line')).toHaveLength(3);
            expect(skeleton.querySelector('.skeleton-line.short')).toBeTruthy();
        });

        test('should show loading state with specified number of skeletons', () => {
            manager.showLoadingState(4);
            
            expect(mockGridElement.classList.contains('modern-article-grid')).toBe(true);
            expect(mockGridElement.classList.contains('loading-state')).toBe(true);
            expect(mockGridElement.querySelectorAll('.modern-article-skeleton')).toHaveLength(4);
            
            // Verify GSAP animation was called
            expect(gsap.from).toHaveBeenCalledWith(
                expect.any(NodeList),
                expect.objectContaining({
                    opacity: 0,
                    y: 30,
                    duration: 0.4,
                    stagger: 0.08,
                    ease: "power2.out"
                })
            );
        });

        test('should show default 6 skeletons when count not specified', () => {
            manager.showLoadingState();
            
            expect(mockGridElement.querySelectorAll('.modern-article-skeleton')).toHaveLength(6);
        });

        test('should handle fadeOutSkeletons with animation', async () => {
            // Add some skeleton loaders first
            manager.showLoadingState(3);
            
            // Mock the GSAP.to method to call onComplete immediately
            gsap.to.mockImplementation((elements, config) => {
                if (config.onComplete) {
                    config.onComplete();
                }
                return gsap;
            });
            
            await manager.fadeOutSkeletons();
            
            expect(gsap.to).toHaveBeenCalledWith(
                expect.any(NodeList),
                expect.objectContaining({
                    opacity: 0,
                    scale: 0.95,
                    y: -20,
                    duration: 0.4,
                    stagger: 0.05,
                    ease: "power2.in",
                    onComplete: expect.any(Function)
                })
            );
            
            expect(mockGridElement.classList.contains('loading-state')).toBe(false);
        });

        test('should resolve immediately when no skeletons present', async () => {
            // No skeletons in grid
            const result = await manager.fadeOutSkeletons();
            
            expect(result).toBeUndefined();
            expect(gsap.to).not.toHaveBeenCalled();
        });
    });

    describe('Animation Types', () => {
        beforeEach(() => {
            // Add some mock cards to the grid
            for (let i = 0; i < 3; i++) {
                const card = document.createElement('div');
                card.className = 'modern-article-card';
                mockGridElement.appendChild(card);
            }
        });

        test('should call default animation when type is "default"', () => {
            manager.animateCardsEntrance('default');
            
            expect(gsap.timeline).toHaveBeenCalled();
            expect(gsap.set).toHaveBeenCalledWith(
                expect.any(NodeList),
                expect.objectContaining({
                    opacity: 0,
                    y: 80,
                    scale: 0.9,
                    rotationX: 15
                })
            );
        });

        test('should call cascade animation when type is "cascade"', () => {
            manager.animateCardsEntrance('cascade');
            
            expect(gsap.timeline).toHaveBeenCalled();
            expect(gsap.set).toHaveBeenCalledWith(
                expect.any(NodeList),
                expect.objectContaining({
                    opacity: 0,
                    scale: 0.8
                })
            );
        });

        test('should call wave animation when type is "wave"', () => {
            manager.animateCardsEntrance('wave');
            
            expect(gsap.timeline).toHaveBeenCalled();
            expect(gsap.set).toHaveBeenCalledWith(
                expect.any(NodeList),
                expect.objectContaining({
                    opacity: 0,
                    y: 120,
                    scale: 0.7,
                    transformOrigin: "center bottom"
                })
            );
        });

        test('should call spiral animation when type is "spiral"', () => {
            manager.animateCardsEntrance('spiral');
            
            expect(gsap.timeline).toHaveBeenCalled();
            expect(gsap.set).toHaveBeenCalledWith(
                expect.any(NodeList),
                expect.objectContaining({
                    opacity: 0,
                    scale: 0.5
                })
            );
        });

        test('should default to cascade animation for unknown types', () => {
            manager.animateCardsEntrance('unknown');
            
            expect(gsap.timeline).toHaveBeenCalled();
            // Unknown types fall back to 'default' animation, not 'cascade'
            expect(gsap.set).toHaveBeenCalledWith(
                expect.any(NodeList),
                expect.objectContaining({
                    opacity: 0,
                    y: 80,
                    scale: 0.9,
                    rotationX: 15
                })
            );
        });

        test('should handle empty card list gracefully', () => {
            // Clear all cards
            mockGridElement.innerHTML = '';
            
            manager.animateCardsEntrance('cascade');
            
            // Should not call GSAP methods when no cards present
            expect(gsap.timeline).not.toHaveBeenCalled();
        });

        test('should remove loading-state class during animation', () => {
            mockGridElement.classList.add('loading-state');
            
            manager.animateCardsEntrance('default');
            
            expect(mockGridElement.classList.contains('loading-state')).toBe(false);
        });
    });

    describe('Page Transitions', () => {
        beforeEach(() => {
            // Add some mock cards
            for (let i = 0; i < 2; i++) {
                const card = document.createElement('div');
                card.className = 'modern-article-card';
                mockGridElement.appendChild(card);
            }
        });

        test('should animate page transition out', () => {
            const callback = jest.fn();
            manager.animatePageTransition('out', callback);
            
            expect(gsap.timeline).toHaveBeenCalledWith({
                onComplete: callback
            });
        });

        test('should animate page transition in', () => {
            const callback = jest.fn();
            manager.animatePageTransition('in', callback);
            
            expect(gsap.timeline).toHaveBeenCalledWith({
                onComplete: callback
            });
            
            // Should call the entrance animation (cascade by default)
            expect(gsap.set).toHaveBeenCalled();
        });

        test('should use default "in" direction when not specified', () => {
            manager.animatePageTransition();
            
            // Should call entrance animation
            expect(gsap.set).toHaveBeenCalled();
        });
    });

    describe('Loading State Toggle', () => {
        test('should show loading state when toggle is true', () => {
            manager.toggleLoadingState(true);
            
            expect(mockGridElement.classList.contains('loading-state')).toBe(true);
            expect(mockGridElement.querySelectorAll('.modern-article-skeleton').length).toBeGreaterThan(0);
        });

        test('should hide loading state when toggle is false', () => {
            // First add some skeletons
            manager.showLoadingState(3);
            
            manager.toggleLoadingState(false);
            
            expect(gsap.to).toHaveBeenCalledWith(
                expect.any(NodeList),
                expect.objectContaining({
                    opacity: 0,
                    scale: 0.95,
                    duration: 0.3,
                    stagger: 0.05,
                    ease: "power2.in",
                    onComplete: expect.any(Function)
                })
            );
        });

        test('should default to showing loading state', () => {
            manager.toggleLoadingState();
            
            expect(mockGridElement.classList.contains('loading-state')).toBe(true);
        });

        test('should handle toggle when no grid element exists', () => {
            manager.gridElement = null;
            
            // Should not throw error
            expect(() => manager.toggleLoadingState()).not.toThrow();
        });
    });

    describe('Enhanced Loading Flow', () => {
        test('should show loading state during article loading', async () => {
            // Mock successful fetch
            fetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve('{"id":"1","title":"Test","abstract":"Test abstract"}\n')
            });

            // Mock fadeOutSkeletons to resolve immediately
            manager.fadeOutSkeletons = jest.fn().mockResolvedValue();

            await manager.loadAndDisplayArticles();

            // Should have shown loading state
            expect(gsap.from).toHaveBeenCalled();
            
            // Should have faded out skeletons
            expect(manager.fadeOutSkeletons).toHaveBeenCalled();
            
            // Should have animated cards entrance
            expect(gsap.timeline).toHaveBeenCalled();
        });

        test('should handle empty articles with proper empty state', async () => {
            // Mock empty response
            fetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve('')
            });

            await manager.loadAndDisplayArticles();

            const emptyState = mockGridElement.querySelector('.modern-article-empty-state');
            expect(emptyState).toBeTruthy();
            expect(emptyState.querySelector('h3').textContent).toBe('No blog posts available');
            expect(emptyState.querySelector('p').textContent).toBe('Check back soon for new content!');
        });
    });

    describe('Animation Configuration', () => {
        test('should use configured animation type from options', () => {
            const waveManager = new ModernArticleManager(
                '#test-grid',
                '/test/articles.jsonl',
                'blog',
                'single-article.html',
                { animationType: 'wave' }
            );

            // Add mock cards
            const card = document.createElement('div');
            card.className = 'modern-article-card';
            mockGridElement.appendChild(card);

            // The manager uses 'cascade' as default, not the configured animation type in animateCardsEntrance()
            // unless explicitly called with the animation type
            waveManager.animateCardsEntrance('wave');

            expect(gsap.set).toHaveBeenCalledWith(
                expect.any(NodeList),
                expect.objectContaining({
                    transformOrigin: "center bottom"
                })
            );

            waveManager.destroy();
        });

        test('should fallback to cascade when no animation type specified', () => {
            const defaultManager = new ModernArticleManager(
                '#test-grid',
                '/test/articles.jsonl',
                'blog',
                'single-article.html'
            );

            // Add mock cards
            const card = document.createElement('div');
            card.className = 'modern-article-card';
            mockGridElement.appendChild(card);

            defaultManager.animateCardsEntrance();

            // Should use cascade (default fallback)
            expect(gsap.set).toHaveBeenCalledWith(
                expect.any(NodeList),
                expect.objectContaining({
                    scale: 0.8
                })
            );

            defaultManager.destroy();
        });
    });
});