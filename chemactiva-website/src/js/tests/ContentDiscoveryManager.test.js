// src/js/tests/ContentDiscoveryManager.test.js
// Comprehensive tests for ContentDiscoveryManager functionality
import ContentDiscoveryManager from '../ContentDiscoveryManager.js';

// Mock article data for testing
const mockArticles = [
    {
        id: 'article-1',
        type: 'blog',
        title: 'The Future of Nano Cellulose',
        date: '2024-07-28',
        author: 'Dr. Goutam Kulsi',
        category: 'Research',
        tags: ['nanotechnology', 'sustainability', 'materials science'],
        abstract: 'A brief look into the exciting advancements and potential applications of nano cellulose in various industries.'
    },
    {
        id: 'article-2',
        type: 'blog',
        title: 'Sustainable Packaging Solutions',
        date: '2024-08-15',
        author: 'ChemActiva Team',
        category: 'Innovation',
        tags: ['eco-friendly', 'packaging', 'circular economy'],
        abstract: 'Exploring how cellulose-based materials are revolutionizing the packaging industry for a greener tomorrow.'
    },
    {
        id: 'article-3',
        type: 'research',
        title: 'Novel Synthesis Method for Carboxylated CNCs',
        date: '2024-06-10',
        authors: ['Dr. S. Hazra', 'R. Mandal'],
        category: 'Research',
        tags: ['synthesis', 'CNCs', 'methodology'],
        abstract: 'This paper details a new, efficient, and scalable method for producing highly carboxylated cellulose nanocrystals.'
    },
    {
        id: 'article-4',
        type: 'blog',
        title: 'Applications of CNCs in Modern Industries',
        date: '2024-09-20',
        author: 'Dr. S. Hazra',
        category: 'Applications',
        tags: ['nanotechnology', 'applications', 'biomedical'],
        abstract: 'An overview of the diverse applications of cellulose nanocrystals in various sectors.'
    }
];

