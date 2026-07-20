// src/controllers/paymentController.js
const { AppError } = require('../middleware/errorHandler');
const Order = require('../models/Order');

const PAYMENT_METHODS = {
    cod: {
        id: 'cod',
        name: 'Cash on Delivery',
        icon: 'fa-money-bill-wave',
        description: 'Pay when you receive',
        requiresVerification: false
    },
    card: {
        id: 'card',
        name: 'Credit/Debit Card',
        icon: 'fa-credit-card',
        description: 'Visa, Mastercard, RuPay',
        requiresVerification: true,
        verificationType: 'otp'
    },
    upi: {
        id: 'upi',
        name: 'UPI',
        icon: 'fa-mobile-alt',
        description: 'Google Pay, PhonePe, Paytm',
        requiresVerification: true,
        verificationType: 'upi_id'
    }
};

const getPaymentMethods = async (req, res, next) => {
    try {
        res.json({
            success: true,
            methods: Object.values(PAYMENT_METHODS)
        });
    } catch (error) {
        console.error('Get payment methods error:', error);
        next(error);
    }
};

const initiatePayment = async (req, res, next) => {
    try {
        const { amount, paymentMethod, orderId } = req.body;

        if (!paymentMethod || !PAYMENT_METHODS[paymentMethod]) {
            throw new AppError('Invalid payment method', 400);
        }

        if (!amount || amount <= 0) {
            throw new AppError('Invalid amount', 400);
        }

        const method = PAYMENT_METHODS[paymentMethod];
        let paymentResponse = {
            success: true,
            orderId,
            amount,
            paymentMethod,
            status: 'pending',
            requiresVerification: method.requiresVerification
        };

        let order = null;
        if (orderId) {
            order = await Order.findById(orderId);
            if (order && order.userId !== req.userId) {
                throw new AppError('Unauthorized to process this order', 403);
            }
        }

        switch (paymentMethod) {
            case 'cod':
                paymentResponse.status = 'success';
                paymentResponse.message = 'Order confirmed. Pay on delivery.';
                paymentResponse.requiresVerification = false;
                break;

            case 'card':
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                paymentResponse.otp = otp;
                paymentResponse.message = 'OTP sent to your registered mobile number';
                paymentResponse.verificationType = 'otp';
                break;

            case 'upi':
                const upiId = `fashioncube@paytm`;
                const upiPaymentUrl = `upi://pay?pa=${upiId}&pn=FashionCube&am=${amount}&cu=INR`;
                paymentResponse.upiId = upiId;
                paymentResponse.upiPaymentUrl = upiPaymentUrl;
                paymentResponse.qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiPaymentUrl)}`;
                paymentResponse.message = 'Scan QR code or use UPI ID to pay';
                paymentResponse.verificationType = 'upi_id';
                break;

            default:
                throw new AppError('Unsupported payment method', 400);
        }

        if (order && paymentResponse.status === 'success') {
            await Order.updateStatus(order.id, 'processing');
        }

        res.json({
            success: true,
            payment: paymentResponse
        });
    } catch (error) {
        console.error('Payment initiation error:', error);
        next(error);
    }
};

const verifyPayment = async (req, res, next) => {
    try {
        const { orderId, paymentMethod, otp, upiId } = req.body;

        if (!orderId) {
            throw new AppError('Order ID is required', 400);
        }

        const order = await Order.findById(orderId);
        if (!order) {
            throw new AppError('Order not found', 404);
        }

        if (order.userId !== req.userId) {
            throw new AppError('Unauthorized to verify this order', 403);
        }

        let verificationResult = {
            success: false,
            message: 'Payment verification failed'
        };

        switch (paymentMethod) {
            case 'card':
                if (!otp || otp.length !== 6) {
                    throw new AppError('Please enter a valid 6-digit OTP', 400);
                }
                verificationResult = {
                    success: true,
                    message: 'Payment verified successfully',
                    status: 'completed'
                };
                break;

            case 'upi':
                if (!upiId || !upiId.includes('@')) {
                    throw new AppError('Please enter a valid UPI ID', 400);
                }
                verificationResult = {
                    success: true,
                    message: 'UPI payment verified successfully',
                    status: 'completed',
                    transactionId: `UPI${Date.now()}`
                };
                break;

            case 'cod':
                verificationResult = {
                    success: true,
                    message: 'COD order confirmed',
                    status: 'completed'
                };
                break;

            default:
                throw new AppError('Unsupported payment method for verification', 400);
        }

        if (verificationResult.success) {
            const orderStatus = paymentMethod === 'cod' ? 'processing' : 'shipped';
            await Order.updateStatus(orderId, orderStatus);
        }

        res.json({
            success: true,
            verification: verificationResult
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        next(error);
    }
};

module.exports = {
    getPaymentMethods,
    initiatePayment,
    verifyPayment
};