// frontend/js/app.js
// Complete Working Version

console.log('🚀 App starting...');

// Global state
let isLoggedIn = false;
let currentUserData = null;
let currentPage = 'home';
let allProducts = [];
let cart = [];
let wishlist = [];
let featuredProducts = [];

// Product listing pagination/filter state
const PRODUCTS_PER_PAGE = 12;
let productQuery = { page: 1, category: undefined, search: undefined };
let productsTotal = 0;

// Checkout flow state (address collected in step 1, used in step 2)
let checkoutAddressData = null;

// Matches backend FASHION_CATEGORIES slugs to display names
const CATEGORY_LABELS = {
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

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 DOM loaded, initializing app...');
    initApp();
});

// Initialize App
async function initApp() {
    console.log('🔧 Setting up app...');
    
    // Setup event listeners
    setupEventListeners();
    
    // Restore session if a token was saved from a previous visit
    await restoreSession();
    
    // Load initial data
    await loadInitialData();
    
    // Navigate to home
    navigateTo('home');
    
    console.log('✅ App initialized successfully');
}

// Restore login session from a saved token
async function restoreSession() {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    try {
        const data = await API.AuthAPI.getProfile();
        isLoggedIn = true;
        currentUserData = data.user;
        updateUserDisplay();
        console.log(`✅ Session restored for ${data.user.name}`);
    } catch (error) {
        console.warn('Saved session is no longer valid, logging out.');
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }
}

// Toggle header UI between guest and logged-in state
function updateUserDisplay() {
    const userDisplay = document.getElementById('userDisplay');
    const userName = document.getElementById('userNameDisplay');
    const authIcon = document.getElementById('authIcon');
    
    if (isLoggedIn && currentUserData) {
        if (userDisplay) userDisplay.style.display = 'flex';
        if (userName) userName.textContent = currentUserData.name;
        if (authIcon) authIcon.style.display = 'none';
    } else {
        if (userDisplay) userDisplay.style.display = 'none';
        if (authIcon) authIcon.style.display = 'block';
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Home button
    document.getElementById('homeBtn')?.addEventListener('click', () => {
        navigateTo('home');
    });

    // Search
    document.getElementById('searchBtn')?.addEventListener('click', handleSearch);
    document.getElementById('searchInput')?.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Navigation links
    document.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const page = el.dataset.page;
            navigateTo(page);
        });
    });

    // Cart icon
    document.getElementById('cartIcon')?.addEventListener('click', () => {
        navigateTo('cart');
    });

    // Wishlist icon
    document.getElementById('wishlistIcon')?.addEventListener('click', () => {
        navigateTo('wishlist');
    });

    // Auth icon
    document.getElementById('authIcon')?.addEventListener('click', () => {
        openAuth('login');
    });

    // Logged-in user display (goes to profile)
    document.getElementById('userDisplay')?.addEventListener('click', () => {
        navigateTo('profile');
    });

    // Orders nav
    document.getElementById('ordersNav')?.addEventListener('click', () => {
        if (!isLoggedIn) {
            showToast('🔐 Please sign in to view your orders');
            openAuth('login');
            return;
        }
        navigateTo('orders');
    });

    // Auth modal
    document.getElementById('authClose')?.addEventListener('click', closeAuth);
    document.getElementById('authSubmit')?.addEventListener('click', handleAuth);
    document.getElementById('authToggle')?.addEventListener('click', toggleAuthMode);

    // Back buttons
    document.getElementById('detailBack')?.addEventListener('click', () => navigateTo('home'));
    document.getElementById('cartBack')?.addEventListener('click', () => navigateTo('home'));
    document.getElementById('wishlistBack')?.addEventListener('click', () => navigateTo('home'));
    document.getElementById('ordersBack')?.addEventListener('click', () => navigateTo('home'));
    document.getElementById('profileBack')?.addEventListener('click', () => navigateTo('home'));
    document.getElementById('checkoutBack')?.addEventListener('click', () => navigateTo('cart'));
}

// Navigation
async function navigateTo(page, params = {}) {
    console.log(`🔀 Navigating to: ${page}`);
    currentPage = page;
    
    // Show/hide pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    switch(page) {
        case 'home':
            await loadHomePage();
            break;
        case 'products':
            await loadProductsPage(params);
            break;
        case 'product-details':
            await loadProductDetails(params);
            break;
        case 'cart':
            await loadCartPage();
            break;
        case 'wishlist':
            await loadWishlistPage();
            break;
        case 'checkout':
            await loadCheckoutPage();
            break;
        case 'payment':
            await loadPaymentPage();
            break;
        case 'orders':
            await loadOrdersPage();
            break;
        case 'profile':
            await loadProfilePage();
            break;
        default:
            await loadHomePage();
    }
}

// ============================================================
// LOAD INITIAL DATA
// ============================================================

async function loadInitialData() {
    try {
        console.log('📥 Loading initial data...');
        
        // Load featured products
        const featured = await API.ProductAPI.getFeaturedProducts(8);
        featuredProducts = featured.products || [];
        console.log(`✅ Loaded ${featuredProducts.length} featured products`);
        
        // Load categories
        const categories = await API.ProductAPI.getCategories();
        window.categories = categories.categories || [];
        console.log(`✅ Loaded ${window.categories.length} categories`);
        
    } catch (error) {
        console.error('❌ Failed to load initial data:', error);
    }
}

// ============================================================
// PAGE LOADERS
// ============================================================

