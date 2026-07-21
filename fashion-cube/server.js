require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const errorHandler = require('./src/middleware/errorHandler');
const authRoutes = require('./src/routes/authRoutes');
const productRoutes = require('./src/routes/productRoutes');
const cartRoutes = require('./src/routes/cartRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// FRONTEND_URL can be a single origin or a comma-separated list
// (e.g. your Netlify URL) — set it in Render's environment variables.
const allowedOrigins = [
    'https://super-market-udbf.onrender.com',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(u => u.trim()) : [])
];

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend')));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, status: 'OK', timestamp: new Date().toISOString() });
});

// Real API routes (previously never mounted)
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);

// Any unmatched /api/* request -> JSON 404 (NOT the SPA's index.html)
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, message: `API route not found: ${req.method} ${req.originalUrl}` });
});

// SPA fallback for everything else (non-API GET routes)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Centralized error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log('\n🚀 FASHION CUBE Backend Server');
    console.log(`📡 Server running on https://super-market-udbf.onrender.com`);
    console.log(`📦 API URL: https://super-market-udbf.onrender.com/api`);
    console.log(`🔗 Frontend: https://super-market-udbf.onrender.com`);
    console.log('✨ Ready to accept requests!\n');
});