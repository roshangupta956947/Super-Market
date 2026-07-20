// src/models/User.js
const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async findByEmail(email) {
        return db.findUserByEmail(email);
    }

    static async findById(id) {
        return db.findUserById(id);
    }

    static async create(userData) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = {
            ...userData,
            password: hashedPassword
        };
        return db.createUser(user);
    }

    static async update(id, updates) {
        const { password, ...safeUpdates } = updates;
        return db.updateUser(id, safeUpdates);
    }

    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }

    static async updatePassword(id, newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        return db.updateUser(id, { password: hashedPassword });
    }
}

module.exports = User;