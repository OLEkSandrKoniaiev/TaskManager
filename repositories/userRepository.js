const mongoose = require('mongoose');
const User = mongoose.models.User || mongoose.model('User', require('../models/User').schema);

class UserRepository {
    async getAllUsers() {
        return await User.find({}).select('-password');
    }

    // async findUserById(id) {
    //     return await User.findById(id);
    // }
    //
    // async findUserByEmail(email) {
    //     return await User.findOne({email});
    // }

    async createUser(userData) {
        const user = new User(userData);
        return await user.save();
    }

    /**
     * Додає Refresh Token до масиву refreshTokens користувача.
     * @param {string} userId - ID користувача.
     * @param {string} token - Refresh Token для додавання.
     * @returns {Promise<User>} Оновлений об'єкт користувача.
     */
    async addRefreshToken(userId, token) {
        return await User.findByIdAndUpdate(
            userId,
            {$push: {refreshTokens: {token: token}}},
            {new: true, runValidators: true}
        );
    }

    /**
     * Видаляє певний Refresh Token з масиву refreshTokens користувача.
     * @param {string} userId - ID користувача.
     * @param {string} token - Refresh Token для видалення.
     * @returns {Promise<User>} Оновлений об'єкт користувача.
     */
    async removeRefreshToken(userId, token) {
        return await User.findByIdAndUpdate(
            userId,
            {$pull: {refreshTokens: {token: token}}},
            {new: true}
        );
    }

    /**
     * Знаходить користувача за Refresh Token.
     * @param {string} refreshToken - Refresh Token для пошуку.
     * @returns {Promise<User|null>} Об'єкт користувача або null, якщо не знайдено.
     */
    async findUserByRefreshToken(refreshToken) {
        return await User.findOne({'refreshTokens.token': refreshToken});
    }
}

module.exports = new UserRepository();
