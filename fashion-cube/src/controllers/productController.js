// src/controllers/productController.js
const axios = require('axios');
const { AppError } = require('../middleware/errorHandler');

const API_BASE = process.env.DUMMY_JSON_API || 'https://dummyjson.com';

// Only these DummyJSON categories are "fashion" — everything else
// (groceries, furniture, laptops, smartphones, etc.) is excluded.
const FASHION_CATEGORIES = [
    'mens-shirts',
    'mens-shoes',
    'mens-watches',
    'womens-dresses',
    'womens-shoes',
    'womens-watches',
    'womens-bags',
    'womens-jewellery',
    'tops',
    'sunglasses',
    'fragrances',
    'sports-accessories',
    'beauty',
    'skin-care'
];

const CATEGORY_DISPLAY_NAMES = {
    'mens-shirts': "Men's Shirts",
    'mens-shoes': "Men's Shoes",
    'mens-watches': "Men's Watches",
    'womens-dresses': "Women's Dresses",
    'womens-shoes': "Women's Shoes",
    'womens-watches': "Women's Watches",
    'womens-bags': "Women's Bags",
    'womens-jewellery': "Women's Jewellery",
    'tops': 'Tops',
    'sunglasses': 'Sunglasses',
    'fragrances': 'Perfumes',
    'sports-accessories': 'Sports Accessories',
    'beauty': 'Beauty',
    'skin-care': 'Skincare'
};

const isFashionCategory = (category) => FASHION_CATEGORIES.includes(category);

// DummyJSON prices are in USD; this store displays INR.
const USD_TO_INR_RATE = 83;
const toINR = (usdAmount) => Math.round(usdAmount * USD_TO_INR_RATE * 100) / 100;

const transformProduct = (product) => {
    const discountedPriceUSD = product.price - (product.price * (product.discountPercentage || 0) / 100);
    return {
        id: product.id,
        name: product.title,
        price: toINR(discountedPriceUSD),
        originalPrice: toINR(product.price),
        discount: Math.round((product.discountPercentage || 0) * 10) / 10,
        category: product.category,
        categoryLabel: CATEGORY_DISPLAY_NAMES[product.category] || product.category,
        images: product.images || [product.thumbnail],
        thumbnail: product.thumbnail,
        description: product.description,
        rating: Math.round((product.rating || 0) * 10) / 10,
        stock: product.stock || 0,
        brand: product.brand || 'Unknown',
        popularity: Math.floor(Math.random() * 1000) + 100,
        arrivalDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reviews: Math.floor(Math.random() * 300) + 10
    };
};

// Fetch every fashion category (small page each) and merge into one pool.
const fetchAllFashionProducts = async () => {
    const responses = await Promise.all(
        FASHION_CATEGORIES.map(cat =>
            axios.get(`${API_BASE}/products/category/${cat}`, { params: { limit: 50 } })
                .catch(() => ({ data: { products: [] } }))
        )
    );
    return responses.flatMap(r => r.data.products);
};

const applyFiltersAndSort = (products, { minPrice, maxPrice, minRating, sortBy, order }) => {
    let result = products;

    if (minPrice || maxPrice) {
        const min = parseFloat(minPrice) || 0;
        const max = parseFloat(maxPrice) || Infinity;
        result = result.filter(p => p.price >= min && p.price <= max);
    }

    if (minRating) {
        const rating = parseFloat(minRating);
        result = result.filter(p => p.rating >= rating);
    }

    const sortOrders = {
        'popularity': (a, b) => b.popularity - a.popularity,
        'price-low': (a, b) => a.price - b.price,
        'price-high': (a, b) => b.price - a.price,
        'newest': (a, b) => b.id - a.id,
        'rating': (a, b) => b.rating - a.rating,
        'name': (a, b) => a.name.localeCompare(b.name)
    };

    if (sortBy && sortOrders[sortBy]) {
        result = [...result].sort(sortOrders[sortBy]);
        if (order === 'asc' && sortBy !== 'price-low' && sortBy !== 'price-high') {
            result.reverse();
        }
    }

    return result;
};

