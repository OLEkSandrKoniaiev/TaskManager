const userRepository = require('../repositories/userRepository');
const mongoose = require('mongoose');
const User = mongoose.models.User || mongoose.model('User', require('../models/User').schema);


// @desc    Get all users with search, filter, sort and pagination
// @route   GET /api/users
// @access  Private/Admin Only
const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let filter = {};
        let sort = {};

        if (req.query.search) {
            const searchRegex = {$regex: req.query.search, $options: 'i'};
            filter.$or = [
                {username: searchRegex},
                {email: searchRegex}
            ];
        }

        if (req.query.role) {
            const allowedRoles = ['user', 'admin'];
            if (allowedRoles.includes(req.query.role.toLowerCase())) {
                filter.role = req.query.role.toLowerCase();
            } else {
                return res.status(400).json({message: 'Invalid role for filtering. Allowed roles are "user" or "admin".'});
            }
        }

        if (req.query.isActive !== undefined) {
            filter.isActive = req.query.isActive === 'true';
        }

        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':');
            const field = parts[0];
            const order = parts[1] === 'desc' ? -1 : 1;

            const allowedSortFields = ['username', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'];
            if (allowedSortFields.includes(field)) {
                sort[field] = order;
            } else {
                console.warn(`Attempted to sort by disallowed field: ${field}. Ignoring.`);
            }
        } else {
            sort.createdAt = -1;
        }

        const {users, total} = await userRepository.getAllUsers({filter, skip, limit, sort});

        res.status(200).json({
            success: true,
            count: users.length,
            total,
            page,
            limit,
            users
        });
    } catch (error) {
        console.error("Error fetching users with pagination, filter, sort, and search:", error);
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
        if (error.name === 'CastError') {
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
    const userIdToUpdate = req.params.id;

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

        if (username !== existingUser.username) {
            const userWithSameUsername = await User.findOne({username: username});
            if (userWithSameUsername) {
                return res.status(400).json({message: 'Username is already taken.'});
            }
        }

        const updatedUser = await userRepository.updateUser(userIdToUpdate, {username});

        if (!updatedUser) {
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
    const {password} = req.body;

    if (req.user._id.toString() !== userIdToDelete) {
        return res.status(403).json({message: 'You are not authorized to delete this user.'});
    }

    if (!password) {
        return res.status(400).json({message: 'Please provide your password to confirm deletion.'});
    }

    try {
        const user = await User.findById(userIdToDelete).select('+password');

        if (!user) {
            return res.status(404).json({message: 'User not found.'});
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({message: 'Incorrect password. Deletion denied.'});
        }

        const deletedUser = await userRepository.deleteUser(userIdToDelete);

        if (!deletedUser) {
            return res.status(404).json({message: 'User not found or could not be deleted.'});
        }

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
    const {role} = req.body;

    if (req.user.role !== 'admin') {
        return res.status(403).json({message: 'Only administrators can update user roles.'});
    }

    if (!role) {
        return res.status(400).json({message: 'Please provide a new role.'});
    }

    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({message: 'Invalid role provided. Role must be "user" or "admin".'});
    }

    try {
        const user = await userRepository.findUserById(userIdToUpdate);

        if (!user) {
            return res.status(404).json({message: 'User not found.'});
        }

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
