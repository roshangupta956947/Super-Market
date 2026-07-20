// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const db = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email,
            name: user.name
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

const register = async (req, res, next) => {
    try {
        const { name, email, password, phone, address } = req.body;

        if (!name || !email || !password) {
            throw new AppError('Please provide name, email and password', 400);
        }

        if (password.length < 6) {
            throw new AppError('Password must be at least 6 characters', 400);
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            throw new AppError('User already exists with this email', 400);
        }

        const user = await User.create({ name, email, password, phone, address });
        const { password: _, ...userWithoutPassword } = user;
        const token = generateToken(user);

        res.status(201).json({
            success: true,
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new AppError('Please provide email and password', 400);
        }

        const user = await User.findByEmail(email);
        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        const isMatch = await User.comparePassword(password, user.password);
        if (!isMatch) {
            throw new AppError('Invalid credentials', 401);
        }

        const { password: _, ...userWithoutPassword } = user;
        const token = generateToken(user);

        res.json({
            success: true,
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const { password, ...userWithoutPassword } = user;
        const orders = db.getOrdersByUser(req.userId);
        const cart = db.getCart(req.userId);

        res.json({
            success: true,
            user: {
                ...userWithoutPassword,
                stats: {
                    totalOrders: orders.length,
                    totalSpent: orders.reduce((sum, o) => sum + (o.total || 0), 0),
                    cartItems: cart.items.length
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { name, phone, address } = req.body;

        const user = await User.findById(req.userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const updatedUser = await User.update(req.userId, { name, phone, address });
        const { password, ...userWithoutPassword } = updatedUser;

        res.json({
            success: true,
            user: userWithoutPassword
        });
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            throw new AppError('Please provide current and new password', 400);
        }

        if (newPassword.length < 6) {
            throw new AppError('New password must be at least 6 characters', 400);
        }

        const user = await User.findById(req.userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const isMatch = await User.comparePassword(currentPassword, user.password);
        if (!isMatch) {
            throw new AppError('Current password is incorrect', 401);
        }

        await User.updatePassword(req.userId, newPassword);

        res.json({
            success: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

const logout = async (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};

module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    logout
};