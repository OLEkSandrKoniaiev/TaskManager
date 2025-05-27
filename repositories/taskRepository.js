const Task = require('../models/Task');

class TaskRepository {
    /**
     * Отримує список завдань на основі наданого запиту, фільтрації та сортування.
     * @param {object} filter - Об'єкт фільтрації для MongoDB.
     * @param {object} sort - Об'єкт сортування для MongoDB.
     * @returns {Promise<Array<Task>>} Масив об'єктів Task.
     */
    async getTasks(filter = {}, sort = {}) {
        return await Task.find(filter)
            .sort(sort)
            .populate({
                path: 'curriculum',
                select: 'user subjects'
            });
    }

    /**
     * Знаходить завдання за ID.
     * @param {string} id - ID завдання.
     * @returns {Promise<Task|null>} Об'єкт Task або null.
     */
    async findTaskById(id) {
        return await Task.findById(id).populate({
            path: 'curriculum',
            select: 'user subjects'
        });
    }

    /**
     * Створює нове завдання.
     * @param {object} taskData - Дані для створення завдання.
     * @returns {Promise<Task>} Створений об'єкт Task.
     */
    async createTask(taskData) {
        const task = new Task(taskData);
        return await task.save();
    }

    /**
     * Оновлює існуюче завдання за ID.
     * @param {string} id - ID завдання для оновлення.
     * @param {object} updateData - Об'єкт з даними для оновлення.
     * @returns {Promise<Task|null>} Оновлений об'єкт Task або null.
     */
    async updateTask(id, updateData) {
        return await Task.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        }).populate({
            path: 'curriculum',
            select: 'user subjects'
        });
    }

    /**
     * Видаляє завдання за ID.
     * @param {string} id - ID завдання для видалення.
     * @returns {Promise<Task|null>} Видалений об'єкт Task або null.
     */
    async deleteTask(id) {
        return await Task.findByIdAndDelete(id).populate({
            path: 'curriculum',
            select: 'user subjects'
        });
    }
}

module.exports = new TaskRepository();
