// src/controllers/cartController.js
const Cart = require('../models/Cart');
const axios = require('axios');
const { AppError } = require('../middleware/errorHandler');
const { transformProduct } = require('./productController');

const getCart = async (req, res, next) => {
    try {
        const cart = await Cart.get(req.userId);
        res.json({
            success: true,
            cart,
            itemCount: cart.items.length,
            totalItems: cart.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        });
    } catch (error) {
        console.error('Get cart error:', error);
        next(new AppError('Failed to fetch cart', 500));
    }
};

const addToCart = async (req, res, next) => {
    try {
        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            throw new AppError('Product ID is required', 400);
        }

        if (quantity < 1 || quantity > 99) {
            throw new AppError('Quantity must be between 1 and 99', 400);
        }

        let product;
        try {
            const response = await axios.get(`https://dummyjson.com/products/${productId}`);
            product = transformProduct(response.data);
        } catch (error) {
            if (error.response?.status === 404) {
                throw new AppError('Product not found', 404);
            }
            throw new AppError('Failed to fetch product details', 500);
        }

        if (product.stock < quantity) {
            throw new AppError(`Only ${product.stock} items available in stock`, 400);
        }

        const cart = await Cart.addItem(req.userId, product, quantity);

        res.json({
            success: true,
            cart,
            message: 'Item added to cart successfully',
            itemCount: cart.items.length
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        next(error);
    }
};

const removeFromCart = async (req, res, next) => {
    try {
        const { productId } = req.params;

        if (!productId) {
            throw new AppError('Product ID is required', 400);
        }

        const cart = await Cart.removeItem(req.userId, parseInt(productId));

        res.json({
            success: true,
            cart,
            message: 'Item removed from cart successfully'
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        next(error);
    }
};

const updateCartItem = async (req, res, next) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!productId) {
            throw new AppError('Product ID is required', 400);
        }

        if (quantity === undefined || quantity < 0 || quantity > 99) {
            throw new AppError('Quantity must be between 0 and 99', 400);
        }

        if (quantity === 0) {
            return await removeFromCart(req, res, next);
        }

        const cart = await Cart.updateQuantity(req.userId, parseInt(productId), quantity);

        res.json({
            success: true,
            cart,
            message: 'Cart updated successfully'
        });
    } catch (error) {
        console.error('Update cart error:', error);
        next(error);
    }
};

const clearCart = async (req, res, next) => {
    try {
        await Cart.clear(req.userId);
        res.json({
            success: true,
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        next(new AppError('Failed to clear cart', 500));
    }
};

module.exports = {
    getCart,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart
};