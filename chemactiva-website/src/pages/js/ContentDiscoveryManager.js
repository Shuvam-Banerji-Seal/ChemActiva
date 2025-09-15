// src/js/ContentDiscoveryManager.js
// Utility class for handling search, filtering, and categorization of articles
export default class ContentDiscoveryManager {
    constructor(options = {}) {
        // Configuration options
        this.options = {
            debounceDelay: 300, // ms delay for search input
            minSearchLength: 2, // minimum characters to trigger search
            enableFuzzySearch: true,
            enableCategoryFilter: true,
            enableTagFilter: true,
            enableAuthorFilter: true,
            enableDateFilter: true,
            enableSorting: true,
            ...options
        };

        // Internal state
        this.articles = [];
        this.filteredArticles = [];
        this.searchQuery = '';
        this.activeFilters = {
            categories: new Set(),
            tags: new Set(),
            authors: new Set(),
            dateRange: { start: null, end: null }
        };
        this.sortBy = 'date';
        this.sortOrder = 'desc'; // 'asc' or 'desc'
        
        // Debounced search function
        this.debouncedSearch = this.debounce(this.performSearch.bind(this), this.options.debounceDelay);
        
        // Event callbacks
        this.onResultsUpdate = null;
        this.onFilterChange = null;
        this.onSearchChange = null;
        
        // Cache for performance
        this.searchCache = new Map();
        this.filterCache = new Map();
        
        // Available filter options (populated from articles)
        this.availableFilters = {
            categories: new Set(),
            tags: new Set(),
            authors: new Set(),
            dateRange: { min: null, max: null }
        };
    }

    /**
     * Initialize the discovery manager with article data
     * @param {Array} articles - Array of article objects
     */
    initialize(articles) {
        this.articles = [...articles];
        this.filteredArticles = this.sortArticles([...articles]); // Apply default sorting
        this.buildAvailableFilters();
        this.updateResults();
    }

    /**
     * Build available filter options from article data
     */
    buildAvailableFilters() {
        this.availableFilters = {
            categories: new Set(),
            tags: new Set(),
            authors: new Set(),
            dateRange: { min: null, max: null }
        };

        this.articles.forEach(article => {
            // Categories
            if (article.category) {
                this.availableFilters.categories.add(article.category);
            }
            
            // Tags
            if (article.tags && Array.isArray(article.tags)) {
                article.tags.forEach(tag => this.availableFilters.tags.add(tag));
            }
            
            // Authors
            if (article.author) {
                this.availableFilters.authors.add(article.author);
            } else if (article.authors && Array.isArray(article.authors)) {
                article.authors.forEach(author => this.availableFilters.authors.add(author));
            }
            
            // Date range
            if (article.date) {
                const date = new Date(article.date);
                if (!this.availableFilters.dateRange.min || date < this.availableFilters.dateRange.min) {
                    this.availableFilters.dateRange.min = date;
                }
                if (!this.availableFilters.dateRange.max || date > this.availableFilters.dateRange.max) {
                    this.availableFilters.dateRange.max = date;
                }
            }
        });
    }

    /**
     * Set search query with debounced execution
     * @param {string} query - Search query string
     */
    setSearchQuery(query) {
        this.searchQuery = query.trim();
        
        if (this.onSearchChange) {
            this.onSearchChange(this.searchQuery);
        }
        
        // Use debounced search for performance
        this.debouncedSearch();
    }

    /**
     * Perform search operation
     */
    performSearch() {
        // Clear cache when search changes
        this.searchCache.clear();
        this.filterCache.clear();
        
        this.applyFiltersAndSearch();
    }

    /**
     * Add category filter
     * @param {string} category - Category to filter by
     */
    addCategoryFilter(category) {
        if (!this.options.enableCategoryFilter) return;
        
        this.activeFilters.categories.add(category);
        this.applyFiltersAndSearch();
        
        if (this.onFilterChange) {
            this.onFilterChange('category', 'add', category);
        }
    }

