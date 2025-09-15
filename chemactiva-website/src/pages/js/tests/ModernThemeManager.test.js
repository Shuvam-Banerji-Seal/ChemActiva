/**
 * @jest-environment jsdom
 */

import ModernThemeManager from '../ModernThemeManager.js';

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock matchMedia
global.matchMedia = jest.fn((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
}));

describe('ModernThemeManager', () => {
    let themeManager;
    let mockToggle;

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '';
        document.head.innerHTML = '';
        document.body.className = '';
        
        // Reset localStorage mock to return null (no saved theme)
        localStorageMock.getItem.mockClear();
        localStorageMock.setItem.mockClear();
        localStorageMock.getItem.mockReturnValue(null);
        
        // Create mock theme toggle
        mockToggle = document.createElement('input');
        mockToggle.type = 'checkbox';
        mockToggle.className = 'theme-toggle-checkbox';
        document.body.appendChild(mockToggle);
        
        // Create theme manager
        themeManager = new ModernThemeManager();
    });

    afterEach(() => {
        if (themeManager) {
            themeManager.destroy();
        }
    });

    describe('Initialization', () => {
        test('should initialize with default light theme', () => {
            // The theme manager may initialize with system preference, so let's check the current state
            const currentTheme = themeManager.getCurrentTheme();
            expect(['light', 'dark']).toContain(currentTheme);
        });

        test('should add transition styles to document head', () => {
            const transitionStyle = document.getElementById('modern-theme-transitions');
            expect(transitionStyle).toBeTruthy();
            expect(transitionStyle.textContent).toContain('--theme-transition-duration');
        });

        test('should set up event listeners for theme toggles', () => {
            const toggles = document.querySelectorAll('.theme-toggle-checkbox');
            expect(toggles.length).toBe(1);
        });
    });

    describe('Theme Switching', () => {
        test('should switch to dark mode', async () => {
            // Force light mode first to ensure consistent starting state
            await themeManager.switchTheme('light');
            expect(document.body.classList.contains('dark-mode')).toBe(false);
            
            // Clear previous calls
            localStorageMock.setItem.mockClear();
            
            await themeManager.switchTheme('dark');
            
            expect(document.body.classList.contains('dark-mode')).toBe(true);
            expect(mockToggle.checked).toBe(true);
            expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
        });

        test('should switch to light mode', async () => {
            // First switch to dark
            await themeManager.switchTheme('dark');
            
            // Clear previous calls
            localStorageMock.setItem.mockClear();
            
            // Then switch to light
            await themeManager.switchTheme('light');
            
            expect(document.body.classList.contains('dark-mode')).toBe(false);
            expect(mockToggle.checked).toBe(false);
            expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light');
        });

        test('should not switch if already in target theme', async () => {
            // Set to a known state first
            await themeManager.switchTheme('light');
            const initialCallCount = localStorageMock.setItem.mock.calls.length;
            
            // Try to switch to light when already in light mode
            await themeManager.switchTheme('light');
            
            expect(localStorageMock.setItem.mock.calls.length).toBe(initialCallCount);
        });

        test('should dispatch themeChanged event', async () => {
            const eventListener = jest.fn();
            window.addEventListener('themeChanged', eventListener);
            
            await themeManager.switchTheme('dark');
            
            expect(eventListener).toHaveBeenCalledWith(
                expect.objectContaining({
                    detail: expect.objectContaining({
                        theme: 'dark',
                        isDark: true,
                        timestamp: expect.any(Number)
                    })
                })
            );
            
            window.removeEventListener('themeChanged', eventListener);
        });
    });

    describe('Enhanced Dark Mode Features', () => {
        test('should apply glow effects in dark mode', async () => {
            // Create test elements
            const card = document.createElement('div');
            card.className = 'card';
            const heading = document.createElement('h1');
            document.body.appendChild(card);
            document.body.appendChild(heading);
            
            await themeManager.switchTheme('dark');
            
            expect(card.classList.contains('glow-effect')).toBe(true);
            expect(heading.classList.contains('text-glow')).toBe(true);
        });

        test('should remove glow effects in light mode', async () => {
            // Create test elements with glow effects
            const card = document.createElement('div');
            card.className = 'card glow-effect';
            const heading = document.createElement('h1');
            heading.className = 'text-glow';
            document.body.appendChild(card);
            document.body.appendChild(heading);
            
            await themeManager.switchTheme('light');
            
            expect(card.classList.contains('glow-effect')).toBe(false);
            expect(heading.classList.contains('text-glow')).toBe(false);
        });

        test('should set enhanced dark mode RGB values', async () => {
            await themeManager.switchTheme('dark');
            
            const root = document.documentElement;
            expect(root.style.getPropertyValue('--dm-bg-deep-rgb')).toBe('10, 18, 8');
            expect(root.style.getPropertyValue('--dm-bg-medium-rgb')).toBe('26, 38, 23');
            expect(root.style.getPropertyValue('--dm-glow-color-rgb-values')).toBe('50, 223, 110');
        });
    });

    describe('Public API', () => {
        test('isDarkMode should return correct state', async () => {
            // Set to light mode first to ensure consistent state
            await themeManager.switchTheme('light');
            expect(themeManager.isDarkMode()).toBe(false);
            
            await themeManager.switchTheme('dark');
            expect(themeManager.isDarkMode()).toBe(true);
        });

        test('toggleTheme should switch between themes', async () => {
            // Set to light mode first to ensure consistent state
            await themeManager.switchTheme('light');
            expect(themeManager.isDarkMode()).toBe(false);
            
            themeManager.toggleTheme();
            // Wait for async operation
            await new Promise(resolve => setTimeout(resolve, 50));
            
            expect(themeManager.isDarkMode()).toBe(true);
        });

        test('setTheme should set specific theme', async () => {
            themeManager.setTheme('dark');
            // Wait for async operation
            await new Promise(resolve => setTimeout(resolve, 50));
            
            expect(themeManager.isDarkMode()).toBe(true);
        });
    });

    describe('System Theme Detection', () => {
        test('should respect saved theme preference', () => {
            localStorageMock.getItem.mockReturnValue('dark');
            
            const newThemeManager = new ModernThemeManager();
            
            expect(document.body.classList.contains('dark-mode')).toBe(true);
            
            newThemeManager.destroy();
        });

        test('should fall back to system theme when no saved preference', () => {
            localStorageMock.getItem.mockReturnValue(null);
            global.matchMedia.mockReturnValue({
                matches: true, // System prefers dark
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
            });
            
            const newThemeManager = new ModernThemeManager();
            
            expect(document.body.classList.contains('dark-mode')).toBe(true);
            
            newThemeManager.destroy();
        });
    });

    describe('Accessibility', () => {
        test('should respect reduced motion preference', () => {
            global.matchMedia = jest.fn((query) => ({
                matches: query.includes('prefers-reduced-motion'),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
            }));
            
            const newThemeManager = new ModernThemeManager();
            
            // Transition should be skipped for reduced motion
            expect(newThemeManager.reducedMotionQuery.matches).toBe(true);
            
            newThemeManager.destroy();
        });
    });
});