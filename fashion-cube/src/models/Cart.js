// src/models/Cart.js
const db = require('../config/database');

class Cart {
    static async get(userId) {
        return db.getCart(userId);
    }

    static async update(userId, cartData) {
        const total = cartData.items.reduce((sum, item) => {
            return sum + (item.price * (item.quantity || 1));
        }, 0);

        const updatedCart = {
            ...cartData,
            total,
            updatedAt: new Date().toISOString()
        };

        return db.updateCart(userId, updatedCart);
    }

    static async addItem(userId, product, quantity = 1) {
        const cart = await this.get(userId);
        const existingItem = cart.items.find(item => item.productId === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                productId: product.id,
                name: product.title || product.name,
                price: product.price - (product.price * (product.discountPercentage || 0) / 100),
                image: product.thumbnail || product.images?.[0],
                quantity: quantity
            });
        }

        return await this.update(userId, cart);
    }

    static async removeItem(userId, productId) {
        const cart = await this.get(userId);
        cart.items = cart.items.filter(item => item.productId !== productId);
        return await this.update(userId, cart);
    }

    static async clear(userId) {
        db.clearCart(userId);
        return { items: [], total: 0 };
    }

    static async updateQuantity(userId, productId, quantity) {
        const cart = await this.get(userId);
        const item = cart.items.find(item => item.productId === productId);
        
        if (!item) {
            throw new Error('Item not found in cart');
        }

        if (quantity <= 0) {
            return await this.removeItem(userId, productId);
        }

        item.quantity = quantity;
        return await this.update(userId, cart);
    }
}

module.exports = Cart;