async function loadHomePage() {
    console.log('🏠 Loading home page...');
    const container = document.getElementById('main-content');
    
    // Load the home page HTML
    container.innerHTML = `
        <div id="home" class="page active">
            <!-- Hero Carousel -->
            <div class="hero-carousel" id="heroCarousel">
                <div class="hero-slides" id="heroSlides">
                    <!-- Generated by JS -->
                </div>
                <button class="hero-arrows left" id="heroPrev"><i class="fas fa-chevron-left"></i></button>
                <button class="hero-arrows right" id="heroNext"><i class="fas fa-chevron-right"></i></button>
                <div class="hero-dots" id="heroDots"></div>
            </div>

            <!-- Categories -->
            <div class="section-head">
                <h3>Shop by Category</h3>
            </div>
            <div class="category-grid" id="categoryGrid"></div>

            <!-- Featured Products -->
            <div class="section-head">
                <h3>Featured Products</h3>
                <a href="#" data-page="products" class="view-all">View All <i class="fas fa-arrow-right"></i></a>
            </div>
            <div class="product-grid" id="featuredGrid"></div>

            <!-- Promo Banner -->
            <div class="promo-banner">
                <div class="promo-content">
                    <h2>Summer Sale</h2>
                    <p>Get up to 50% off on selected items</p>
                    <button class="btn-shop" data-page="products">Shop Now</button>
                </div>
            </div>
        </div>
    `;
    
    // Render content
    renderHero();
    renderCategories();
    renderFeaturedProducts();
    
    // Reattach event listeners for new elements
    document.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            const page = el.dataset.page;
            navigateTo(page);
        });
    });
    
    showPage('home');
}

async function loadProductsPage(params = {}) {
    console.log('📦 Loading products page...', params);

    // A fresh navigation (from a banner, category, or search) resets to page 1.
    // Calling goToProductPage() re-invokes this with an explicit `page`.
    productQuery = {
        page: params.page || 1,
        category: params.category || undefined,
        search: params.search !== undefined ? params.search : undefined
    };

    const container = document.getElementById('main-content');
    
    const heading = productQuery.search
        ? `Results for "${productQuery.search}"`
        : (productQuery.category ? (CATEGORY_LABELS[productQuery.category] || productQuery.category) : 'All Products');

    container.innerHTML = `
        <div id="products" class="page">
            <div class="section-head">
                <h3>${heading}</h3>
                <div class="section-controls">
                    <button class="btn-filter-toggle" id="filterToggle"><i class="fas fa-sliders-h"></i> Filters</button>
                    <select class="sort-select" id="sortSelect">
                        <option value="popularity">Most Popular</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="newest">Newest First</option>
                        <option value="rating">Highest Rated</option>
                    </select>
                </div>
            </div>
            <div class="filter-panel" id="filterPanel">
                <h4><i class="fas fa-filter"></i> Filter Products</h4>
                <div class="filter-row">
                    <div class="filter-group">
                        <label>Category</label>
                        <select id="filterCategory">
                            <option value="all">All Categories</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Min Price (₹)</label>
                        <input type="number" id="filterMinPrice" placeholder="0" min="0">
                    </div>
                    <div class="filter-group">
                        <label>Max Price (₹)</label>
                        <input type="number" id="filterMaxPrice" placeholder="15000" min="0">
                    </div>
                    <div class="filter-group">
                        <label>Min Rating</label>
                        <select id="filterRating">
                            <option value="0">Any Rating</option>
                            <option value="4">4+ Stars</option>
                            <option value="4.5">4.5+ Stars</option>
                            <option value="4.8">4.8+ Stars</option>
                        </select>
                    </div>
                </div>
                <div class="filter-actions">
                    <button class="btn-apply-filter" id="applyFilters">Apply Filters</button>
                    <button class="btn-reset-filter" id="resetFilters">Reset</button>
                </div>
            </div>
            <div class="product-grid" id="productGrid">
                <div style="grid-column:1/-1;text-align:center;padding:3rem;color:#999;">
                    <i class="fas fa-spinner fa-spin" style="font-size:2rem;display:block;margin-bottom:1rem;"></i>
                    Loading products...
                </div>
            </div>
            <div class="pagination" id="pagination"></div>
        </div>
    `;
    
    // Setup filters
    populateCategoryFilter();
    setupProductFilters();
    if (productQuery.category) {
        const catSelect = document.getElementById('filterCategory');
        if (catSelect) catSelect.value = productQuery.category;
    }
    
    await fetchAndRenderProductsPage();
    
    showPage('products');
}

