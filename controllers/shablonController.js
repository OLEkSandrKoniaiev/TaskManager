const shablonRepository = require('../repositories/shablonRepository');

// @desc    Get all shablons
// @route   GET /api/shablons
// @access  Public
const getShablons = async (req, res) => {
    try {
        const shablons = await shablonRepository.getAllShablons();
        res.json(shablons);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

// @desc    Create a new shablon
// @route   POST /api/shablons
// @access  Protected
const createShablon = async (req, res) => {
    const {name, description, universityName, programName, isPublic, fields} = req.body;

    if (!name || !universityName || !programName || !fields) {
        return res.status(400).json({message: 'Please enter all fields'});
    }

    try {
        const newShablon = await shablonRepository.createShablon({
            name,
            description,
            universityName,
            programName,
            isPublic,
            fields,
            user: req.user._id,
        });
        res.status(201).json(newShablon);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

module.exports = {
    getShablons,
    createShablon,
};
