// src/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProductById,
    getCategories,
    getFeaturedProducts,
    searchProducts
} = require('../controllers/productController');

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/featured', getFeaturedProducts);
router.get('/search', searchProducts);
router.get('/:id', getProductById);

module.exports = router;