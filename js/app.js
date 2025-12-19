// AIverse - Professional AI Tools Directory JavaScript

// Global App State
window.AIverseApp = {
    isLoading: true,
    currentFilter: 'all',
    searchQuery: '',
    tools: [],
    filteredTools: [],
    page: 1,
    toolsPerPage: 6,
    isDarkMode: false,
    isMobile: window.innerWidth <= 768,
    observers: {},
    eventListeners: [],
    animations: []
};

// Utility Functions
const Utils = {
    // Debounce function for search
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function for scroll events
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Generate unique ID
    generateId: () => Math.random().toString(36).substr(2, 9),

    // Check if element is in viewport
    isInViewport: (element) => {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    // Smooth scroll to element
    scrollToElement: (element, offset = 0) => {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    },

    // Copy text to clipboard
    copyToClipboard: (text) => {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return Promise.resolve();
        }
    },

    // Format numbers
    formatNumber: (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },

    // Check mobile device
    isMobile: () => window.innerWidth <= 768,

    // Get device info
    getDeviceInfo: () => {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio,
            touchSupport: 'ontouchstart' in window
        };
    }
};

// Loading Manager
const LoadingManager = {
    init: () => {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            // Simulate loading time
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    AIverseApp.isLoading = false;
                    App.initializeAnimations();
                    App.trackEvent('app_loaded', {
                        load_time: performance.now(),
                        device_info: Utils.getDeviceInfo()
                    });
                }, 500);
            }, 1500);
        }
    }
};

// Theme Manager
const ThemeManager = {
    init: () => {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            // Load saved theme
            const savedTheme = localStorage.getItem('aiverse-theme') || 'light';
            AIverseApp.isDarkMode = savedTheme === 'dark';
            ThemeManager.applyTheme(AIverseApp.isDarkMode);

            // Toggle theme
            themeToggle.addEventListener('click', () => {
                AIverseApp.isDarkMode = !AIverseApp.isDarkMode;
                ThemeManager.applyTheme(AIverseApp.isDarkMode);
                localStorage.setItem('aiverse-theme', AIverseApp.isDarkMode ? 'dark' : 'light');
            });
        }
    },

    applyTheme: (isDark) => {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        const themeIcon = document.querySelector('.theme-icon');
if (themeIcon) {
    themeIcon.textContent = isDark ? '☀️' : '🌙';
}

    }
};

