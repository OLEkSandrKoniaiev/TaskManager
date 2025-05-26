const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minLength: [5, 'Name must be at least 5 characters long'],
            maxLength: [50, 'Name must be at most 50 characters long'],
            match: [/^[a-zA-ZА-Яа-яЇїІіЄєҐґ0-9\s.,!?'"+-_()]+$/, 'Name can only contain latin and сyrillic letters, numbers, whitespaces and special characters'],
        },
        description: {
            type: String,
            required: false,
            trim: true,
            minLength: [5, 'Description must be at least 5 characters long'],
            maxLength: [5000, 'Description must be at most 5000 characters long'],
            match: [/^[a-zA-ZА-Яа-яЇїІіЄєҐґ0-9\s.,!?'"+-_()]+$/, 'Description can only contain latin and сyrillic letters, numbers, whitespaces and special characters'],
        },
        deadline: {
            type: Date,
            required: [true, 'Deadline is required'],
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
        // mathematics, physics, chemistry, biology, other
        subject: {
            type: String,
            required: [true, 'Subject is required'],
        },
        // homework, exam, project, lab, other
        category: {
            type: String,
            enum: ['homework', 'exam', 'project', 'lab', 'other'],
            required: [true, 'Category is required'],
        },
        attachments: {
            type: [String],
            default: [],
            validate: {
                validator: function (arr) {
                    if (!Array.isArray(arr)) {
                        this.validatorMessage = 'Attachments must be an array.'; // Зберігаємо повідомлення в контексті валідатора
                        return false;
                    }
                    if (arr.length > 15) {
                        this.validatorMessage = 'Maximum 15 attachments allowed.';
                        return false;
                    }
                    for (const attachment of arr) {
                        if (typeof attachment !== 'string') {
                            this.validatorMessage = 'Each attachment must be a string.';
                            return false;
                        }
                        const trimmedAttachment = attachment.trim();
                        if (trimmedAttachment.length === 0) {
                            this.validatorMessage = 'Attachment cannot be empty.';
                            return false;
                        }
                        if (trimmedAttachment.length > 500) {
                            this.validatorMessage = 'Attachment URL/path must be at most 500 characters.';
                            return false;
                        }
                    }
                    return true;
                },
                message: props => props.instance.validatorMessage || 'Invalid attachments array format or content.'
            }
        },
        curriculum: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Curriculum',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

taskSchema.index({curriculum: 1, deadline: 1});
taskSchema.index({curriculum: 1, status: 1});
taskSchema.index({deadline: 1});
taskSchema.index({subject: 1});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
