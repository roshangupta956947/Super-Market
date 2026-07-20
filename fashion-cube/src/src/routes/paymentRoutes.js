// src/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
    getPaymentMethods,
    initiatePayment,
    verifyPayment
} = require('../controllers/paymentController');

router.get('/methods', getPaymentMethods);
router.post('/initiate', auth, initiatePayment);
router.post('/verify', auth, verifyPayment);

module.exports = router;