    /**
     * Remove category filter
     * @param {string} category - Category to remove from filter
     */
    removeCategoryFilter(category) {
        this.activeFilters.categories.delete(category);
        this.applyFiltersAndSearch();
        
        if (this.onFilterChange) {
            this.onFilterChange('category', 'remove', category);
        }
    }

    /**
     * Toggle category filter
     * @param {string} category - Category to toggle
     */
    toggleCategoryFilter(category) {
        if (this.activeFilters.categories.has(category)) {
            this.removeCategoryFilter(category);
        } else {
            this.addCategoryFilter(category);
        }
    }

    /**
     * Add tag filter
     * @param {string} tag - Tag to filter by
     */
    addTagFilter(tag) {
        if (!this.options.enableTagFilter) return;
        
        this.activeFilters.tags.add(tag);
        this.applyFiltersAndSearch();
        
        if (this.onFilterChange) {
            this.onFilterChange('tag', 'add', tag);
        }
    }

    /**
     * Remove tag filter
     * @param {string} tag - Tag to remove from filter
     */
    removeTagFilter(tag) {
        this.activeFilters.tags.delete(tag);
        this.applyFiltersAndSearch();
        
        if (this.onFilterChange) {
            this.onFilterChange('tag', 'remove', tag);
        }
    }

    /**
     * Toggle tag filter
     * @param {string} tag - Tag to toggle
     */
    toggleTagFilter(tag) {
        if (this.activeFilters.tags.has(tag)) {
            this.removeTagFilter(tag);
        } else {
            this.addTagFilter(tag);
        }
    }

    /**
     * Add author filter
     * @param {string} author - Author to filter by
     */
    addAuthorFilter(author) {
        if (!this.options.enableAuthorFilter) return;
        
        this.activeFilters.authors.add(author);
        this.applyFiltersAndSearch();
        
        if (this.onFilterChange) {
            this.onFilterChange('author', 'add', author);
        }
    }

    /**
     * Remove author filter
     * @param {string} author - Author to remove from filter
     */
    removeAuthorFilter(author) {
        this.activeFilters.authors.delete(author);
        this.applyFiltersAndSearch();
        
        if (this.onFilterChange) {
            this.onFilterChange('author', 'remove', author);
        }
    }

    /**
     * Toggle author filter
     * @param {string} author - Author to toggle
     */
    toggleAuthorFilter(author) {
        if (this.activeFilters.authors.has(author)) {
            this.removeAuthorFilter(author);
        } else {
            this.addAuthorFilter(author);
        }
    }

    /**
     * Set date range filter
     * @param {Date|string} startDate - Start date
     * @param {Date|string} endDate - End date
     */
    setDateRangeFilter(startDate, endDate) {
        if (!this.options.enableDateFilter) return;
        
        this.activeFilters.dateRange = {
            start: startDate ? new Date(startDate) : null,
            end: endDate ? new Date(endDate) : null
        };
        
        this.applyFiltersAndSearch();
        
        if (this.onFilterChange) {
            this.onFilterChange('dateRange', 'set', { start: startDate, end: endDate });
        }
    }

    /**
     * Clear date range filter
     */
    clearDateRangeFilter() {
        this.activeFilters.dateRange = { start: null, end: null };
        this.applyFiltersAndSearch();
        
        if (this.onFilterChange) {
            this.onFilterChange('dateRange', 'clear', null);
        }
    }

    /**
     * Clear all filters
     */
    clearAllFilters() {
        this.searchQuery = '';
        this.activeFilters = {
            categories: new Set(),
            tags: new Set(),
            authors: new Set(),
            dateRange: { start: null, end: null }
        };
        
        this.applyFiltersAndSearch();
        
        if (this.onFilterChange) {
            this.onFilterChange('all', 'clear', null);
        }
    }

