const taskRepository = require('../repositories/taskRepository');
const asyncHandler = require('express-async-handler');
const Curriculum = require('../models/Curriculum');


// @desc    Get all tasks for the authenticated user's curriculums
// @route   GET /api/tasks
// @access  Protected (Owner only)
const getTasks = asyncHandler(async (req, res) => {
    // Отримуємо ID користувача з req.user (забезпечено protect middleware)
    const userId = req.user._id;

    // Шукаємо всі Curriculum, що належать цьому користувачу
    // Отримуємо тільки їхні ID, оскільки саме за цими ID ми будемо фільтрувати завдання
    const userCurriculums = await Curriculum.find({user: userId}).select('_id');
    const curriculumIds = userCurriculums.map(curriculum => curriculum._id);

    // Якщо у користувача немає навчальних планів, він не може мати завдань
    if (curriculumIds.length === 0) {
        return res.status(200).json([]); // Повертаємо порожній масив, якщо немає curriculum
    }

    // Шукаємо завдання, які належать будь-якому з цих curriculum
    const tasks = await taskRepository.getTasks({curriculum: {$in: curriculumIds}});

    res.status(200).json(tasks);
});

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Protected (Owner only)
const getTaskById = asyncHandler(async (req, res) => {
    const taskId = req.params.id;
    const userId = req.user._id; // ID аутентифікованого користувача

    const task = await taskRepository.findTaskById(taskId);

    if (!task) {
        return res.status(404).json({message: 'Task not found.'});
    }

    // Перевірка власності: завдання належить Curriculum, а Curriculum належить користувачу
    // console.log('Task curriculum user ID:', task.curriculum.user.toString());
    // console.log('Request user ID:', userId.toString());
    if (task.curriculum.user.toString() !== userId.toString()) {
        return res.status(403).json({message: 'You are not authorized to access this task.'});
    }

    res.status(200).json(task);
});

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Protected (Owner of Curriculum)
const createTask = asyncHandler(async (req, res) => {
    // Змінив 'tags' на 'subject' відповідно до моделі Task
    const {name, description, deadline, priority, status, category, subject, attachments, curriculum} = req.body;
    const userId = req.user._id; // ID аутентифікованого користувача

    if (!name || !deadline || !category || !curriculum || !subject) {
        return res.status(400).json({message: 'Please enter all required fields: name, deadline, category, subject, and curriculum ID.'});
    }

    // Перевірка, чи вказаний curriculum належить поточному користувачу
    const existingCurriculum = await Curriculum.findById(curriculum).select('user subjects');

    if (!existingCurriculum) {
        return res.status(404).json({message: 'Associated Curriculum not found.'});
    }

    if (existingCurriculum.user.toString() !== userId.toString()) {
        return res.status(403).json({message: 'You are not authorized to create a task for this curriculum.'});
    }

    // Перевірка, чи subject існує в Curriculum.subjects
    if (subject && !existingCurriculum.subjects.includes(subject)) {
        return res.status(400).json({message: `Subject '${subject}' is not defined in the associated Curriculum.`});
    }

    try {
        const newTask = await taskRepository.createTask({
            name,
            description,
            deadline,
            priority,
            status,
            category,
            subject,
            attachments,
            curriculum: curriculum,
        });
        res.status(201).json(newTask);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({message: 'Validation error: ' + messages.join(', ')});
        }
        if (error.name === 'CastError' && error.path === 'curriculum') {
            return res.status(400).json({message: 'Invalid Curriculum ID format.'});
        }
        console.error("Error creating task:", error);
        res.status(500).json({message: 'Server error: ' + error.message});
    }
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Protected (Owner only)
const updateTask = asyncHandler(async (req, res) => {
    const taskId = req.params.id;
    const userId = req.user._id; // ID аутентифікованого користувача
    const {name, description, deadline, priority, status, category, subject, attachments, curriculum} = req.body;

    const task = await taskRepository.findTaskById(taskId);

    if (!task) {
        return res.status(404).json({message: 'Task not found.'});
    }

    // Перевірка власності (якщо Task пов'язаний з Curriculum)
    if (task.curriculum.user.toString() !== userId.toString()) {
        return res.status(403).json({message: 'You are not authorized to update this task.'});
    }

    // Якщо оновлюється curriculum, потрібно перевірити, чи новий curriculum також належить користувачу
    let newCurriculumId = curriculum;
    if (newCurriculumId && newCurriculumId.toString() !== task.curriculum._id.toString()) {
        const newCurriculum = await Curriculum.findById(newCurriculumId).select('user subjects');
        if (!newCurriculum) {
            return res.status(404).json({message: 'New associated Curriculum not found.'});
        }
        if (newCurriculum.user.toString() !== userId.toString()) {
            return res.status(403).json({message: 'You are not authorized to associate this task with the new curriculum.'});
        }
        // Якщо subject також оновлюється разом з curriculum, перевіряємо його в новому curriculum
        if (subject && !newCurriculum.subjects.includes(subject)) {
            return res.status(400).json({message: `Subject '${subject}' is not defined in the new associated Curriculum.`});
        }
    } else if (subject && !task.curriculum.subjects.includes(subject)) {
        // Якщо curriculum не змінюється, але subject оновлюється, перевіряємо його в поточному curriculum
        return res.status(400).json({message: `Subject '${subject}' is not defined in the current Curriculum.`});
    }

    const updateData = {
        name,
        description,
        deadline,
        priority,
        status,
        category,
        subject,
        attachments,
        curriculum: newCurriculumId,
    };

    // Видаляємо undefined значення, щоб не перезаписувати поля на undefined
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    try {
        const updatedTask = await taskRepository.updateTask(taskId, updateData);

        if (!updatedTask) {
            return res.status(404).json({message: 'Task not found or could not be updated.'});
        }

        res.status(200).json({message: 'Task updated successfully.', task: updatedTask});
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({message: 'Validation error: ' + messages.join(', ')});
        }
        if (error.name === 'CastError') {
            return res.status(400).json({message: 'Invalid ID format or associated Curriculum ID format.'});
        }
        console.error("Error updating task:", error);
        res.status(500).json({message: 'Server error: ' + error.message});
    }
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Protected (Owner only)
const deleteTask = asyncHandler(async (req, res) => {
    const taskId = req.params.id;
    const userId = req.user._id; // ID аутентифікованого користувача

    const task = await taskRepository.findTaskById(taskId);

    if (!task) {
        return res.status(404).json({message: 'Task not found.'});
    }

    // Перевірка власності
    if (task.curriculum.user.toString() !== userId.toString()) {
        return res.status(403).json({message: 'You are not authorized to delete this task.'});
    }

    try {
        const deletedTask = await taskRepository.deleteTask(taskId);

        if (!deletedTask) {
            return res.status(404).json({message: 'Task not found or could not be deleted.'});
        }

        res.status(200).json({message: 'Task deleted successfully.'});
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({message: 'Invalid task ID format.'});
        }
        console.error("Error deleting task:", error);
        res.status(500).json({message: 'Server error: ' + error.message});
    }
});

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
};
