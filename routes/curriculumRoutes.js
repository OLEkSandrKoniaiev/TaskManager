const express = require('express');
const router = express.Router();
const {
    getCurriculums,
    getCurriculumById,
    createCurriculum,
    updateCurriculum,
    deleteCurriculum,
    copyCurriculum,
} = require('../controllers/curriculumController');
const {protect} = require('../middlewares/authMiddleware');

// === Захищені маршрути (потребують Access Token) ===
// --- Тільки власник ---
router.put('/:id', protect, updateCurriculum);
router.delete('/:id', protect, deleteCurriculum);

// --- Публічні або тільки власник ---
router.get('/', protect, getCurriculums);
router.get('/:id', protect, getCurriculumById);
router.post('/:id/copy', protect, copyCurriculum);

// --- Публічні ---
router.post('/', protect, createCurriculum);

module.exports = router;
