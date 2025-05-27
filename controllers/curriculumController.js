const curriculumRepository = require('../repositories/curriculumRepository');
const mongoose = require('mongoose');

// @desc    Get all curriculums
// @route   GET /api/curriculums
// @access  Public (currently returns all, regardless of isPublic/owner)
const getCurriculums = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const skip = (page - 1) * limit;

        const {curriculums, total} = await curriculumRepository.getAllCurriculums({skip, limit});

        res.status(200).json({
            success: true,
            count: curriculums.length,
            total,
            page,
            limit,
            curriculums
        });
    } catch (error) {
        console.error("Error fetching curriculums with pagination:", error);
        res.status(500).json({message: 'Server error: ' + error.message});
    }
};

// @desc    Get single curriculum by ID
// @route   GET /api/curriculums/:id
// @access  Public/Protected (only if public or owned by the user)
const getCurriculumById = async (req, res) => {
    try {
        const curriculum = await curriculumRepository.findCurriculumById(req.params.id);

        if (!curriculum) {
            return res.status(404).json({message: 'Curriculum not found.'});
        }

        if (!curriculum.isPublic && (!req.user || curriculum.user.toString() !== req.user._id.toString())) {
            return res.status(403).json({message: 'You are not authorized to access this curriculum.'});
        }

        res.status(200).json(curriculum);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({message: 'Invalid curriculum ID format.'});
        }
        console.error("Error fetching curriculum by ID:", error);
        res.status(500).json({message: 'Server error: ' + error.message});
    }
};

// @desc    Create a new curriculum
// @route   POST /api/curriculums
// @access  Protected
const createCurriculum = async (req, res) => {
    const {name, description, universityName, programName, isPublic} = req.body;

    if (!name || !universityName || !programName) {
        return res.status(400).json({message: 'Please enter all required fields: name, universityName, programName.'});
    }

    try {
        const newCurriculum = await curriculumRepository.createCurriculum({
            name,
            description,
            universityName,
            programName,
            isPublic,
            user: req.user._id,
        });
        res.status(201).json(newCurriculum);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({message: messages.join(', ')});
        }
        console.error("Error creating curriculum:", error);
        res.status(500).json({message: 'Server error: ' + error.message});
    }
};

// @desc    Update a curriculum
// @route   PUT /api/curriculums/:id
// @access  Protected (Owner only)
const updateCurriculum = async (req, res) => {
    const {name, description, universityName, programName, isPublic, isClosed} = req.body;
    const curriculumIdToUpdate = req.params.id;

    try {
        const curriculum = await curriculumRepository.findCurriculumById(curriculumIdToUpdate);

        if (!curriculum) {
            return res.status(404).json({message: 'Curriculum not found.'});
        }

        if (curriculum.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({message: 'You are not authorized to update this curriculum.'});
        }

        const updateData = {
            name,
            description,
            universityName,
            programName,
            isPublic,
            isClosed,
        };

        // Видаляємо undefined значення з updateData, щоб не перезаписувати поля на undefined
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const updatedCurriculum = await curriculumRepository.updateCurriculum(curriculumIdToUpdate, updateData);

        if (!updatedCurriculum) {
            return res.status(404).json({message: 'Curriculum not found or could not be updated.'});
        }

        res.status(200).json({message: 'Curriculum updated successfully.', curriculum: updatedCurriculum});
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({message: 'Invalid curriculum ID format.'});
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({message: messages.join(', ')});
        }
        console.error("Error updating curriculum:", error);
        res.status(500).json({message: 'Server error: ' + error.message});
    }
};

// @desc    Delete a curriculum
// @route   DELETE /api/curriculums/:id
// @access  Protected (Owner only)
const deleteCurriculum = async (req, res) => {
    const curriculumIdToDelete = req.params.id;

    try {
        const curriculum = await curriculumRepository.findCurriculumById(curriculumIdToDelete);

        if (!curriculum) {
            return res.status(404).json({message: 'Curriculum not found.'});
        }

        if (curriculum.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({message: 'You are not authorized to delete this curriculum.'});
        }

        const deletedCurriculum = await curriculumRepository.deleteCurriculum(curriculumIdToDelete);

        if (!deletedCurriculum) {
            return res.status(404).json({message: 'Curriculum not found or could not be deleted.'});
        }

        res.status(200).json({message: 'Curriculum deleted successfully.'});
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({message: 'Invalid curriculum ID format.'});
        }
        console.error("Error deleting curriculum:", error);
        res.status(500).json({message: 'Server error: ' + error.message});
    }
};

// @desc    Copy a public curriculum for the authenticated user
// @route   POST /api/curriculums/:id/copy
// @access  Protected
const copyCurriculum = async (req, res) => {
    try {
        const curriculumIdToCopy = req.params.id;
        const userId = req.user._id;
        const {newName} = req.body;

        if (!mongoose.Types.ObjectId.isValid(curriculumIdToCopy)) {
            return res.status(400).json({message: 'Invalid curriculum ID format.'});
        }

        const originalCurriculum = await curriculumRepository.findCurriculumById(curriculumIdToCopy);

        if (!originalCurriculum) {
            return res.status(404).json({message: 'Original curriculum not found.'});
        }

        // Перевірка: Curriculum має бути публічним, щоб його можна було копіювати
        if (!originalCurriculum.isPublic) {
            return res.status(403).json({message: 'You are not authorized to copy this private curriculum.'});
        }

        // Підготовка даних для нового Curriculum
        const newCurriculumData = {
            name: newName || `${originalCurriculum.name} (Copy)`,
            description: originalCurriculum.description,
            universityName: originalCurriculum.universityName,
            programName: originalCurriculum.programName,
            isPublic: false,
            isClosed: false,
            user: userId,
            subjects: originalCurriculum.subjects,
        };

        const copiedCurriculum = await curriculumRepository.createCurriculum(newCurriculumData);

        res.status(201).json({
            message: 'Curriculum copied successfully.',
            curriculum: copiedCurriculum
        });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({message: 'Invalid curriculum ID format.'});
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({message: 'Validation error when copying curriculum: ' + messages.join(', ')});
        }
        console.error("Error copying curriculum:", error);
        res.status(500).json({message: 'Server error: ' + error.message});
    }
};


module.exports = {
    getCurriculums,
    getCurriculumById,
    createCurriculum,
    updateCurriculum,
    deleteCurriculum,
    copyCurriculum,
};
