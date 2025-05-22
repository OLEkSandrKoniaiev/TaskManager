const express = require('express');
const router = express.Router();
const {protect} = require('../middlewares/authMiddleware');
const {getTasks, createTask} = require("../controllers/taskController");

router.get('/', protect, getTasks);
router.post('/', protect, createTask);

module.exports = router;
