// frontend/js/cart.js
// Cart Module

class CartManager {
    constructor() {
        this.items = [];
        this.total = 0;
        this.isLoaded = false;
    }

    // Initialize cart
    async init() {
        if (window.isLoggedIn()) {
            await this.loadCart();
        }
        this.setupEventListeners();
    }

    // Setup cart event listeners
    setupEventListeners() {
        document.getElementById('cartIcon')?.addEventListener('click', () => {
            window.navigateTo('cart');
        });

        document.getElementById('checkoutBtn')?.addEventListener('click', () => {
            window.navigateTo('checkout');
        });

        document.getElementById('cartBack')?.addEventListener('click', () => {
            window.navigateTo('home');
        });
    }

    // Load cart from API
    async loadCart() {
        try {
            const data = await API.CartAPI.getCart();
            this.items = data.cart?.items || [];
            this.total = data.cart?.total || 0;
            this.isLoaded = true;
            this.updateUI();
            return data.cart;
        } catch (error) {
            console.error('Failed to load cart:', error);
            return null;
        }
    }

    // Add item to cart
    async addItem(productId, quantity = 1) {
        if (!window.isLoggedIn()) {
            window.showToast('🔐 Please sign in to add to cart');
            window.openAuth('login');
            return false;
        }

        try {
            const data = await API.CartAPI.addToCart(productId, quantity);
            this.items = data.cart?.items || [];
            this.total = data.cart?.total || 0;
            this.updateUI();
            window.showToast('✅ Added to cart!');
            return true;
        } catch (error) {
            console.error('Failed to add to cart:', error);
            window.showToast(`❌ ${error.message}`);
            return false;
        }
    }

    // Remove item from cart
    async removeItem(productId) {
        try {
            const data = await API.CartAPI.removeFromCart(productId);
            this.items = data.cart?.items || [];
            this.total = data.cart?.total || 0;
            this.updateUI();
            window.showToast('🗑️ Item removed from cart');
            return true;
        } catch (error) {
            console.error('Failed to remove from cart:', error);
            return false;
        }
    }

    // Update item quantity
    async updateQuantity(productId, quantity) {
        try {
            const data = await API.CartAPI.updateCartItem(productId, quantity);
            this.items = data.cart?.items || [];
            this.total = data.cart?.total || 0;
            this.updateUI();
            return true;
        } catch (error) {
            console.error('Failed to update cart:', error);
            return false;
        }
    }

    // Clear cart
    async clearCart() {
        try {
            await API.CartAPI.clearCart();
            this.items = [];
            this.total = 0;
            this.updateUI();
            window.showToast('🛒 Cart cleared');
            return true;
        } catch (error) {
            console.error('Failed to clear cart:', error);
            return false;
        }
    }

    // Get cart total
    getTotal() {
        return this.items.reduce((sum, item) => {
            return sum + (item.price || 0) * (item.quantity || 1);
        }, 0);
    }

    // Get cart item count
    getItemCount() {
        return this.items.length;
    }

    // Get total items quantity
    getTotalItems() {
        return this.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }

    // Update UI
    updateUI() {
        this.updateBadge();
        this.renderItems();
        this.updateSummary();
    }

    // Update cart badge
    updateBadge() {
        const badge = document.getElementById('cartCount');
        if (badge) {
            badge.textContent = this.items.length;
        }
    }

    // Render cart items
    renderItems() {
        const container = document.getElementById('cartItems');
        const empty = document.getElementById('cartEmpty');

        if (!container) return;

        if (this.items.length === 0) {
            container.innerHTML = '';
            if (empty) empty.style.display = 'block';
            if (document.getElementById('cartSummary')) {
                document.getElementById('cartSummary').style.display = 'none';
            }
            return;
        }

        if (empty) empty.style.display = 'none';
        if (document.getElementById('cartSummary')) {
            document.getElementById('cartSummary').style.display = 'block';
        }

        container.innerHTML = this.items.map((item, index) => `
            <div class="cart-item" data-index="${index}">
                <div class="cart-item-img" style="background-image: url('${item.image || 'https://via.placeholder.com/80'}');"></div>
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>$ ${(item.price || 0).toFixed(2)}</p>
                    <div class="cart-item-quantity">
                        <button class="qty-decrease" data-id="${item.productId || item.id}">-</button>
                        <span>${item.quantity || 1}</span>
                        <button class="qty-increase" data-id="${item.productId || item.id}">+</button>
                    </div>
                </div>
                <div class="cart-item-remove" data-id="${item.productId || item.id}">
                    <i class="fas fa-trash-alt"></i>
                </div>
            </div>
        `).join('');

        // Attach event listeners
        container.querySelectorAll('.qty-decrease').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                const item = this.items.find(i => (i.productId || i.id) === id);
                if (item && item.quantity > 1) {
                    await this.updateQuantity(id, item.quantity - 1);
                } else {
                    await this.removeItem(id);
                }
            });
        });

        container.querySelectorAll('.qty-increase').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                const item = this.items.find(i => (i.productId || i.id) === id);
                if (item) {
                    await this.updateQuantity(id, (item.quantity || 1) + 1);
                }
            });
        });

        container.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                await this.removeItem(id);
            });
        });
    }

    // Update cart summary
    updateSummary() {
        const totalEl = document.getElementById('cartTotal');
        if (totalEl) {
            const total = this.getTotal();
            totalEl.textContent = `Total: $ ${total.toFixed(2)}`;
        }
    }

    // Get cart summary for checkout
    getSummary() {
        const subtotal = this.getTotal();
        const tax = subtotal * 0.10;
        const shipping = subtotal > 50 ? 0 : 5.99;
        const total = subtotal + tax + shipping;

        return {
            subtotal: Math.round(subtotal * 100) / 100,
            tax: Math.round(tax * 100) / 100,
            shipping: Math.round(shipping * 100) / 100,
            total: Math.round(total * 100) / 100,
            itemCount: this.items.length,
            totalItems: this.getTotalItems()
        };
    }
}

// Initialize cart
const cart = new CartManager();
window.cartManager = cart;

// Export for global use
window.cart = cart.items;
window.addToCart = (productId, quantity) => cart.addItem(productId, quantity);
window.removeFromCart = (productId) => cart.removeItem(productId);
window.updateCartQuantity = (productId, quantity) => cart.updateQuantity(productId, quantity);