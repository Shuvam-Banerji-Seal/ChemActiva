# Technology Stack

## Build System & Tools
- **Build Tool**: Vite (v6.3.5) - modern frontend build tool
- **Package Manager**: npm
- **Testing**: Jest with jsdom environment
- **Babel**: ES6+ transpilation for testing

## Frontend Stack
- **Core**: Vanilla JavaScript (ES6+ modules)
- **3D Graphics**: Three.js (v0.176.0) for 3D scenes and models
- **Animations**: 
  - GSAP (v3.13.0) for advanced animations
  - Anime.js (v4.0.2) for UI animations
- **Markdown**: Marked (v15.0.11) for content parsing
- **Security**: DOMPurify (v3.2.5) for XSS protection
- **React**: (v19.1.0) - appears to be included but not actively used

## Development Commands
```bash
# Development server
npm run dev              # Starts dev server on localhost:3000

# Build & Deploy
npm run build           # Production build
npm run preview         # Preview production build

# Testing
npm test               # Run all tests
npm run test:watch     # Watch mode testing
npm run test:coverage  # Generate coverage reports
npm run test:ci        # CI/CD testing
```

## Code Quality Standards
- **Coverage Threshold**: 80% minimum (branches, functions, lines, statements)
- **Test Environment**: jsdom for DOM testing
- **ES Modules**: All JavaScript uses ES6+ module syntax
- **Performance**: Web Vitals monitoring and optimization built-in

## Architecture Patterns
- **Module Pattern**: Each feature is a separate ES6 class/module
- **Component-Based**: Reusable UI components with cleanup methods
- **Event-Driven**: Custom events for component communication
- **Performance-First**: Lazy loading, code splitting, asset optimization