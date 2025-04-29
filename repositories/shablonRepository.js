const Shablon = require('../models/shablon');

class ShablonRepository {
    async getAllShablons() {
        return await Shablon.find({});
    }

    async createShablon(shablonData) {
        const shablon = new Shablon(shablonData);
        return await shablon.save();
    }
}

module.exports = new ShablonRepository();
