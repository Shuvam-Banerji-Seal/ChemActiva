// src/js/tests/ModernArticleManager.test.js
import ModernArticleManager from '../ModernArticleManager.js';

// Mock GSAP
jest.mock('gsap', () => ({
    gsap: {
        from: jest.fn()
    }
}));

// Mock fetch
global.fetch = jest.fn();

describe('ModernArticleManager', () => {
    let manager;
    let mockGridElement;

    beforeEach(() => {
        // Create mock DOM element
        mockGridElement = document.createElement('div');
        mockGridElement.id = 'test-grid';
        document.body.appendChild(mockGridElement);

        // Reset fetch mock
        fetch.mockClear();

        // Create manager instance
        manager = new ModernArticleManager(
            '#test-grid',
            '/test/articles.jsonl',
            'blog',
            'single-article.html'
        );
    });

    afterEach(() => {
        document.body.removeChild(mockGridElement);
        manager.destroy();
    });

    describe('Constructor', () => {
        test('should extend ArticleManager with enhanced options', () => {
            expect(manager.options.enableReadingTime).toBe(true);
            expect(manager.options.enableEnhancedMetadata).toBe(true);
            expect(manager.options.enableFeaturedCards).toBe(true);
            expect(manager.options.wordsPerMinute).toBe(200);
        });

        test('should initialize metadata configuration', () => {
            expect(manager.metadataConfig.showDate).toBe(true);
            expect(manager.metadataConfig.showAuthor).toBe(true);
            expect(manager.metadataConfig.showReadingTime).toBe(true);
            expect(manager.metadataConfig.dateFormat).toBe('short');
        });

        test('should initialize reading time cache', () => {
            expect(manager.readingTimeCache).toBeInstanceOf(Map);
            expect(manager.readingTimeCache.size).toBe(0);
        });
    });

    describe('Reading Time Calculation', () => {
        test('should calculate reading time for basic text', () => {
            const content = 'This is a test article with exactly twenty words to test the reading time calculation functionality properly.';
            const readingTime = manager.calculateReadingTime(content);
            expect(readingTime).toBe(1); // 20 words / 200 wpm = 0.1 min, rounded up to 1
        });

        test('should cache reading time calculations', () => {
            const content = 'Test content for caching';
            const firstCall = manager.calculateReadingTime(content);
            const secondCall = manager.calculateReadingTime(content);
            
            expect(firstCall).toBe(secondCall);
            expect(manager.readingTimeCache.size).toBe(1);
        });

        test('should account for images in reading time', () => {
            const contentWithImages = 'Test content ![image1](test.jpg) with images ![image2](test2.jpg) included.';
            const readingTime = manager.calculateReadingTime(contentWithImages);
            expect(readingTime).toBeGreaterThan(1); // Should add time for images
        });

        test('should account for code blocks in reading time', () => {
            const contentWithCode = 'Test content with ```code block``` included.';
            const readingTime = manager.calculateReadingTime(contentWithCode);
            expect(readingTime).toBeGreaterThan(1); // Should add time for code blocks
        });

        test('should return minimum 1 minute for very short content', () => {
            const shortContent = 'Short';
            const readingTime = manager.calculateReadingTime(shortContent);
            expect(readingTime).toBe(1);
        });

        test('should handle empty content', () => {
            expect(manager.calculateReadingTime('')).toBe(0);
            expect(manager.calculateReadingTime(null)).toBe(0);
            expect(manager.calculateReadingTime(undefined)).toBe(0);
        });
    });

    describe('Date Formatting', () => {
        const testDate = '2024-01-15';

        test('should format date in short format by default', () => {
            const formatted = manager.formatDate(testDate);
            expect(formatted).toMatch(/Jan 15, 2024/);
        });

        test('should format date in long format', () => {
            manager.metadataConfig.dateFormat = 'long';
            const formatted = manager.formatDate(testDate);
            expect(formatted).toMatch(/January 15, 2024/);
        });

        test('should format date in relative format', () => {
            manager.metadataConfig.dateFormat = 'relative';
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const formatted = manager.formatDate(today);
            // Account for timezone differences that might make it "Yesterday"
            expect(['Today', 'Yesterday']).toContain(formatted);
        });

        test('should handle invalid dates', () => {
            expect(manager.formatDate('')).toBe('');
            expect(manager.formatDate(null)).toBe('');
            expect(manager.formatDate(undefined)).toBe('');
        });
    });

    describe('Enhanced Metadata Creation', () => {
        const mockArticle = {
            id: 'test-1',
            title: 'Test Article',
            author: 'Test Author',
            date: '2024-01-15',
            category: 'Research',
            abstract: 'This is a test abstract with enough words to calculate reading time properly.'
        };

        test('should create metadata container with proper class', () => {
            const metadata = manager.createEnhancedMetadata(mockArticle);
            expect(metadata.className).toBe('modern-article-meta');
        });

        test('should include date metadata when enabled', () => {
            const metadata = manager.createEnhancedMetadata(mockArticle);
            const dateItem = metadata.querySelector('.modern-article-meta-item');
            expect(dateItem).toBeTruthy();
            expect(dateItem.textContent).toContain('Jan 15, 2024');
        });

        test('should include author metadata when enabled', () => {
            const metadata = manager.createEnhancedMetadata(mockArticle);
            const items = metadata.querySelectorAll('.modern-article-meta-item');
            const authorItem = Array.from(items).find(item => 
                item.textContent.includes('Test Author')
            );
            expect(authorItem).toBeTruthy();
        });

        test('should include reading time when enabled', () => {
            const metadata = manager.createEnhancedMetadata(mockArticle);
            const items = metadata.querySelectorAll('.modern-article-meta-item');
            const readingTimeItem = Array.from(items).find(item => 
                item.textContent.includes('min read')
            );
            expect(readingTimeItem).toBeTruthy();
        });

        test('should include category metadata when available', () => {
            const metadata = manager.createEnhancedMetadata(mockArticle);
            const categoryItem = metadata.querySelector('.modern-article-category');
            expect(categoryItem).toBeTruthy();
            expect(categoryItem.textContent).toContain('Research');
        });

        test('should handle articles with multiple authors', () => {
            const articleWithMultipleAuthors = {
                ...mockArticle,
                authors: ['Author One', 'Author Two']
            };
            const metadata = manager.createEnhancedMetadata(articleWithMultipleAuthors);
            const items = metadata.querySelectorAll('.modern-article-meta-item');
            const authorItem = Array.from(items).find(item => 
                item.textContent.includes('Author One, Author Two')
            );
            expect(authorItem).toBeTruthy();
        });

        test('should add separators between metadata items', () => {
            const metadata = manager.createEnhancedMetadata(mockArticle);
            const separators = metadata.querySelectorAll('.modern-article-meta-separator');
            expect(separators.length).toBeGreaterThan(0);
        });
    });

    describe('Modern Article Card Creation', () => {
        const mockArticle = {
            id: 'test-1',
            title: 'Test Article',
            author: 'Test Author',
            date: '2024-01-15',
            abstract: 'Test abstract',
            coverImage: '/test/image.jpg'
        };

        test('should create modern article card with proper structure', () => {
            const card = manager.createModernArticleCard(mockArticle);
            
            expect(card.tagName).toBe('A');
            expect(card.className).toBe('modern-article-card');
            expect(card.href).toContain('single-article.html?type=blog&id=test-1');
        });

        test('should create featured card when specified', () => {
            const card = manager.createModernArticleCard(mockArticle, true);
            expect(card.className).toBe('modern-article-card featured');
        });

        test('should include image container with proper structure', () => {
            const card = manager.createModernArticleCard(mockArticle);
            const imageContainer = card.querySelector('.modern-article-image-container');
            const image = card.querySelector('.modern-article-image');
            const overlay = card.querySelector('.modern-article-image-overlay');
            
            expect(imageContainer).toBeTruthy();
            expect(image).toBeTruthy();
            expect(overlay).toBeTruthy();
            expect(image.src).toContain('/test/image.jpg');
        });

        test('should include content section with all elements', () => {
            const card = manager.createModernArticleCard(mockArticle);
            const contentSection = card.querySelector('.modern-article-content-section');
            const title = card.querySelector('.modern-article-title');
            const meta = card.querySelector('.modern-article-meta');
            const abstract = card.querySelector('.modern-article-abstract');
            const cta = card.querySelector('.modern-article-cta');
            
            expect(contentSection).toBeTruthy();
            expect(title).toBeTruthy();
            expect(meta).toBeTruthy();
            expect(abstract).toBeTruthy();
            expect(cta).toBeTruthy();
            
            expect(title.textContent).toBe('Test Article');
            expect(abstract.textContent).toBe('Test abstract');
        });

        test('should handle missing cover image with fallback', () => {
            const articleWithoutImage = { ...mockArticle, coverImage: null };
            const card = manager.createModernArticleCard(articleWithoutImage);
            const image = card.querySelector('.modern-article-image');
            
            expect(image.src).toContain('/public/assets/images/covers/default-cover.svg');
        });

        test('should add proper accessibility attributes', () => {
            const card = manager.createModernArticleCard(mockArticle);
            
            expect(card.getAttribute('aria-label')).toBe('Read article: Test Article');
            expect(card.getAttribute('data-article-id')).toBe('test-1');
            expect(card.getAttribute('data-article-type')).toBe('blog');
        });
    });

    describe('Configuration Updates', () => {
        test('should update metadata configuration', () => {
            const newConfig = { showDate: false, showCategory: false };
            manager.updateMetadataConfig(newConfig);
            
            expect(manager.metadataConfig.showDate).toBe(false);
            expect(manager.metadataConfig.showCategory).toBe(false);
            expect(manager.metadataConfig.showAuthor).toBe(true); // Should remain unchanged
        });

        test('should update reading speed and clear cache', () => {
            // Add something to cache first
            manager.calculateReadingTime('test content');
            expect(manager.readingTimeCache.size).toBe(1);
            
            manager.updateReadingSpeed(250);
            
            expect(manager.options.wordsPerMinute).toBe(250);
            expect(manager.readingTimeCache.size).toBe(0);
        });
    });

    describe('Article Statistics', () => {
        beforeEach(() => {
            // Add some mock cards to the grid
            const regularCard = document.createElement('div');
            regularCard.className = 'modern-article-card';
            
            const featuredCard = document.createElement('div');
            featuredCard.className = 'modern-article-card featured';
            
            mockGridElement.appendChild(regularCard);
            mockGridElement.appendChild(featuredCard);
        });

        test('should return correct article statistics', () => {
            const stats = manager.getArticleStats();
            
            expect(stats.total).toBe(2);
            expect(stats.featured).toBe(1);
            expect(stats.regular).toBe(1);
            expect(stats.type).toBe('blog');
        });
    });

    describe('Cleanup', () => {
        test('should properly cleanup resources', () => {
            // Add some data to cache
            manager.calculateReadingTime('test content');
            expect(manager.readingTimeCache.size).toBe(1);
            
            // Add grid class
            mockGridElement.classList.add('modern-article-grid');
            mockGridElement.innerHTML = '<div>test content</div>';
            
            manager.destroy();
            
            expect(manager.readingTimeCache.size).toBe(0);
            expect(mockGridElement.classList.contains('modern-article-grid')).toBe(false);
            expect(mockGridElement.innerHTML).toBe('');
            expect(manager.hasLoaded).toBe(false);
        });
    });
});