// Fetches the current page of products for productQuery and renders
// both the grid and the pagination controls underneath it.
async function fetchAndRenderProductsPage() {
    const grid = document.getElementById('productGrid');
    try {
        const apiParams = {
            limit: PRODUCTS_PER_PAGE,
            skip: (productQuery.page - 1) * PRODUCTS_PER_PAGE
        };
        if (productQuery.category) apiParams.category = productQuery.category;
        if (productQuery.sortBy) apiParams.sortBy = productQuery.sortBy;
        if (productQuery.minPrice) apiParams.minPrice = productQuery.minPrice;
        if (productQuery.maxPrice) apiParams.maxPrice = productQuery.maxPrice;
        if (productQuery.minRating) apiParams.minRating = productQuery.minRating;

        let data;
        if (productQuery.search) {
            data = await API.ProductAPI.searchProducts(productQuery.search);
        } else {
            data = await API.ProductAPI.getProducts(apiParams);
        }

        allProducts = data.products || [];
        productsTotal = data.total ?? allProducts.length;
        console.log(`✅ Loaded ${allProducts.length} of ${productsTotal} products`);
        renderProducts(allProducts);
        renderPagination();
    } catch (error) {
        console.error('Failed to load products:', error);
        if (grid) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:3rem;color:#999;">
                    <i class="fas fa-exclamation-circle" style="font-size:2rem;display:block;margin-bottom:1rem;color:#c0392b;"></i>
                    Failed to load products. Please try again.
                    <br>
                    <button onclick="location.reload()" style="margin-top:1rem;padding:0.8rem 2rem;background:#1e1e1e;color:white;border:none;border-radius:60px;cursor:pointer;">
                        Refresh
                    </button>
                </div>
            `;
        }
    }
}

// Renders numbered page buttons under the product grid.
function renderPagination() {
    const container = document.getElementById('pagination');
    if (!container) return;

    // Search results come back as one flat list from DummyJSON,
    // so there's nothing meaningful to paginate — hide it.
    if (productQuery.search) {
        container.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(productsTotal / PRODUCTS_PER_PAGE);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const current = productQuery.page;
    let html = `<button ${current === 1 ? 'disabled' : ''} data-page="${current - 1}"><i class="fas fa-chevron-left"></i></button>`;

    const start = Math.max(1, current - 2);
    const end = Math.min(totalPages, current + 2);

    if (start > 1) {
        html += `<button data-page="1">1</button>`;
        if (start > 2) html += `<span>...</span>`;
    }
    for (let i = start; i <= end; i++) {
        html += `<button class="${i === current ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    if (end < totalPages) {
        if (end < totalPages - 1) html += `<span>...</span>`;
        html += `<button data-page="${totalPages}">${totalPages}</button>`;
    }

    html += `<button ${current === totalPages ? 'disabled' : ''} data-page="${current + 1}"><i class="fas fa-chevron-right"></i></button>`;

    container.innerHTML = html;

    container.querySelectorAll('button[data-page]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const page = parseInt(btn.dataset.page);
            if (!page || page < 1 || page > totalPages || page === current) return;
            productQuery.page = page;
            await fetchAndRenderProductsPage();
            document.getElementById('productGrid')?.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

async function loadProductDetails(params) {
    const productId = params.id || params.productId;
    if (!productId) {
        navigateTo('home');
        return;
    }
    
    console.log(`📄 Loading product details for ID: ${productId}`);
    const container = document.getElementById('main-content');
    
    container.innerHTML = `
        <div id="product-details" class="page">
            <button class="btn-back" id="detailBack"><i class="fas fa-arrow-left"></i> Back to shop</button>
            <div class="product-detail">
                <div class="product-detail-gallery">
                    <div class="product-detail-main-img" id="detailMainImg"></div>
                    <div class="product-detail-thumbs" id="detailThumbs"></div>
                </div>
                <div class="product-detail-info">
                    <h1 id="detailName">Product Name</h1>
                    <div class="price" id="detailPrice">₹ 0.00</div>
                    <div class="stock" id="detailStock">In Stock</div>
                    <div class="rating" id="detailRating">⭐ 0.0 (0 reviews)</div>
                    <div class="desc" id="detailDesc">Description</div>
                    <div class="detail-actions">
                        <button class="btn-add-cart" id="detailAddCart"><i class="fas fa-shopping-bag"></i> Add to Cart</button>
                        <button class="btn-buy" id="detailBuyNow"><i class="fas fa-bolt"></i> Buy Now</button>
                        <button class="btn-wishlist" id="detailWishlist"><i class="far fa-heart"></i></button>
                    </div>
                </div>
            </div>
            <div class="recommendations">
                <h3>You Might Also Like</h3>
                <div class="recommend-grid" id="recommendGrid"></div>
            </div>
        </div>
    `;
    
    // Reattach back button
    document.getElementById('detailBack')?.addEventListener('click', () => navigateTo('home'));
    
    // Load product details
    try {
        const data = await API.ProductAPI.getProductById(productId);
        if (data.success) {
            renderProductDetails(data.product, data.similarProducts || []);
        }
    } catch (error) {
        console.error('Failed to load product details:', error);
        showToast('❌ Failed to load product details');
    }
    
    showPage('product-details');
}

async function loadCartPage() {
    console.log('🛒 Loading cart page...');
    const container = document.getElementById('main-content');
    
    container.innerHTML = `
        <div id="cart" class="page">
            <button class="btn-back" id="cartBack"><i class="fas fa-arrow-left"></i> Back to shop</button>
            <h2 style="margin: 1rem 0;">Your Cart</h2>
            <div id="cartItems" class="cart-items"></div>
            <div id="cartEmpty" style="text-align: center; padding: 3rem; color: #999;">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; display: block; margin-bottom: 1rem;"></i>
                Your cart is empty.
            </div>
            <div id="cartSummary" class="cart-summary" style="display: none;">
                <div class="cart-total" id="cartTotal">Total: ₹ 0.00</div>
                <div class="cart-actions">
                    <button class="btn-buy" id="checkoutBtn" style="padding: 0.8rem 2rem; background: #1e1e1e; color: white; border: none; border-radius: 60px; font-weight: 600; cursor: pointer;">
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('cartBack')?.addEventListener('click', () => navigateTo('home'));
    document.getElementById('checkoutBtn')?.addEventListener('click', () => navigateTo('checkout'));
    
    renderCartItems();
    showPage('cart');
}

async function loadWishlistPage() {
    console.log('❤️ Loading wishlist page...');
    const container = document.getElementById('main-content');
    
    container.innerHTML = `
        <div id="wishlist" class="page">
            <button class="btn-back" id="wishlistBack"><i class="fas fa-arrow-left"></i> Back to shop</button>
            <h2 style="margin: 1rem 0;">❤️ My Wishlist</h2>
            <div id="wishlistItems" class="product-grid"></div>
            <div id="wishlistEmpty" style="text-align: center; padding: 3rem; color: #999;">
                <i class="far fa-heart" style="font-size: 3rem; display: block; margin-bottom: 1rem;"></i>
                Your wishlist is empty.
            </div>
        </div>
    `;
    
    document.getElementById('wishlistBack')?.addEventListener('click', () => navigateTo('home'));
    renderWishlistItems();
    showPage('wishlist');
}

async function loadCheckoutPage() {
    if (!isLoggedIn) {
        showToast('🔐 Please sign in to checkout');
        openAuth('login');
        return;
    }
    
    if (cart.length === 0) {
        showToast('🛒 Your cart is empty!');
        navigateTo('home');
        return;
    }
    
    console.log('📍 Loading delivery address page...');
    const container = document.getElementById('main-content');
    const saved = checkoutAddressData || {};
    
    container.innerHTML = `
        <div id="checkout" class="page">
            <button class="btn-back" id="checkoutBack"><i class="fas fa-arrow-left"></i> Back to cart</button>
            <div class="checkout-form">
                <h2>Delivery Address</h2>
                <label>Full Name</label>
                <input type="text" id="checkoutName" placeholder="Sumit Sharma" value="${saved.name || ''}">
                <label>Phone Number (Indian)</label>
                <input type="tel" id="checkoutPhone" placeholder="+91 98765 43210" value="${saved.phone || ''}">
                <label>Delivery Address</label>
                <div class="address-grid">
                    <input type="text" id="checkoutAddress" placeholder="Street Address" class="full-width" value="${saved.address || ''}">
                    <input type="text" id="checkoutCity" placeholder="City" value="${saved.city || ''}">
                    <input type="text" id="checkoutState" placeholder="State" value="${saved.state || ''}">
                    <input type="text" id="checkoutPincode" placeholder="Pincode" value="${saved.pincode || ''}">
                </div>
                <button class="btn-place-order" id="continueToPaymentBtn" style="margin-top:1.5rem;">Continue to Payment</button>
            </div>
        </div>
    `;
    
    document.getElementById('checkoutBack')?.addEventListener('click', () => navigateTo('cart'));
    document.getElementById('continueToPaymentBtn')?.addEventListener('click', () => {
        const name = document.getElementById('checkoutName').value.trim();
        const phone = document.getElementById('checkoutPhone').value.trim();
        const address = document.getElementById('checkoutAddress').value.trim();
        const city = document.getElementById('checkoutCity').value.trim();
        const state = document.getElementById('checkoutState').value.trim();
        const pincode = document.getElementById('checkoutPincode').value.trim();
        
        if (!name || !phone || !address || !city || !state || !pincode) {
            showToast('⚠️ Please fill in all address fields');
            return;
        }
        
        checkoutAddressData = { name, phone, address, city, state, pincode };
        navigateTo('payment');
    });
    
    showPage('checkout');
}

async function loadPaymentPage() {
    if (!isLoggedIn) {
        showToast('🔐 Please sign in to checkout');
        openAuth('login');
        return;
    }
    
    if (cart.length === 0) {
        showToast('🛒 Your cart is empty!');
        navigateTo('home');
        return;
    }
    
    if (!checkoutAddressData) {
        showToast('📍 Please enter your delivery address first');
        navigateTo('checkout');
        return;
    }
    
    console.log('💳 Loading payment page...');
    const container = document.getElementById('main-content');
    const total = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    
    container.innerHTML = `
        <div id="payment" class="page">
            <button class="btn-back" id="paymentBack"><i class="fas fa-arrow-left"></i> Back to address</button>
            <div class="checkout-form">
                <h2>Payment Method</h2>
                <p style="color:#888;margin-bottom:1rem;">Delivering to ${checkoutAddressData.name}, ${checkoutAddressData.city}</p>
                <div class="payment-options" id="paymentOptions">
                    <div class="payment-option selected" data-method="cod">
                        <i class="fas fa-money-bill-wave"></i>
                        <h4>Cash on Delivery</h4>
                        <p>Pay when you receive</p>
                    </div>
                
                    <div class="payment-option" data-method="upi">
                        <i class="fas fa-mobile-alt"></i>
                        <h4>UPI</h4>
                        <p>Google Pay, PhonePe, Paytm</p>
                    </div>
                </div>
                <div id="paymentExtra"></div>
                <div class="cart-total" style="margin-top:1.5rem;">Total: ₹ ${total.toFixed(2)}</div>
                <button class="btn-place-order" id="placeOrderBtn">Place Order</button>
            </div>
        </div>
    `;
    
    document.getElementById('paymentBack')?.addEventListener('click', () => navigateTo('checkout'));
    document.getElementById('placeOrderBtn')?.addEventListener('click', placeOrder);
    
    document.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', async function() {
            document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            await showPaymentExtra(this.dataset.method, total);
        });
    });
    
    showPage('payment');
}

// Shows method-specific extras below the payment options —
// currently just the UPI QR code, fetched from the real payment API.
async function showPaymentExtra(method, total) {
    const extra = document.getElementById('paymentExtra');
    if (!extra) return;
    
    if (method !== 'upi') {
        extra.innerHTML = '';
        return;
    }
    
    extra.innerHTML = `<p style="text-align:center;color:#888;padding:1rem;"><i class="fas fa-spinner fa-spin"></i> Generating QR code...</p>`;
    
    try {
        const data = await API.PaymentAPI.initiate({ amount: total, paymentMethod: 'upi' });
        const payment = data.payment;
        extra.innerHTML = `
            <div class="qr-code">
                <div class="qr-placeholder" style="padding:0;">
                    <img src="${payment.qrCode}" alt="UPI QR Code" style="width:100%;height:100%;object-fit:contain;border-radius:18px;">
                </div>
                <p>Scan to pay ₹ ${total.toFixed(2)} with any UPI app</p>
                <p style="font-size:0.85rem;">UPI ID: ${payment.upiId}</p>
            </div>
        `;
    } catch (error) {
        console.error('Failed to generate UPI QR:', error);
        extra.innerHTML = `<p style="text-align:center;color:#c0392b;">Failed to load UPI QR code. Please try again.</p>`;
    }
}

async function loadOrdersPage() {
    if (!isLoggedIn) {
        showToast('🔐 Please sign in to view your orders');
        openAuth('login');
        return;
    }
    
    console.log('📦 Loading orders page...');
    const container = document.getElementById('main-content');
    
    container.innerHTML = `
        <div id="orders" class="page">
            <button class="btn-back" id="ordersBack"><i class="fas fa-arrow-left"></i> Back to shop</button>
            <h2 style="margin: 1rem 0;">📦 My Orders</h2>
            <div id="ordersList" class="orders-section">
                <div style="text-align:center;padding:3rem;color:#999;">
                    <i class="fas fa-spinner fa-spin" style="font-size:2rem;display:block;margin-bottom:1rem;"></i>
                    Loading your orders...
                </div>
            </div>
            <div id="ordersEmpty" style="display:none;text-align: center; padding: 3rem; color: #999;">
                <i class="fas fa-box" style="font-size: 3rem; display: block; margin-bottom: 1rem;"></i>
                No orders yet.
            </div>
        </div>
    `;
    
    document.getElementById('ordersBack')?.addEventListener('click', () => navigateTo('home'));
    showPage('orders');

    try {
        const data = await API.OrderAPI.getOrders();
        renderOrdersList(data.orders || []);
    } catch (error) {
        console.error('Failed to load orders:', error);
        const list = document.getElementById('ordersList');
        if (list) {
            list.innerHTML = `<p style="text-align:center;color:#c0392b;padding:2rem;">Failed to load your orders. Please try again.</p>`;
        }
    }
}

function renderOrdersList(orders) {
    const list = document.getElementById('ordersList');
    const empty = document.getElementById('ordersEmpty');
    if (!list) return;

    if (!orders || orders.length === 0) {
        list.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }

    if (empty) empty.style.display = 'none';

    list.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <h4>Order #${order.id}</h4>
                <span class="order-status ${order.status}">${(order.status || 'processing').toUpperCase()}</span>
            </div>
            <p><strong>Placed:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Total:</strong> ₹ ${(order.grandTotal || order.total || 0).toFixed(2)}</p>
            <p><strong>Payment:</strong> ${(order.paymentMethod || 'cod').toUpperCase()}</p>
            <p><strong>Delivering to:</strong> ${order.address}, ${order.city}</p>
            <div class="order-items">
                ${(order.items || []).map(item => `
                    <div class="order-item">
                        <img src="${item.image || 'https://via.placeholder.com/50'}" alt="${item.name}">
                        <div class="order-item-info">
                            <h5>${item.name}</h5>
                            <p>₹ ${(item.price || 0).toFixed(2)} × ${item.quantity || 1}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

async function loadProfilePage() {
    if (!isLoggedIn) {
        showToast('🔐 Please sign in to view your profile');
        openAuth('login');
        return;
    }
    
    console.log('👤 Loading profile page...');
    const container = document.getElementById('main-content');
    
    container.innerHTML = `
        <div id="profile" class="page">
            <button class="btn-back" id="profileBack"><i class="fas fa-arrow-left"></i> Back to shop</button>
            <div class="profile-card" id="profileCard">
                <div class="profile-avatar"><i class="fas fa-user"></i></div>
                <h2 id="profileName">User Name</h2>
                <p class="email" id="profileEmail">user@email.com</p>
                <div class="profile-detail">
                    <span class="label">📱 Phone</span>
                    <span class="value" id="profilePhone">Not set</span>
                </div>
                <div class="profile-detail">
                    <span class="label">📍 Address</span>
                    <span class="value" id="profileAddress">Not set</span>
                </div>
                <div class="profile-detail">
                    <span class="label">📦 Orders</span>
                    <span class="value" id="profileOrders">0</span>
                </div>
                <div class="profile-detail">
                    <span class="label">❤️ Wishlist</span>
                    <span class="value" id="profileWishlist">0</span>
                </div>
                <button class="btn-logout" id="logoutBtn" style="margin-top: 1.5rem;">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('profileBack')?.addEventListener('click', () => navigateTo('home'));
    document.getElementById('logoutBtn')?.addEventListener('click', logoutUser);

    if (currentUserData) {
        document.getElementById('profileName').textContent = currentUserData.name || 'User';
        document.getElementById('profileEmail').textContent = currentUserData.email || '';
        document.getElementById('profilePhone').textContent = currentUserData.phone || 'Not set';
        document.getElementById('profileAddress').textContent = currentUserData.address || 'Not set';
    }

    showPage('profile');
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
        console.log(`📄 Showing page: ${pageId}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderHero() {
    const heroSlides = document.getElementById('heroSlides');
    if (!heroSlides) return;
    
    const slides = [
        {
            title: 'SPRING / SUMMER',
            subtitle: 'COLLECTION 2026',
            tag: '✦ new season',
            offer: 'Get up to 30% Off New Arrivals',
            image: 'https://i.pinimg.com/1200x/c1/bc/d2/c1bcd2349f213727c8402675e461f72e.jpg',
            productImage: 'https://images.unsplash.com/photo-1583744946564-b52d01e7f922?w=300&h=300&fit=crop',
            category: 'womens-dresses'
        },
        {
            title: 'WINTER SALE',
            subtitle: 'UP TO 50% OFF',
            tag: '✦ limited time',
            offer: 'Premium Winter Collection',
            image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=400&fit=crop',
            productImage: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&h=300&fit=crop',
            category: 'mens-shirts'
        },
        {
            title: 'EXCLUSIVE',
            subtitle: 'LUXURY COLLECTION',
            tag: '✦ premium',
            offer: 'Designer Pieces at Best Prices',
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop',
            productImage: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=300&h=300&fit=crop',
            category: 'womens-jewellery'
        }
    ];

    heroSlides.innerHTML = slides.map((slide, idx) => `
        <div class="hero-slide" style="background-image: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${slide.image}');">
            <div class="hero-slide-content">
                <h2><strong>${slide.title}</strong><br>${slide.subtitle}</h2>
                <div class="sub">${slide.tag}</div>
                <div class="offer">${slide.offer}</div>
                <button class="btn-shop" data-category="${slide.category}">SHOP NOW</button>
            </div>
            <div class="hero-slide-image" style="background-image: url('${slide.productImage}');"></div>
        </div>
    `).join('');

    // Each slide's Shop Now button jumps straight into that slide's category
    document.querySelectorAll('.hero-slide .btn-shop').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo('products', { category: btn.dataset.category });
        });
    });
}