// Search Manager
const SearchManager = {
    init: () => {
        const searchToggle = document.getElementById('search-toggle');
        const searchOverlay = document.getElementById('search-overlay');
        const searchInput = document.getElementById('search-input');
        const searchBtn = document.getElementById('search-btn');
        const searchClose = document.getElementById('search-close');

        if (searchToggle && searchOverlay) {
            // Toggle search overlay
            searchToggle.addEventListener('click', () => {
                searchOverlay.classList.toggle('active');
                if (searchOverlay.classList.contains('active')) {
                    searchInput?.focus();
                    App.trackEvent('search_opened');
                }
            });

            // Close search overlay
            if (searchClose) {
                searchClose.addEventListener('click', () => {
                    searchOverlay.classList.remove('active');
                });
            }

            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
                    searchOverlay.classList.remove('active');
                }
            });

            // Search functionality
            if (searchBtn && searchInput) {
                const performSearch = Utils.debounce(() => {
                    const query = searchInput.value.trim();
                    if (query.length > 0) {
                        SearchManager.search(query);
                    }
                }, 300);

                searchBtn.addEventListener('click', () => performSearch());
                searchInput.addEventListener('input', performSearch);
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        performSearch();
                    }
                });
            }

            // Search suggestions
            const suggestionTags = document.querySelectorAll('.suggestion-tag');
            suggestionTags.forEach(tag => {
                tag.addEventListener('click', () => {
                    const query = tag.dataset.query;
                    if (query) {
                        searchInput.value = query;
                        SearchManager.search(query);
                    }
                });
            });
        }
    },

    search: (query) => {
        AIverseApp.searchQuery = query;
        const results = SearchManager.performSearch(query);
        SearchManager.displayResults(results, query);
        
        App.trackEvent('search_performed', {
            query: query,
            results_count: results.length
        });
    },

    performSearch: (query) => {
        const allTools = ToolManager.getAllTools();
        return allTools.filter(tool => 
            tool.name.toLowerCase().includes(query.toLowerCase()) ||
            tool.description.toLowerCase().includes(query.toLowerCase()) ||
            tool.category.toLowerCase().includes(query.toLowerCase()) ||
            tool.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
    },

    displayResults: (results, query) => {
        const toolsGrid = document.getElementById('tools-grid');
        const sectionTitle = document.querySelector('.section-title');
        
        if (toolsGrid && sectionTitle) {
            // Update section title
            sectionTitle.textContent = `Search Results for "${query}" (${results.length} tools found)`;
            
            // Clear existing tools
            toolsGrid.innerHTML = '';
            
            // Display results
            if (results.length === 0) {
                toolsGrid.innerHTML = SearchManager.getNoResultsHTML(query);
            } else {
                results.forEach(tool => {
                    const toolCard = ToolManager.createToolCard(tool);
                    toolsGrid.appendChild(toolCard);
                });
            }
            
            // Scroll to results
            toolsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    getNoResultsHTML: (query) => {
        return `
            <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 4rem;">
               <div class="no-results-icon" style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--text-primary);">No tools found</h3>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">No AI tools match "${query}". Try different keywords or browse our categories.</p>
                <button onclick="SearchManager.resetSearch()" class="btn btn-primary">Reset Search</button>
            </div>
        `;
    },

    resetSearch: () => {
        const searchInput = document.getElementById('search-input');
        const sectionTitle = document.querySelector('.section-title');
        const toolsGrid = document.getElementById('tools-grid');
        
        if (searchInput) searchInput.value = '';
        if (sectionTitle) sectionTitle.textContent = 'Top AI Tools This Month';
        if (toolsGrid) ToolManager.displayTools();
        
        AIverseApp.searchQuery = '';
        App.trackEvent('search_reset');
    }
};

// Tool Manager
const ToolManager = {
    init: () => {
        // Initialize tools data
        AIverseApp.tools = ToolManager.getAllTools();
        AIverseApp.filteredTools = [...AIverseApp.tools];
        
        // Display initial tools
        ToolManager.displayTools();
        
        // Initialize filters
        ToolManager.initFilters();
        
        // Initialize load more
        ToolManager.initLoadMore();
    },

    getAllTools: () => {
        return [
            {
                id: 1,
                name: "ChatGPT",
                description: "Advanced AI chatbot for conversation, coding, writing, and problem-solving. The most popular AI assistant with extensive capabilities.",
                rating: 4.8,
                reviews: 15420,
                growth: "+37%",
                category: "ai",
                categoryName: "AI Tools",
                tags: ["Free", "Popular", "Chatbot"],
                affiliateId: "chatgpt",
                website: "https://chat.openai.com",
                logo: "https://logo.clearbit.com/openai.com",
                pricing: "freemium",
                features: ["Natural Language Processing", "Code Generation", "Writing Assistance", "Problem Solving"],
                lastUpdated: "2025-12-15"
            },
            {
                id: 2,
                name: "Claude AI",
                description: "AI assistant by Anthropic focused on being helpful, harmless, and honest. Excellent for research, analysis, and complex reasoning tasks.",
                rating: 4.9,
                reviews: 8930,
                growth: "+45%",
                category: "ai",
                categoryName: "AI Tools",
                tags: ["Free", "Research", "Analysis"],
                affiliateId: "claude",
                website: "https://claude.ai",
                logo: "https://logo.clearbit.com/claude.ai",
                pricing: "freemium",
                features: ["Research Assistance", "Document Analysis", "Ethical AI", "Long-form Content"],
                lastUpdated: "2025-12-14"
            },
            {
                id: 3,
                name: "Midjourney",
                description: "AI-powered image generation tool that creates stunning artwork from text descriptions. Perfect for artists, designers, and creative professionals.",
                rating: 4.7,
                reviews: 12680,
                growth: "+52%",
                category: "design",
                categoryName: "Design AI",
                tags: ["Paid", "Creative", "Image Generation"],
                affiliateId: "midjourney",
                website: "https://midjourney.com",
                logo: "https://logo.clearbit.com/midjourney.com",
                pricing: "paid",
                features: ["Text-to-Image", "Artistic Styles", "High Resolution", "Commercial Use"],
                lastUpdated: "2025-12-13"
            },
            {
                id: 4,
                name: "Cursor",
                description: "AI-powered code editor that helps you write code faster with intelligent suggestions and automation. Built for modern development.",
                rating: 4.6,
                reviews: 5670,
                growth: "+56%",
                category: "productivity",
                categoryName: "Productivity",
                tags: ["Free", "Developer", "Coding"],
                affiliateId: "cursor",
                website: "https://cursor.sh",
                logo: "https://logo.clearbit.com/cursor.sh",
                pricing: "freemium",
                features: ["Code Completion", "AI Chat", "Debugging", "Multiple Languages"],
                lastUpdated: "2025-12-12"
            },
            {
                id: 5,
                name: "Perplexity AI",
                description: "AI-powered search engine that provides accurate answers with cited sources and real-time information. The future of web search.",
                rating: 4.5,
                reviews: 7890,
                growth: "+37%",
                category: "ai",
                categoryName: "AI Tools",
                tags: ["Free", "Research", "Search"],
                affiliateId: "perplexity",
                website: "https://perplexity.ai",
                logo: "https://logo.clearbit.com/perplexity.ai",
                pricing: "freemium",
                features: ["Real-time Search", "Source Citations", "Follow-up Questions", "Web Results"],
                lastUpdated: "2025-12-11"
            },
            {
                id: 6,
                name: "Jasper AI",
                description: "AI writing assistant that helps create content, blog posts, marketing copy, and more. Trusted by marketing teams worldwide.",
                rating: 4.4,
                reviews: 9450,
                growth: "+28%",
                category: "writing",
                categoryName: "Writing AI",
                tags: ["Paid", "Marketing", "Content"],
                affiliateId: "jasper",
                website: "https://jasper.ai",
                logo: "https://logo.clearbit.com/jasper.ai",
                pricing: "paid",
                features: ["Content Generation", "Marketing Copy", "Blog Posts", "SEO Optimization"],
                lastUpdated: "2025-12-10"
            },
            {
                id: 7,
                name: "DALL-E 3",
                description: "OpenAI's latest image generation model that creates highly detailed and accurate images from text descriptions.",
                rating: 4.6,
                reviews: 11200,
                growth: "+41%",
                category: "design",
                categoryName: "Design AI",
                tags: ["Paid", "Image Generation", "Creative"],
                affiliateId: "dalle",
                website: "https://openai.com/dall-e-3",
                logo: "https://logo.clearbit.com/openai.com",
                pricing: "paid",
                features: ["High Resolution", "Accurate Text", "Creative Control", "API Access"],
                lastUpdated: "2025-12-09"
            },
            {
                id: 8,
                name: "Notion AI",
                description: "AI-powered productivity tool integrated into Notion. Helps with writing, brainstorming, and organizing your workspace.",
                rating: 4.3,
                reviews: 6700,
                growth: "+33%",
                category: "productivity",
                categoryName: "Productivity",
                tags: ["Freemium", "Productivity", "Organization"],
                affiliateId: "notion",
                website: "https://notion.so",
                logo: "https://logo.clearbit.com/notion.so",
                pricing: "freemium",
                features: ["Writing Assistant", "Data Analysis", "Summarization", "Translation"],
                lastUpdated: "2025-12-08"
            }
        ];
    },

    displayTools: (tools = AIverseApp.filteredTools, append = false) => {
        const toolsGrid = document.getElementById('tools-grid');
        if (!toolsGrid) return;

        if (!append) {
            toolsGrid.innerHTML = '';
            AIverseApp.page = 1;
        }

        const startIndex = (AIverseApp.page - 1) * AIverseApp.toolsPerPage;
        const endIndex = startIndex + AIverseApp.toolsPerPage;
        const toolsToShow = tools.slice(startIndex, endIndex);

        toolsToShow.forEach((tool, index) => {
            const toolCard = ToolManager.createToolCard(tool);
            toolCard.style.animationDelay = `${index * 0.1}s`;
            toolsGrid.appendChild(toolCard);
        });

        // Update load more button
        const loadMoreBtn = document.getElementById('load-more-tools');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = endIndex < tools.length ? 'block' : 'none';
        }

        App.trackEvent('tools_displayed', {
            count: toolsToShow.length,
            total: tools.length,
            page: AIverseApp.page
        });
    },

    createToolCard: (tool) => {
        const card = document.createElement('div');
        card.className = 'tool-card';
        card.setAttribute('data-tool-id', tool.id);
        card.setAttribute('data-category', tool.category);

        const stars = '⭐'.repeat(Math.floor(tool.rating)) + (tool.rating % 1 >= 0.5 ? '☆' : '');
        const ratingText = `${tool.rating}/5 (${Utils.formatNumber(tool.reviews)} reviews)`;

        card.innerHTML = `
            <div class="tool-logo">
                <img src="${tool.logo}" alt="${tool.name}" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iMTYiIGZpbGw9IiM2NjdlZWEiLz4KPHRleHQgeD0iNDAiIHk9IjQ1IiBmb250LXNpemU9IjI0IiBmb250LWZhbWlseT0iQXJpYWwiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7wn46MPC90ZXh0Pgo8L3N2Zz4K'">
                <div class="tool-rating-badge">${tool.rating}</div>
            </div>
            <h4 class="tool-name">${tool.name}</h4>
            <p class="tool-description">${tool.description}</p>
            <div class="tool-meta">
                <span class="rating">${stars}</span>
                <span class="growth">↗️ ${tool.growth}</span>
                <span class="category">${tool.categoryName}</span>
            </div>
            <div class="tool-features">
                ${tool.features.slice(0, 3).map(feature => 
                    `<span class="feature-tag">${feature}</span>`
                ).join('')}
            </div>
            <div class="tool-actions">
                <button class="btn btn-primary visit-tool" data-affiliate="${tool.affiliateId}">
                 <span class="btn-icon">🚀</span>
                    <span>Visit Tool</span>
                </button>
                <button class="btn btn-outline save-tool" data-tool-id="${tool.id}">
                    <span class="btn-icon">💾</span>
                    <span>Save</span>
                </button>
            </div>
            <div class="tool-tags">
                ${tool.tags.map(tag => {
                    const className = tag.toLowerCase().includes('free') ? 'tag-free' : 
                                   tag.toLowerCase().includes('paid') ? 'tag-paid' : 'tag-default';
                    return `<span class="tag ${className}">${tag}</span>`;
                }).join('')}
            </div>
            <div class="tool-pricing">
                <span class="pricing-indicator ${tool.pricing}">${tool.pricing}</span>
            </div>
        `;

        return card;
    },

    initFilters: () => {
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active filter
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filter = btn.dataset.filter;
                ToolManager.filterTools(filter);
                
                App.trackEvent('filter_applied', { filter });
            });
        });
    },

    filterTools: (filter) => {
        AIverseApp.currentFilter = filter;
        let filtered = [...AIverseApp.tools];

        switch (filter) {
            case 'free':
                filtered = filtered.filter(tool => 
                    tool.tags.some(tag => tag.toLowerCase().includes('free'))
                );
                break;
            case 'paid':
                filtered = filtered.filter(tool => 
                    tool.tags.some(tag => tag.toLowerCase().includes('paid'))
                );
                break;
            case 'popular':
                filtered = filtered.filter(tool => tool.rating >= 4.5);
                break;
            case 'trending':
                filtered = filtered.filter(tool => 
                    parseInt(tool.growth.replace('+', '').replace('%', '')) >= 40
                );
                break;
            default:
                // Show all tools
                break;
        }

        AIverseApp.filteredTools = filtered;
        ToolManager.displayTools();
    },

    initLoadMore: () => {
        const loadMoreBtn = document.getElementById('load-more-tools');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                AIverseApp.page++;
                ToolManager.displayTools(AIverseApp.filteredTools, true);
                
                App.trackEvent('load_more_clicked', { page: AIverseApp.page });
            });
        }
    },

    handleToolVisit: (affiliateId, toolName) => {
        // Track the visit
        App.trackEvent('tool_visit', {
            tool: toolName,
            affiliate_id: affiliateId,
            timestamp: new Date().toISOString()
        });

        // Open the tool URL
        const url = ToolManager.getToolUrl(toolName, affiliateId);
        window.open(url, '_blank');

        // Add visual feedback
        const toolCard = document.querySelector(`[data-affiliate="${affiliateId}"]`)?.closest('.tool-card');
        if (toolCard) {
            toolCard.classList.add('visited');
            setTimeout(() => toolCard.classList.remove('visited'), 1000);
        }
    },

    handleToolSave: (toolId) => {
        const savedTools = JSON.parse(localStorage.getItem('aiverse-saved-tools') || '[]');
        const tool = AIverseApp.tools.find(t => t.id === toolId);
        
        if (tool) {
            const isSaved = savedTools.includes(toolId);
            if (isSaved) {
                const index = savedTools.indexOf(toolId);
                savedTools.splice(index, 1);
                App.showNotification(`${tool.name} removed from saved tools`, 'info');
            } else {
                savedTools.push(toolId);
                App.showNotification(`${tool.name} saved successfully`, 'success');
            }
            
            localStorage.setItem('aiverse-saved-tools', JSON.stringify(savedTools));
            
            // Update button state
            const saveBtn = document.querySelector(`[data-tool-id="${toolId}"]`);
            if (saveBtn) {
                saveBtn.classList.toggle('saved', !isSaved);
                saveBtn.querySelector('.btn-icon').textContent = isSaved ? 'ℹ️' : '🚀';
            }
            
            App.trackEvent('tool_saved', { tool_id: toolId, action: isSaved ? 'unsave' : 'save' });
        }
    },

    getToolUrl: (toolName, affiliateId) => {
        const baseUrls = {
            'chatgpt': 'https://chat.openai.com',
            'claude': 'https://claude.ai',
            'midjourney': 'https://midjourney.com',
            'cursor': 'https://cursor.sh',
            'perplexity': 'https://perplexity.ai',
            'jasper': 'https://jasper.ai',
            'dalle': 'https://openai.com/dall-e-3',
            'notion': 'https://notion.so'
        };
        
        const baseUrl = baseUrls[affiliateId] || `https://${toolName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
        const affiliateLink = window.affiliateLinks && window.affiliateLinks[affiliateId];
        
        return affiliateLink || baseUrl;
    }
};

// Category Manager
const CategoryManager = {
    init: () => {
        const categoryCards = document.querySelectorAll('.category-card');
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        
        // Category card interactions
        categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                const category = card.dataset.category;
                CategoryManager.filterByCategory(category);
                CategoryManager.setActiveCategory(card);
                
                App.trackEvent('category_selected', { category });
            });
            
            // Hover effects
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
        
        // Dropdown interactions
        dropdownItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const category = item.dataset.category;
                CategoryManager.filterByCategory(category);
                
                App.trackEvent('category_selected_dropdown', { category });
            });
        });
    },

    filterByCategory: (category) => {
        const filtered = AIverseApp.tools.filter(tool => tool.category === category);
        AIverseApp.filteredTools = filtered;
        AIverseApp.currentFilter = 'category';
        
        // Update section title
        const sectionTitle = document.querySelector('.section-title');
        if (sectionTitle) {
            const categoryNames = {
                'ai': 'AI Tools',
                'design': 'Design AI',
                'writing': 'Writing AI',
                'productivity': 'Productivity AI',
                'chatbots': 'Chatbots',
                'video': 'Video AI'
            };
            sectionTitle.textContent = `${categoryNames[category] || category} (${filtered.length} tools)`;
        }
        
        ToolManager.displayTools();
        
        // Scroll to tools section
        const toolsSection = document.querySelector('.tools-section');
        if (toolsSection) {
            Utils.scrollToElement(toolsSection, 100);
        }
    },

    setActiveCategory: (activeCard) => {
        document.querySelectorAll('.category-card').forEach(card => {
            card.classList.remove('active');
        });
        activeCard.classList.add('active');
    }
};

// Animation Manager
const AnimationManager = {
    init: () => {
        // Intersection Observer for scroll animations
        AnimationManager.initScrollAnimations();
        
        // Counter animations
        AnimationManager.initCounterAnimations();
        
        // Particle effects
        AnimationManager.initParticles();
        
        // Floating elements
        AnimationManager.initFloatingElements();
    },

    initScrollAnimations: () => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        AIverseApp.observers.scroll = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, observerOptions);
        
        // Observe elements
        const animatedElements = document.querySelectorAll(
            '.tool-card, .category-card, .featured-tool, .section-header'
        );
        
        animatedElements.forEach(el => {
            AIverseApp.observers.scroll.observe(el);
        });
    },

    initCounterAnimations: () => {
        const counters = document.querySelectorAll('.stat-number');
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    AnimationManager.animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        });
        
        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    },

    animateCounter: (element) => {
        const target = parseInt(element.dataset.target);
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Utils.formatNumber(Math.floor(current));
        }, 16);
    },

    initParticles: () => {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;
        
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.cssText = `
                position: absolute;
                width: 2px;
                height: 2px;
                background: rgba(255, 255, 255, 0.6);
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation: particleFloat ${5 + Math.random() * 10}s linear infinite;
                animation-delay: ${Math.random() * 5}s;
            `;
            particlesContainer.appendChild(particle);
        }
    },

    initFloatingElements: () => {
        // Add CSS for particle animation
        if (!document.querySelector('#particle-animation-style')) {
            const style = document.createElement('style');
            style.id = 'particle-animation-style';
            style.textContent = `
                @keyframes particleFloat {
                    0% {
                        transform: translateY(100vh) translateX(0);
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-10vh) translateX(${Math.random() * 200 - 100}px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
};

// Navigation Manager
const NavigationManager = {
    init: () => {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const navMenu = document.getElementById('nav-menu');
        
        if (mobileMenuToggle && navMenu) {
            mobileMenuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                mobileMenuToggle.classList.toggle('active');
            });
            
            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!navMenu.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                    navMenu.classList.remove('active');
                    mobileMenuToggle.classList.remove('active');
                }
            });
        }
        
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    Utils.scrollToElement(target, 80);
                    
                    // Close mobile menu if open
                    if (navMenu && navMenu.classList.contains('active')) {
                        navMenu.classList.remove('active');
                        mobileMenuToggle?.classList.remove('active');
                    }
                }
            });
        });
        
        // Header scroll effect
        const header = document.querySelector('.header');
        if (header) {
            window.addEventListener('scroll', Utils.throttle(() => {
                if (window.scrollY > 100) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            }, 100));
        }
    }
};

