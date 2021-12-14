const mongoose = require('mongoose')

const urlSchema = new mongoose.Schema({
    urlCode: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    longUrl: {
        type: String,
        required: "Long URL is required",

    },

    shortUrl: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    }



}, { timestamps: true })

module.exports = mongoose.model('url', urlSchema)