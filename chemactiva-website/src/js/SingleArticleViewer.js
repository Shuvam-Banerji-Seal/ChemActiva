// src/js/SingleArticleViewer.js
import { marked } from 'marked';
import { gsap } from 'gsap';
import DOMPurify from 'dompurify'; // If you decide to use it

export default class SingleArticleViewer {
    // ... (constructor and fetchArticleData remain the same as the last version I provided)
    constructor(containerSelector) {
        this.containerElement = document.querySelector(containerSelector);
        // ... (rest of constructor)
        // No need for new EnhancedMarkdownRenderer() here if we embed logic
    }

    async fetchArticleData(type, id) {
        // ... (same as your last working version)
        const jsonlPath = type === 'blog' ? '/blog.jsonl' : '/research.jsonl';
        try {
            const response = await fetch(jsonlPath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            const articles = text.trim().split('\n').map(line => JSON.parse(line));
            const article = articles.find(art => art.id === id);
            
            if (article && article.markdownContentFile) {
                const mdResponse = await fetch(article.markdownContentFile);
                if (!mdResponse.ok) {
                    console.error(`Markdown file not found or could not be fetched: ${article.markdownContentFile}`);
                    article.markdownContent = `<p><em>Error: Could not load article content from ${article.markdownContentFile}.</em></p>`;
                } else {
                    article.markdownContent = await mdResponse.text();
                }
            } else if (article && !article.markdownContentFile) {
                console.warn("Article found but no markdownContentFile specified.");
                article.markdownContent = "<p><em>Content not available for this article.</em></p>";
            } else if (!article) {
                console.error(`Article with id '${id}' of type '${type}' not found in ${jsonlPath}`);
                return null;
            }
            return article;
        } catch (error) {
            console.error("Failed to fetch article data:", error);
            return null;
        }
    }


    renderArticle(article) {
        if (!this.containerElement) {
            console.error("Container element is null in renderArticle. Cannot render.");
            return;
        }
        if (!article) {
            this.containerElement.innerHTML = '<p class="placeholder-text">Article not found or failed to load.</p>';
            document.title = "Article Not Found – ChemActiva";
            return;
        }

        document.title = `${article.title} – ChemActiva`;

        let metaInfoHtml = '';
        // ... (meta info HTML generation - same as before)
        if (article.date) {
            metaInfoHtml += `<span><strong>Published:</strong> ${new Date(article.date).toLocaleDateString()}</span>`;
        }
        if (article.author || article.authors) {
            const authorsText = Array.isArray(article.authors) ? article.authors.join(', ') : article.author;
            metaInfoHtml += `<span><strong>By:</strong> ${authorsText}</span>`;
        }
        // ... (other meta fields)


        let tagsHtml = '';
        // ... (tags HTML generation - same as before)
        if (article.tags && article.tags.length > 0) {
            tagsHtml = `<div class="article-tags"><strong>Tags:</strong> ${
                article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
            }</div>`;
        }
        
        const renderer = new marked.Renderer();
        const originalParagraphRenderer = renderer.paragraph?.bind(renderer);
        const originalImageRenderer = renderer.image?.bind(renderer);
        // const originalLinkRenderer = renderer.link?.bind(renderer);
        // const originalHeadingRenderer = renderer.heading?.bind(renderer);
        // const originalBlockquoteRenderer = renderer.blockquote?.bind(renderer);

        renderer.image = (href, title, text) => {
            if (typeof href !== 'string') {
                return originalImageRenderer ? originalImageRenderer(href, title, text) : `<!-- Invalid image href: ${text} -->`;
            }
            const titleAttr = title ? ` title="${title}"` : '';
            let finalSrc = href;
            if (href && !href.startsWith('http') && !href.startsWith('data:')) {
                finalSrc = href.startsWith('/') ? href : `/${href}`;
            }
            return `<img src="${finalSrc}" alt="${text}"${titleAttr} loading="lazy" class="article-body-image">`;
        };
    
        // Enhanced Video Paragraph Renderer
        renderer.paragraph = (text) => {
            if (typeof text !== 'string') {
                return originalParagraphRenderer ? originalParagraphRenderer(text) : `<p>${String(text)}</p>`;
            }
            
            // Regex to find [video src="path/to/video.mp4" attribute="value" ...]
            // It will process multiple video tags if they are the only content of separate paragraphs.
            // If a video tag is inline with other text, it won't be processed by this paragraph renderer.
            const videoRegex = /^\s*\[video\s+src="([^"]+)"((?:\s+\w+(=("[^"]*"|'[^']*'|[\w-]+))?)*)\s*\]\s*$/i;
            const match = text.match(videoRegex);

            if (match) {
                let src = match[1];
                const optionsString = match[2] || '';
                let attributes = '';

                // Basic attribute parsing from optionsString
                if (optionsString.includes('controls')) attributes += ' controls';
                if (optionsString.includes('autoplay')) attributes += ' autoplay';
                if (optionsString.includes('loop')) attributes += ' loop';
                if (optionsString.includes('muted')) attributes += ' muted';

                const widthMatch = optionsString.match(/width\s*=\s*["']?(\d+%?)["']?/i);
                if (widthMatch) attributes += ` width="${widthMatch[1]}"`;
                
                const heightMatch = optionsString.match(/height\s*=\s*["']?(\d+%?)["']?/i);
                if (heightMatch) attributes += ` height="${heightMatch[1]}"`;

                const posterMatch = optionsString.match(/poster\s*=\s*["']?([^"']+)["']?/i);
                if (posterMatch) {
                    let posterSrc = posterMatch[1];
                     if (posterSrc && !posterSrc.startsWith('http') && !posterSrc.startsWith('data:')) {
                        posterSrc = posterSrc.startsWith('/') ? posterSrc : `/${posterSrc}`;
                    }
                    attributes += ` poster="${posterSrc}"`;
                }
                
                // Resolve video src path
                if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                    src = src.startsWith('/') ? src : `/${src}`;
                }

                return `<div class="video-container"><video src="${src}"${attributes} class="article-body-video">Your browser does not support the video tag.</video></div>`;
            }
            // If not a video tag paragraph, use the original paragraph renderer
            return originalParagraphRenderer ? originalParagraphRenderer(text) : `<p>${text}</p>`;
        };
        
        // You can add other custom renderers from your EnhancedMarkdownRenderer here if needed (heading, link, etc.)
        // For example, for headings with anchors:
        renderer.heading = (text, level, raw, slugger) => {
          if (typeof text !== 'string') {
            return `<h${level}>${text}</h${level}>`;
          }
          const escapedText = slugger.slug(raw); 
          return `
            <h${level} id="${escapedText}">
              ${text}
              <a class="anchor-link" href="#${escapedText}" aria-label="Link to section ${text}" aria-hidden="true">
                <span class="link-icon">#</span>
              </a>
            </h${level}>`;
        };


        // Configure marked options (can be done once globally or per parse call)
        const markedOptions = {
          renderer: renderer,
          headerIds: false, // Since we handle IDs in custom heading renderer
          gfm: true,
          breaks: false,
          pedantic: false,
          smartLists: true,
          smartypants: true,
        };
        
        const articleHtml = marked.parse(article.markdownContent || '<p><em>Content is loading or not available.</em></p>', markedOptions);

        let coverImageSrc = article.coverImage;
        // ... (cover image src resolution - same as before) ...
        if (coverImageSrc && !coverImageSrc.startsWith('http') && !coverImageSrc.startsWith('data:') && !coverImageSrc.startsWith('/')) {
            coverImageSrc = `/${coverImageSrc}`;
        }


        this.containerElement.innerHTML = `
            <div class="article-header">
                <h1>${article.title}</h1>
                ${metaInfoHtml ? `<div class="article-meta-info">${metaInfoHtml}</div>` : ''}
            </div>
            ${coverImageSrc ? `<img src="${coverImageSrc}" alt="Cover for ${article.title}" class="article-cover-image-full">` : ''}
            <div class="article-body">
                ${articleHtml}
            </div>
            ${tagsHtml}
            <a href="/${this.articleType}.html" class="back-to-list-link">← Back to all ${this.articleType === 'blog' ? 'posts' : 'articles'}</a>
        `;

        gsap.from(this.containerElement, { opacity: 0, y: 20, duration: 0.5, ease: "power1.out" });
    }

    async loadArticle() {
        // ... (same as your last working version) ...
        if (!this.containerElement) return;

        const urlParams = new URLSearchParams(window.location.search);
        const articleId = urlParams.get('id');
        const articleTypeParam = urlParams.get('type'); 
        this.articleType = articleTypeParam; 

        if (!articleId || !this.articleType) {
            this.containerElement.innerHTML = '<p class="placeholder-text">Article identifier or type missing.</p>';
            document.title = "Error – ChemActiva";
            return;
        }

        this.containerElement.innerHTML = '<p class="placeholder-text">Loading article...</p>';

        const articleData = await this.fetchArticleData(this.articleType, articleId);
        this.renderArticle(articleData);
    }
}