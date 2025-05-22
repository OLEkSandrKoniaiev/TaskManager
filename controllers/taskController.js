const taskRepository = require('../repositories/taskRepository');
const asyncHandler = require('express-async-handler');


// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Protected
const getTasks = asyncHandler(async (req, res) => {
    let filter = {}; // Порожній фільтр за замовчуванням

    // Припускаємо, що `req.user` існує після автентифікації.
    // І що `req.user.role` також існує (наприклад, 'admin', 'user').
    // Якщо у тебе немає поля role, можна використовувати інші ознаки або просто прив'язувати до user ID завжди.

    if (req.user && req.user.role === 'admin') {
        // Якщо користувач адміністратор, то не додаємо userId до фільтра,
        // щоб taskRepository.getTasks({}) повернув усі завдання.
        console.log('Admin accessing all tasks.');
    } else if (req.user) {
        // Якщо користувач звичайний, то додаємо його user ID до фільтра.
        filter.user = req.user._id; // Важливо: поле в моделі Task назване `user`, а не `userId`
        console.log(`User ${req.user._id} accessing their tasks.`);
    } else {
        // Цей блок, по ідеї, не повинен виконуватись,
        // якщо маршрут захищений аутентифікаційним middleware.
        return res.status(401).json({message: 'Not authorized, no user found'});
    }

    try {
        const tasks = await taskRepository.getTasks(filter);
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({message: error.message});
    }
});

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Protected
const createTask = asyncHandler(async (req, res) => {
    const {name, description, deadline, priority, status, category, tags, attachments, shablon} = req.body;

    if (!name || !deadline || !category || !shablon) {
        return res.status(400).json({message: 'Please enter all required fields: name, deadline, category, and shablon'});
    }

    try {
        const newTask = await taskRepository.createTask({
            name,
            description,
            deadline,
            priority,
            status,
            category,
            tags,
            attachments,
            user: req.user._id,
            shablon: shablon,
        });
        res.status(201).json(newTask);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({message: error.message, errors: error.errors});
        }
        res.status(500).json({message: 'Server error', error: error.message});
    }
});

module.exports = {
    getTasks,
    createTask,
};
