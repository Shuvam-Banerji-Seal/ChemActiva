# Project Structure

## Root Level Organization
```
├── src/                    # Source code
├── public/                 # Static assets and data
├── scripts/               # Build and utility scripts
├── *.html                 # Page templates (index, products, blog, etc.)
└── config files           # Vite, Jest, Babel configurations
```

## Source Code Structure (`src/`)
```
src/
├── css/                   # Stylesheets (modular CSS architecture)
│   ├── base.css          # Reset, typography, base styles
│   ├── theme.css         # CSS custom properties, theming
│   ├── layout.css        # Grid, flexbox, layout utilities
│   ├── components.css    # Reusable UI components
│   └── [feature].css     # Feature-specific styles
└── js/                   # JavaScript modules
    ├── App.js            # Main application controller
    ├── main.js           # Entry point
    ├── [Feature]Manager.js # Feature managers (Team, Product, etc.)
    └── tests/            # Jest test files
```

## Public Assets (`public/`)
```
public/
├── assets/
│   ├── images/           # Optimized images (WebP + JPEG fallbacks)
│   │   ├── products/     # Product photography
│   │   └── team/         # Team member photos
│   ├── models/           # 3D models (.glb format)
│   ├── resources/        # PDFs, datasheets
│   └── textures/         # 3D scene textures
└── *.jsonl               # Data files (team, journey, blog)
```

## Naming Conventions
- **Files**: PascalCase for classes (`ProductManager.js`), kebab-case for CSS (`fab-mobile-menu.css`)
- **Classes**: PascalCase (`class ProductImageGallery`)
- **Methods**: camelCase (`initProductPageComponents()`)
- **CSS Classes**: kebab-case (`.product-card-enhanced`)
- **IDs**: kebab-case (`#hero-3d-scene-container`)

## Page Architecture
- **Multi-page Application**: Separate HTML files for different sections
- **Shared Components**: Common UI elements across pages
- **Conditional Loading**: Page-specific JavaScript modules loaded based on body classes
- **Progressive Enhancement**: Core functionality works without JavaScript

## Data Management
- **JSONL Format**: Structured data in JSON Lines format
- **Static Data**: Team, journey, blog content served as static files
- **Dynamic Loading**: Asynchronous data fetching with error handling

## Asset Optimization
- **Images**: WebP with JPEG fallbacks, lazy loading
- **3D Models**: Optimized GLB format
- **Code Splitting**: Dynamic imports for non-critical features
- **Performance Monitoring**: Built-in Web Vitals tracking