const express = require('express');
const router = express.Router();
const {getShablons, createShablon} = require('../controllers/shablonController');

// Get all shablons
router.get('/', getShablons);

// Create new shablon
router.post('/', createShablon);

module.exports = router;
