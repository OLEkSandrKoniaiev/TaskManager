const userRepository = require('../repositories/userRepository');
const jwt = require('jsonwebtoken'); // Додаємо jsonwebtoken
const mongoose = require('mongoose');
const User = mongoose.models.User || mongoose.model('User', require('../models/User').schema);

// Функція для створення та відправки токена (або токенів)
const sendTokenResponse = (user, statusCode, res) => {
    // Створюємо Access Token
    const accessToken = user.getSignedJwtToken();

    // Створюємо Refresh Token
    // У реальному проєкті Refresh Token краще зберігати в базі даних,
    // пов'язуючи його з користувачем, щоб мати можливість його анулювати.
    // Для простоти поки що не зберігаємо його в БД, але пам'ятай про це.
    const refreshToken = jwt.sign({id: user._id}, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE
    });

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_REFRESH_EXPIRE.replace('d', '') * 24 * 60 * 60 * 1000), // Перетворення днів на мілісекунди
        httpOnly: true, // Робіть це cookie HTTP-Only, щоб JS не міг отримати доступ
        secure: process.env.NODE_ENV === 'production' // Використовувати secure cookie тільки в продакшені (HTTPS)
    };

    // Якщо ми не в продакшені, set secure to false
    if (process.env.NODE_ENV === 'development') {
        cookieOptions.secure = false;
    }

    res.status(statusCode)
        .cookie('refreshToken', refreshToken, cookieOptions) // Відправляємо Refresh Token у HTTP-Only cookie
        .json({
            success: true,
            accessToken: accessToken, // Відправляємо Access Token у тілі відповіді
            // Можливо, також відправити термін дії Access Token для зручності на фронтенді
        });
};


// @desc    Get all users
// @route   GET /api/users
// @access  Public (або Private/Admin Only в майбутньому)
const getUsers = async (req, res) => {
    try {
        const users = await userRepository.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
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

        // Перевіряємо, чи користувач з таким email або username вже існує
        const userExists = await User.findOne({$or: [{email}, {username}]});
        if (userExists) {
            return res.status(400).json({message: 'User with that email or username already exists.'});
        }

        const newUser = await userRepository.createUser({username, email, password, role}); // role буде 'user' за замовчуванням, якщо не вказано

        // Відправляємо токен після успішної реєстрації
        sendTokenResponse(newUser, 201, res);

    } catch (error) {
        // Mongoose validation errors
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

        // Валідація наявності email та password
        if (!email || !password) {
            return res.status(400).json({message: 'Please provide an email and password.'});
        }

        // Перевіряємо, чи існує користувач
        const user = await User.findOne({email}).select('+password'); // Вибираємо поле password, оскільки за замовчуванням воно може бути приховано

        if (!user) {
            return res.status(401).json({message: 'Invalid credentials.'}); // Неправильний email або пароль
        }

        // Перевіряємо, чи активний користувач (якщо це важливо)
        if (!user.isActive) {
            return res.status(401).json({message: 'Your account is inactive. Please contact support.'});
        }

        // Перевіряємо пароль
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({message: 'Invalid credentials.'}); // Неправильний email або пароль
        }

        // Якщо все успішно, відправляємо токен
        sendTokenResponse(user, 200, res);

    } catch (error) {
        res.status(500).json({message: 'Server error: ' + error.message});
    }
};


module.exports = {
    getUsers,
    registerUser,
    loginUser,
};
