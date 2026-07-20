// src/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/auth');
const {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder
} = require('../controllers/orderController');

router.use(auth);
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);
router.put('/:id/status', admin, updateOrderStatus);

module.exports = router;