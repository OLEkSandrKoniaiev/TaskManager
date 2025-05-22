// services/taskService.js
const Task = require('../models/Task');
const cron = require('node-cron');

class TaskService {
    /**
     * Оновлює статус протермінованих завдань
     * @param {String} userId - ID користувача (опціонально)
     * @returns {Promise<Object>} - результат оновлення
     */
    async updateOverdueTasks(userId = null) {
        try {
            const filter = {
                deadline: {$lt: new Date()},
                status: {$in: ['pending', 'in progress']}
            };

            // Якщо передано userId, оновлюємо тільки його завдання
            if (userId) {
                filter.user = userId;
            }

            const result = await Task.updateMany(
                filter,
                {$set: {status: 'overdue'}}
            );

            console.log(`Updated ${result.modifiedCount} overdue tasks`);
            return {
                success: true,
                updatedCount: result.modifiedCount,
                message: `Updated ${result.modifiedCount} overdue tasks`
            };
        } catch (error) {
            console.error('Error updating overdue tasks:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Отримує завдання користувача з автоматичним оновленням статусу
     * @param {String} userId - ID користувача
     * @param {Object} filters - додаткові фільтри
     * @returns {Promise<Array>} - масив завдань
     */
    async getUserTasksWithStatusUpdate(userId, filters = {}) {
        try {
            // Спочатку оновлюємо протерміновані завдання користувача
            await this.updateOverdueTasks(userId);

            // Потім отримуємо завдання
            const query = {user: userId, ...filters};
            return await Task.find(query)
                .populate('shablon', 'name programName')
                .sort({deadline: 1});
        } catch (error) {
            console.error('Error fetching user tasks:', error);
            throw error;
        }
    }

    /**
     * Створює завдання з валідацією дедлайну
     * @param {Object} taskData - дані завдання
     * @returns {Promise<Object>} - створене завдання
     */
    async createTask(taskData) {
        try {
            // Перевіряємо чи дедлайн не в минулому при створенні
            if (new Date(taskData.deadline) < new Date()) {
                console.warn('Creating task with past deadline');
            }

            const task = new Task(taskData);

            // Автоматично встановлюємо статус overdue якщо дедлайн у минулому
            if (new Date(task.deadline) < new Date()) {
                task.status = 'overdue';
            }

            return await task.save();
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }

    /**
     * Оновлює завдання з перевіркою статусу
     * @param {String} taskId - ID завдання
     * @param {Object} updateData - дані для оновлення
     * @returns {Promise<Object>} - оновлене завдання
     */
    async updateTask(taskId, updateData) {
        try {
            const task = await Task.findById(taskId);
            if (!task) {
                throw new Error('Task not found');
            }

            // Оновлюємо поля
            Object.assign(task, updateData);

            // Перевіряємо статус після оновлення
            if (new Date(task.deadline) < new Date() &&
                ['pending', 'in progress'].includes(task.status)) {
                task.status = 'overdue';
            }

            return await task.save();
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    }

    /**
     * Отримує статистику завдань користувача
     * @param {String} userId - ID користувача
     * @returns {Promise<Object>} - статистика
     */
    async getUserTaskStats(userId) {
        try {
            // Спочатку оновлюємо статуси
            await this.updateOverdueTasks(userId);

            const stats = await Task.aggregate([
                {$match: {user: userId}},
                {
                    $group: {
                        _id: '$status',
                        count: {$sum: 1}
                    }
                }
            ]);

            const result = {
                pending: 0,
                'in progress': 0,
                completed: 0,
                defended: 0,
                overdue: 0
            };

            stats.forEach(stat => {
                result[stat._id] = stat.count;
            });

            return result;
        } catch (error) {
            console.error('Error getting task stats:', error);
            throw error;
        }
    }

    /**
     * Запускає періодичну перевірку протермінованих завдань
     * Виконується кожну годину
     */
    startOverdueTasksScheduler() {
        // Запускається кожну годину: 0 * * * *
        cron.schedule('0 * * * *', async () => {
            console.log('Running scheduled overdue tasks update...');
            await this.updateOverdueTasks();
        });

        console.log('Overdue tasks scheduler started (runs every hour)');
    }

    /**
     * Запускає щоденну перевірку (опціонально)
     * Виконується щодня о 9:00 ранку
     */
    startDailyOverdueCheck() {
        // Запускається щодня о 9:00: 0 9 * * *
        cron.schedule('0 9 * * *', async () => {
            console.log('Running daily overdue tasks check...');
            const result = await this.updateOverdueTasks();

            // Тут можна додати логіку для відправлення сповіщень
            if (result.updatedCount > 0) {
                console.log(`Daily check: ${result.updatedCount} tasks marked as overdue`);
                // TODO: Відправити сповіщення адміністраторам
            }
        });

        console.log('Daily overdue check scheduled for 9:00 AM');
    }
}

module.exports = new TaskService();
