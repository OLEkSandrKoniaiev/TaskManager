const express = require('express');
const router = express.Router();
const {getShablons, createShablon} = require('../controllers/shablonController');
const {protect} = require('../middlewares/authMiddleware');

// Get all shablons
router.get('/', getShablons);

// Create new shablon
router.post('/', protect, createShablon);
// router.post('/', async(req, res)=>await createShablon(req, res));

module.exports = router;
