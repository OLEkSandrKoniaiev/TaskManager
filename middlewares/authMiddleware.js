const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = mongoose.models.User || mongoose.model('User', require('../models/User').schema);

const protect = async (req, res, next) => {
    let token;

    // Читаємо токен з заголовка Authorization
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Перевіряємо токен
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Додаємо user у request, виключаючи пароль
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            // Важливо: перехоплювати помилки jwt.verify, вони можуть бути різними
            // TokenExpiredError, JsonWebTokenError
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({message: 'Authorization token has expired. Please log in again.'});
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({message: 'Authorization token is invalid.'});
            }
            // Для інших помилок
            console.error('Auth middleware error:', error.message); // Для дебагу
            return res.status(401).json({message: 'Not authorized (invalid token).'});
        }
    }

    if (!token) {
        return res.status(401).json({message: 'No authorization token, access denied.'});
    }
};

module.exports = {protect};
