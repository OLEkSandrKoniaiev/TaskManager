const express = require('express');
const router = express.Router();
const {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
} = require('../controllers/taskController');
const {protect} = require('../middlewares/authMiddleware');

// === Захищені маршрути (потребують Access Token) ===
// --- Тільки власник --
router.get('/', protect, getTasks);
router.get('/:id', protect, getTaskById);
router.put('/:id', protect, updateTask);
router.delete('/:id', protect, deleteTask);

// --- Публічні ---
router.post('/', protect, createTask);

module.exports = router;
