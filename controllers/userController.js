const userRepository = require('../repositories/userRepository');

// @desc    Get all users
// @route   GET /api/users
// @access  Public
const getUsers = async (req, res) => {
    try {
        const users = await userRepository.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Public
const createUser = async (req, res) => {
    try {
        const {username, email, password, role} = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({message: 'Please enter all fields'});
        }

        const newUser = await userRepository.createUser({username, email, password, role});
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

module.exports = {
    getUsers,
    createUser,
};