function renderCategories() {
    const grid = document.getElementById('categoryGrid');
    if (!grid) return;
    
    const categories = (window.categories && window.categories.length > 0) ? window.categories : [
        { name: "Women's Dresses", slug: 'womens-dresses', count: 0, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop' },
        { name: "Men's Shirts", slug: 'mens-shirts', count: 0, image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300&h=300&fit=crop' },
        { name: "Women's Shoes", slug: 'womens-shoes', count: 0, image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&h=300&fit=crop' },
        { name: "Women's Bags", slug: 'womens-bags', count: 0, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&h=300&fit=crop' },
        { name: 'Perfumes', slug: 'fragrances', count: 0, image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop' }
    ];
    
    grid.innerHTML = categories.map(cat => `
        <div class="category-card" data-category="${cat.slug}">
            <div class="category-img" style="background-image: url('${cat.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop'}');">
                <span class="category-name">${cat.name}</span>
                <span class="category-count">${cat.count || 0} items</span>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            const category = this.dataset.category;
            navigateTo('products', { category });
        });
    });
}

function renderFeaturedProducts() {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;
    
    if (featuredProducts && featuredProducts.length > 0) {
        grid.innerHTML = renderProductCards(featuredProducts);
        wireProductCards(grid, featuredProducts);
    } else {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 2rem;">No featured products available</p>';
    }
}

function renderProducts(products) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    if (products && products.length > 0) {
        grid.innerHTML = renderProductCards(products);
        wireProductCards(grid, products);
    } else {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 3rem;">No products found</p>';
    }
}

// Attaches click handlers to product cards (open details) and
// wishlist heart buttons (toggle) inside the given container.
function wireProductCards(container, products) {
    container.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.product-wishlist-btn')) return;
            const id = parseInt(card.dataset.id);
            navigateTo('product-details', { id });
        });
    });

    container.querySelectorAll('.product-wishlist-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            const product = products.find(p => p.id === id);
            if (!product) return;

            toggleWishlist(product);

            const nowInWishlist = wishlist.some(item => item.id === id);
            btn.classList.toggle('active', nowInWishlist);
            btn.innerHTML = nowInWishlist
                ? '<i class="fas fa-heart"></i>'
                : '<i class="far fa-heart"></i>';
        });
    });
}

function renderProductCards(products) {
    if (!products || products.length === 0) {
        return '<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 2rem;">No products available</p>';
    }

    return products.map(p => {
        const imageUrl = p.images?.[0] || p.thumbnail || `https://picsum.photos/seed/${p.id}/200/200`;
        const isInWishlist = wishlist.some(item => item.id === p.id);
        
        return `
            <div class="product-card" data-id="${p.id}">
                <div class="product-img" style="background-image: url('${imageUrl}');">
                    <span class="badge">${p.category || 'Fashion'}</span>
                    <button class="product-wishlist-btn ${isInWishlist ? 'active' : ''}" data-id="${p.id}">
                        <i class="${isInWishlist ? 'fas' : 'far'} fa-heart"></i>
                    </button>
                </div>
                <div class="product-name">${p.name || 'Product'}</div>
                <div class="product-price">
                    <span class="price-current">₹ ${(p.price || 0).toFixed(2)}</span>
                    ${p.discount ? `<span class="price-percent">-${p.discount.toFixed(0)}%</span>` : ''}
                </div>
                <small>⭐ ${p.rating || 0} ${p.reviews ? `(${p.reviews})` : ''} | Stock: ${p.stock || 0}</small>
            </div>
        `;
    }).join('');
}

function renderProductDetails(product, similarProducts) {
    if (!product) return;
    
    const mainImg = document.getElementById('detailMainImg');
    const thumbs = document.getElementById('detailThumbs');
    const name = document.getElementById('detailName');
    const price = document.getElementById('detailPrice');
    const stock = document.getElementById('detailStock');
    const rating = document.getElementById('detailRating');
    const desc = document.getElementById('detailDesc');
    
    if (!mainImg) return;
    
    const imageUrl = product.images?.[0] || product.thumbnail || `https://picsum.photos/seed/${product.id}/400/400`;
    mainImg.style.backgroundImage = `url('${imageUrl}')`;
    
    const images = product.images || [product.thumbnail || `https://picsum.photos/seed/${product.id}/400/400`];
    thumbs.innerHTML = images.map((img, idx) => `
        <img src="${img}" class="${idx === 0 ? 'active' : ''}" data-index="${idx}">
    `).join('');
    
    thumbs.querySelectorAll('img').forEach(thumb => {
        thumb.addEventListener('click', function() {
            thumbs.querySelectorAll('img').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            mainImg.style.backgroundImage = `url('${this.src}')`;
        });
    });
    
    name.textContent = product.name || 'Product';
    price.textContent = `₹ ${(product.price || 0).toFixed(2)}`;
    stock.textContent = `📦 In Stock: ${product.stock || 0} units`;
    stock.style.color = (product.stock || 0) > 10 ? '#27ae60' : '#f39c12';
    rating.textContent = `⭐ ${product.rating || 0} (${product.reviews || 0} reviews)`;
    desc.textContent = product.description || 'Premium quality product.';
    
    // Detail buttons
    document.getElementById('detailAddCart')?.addEventListener('click', () => {
        addToCart(product);
    });
    
    document.getElementById('detailBuyNow')?.addEventListener('click', () => {
        addToCart(product);
        navigateTo('checkout');
    });
    
    document.getElementById('detailWishlist')?.addEventListener('click', () => {
        toggleWishlist(product);
        const btn = document.getElementById('detailWishlist');
        const inWishlist = wishlist.some(item => item.id === product.id);
        btn.classList.toggle('active', inWishlist);
        btn.innerHTML = inWishlist ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
    });
    
    // Similar products
    const recommendGrid = document.getElementById('recommendGrid');
    if (recommendGrid) {
        if (similarProducts && similarProducts.length > 0) {
            recommendGrid.innerHTML = similarProducts.map(p => `
                <div class="recommend-card" data-id="${p.id}">
                    <img src="${p.images?.[0] || p.thumbnail || `https://picsum.photos/seed/${p.id}/200/200`}" alt="${p.name}">
                    <h4>${p.name}</h4>
                    <p>₹ ${(p.price || 0).toFixed(2)}</p>
                </div>
            `).join('');
            
            recommendGrid.querySelectorAll('.recommend-card').forEach(card => {
                card.addEventListener('click', function() {
                    const id = this.dataset.id;
                    navigateTo('product-details', { id });
                });
            });
        } else {
            recommendGrid.innerHTML = '<p style="color: #999;">No similar products found</p>';
        }
    }
}

// ============================================================
// CART FUNCTIONS
// ============================================================

function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCartBadge();
    renderCartItems();
    showToast(`✅ ${product.name} added to cart!`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartBadge();
    renderCartItems();
    showToast('🗑️ Item removed from cart');
}

function renderCartItems() {
    const container = document.getElementById('cartItems');
    const empty = document.getElementById('cartEmpty');
    const summary = document.getElementById('cartSummary');
    const totalEl = document.getElementById('cartTotal');
    
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = '';
        if (empty) empty.style.display = 'block';
        if (summary) summary.style.display = 'none';
        return;
    }
    
    if (empty) empty.style.display = 'none';
    if (summary) summary.style.display = 'block';
    
    container.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-img" style="background-image: url('${item.images?.[0] || item.thumbnail || 'https://picsum.photos/seed/' + item.id + '/80/80'}');"></div>
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>₹ ${(item.price || 0).toFixed(2)} × ${item.quantity || 1}</p>
            </div>
            <div class="cart-item-remove" data-index="${index}">
                <i class="fas fa-trash-alt"></i>
            </div>
        </div>
    `).join('');
    
    container.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', function() {
            const idx = parseInt(this.dataset.index);
            const item = cart[idx];
            if (item) removeFromCart(item.id);
        });
    });
    
    const total = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    if (totalEl) totalEl.textContent = `Total: ₹ ${total.toFixed(2)}`;
}

function updateCartBadge() {
    const badge = document.getElementById('cartCount');
    if (badge) {
        badge.textContent = cart.length;
    }
}

// ============================================================
// WISHLIST FUNCTIONS
// ============================================================

function toggleWishlist(product) {
    const index = wishlist.findIndex(item => item.id === product.id);
    if (index > -1) {
        wishlist.splice(index, 1);
        showToast(`💔 Removed ${product.name} from wishlist`);
    } else {
        wishlist.push({ ...product });
        showToast(`❤️ Added ${product.name} to wishlist`);
    }
    renderWishlistItems();
}

function renderWishlistItems() {
    const container = document.getElementById('wishlistItems');
    const empty = document.getElementById('wishlistEmpty');
    
    if (!container) return;
    
    if (wishlist.length === 0) {
        container.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    
    if (empty) empty.style.display = 'none';
    container.innerHTML = renderProductCards(wishlist);
    wireProductCards(container, wishlist);
}

// ============================================================
// CHECKOUT FUNCTIONS
// ============================================================

async function placeOrder() {
    if (!checkoutAddressData) {
        showToast('📍 Please enter your delivery address first');
        navigateTo('checkout');
        return;
    }

    const selectedPayment = document.querySelector('.payment-option.selected');
    if (!selectedPayment) {
        showToast('⚠️ Please select a payment method');
        return;
    }

    const paymentMethod = selectedPayment.dataset.method;

    const orderData = {
        items: cart.map(item => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1,
            image: item.images?.[0] || item.thumbnail
        })),
        address: checkoutAddressData.address,
        city: checkoutAddressData.city,
        state: checkoutAddressData.state,
        pincode: checkoutAddressData.pincode,
        phone: checkoutAddressData.phone,
        paymentMethod
    };

    const placeBtn = document.getElementById('placeOrderBtn');
    if (placeBtn) {
        placeBtn.disabled = true;
        placeBtn.textContent = 'Placing order...';
    }

    try {
        const data = await API.OrderAPI.createOrder(orderData);
        showToast(`🎉 Order #${data.order.id} placed successfully!`);

        cart = [];
        checkoutAddressData = null;
        updateCartBadge();
        renderCartItems();

        navigateTo('orders');
    } catch (error) {
        console.error('Failed to place order:', error);
        showToast(`❌ ${error.message}`);
        if (placeBtn) {
            placeBtn.disabled = false;
            placeBtn.textContent = 'Place Order';
        }
    }
}

// ============================================================
// AUTH FUNCTIONS
// ============================================================

function openAuth(mode = 'login') {
    const modal = document.getElementById('authModal');
    const title = document.getElementById('authTitle');
    const submit = document.getElementById('authSubmit');
    const toggle = document.getElementById('authToggle');
    const status = document.getElementById('authStatus');
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    title.textContent = mode === 'login' ? 'Sign In' : 'Create Account';
    submit.textContent = mode === 'login' ? 'Sign In' : 'Sign Up';
    toggle.textContent = mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In";
    
    document.getElementById('authEmail').value = mode === 'login' ? 'demo@user.com' : '';
    document.getElementById('authPassword').value = mode === 'login' ? 'demo123' : '';
    
    status.textContent = mode === 'login' ? 'Enter your credentials' : 'Create your account';
    status.style.color = '#888';
    
    window.authMode = mode;
}

function closeAuth() {
    document.getElementById('authModal').classList.remove('active');
    document.body.style.overflow = '';
}

function toggleAuthMode() {
    const newMode = window.authMode === 'login' ? 'signup' : 'login';
    openAuth(newMode);
}

async function handleAuth() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    const status = document.getElementById('authStatus');
    
    if (!email || !password) {
        status.textContent = '⚠️ Please fill in all fields';
        status.style.color = '#c0392b';
        return;
    }
    
    try {
        let data;
        if (window.authMode === 'signup') {
            const name = email.split('@')[0];
            data = await API.AuthAPI.register({ name, email, password });
        } else {
            data = await API.AuthAPI.login(email, password);
        }
        
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        isLoggedIn = true;
        currentUserData = data.user;
        
        updateUserDisplay();
        closeAuth();
        showToast(`👋 Welcome ${data.user.name}!`);
        navigateTo('home');
    } catch (error) {
        status.textContent = `❌ ${error.message}`;
        status.style.color = '#c0392b';
    }
}

