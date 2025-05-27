const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the user.
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 30
 *           description: Unique username of the user.
 *         email:
 *           type: string
 *           format: email
 *           description: Unique email address of the user.
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *           description: Role of the user.
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Indicates if the user account is active.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the user was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the user was last updated.
 *     RegisterUserInput:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 30
 *           description: Desired username.
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address.
 *         password:
 *           type: string
 *           minLength: 8
 *           description: User's password (must contain uppercase, lowercase, number, and special character).
 *     LoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address.
 *         password:
 *           type: string
 *           description: User's password.
 *     UpdateUserProfileInput:
 *       type: object
 *       required:
 *         - username
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 30
 *           description: New username for the user.
 *     UpdateUserRoleInput:
 *       type: object
 *       required:
 *         - role
 *       properties:
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: New role for the user.
 *     DeleteUserConfirmation:
 *       type: object
 *       required:
 *         - password
 *       properties:
 *         password:
 *           type: string
 *           description: User's password for deletion confirmation.
 *     AuthSuccess:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         accessToken:
 *           type: string
 *           description: JWT Access Token.
 *     UserListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         count:
 *           type: integer
 *           description: Number of users on the current page.
 *         total:
 *           type: integer
 *           description: Total number of users.
 *         page:
 *           type: integer
 *           description: Current page number.
 *         limit:
 *           type: integer
 *           description: Number of items per page.
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *     MessageResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *     UserMessageResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *     Error:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 */
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
                'Please enter a valid email address [example@gmail.com]'
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
        },
        refreshTokens: [
            {
                token: {
                    type: String,
                    required: true,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    },
);

userSchema.index({username: 1, email: 1});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({id: this._id, role: this.role}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
