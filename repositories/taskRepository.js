const Task = require('../models/task');

class TaskRepository {
    async getTasks(filter = {}) {
        // filter може містити { userId: 'someId' } або бути порожнім {}
        return await Task.find(filter);
    }

    async createTask(taskData) {
        const task = new Task(taskData);
        return await task.save();
    }
}

module.exports = new TaskRepository();
