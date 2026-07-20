// frontend/js/orders.js
// Orders Module

class OrderManager {
    constructor() {
        this.orders = [];
        this.isLoaded = false;
    }

    // Initialize orders
    async init() {
        if (window.isLoggedIn()) {
            await this.loadOrders();
        }
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        document.getElementById('ordersNav')?.addEventListener('click', () => {
            if (!window.isLoggedIn()) {
                window.showToast('🔐 Please sign in to view your orders');
                window.openAuth('login');
                return;
            }
            window.navigateTo('orders');
        });

        document.getElementById('ordersBack')?.addEventListener('click', () => {
            window.navigateTo('home');
        });
    }

    // Load orders from API
    async loadOrders() {
        try {
            const data = await API.OrderAPI.getOrders();
            this.orders = data.orders || [];
            this.isLoaded = true;
            this.renderOrders();
            return this.orders;
        } catch (error) {
            console.error('Failed to load orders:', error);
            return [];
        }
    }

    // Get order by ID
    getOrderById(orderId) {
        return this.orders.find(order => order.id === orderId);
    }

    // Get orders by status
    getOrdersByStatus(status) {
        return this.orders.filter(order => order.status === status);
    }

    // Get order statistics
    getStats() {
        const stats = {
            total: this.orders.length,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
            totalSpent: 0
        };

        this.orders.forEach(order => {
            stats[order.status] = (stats[order.status] || 0) + 1;
            stats.totalSpent += (order.total || 0);
        });

        return stats;
    }

    // Cancel order
    async cancelOrder(orderId) {
        try {
            const data = await API.OrderAPI.cancelOrder(orderId);
            // Update local orders
            const index = this.orders.findIndex(o => o.id === orderId);
            if (index !== -1) {
                this.orders[index] = data.order;
            }
            this.renderOrders();
            window.showToast(`✅ Order #${orderId} cancelled successfully`);
            return true;
        } catch (error) {
            window.showToast(`❌ ${error.message}`);
            return false;
        }
    }

    // Render orders
    renderOrders() {
        const container = document.getElementById('ordersList');
        const empty = document.getElementById('ordersEmpty');

        if (!container) return;

        if (this.orders.length === 0) {
            container.innerHTML = '';
            if (empty) empty.style.display = 'block';
            return;
        }

        if (empty) empty.style.display = 'none';

        container.innerHTML = this.orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <h4>Order #${order.id}</h4>
                    <span class="order-status ${order.status}">${(order.status || 'processing').toUpperCase()}</span>
                </div>
                <p><strong>Placed:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Total:</strong> $${(order.total || 0).toFixed(2)}</p>
                <p><strong>Payment:</strong> ${(order.paymentMethod || 'cod').toUpperCase()}</p>
                <p><strong>Address:</strong> ${order.address || 'N/A'}</p>
                ${order.deliveryInstructions ? `<p><strong>Instructions:</strong> ${order.deliveryInstructions}</p>` : ''}
                
                <div class="order-items">
                    ${(order.items || []).map(item => `
                        <div class="order-item">
                            <img src="${item.image || 'https://via.placeholder.com/50'}" alt="${item.name}">
                            <div class="order-item-info">
                                <h5>${item.name}</h5>
                                <p>$${(item.price || 0).toFixed(2)} × ${item.quantity || 1}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>

                ${order.status !== 'cancelled' && order.status !== 'delivered' ? `
                    <button class="btn-cancel-order" data-id="${order.id}" style="margin-top: 1rem; padding: 0.5rem 1.5rem; background: #dc3545; color: white; border: none; border-radius: 60px; cursor: pointer; font-weight: 600;">
                        Cancel Order
                    </button>
                ` : ''}

                <div class="order-timeline">
                    ${(order.timeline || []).map(t => `
                        <div class="order-timeline-item">
                            <span class="time">${new Date(t.time).toLocaleDateString()} ${new Date(t.time).toLocaleTimeString()}</span>
                            <span class="event">${t.event}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        // Attach cancel order event listeners
        container.querySelectorAll('.btn-cancel-order').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                if (confirm(`Are you sure you want to cancel order #${id}?`)) {
                    await this.cancelOrder(id);
                }
            });
        });
    }

    // Render order stats (for admin)
    renderStats() {
        const stats = this.getStats();
        const container = document.getElementById('orderStats');
        if (!container) return;

        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Total Orders</span>
                    <span class="stat-value">${stats.total}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Processing</span>
                    <span class="stat-value">${stats.processing}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Shipped</span>
                    <span class="stat-value">${stats.shipped}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Delivered</span>
                    <span class="stat-value">${stats.delivered}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Cancelled</span>
                    <span class="stat-value">${stats.cancelled}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Total Spent</span>
                    <span class="stat-value">$${stats.totalSpent.toFixed(2)}</span>
                </div>
            </div>
        `;
    }
}

// Initialize orders
const orders = new OrderManager();
window.orderManager = orders;

// Export for global use
window.orders = orders.orders;