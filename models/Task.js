const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minLength: [5, 'Name must be at least 5 characters long'],
            maxLength: [50, 'Name must be at most 50 characters long'],
            match: [/^[a-zA-ZА-Яа-яЇїІіЄєҐґ0-9\s\W]+$/, 'Name can only contain latin and сyrillic letters, numbers, whitespaces and special characters'],
        },
        description: {
            type: String,
            required: false,
            trim: true,
            minLength: [5, 'Description must be at least 5 characters long'],
            maxLength: [5000, 'Description must be at most 5000 characters long'],
            match: [/^[a-zA-ZА-Яа-яЇїІіЄєҐґ0-9\s\W]+$/, 'Name can only contain latin and сyrillic letters, numbers, whitespaces and special characters'],
        },
        deadline: {
            type: Date,
            required: [true, 'Deadline is required'],
            validate: {
                validator: function (value) {
                    return value instanceof Date && !isNaN(value);
                },
                message: 'Deadline must be a valid date'
            }
        },
        priority: {
            type: String,
            enum: ["High", "Medium", "Low"],
            default: "Medium",
        },
        // "pending" (невиконане)
        // "in progress" (почато)
        // "completed" (зроблено)
        // "defended" (захищено - якщо це стосується лабораторних, курсових тощо)
        // "overdue" (протерміновано)
        status: {
            type: String,
            enum: ['pending', 'in progress', 'completed', 'defended', 'overdue'],
            default: 'pending',
        },
        // in the future it is going to be id to category model
        category: {
            type: String,
            enum: ['mathematics', 'physics', 'chemistry', 'biology', 'other'],
            required: [true, 'Category is required'],
        },
        // ['homework', 'exam', 'project', 'lab', 'other']
        tags: {
            type: [String],
            default: [],
            validate: {
                validator: function (arr) {
                    // Перевіряємо, що це масив рядків
                    if (!Array.isArray(arr)) return false;

                    // Перевіряємо кожен тег
                    return arr.every(tag => {
                        return typeof tag === 'string' &&
                            tag.trim().length > 0 &&
                            tag.length <= 20 &&
                            /^[a-zA-ZА-Яа-яЇїІіЄєҐґ0-9\s_-]+$/.test(tag);
                    });
                },
                message: 'Tags must be an array of strings, each tag max 20 characters, containing only letters, numbers, spaces, hyphens and underscores'
            },
            maxlength: [10, 'Maximum 10 tags allowed']
        },
        // in the future it is going to be an array for photos, links, and documents
        attachments: {
            type: [String],
            default: [],
            validate: {
                validator: function (arr) {
                    // Перевіряємо, що це масив рядків
                    if (!Array.isArray(arr)) return false;

                    // Перевіряємо кожне вкладення
                    return arr.every(attachment => {
                        return typeof attachment === 'string' &&
                            attachment.trim().length > 0 &&
                            attachment.length <= 500; // Максимальна довжина для URL або шляху до файлу
                    });
                },
                message: 'Attachments must be an array of strings (URLs or file paths), each max 500 characters'
            },
            maxlength: [15, 'Maximum 15 attachments allowed']
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        shablon: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Shablon',
            required: true,
        },
        // notification: {
        //     type: [String],
        //     enum: ['email', 'push', 'both'],
        //     default: ['both'],
        //     validate: {
        //         validator: function (arr) {
        //             return arr.length === new Set(arr).size;
        //         },
        //         message: 'Notification types should not be duplicated'
        //     }
        // },
    },
    {
        timestamps: true,
    }
);

taskSchema.index({user: 1, deadline: 1});
taskSchema.index({user: 1, status: 1});
taskSchema.index({deadline: 1});
taskSchema.index({tags: 1});

// // Віртуальне поле для перевірки, чи протермінована задача
// taskSchema.virtual('isOverdue').get(function () {
//     return this.deadline < new Date() && this.status !== 'completed' && this.status !== 'defended';
// });
//
// // Метод для автоматичного оновлення статусу до "overdue"
// taskSchema.methods.updateOverdueStatus = function () {
//     if (this.isOverdue && this.status === 'pending') {
//         this.status = 'overdue';
//         return this.save();
//     }
//     return Promise.resolve(this);
// };
//
// // Middleware для автоматичного оновлення статусу при збереженні
// taskSchema.pre('save', function (next) {
//     if (this.isOverdue && (this.status === 'pending' || this.status === 'in progress')) {
//         this.status = 'overdue';
//     }
//     next();
// });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
