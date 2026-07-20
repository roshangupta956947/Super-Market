// frontend/js/products.js
// Products Module

class ProductManager {
    constructor() {
        this.products = [];
        this.featuredProducts = [];
        this.categories = [];
        this.currentFilters = {
            category: 'all',
            minPrice: '',
            maxPrice: '',
            minRating: 0,
            sortBy: 'popularity',
            search: ''
        };
        this.isLoaded = false;
        this.currentPage = 1;
        this.itemsPerPage = 24;
    }

    // Initialize products
    async init() {
        await this.loadCategories();
        await this.loadFeaturedProducts();
        await this.loadProducts();
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        // Filter toggle
        document.getElementById('filterToggle')?.addEventListener('click', function() {
            document.getElementById('filterPanel')?.classList.toggle('active');
            this.classList.toggle('active');
        });

        // Apply filters
        document.getElementById('applyFilters')?.addEventListener('click', () => {
            this.applyFilters();
        });

        // Reset filters
        document.getElementById('resetFilters')?.addEventListener('click', () => {
            this.resetFilters();
        });

        // Sort
        document.getElementById('sortSelect')?.addEventListener('change', (e) => {
            this.currentFilters.sortBy = e.target.value;
            this.applyFilters();
        });

        // Search
        document.getElementById('searchBtn')?.addEventListener('click', () => {
            this.handleSearch();
        });

        document.getElementById('searchInput')?.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
    }

    // Load categories
    async loadCategories() {
        try {
            const data = await API.ProductAPI.getCategories();
            this.categories = data.categories || [];
            this.populateCategoryFilter();
            return this.categories;
        } catch (error) {
            console.error('Failed to load categories:', error);
            return [];
        }
    }

    // Load featured products
    async loadFeaturedProducts() {
        try {
            const data = await API.ProductAPI.getFeaturedProducts(8);
            this.featuredProducts = data.products || [];
            this.renderFeaturedProducts();
            return this.featuredProducts;
        } catch (error) {
            console.error('Failed to load featured products:', error);
            return [];
        }
    }

    // Load products
    async loadProducts(params = {}) {
        try {
            const queryParams = {
                limit: this.itemsPerPage,
                skip: (this.currentPage - 1) * this.itemsPerPage,
                sortBy: this.currentFilters.sortBy,
                ...params,
                ...this.currentFilters
            };

            // Remove empty filters
            Object.keys(queryParams).forEach(key => {
                if (queryParams[key] === '' || queryParams[key] === 'all' || queryParams[key] === 0) {
                    delete queryParams[key];
                }
            });

            const data = await API.ProductAPI.getProducts(queryParams);
            this.products = data.products || [];
            this.totalProducts = data.total || this.products.length;
            this.isLoaded = true;
            this.renderProducts();
            this.renderPagination();
            return this.products;
        } catch (error) {
            console.error('Failed to load products:', error);
            return [];
        }
    }

    // Search products
    async searchProducts(query) {
        if (!query || query.length < 2) {
            await this.loadProducts();
            return;
        }

        try {
            const data = await API.ProductAPI.searchProducts(query);
            this.products = data.products || [];
            this.totalProducts = data.total || this.products.length;
            this.renderProducts();
            window.showToast(`🔍 Found ${this.totalProducts} results for "${query}"`);
            return this.products;
        } catch (error) {
            console.error('Failed to search products:', error);
            return [];
        }
    }

    // Apply filters
    async applyFilters() {
        const category = document.getElementById('filterCategory')?.value || 'all';
        const minPrice = document.getElementById('filterMinPrice')?.value || '';
        const maxPrice = document.getElementById('filterMaxPrice')?.value || '';
        const minRating = document.getElementById('filterRating')?.value || '0';

        this.currentFilters = {
            ...this.currentFilters,
            category,
            minPrice: minPrice ? parseFloat(minPrice) : '',
            maxPrice: maxPrice ? parseFloat(maxPrice) : '',
            minRating: parseFloat(minRating)
        };

        this.currentPage = 1;
        await this.loadProducts();
        window.showToast('✅ Filters applied');
    }

    // Reset filters
    resetFilters() {
        document.getElementById('filterCategory').value = 'all';
        document.getElementById('filterMinPrice').value = '';
        document.getElementById('filterMaxPrice').value = '';
        document.getElementById('filterRating').value = '0';
        document.getElementById('sortSelect').value = 'popularity';

        this.currentFilters = {
            category: 'all',
            minPrice: '',
            maxPrice: '',
            minRating: 0,
            sortBy: 'popularity',
            search: ''
        };

        document.getElementById('searchInput').value = '';
        this.currentPage = 1;
        this.loadProducts();
        window.showToast('🔄 Filters reset');
    }