async function logoutUser() {
    try {
        await API.AuthAPI.logout();
    } catch (error) {
        console.error('Logout error:', error);
    }
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    isLoggedIn = false;
    currentUserData = null;
    
    updateUserDisplay();
    showToast('👋 Logged out successfully');
    navigateTo('home');
}

// ============================================================
// FILTER FUNCTIONS
// ============================================================

function populateCategoryFilter() {
    const select = document.getElementById('filterCategory');
    if (!select) return;
    
    const categories = window.categories || [];
    select.innerHTML = `
        <option value="all">All Categories</option>
        ${categories.map(cat => `
            <option value="${cat.slug}">${cat.name}</option>
        `).join('')}
    `;
}

function setupProductFilters() {
    document.getElementById('filterToggle')?.addEventListener('click', function() {
        document.getElementById('filterPanel').classList.toggle('active');
        this.classList.toggle('active');
    });

    document.getElementById('applyFilters')?.addEventListener('click', applyFilters);
    document.getElementById('resetFilters')?.addEventListener('click', resetFilters);
    document.getElementById('sortSelect')?.addEventListener('change', applyFilters);
}

async function applyFilters() {
    const category = document.getElementById('filterCategory')?.value || 'all';
    const minPrice = document.getElementById('filterMinPrice')?.value || '';
    const maxPrice = document.getElementById('filterMaxPrice')?.value || '';
    const minRating = document.getElementById('filterRating')?.value || '';
    const sortBy = document.getElementById('sortSelect')?.value || 'popularity';
    
    productQuery.page = 1;
    productQuery.category = category !== 'all' ? category : undefined;
    productQuery.search = undefined;
    productQuery.sortBy = sortBy;
    productQuery.minPrice = minPrice || undefined;
    productQuery.maxPrice = maxPrice || undefined;
    productQuery.minRating = minRating && minRating !== '0' ? minRating : undefined;

    await fetchAndRenderProductsPage();
    showToast('✅ Filters applied');
}

function resetFilters() {
    document.getElementById('filterCategory').value = 'all';
    document.getElementById('filterMinPrice').value = '';
    document.getElementById('filterMaxPrice').value = '';
    document.getElementById('filterRating').value = '0';
    document.getElementById('sortSelect').value = 'popularity';
    applyFilters();
}

// ============================================================
// SEARCH FUNCTIONS
// ============================================================

function handleSearch() {
    const input = document.getElementById('searchInput');
    const query = input?.value?.trim();
    
    if (!query) {
        navigateTo('home');
        return;
    }
    
    // Always jump to the products page and let it fetch+render the results,
    // so search works no matter which page you're currently viewing.
    navigateTo('products', { search: query });
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================================
// EXPOSE FUNCTIONS GLOBALLY
// ============================================================

window.navigateTo = navigateTo;
window.showToast = showToast;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.toggleWishlist = toggleWishlist;
window.openAuth = openAuth;
window.closeAuth = closeAuth;
window.loadProductsPage = loadProductsPage;
window.renderProducts = renderProducts;
window.allProducts = allProducts;
window.cart = cart;
window.wishlist = wishlist;

console.log('✅ App.js loaded successfully');
console.log('📦 API URL:', window.location.origin + '/api');