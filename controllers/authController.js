const userRepository = require('../repositories/userRepository');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = mongoose.models.User || mongoose.model('User', require('../models/User').schema);


const sendTokenResponse = async (user, statusCode, res, oldRefreshToken = null) => {
    const accessToken = user.getSignedJwtToken();

    const newRefreshToken = jwt.sign({id: user._id}, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE
    });

    try {
        if (oldRefreshToken) {
            await userRepository.removeRefreshToken(user._id, oldRefreshToken);
        }
        await userRepository.addRefreshToken(user._id, newRefreshToken);
    } catch (error) {
        console.error("Error saving/removing refresh token to DB:", error);
        return res.status(500).json({message: 'Failed to manage refresh token in DB.'});
    }

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_REFRESH_EXPIRE.replace('d', '') * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    };

    if (process.env.NODE_ENV === 'development') {
        cookieOptions.secure = false;
    }

    res.status(statusCode)
        .cookie('refreshToken', newRefreshToken, cookieOptions)
        .json({
            success: true,
            accessToken: accessToken,
        });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const {username, email, password, role} = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({message: 'Please enter all required fields: username, email, and password.'});
        }

        const userExists = await User.findOne({$or: [{email}, {username}]});
        if (userExists) {
            return res.status(400).json({message: 'User with that email or username already exists.'});
        }

        const newUser = await userRepository.createUser({username, email, password, role});

        await sendTokenResponse(newUser, 201, res);

    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({message: messages.join(', ')});
        }
        res.status(500).json({message: 'Server error: ' + error.message});
    }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({message: 'Please provide an email and password.'});
        }

        const user = await User.findOne({email}).select('+password');

        if (!user) {
            return res.status(401).json({message: 'Invalid credentials.'});
        }

        if (!user.isActive) {
            return res.status(401).json({message: 'Your account is inactive. Please contact support.'});
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({message: 'Invalid credentials.'});
        }

        await sendTokenResponse(user, 200, res);

    } catch (error) {
        res.status(500).json({message: 'Server error: ' + error.message});
    }
};

// @desc    Refresh Access Token using Refresh Token
// @route   POST /api/users/refresh-token
// @access  Public (доступний тільки через cookie)
const refreshToken = async (req, res) => {
    const cookies = req.cookies;
    const refreshTokenFromCookie = cookies.refreshToken;

    if (!refreshTokenFromCookie) {
        return res.status(401).json({message: 'Not authorized, no refresh token in cookies.'});
    }

    try {
        const decoded = jwt.verify(refreshTokenFromCookie, process.env.JWT_REFRESH_SECRET);

        const user = await userRepository.findUserByRefreshToken(refreshTokenFromCookie);

        const clearTokenCookie = () => {
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
        };

        if (!user) {
            clearTokenCookie();
            return res.status(403).json({message: 'Forbidden, refresh token not found for user.'});
        }

        if (!user.isActive) {
            clearTokenCookie();
            return res.status(403).json({message: 'Your account is inactive. Please contact support.'});
        }

        const tokenExistsInDb = user.refreshTokens.some(rt => rt.token === refreshTokenFromCookie);
        if (!tokenExistsInDb) {
            clearTokenCookie();
            return res.status(403).json({message: 'Forbidden, refresh token is not valid or revoked.'});
        }

        await sendTokenResponse(user, 200, res, refreshTokenFromCookie);

    } catch (error) {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({message: 'Refresh token expired, please log in again.'});
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({message: 'Invalid refresh token.'});
        }
        res.status(500).json({message: 'Server error: ' + error.message});
    }
};

// @desc    Log user out / clear cookie
// @route   POST /api/users/logout
// @access  Private
const logoutUser = async (req, res) => {
    const refreshTokenFromCookie = req.cookies.refreshToken;

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    if (refreshTokenFromCookie) {
        try {
            const decoded = jwt.verify(refreshTokenFromCookie, process.env.JWT_REFRESH_SECRET);
            const userId = decoded.id;

            await userRepository.removeRefreshToken(userId, refreshTokenFromCookie);

        } catch (error) {
            console.error('Error during logout refresh token removal:', error.message);
        }
    }

    res.status(200).json({message: 'Logged out successfully.'});
};

module.exports = {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
};
