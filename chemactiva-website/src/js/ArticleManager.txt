// src/js/ArticleManager.js
// import marked from 'marked';
import { gsap } from 'gsap';

export default class ArticleManager {
    constructor(gridSelector, jsonlPath, articleType, singleArticlePage) {
        this.gridElement = document.querySelector(gridSelector);
        this.jsonlPath = jsonlPath;
        this.articleType = articleType; // 'blog' or 'research'
        this.singleArticlePage = singleArticlePage; // e.g., 'single-article.html'
        this.hasLoaded = false;

        if (!this.gridElement) {
            console.error(`Article grid element not found: ${gridSelector}`);
        }
    }

    async fetchArticles() {
        try {
            const response = await fetch(this.jsonlPath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const text = await response.text();
            return text.trim().split('\n').map(line => {
                try { return JSON.parse(line); }
                catch (e) { console.error('Error parsing JSON line:', line, e); return null; }
            }).filter(item => item !== null);
        } catch (error) {
            console.error(`Failed to fetch or parse ${this.articleType} data:`, error);
            if (this.gridElement) this.gridElement.innerHTML = `<p class="placeholder-text">Error loading ${this.articleType} entries.</p>`;
            return [];
        }
    }

    createArticleCard(article) {
        const cardLink = document.createElement('a');
        cardLink.href = `${this.singleArticlePage}?type=${this.articleType}&id=${article.id}`;
        cardLink.className = 'article-card card-style'; // Inherits .card-style, adds .article-card
        cardLink.setAttribute('aria-label', `Read more about ${article.title}`);

        const coverImage = document.createElement('img');
        coverImage.src = article.coverImage || '/assets/images/covers/default-cover.jpg'; // Fallback
        coverImage.alt = `Cover image for ${article.title}`;
        coverImage.className = 'article-card-cover-image';
        coverImage.loading = 'lazy';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'article-card-content';

        const titleH3 = document.createElement('h3');
        titleH3.className = 'article-card-title';
        titleH3.textContent = article.title;

        const metaDiv = document.createElement('div');
        metaDiv.className = 'article-card-meta';
        if (article.date) {
            const dateSpan = document.createElement('span');
            dateSpan.textContent = `📅 ${new Date(article.date).toLocaleDateString()}`;
            metaDiv.appendChild(dateSpan);
        }
        if (article.author || article.authors) {
            const authorSpan = document.createElement('span');
            authorSpan.textContent = `👤 ${Array.isArray(article.authors) ? article.authors.join(', ') : article.author}`;
            metaDiv.appendChild(authorSpan);
        }
        
        const abstractP = document.createElement('p');
        abstractP.className = 'article-card-abstract';
        abstractP.textContent = article.abstract || 'No abstract available.';

        const readMoreSpan = document.createElement('span'); // Changed to span for non-button look
        readMoreSpan.className = 'article-card-read-more';
        readMoreSpan.textContent = 'Read More ➔';
        
        contentDiv.appendChild(titleH3);
        if (metaDiv.hasChildNodes()) contentDiv.appendChild(metaDiv);
        contentDiv.appendChild(abstractP);
        contentDiv.appendChild(readMoreSpan); // Add read more at the end of content

        cardLink.appendChild(coverImage);
        cardLink.appendChild(contentDiv);
        
        return cardLink;
    }

    async loadAndDisplayArticles() {
        if (this.hasLoaded || !this.gridElement) return;
        
        const articles = await this.fetchArticles();

        if (articles.length === 0) {
            this.gridElement.innerHTML = `<p class="placeholder-text">No ${this.articleType} posts available at the moment.</p>`;
            this.hasLoaded = true;
            return;
        }

        this.gridElement.innerHTML = ''; // Clear placeholder
        const fragment = document.createDocumentFragment();
        articles.forEach(article => {
            const card = this.createArticleCard(article);
            fragment.appendChild(card);
        });
        this.gridElement.appendChild(fragment);
        this.hasLoaded = true;

        // Animate cards in
        gsap.from(".article-card", {
            opacity: 0,
            y: 50,
            scale: 0.9,
            duration: 0.5,
            stagger: 0.1,
            delay: 0.2, // Small delay for page to settle
            ease: "power2.out"
        });
    }
}