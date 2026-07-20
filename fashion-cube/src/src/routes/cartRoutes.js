// src/routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
    getCart,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart
} = require('../controllers/cartController');

router.use(auth);
router.get('/', getCart);
router.post('/add', addToCart);
router.delete('/remove/:productId', removeFromCart);
router.put('/update/:productId', updateCartItem);
router.delete('/clear', clearCart);

module.exports = router;