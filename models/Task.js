const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - name
 *         - deadline
 *         - subject
 *         - category
 *         - curriculum
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the task.
 *         name:
 *           type: string
 *           minLength: 5
 *           maxLength: 50
 *           description: Name of the task.
 *         description:
 *           type: string
 *           minLength: 5
 *           maxLength: 5000
 *           description: Optional detailed description of the task.
 *         deadline:
 *           type: string
 *           format: date-time
 *           description: The deadline for the task.
 *         priority:
 *           type: string
 *           enum: [High, Medium, Low]
 *           default: Medium
 *           description: Priority level of the task.
 *         status:
 *           type: string
 *           enum: [pending, in progress, completed, defended, overdue]
 *           default: pending
 *           description: Current status of the task.
 *         subject:
 *           type: string
 *           description: The subject this task belongs to (e.g., mathematics, physics). Must be defined in the associated curriculum.
 *         category:
 *           type: string
 *           enum: [homework, exam, project, lab, other]
 *           description: Category of the task (e.g., homework, exam).
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *             maxLength: 500
 *           maxItems: 15
 *           description: Array of URLs or paths to attachments.
 *         curriculum:
 *           type: string
 *           description: The ID of the curriculum this task belongs to.
 *           readOnly: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the task was created.
 *           readOnly: true
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the task was last updated.
 *           readOnly: true
 *     CreateTaskInput:
 *       type: object
 *       required:
 *         - name
 *         - deadline
 *         - subject
 *         - category
 *         - curriculum
 *       properties:
 *         name:
 *           type: string
 *           minLength: 5
 *           maxLength: 50
 *           description: Name of the task.
 *         description:
 *           type: string
 *           minLength: 5
 *           maxLength: 5000
 *           description: Optional detailed description of the task.
 *         deadline:
 *           type: string
 *           format: date-time
 *           description: The deadline for the task.
 *         priority:
 *           type: string
 *           enum: [High, Medium, Low]
 *           default: Medium
 *           description: Priority level of the task.
 *         status:
 *           type: string
 *           enum: [pending, in progress, completed, defended, overdue]
 *           default: pending
 *           description: Initial status of the task.
 *         subject:
 *           type: string
 *           description: The subject this task belongs to.
 *         category:
 *           type: string
 *           enum: [homework, exam, project, lab, other]
 *           description: Category of the task.
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of URLs or paths to attachments.
 *         curriculum:
 *           type: string
 *           description: The ID of the curriculum this task belongs to.
 *     UpdateTaskInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 5
 *           maxLength: 50
 *           description: Updated name of the task.
 *         description:
 *           type: string
 *           minLength: 5
 *           maxLength: 5000
 *           description: Updated detailed description of the task.
 *         deadline:
 *           type: string
 *           format: date-time
 *           description: Updated deadline for the task.
 *         priority:
 *           type: string
 *           enum: [High, Medium, Low]
 *           description: Updated priority level of the task.
 *         status:
 *           type: string
 *           enum: [pending, in progress, completed, defended, overdue]
 *           description: Updated status of the task.
 *         subject:
 *           type: string
 *           description: Updated subject this task belongs to.
 *         category:
 *           type: string
 *           enum: [homework, exam, project, lab, other]
 *           description: Updated category of the task.
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *           description: Updated array of URLs or paths to attachments.
 *         curriculum:
 *           type: string
 *           description: Updated ID of the curriculum this task belongs to.
 */
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
                        this.validatorMessage = 'Attachments must be an array.';
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
