// src/js/ContentDiscoveryUI.js
// Modern search and filter UI components for content discovery
import ContentDiscoveryManager from './ContentDiscoveryManager.js';

export default class ContentDiscoveryUI {
    constructor(containerSelector, discoveryManager, options = {}) {
        this.container = typeof containerSelector === 'string' 
            ? document.querySelector(containerSelector) 
            : containerSelector;
        
        if (!this.container) {
            throw new Error('ContentDiscoveryUI: Container element not found');
        }
        
        this.discoveryManager = discoveryManager || new ContentDiscoveryManager();
        
        // Configuration options
        this.options = {
            showSearch: true,
            showCategoryFilter: true,
            showTagFilter: true,
            showAuthorFilter: true,
            showDateFilter: false, // More complex, disabled by default
            showSorting: true,
            showViewModeToggle: true,
            showResultsCount: true,
            showClearFilters: true,
            enableDropdowns: true,
            maxVisibleFilters: 5,
            searchPlaceholder: 'Search articles...',
            ...options
        };
        
        // UI state
        this.isLoading = false;
        this.currentViewMode = 'grid';
        this.openDropdown = null;
        
        // DOM elements (will be created)
        this.elements = {
            discoveryContainer: null,
            searchInput: null,
            searchClearButton: null,
            filterChipsContainer: null,
            sortSelect: null,
            sortOrderToggle: null,
            viewModeToggle: null,
            resultsCount: null,
            clearFiltersButton: null
        };
        
        // Available filter options
        this.availableFilters = {
            categories: [],
            tags: [],
            authors: []
        };
        
        // Bind methods
        this.handleSearchInput = this.handleSearchInput.bind(this);
        this.handleSearchClear = this.handleSearchClear.bind(this);
        this.handleFilterChipClick = this.handleFilterChipClick.bind(this);
        this.handleSortChange = this.handleSortChange.bind(this);
        this.handleSortOrderToggle = this.handleSortOrderToggle.bind(this);
        this.handleViewModeToggle = this.handleViewModeToggle.bind(this);
        this.handleClearFilters = this.handleClearFilters.bind(this);
        this.handleResultsUpdate = this.handleResultsUpdate.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
        
        this.init();
    }
    
    /**
     * Initialize the UI components
     */
    init() {
        this.createUI();
        this.setupEventListeners();
        
        // Set up discovery manager callbacks
        this.discoveryManager.onResults(this.handleResultsUpdate);
        
        // Initialize with current state
        this.updateAvailableFilters();
        
        // Initialize sort order button with correct label
        if (this.elements.sortOrderToggle) {
            this.updateSortOrderButton(this.discoveryManager.sortOrder);
        }
        
        // Trigger initial update to sync UI with discovery manager state
        const currentStats = this.discoveryManager.getFilterStats();
        this.handleResultsUpdate(this.discoveryManager.getResults(), currentStats);
    }
    
    /**
     * Create the main UI structure
     */
    createUI() {
        this.container.innerHTML = '';
        
        // Main container
        const discoveryContainer = document.createElement('div');
        discoveryContainer.className = 'content-discovery-container';
        
        // Discovery bar
        const discoveryBar = document.createElement('div');
        discoveryBar.className = 'content-discovery-bar';
        
        // Search section
        if (this.options.showSearch) {
            const searchContainer = this.createSearchInput();
            discoveryBar.appendChild(searchContainer);
        }
        
        // Filter controls
        const filterControls = document.createElement('div');
        filterControls.className = 'filter-controls';
        
        // Filter chips container
        const filterChipsContainer = document.createElement('div');
        filterChipsContainer.className = 'filter-chips-container';
        filterControls.appendChild(filterChipsContainer);
        this.elements.filterChipsContainer = filterChipsContainer;
        
        discoveryBar.appendChild(filterControls);
        
        // Sort and view controls
        const rightControls = document.createElement('div');
        rightControls.className = 'sort-controls';
        
        if (this.options.showSorting) {
            const sortControls = this.createSortControls();
            rightControls.appendChild(sortControls);
        }
        
        if (this.options.showViewModeToggle) {
            const viewModeToggle = this.createViewModeToggle();
            rightControls.appendChild(viewModeToggle);
        }
        
        discoveryBar.appendChild(rightControls);
        discoveryContainer.appendChild(discoveryBar);
        
        // Filter stats section
        if (this.options.showResultsCount || this.options.showClearFilters) {
            const filterStats = this.createFilterStats();
            discoveryContainer.appendChild(filterStats);
        }
        
        this.container.appendChild(discoveryContainer);
        this.elements.discoveryContainer = discoveryContainer;
    }
    