    /**
     * Set sorting options
     * @param {string} sortBy - Field to sort by ('date', 'title', 'author', 'relevance')
     * @param {string} sortOrder - Sort order ('asc' or 'desc')
     */
    setSorting(sortBy, sortOrder = 'desc') {
        if (!this.options.enableSorting) return;
        
        this.sortBy = sortBy;
        this.sortOrder = sortOrder;
        
        this.applyFiltersAndSearch();
    }

    /**
     * Apply all filters and search, then sort results
     */
    applyFiltersAndSearch() {
        // Create cache key for performance
        const cacheKey = this.createCacheKey();
        
        // Check cache first
        if (this.filterCache.has(cacheKey)) {
            this.filteredArticles = this.filterCache.get(cacheKey);
            this.updateResults();
            return;
        }

        let results = [...this.articles];

        // Apply search filter
        if (this.searchQuery && this.searchQuery.length >= this.options.minSearchLength) {
            results = this.searchArticles(results, this.searchQuery);
        }

        // Apply category filters
        if (this.activeFilters.categories.size > 0) {
            results = results.filter(article => 
                article.category && this.activeFilters.categories.has(article.category)
            );
        }

        // Apply tag filters
        if (this.activeFilters.tags.size > 0) {
            results = results.filter(article => {
                if (!article.tags || !Array.isArray(article.tags)) return false;
                return article.tags.some(tag => this.activeFilters.tags.has(tag));
            });
        }

        // Apply author filters
        if (this.activeFilters.authors.size > 0) {
            results = results.filter(article => {
                const articleAuthors = article.authors || [article.author];
                return articleAuthors.some(author => this.activeFilters.authors.has(author));
            });
        }

        // Apply date range filter
        if (this.activeFilters.dateRange.start || this.activeFilters.dateRange.end) {
            results = results.filter(article => {
                if (!article.date) return false;
                
                const articleDate = new Date(article.date);
                const start = this.activeFilters.dateRange.start;
                const end = this.activeFilters.dateRange.end;
                
                if (start && articleDate < start) return false;
                if (end && articleDate > end) return false;
                
                return true;
            });
        }

        // Sort results
        results = this.sortArticles(results);

        // Cache results
        this.filterCache.set(cacheKey, results);
        
        this.filteredArticles = results;
        this.updateResults();
    }

    /**
     * Search articles using fuzzy or exact matching
     * @param {Array} articles - Articles to search
     * @param {string} query - Search query
     * @returns {Array} Filtered articles
     */
    searchArticles(articles, query) {
        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
        
        return articles.filter(article => {
            const searchableText = [
                article.title || '',
                article.abstract || '',
                article.author || '',
                ...(article.authors || []),
                article.category || '',
                ...(article.tags || [])
            ].join(' ').toLowerCase();

            if (this.options.enableFuzzySearch) {
                // Fuzzy search - article matches if it contains any search term
                return searchTerms.some(term => searchableText.includes(term));
            } else {
                // Exact search - article must contain all search terms
                return searchTerms.every(term => searchableText.includes(term));
            }
        });
    }

    /**
     * Sort articles based on current sorting options
     * @param {Array} articles - Articles to sort
     * @returns {Array} Sorted articles
     */
    sortArticles(articles) {
        const sortedArticles = [...articles];
        
        sortedArticles.sort((a, b) => {
            let comparison = 0;
            
            switch (this.sortBy) {
                case 'date':
                    const dateA = new Date(a.date || 0);
                    const dateB = new Date(b.date || 0);
                    comparison = dateA - dateB;
                    break;
                    
                case 'title':
                    comparison = (a.title || '').localeCompare(b.title || '');
                    break;
                    
                case 'author':
                    const authorA = a.author || (a.authors && a.authors[0]) || '';
                    const authorB = b.author || (b.authors && b.authors[0]) || '';
                    comparison = authorA.localeCompare(authorB);
                    break;
                    
                case 'relevance':
                    // For relevance, we could implement a scoring system
                    // For now, fall back to date sorting
                    const relDateA = new Date(a.date || 0);
                    const relDateB = new Date(b.date || 0);
                    comparison = relDateA - relDateB;
                    break;
                    
                default:
                    comparison = 0;
            }
            
            return this.sortOrder === 'asc' ? comparison : -comparison;
        });
        
        return sortedArticles;
    }

