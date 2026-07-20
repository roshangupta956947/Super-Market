// frontend/js/wishlist.js
// Wishlist Module

class WishlistManager {
    constructor() {
        this.items = [];
        this.isLoaded = false;
    }

    // Initialize wishlist
    async init() {
        this.loadFromStorage();
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        document.getElementById('wishlistIcon')?.addEventListener('click', () => {
            window.navigateTo('wishlist');
        });

        document.getElementById('wishlistBack')?.addEventListener('click', () => {
            window.navigateTo('home');
        });
    }

    // Load wishlist from localStorage
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('wishlist');
            this.items = stored ? JSON.parse(stored) : [];
            this.isLoaded = true;
            this.updateUI();
        } catch (error) {
            console.error('Failed to load wishlist:', error);
            this.items = [];
        }
    }

    // Save wishlist to localStorage
    saveToStorage() {
        try {
            localStorage.setItem('wishlist', JSON.stringify(this.items));
        } catch (error) {
            console.error('Failed to save wishlist:', error);
        }
    }

    // Add item to wishlist
    addItem(product) {
        if (!product) return false;

        // Check if already in wishlist
        if (this.items.some(item => item.id === product.id)) {
            return false;
        }

        this.items.push({ ...product });
        this.saveToStorage();
        this.updateUI();
        window.showToast(`❤️ Added ${product.name} to wishlist`);
        return true;
    }

    // Remove item from wishlist
    removeItem(productId) {
        const index = this.items.findIndex(item => item.id === productId);
        if (index === -1) return false;

        const product = this.items[index];
        this.items.splice(index, 1);
        this.saveToStorage();
        this.updateUI();
        window.showToast(`💔 Removed ${product.name} from wishlist`);
        return true;
    }

    // Toggle wishlist item
    toggleItem(product) {
        const exists = this.items.some(item => item.id === product.id);
        if (exists) {
            return this.removeItem(product.id);
        } else {
            return this.addItem(product);
        }
    }

    // Check if item is in wishlist
    isInWishlist(productId) {
        return this.items.some(item => item.id === productId);
    }

    // Get item count
    getCount() {
        return this.items.length;
    }

    // Clear wishlist
    clearWishlist() {
        if (this.items.length === 0) return;
        
        if (confirm('Are you sure you want to clear your wishlist?')) {
            this.items = [];
            this.saveToStorage();
            this.updateUI();
            window.showToast('🗑️ Wishlist cleared');
        }
    }

    // Render wishlist
    renderWishlist() {
        const container = document.getElementById('wishlistItems');
        const empty = document.getElementById('wishlistEmpty');

        if (!container) return;

        if (this.items.length === 0) {
            container.innerHTML = '';
            if (empty) empty.style.display = 'block';
            return;
        }

        if (empty) empty.style.display = 'none';

        container.innerHTML = this.items.map(product => `
            <div class="product-card" data-id="${product.id}">
                <div class="product-img" style="background-image: url('${product.images?.[0] || product.thumbnail || 'https://via.placeholder.com/200'}');">
                    <span class="badge">${product.category || 'Fashion'}</span>
                    <button class="product-wishlist-btn active" data-id="${product.id}">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">
                    <span class="price-current">$ ${(product.price || 0).toFixed(2)}</span>
                    ${product.discount ? `<span class="price-percent">-${product.discount.toFixed(0)}%</span>` : ''}
                </div>
                <small>⭐ ${product.rating || 0}</small>
                <button class="btn-add-cart-wishlist" data-id="${product.id}" style="margin-top: 0.5rem; padding: 0.4rem 1rem; background: #1e1e1e; color: white; border: none; border-radius: 60px; cursor: pointer; font-size: 0.8rem; width: 100%;">
                    <i class="fas fa-shopping-bag"></i> Add to Cart
                </button>
            </div>
        `).join('');

        // Attach event listeners
        container.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', function(e) {
                if (e.target.closest('.product-wishlist-btn') || e.target.closest('.btn-add-cart-wishlist')) return;
                const id = this.dataset.id;
                window.navigateTo('product-details', { id });
            });
        });

        container.querySelectorAll('.product-wishlist-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = parseInt(this.dataset.id);
                const product = window.wishlist?.find(p => p.id === id);
                if (product) {
                    window.toggleWishlist(product);
                }
            });
        });

        container.querySelectorAll('.btn-add-cart-wishlist').forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.stopPropagation();
                const id = parseInt(this.dataset.id);
                await window.addToCart(id);
            });
        });
    }

    // Update UI
    updateUI() {
        this.renderWishlist();
        this.updateBadge();
    }

    // Update wishlist badge
    updateBadge() {
        // Add wishlist count badge if needed
        const badge = document.getElementById('wishlistCount');
        if (badge) {
            badge.textContent = this.items.length;
        }
    }
}

// Initialize wishlist
const wishlist = new WishlistManager();
window.wishlistManager = wishlist;

// Export for global use
window.wishlist = wishlist.items;
window.toggleWishlist = (product) => wishlist.toggleItem(product);
window.isInWishlist = (productId) => wishlist.isInWishlist(productId);