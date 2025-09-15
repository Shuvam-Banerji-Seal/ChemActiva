/**
 * SEOManager - Comprehensive SEO optimization and meta tag management
 * Handles dynamic meta tags, Open Graph, Twitter Cards, and structured data
 */
export default class SEOManager {
    constructor(options = {}) {
        this.config = {
            siteName: options.siteName || 'ChemActiva',
            siteUrl: options.siteUrl || 'https://chemactiva.com',
            defaultDescription: options.defaultDescription || 'Leading provider of innovative chemical solutions and research services.',
            defaultImage: options.defaultImage || '/assets/images/og-default.svg',
            twitterHandle: options.twitterHandle || '@chemactiva',
            enableStructuredData: options.enableStructuredData !== false,
            enableOpenGraph: options.enableOpenGraph !== false,
            enableTwitterCards: options.enableTwitterCards !== false,
            enableLogging: options.enableLogging !== false,
            ...options
        };

        this.structuredDataCache = new Map();
        this.metaTagsCache = new Map();
        
        this.init();
    }

    init() {
        // Set up base meta tags that should be present on every page
        this.setBaseMeta();
        
        // Set up structured data for the organization
        this.setOrganizationStructuredData();
        
        if (this.config.enableLogging) {
            console.log('[SEOManager] Initialized with comprehensive SEO features');
        }
    }

    setBaseMeta() {
        // Viewport and mobile optimization
        this.setMetaTag('viewport', 'width=device-width, initial-scale=1.0');
        
        // Character encoding
        this.setMetaTag('charset', 'utf-8');
        
        // Theme color for mobile browsers
        this.setMetaTag('theme-color', '#1a365d');
        
        // Prevent zoom on iOS
        this.setMetaTag('format-detection', 'telephone=no');
        
        // Canonical URL (will be updated per page)
        this.setCanonicalUrl(window.location.href);
        
        // Robots meta (default to index, follow)
        this.setMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
        
        // Site verification tags (add your actual verification codes)
        // this.setMetaTag('google-site-verification', 'YOUR_GOOGLE_VERIFICATION_CODE');
        // this.setMetaTag('msvalidate.01', 'YOUR_BING_VERIFICATION_CODE');
    }

    setPageMeta(pageData) {
        const {
            title,
            description,
            keywords,
            image,
            url,
            type = 'website',
            author,
            publishedTime,
            modifiedTime,
            section
        } = pageData;

        // Set document title
        if (title) {
            document.title = `${title} | ${this.config.siteName}`;
            this.setMetaTag('title', title);
        }

        // Set description
        const metaDescription = description || this.config.defaultDescription;
        this.setMetaTag('description', metaDescription);

        // Set keywords
        if (keywords) {
            this.setMetaTag('keywords', Array.isArray(keywords) ? keywords.join(', ') : keywords);
        }

        // Set author
        if (author) {
            this.setMetaTag('author', author);
        }

        // Set canonical URL
        if (url) {
            this.setCanonicalUrl(url);
        }

        // Set Open Graph tags
        if (this.config.enableOpenGraph) {
            this.setOpenGraphTags({
                title: title || this.config.siteName,
                description: metaDescription,
                image: image || this.config.defaultImage,
                url: url || window.location.href,
                type,
                siteName: this.config.siteName,
                publishedTime,
                modifiedTime,
                section
            });
        }

        // Set Twitter Card tags
        if (this.config.enableTwitterCards) {
            this.setTwitterCardTags({
                title: title || this.config.siteName,
                description: metaDescription,
                image: image || this.config.defaultImage,
                url: url || window.location.href
            });
        }

        if (this.config.enableLogging) {
            console.log('[SEOManager] Updated page meta for:', title);
        }
    }

    setMetaTag(name, content, useProperty = false) {
        if (!content) return;

        const attribute = useProperty ? 'property' : 'name';
        let meta = document.querySelector(`meta[${attribute}="${name}"]`);
        
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute(attribute, name);
            document.head.appendChild(meta);
        }
        
