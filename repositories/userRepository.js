const mongoose = require('mongoose');
const User = mongoose.models.User || mongoose.model('User', require('../models/User').schema);

class UserRepository {
    async getAllUsers() {
        return await User.find({});
    }

    // async findUserById(id) {
    //     return await User.findById(id);
    // }
    //
    // async findUserByEmail(email) {
    //     return await User.findOne({email});
    // }

    async createUser(userData) {
        const user = new User(userData);
        return await user.save();
    }
}

module.exports = new UserRepository();
