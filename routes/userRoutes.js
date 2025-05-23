const express = require('express');
const router = express.Router();
const {getUsers, registerUser, loginUser, refreshToken, logoutUser} = require('../controllers/userController');
const {protect} = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRolesMiddleware');

// Публічні маршрути
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken);

// Захищені маршрути
router.get('/', protect, authorizeRoles('admin'), getUsers);
router.post('/logout', protect, logoutUser);

module.exports = router;
