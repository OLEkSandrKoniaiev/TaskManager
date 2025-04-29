const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

            // Додаємо user у request
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            return res.status(401).json({message: 'Не авторизовано (невірний токен)'});
        }
    }

    if (!token) {
        return res.status(401).json({message: 'Немає токена, доступ заборонено'});
    }
};

module.exports = {protect};
