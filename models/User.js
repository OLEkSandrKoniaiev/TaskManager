const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            lowercase: true,
            unique: true,
            trim: true,
            match: [/^[a-zA-ZА-Яа-яЇїІіЄєҐґ0-9\s\-_.]+$/, 'Username can only contain Latin/Cyrillic letters, numbers, spaces, hyphens, underscores, and dots'],
            minlength: [3, 'Username must be at least 3 characters long'],
            maxlength: [30, 'Username cannot be more than 30 characters long'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            unique: true,
            trim: true,
            match: [
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                'Please enter a valid email address'
            ],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters long'],
            match: [
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
                'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
            ],
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        isActive: {
            type: Boolean,
            default: true,
        }
    },
    {
        timestamps: true,
    },
);

userSchema.index({username: 1, email: 1});

// Have hashed password before saving
userSchema.pre('save', async function (next) {
    // Check if a password field is modified or if it's a new document
    if (!this.isModified('password')) {
        return next(); // Corrected to return next()
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method for checking password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method for generating JWT token
userSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({id: this._id, role: this.role}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