const getProducts = async (req, res, next) => {
    try {
        const {
            limit = 24,
            skip = 0,
            category,
            search,
            sortBy = 'popularity',
            order = 'desc',
            minPrice,
            maxPrice,
            minRating
        } = req.query;

        let rawProducts;

        if (search && search.trim()) {
            const response = await axios.get(`${API_BASE}/products/search`, {
                params: { q: search.trim(), limit: 100 }
            });
            rawProducts = response.data.products.filter(p => isFashionCategory(p.category));
        } else if (category && category !== 'all' && category !== 'undefined' && isFashionCategory(category)) {
            const response = await axios.get(`${API_BASE}/products/category/${category}`, {
                params: { limit: 100 }
            });
            rawProducts = response.data.products;
        } else {
            rawProducts = await fetchAllFashionProducts();
        }

        let products = rawProducts.map(transformProduct);
        products = applyFiltersAndSort(products, { minPrice, maxPrice, minRating, sortBy, order });

        const total = products.length;
        const limitNum = Math.min(parseInt(limit) || 24, 100);
        const skipNum = parseInt(skip) || 0;
        const page = products.slice(skipNum, skipNum + limitNum);

        res.json({
            success: true,
            products: page,
            total,
            limit: limitNum,
            skip: skipNum,
            hasMore: skipNum + limitNum < total
        });
    } catch (error) {
        console.error('Get products error:', error);
        next(new AppError('Failed to fetch products from API', 500));
    }
};

const getProductById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`${API_BASE}/products/${id}`);
        const product = transformProduct(response.data);

        let similarProducts = [];
        if (isFashionCategory(product.category)) {
            try {
                const similarResponse = await axios.get(`${API_BASE}/products/category/${product.category}`, {
                    params: { limit: 6 }
                });
                similarProducts = similarResponse.data.products
                    .filter(p => p.id !== parseInt(id))
                    .slice(0, 6)
                    .map(transformProduct);
            } catch (error) {
                console.log('Could not fetch similar products:', error.message);
            }
        }

        res.json({
            success: true,
            product,
            similarProducts
        });
    } catch (error) {
        console.error('Get product error:', error);
        if (error.response?.status === 404) {
            return next(new AppError('Product not found', 404));
        }
        next(new AppError('Failed to fetch product details', 500));
    }
};

const getCategories = async (req, res, next) => {
    try {
        const categoriesWithDetails = await Promise.all(
            FASHION_CATEGORIES.map(async (category) => {
                try {
                    // Fetch a couple of real products from this category so the
                    // thumbnail actually matches what the category contains
                    // (picsum.photos with a "seed" just returns a random,
                    // unrelated stock photo — not an image search).
                    const response = await axios.get(`${API_BASE}/products/category/${category}`, {
                        params: { limit: 2 }
                    });
                    const sampleProduct = response.data.products?.[0];
                    return {
                        name: CATEGORY_DISPLAY_NAMES[category] || category,
                        slug: category,
                        count: response.data.total || 0,
                        image: sampleProduct?.thumbnail || sampleProduct?.images?.[0] || `https://picsum.photos/seed/${category}/200/200`
                    };
                } catch (error) {
                    return {
                        name: CATEGORY_DISPLAY_NAMES[category] || category,
                        slug: category,
                        count: 0,
                        image: `https://picsum.photos/seed/${category}/200/200`
                    };
                }
            })
        );

        res.json({
            success: true,
            categories: categoriesWithDetails
        });
    } catch (error) {
        console.error('Get categories error:', error);
        next(new AppError('Failed to fetch categories', 500));
    }
};

const getFeaturedProducts = async (req, res, next) => {
    try {
        const { limit = 8 } = req.query;

        const rawProducts = await fetchAllFashionProducts();
        let products = rawProducts.map(transformProduct);

        products.sort((a, b) => {
            const scoreA = (a.rating || 0) + (a.discount || 0) / 10;
            const scoreB = (b.rating || 0) + (b.discount || 0) / 10;
            return scoreB - scoreA;
        });

        const featured = products.slice(0, parseInt(limit));

        res.json({
            success: true,
            products: featured
        });
    } catch (error) {
        console.error('Get featured products error:', error);
        next(new AppError('Failed to fetch featured products', 500));
    }
};

const searchProducts = async (req, res, next) => {
    try {
        const { q, limit = 30 } = req.query;

        if (!q || q.trim().length < 2) {
            return res.json({
                success: true,
                products: [],
                total: 0,
                message: 'Please provide at least 2 characters for search'
            });
        }

        const response = await axios.get(`${API_BASE}/products/search`, {
            params: { q: q.trim(), limit: 100 }
        });

        const products = response.data.products
            .filter(p => isFashionCategory(p.category))
            .slice(0, Math.min(parseInt(limit), 100))
            .map(transformProduct);

        res.json({
            success: true,
            products,
            total: products.length,
            searchQuery: q.trim()
        });
    } catch (error) {
        console.error('Search products error:', error);
        next(new AppError('Failed to search products', 500));
    }
};

module.exports = {
    getProducts,
    getProductById,
    getCategories,
    getFeaturedProducts,
    searchProducts,
    transformProduct
};
