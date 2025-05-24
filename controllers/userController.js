const userRepository = require('../repositories/userRepository');
const mongoose = require('mongoose');
const User = mongoose.models.User || mongoose.model('User', require('../models/User').schema);


// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin Only
const getUsers = async (req, res) => {
    try {
        // Отримуємо параметри пагінації з query-параметрів запиту (наприклад, /api/users?page=1&limit=10)
        // Встановлюємо значення за замовчуванням, якщо вони не вказані або не є числами
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Розраховуємо зміщення (скільки документів пропустити)
        const skip = (page - 1) * limit;

        // Викликаємо метод репозиторію з параметрами пагінації
        // userRepository.getAllUsers тепер повертає { users, total }
        const {users, total} = await userRepository.getAllUsers({skip, limit});

        // Відправляємо відповідь з даними та метаданими пагінації
        res.status(200).json({
            success: true,
            count: users.length, // Кількість користувачів на поточній сторінці
            total,              // Загальна кількість користувачів
            page,               // Поточна сторінка
            limit,              // Кількість елементів на сторінці
            users               // Масив користувачів
        });
    } catch (error) {
        console.error("Error fetching users with pagination:", error); // Логування помилки для налагодження
        res.status(500).json({message: 'Server error: ' + error.message});
    }
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
    getUserById,
    updateUserProfile,
    deleteUser,
    updateUserRole,
};
