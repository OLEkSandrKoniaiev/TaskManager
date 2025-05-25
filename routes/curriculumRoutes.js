const express = require('express');
const router = express.Router();
const {getCurriculums, createCurriculum} = require('../controllers/curriculumController');
const {protect} = require('../middlewares/authMiddleware');

// Get all curriculums
router.get('/', getCurriculums);

// Create a new curriculum
router.post('/', protect, createCurriculum);

module.exports = router;
