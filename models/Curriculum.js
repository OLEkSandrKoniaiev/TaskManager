const mongoose = require('mongoose');

const curriculumSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [5, 'Name must be at least 5 characters long'],
            maxlength: [50, 'Name must be at most 50 characters long'],
            match: [/^[a-zA-ZА-Яа-яЇїІіЄєҐґ0-9\s\W]+$/, 'Name can only contain latin and сyrillic letters, numbers, whitespaces and special characters'],
        },
        description: {
            type: String,
            maxlength: [200, 'Description must be at most 200 characters long'],
            match: [/^[a-zA-ZА-Яа-яЇїІіЄєҐґ0-9\s\W]+$/, 'Description can only contain latin and сyrillic letters, numbers, whitespaces and special characters'],
        },
        universityName: {
            type: String,
            required: [true, 'University name is required'],
            trim: true,
            minlength: [3, 'University name must be at least 3 characters long'],
            maxlength: [60, 'University name must be at most 60 characters long'],
            match: [/^[a-zA-ZА-Яа-яЇїІіЄєҐґ0-9\s\W]+$/, 'University name can only contain latin and сyrillic letters, numbers, whitespaces and special characters'],
        },
        programName: {
            type: String,
            required: [true, 'Program name is required'],
            trim: true,
            minlength: [2, 'Program name must be at least 2 characters long'],
            maxlength: [60, 'Program name must be at most 60 characters long'],
            match: [/^[a-zA-ZА-Яа-яЇїІіЄєҐґ0-9\s\W]+$/, 'Program name can only contain latin and сyrillic letters, numbers, whitespaces and special characters'],
        },
        isPublic: {
            type: Boolean,
            default: false,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        fields: {
            type: [
                {
                    type: String,
                    match: [/^[a-zA-ZА-Яа-яЇїІіЄєҐґ0-9\s.,?!'"+-_()]+$/, 'Field can only contain latin and сyrillic letters, numbers, common punctuation, and some symbols'],
                },
            ],
            default: [],
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.every(item => typeof item === 'string'),
                message: 'Fields must be an array of strings',
            },
            required: [true, 'Fields are required'],
        },
    },
    {
        timestamps: true,
    }
);

const Curriculum = mongoose.model('Curriculum', curriculumSchema);

module.exports = Curriculum;
