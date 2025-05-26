const express = require('express');
const router = express.Router();
const {
    getCurriculums,
    getCurriculumById,
    createCurriculum,
    updateCurriculum,
    deleteCurriculum,
} = require('../controllers/curriculumController');
const {protect} = require('../middlewares/authMiddleware');

// === Захищені маршрути (потребують Access Token) ===
// --- Тільки власник ---
router.put('/:id', protect, updateCurriculum);
router.delete('/:id', protect, deleteCurriculum);

// --- Публічні або тільки власник ---
router.get('/', protect, getCurriculums);
router.get('/:id', protect, getCurriculumById);

// --- Публічні ---
router.post('/', protect, createCurriculum);

module.exports = router;
