const express = require('express');
const router = express.Router();
const {getUsers, registerUser, loginUser, refreshToken} = require('../controllers/userController');
const {protect} = require('../middlewares/authMiddleware');
const authorizeRoles = require('../middlewares/authorizeRolesMiddleware');

router.get('/', protect, authorizeRoles('admin'), getUsers);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken);

module.exports = router;