        meta.setAttribute('content', content);
        this.metaTagsCache.set(name, content);
    }

    setCanonicalUrl(url) {
        let canonical = document.querySelector('link[rel="canonical"]');
        
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        
        canonical.setAttribute('href', url);
    }

    setOpenGraphTags(data) {
        const {
            title,
            description,
            image,
            url,
            type,
            siteName,
            publishedTime,
            modifiedTime,
            section
        } = data;

        this.setMetaTag('og:title', title, true);
        this.setMetaTag('og:description', description, true);
        this.setMetaTag('og:image', this.resolveImageUrl(image), true);
        this.setMetaTag('og:url', url, true);
        this.setMetaTag('og:type', type, true);
        this.setMetaTag('og:site_name', siteName, true);
        
        // Article-specific tags
        if (type === 'article') {
            if (publishedTime) {
                this.setMetaTag('article:published_time', publishedTime, true);
            }
            if (modifiedTime) {
                this.setMetaTag('article:modified_time', modifiedTime, true);
            }
            if (section) {
                this.setMetaTag('article:section', section, true);
            }
        }

        // Additional image properties for better social sharing
        this.setMetaTag('og:image:width', '1200', true);
        this.setMetaTag('og:image:height', '630', true);
        this.setMetaTag('og:image:type', 'image/png', true);
    }

    setTwitterCardTags(data) {
        const { title, description, image, url } = data;

        this.setMetaTag('twitter:card', 'summary_large_image');
        this.setMetaTag('twitter:site', this.config.twitterHandle);
        this.setMetaTag('twitter:title', title);
        this.setMetaTag('twitter:description', description);
        this.setMetaTag('twitter:image', this.resolveImageUrl(image));
        this.setMetaTag('twitter:url', url);
    }

    resolveImageUrl(imagePath) {
        if (!imagePath) return this.config.defaultImage;
        
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http')) return imagePath;
        
        // If it's a relative path, make it absolute
        if (imagePath.startsWith('/')) {
            return `${this.config.siteUrl}${imagePath}`;
        }
        
        // If it's a relative path without leading slash
        return `${this.config.siteUrl}/${imagePath}`;
    }

    setOrganizationStructuredData() {
        if (!this.config.enableStructuredData) return;

        const organizationData = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": this.config.siteName,
            "url": this.config.siteUrl,
            "logo": this.resolveImageUrl("/assets/images/logo.png"),
            "description": this.config.defaultDescription,
            "sameAs": [
                // Add your social media URLs
                "https://linkedin.com/company/chemactiva",
                "https://twitter.com/chemactiva"
            ],
            "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "Customer Service",
                "availableLanguage": "English"
            }
        };

        this.addStructuredData('organization', organizationData);
    }

    setWebsiteStructuredData() {
        if (!this.config.enableStructuredData) return;

        const websiteData = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": this.config.siteName,
            "url": this.config.siteUrl,
            "description": this.config.defaultDescription,
            "potentialAction": {
                "@type": "SearchAction",
                "target": {
                    "@type": "EntryPoint",
                    "urlTemplate": `${this.config.siteUrl}/search?q={search_term_string}`
                },
                "query-input": "required name=search_term_string"
            }
        };

        this.addStructuredData('website', websiteData);
    }

    setArticleStructuredData(articleData) {
        if (!this.config.enableStructuredData) return;

        const {
            title,
            description,
            author,
            publishedDate,
            modifiedDate,
            image,
            url,
            category
        } = articleData;

        const articleStructuredData = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": title,
            "description": description,
            "image": this.resolveImageUrl(image),
            "url": url || window.location.href,
            "datePublished": publishedDate,
            "dateModified": modifiedDate || publishedDate,
            "author": {
                "@type": "Person",
                "name": author
            },
            "publisher": {
                "@type": "Organization",
                "name": this.config.siteName,
                "logo": {
                    "@type": "ImageObject",
                    "url": this.resolveImageUrl("/assets/images/logo.png")
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": url || window.location.href
            }
        };

        if (category) {
            articleStructuredData.articleSection = category;
        }

        this.addStructuredData('article', articleStructuredData);
    }

    setProductStructuredData(productData) {
        if (!this.config.enableStructuredData) return;

        const {
            name,
            description,
            image,
            brand,
            category,
            offers,
            aggregateRating,
            reviews
        } = productData;

        const productStructuredData = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": name,
            "description": description,
            "image": this.resolveImageUrl(image),
            "brand": {
                "@type": "Brand",
                "name": brand || this.config.siteName
            },
            "category": category
        };

        if (offers) {
            productStructuredData.offers = {
                "@type": "Offer",
                "price": offers.price,
                "priceCurrency": offers.currency || "USD",
                "availability": `https://schema.org/${offers.availability || "InStock"}`,
                "seller": {
                    "@type": "Organization",
                    "name": this.config.siteName
                }
            };
        }

        if (aggregateRating) {
            productStructuredData.aggregateRating = {
                "@type": "AggregateRating",
                "ratingValue": aggregateRating.value,
                "reviewCount": aggregateRating.count,
                "bestRating": aggregateRating.best || 5,
                "worstRating": aggregateRating.worst || 1
            };
        }

        if (reviews && reviews.length > 0) {
            productStructuredData.review = reviews.map(review => ({
                "@type": "Review",
                "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": review.rating,
                    "bestRating": 5
                },
                "author": {
                    "@type": "Person",
                    "name": review.author
                },
                "reviewBody": review.text,
                "datePublished": review.date
            }));
        }

        this.addStructuredData('product', productStructuredData);
    }

    setBreadcrumbStructuredData(breadcrumbs) {
        if (!this.config.enableStructuredData || !breadcrumbs.length) return;

        const breadcrumbData = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbs.map((crumb, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "name": crumb.name,
                "item": crumb.url ? this.config.siteUrl + crumb.url : undefined
            }))
        };

        this.addStructuredData('breadcrumb', breadcrumbData);
    }

    addStructuredData(id, data) {
        // Remove existing structured data with the same ID
        this.removeStructuredData(id);

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = `structured-data-${id}`;
        script.textContent = JSON.stringify(data, null, 2);
        
        document.head.appendChild(script);
        this.structuredDataCache.set(id, data);

        if (this.config.enableLogging) {
            console.log(`[SEOManager] Added structured data for: ${id}`);
        }
    }

    removeStructuredData(id) {
        const existingScript = document.getElementById(`structured-data-${id}`);
        if (existingScript) {
            existingScript.remove();
            this.structuredDataCache.delete(id);
        }
    }

    // Page-specific SEO methods
    setHomepageSEO() {
        this.setPageMeta({
            title: 'Chemical Solutions & Research Services',
            description: 'ChemActiva provides innovative chemical solutions, research services, and high-quality products for industries worldwide. Discover our expertise in chemical innovation.',
            keywords: ['chemical solutions', 'research services', 'chemical products', 'innovation', 'chemistry'],
            type: 'website'
        });

        this.setWebsiteStructuredData();
    }

    setProductsSEO() {
        this.setPageMeta({
            title: 'Chemical Products & Solutions',
            description: 'Explore our comprehensive range of chemical products and solutions designed for various industries. Quality, innovation, and reliability in every product.',
            keywords: ['chemical products', 'industrial chemicals', 'laboratory chemicals', 'chemical solutions'],
            type: 'website'
        });
    }

    setTeamSEO() {
        this.setPageMeta({
            title: 'Our Expert Team',
            description: 'Meet the experienced team of chemists, researchers, and industry experts behind ChemActiva\'s innovative solutions and exceptional service.',
            keywords: ['team', 'chemists', 'researchers', 'experts', 'chemistry professionals'],
            type: 'website'
        });
    }

    setResearchSEO() {
        this.setPageMeta({
            title: 'Research & Development',
            description: 'Discover ChemActiva\'s cutting-edge research and development initiatives driving chemical innovation and advancing industry standards.',
            keywords: ['research', 'development', 'innovation', 'chemical research', 'R&D'],
            type: 'website'
        });
    }

    setBlogSEO() {
        this.setPageMeta({
            title: 'Chemical Industry Insights & News',
            description: 'Stay informed with the latest chemical industry insights, research findings, and technical articles from ChemActiva\'s expert team.',
            keywords: ['chemical industry', 'news', 'insights', 'research', 'articles'],
            type: 'website'
        });
    }

    setJourneySEO() {
        this.setPageMeta({
            title: 'Our Journey & Company History',
            description: 'Learn about ChemActiva\'s journey from startup to industry leader, our milestones, achievements, and commitment to chemical innovation.',
            keywords: ['company history', 'journey', 'milestones', 'achievements', 'chemical company'],
            type: 'website'
        });
    }

    // Utility methods
    generateMetaDescription(content, maxLength = 160) {
        if (!content) return this.config.defaultDescription;
        
        // Remove HTML tags and extra whitespace
        const cleanContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        
        if (cleanContent.length <= maxLength) return cleanContent;
        
        // Truncate at word boundary
        const truncated = cleanContent.substring(0, maxLength);
        const lastSpace = truncated.lastIndexOf(' ');
        
        return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
    }

    validateStructuredData() {
        // Simple validation of structured data
        const errors = [];
        
        this.structuredDataCache.forEach((data, id) => {
            if (!data['@context']) {
                errors.push(`Missing @context in ${id}`);
            }
            if (!data['@type']) {
                errors.push(`Missing @type in ${id}`);
            }
        });

        if (errors.length > 0 && this.config.enableLogging) {
            console.warn('[SEOManager] Structured data validation errors:', errors);
        }

        return errors;
    }

    // Public API methods
    getCurrentMeta() {
        return Object.fromEntries(this.metaTagsCache);
    }

    getCurrentStructuredData() {
        return Object.fromEntries(this.structuredDataCache);
    }

    clearAllMeta() {
        // Remove all meta tags we've created
        this.metaTagsCache.forEach((_, name) => {
            const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
            if (meta) meta.remove();
        });
        
        this.metaTagsCache.clear();
    }

    clearAllStructuredData() {
        this.structuredDataCache.forEach((_, id) => {
            this.removeStructuredData(id);
        });
    }

    // Static factory method
    static create(options = {}) {
        return new SEOManager(options);
    }
}