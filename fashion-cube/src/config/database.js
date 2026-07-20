// src/config/database.js
const fs = require('fs');
const path = require('path');

// Simple JSON file-based database for demo purposes
class Database {
    constructor() {
        this.dataDir = path.join(__dirname, '../../data');
        this.ensureDataDir();
        this.users = this.loadData('users.json') || [];
        this.orders = this.loadData('orders.json') || [];
        this.carts = this.loadData('carts.json') || {};
        this.nextOrderId = this.loadData('nextOrderId.json') || 1001;
        
        // Initialize with demo users if empty
        if (this.users.length === 0) {
            this.initDemoUsers();
        }
    }

    ensureDataDir() {
        if (!fs.existsSync(this.dataDir)) {
            fs.mkdirSync(this.dataDir, { recursive: true });
            console.log('📁 Data directory created');
        }
    }

    loadData(filename) {
        try {
            const filePath = path.join(this.dataDir, filename);
            if (fs.existsSync(filePath)) {
                const data = fs.readFileSync(filePath, 'utf8');
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            console.error(`Error loading ${filename}:`, error.message);
            return null;
        }
    }

    saveData(filename, data) {
        try {
            const filePath = path.join(this.dataDir, filename);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Error saving ${filename}:`, error.message);
            return false;
        }
    }

    initDemoUsers() {
        const bcrypt = require('bcryptjs');
        const demoUsers = [
            {
                id: 1,
                name: 'Demo User',
                email: 'demo@user.com',
                password: bcrypt.hashSync('demo123', 10),
                phone: '+91 98765 43210',
                address: '123 Fashion Ave, Mumbai, Maharashtra - 400001',
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: 'John Smith',
                email: 'john@example.com',
                password: bcrypt.hashSync('john123', 10),
                phone: '+91 87654 32109',
                address: '456 Style Blvd, Delhi - 110001',
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                name: 'Sarah Williams',
                email: 'sarah@example.com',
                password: bcrypt.hashSync('sarah123', 10),
                phone: '+91 76543 21098',
                address: '789 Trend St, Bangalore - 560001',
                createdAt: new Date().toISOString()
            }
        ];
        this.users = demoUsers;
        this.saveData('users.json', this.users);
        console.log('👤 Demo users initialized');
    }

    // User methods
    findUserByEmail(email) {
        return this.users.find(user => user.email === email);
    }

    findUserById(id) {
        return this.users.find(user => user.id === id);
    }

    createUser(userData) {
        const user = {
            id: this.users.length + 1,
            ...userData,
            createdAt: new Date().toISOString()
        };
        this.users.push(user);
        this.saveData('users.json', this.users);
        return user;
    }

    updateUser(id, updates) {
        const index = this.users.findIndex(u => u.id === id);
        if (index === -1) return null;
        
        this.users[index] = { ...this.users[index], ...updates };
        this.saveData('users.json', this.users);
        return this.users[index];
    }

    // Order methods
    createOrder(orderData) {
        const order = {
            id: this.nextOrderId++,
            ...orderData,
            createdAt: new Date().toISOString(),
            status: 'processing',
            timeline: [
                { 
                    event: 'Order Placed', 
                    time: new Date().toISOString() 
                }
            ]
        };
        this.orders.push(order);
        this.saveData('orders.json', this.orders);
        this.saveData('nextOrderId.json', this.nextOrderId);
        return order;
    }

    getOrdersByUser(userId) {
        return this.orders.filter(order => order.userId === userId);
    }

    getOrderById(orderId) {
        return this.orders.find(order => order.id === orderId);
    }

    updateOrderStatus(orderId, status) {
        const order = this.getOrderById(orderId);
        if (!order) return null;

        order.status = status;
        order.timeline.push({
            event: `Order ${status}`,
            time: new Date().toISOString()
        });

        if (status === 'delivered') {
            order.deliveredAt = new Date().toISOString();
        }

        this.saveData('orders.json', this.orders);
        return order;
    }

    // Cart methods
    getCart(userId) {
        return this.carts[userId] || { items: [], total: 0 };
    }

    updateCart(userId, cartData) {
        this.carts[userId] = cartData;
        this.saveData('carts.json', this.carts);
        return this.carts[userId];
    }

    clearCart(userId) {
        delete this.carts[userId];
        this.saveData('carts.json', this.carts);
    }
}

// Export singleton instance
const db = new Database();
module.exports = db;