const mongoose = require('mongoose');
const User = mongoose.models.User || mongoose.model('User', require('../models/User').schema);

class UserRepository {
    async getAllUsers() {
        return await User.find({}).select('-password -refreshTokens');
    }

    /**
     * Знаходить користувача за ID.
     * @param {string} id - ID користувача.
     * @returns {Promise<User|null>} Об'єкт користувача або null.
     */
    async findUserById(id) {
        return await User.findById(id).select('-password -refreshTokens');
    }

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

    /**
     * Оновлює дані користувача.
     * @param {string} id - ID користувача, якого потрібно оновити.
     * @param {object} updateData - Об'єкт з даними для оновлення (наприклад, { username: 'newname' }).
     * @returns {Promise<User|null>} Оновлений об'єкт користувача або null.
     */
    async updateUser(id, updateData) {
        // new: true повертає оновлений документ
        // runValidators: true запускає валідатори схеми при оновленні
        return await User.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        }).select('-password -refreshTokens');
    }

    /**
     * Видаляє користувача за ID.
     * @param {string} id - ID користувача для видалення.
     * @returns {Promise<User|null>} Видалений об'єкт користувача або null.
     */
    async deleteUser(id) {
        return await User.findByIdAndDelete(id).select('-password -refreshTokens');
    }
}

module.exports = new UserRepository();
