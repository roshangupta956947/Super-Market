// frontend/js/profile.js
// Profile Module

class ProfileManager {
    constructor() {
        this.user = null;
        this.isLoaded = false;
    }

    // Initialize profile
    async init() {
        if (window.isLoggedIn()) {
            await this.loadProfile();
        }
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        document.getElementById('profileBack')?.addEventListener('click', () => {
            window.navigateTo('home');
        });

        document.getElementById('userDisplay')?.addEventListener('click', () => {
            if (window.isLoggedIn()) {
                window.navigateTo('profile');
            } else {
                window.openAuth('login');
            }
        });

        // Admin link (if exists)
        document.getElementById('adminLink')?.addEventListener('click', () => {
            window.navigateTo('admin');
        });
    }

    // Load profile
    async loadProfile() {
        try {
            const data = await API.AuthAPI.getProfile();
            this.user = data.user;
            this.isLoaded = true;
            window.currentUser = this.user;
            this.renderProfile();
            return this.user;
        } catch (error) {
            console.error('Failed to load profile:', error);
            return null;
        }
    }

    // Update profile
    async updateProfile(data) {
        try {
            const result = await API.AuthAPI.updateProfile(data);
            this.user = result.user;
            window.currentUser = this.user;
            this.renderProfile();
            window.showToast('✅ Profile updated successfully');
            return true;
        } catch (error) {
            window.showToast(`❌ ${error.message}`);
            return false;
        }
    }

    // Change password
    async changePassword(data) {
        try {
            await API.AuthAPI.changePassword(data);
            window.showToast('✅ Password changed successfully');
            return true;
        } catch (error) {
            window.showToast(`❌ ${error.message}`);
            return false;
        }
    }

    // Render profile
    renderProfile() {
        const user = this.user || window.currentUser;
        if (!user) return;

        // Profile card
        document.getElementById('profileName').textContent = user.name || 'User';
        document.getElementById('profileEmail').textContent = user.email || '';
        document.getElementById('profilePhone').textContent = user.phone || 'Not set';
        document.getElementById('profileAddress').textContent = user.address || 'Not set';

        // Order count
        const ordersCount = window.orders?.length || 0;
        document.getElementById('profileOrders').textContent = ordersCount;

        // Wishlist count
        const wishlistCount = window.wishlist?.length || 0;
        document.getElementById('profileWishlist').textContent = wishlistCount;

        // Update stats
        const stats = document.getElementById('profileStats');
        if (stats) {
            const totalSpent = (window.orders || []).reduce((sum, o) => sum + (o.total || 0), 0);
            stats.innerHTML = `
                <div class="profile-stat">
                    <span class="stat-label">Total Orders</span>
                    <span class="stat-value">${ordersCount}</span>
                </div>
                <div class="profile-stat">
                    <span class="stat-label">Total Spent</span>
                    <span class="stat-value">$${totalSpent.toFixed(2)}</span>
                </div>
                <div class="profile-stat">
                    <span class="stat-label">Wishlist</span>
                    <span class="stat-value">${wishlistCount}</span>
                </div>
            `;
        }

        // Show edit profile form if exists
        this.populateEditForm();
    }

    // Populate edit form
    populateEditForm() {
        const user = this.user || window.currentUser;
        if (!user) return;

        const nameInput = document.getElementById('editName');
        const phoneInput = document.getElementById('editPhone');
        const addressInput = document.getElementById('editAddress');

        if (nameInput) nameInput.value = user.name || '';
        if (phoneInput) phoneInput.value = user.phone || '';
        if (addressInput) addressInput.value = user.address || '';

        // Setup save profile button
        document.getElementById('saveProfileBtn')?.addEventListener('click', async () => {
            const name = nameInput?.value.trim();
            const phone = phoneInput?.value.trim();
            const address = addressInput?.value.trim();

            if (!name) {
                window.showToast('⚠️ Name is required');
                return;
            }

            await this.updateProfile({ name, phone, address });
        });

        // Setup change password button
        document.getElementById('changePasswordBtn')?.addEventListener('click', async () => {
            const currentPassword = document.getElementById('currentPassword')?.value;
            const newPassword = document.getElementById('newPassword')?.value;
            const confirmPassword = document.getElementById('confirmPassword')?.value;

            if (!currentPassword || !newPassword || !confirmPassword) {
                window.showToast('⚠️ Please fill in all password fields');
                return;
            }

            if (newPassword.length < 6) {
                window.showToast('⚠️ New password must be at least 6 characters');
                return;
            }

            if (newPassword !== confirmPassword) {
                window.showToast('⚠️ Passwords do not match');
                return;
            }

            await this.changePassword({ currentPassword, newPassword });
            
            // Clear password fields
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        });
    }

    // Get user stats
    getUserStats() {
        return {
            orders: window.orders?.length || 0,
            wishlist: window.wishlist?.length || 0,
            totalSpent: (window.orders || []).reduce((sum, o) => sum + (o.total || 0), 0),
            cartItems: window.cart?.length || 0
        };
    }

    // Check if user is admin
    isAdmin() {
        return this.user && this.user.id === 1;
    }
}

// Initialize profile
const profile = new ProfileManager();
window.profileManager = profile;