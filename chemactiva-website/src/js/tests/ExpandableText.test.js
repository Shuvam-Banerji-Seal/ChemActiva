// src/js/tests/ExpandableText.test.js
import ExpandableText from '../ExpandableText.js';

// Mock DOM methods
Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
        fontFamily: 'Arial',
        fontSize: '16px',
        lineHeight: '24px'
    })
});

describe('ExpandableText', () => {
    let container;
    let expandableText;

    beforeEach(() => {
        // Create a container element
        container = document.createElement('p');
        container.textContent = 'This is a very long text that should be truncated when it exceeds the maximum number of lines. It contains multiple sentences to test the expandable functionality properly.';
        document.body.appendChild(container);
    });

    afterEach(() => {
        if (expandableText) {
            expandableText.destroy();
        }
        if (container && container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });

    describe('Initialization', () => {
        test('should initialize with default options', () => {
            expandableText = new ExpandableText(container);
            
            expect(expandableText.options.maxLines).toBe(3);
            expect(expandableText.options.readMoreText).toBe('Read more');
            expect(expandableText.options.readLessText).toBe('Read less');
            expect(expandableText.options.animationDuration).toBe(300);
            expect(expandableText.options.enableAnimation).toBe(true);
        });

        test('should initialize with custom options', () => {
            const customOptions = {
                maxLines: 5,
                readMoreText: 'Show more',
                readLessText: 'Show less',
                animationDuration: 500,
                enableAnimation: false
            };

            expandableText = new ExpandableText(container, customOptions);
            
            expect(expandableText.options.maxLines).toBe(5);
            expect(expandableText.options.readMoreText).toBe('Show more');
            expect(expandableText.options.readLessText).toBe('Show less');
            expect(expandableText.options.animationDuration).toBe(500);
            expect(expandableText.options.enableAnimation).toBe(false);
        });

        test('should store original text', () => {
            expandableText = new ExpandableText(container);
            
            expect(expandableText.originalText).toBe(container.textContent.trim());
        });
    });

    describe('Text Truncation Logic', () => {
        test('should determine if text needs truncation based on word count', () => {
            const shortText = 'Short text';
            const longText = 'This is a very long text that contains many words and should definitely be truncated when using word-based truncation with a low word limit.';
            
            const shortContainer = document.createElement('p');
            shortContainer.textContent = shortText;
            
            const longContainer = document.createElement('p');
            longContainer.textContent = longText;
            
            const shortExpandable = new ExpandableText(shortContainer, { 
                truncateWords: true, 
                wordLimit: 10 
            });
            
            const longExpandable = new ExpandableText(longContainer, { 
                truncateWords: true, 
                wordLimit: 10 
            });
            
            expect(shortExpandable.shouldTruncate()).toBe(false);
            expect(longExpandable.shouldTruncate()).toBe(true);
            
            shortExpandable.destroy();
            longExpandable.destroy();
        });

        test('should generate truncated text correctly', () => {
            expandableText = new ExpandableText(container, {
                truncateWords: true,
                wordLimit: 5
            });
            
            const truncated = expandableText.getTruncatedText();
            const words = truncated.replace('...', '').split(/\s+/);
            
            expect(words.length).toBeLessThanOrEqual(5);
            expect(truncated).toContain('...');
        });
    });

    describe('DOM Structure Creation', () => {
        test('should create proper DOM structure when text needs truncation', () => {
            // Mock shouldTruncate to return true
            expandableText = new ExpandableText(container);
            expandableText.shouldTruncate = jest.fn().mockReturnValue(true);
            expandableText.setupExpandableText();
            
            expect(container.classList.contains('expandable-text-container')).toBe(true);
            expect(container.querySelector('.expandable-text-content')).toBeTruthy();
            expect(container.querySelector('.expandable-text-button')).toBeTruthy();
        });

        test('should set correct initial state', () => {
            expandableText = new ExpandableText(container);
            expandableText.shouldTruncate = jest.fn().mockReturnValue(true);
            expandableText.setupExpandableText();
            
            const button = container.querySelector('.expandable-text-button');
            
            expect(expandableText.isExpanded).toBe(false);
            expect(button.getAttribute('aria-expanded')).toBe('false');
            expect(button.textContent).toBe(expandableText.options.readMoreText);
            expect(container.classList.contains('collapsed')).toBe(true);
        });
    });

    describe('Toggle Functionality', () => {
        beforeEach(() => {
            expandableText = new ExpandableText(container);
            expandableText.shouldTruncate = jest.fn().mockReturnValue(true);
            expandableText.setupExpandableText();
        });

        test('should toggle expanded state', async () => {
            expect(expandableText.isExpanded).toBe(false);
            
            await expandableText.toggle();
            
            expect(expandableText.isExpanded).toBe(true);
            expect(container.classList.contains('expanded')).toBe(true);
            expect(container.classList.contains('collapsed')).toBe(false);
        });

        test('should update button text and aria attributes on toggle', async () => {
            const button = container.querySelector('.expandable-text-button');
            
            expect(button.textContent).toBe('Read more');
            expect(button.getAttribute('aria-expanded')).toBe('false');
            
            await expandableText.toggle();
            
            expect(button.textContent).toBe('Read less');
            expect(button.getAttribute('aria-expanded')).toBe('true');
        });

        test('should dispatch custom event on toggle', async () => {
            let eventFired = false;
            let eventDetail = null;
            
            container.addEventListener('expandableTextToggle', (e) => {
                eventFired = true;
                eventDetail = e.detail;
            });
            
            await expandableText.toggle();
            
            expect(eventFired).toBe(true);
            expect(eventDetail.isExpanded).toBe(true);
            expect(eventDetail.element).toBe(container);
        });
    });

    describe('Button Interactions', () => {
        beforeEach(() => {
            expandableText = new ExpandableText(container);
            expandableText.shouldTruncate = jest.fn().mockReturnValue(true);
            expandableText.setupExpandableText();
        });

        test('should handle click events', async () => {
            const button = container.querySelector('.expandable-text-button');
            const toggleSpy = jest.spyOn(expandableText, 'toggle');
            
            button.click();
            
            expect(toggleSpy).toHaveBeenCalled();
        });

        test('should handle keyboard events', async () => {
            const button = container.querySelector('.expandable-text-button');
            const toggleSpy = jest.spyOn(expandableText, 'toggle');
            
            // Test Enter key
            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            button.dispatchEvent(enterEvent);
            
            expect(toggleSpy).toHaveBeenCalled();
            
            toggleSpy.mockClear();
            
            // Test Space key
            const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
            button.dispatchEvent(spaceEvent);
            
            expect(toggleSpy).toHaveBeenCalled();
        });
    });

    describe('Public Methods', () => {
        beforeEach(() => {
            expandableText = new ExpandableText(container);
            expandableText.shouldTruncate = jest.fn().mockReturnValue(true);
            expandableText.setupExpandableText();
        });

        test('should expand text', async () => {
            expect(expandableText.isExpanded).toBe(false);
            
            await expandableText.expand();
            
            expect(expandableText.isExpanded).toBe(true);
        });

        test('should collapse text', async () => {
            await expandableText.expand();
            expect(expandableText.isExpanded).toBe(true);
            
            await expandableText.collapse();
            
            expect(expandableText.isExpanded).toBe(false);
        });

        test('should not expand if already expanded', async () => {
            await expandableText.expand();
            const toggleSpy = jest.spyOn(expandableText, 'toggle');
            
            await expandableText.expand();
            
            expect(toggleSpy).not.toHaveBeenCalled();
        });

        test('should not collapse if already collapsed', async () => {
            const toggleSpy = jest.spyOn(expandableText, 'toggle');
            
            await expandableText.collapse();
            
            expect(toggleSpy).not.toHaveBeenCalled();
        });
    });

    describe('Configuration Updates', () => {
        beforeEach(() => {
            expandableText = new ExpandableText(container);
        });

        test('should update options', () => {
            const newOptions = {
                maxLines: 5,
                readMoreText: 'Show more'
            };
            
            expandableText.updateOptions(newOptions);
            
            expect(expandableText.options.maxLines).toBe(5);
            expect(expandableText.options.readMoreText).toBe('Show more');
            expect(expandableText.options.readLessText).toBe('Read less'); // Should keep original
        });

        test('should update text content', () => {
            const newText = 'This is completely new text content that is different from the original.';
            
            expandableText.updateText(newText);
            
            expect(expandableText.originalText).toBe(newText);
        });
    });

    describe('State Information', () => {
        beforeEach(() => {
            expandableText = new ExpandableText(container);
        });

        test('should return current state', () => {
            const state = expandableText.getState();
            
            expect(state).toHaveProperty('isExpanded');
            expect(state).toHaveProperty('originalText');
            expect(state).toHaveProperty('truncatedText');
            expect(state).toHaveProperty('shouldTruncate');
            
            expect(state.isExpanded).toBe(false);
            expect(state.originalText).toBe(container.textContent.trim());
        });
    });

    describe('Static Methods', () => {
        test('should create instances from selector', () => {
            // Create multiple elements
            const element1 = document.createElement('p');
            element1.className = 'test-expandable';
            element1.textContent = 'Test text 1';
            
            const element2 = document.createElement('p');
            element2.className = 'test-expandable';
            element2.textContent = 'Test text 2';
            
            document.body.appendChild(element1);
            document.body.appendChild(element2);
            
            const instances = ExpandableText.createFromSelector('.test-expandable');
            
            expect(instances).toHaveLength(2);
            expect(instances[0]).toBeInstanceOf(ExpandableText);
            expect(instances[1]).toBeInstanceOf(ExpandableText);
            
            // Cleanup
            instances.forEach(instance => instance.destroy());
            document.body.removeChild(element1);
            document.body.removeChild(element2);
        });

        test('should create instances for article abstracts with default options', () => {
            const abstract = document.createElement('p');
            abstract.className = 'modern-article-abstract';
            abstract.textContent = 'This is an article abstract that should be expandable.';
            
            document.body.appendChild(abstract);
            
            const instances = ExpandableText.createForArticleAbstracts();
            
            expect(instances).toHaveLength(1);
            expect(instances[0].options.maxLines).toBe(3);
            expect(instances[0].options.readMoreText).toBe('Read more');
            expect(instances[0].options.readLessText).toBe('Show less');
            
            // Cleanup
            instances[0].destroy();
            document.body.removeChild(abstract);
        });
    });

    describe('Cleanup', () => {
        test('should clean up properly on destroy', () => {
            expandableText = new ExpandableText(container);
            expandableText.shouldTruncate = jest.fn().mockReturnValue(true);
            expandableText.setupExpandableText();
            
            expect(container.classList.contains('expandable-text-container')).toBe(true);
            expect(container.querySelector('.expandable-text-content')).toBeTruthy();
            
            expandableText.destroy();
            
            expect(container.classList.contains('expandable-text-container')).toBe(false);
            expect(container.innerHTML).toBe('');
            expect(expandableText.textContainer).toBeNull();
            expect(expandableText.expandButton).toBeNull();
        });
    });
});