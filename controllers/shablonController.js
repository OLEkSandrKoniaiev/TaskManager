const Shablon = require('../models/shablon');

// @desc    Get all shablons
// @route   GET /api/shablons
// @access  Public
const getShablons = async (req, res) => {
    try {
        const shablons = await Shablon.find();
        res.json(shablons);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

// @desc    Create new shablon
// @route   POST /api/shablons
// @access  Public
const createShablon = async (req, res) => {
    const {name, description, fields} = req.body;

    if (!name) {
        return res.status(400).json({message: 'Name is required'});
    }

    try {
        const newShablon = new Shablon({name, description, fields});
        const savedShablon = await newShablon.save();
        res.status(201).json(savedShablon);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

module.exports = {
    getShablons,
    createShablon,
};
