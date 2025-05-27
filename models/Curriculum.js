const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Curriculum:
 *       type: object
 *       required:
 *         - name
 *         - universityName
 *         - programName
 *         - user
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the curriculum.
 *           example: 652a970a7f1a3b9d8e1c2d3f
 *         name:
 *           type: string
 *           minLength: 5
 *           maxLength: 50
 *           description: Name of the curriculum.
 *           example: "6 semester of computer science"
 *         description:
 *           type: string
 *           maxLength: 200
 *           description: Optional description of the curriculum.
 *           example: "This curriculum covers advanced topics in software engineering."
 *         universityName:
 *           type: string
 *           minLength: 3
 *           maxLength: 60
 *           description: The name of the university offering the curriculum.
 *           example: "National Technical University of Ukraine"
 *         programName:
 *           type: string
 *           minLength: 2
 *           maxLength: 60
 *           description: The name of the specific program.
 *           example: "Software Engineering"
 *         isPublic:
 *           type: boolean
 *           description: Indicates if the curriculum is publicly visible.
 *           default: false
 *           example: false
 *         isClosed:
 *           type: boolean
 *           description: Indicates if the curriculum is closed for new entries/changes.
 *           default: false
 *           example: false
 *         user:
 *           type: string
 *           description: The ID of the user who owns this curriculum.
 *           readOnly: true
 *           example: 652a970a7f1a3b9d8e1c2d3a
 *         subjects:
 *           type: array
 *           items:
 *             type: string
 *             minLength: 1
 *             maxLength: 100
 *           description: A list of subjects included in the curriculum.
 *           example: ["Database Systems", "Operating Systems", "Networking"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the curriculum was created.
 *           readOnly: true
 *           example: 2023-01-15T10:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the curriculum was last updated.
 *           readOnly: true
 *           example: 2023-01-15T11:00:00.000Z
 *     CreateCurriculumInput:
 *       type: object
 *       required:
 *         - name
 *         - universityName
 *         - programName
 *       properties:
 *         name:
 *           type: string
 *           minLength: 5
 *           maxLength: 50
 *           description: Name of the curriculum.
 *           example: "New Software Development Plan"
 *         description:
 *           type: string
 *           maxLength: 200
 *           description: Optional description of the curriculum.
 *           example: "Detailed plan for advanced software development."
 *         universityName:
 *           type: string
 *           minLength: 3
 *           maxLength: 60
 *           description: The name of the university offering the curriculum.
 *           example: "Kyiv Polytechnic Institute"
 *         programName:
 *           type: string
 *           minLength: 2
 *           maxLength: 60
 *           description: The name of the specific program.
 *           example: "Computer Science"
 *         isPublic:
 *           type: boolean
 *           description: Indicates if the curriculum should be publicly visible upon creation.
 *           default: false
 *           example: true
 *         subjects:
 *           type: array
 *           items:
 *             type: string
 *           description: Initial list of subjects for the curriculum.
 *           example: ["Advanced Algorithms", "Machine Learning"]
 *     UpdateCurriculumInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 5
 *           maxLength: 50
 *           description: Updated name of the curriculum.
 *           example: "Revised 7th Semester Plan"
 *         description:
 *           type: string
 *           maxLength: 200
 *           description: Updated description of the curriculum.
 *           example: "Updated to include new elective courses."
 *         universityName:
 *           type: string
 *           minLength: 3
 *           maxLength: 60
 *           description: Updated university name.
 *           example: "Lviv Polytechnic National University"
 *         programName:
 *           type: string
 *           minLength: 2
 *           maxLength: 60
 *           description: Updated program name.
 *           example: "Cybersecurity"
 *         isPublic:
 *           type: boolean
 *           description: Update public visibility status.
 *           example: false
 *         isClosed:
 *           type: boolean
 *           description: Update closed status.
 *           example: true
 *         subjects:
 *           type: array
 *           items:
 *             type: string
 *           description: Updated list of subjects for the curriculum.
 *           example: ["Cloud Computing", "DevOps Principles"]
 */
const curriculumSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [5, 'Name must be at least 5 characters long'],
            maxlength: [50, 'Name must be at most 50 characters long'],
            match: [/^[a-zA-ZА-Яа-яЇїІіЄєҐґ0-9\s.,!?'"+-_()]+$/, 'Name can only contain latin and сyrillic letters, numbers, whitespaces and special characters'],
        },
        description: {
            type: String,
            maxlength: [200, 'Description must be at most 200 characters long'],
            match: [/^[a-zA-ZА-Яа-яЇїІіЄєҐґ0-9\s.,!?'"+-_()]+$/, 'Description can only contain latin and сyrillic letters, numbers, whitespaces and special characters'],
        },
        universityName: {
            type: String,
            required: [true, 'University name is required'],
            trim: true,
            minlength: [3, 'University name must be at least 3 characters long'],
            maxlength: [60, 'University name must be at most 60 characters long'],
            match: [/^[a-zA-ZА-Яа-яЇїІіЄєҐґ0-9\s.,!?'"+-_()]+$/, 'University name can only contain latin and сyrillic letters, numbers, whitespaces and special characters'],
        },
        programName: {
            type: String,
            required: [true, 'Program name is required'],
            trim: true,
            minlength: [2, 'Program name must be at least 2 characters long'],
            maxlength: [60, 'Program name must be at most 60 characters long'],
            match: [/^[a-zA-ZА-Яа-яЇїІіЄєҐґ0-9\s.,!?'"+-_()]+$/, 'Program name can only contain latin and сyrillic letters, numbers, whitespaces and special characters'],
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
        isClosed: {
            type: Boolean,
            default: false,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        subjects: {
            type: [
                {
                    type: String,
                    match: [/^[a-zA-ZА-Яа-яЇїІіЄєҐґ0-9\s.,!?'"+-_()]+$/, 'Subject can only contain latin and сyrillic letters, numbers, common punctuation, and some symbols'],
                    trim: true,
                    minlength: [1, 'Subject cannot be empty'],
                    maxlength: [100, 'Subject name must be at most 100 characters long'],
                },
            ],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

curriculumSchema.index({user: 1});
curriculumSchema.index({user: 1, isClosed: 1});
curriculumSchema.index({isPublic: 1});
curriculumSchema.index({isClosed: 1});
curriculumSchema.index({name: 1});

const Curriculum = mongoose.model('Curriculum', curriculumSchema);

module.exports = Curriculum;