    /**
     * Create cache key for current filter state
     * @returns {string} Cache key
     */
    createCacheKey() {
        const filterState = {
            search: this.searchQuery,
            categories: Array.from(this.activeFilters.categories).sort(),
            tags: Array.from(this.activeFilters.tags).sort(),
            authors: Array.from(this.activeFilters.authors).sort(),
            dateRange: this.activeFilters.dateRange,
            sortBy: this.sortBy,
            sortOrder: this.sortOrder
        };
        
        return JSON.stringify(filterState);
    }

    /**
     * Update results and notify listeners
     */
    updateResults() {
        if (this.onResultsUpdate) {
            this.onResultsUpdate(this.filteredArticles, this.getFilterStats());
        }
    }

    /**
     * Get current filter statistics
     * @returns {Object} Filter statistics
     */
    getFilterStats() {
        return {
            total: this.articles.length,
            filtered: this.filteredArticles.length,
            hasActiveFilters: this.hasActiveFilters(),
            activeFilters: {
                search: this.searchQuery,
                categories: Array.from(this.activeFilters.categories),
                tags: Array.from(this.activeFilters.tags),
                authors: Array.from(this.activeFilters.authors),
                dateRange: this.activeFilters.dateRange
            },
            sorting: {
                sortBy: this.sortBy,
                sortOrder: this.sortOrder
            }
        };
    }

    /**
     * Check if any filters are currently active
     * @returns {boolean} True if filters are active
     */
    hasActiveFilters() {
        return (
            this.searchQuery.length >= this.options.minSearchLength ||
            this.activeFilters.categories.size > 0 ||
            this.activeFilters.tags.size > 0 ||
            this.activeFilters.authors.size > 0 ||
            this.activeFilters.dateRange.start !== null ||
            this.activeFilters.dateRange.end !== null
        );
    }

    /**
     * Get available filter options
     * @returns {Object} Available filter options
     */
    getAvailableFilters() {
        return {
            categories: Array.from(this.availableFilters.categories).sort(),
            tags: Array.from(this.availableFilters.tags).sort(),
            authors: Array.from(this.availableFilters.authors).sort(),
            dateRange: this.availableFilters.dateRange
        };
    }

    /**
     * Get current filtered results
     * @returns {Array} Current filtered articles
     */
    getResults() {
        return [...this.filteredArticles];
    }

    /**
     * Set callback for results updates
     * @param {Function} callback - Callback function
     */
    onResults(callback) {
        this.onResultsUpdate = callback;
    }

    /**
     * Set callback for filter changes
     * @param {Function} callback - Callback function
     */
    onFilter(callback) {
        this.onFilterChange = callback;
    }

    /**
     * Set callback for search changes
     * @param {Function} callback - Callback function
     */
    onSearch(callback) {
        this.onSearchChange = callback;
    }

    /**
     * Debounce utility function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Reset the discovery manager to initial state
     */
    reset() {
        this.searchQuery = '';
        this.activeFilters = {
            categories: new Set(),
            tags: new Set(),
            authors: new Set(),
            dateRange: { start: null, end: null }
        };
        this.sortBy = 'date';
        this.sortOrder = 'desc';
        
        this.searchCache.clear();
        this.filterCache.clear();
        
        this.filteredArticles = [...this.articles];
        this.updateResults();
    }

    /**
     * Cleanup method for proper resource management
     */
    destroy() {
        // Clear caches
        this.searchCache.clear();
        this.filterCache.clear();
        
        // Clear callbacks
        this.onResultsUpdate = null;
        this.onFilterChange = null;
        this.onSearchChange = null;
        
        // Clear data
        this.articles = [];
        this.filteredArticles = [];
        this.availableFilters = {
            categories: new Set(),
            tags: new Set(),
            authors: new Set(),
            dateRange: { min: null, max: null }
        };
    }
}