describe('ContentDiscoveryManager', () => {
    let discoveryManager;

    beforeEach(() => {
        discoveryManager = new ContentDiscoveryManager();
        discoveryManager.initialize(mockArticles);
    });

    afterEach(() => {
        discoveryManager.destroy();
    });

    describe('Initialization', () => {
        test('should initialize with article data', () => {
            expect(discoveryManager.articles).toHaveLength(4);
            expect(discoveryManager.filteredArticles).toHaveLength(4);
        });

        test('should build available filters from articles', () => {
            const availableFilters = discoveryManager.getAvailableFilters();
            
            expect(availableFilters.categories).toContain('Research');
            expect(availableFilters.categories).toContain('Innovation');
            expect(availableFilters.categories).toContain('Applications');
            
            expect(availableFilters.tags).toContain('nanotechnology');
            expect(availableFilters.tags).toContain('sustainability');
            expect(availableFilters.tags).toContain('eco-friendly');
            
            expect(availableFilters.authors).toContain('Dr. Goutam Kulsi');
            expect(availableFilters.authors).toContain('ChemActiva Team');
            expect(availableFilters.authors).toContain('Dr. S. Hazra');
        });

        test('should set up date range from articles', () => {
            const availableFilters = discoveryManager.getAvailableFilters();
            
            expect(availableFilters.dateRange.min).toBeInstanceOf(Date);
            expect(availableFilters.dateRange.max).toBeInstanceOf(Date);
        });
    });

    describe('Search functionality', () => {
        test('should filter articles by search query', (done) => {
            discoveryManager.onResults((results) => {
                expect(results).toHaveLength(3); // Should find articles with "nano" in title or content
                expect(results.some(article => article.title.includes('Nano'))).toBe(true);
                done();
            });

            discoveryManager.setSearchQuery('nano');
        });

        test('should handle empty search query', (done) => {
            discoveryManager.onResults((results) => {
                expect(results).toHaveLength(4); // Should return all articles
                done();
            });

            discoveryManager.setSearchQuery('');
        });

        test('should respect minimum search length', (done) => {
            const shortQueryManager = new ContentDiscoveryManager({ minSearchLength: 3 });
            shortQueryManager.initialize(mockArticles);
            
            shortQueryManager.onResults((results) => {
                expect(results).toHaveLength(4); // Should not filter with query too short
                done();
            });

            shortQueryManager.setSearchQuery('na'); // Only 2 characters
        });

        test('should perform fuzzy search by default', (done) => {
            discoveryManager.onResults((results) => {
                expect(results.length).toBeGreaterThan(0);
                // Should find articles containing any of the search terms
                done();
            });

            discoveryManager.setSearchQuery('cellulose applications');
        });

        test('should search in multiple fields', (done) => {
            discoveryManager.onResults((results) => {
                expect(results.length).toBeGreaterThan(0);
                // Should find articles by author name
                const foundByAuthor = results.some(article => 
                    article.author === 'Dr. Goutam Kulsi' || 
                    (article.authors && article.authors.includes('Dr. Goutam Kulsi'))
                );
                expect(foundByAuthor).toBe(true);
                done();
            });

            discoveryManager.setSearchQuery('Goutam');
        });
    });

    describe('Category filtering', () => {
        test('should filter by single category', (done) => {
            discoveryManager.onResults((results) => {
                expect(results).toHaveLength(2); // Two research articles
                expect(results.every(article => article.category === 'Research')).toBe(true);
                done();
            });

            discoveryManager.addCategoryFilter('Research');
        });

        test('should filter by multiple categories', (done) => {
            discoveryManager.addCategoryFilter('Research');
            
            discoveryManager.onResults((results) => {
                expect(results).toHaveLength(3); // Research + Innovation articles
                done();
            });

            discoveryManager.addCategoryFilter('Innovation');
        });

        test('should toggle category filters', () => {
            discoveryManager.toggleCategoryFilter('Research');
            expect(discoveryManager.activeFilters.categories.has('Research')).toBe(true);
            
            discoveryManager.toggleCategoryFilter('Research');
            expect(discoveryManager.activeFilters.categories.has('Research')).toBe(false);
        });

        test('should remove category filter', () => {
            discoveryManager.addCategoryFilter('Research');
            discoveryManager.removeCategoryFilter('Research');
            
            const results = discoveryManager.getResults();
            expect(results).toHaveLength(4); // Should return all articles
        });
    });

    describe('Tag filtering', () => {
        test('should filter by single tag', (done) => {
            discoveryManager.onResults((results) => {
                expect(results).toHaveLength(2); // Two articles with nanotechnology tag
                expect(results.every(article => 
                    article.tags && article.tags.includes('nanotechnology')
                )).toBe(true);
                done();
            });

            discoveryManager.addTagFilter('nanotechnology');
        });

        test('should filter by multiple tags', (done) => {
            discoveryManager.addTagFilter('nanotechnology');
            
            discoveryManager.onResults((results) => {
                expect(results.length).toBeGreaterThan(0);
                // Should include articles with either tag
                done();
            });

            discoveryManager.addTagFilter('eco-friendly');
        });

        test('should toggle tag filters', () => {
            discoveryManager.toggleTagFilter('sustainability');
            expect(discoveryManager.activeFilters.tags.has('sustainability')).toBe(true);
            
            discoveryManager.toggleTagFilter('sustainability');
            expect(discoveryManager.activeFilters.tags.has('sustainability')).toBe(false);
        });
    });

    describe('Author filtering', () => {
        test('should filter by author', (done) => {
            discoveryManager.onResults((results) => {
                expect(results).toHaveLength(2); // Two articles by Dr. S. Hazra
                done();
            });

            discoveryManager.addAuthorFilter('Dr. S. Hazra');
        });

        test('should handle articles with multiple authors', (done) => {
            discoveryManager.onResults((results) => {
                expect(results).toHaveLength(1); // One article with R. Mandal as co-author
                done();
            });

            discoveryManager.addAuthorFilter('R. Mandal');
        });

        test('should toggle author filters', () => {
            discoveryManager.toggleAuthorFilter('Dr. Goutam Kulsi');
            expect(discoveryManager.activeFilters.authors.has('Dr. Goutam Kulsi')).toBe(true);
            
            discoveryManager.toggleAuthorFilter('Dr. Goutam Kulsi');
            expect(discoveryManager.activeFilters.authors.has('Dr. Goutam Kulsi')).toBe(false);
        });
    });

    describe('Date range filtering', () => {
        test('should filter by date range', (done) => {
            discoveryManager.onResults((results) => {
                expect(results.length).toBeLessThan(4);
                // Should only include articles from August onwards
                expect(results.every(article => new Date(article.date) >= new Date('2024-08-01'))).toBe(true);
                done();
            });

            discoveryManager.setDateRangeFilter('2024-08-01', null);
        });

        test('should filter by specific date range', (done) => {
            discoveryManager.onResults((results) => {
                expect(results.length).toBeLessThan(4);
                // Should only include articles within the range
                done();
            });

            discoveryManager.setDateRangeFilter('2024-07-01', '2024-08-31');
        });

        test('should clear date range filter', () => {
            discoveryManager.setDateRangeFilter('2024-08-01', null);
            discoveryManager.clearDateRangeFilter();
            
            const results = discoveryManager.getResults();
            expect(results).toHaveLength(4); // Should return all articles
        });
    });

    describe('Sorting functionality', () => {
        test('should sort by date descending by default', () => {
            const results = discoveryManager.getResults();
            const dates = results.map(article => new Date(article.date));
            
            for (let i = 1; i < dates.length; i++) {
                expect(dates[i-1] >= dates[i]).toBe(true);
            }
        });

        test('should sort by date ascending', (done) => {
            discoveryManager.onResults((results) => {
                const dates = results.map(article => new Date(article.date));
                
                for (let i = 1; i < dates.length; i++) {
                    expect(dates[i-1] <= dates[i]).toBe(true);
                }
                done();
            });

            discoveryManager.setSorting('date', 'asc');
        });

        test('should sort by title', (done) => {
            discoveryManager.onResults((results) => {
                const titles = results.map(article => article.title);
                const sortedTitles = [...titles].sort();
                
                expect(titles).toEqual(sortedTitles);
                done();
            });

            discoveryManager.setSorting('title', 'asc');
        });

        test('should sort by author', (done) => {
            discoveryManager.onResults((results) => {
                const authors = results.map(article => 
                    article.author || (article.authors && article.authors[0]) || ''
                );
                const sortedAuthors = [...authors].sort();
                
                expect(authors).toEqual(sortedAuthors);
                done();
            });

            discoveryManager.setSorting('author', 'asc');
        });
    });

    describe('Combined filtering', () => {
        test('should apply multiple filters simultaneously', () => {
            discoveryManager.addCategoryFilter('Research');
            discoveryManager.addTagFilter('nanotechnology');
            
            const results = discoveryManager.getResults();
            expect(results.length).toBeGreaterThan(0);
            expect(results.every(article => 
                article.category === 'Research' && 
                article.tags && article.tags.includes('nanotechnology')
            )).toBe(true);
        });

        test('should combine search with filters', (done) => {
            discoveryManager.setSearchQuery('cellulose');
            discoveryManager.addCategoryFilter('Research');
            
            discoveryManager.onResults((results) => {
                expect(results.length).toBeGreaterThan(0);
                expect(results.every(article => article.category === 'Research')).toBe(true);
                done();
            });
        });

        test('should clear all filters', () => {
            discoveryManager.addCategoryFilter('Research');
            discoveryManager.addTagFilter('nanotechnology');
            discoveryManager.setSearchQuery('test');
            
            discoveryManager.clearAllFilters();
            
            const results = discoveryManager.getResults();
            expect(results).toHaveLength(4); // Should return all articles
        });
    });

    describe('Filter statistics', () => {
        test('should provide accurate filter statistics', () => {
            discoveryManager.addCategoryFilter('Research');
            discoveryManager.setSearchQuery('nano');
            
            const stats = discoveryManager.getFilterStats();
            
            expect(stats.total).toBe(4);
            expect(stats.filtered).toBeLessThan(4);
            expect(stats.hasActiveFilters).toBe(true);
            expect(stats.activeFilters.categories).toContain('Research');
            expect(stats.activeFilters.search).toBe('nano');
        });

        test('should detect when no filters are active', () => {
            const stats = discoveryManager.getFilterStats();
            
            expect(stats.hasActiveFilters).toBe(false);
            expect(stats.filtered).toBe(stats.total);
        });
    });

    describe('Performance and caching', () => {
        test('should cache search results', () => {
            // Test caching by checking if filter cache is used
            discoveryManager.setSearchQuery('nano');
            
            // Wait for debounced search to complete
            const firstResults = discoveryManager.getResults();
            
            // Set same query again
            discoveryManager.setSearchQuery('nano');
            const secondResults = discoveryManager.getResults();
            
            // Results should be the same (from cache)
            expect(firstResults).toEqual(secondResults);
        });

        test('should clear cache when search changes', () => {
            discoveryManager.setSearchQuery('nano');
            discoveryManager.setSearchQuery('cellulose'); // Different query
            
            // Cache should be cleared and new search performed
            expect(discoveryManager.searchCache.size).toBe(0);
        });
    });

    describe('Event callbacks', () => {
        test('should call onResultsUpdate callback', (done) => {
            discoveryManager.onResults((results, stats) => {
                expect(results).toBeDefined();
                expect(stats).toBeDefined();
                expect(stats.total).toBe(4);
                done();
            });

            discoveryManager.setSearchQuery('test');
        });

        test('should call onFilterChange callback', (done) => {
            discoveryManager.onFilter((type, action, value) => {
                expect(type).toBe('category');
                expect(action).toBe('add');
                expect(value).toBe('Research');
                done();
            });

            discoveryManager.addCategoryFilter('Research');
        });

        test('should call onSearchChange callback', (done) => {
            discoveryManager.onSearch((query) => {
                expect(query).toBe('test query');
                done();
            });

            discoveryManager.setSearchQuery('test query');
        });
    });

    describe('Edge cases and error handling', () => {
        test('should handle empty article array', () => {
            const emptyManager = new ContentDiscoveryManager();
            emptyManager.initialize([]);
            
            expect(emptyManager.getResults()).toHaveLength(0);
            expect(emptyManager.getAvailableFilters().categories).toHaveLength(0);
        });

        test('should handle articles with missing fields', () => {
            const incompleteArticles = [
                { id: 'incomplete-1', title: 'Test Article' },
                { id: 'incomplete-2', date: '2024-01-01' }
            ];
            
            const incompleteManager = new ContentDiscoveryManager();
            incompleteManager.initialize(incompleteArticles);
            
            expect(incompleteManager.getResults()).toHaveLength(2);
        });

        test('should handle invalid date formats gracefully', () => {
            const invalidDateArticles = [
                { id: 'invalid-date', title: 'Test', date: 'invalid-date' }
            ];
            
            const invalidManager = new ContentDiscoveryManager();
            invalidManager.initialize(invalidDateArticles);
            
            // Should not throw error
            expect(() => invalidManager.setSorting('date')).not.toThrow();
        });
    });

    describe('Cleanup and resource management', () => {
        test('should properly cleanup resources', () => {
            discoveryManager.destroy();
            
            expect(discoveryManager.articles).toHaveLength(0);
            expect(discoveryManager.filteredArticles).toHaveLength(0);
            expect(discoveryManager.searchCache.size).toBe(0);
            expect(discoveryManager.filterCache.size).toBe(0);
        });

        test('should reset to initial state', () => {
            discoveryManager.addCategoryFilter('Research');
            discoveryManager.setSearchQuery('test');
            
            discoveryManager.reset();
            
            expect(discoveryManager.searchQuery).toBe('');
            expect(discoveryManager.activeFilters.categories.size).toBe(0);
            expect(discoveryManager.getResults()).toHaveLength(4);
        });
    });
});