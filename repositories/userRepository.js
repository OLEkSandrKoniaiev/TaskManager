const User = require('../models/user');

class UserRepository {
    async getAllUsers() {
        return await User.find({});
    }

    async createUser(userData) {
        const user = new User(userData);
        return await user.save();
    }
}

module.exports = new UserRepository();
