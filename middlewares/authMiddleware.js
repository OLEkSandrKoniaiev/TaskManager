const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = mongoose.models.User || mongoose.model('User', require('../models/User').schema);

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({message: 'Authorization token has expired. Please log in again.'});
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({message: 'Authorization token is invalid.'});
            }
            console.error('Auth middleware error:', error.message);
            return res.status(401).json({message: 'Not authorized (invalid token).'});
        }
    }

    if (!token) {
        return res.status(401).json({message: 'No authorization token, access denied.'});
    }
};

module.exports = {protect};
