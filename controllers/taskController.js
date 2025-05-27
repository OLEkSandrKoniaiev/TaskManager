const taskRepository = require('../repositories/taskRepository');
const Curriculum = require('../models/Curriculum');
const mongoose = require('mongoose');

// @desc    Get all tasks for the authenticated user's curriculums
// @route   GET /api/tasks
// @access  Protected (Owner only)
const getTasks = async (req, res) => {
    try {
        const userId = req.user._id;

        // Шукаємо всі Curriculum, що належать цьому користувачу
        const userCurriculums = await Curriculum.find({user: userId}).select('_id');
        const curriculumIds = userCurriculums.map(curriculum => curriculum._id);

        // Якщо в користувача немає навчальних планів, він не може мати завдань
        if (curriculumIds.length === 0) {
            return res.status(200).json([]);
        }

        // Базовий фільтр: завдання мають належати будь-якому з curriculum користувача
        let filter = {curriculum: {$in: curriculumIds}};
        let sort = {};

        // Обробка параметрів фільтрації з req.query
        // Дозволені поля для фільтрації: priority, status, category, curriculum, subject
        const {priority, status, category, curriculum, subject, deadline_gte, deadline_lte} = req.query;

        if (priority) {
            filter.priority = priority;
        }
        if (status) {
            filter.status = status;
        }
        if (category) {
            filter.category = category;
        }
        if (subject) {
            filter.subject = subject;
        }

        // Фільтрація за curriculum ID
        if (curriculum) {
            // Перевіряємо, чи переданий curriculum ID є валідним ObjectId
            if (!mongoose.Types.ObjectId.isValid(curriculum)) {
                return res.status(400).json({message: 'Invalid curriculum ID format.'});
            }
            // Перевіряємо, чи переданий curriculum ID належить поточному користувачу
            if (!curriculumIds.some(id => id.toString() === curriculum.toString())) {
                // Якщо переданий curriculum ID не належить користувачу, повертаємо 403 або порожній масив,
                // оскільки він не має доступу до завдань, пов'язаних з цим curriculum.
                // Вирішив повернути 403, щоб чітко вказати на проблему доступу.
                return res.status(403).json({message: 'You are not authorized to filter by this curriculum.'});
            }
            // Якщо все добре, додаємо фільтр за конкретним curriculum
            filter.curriculum = curriculum;
        }

        // Фільтрація за діапазоном дат (deadline)
        if (deadline_gte || deadline_lte) {
            filter.deadline = {};
            if (deadline_gte) {
                const dateGte = new Date(deadline_gte);
                if (isNaN(dateGte.getTime())) {
                    return res.status(400).json({message: 'Invalid deadline_gte date format.'});
                }
                filter.deadline.$gte = dateGte;
            }
            if (deadline_lte) {
                const dateLte = new Date(deadline_lte);
                if (isNaN(dateLte.getTime())) {
                    return res.status(400).json({message: 'Invalid deadline_lte date format.'});
                }
                filter.deadline.$lte = dateLte;
            }
        }


        // Обробка параметрів сортування з req.query
        // Дозволені поля для сортування: name, deadline
        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':'); // Наприклад, 'deadline:desc'
            const field = parts[0];
            const order = parts[1] === 'desc' ? -1 : 1; // 1 для asc, -1 для desc

            const allowedSortFields = ['name', 'deadline']; // Тільки дозволені поля для сортування
            if (allowedSortFields.includes(field)) {
                sort[field] = order;
            } else {
                // Якщо поле для сортування не дозволено, можна повернути 400 або ігнорувати його.
                // Для більшої гнучкості зараз просто ігноруємо невалідні поля.
                console.warn(`Attempted to sort by disallowed field: ${field}. Ignoring.`);
            }
        }

        // Викликаємо репозиторій з оновленими параметрами фільтрації та сортування
        const tasks = await taskRepository.getTasks(filter, sort);

        res.status(200).json(tasks);
    } catch (error) {
        console.error("Error fetching tasks with filters/sort:", error);
        res.status(500).json({message: 'Server error: ' + error.message});
    }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Protected (Owner only)
const getTaskById = async (req, res) => {
    try {
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
    } catch (error) {
        console.error("Error fetching task by ID:", error);
        res.status(500).json({message: 'Server error: ' + error.message});
    }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Protected (Owner of Curriculum)
const createTask = async (req, res) => {
    const {name, description, deadline, priority, status, category, subject, attachments, curriculum} = req.body;
    const userId = req.user._id;

    try {
        if (!name || !deadline || !category || !curriculum || !subject) {
            return res.status(400).json({message: 'Please enter all required fields: name, deadline, category, subject, and curriculum ID.'});
        }

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
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Protected (Owner only)
const updateTask = async (req, res) => {
    const taskId = req.params.id;
    const userId = req.user._id; // ID аутентифікованого користувача
    const {name, description, deadline, priority, status, category, subject, attachments, curriculum} = req.body;

    try {
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
        } else if (subject && task.curriculum && !task.curriculum.subjects.includes(subject)) {
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
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Protected (Owner only)
const deleteTask = async (req, res) => {
    try {
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
};

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
};
