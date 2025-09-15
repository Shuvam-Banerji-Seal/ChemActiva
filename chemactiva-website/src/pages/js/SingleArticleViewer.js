// src/js/SingleArticleViewer.js
import { marked } from 'marked';
import { gsap } from 'gsap';

export default class SingleArticleViewer {
    constructor(containerSelector) {
        this.containerElement = document.querySelector(containerSelector);
        if (!this.containerElement) {
            console.error(`Container element not found: ${containerSelector}`);
        }
    }

    async fetchArticleData(type, id) {
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

        // Generate meta information
        let metaInfoHtml = '';
        if (article.date) {
            metaInfoHtml += `<span><strong>Published:</strong> ${new Date(article.date).toLocaleDateString()}</span>`;
        }
        if (article.author || article.authors) {
            const authorsText = Array.isArray(article.authors) ? article.authors.join(', ') : article.author;
            metaInfoHtml += `<span><strong>By:</strong> ${authorsText}</span>`;
        }

        // Generate tags
        let tagsHtml = '';
        if (article.tags && article.tags.length > 0) {
            tagsHtml = `<div class="article-tags"><strong>Tags:</strong> ${
                article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
            }</div>`;
        }
        
        // Simple markdown processing using marked with basic configuration
        let articleHtml;
        try {
            // Test if marked is working
            console.log('Testing marked library...');
            const testMarkdown = '# Test\n\nThis is a **test**.\n\n- Item 1\n- Item 2';
            const testHtml = marked.parse(testMarkdown);
            console.log('Test markdown result:', testHtml);
            
            // Process the actual content
            const markdownContent = article.markdownContent || '<p><em>Content is loading or not available.</em></p>';
            console.log('Processing markdown content length:', markdownContent.length);
            console.log('First 200 chars:', markdownContent.substring(0, 200));
            
            // Use basic marked configuration
            articleHtml = marked.parse(markdownContent, {
                gfm: true,
                breaks: false,
                smartLists: true,
                smartypants: true
            });
            
            console.log('Processed HTML length:', articleHtml.length);
            console.log('First 200 chars of HTML:', articleHtml.substring(0, 200));
            
        } catch (error) {
            console.error('Error processing markdown:', error);
            articleHtml = `<p><em>Error processing article content: ${error.message}</em></p>`;
        }

        // Handle cover image
        let coverImageSrc = article.coverImage;
        if (coverImageSrc && !coverImageSrc.startsWith('http') && !coverImageSrc.startsWith('data:') && !coverImageSrc.startsWith('/')) {
            coverImageSrc = `/${coverImageSrc}`;
        }

        // Render the complete article
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

        // Animate in
        gsap.from(this.containerElement, { opacity: 0, y: 20, duration: 0.5, ease: "power1.out" });
    }

    async loadArticle() {
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