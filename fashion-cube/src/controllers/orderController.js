// src/controllers/orderController.js
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { AppError } = require('../middleware/errorHandler');

const createOrder = async (req, res, next) => {
    try {
        const { 
            items, 
            address, 
            city, 
            state, 
            pincode, 
            phone, 
            paymentMethod,
            deliveryInstructions 
        } = req.body;

        if (!items || items.length === 0) {
            throw new AppError('No items in order', 400);
        }

        if (!address || !city || !state || !pincode || !phone) {
            throw new AppError('Please provide complete address details', 400);
        }

        if (!paymentMethod) {
            throw new AppError('Please select a payment method', 400);
        }

        const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
        if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
            throw new AppError('Please enter a valid Indian phone number', 400);
        }

        const total = items.reduce((sum, item) => {
            return sum + (item.price * (item.quantity || 1));
        }, 0);

        if (total === 0) {
            throw new AppError('Order total cannot be zero', 400);
        }

        const user = req.user;

        const orderData = {
            userId: req.userId,
            userEmail: user.email,
            userName: user.name,
            items: items.map(item => ({
                productId: item.productId || item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity || 1,
                image: item.image || item.images?.[0] || null,
                total: (item.price * (item.quantity || 1))
            })),
            address,
            city,
            state,
            pincode,
            phone,
            paymentMethod,
            deliveryInstructions: deliveryInstructions || '',
            total,
            subtotal: total,
            tax: Math.round(total * 0.10 * 100) / 100,
            shipping: total > 999 ? 0 : 99,
            grandTotal: Math.round((total + (total * 0.10) + (total > 999 ? 0 : 99)) * 100) / 100
        };

        const order = await Order.create(orderData);
        await Cart.clear(req.userId);

        res.status(201).json({
            success: true,
            order,
            message: `Order #${order.id} created successfully`
        });
    } catch (error) {
        console.error('Create order error:', error);
        next(error);
    }
};

const getOrders = async (req, res, next) => {
    try {
        const orders = await Order.findByUser(req.userId);
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            orders,
            count: orders.length
        });
    } catch (error) {
        console.error('Get orders error:', error);
        next(new AppError('Failed to fetch orders', 500));
    }
};

const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(parseInt(id));
        
        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (order.userId !== req.userId) {
            throw new AppError('You are not authorized to view this order', 403);
        }

        res.json({
            success: true,
            order
        });
    } catch (error) {
        console.error('Get order error:', error);
        next(error);
    }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new AppError('Invalid order status', 400);
        }

        const order = await Order.updateStatus(parseInt(id), status);
        if (!order) {
            throw new AppError('Order not found', 404);
        }

        res.json({
            success: true,
            order,
            message: `Order #${id} status updated to ${status}`
        });
    } catch (error) {
        console.error('Update order status error:', error);
        next(error);
    }
};

const cancelOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const order = await Order.findById(parseInt(id));
        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (order.userId !== req.userId) {
            throw new AppError('You are not authorized to cancel this order', 403);
        }

        if (order.status === 'delivered') {
            throw new AppError('Delivered orders cannot be cancelled', 400);
        }

        if (order.status === 'cancelled') {
            throw new AppError('Order is already cancelled', 400);
        }

        const cancelledOrder = await Order.updateStatus(parseInt(id), 'cancelled');

        res.json({
            success: true,
            order: cancelledOrder,
            message: `Order #${id} cancelled successfully`
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        next(error);
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder
};