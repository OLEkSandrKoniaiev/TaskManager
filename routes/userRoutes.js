const express = require('express');
const router = express.Router();
const {getUsers, registerUser, loginUser, refreshToken} = require('../controllers/userController');

router.get('/', getUsers);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken);

module.exports = router;
