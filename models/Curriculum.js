const mongoose = require('mongoose');

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
