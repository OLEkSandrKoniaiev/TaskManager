// middlewares/taskStatusMiddleware.js
const taskService = require('../services/taskService');

/**
 * Middleware для автоматичного оновлення статусу завдань користувача
 * Викликається при кожному запиті до API завдань
 */
const updateUserTasksStatus = async (req, res, next) => {
    try {
        // Перевіряємо чи є userId в req (з authMiddleware)
        if (req.user && req.user.id) {
            // Тихо оновлюємо статуси користувача у фоні
            taskService.updateOverdueTasks(req.user.id).catch(error => {
                console.error('Background task status update failed:', error);
                // Не блокуємо запит через помилку оновлення
            });
        }

        next();
    } catch (error) {
        console.error('Task status middleware error:', error);
        // Не блокуємо запит через помилку middleware
        next();
    }
};

/**
 * Middleware для оновлення статусу перед поверненням завдань
 * Використовується для критичних ендпоінтів де важлива актуальність
 */
const ensureTasksStatusUpdated = async (req, res, next) => {
    try {
        if (req.user && req.user.id) {
            // Синхронно оновлюємо статуси перед виконанням запиту
            await taskService.updateOverdueTasks(req.user.id);
        }
        next();
    } catch (error) {
        console.error('Critical task status update failed:', error);
        // У критичних ендпоінтах можна повернути помилку
        return res.status(500).json({
            success: false,
            message: 'Failed to update task statuses'
        });
    }
};

/**
 * Middleware для логування змін статусу завдань
 */
const logTaskStatusChanges = (req, res, next) => {
    // Зберігаємо оригінальний json метод
    const originalJson = res.json;

    // Перевизначаємо json метод
    res.json = function (data) {
        // Логуємо якщо у відповіді є інформація про оновлені завдання
        if (data && data.updatedCount && data.updatedCount > 0) {
            console.log(`Status updated for ${data.updatedCount} tasks for user ${req.user?.id}`);
        }

        // Викликаємо оригінальний метод
        originalJson.call(this, data);
    };

    next();
};

module.exports = {
    updateUserTasksStatus,
    ensureTasksStatusUpdated,
    logTaskStatusChanges
};
