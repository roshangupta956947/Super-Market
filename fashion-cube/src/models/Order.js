// src/models/Order.js
const db = require('../config/database');

class Order {
    static async create(orderData) {
        return db.createOrder(orderData);
    }

    static async findByUser(userId) {
        return db.getOrdersByUser(userId);
    }

    static async findById(orderId) {
        return db.getOrderById(orderId);
    }

    static async updateStatus(orderId, status) {
        return db.updateOrderStatus(orderId, status);
    }

    static async getAll() {
        return db.orders;
    }

    static async getStats() {
        const orders = db.orders;
        return {
            total: orders.length,
            processing: orders.filter(o => o.status === 'processing').length,
            shipped: orders.filter(o => o.status === 'shipped').length,
            delivered: orders.filter(o => o.status === 'delivered').length,
            cancelled: orders.filter(o => o.status === 'cancelled').length,
            totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0)
        };
    }
}

module.exports = Order;