    // Handle search
    handleSearch() {
        const input = document.getElementById('searchInput');
        const query = input?.value?.trim();

        if (!query) {
            this.loadProducts();
            return;
        }

        this.currentFilters.search = query;
        this.currentPage = 1;
        this.searchProducts(query);
    }

    // Populate category filter
    populateCategoryFilter() {
        const select = document.getElementById('filterCategory');
        if (!select) return;

        select.innerHTML = `
            <option value="all">All Categories</option>
            ${this.categories.map(cat => `
                <option value="${cat.name}">${cat.name}</option>
            `).join('')}
        `;
    }

    // Render products
    renderProducts(products = null) {
        const grid = document.getElementById('productGrid');
        if (!grid) return;

        const items = products || this.products;

        if (items.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #999;">
                    <i class="fas fa-search" style="font-size: 2rem; display: block; margin-bottom: 1rem;"></i>
                    <p>No products found. Try adjusting your filters.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = items.map(product => `
            <div class="product-card" data-id="${product.id}">
                <div class="product-img" style="background-image: url('${product.images?.[0] || product.thumbnail || 'https://via.placeholder.com/200'}');">
                    <span class="badge">${product.category || 'Fashion'}</span>
                    <button class="product-wishlist-btn ${this.isInWishlist(product.id) ? 'active' : ''}" data-id="${product.id}">
                        <i class="${this.isInWishlist(product.id) ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">
                    <span class="price-current">$ ${(product.price || 0).toFixed(2)}</span>
                    ${product.discount ? `<span class="price-percent">-${product.discount.toFixed(0)}%</span>` : ''}
                </div>
                <small>⭐ ${product.rating || 0} ${product.reviews ? `(${product.reviews})` : ''} | Stock: ${product.stock || 0}</small>
            </div>
        `).join('');

        // Attach event listeners
        grid.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', function(e) {
                if (e.target.closest('.product-wishlist-btn')) return;
                const id = this.dataset.id;
                window.navigateTo('product-details', { id });
            });
        });

        grid.querySelectorAll('.product-wishlist-btn').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.stopPropagation();
                const id = parseInt(this.dataset.id);
                const product = window.products?.find(p => p.id === id) || 
                               window.featuredProducts?.find(p => p.id === id);
                if (product) {
                    await window.toggleWishlist(product);
                    // Update button state
                    const isInWishlist = window.wishlist?.some(item => item.id === id);
                    this.classList.toggle('active', isInWishlist);
                    this.innerHTML = isInWishlist ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
                }
            });
        });
    }

    // Render featured products
    renderFeaturedProducts() {
        const grid = document.getElementById('featuredGrid');
        if (!grid) return;

        if (this.featuredProducts.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No featured products available</p>';
            return;
        }

        // Use the same render method with featured products
        const originalProducts = this.products;
        this.products = this.featuredProducts;
        this.renderProducts();
        this.products = originalProducts;
    }

    // Render pagination
    renderPagination() {
        const container = document.getElementById('pagination');
        if (!container) return;

        const totalPages = Math.ceil(this.totalProducts / this.itemsPerPage);

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';
        html += `<button class="prev" ${this.currentPage === 1 ? 'disabled' : ''} onclick="productManager.goToPage(${this.currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>`;

        // Show limited page numbers
        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            html += `<button onclick="productManager.goToPage(1)">1</button>`;
            if (startPage > 2) html += `<span>...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="${i === this.currentPage ? 'active' : ''}" onclick="productManager.goToPage(${i})">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += `<span>...</span>`;
            html += `<button onclick="productManager.goToPage(${totalPages})">${totalPages}</button>`;
        }

        html += `<button class="next" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="productManager.goToPage(${this.currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;

        container.innerHTML = html;
    }

    // Go to page
    async goToPage(page) {
        const totalPages = Math.ceil(this.totalProducts / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;

        this.currentPage = page;
        await this.loadProducts();
        document.querySelector('.product-grid')?.scrollIntoView({ behavior: 'smooth' });
    }

    // Check if product is in wishlist
    isInWishlist(productId) {
        return window.wishlist?.some(item => item.id === productId) || false;
    }

    // Get product by ID
    getProductById(id) {
        return this.products.find(p => p.id === id) || 
               this.featuredProducts.find(p => p.id === id);
    }
}

// Initialize products
const productManager = new ProductManager();
window.productManager = productManager;

// Export for global use
window.products = productManager.products;