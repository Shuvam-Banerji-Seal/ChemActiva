// src/js/tests/ContentDiscoveryUI.test.js
// Comprehensive tests for ContentDiscoveryUI functionality
import ContentDiscoveryUI from '../ContentDiscoveryUI.js';
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
    }
];

describe('ContentDiscoveryUI', () => {
    let container;
    let discoveryManager;
    let discoveryUI;

    beforeEach(() => {
        // Create container element
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);
        
        // Create discovery manager with mock data
        discoveryManager = new ContentDiscoveryManager();
        discoveryManager.initialize(mockArticles);
        
        // Create discovery UI
        discoveryUI = new ContentDiscoveryUI(container, discoveryManager);
    });

    afterEach(() => {
        discoveryUI.destroy();
        document.body.removeChild(container);
    });

    describe('Initialization', () => {
        test('should create UI elements correctly', () => {
            expect(container.querySelector('.content-discovery-container')).toBeTruthy();
            expect(container.querySelector('.search-input-modern')).toBeTruthy();
            expect(container.querySelector('.filter-chips-container')).toBeTruthy();
            expect(container.querySelector('.sort-select')).toBeTruthy();
            expect(container.querySelector('.view-mode-toggle')).toBeTruthy();
        });

        test('should throw error with invalid container', () => {
            expect(() => {
                new ContentDiscoveryUI('#non-existent-container');
            }).toThrow('ContentDiscoveryUI: Container element not found');
        });

        test('should accept container element directly', () => {
            const newContainer = document.createElement('div');
            document.body.appendChild(newContainer);
            
            const ui = new ContentDiscoveryUI(newContainer, discoveryManager);
            expect(ui.container).toBe(newContainer);
            
            ui.destroy();
            document.body.removeChild(newContainer);
        });

        test('should create discovery manager if not provided', () => {
            const newContainer = document.createElement('div');
            document.body.appendChild(newContainer);
            
            const ui = new ContentDiscoveryUI(newContainer);
            expect(ui.discoveryManager).toBeInstanceOf(ContentDiscoveryManager);
            
            ui.destroy();
            document.body.removeChild(newContainer);
        });
    });

    describe('Search functionality', () => {
        test('should handle search input', () => {
            const searchInput = container.querySelector('.search-input-modern');
            const spy = jest.spyOn(discoveryManager, 'setSearchQuery');
            
            searchInput.value = 'nano';
            searchInput.dispatchEvent(new Event('input'));
            
            expect(spy).toHaveBeenCalledWith('nano');
        });

        test('should show/hide clear button based on input', () => {
            const searchInput = container.querySelector('.search-input-modern');
            const searchContainer = container.querySelector('.search-input-container');
            
            // Initially no value
            expect(searchContainer.classList.contains('has-value')).toBe(false);
            
            // Add value
            searchInput.value = 'test';
            searchInput.dispatchEvent(new Event('input'));
            expect(searchContainer.classList.contains('has-value')).toBe(true);
            
            // Clear value
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            expect(searchContainer.classList.contains('has-value')).toBe(false);
        });

        test('should clear search on clear button click', () => {
            const searchInput = container.querySelector('.search-input-modern');
            const clearButton = container.querySelector('.search-clear-button');
            const spy = jest.spyOn(discoveryManager, 'setSearchQuery');
            
            // Set value first
            searchInput.value = 'test';
            searchInput.dispatchEvent(new Event('input'));
            
            // Click clear button
            clearButton.click();
            
            expect(searchInput.value).toBe('');
            expect(spy).toHaveBeenCalledWith('');
        });

        test('should clear search on Escape key', () => {
            const searchInput = container.querySelector('.search-input-modern');
            const spy = jest.spyOn(discoveryManager, 'setSearchQuery');
            
            // Set value first
            searchInput.value = 'test';
            searchInput.dispatchEvent(new Event('input'));
            
            // Press Escape
            const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
            searchInput.dispatchEvent(escapeEvent);
            
            expect(searchInput.value).toBe('');
            expect(spy).toHaveBeenCalledWith('');
        });
    });

    describe('Filter chips', () => {
        test('should render filter chips for available filters', () => {
            const filterChips = container.querySelectorAll('.filter-chip');
            expect(filterChips.length).toBeGreaterThan(0);
            
            // Should have chips for categories, tags, and authors
            const categoryChips = container.querySelectorAll('[data-filter-type="category"]');
            const tagChips = container.querySelectorAll('[data-filter-type="tag"]');
            const authorChips = container.querySelectorAll('[data-filter-type="author"]');
            
            expect(categoryChips.length).toBeGreaterThan(0);
            expect(tagChips.length).toBeGreaterThan(0);
            expect(authorChips.length).toBeGreaterThan(0);
        });

        test('should toggle filter on chip click', () => {
            const categoryChip = container.querySelector('[data-filter-type="category"]');
            const spy = jest.spyOn(discoveryManager, 'toggleCategoryFilter');
            
            categoryChip.click();
            
            expect(spy).toHaveBeenCalledWith(categoryChip.getAttribute('data-filter-value'));
        });

        test('should update chip appearance when filter is active', (done) => {
            const categoryChip = container.querySelector('[data-filter-type="category"]');
            const filterValue = categoryChip.getAttribute('data-filter-value');
            
            // Set up callback to check chip appearance after filter change
            discoveryManager.onResults(() => {
                // Re-query the chip as it may have been re-rendered
                const updatedChip = container.querySelector(`[data-filter-value="${filterValue}"]`);
                expect(updatedChip.classList.contains('active')).toBe(true);
                expect(updatedChip.getAttribute('aria-pressed')).toBe('true');
                done();
            });
            
            categoryChip.click();
        });

        test('should handle tag filter clicks', () => {
            const tagChip = container.querySelector('[data-filter-type="tag"]');
            const spy = jest.spyOn(discoveryManager, 'toggleTagFilter');
            
            tagChip.click();
            
            expect(spy).toHaveBeenCalledWith(tagChip.getAttribute('data-filter-value'));
        });

        test('should handle author filter clicks', () => {
            const authorChip = container.querySelector('[data-filter-type="author"]');
            const spy = jest.spyOn(discoveryManager, 'toggleAuthorFilter');
            
            authorChip.click();
            
            expect(spy).toHaveBeenCalledWith(authorChip.getAttribute('data-filter-value'));
        });
    });

    describe('Sort controls', () => {
        test('should handle sort selection change', () => {
            const sortSelect = container.querySelector('.sort-select');
            const spy = jest.spyOn(discoveryManager, 'setSorting');
            
            sortSelect.value = 'title';
            sortSelect.dispatchEvent(new Event('change'));
            
            expect(spy).toHaveBeenCalledWith('title', 'desc'); // Default order
        });

        test('should toggle sort order', () => {
            const sortOrderToggle = container.querySelector('.sort-order-toggle');
            const spy = jest.spyOn(discoveryManager, 'setSorting');
            
            sortOrderToggle.click();
            
            expect(spy).toHaveBeenCalledWith('date', 'asc'); // Toggle from default desc to asc
        });

        test('should update sort order button appearance', () => {
            const sortOrderToggle = container.querySelector('.sort-order-toggle');
            
            // Initial state should be descending
            expect(sortOrderToggle.getAttribute('aria-label')).toBe('Sort descending');
            
            // Click to toggle
            sortOrderToggle.click();
            
            // Should now be ascending
            expect(sortOrderToggle.getAttribute('aria-label')).toBe('Sort ascending');
        });
    });

    describe('View mode toggle', () => {
        test('should handle view mode toggle', () => {
            const listButton = container.querySelector('[data-view="list"]');
            const gridButton = container.querySelector('[data-view="grid"]');
            
            // Initially grid should be active
            expect(gridButton.classList.contains('active')).toBe(true);
            expect(listButton.classList.contains('active')).toBe(false);
            
            // Click list button
            listButton.click();
            
            expect(gridButton.classList.contains('active')).toBe(false);
            expect(listButton.classList.contains('active')).toBe(true);
            expect(discoveryUI.getViewMode()).toBe('list');
        });

        test('should dispatch viewModeChange event', (done) => {
            const listButton = container.querySelector('[data-view="list"]');
            
            container.addEventListener('viewModeChange', (event) => {
                expect(event.detail.viewMode).toBe('list');
                done();
            });
            
            listButton.click();
        });

        test('should set view mode programmatically', () => {
            discoveryUI.setViewMode('list');
            
            const listButton = container.querySelector('[data-view="list"]');
            const gridButton = container.querySelector('[data-view="grid"]');
            
            expect(listButton.classList.contains('active')).toBe(true);
            expect(gridButton.classList.contains('active')).toBe(false);
            expect(discoveryUI.getViewMode()).toBe('list');
        });
    });

    describe('Results display', () => {
        test('should update results count', () => {
            const resultsCount = container.querySelector('.results-count');
            expect(resultsCount).toBeTruthy();
            
            const countNumber = resultsCount.querySelector('.results-count-number');
            expect(countNumber.textContent).toBe('3'); // All mock articles
        });

        test('should dispatch resultsUpdate event', (done) => {
            container.addEventListener('resultsUpdate', (event) => {
                expect(event.detail.results).toBeDefined();
                expect(event.detail.stats).toBeDefined();
                done();
            });
            
            // Trigger a search to cause results update
            const searchInput = container.querySelector('.search-input-modern');
            searchInput.value = 'nano';
            searchInput.dispatchEvent(new Event('input'));
        });

        test('should show loading state during search', () => {
            const discoveryContainer = container.querySelector('.content-discovery-container');
            const searchContainer = container.querySelector('.search-input-container');
            
            // Trigger search
            const searchInput = container.querySelector('.search-input-modern');
            searchInput.value = 'test';
            searchInput.dispatchEvent(new Event('input'));
            
            // Should show loading state briefly
            expect(discoveryContainer.classList.contains('content-discovery-loading')).toBe(true);
            expect(searchContainer.classList.contains('search-input-loading')).toBe(true);
        });
    });

    describe('Clear filters functionality', () => {
        test('should enable clear filters button when filters are active', (done) => {
            const clearButton = container.querySelector('.clear-filters-button');
            const categoryChip = container.querySelector('[data-filter-type="category"]');
            
            // Initially disabled
            expect(clearButton.disabled).toBe(true);
            
            // Set up callback to check button state after filter change
            discoveryManager.onResults(() => {
                expect(clearButton.disabled).toBe(false);
                done();
            });
            
            // Activate a filter
            categoryChip.click();
        });

        test('should clear all filters on button click', () => {
            const clearButton = container.querySelector('.clear-filters-button');
            const searchInput = container.querySelector('.search-input-modern');
            const spy = jest.spyOn(discoveryManager, 'clearAllFilters');
            
            // Set some filters and search
            searchInput.value = 'test';
            searchInput.dispatchEvent(new Event('input'));
            
            // Click clear button
            clearButton.click();
            
            expect(spy).toHaveBeenCalled();
            expect(searchInput.value).toBe('');
        });
    });

    describe('Options and configuration', () => {
        test('should respect configuration options', () => {
            const newContainer = document.createElement('div');
            document.body.appendChild(newContainer);
            
            const ui = new ContentDiscoveryUI(newContainer, discoveryManager, {
                showSearch: false,
                showSorting: false,
                showViewModeToggle: false
            });
            
            expect(newContainer.querySelector('.search-input-modern')).toBeFalsy();
            expect(newContainer.querySelector('.sort-select')).toBeFalsy();
            expect(newContainer.querySelector('.view-mode-toggle')).toBeFalsy();
            
            ui.destroy();
            document.body.removeChild(newContainer);
        });

        test('should update options dynamically', () => {
            discoveryUI.updateOptions({
                showSearch: false,
                searchPlaceholder: 'New placeholder'
            });
            
            expect(container.querySelector('.search-input-modern')).toBeFalsy();
        });

        test('should limit visible filters when maxVisibleFilters is set', () => {
            const newContainer = document.createElement('div');
            document.body.appendChild(newContainer);
            
            const ui = new ContentDiscoveryUI(newContainer, discoveryManager, {
                maxVisibleFilters: 3
            });
            
            const filterChips = newContainer.querySelectorAll('.filter-chip');
            expect(filterChips.length).toBeLessThanOrEqual(3);
            
            ui.destroy();
            document.body.removeChild(newContainer);
        });
    });

    describe('Accessibility', () => {
        test('should have proper ARIA labels', () => {
            const searchInput = container.querySelector('.search-input-modern');
            const sortSelect = container.querySelector('.sort-select');
            const clearButton = container.querySelector('.search-clear-button');
            const sortOrderToggle = container.querySelector('.sort-order-toggle');
            
            expect(searchInput.getAttribute('aria-label')).toBe('Search articles');
            expect(sortSelect.getAttribute('aria-label')).toBe('Sort articles by');
            expect(clearButton.getAttribute('aria-label')).toBe('Clear search');
            expect(sortOrderToggle.getAttribute('aria-label')).toBeTruthy();
        });

        test('should update aria-pressed on filter chips', (done) => {
            const categoryChip = container.querySelector('[data-filter-type="category"]');
            const filterValue = categoryChip.getAttribute('data-filter-value');
            
            // Initially should be false
            expect(categoryChip.getAttribute('aria-pressed')).toBe('false');
            
            // Set up callback to check after filter change
            discoveryManager.onResults(() => {
                const updatedChip = container.querySelector(`[data-filter-value="${filterValue}"]`);
                expect(updatedChip.getAttribute('aria-pressed')).toBe('true');
                done();
            });
            
            categoryChip.click();
        });

        test('should have proper view mode button labels', () => {
            const gridButton = container.querySelector('[data-view="grid"]');
            const listButton = container.querySelector('[data-view="list"]');
            
            expect(gridButton.getAttribute('aria-label')).toBe('Grid view');
            expect(listButton.getAttribute('aria-label')).toBe('List view');
        });
    });

    describe('Error handling and edge cases', () => {
        test('should handle missing elements gracefully', () => {
            // Create UI with minimal options
            const newContainer = document.createElement('div');
            document.body.appendChild(newContainer);
            
            const ui = new ContentDiscoveryUI(newContainer, discoveryManager, {
                showSearch: false,
                showSorting: false,
                showViewModeToggle: false,
                showResultsCount: false,
                showClearFilters: false
            });
            
            // Should not throw errors when trying to update non-existent elements
            expect(() => {
                ui.updateResultsCount(5, 10);
                ui.updateClearFiltersButton(true);
                ui.updateSortOrderButton('asc');
            }).not.toThrow();
            
            ui.destroy();
            document.body.removeChild(newContainer);
        });

        test('should handle empty filter data', () => {
            const emptyManager = new ContentDiscoveryManager();
            emptyManager.initialize([]);
            
            const newContainer = document.createElement('div');
            document.body.appendChild(newContainer);
            
            const ui = new ContentDiscoveryUI(newContainer, emptyManager);
            
            const filterChips = newContainer.querySelectorAll('.filter-chip');
            expect(filterChips.length).toBe(0);
            
            ui.destroy();
            document.body.removeChild(newContainer);
        });

        test('should handle invalid view mode gracefully', () => {
            discoveryUI.setViewMode('invalid');
            expect(discoveryUI.getViewMode()).toBe('grid'); // Should remain unchanged
        });
    });

    describe('Cleanup and resource management', () => {
        test('should cleanup properly on destroy', () => {
            const initialHTML = container.innerHTML;
            
            discoveryUI.destroy();
            
            expect(container.innerHTML).toBe('');
            expect(discoveryUI.elements).toEqual({});
        });

        test('should remove event listeners on destroy', () => {
            const spy = jest.spyOn(document, 'removeEventListener');
            
            discoveryUI.destroy();
            
            expect(spy).toHaveBeenCalledWith('click', discoveryUI.handleClickOutside);
        });
    });

    describe('Integration with ContentDiscoveryManager', () => {
        test('should sync with discovery manager state', () => {
            const filterState = discoveryUI.getFilterState();
            const managerStats = discoveryManager.getFilterStats();
            
            expect(filterState).toEqual(managerStats);
        });

        test('should update UI when discovery manager changes', (done) => {
            const categoryChip = container.querySelector('[data-filter-type="category"]');
            const filterValue = categoryChip.getAttribute('data-filter-value');
            
            // Set up callback to verify UI update
            discoveryManager.onResults(() => {
                const updatedChip = container.querySelector(`[data-filter-value="${filterValue}"]`);
                expect(updatedChip.classList.contains('active')).toBe(true);
                done();
            });
            
            // Change filter directly through manager
            discoveryManager.addCategoryFilter(filterValue);
        });
    });
});