// Scroll Manager
const ScrollManager = {
    init: () => {
        // Back to top button
        const backToTop = document.getElementById('back-to-top');
        if (backToTop) {
            window.addEventListener('scroll', Utils.throttle(() => {
                if (window.scrollY > 300) {
                    backToTop.classList.add('visible');
                } else {
                    backToTop.classList.remove('visible');
                }
            }, 100));
            
            backToTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                App.trackEvent('back_to_top_clicked');
            });
        }
        
        // Parallax effects
        const parallaxElements = document.querySelectorAll('.gradient-orb');
        if (parallaxElements.length > 0) {
            window.addEventListener('scroll', Utils.throttle(() => {
                const scrolled = window.pageYOffset;
                const rate = scrolled * -0.5;
                
                parallaxElements.forEach((element, index) => {
                    const speed = 0.5 + (index * 0.2);
                    element.style.transform = `translateY(${rate * speed}px)`;
                });
            }, 16));
        }
    }
};

// Notification Manager
const NotificationManager = {
    init: () => {
        AIverseApp.notifications = [];
    },

    show: (message, type = 'info', duration = 5000) => {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icons[type] || icons.info}</span>
                <span class="notification-message">${message}</span>
            </div>
            <button class="notification-close" onclick="NotificationManager.hide(this)">&times;</button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-left: 4px solid ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#FF9800' : '#2196F3'};
            border-radius: var(--radius-lg);
            padding: var(--space-4);
            box-shadow: var(--shadow-xl);
            z-index: 10000;
            min-width: 300px;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
            color: var(--text-primary);
        `;
        
        const notificationsContainer = document.getElementById('notifications') || document.body;
        notificationsContainer.appendChild(notification);
        
        // Auto hide
        setTimeout(() => {
            NotificationManager.hide(notification);
        }, duration);
        
        // Track notification
        App.trackEvent('notification_shown', { type, message });
    },

    hide: (element) => {
        const notification = element.closest('.notification');
        if (notification) {
        
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }
};

// Main App Controller
const App = {
    init: () => {
        console.log('🤖 AIverse App Starting...');
        
        // Initialize core components
        LoadingManager.init();
        ThemeManager.init();
        SearchManager.init();
        ToolManager.init();
        CategoryManager.init();
        NavigationManager.init();
        ScrollManager.init();
        NotificationManager.init();
        
        // Initialize event listeners
        App.initEventListeners();
        
        // Initialize affiliate links
        App.initAffiliateLinks();
        
        // Initialize performance monitoring
        App.initPerformanceMonitoring();
        
          console.log('✅ AIverse App Ready!');
    },

    initEventListeners: () => {
        // Tool visit buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.visit-tool')) {
                const button = e.target.closest('.visit-tool');
                const affiliateId = button.dataset.affiliate;
                const toolName = button.closest('.tool-card').querySelector('.tool-name').textContent;
                ToolManager.handleToolVisit(affiliateId, toolName);
            }
            
            if (e.target.closest('.save-tool')) {
                const button = e.target.closest('.save-tool');
                const toolId = parseInt(button.dataset.toolId);
                ToolManager.handleToolSave(toolId);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchToggle = document.getElementById('search-toggle');
                searchToggle?.click();
            }
        });
        
        // Window resize
        window.addEventListener('resize', Utils.debounce(() => {
            AIverseApp.isMobile = Utils.isMobile();
            App.trackEvent('window_resized', {
                width: window.innerWidth,
                height: window.innerHeight
            });
        }, 250));
        
        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            App.trackEvent('page_visibility_changed', {
                hidden: document.hidden,
                timestamp: Date.now()
            });
        });
    },

    initAffiliateLinks: () => {
        window.affiliateLinks = {
            'chatgpt': 'https://chat.openai.com/?ref=aiverse',
            'claude': 'https://claude.ai/?ref=aiverse',
            'midjourney': 'https://midjourney.com/?ref=aiverse',
            'cursor': 'https://cursor.sh/?ref=aiverse',
            'perplexity': 'https://perplexity.ai/?ref=aiverse',
            'jasper': 'https://jasper.ai/?ref=aiverse',
            'dalle': 'https://openai.com/dall-e-3/?ref=aiverse',
            'notion': 'https://notion.so/?ref=aiverse'
        };
    },

    initPerformanceMonitoring: () => {
        // Monitor Core Web Vitals
        if ('web-vital' in window) {
            import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
                getCLS(App.onVitalUpdate);
                getFID(App.onVitalUpdate);
                getFCP(App.onVitalUpdate);
                getLCP(App.onVitalUpdate);
                getTTFB(App.onVitalUpdate);
            });
        }
        
        // Memory usage monitoring
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
                    console.warn('High memory usage detected');
                    App.trackEvent('high_memory_usage', {
                        used: memory.usedJSHeapSize,
                        total: memory.totalJSHeapSize,
                        limit: memory.jsHeapSizeLimit
                    });
                }
            }, 30000); // Check every 30 seconds
        }
    },

    onVitalUpdate: (metric) => {
        App.trackEvent('web_vital', {
            name: metric.name,
            value: metric.value,
            rating: metric.rating
        });
    },

    trackEvent: (eventName, data = {}) => {
        // Enhanced analytics tracking
        const eventData = {
            event: eventName,
            data: data,
            timestamp: new Date().toISOString(),
            page: window.location.pathname,
            user_agent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
        
        // Store locally
        const events = JSON.parse(localStorage.getItem('aiverse_events') || '[]');
        events.push(eventData);
        
        // Keep only last 100 events
        if (events.length > 100) {
            events.splice(0, events.length - 100);
        }
        
        localStorage.setItem('aiverse_events', JSON.stringify(events));
        
        // Log for development
        console.log('📊 Event:', eventName, data);
        
        // Send to analytics service (if configured)
        if (window.gtag) {
            gtag('event', eventName, data);
        }
    },

    showNotification: (message, type = 'info') => {
        NotificationManager.show(message, type);
    },

    initializeAnimations: () => {
        AnimationManager.init();
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Service Worker registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const isGithubPages = location.hostname.includes('github.io');

                if (!isGithubPages) {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('SW registered:', registration);
                    App.trackEvent('service_worker_registered');
                })
                .catch(error => {
                    console.error('SW registration failed:', error);
                });
        }
    });
}

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    App.trackEvent('javascript_error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno
    });
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    App.trackEvent('promise_rejection', {
        reason: e.reason.toString()
    });
});

// Export for global access
window.SearchManager = SearchManager;
window.ToolManager = ToolManager;
window.CategoryManager = CategoryManager;
window.App = App;
window.NotificationManager = NotificationManager;
