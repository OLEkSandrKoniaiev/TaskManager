const express = require('express');
const router = express.Router();
const {
    getUsers,
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
    getUserById,
    updateUserProfile,
    deleteUser,
    updateUserRole
} = require('../controllers/userController');
const {protect} = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRolesMiddleware');

// --- Публічні маршрути ---
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken);

// --- Захищені маршрути (потребують Access Token) ---
router.post('/logout', protect, logoutUser);
router.get('/:id', protect, getUserById);
router.put('/:id', protect, updateUserProfile);
router.delete('/:id', protect, deleteUser);


// --- Доступно тільки адміністраторам ---
router.get('/', protect, authorizeRoles('admin'), getUsers);
router.put('/:id/role', protect, authorizeRoles('admin'), updateUserRole);

module.exports = router;