    /**
     * Create search input component
     */
    createSearchInput() {
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-input-container';
        
        // Search icon
        const searchIcon = document.createElement('div');
        searchIcon.className = 'search-input-icon';
        searchIcon.innerHTML = `
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
            </svg>
        `;
        
        // Search input
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'search-input-modern';
        searchInput.placeholder = this.options.searchPlaceholder;
        searchInput.setAttribute('aria-label', 'Search articles');
        
        // Clear button
        const clearButton = document.createElement('button');
        clearButton.type = 'button';
        clearButton.className = 'search-clear-button';
        clearButton.setAttribute('aria-label', 'Clear search');
        clearButton.innerHTML = `
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
        `;
        
        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(clearButton);
        
        this.elements.searchInput = searchInput;
        this.elements.searchClearButton = clearButton;
        
        return searchContainer;
    }
    
    /**
     * Create sort controls
     */
    createSortControls() {
        const sortContainer = document.createElement('div');
        sortContainer.className = 'sort-controls';
        
        // Sort label
        const sortLabel = document.createElement('span');
        sortLabel.className = 'sort-label';
        sortLabel.textContent = 'Sort by:';
        
        // Sort select
        const sortSelect = document.createElement('select');
        sortSelect.className = 'sort-select';
        sortSelect.setAttribute('aria-label', 'Sort articles by');
        
        const sortOptions = [
            { value: 'date', label: 'Date' },
            { value: 'title', label: 'Title' },
            { value: 'author', label: 'Author' },
            { value: 'relevance', label: 'Relevance' }
        ];
        
        sortOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            sortSelect.appendChild(optionElement);
        });
        
        // Sort order toggle
        const sortOrderToggle = document.createElement('button');
        sortOrderToggle.type = 'button';
        sortOrderToggle.className = 'sort-order-toggle';
        sortOrderToggle.setAttribute('aria-label', 'Toggle sort order');
        sortOrderToggle.innerHTML = `
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" width="16" height="16">
                <path fill-rule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clip-rule="evenodd" />
            </svg>
        `;
        
        sortContainer.appendChild(sortLabel);
        sortContainer.appendChild(sortSelect);
        sortContainer.appendChild(sortOrderToggle);
        
        this.elements.sortSelect = sortSelect;
        this.elements.sortOrderToggle = sortOrderToggle;
        
        return sortContainer;
    }
    
    /**
     * Create view mode toggle
     */
    createViewModeToggle() {
        const viewModeContainer = document.createElement('div');
        viewModeContainer.className = 'view-mode-toggle';
        
        // Grid view button
        const gridButton = document.createElement('button');
        gridButton.type = 'button';
        gridButton.className = 'view-mode-button active';
        gridButton.setAttribute('aria-label', 'Grid view');
        gridButton.setAttribute('data-view', 'grid');
        gridButton.innerHTML = `
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" width="16" height="16">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        `;
        
        // List view button
        const listButton = document.createElement('button');
        listButton.type = 'button';
        listButton.className = 'view-mode-button';
        listButton.setAttribute('aria-label', 'List view');
        listButton.setAttribute('data-view', 'list');
        listButton.innerHTML = `
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" width="16" height="16">
                <path fill-rule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clip-rule="evenodd" />
            </svg>
        `;
        
        viewModeContainer.appendChild(gridButton);
        viewModeContainer.appendChild(listButton);
        
        this.elements.viewModeToggle = viewModeContainer;
        
        return viewModeContainer;
    }
    
    /**
     * Create filter stats section
     */
    createFilterStats() {
        const filterStats = document.createElement('div');
        filterStats.className = 'filter-stats';
        
        if (this.options.showResultsCount) {
            const resultsCount = document.createElement('div');
            resultsCount.className = 'results-count';
            resultsCount.innerHTML = `
                Showing <span class="results-count-number">0</span> articles
            `;
            filterStats.appendChild(resultsCount);
            this.elements.resultsCount = resultsCount;
        }
        
        if (this.options.showClearFilters) {
            const clearFiltersButton = document.createElement('button');
            clearFiltersButton.type = 'button';
            clearFiltersButton.className = 'clear-filters-button';
            clearFiltersButton.textContent = 'Clear all filters';
            clearFiltersButton.disabled = true;
            filterStats.appendChild(clearFiltersButton);
            this.elements.clearFiltersButton = clearFiltersButton;
        }
        
        return filterStats;
    }
    
    /**
     * Create filter chip element
     */
    createFilterChip(type, value, isActive = false) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `filter-chip${isActive ? ' active' : ''}`;
        chip.setAttribute('data-filter-type', type);
        chip.setAttribute('data-filter-value', value);
        chip.setAttribute('aria-pressed', isActive.toString());
        
        // Icon based on filter type
        let icon = '';
        switch (type) {
            case 'category':
                icon = `<svg viewBox="0 0 20 20" fill="currentColor" class="filter-chip-icon">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>`;
                break;
            case 'tag':
                icon = `<svg viewBox="0 0 20 20" fill="currentColor" class="filter-chip-icon">
                    <path fill-rule="evenodd" d="M5.5 3A2.5 2.5 0 003 5.5v2.879a2.5 2.5 0 00.732 1.767L6.5 12.914a2.5 2.5 0 003.536 0l2.732-2.732a2.5 2.5 0 000-3.536L9.036 3.914A2.5 2.5 0 007.268 3H5.5zm0 1.5h1.768a1 1 0 01.707.293L10.707 7.5a1 1 0 010 1.414l-2.732 2.732a1 1 0 01-1.414 0L3.793 8.879A1 1 0 013.5 8.172V5.5a1 1 0 011-1z" clip-rule="evenodd" />
                    <path d="M7 7a1 1 0 100-2 1 1 0 000 2z" />
                </svg>`;
                break;
            case 'author':
                icon = `<svg viewBox="0 0 20 20" fill="currentColor" class="filter-chip-icon">
                    <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z" />
                </svg>`;
                break;
            default:
                icon = `<svg viewBox="0 0 20 20" fill="currentColor" class="filter-chip-icon">
                    <path fill-rule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clip-rule="evenodd" />
                </svg>`;
        }
        
        chip.innerHTML = `
            ${icon}
            <span>${value}</span>
            ${isActive ? `<span class="filter-chip-remove">
                <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
            </span>` : ''}
        `;
        
        return chip;
    }
    
    /**
     * Update available filters from discovery manager
     */
    updateAvailableFilters() {
        this.availableFilters = this.discoveryManager.getAvailableFilters();
        this.renderFilterChips();
    }
    
    /**
     * Render filter chips
     */
    renderFilterChips() {
        if (!this.elements.filterChipsContainer) return;
        
        this.elements.filterChipsContainer.innerHTML = '';
        
        const stats = this.discoveryManager.getFilterStats();
        const activeFilters = stats.activeFilters;
        
        // Create chips for available filters
        const allFilters = [];
        
        // Category filters
        if (this.options.showCategoryFilter) {
            this.availableFilters.categories.forEach(category => {
                const isActive = activeFilters.categories.includes(category);
                allFilters.push({
                    type: 'category',
                    value: category,
                    isActive,
                    priority: isActive ? 1 : 2
                });
            });
        }
        
        // Tag filters
        if (this.options.showTagFilter) {
            this.availableFilters.tags.forEach(tag => {
                const isActive = activeFilters.tags.includes(tag);
                allFilters.push({
                    type: 'tag',
                    value: tag,
                    isActive,
                    priority: isActive ? 1 : 2
                });
            });
        }
        
        // Author filters
        if (this.options.showAuthorFilter) {
            this.availableFilters.authors.forEach(author => {
                const isActive = activeFilters.authors.includes(author);
                allFilters.push({
                    type: 'author',
                    value: author,
                    isActive,
                    priority: isActive ? 1 : 2
                });
            });
        }
        
        // Sort filters: active first, then by type, then alphabetically
        allFilters.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            if (a.type !== b.type) return a.type.localeCompare(b.type);
            return a.value.localeCompare(b.value);
        });
        
        // Limit visible filters if specified
        const visibleFilters = this.options.maxVisibleFilters > 0 
            ? allFilters.slice(0, this.options.maxVisibleFilters)
            : allFilters;
        
        // Create and append filter chips
        visibleFilters.forEach(filter => {
            const chip = this.createFilterChip(filter.type, filter.value, filter.isActive);
            this.elements.filterChipsContainer.appendChild(chip);
        });
        
        // Add "more" indicator if there are hidden filters
        if (this.options.maxVisibleFilters > 0 && allFilters.length > this.options.maxVisibleFilters) {
            const moreChip = document.createElement('span');
            moreChip.className = 'filter-chip-more';
            moreChip.textContent = `+${allFilters.length - this.options.maxVisibleFilters} more`;
            this.elements.filterChipsContainer.appendChild(moreChip);
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Search input events
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', this.handleSearchInput);
            this.elements.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.handleSearchClear();
                }
            });
        }
        
        // Search clear button
        if (this.elements.searchClearButton) {
            this.elements.searchClearButton.addEventListener('click', this.handleSearchClear);
        }
        
        // Filter chips (using event delegation)
        if (this.elements.filterChipsContainer) {
            this.elements.filterChipsContainer.addEventListener('click', this.handleFilterChipClick);
        }
        
        // Sort controls
        if (this.elements.sortSelect) {
            this.elements.sortSelect.addEventListener('change', this.handleSortChange);
        }
        
        if (this.elements.sortOrderToggle) {
            this.elements.sortOrderToggle.addEventListener('click', this.handleSortOrderToggle);
        }
        
        // View mode toggle
        if (this.elements.viewModeToggle) {
            this.elements.viewModeToggle.addEventListener('click', this.handleViewModeToggle);
        }
        
        // Clear filters button
        if (this.elements.clearFiltersButton) {
            this.elements.clearFiltersButton.addEventListener('click', this.handleClearFilters);
        }
        
        // Click outside to close dropdowns
        document.addEventListener('click', this.handleClickOutside);
    }
    
    /**
     * Handle search input
     */
    handleSearchInput(event) {
        const query = event.target.value;
        
        // Update clear button visibility
        const container = event.target.closest('.search-input-container');
        if (query.length > 0) {
            container.classList.add('has-value');
        } else {
            container.classList.remove('has-value');
        }
        
        // Set loading state
        this.setLoadingState(true);
        
        // Update discovery manager
        this.discoveryManager.setSearchQuery(query);
    }
    
    /**
     * Handle search clear
     */
    handleSearchClear() {
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
            this.elements.searchInput.focus();
            
            const container = this.elements.searchInput.closest('.search-input-container');
            container.classList.remove('has-value');
            
            this.discoveryManager.setSearchQuery('');
        }
    }
    
    /**
     * Handle filter chip click
     */
    handleFilterChipClick(event) {
        const chip = event.target.closest('.filter-chip');
        if (!chip) return;
        
        const filterType = chip.getAttribute('data-filter-type');
        const filterValue = chip.getAttribute('data-filter-value');
        const isActive = chip.classList.contains('active');
        
        // Toggle filter
        switch (filterType) {
            case 'category':
                this.discoveryManager.toggleCategoryFilter(filterValue);
                break;
            case 'tag':
                this.discoveryManager.toggleTagFilter(filterValue);
                break;
            case 'author':
                this.discoveryManager.toggleAuthorFilter(filterValue);
                break;
        }
    }
    
    /**
     * Handle sort change
     */
    handleSortChange(event) {
        const sortBy = event.target.value;
        const currentOrder = this.discoveryManager.sortOrder;
        this.discoveryManager.setSorting(sortBy, currentOrder);
    }
    
    /**
     * Handle sort order toggle
     */
    handleSortOrderToggle() {
        const currentOrder = this.discoveryManager.sortOrder;
        const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
        const currentSort = this.discoveryManager.sortBy;
        
        this.discoveryManager.setSorting(currentSort, newOrder);
        this.updateSortOrderButton(newOrder);
    }
    
    /**
     * Handle view mode toggle
     */
    handleViewModeToggle(event) {
        const button = event.target.closest('.view-mode-button');
        if (!button) return;
        
        const viewMode = button.getAttribute('data-view');
        if (viewMode === this.currentViewMode) return;
        
        // Update UI
        this.elements.viewModeToggle.querySelectorAll('.view-mode-button').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        this.currentViewMode = viewMode;
        
        // Dispatch custom event for view mode change
        this.container.dispatchEvent(new CustomEvent('viewModeChange', {
            detail: { viewMode }
        }));
    }
    
    /**
     * Handle clear filters
     */
    handleClearFilters() {
        this.discoveryManager.clearAllFilters();
        
        // Clear search input
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
            const container = this.elements.searchInput.closest('.search-input-container');
            container.classList.remove('has-value');
        }
    }
    
    /**
     * Handle results update from discovery manager
     */
    handleResultsUpdate(results, stats) {
        this.setLoadingState(false);
        this.updateResultsCount(stats.filtered, stats.total);
        this.updateClearFiltersButton(stats.hasActiveFilters);
        this.renderFilterChips();
        
        // Dispatch custom event for results update
        this.container.dispatchEvent(new CustomEvent('resultsUpdate', {
            detail: { results, stats }
        }));
    }
    
    /**
     * Handle click outside to close dropdowns
     */
    handleClickOutside(event) {
        if (this.openDropdown && !this.openDropdown.contains(event.target)) {
            this.closeDropdown();
        }
    }
    
    /**
     * Update results count display
     */
    updateResultsCount(filtered, total) {
        if (!this.elements.resultsCount) return;
        
        const countElement = this.elements.resultsCount.querySelector('.results-count-number');
        if (countElement) {
            countElement.textContent = filtered;
        }
        
        const text = filtered === total 
            ? `Showing ${filtered} articles`
            : `Showing ${filtered} of ${total} articles`;
        
        this.elements.resultsCount.innerHTML = text.replace(filtered, `<span class="results-count-number">${filtered}</span>`);
    }
    
    /**
     * Update clear filters button state
     */
    updateClearFiltersButton(hasActiveFilters) {
        if (!this.elements.clearFiltersButton) return;
        
        this.elements.clearFiltersButton.disabled = !hasActiveFilters;
    }
    
    /**
     * Update sort order button appearance
     */
    updateSortOrderButton(order) {
        if (!this.elements.sortOrderToggle) return;
        
        const isAscending = order === 'asc';
        this.elements.sortOrderToggle.innerHTML = isAscending
            ? `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" width="16" height="16">
                <path fill-rule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04L10.75 5.612v10.638A.75.75 0 0110 17z" clip-rule="evenodd" />
            </svg>`
            : `<svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" width="16" height="16">
                <path fill-rule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clip-rule="evenodd" />
            </svg>`;
        
        this.elements.sortOrderToggle.setAttribute('aria-label', 
            isAscending ? 'Sort ascending' : 'Sort descending');
    }
    
    /**
     * Set loading state
     */
    setLoadingState(isLoading) {
        this.isLoading = isLoading;
        
        if (this.elements.discoveryContainer) {
            this.elements.discoveryContainer.classList.toggle('content-discovery-loading', isLoading);
        }
        
        if (this.elements.searchInput) {
            const container = this.elements.searchInput.closest('.search-input-container');
            container.classList.toggle('search-input-loading', isLoading);
        }
    }
    
    /**
     * Close any open dropdown
     */
    closeDropdown() {
        if (this.openDropdown) {
            this.openDropdown.classList.remove('open');
            this.openDropdown = null;
        }
    }
    
    /**
     * Get current view mode
     */
    getViewMode() {
        return this.currentViewMode;
    }
    
    /**
     * Set view mode programmatically
     */
    setViewMode(viewMode) {
        if (!['grid', 'list'].includes(viewMode)) return;
        
        const button = this.elements.viewModeToggle?.querySelector(`[data-view="${viewMode}"]`);
        if (button) {
            button.click();
        }
    }
    
    /**
     * Get current filter state
     */
    getFilterState() {
        return this.discoveryManager.getFilterStats();
    }
    
    /**
     * Update UI options
     */
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        this.createUI();
        this.setupEventListeners();
        this.updateAvailableFilters();
    }
    
    /**
     * Cleanup and destroy the UI
     */
    destroy() {
        // Remove event listeners
        document.removeEventListener('click', this.handleClickOutside);
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        // Clear references
        this.elements = {};
        this.availableFilters = {};
        this.openDropdown = null;
    }
}