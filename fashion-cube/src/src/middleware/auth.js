// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided, authorization denied' 
            });
        }

        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token format' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = db.findUserByEmail(decoded.email);
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Token is not valid, user not found' 
            });
        }

        req.user = user;
        req.userId = user.id;
        req.token = token;
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired, please login again' 
            });
        }

        res.status(500).json({ 
            success: false, 
            message: 'Server error during authentication' 
        });
    }
};

const admin = async (req, res, next) => {
    try {
        if (req.userId !== 1) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during authorization'
        });
    }
};

module.exports = { auth, admin };