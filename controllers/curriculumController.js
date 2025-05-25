const curriculumRepository = require('../repositories/curriculumRepository');

// @desc    Get all curriculums
// @route   GET /api/curriculums
// @access  Public
const getCurriculums = async (req, res) => {
    try {
        const curriculums = await curriculumRepository.getAllCurriculums();
        res.json(curriculums);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

// @desc    Create a new curriculum
// @route   POST /api/curriculums
// @access  Protected
const createCurriculum = async (req, res) => {
    const {name, description, universityName, programName, isPublic, fields} = req.body;

    if (!name || !universityName || !programName || !fields) {
        return res.status(400).json({message: 'Please enter all fields'});
    }

    try {
        const newCurriculum = await curriculumRepository.createCurriculum({
            name,
            description,
            universityName,
            programName,
            isPublic,
            fields,
            user: req.user._id,
        });
        res.status(201).json(newCurriculum);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

module.exports = {
    getCurriculums,
    createCurriculum,
};
