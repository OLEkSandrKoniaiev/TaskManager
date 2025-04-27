const mongoose = require('mongoose');

const shablonSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
        },
        description: {
            type: String,
        },
        fields: {
            type: Array,
            default: [],
        }
    },
    {
        timestamps: true,
    }
);

const Shablon = mongoose.model('Shablon', shablonSchema);

module.exports = Shablon;
