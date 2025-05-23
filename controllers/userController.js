const userRepository = require('../repositories/userRepository');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = mongoose.models.User || mongoose.model('User', require('../models/User').schema);

// Функція для створення та відправки токена (або токенів)
const sendTokenResponse = async (user, statusCode, res, oldRefreshToken = null) => { // Додано oldRefreshToken
    // Створюємо Access Token
    const accessToken = user.getSignedJwtToken();

    // Створюємо Refresh Token
    const newRefreshToken = jwt.sign({id: user._id}, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE
    });

    try {
        // Якщо є старий Refresh Token, спочатку видаляємо його
        if (oldRefreshToken) {
            await userRepository.removeRefreshToken(user._id, oldRefreshToken);
        }
        // Зберігаємо новий Refresh Token у базі даних
        await userRepository.addRefreshToken(user._id, newRefreshToken);
    } catch (error) {
        console.error("Error saving/removing refresh token to DB:", error);
        return res.status(500).json({message: 'Failed to manage refresh token in DB.'});
    }

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_REFRESH_EXPIRE.replace('d', '') * 24 * 60 * 60 * 1000), // Перетворення днів на мілісекунди
        httpOnly: true, // Робіть це cookie HTTP-Only, щоб JS не міг отримати доступ
        secure: process.env.NODE_ENV === 'production', // Використовувати secure cookie тільки в продакшені (HTTPS)
        sameSite: 'strict', // Запобігає CSRF атакам, перевіряй для продакшену згідно фронтенду
    };

    // Якщо ми не в продакшені, set secure to false
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


// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin Only
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
        await sendTokenResponse(newUser, 201, res);

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
        const user = await User.findOne({email}).select('+password');

        if (!user) {
            return res.status(401).json({message: 'Invalid credentials.'});
        }

        // Перевіряємо, чи активний користувач (якщо це важливо)
        if (!user.isActive) {
            return res.status(401).json({message: 'Your account is inactive. Please contact support.'});
        }

        // Перевіряємо пароль
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({message: 'Invalid credentials.'});
        }

        // Якщо все успішно, відправляємо токен
        // При логіні ми не маємо старого refreshToken, тому передаємо null
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

    // Перевіряємо наявність Refresh Token у куках
    if (!refreshTokenFromCookie) {
        return res.status(401).json({message: 'Not authorized, no refresh token in cookies.'});
    }

    try {
        // Верифікуємо Refresh Token
        const decoded = jwt.verify(refreshTokenFromCookie, process.env.JWT_REFRESH_SECRET);

        // Знаходимо користувача за ID з токена та перевіряємо, чи Refresh Token існує в БД
        const user = await userRepository.findUserByRefreshToken(refreshTokenFromCookie);

        if (!user) {
            // Якщо користувача не знайдено або токен не належить цьому користувачу
            // Це може свідчити про компрометацію, очищаємо куку
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            return res.status(403).json({message: 'Forbidden, refresh token not found for user.'});
        }

        // Перевіряємо, чи токен, отриманий з куки, є у масиві refreshTokens користувача
        const tokenExistsInDb = user.refreshTokens.some(rt => rt.token === refreshTokenFromCookie);
        if (!tokenExistsInDb) {
            // Це може свідчити про компрометацію (токен вже був видалений або невірний)
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });
            return res.status(403).json({message: 'Forbidden, refresh token is not valid or revoked.'});
        }

        // Якщо все успішно, генеруємо новий Access Token та новий Refresh Token
        // і відправляємо їх клієнту, замінюючи старий Refresh Token
        await sendTokenResponse(user, 200, res, refreshTokenFromCookie);

    } catch (error) {
        // Якщо токен невалідний (прострочений або змінений), очищаємо куку
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
    // Отримуємо Refresh Token з куки
    const refreshTokenFromCookie = req.cookies.refreshToken;

    // Очищаємо куку на клієнті
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    // Якщо Refresh Token був у куках, видаляємо його з БД
    if (refreshTokenFromCookie) {
        try {
            // Розшифровуємо Refresh Token, щоб отримати ID користувача
            const decoded = jwt.verify(refreshTokenFromCookie, process.env.JWT_REFRESH_SECRET);
            const userId = decoded.id;

            // Видаляємо конкретний Refresh Token з масиву користувача в БД
            await userRepository.removeRefreshToken(userId, refreshTokenFromCookie);
            // Додатково: можна також очистити Access Token, якщо він зберігався в кеші на стороні клієнта
            // (але це вже завдання фронтенду, якщо він тримає Access Token не в пам'яті)

        } catch (error) {
            // Ігноруємо помилки, якщо токен вже прострочений або недійсний
            // Це може трапитись, якщо клієнт намагається вийти після того, як токен вже анульовано
            console.error('Error during logout refresh token removal:', error.message);
        }
    }

    res.status(200).json({message: 'Logged out successfully.'});
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = async (req, res) => {
    try {
        const user = await userRepository.findUserById(req.params.id);

        if (!user) {
            return res.status(404).json({message: 'User not found.'});
        }
        res.status(200).json(user);
    } catch (error) {
        if (error.name === 'CastError') { // Ловимо помилку, якщо ID невалідний (наприклад, не ObjectID)
            return res.status(400).json({message: 'Invalid user ID format.'});
        }
        res.status(500).json({message: 'Server error: ' + error.message});
    }
};

// @desc    Update user profile (username only)
// @route   PUT /api/users/:id
// @access  Private (only for self-update)
const updateUserProfile = async (req, res) => {
    const {username} = req.body;
    const userIdToUpdate = req.params.id; // ID користувача, який ми хочемо оновити

    // Перевірка, чи оновлює користувач свій власний профіль
    // req.user._id отримуємо з protect middleware
    if (req.user._id.toString() !== userIdToUpdate) {
        return res.status(403).json({message: 'You are not authorized to update this user\'s profile.'});
    }

    if (!username) {
        return res.status(400).json({message: 'Please provide a username to update.'});
    }

    try {
        const existingUser = await userRepository.findUserById(userIdToUpdate);
        if (!existingUser) {
            return res.status(404).json({message: 'User not found.'});
        }

        // Перевіряємо, чи новий username не зайнятий іншим користувачем
        if (username !== existingUser.username) {
            const userWithSameUsername = await User.findOne({username: username});
            if (userWithSameUsername) {
                return res.status(400).json({message: 'Username is already taken.'});
            }
        }

        const updatedUser = await userRepository.updateUser(userIdToUpdate, {username});

        if (!updatedUser) {
            // Це може трапитись, якщо користувач був видалений після findUserById, але перед updateUser
            return res.status(404).json({message: 'User not found or could not be updated.'});
        }

        res.status(200).json({message: 'Username updated successfully.', user: updatedUser});
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({message: messages.join(', ')});
        }
        if (error.name === 'CastError') {
            return res.status(400).json({message: 'Invalid user ID format.'});
        }
        res.status(500).json({message: 'Server error: ' + error.message});
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (only for self-deletion with password confirmation)
const deleteUser = async (req, res) => {
    const userIdToDelete = req.params.id;
    const {password} = req.body; // Очікуємо пароль у тілі запиту

    // Перевірка, чи користувач намагається видалити свій власний обліковий запис
    if (req.user._id.toString() !== userIdToDelete) {
        return res.status(403).json({message: 'You are not authorized to delete this user.'});
    }

    if (!password) {
        return res.status(400).json({message: 'Please provide your password to confirm deletion.'});
    }

    try {
        // Отримуємо користувача, включаючи пароль, щоб перевірити його
        const user = await User.findById(userIdToDelete).select('+password');

        if (!user) {
            return res.status(404).json({message: 'User not found.'});
        }

        // Перевіряємо пароль користувача
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({message: 'Incorrect password. Deletion denied.'});
        }

        // Видаляємо користувача
        const deletedUser = await userRepository.deleteUser(userIdToDelete);

        if (!deletedUser) {
            return res.status(404).json({message: 'User not found or could not be deleted.'});
        }

        // Додатково: Очищаємо всі refresh-токени цього користувача з кук
        // Якщо користувач видаляє себе, його поточна сесія також має бути анульована.
        // Це робить автоматично після видалення користувача, оскільки його refreshTokens зникнуть.
        // Але також важливо очистити куку на клієнті, щоб він не намагався рефрешити.
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        res.status(200).json({message: 'User deleted successfully.'});

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({message: 'Invalid user ID format.'});
        }
        res.status(500).json({message: 'Server error: ' + error.message});
    }
};

// @desc    Update user role (e.g., to admin)
// @route   PUT /api/users/:id/role
// @access  Private/Admin Only
const updateUserRole = async (req, res) => {
    const userIdToUpdate = req.params.id;
    const {role} = req.body; // Нова роль

    // Перевірка, чи користувач, який робить запит, є адміністратором
    // Ця перевірка також буде відбуватися через authorizeRoles middleware,
    // але явна перевірка тут може бути корисною для читабельності або як запасний варіант
    if (req.user.role !== 'admin') {
        return res.status(403).json({message: 'Only administrators can update user roles.'});
    }

    if (!role) {
        return res.status(400).json({message: 'Please provide a new role.'});
    }

    // Перевірка, чи роль є однією з дозволених
    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({message: 'Invalid role provided. Role must be "user" or "admin".'});
    }

    try {
        const user = await userRepository.findUserById(userIdToUpdate);

        if (!user) {
            return res.status(404).json({message: 'User not found.'});
        }

        // Оновлюємо роль користувача
        const updatedUser = await userRepository.updateUser(userIdToUpdate, {role});

        res.status(200).json({message: `User role updated to ${role}.`, user: updatedUser});

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({message: 'Invalid user ID format.'});
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({message: messages.join(', ')});
        }
        res.status(500).json({message: 'Server error: ' + error.message});
    }
};

module.exports = {
    getUsers,
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
    getUserById,
    updateUserProfile,
    deleteUser,
    updateUserRole,
};
