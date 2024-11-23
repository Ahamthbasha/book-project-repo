const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        //changes
        // unique:true,
    },

    mobile:{
        type: Number,
        required: true
    },
    password:{
        type: String,
        required: false
    }, 

    isVerified:{
        type: Boolean,
        required: true
    },

    isBlocked:{
        type: Boolean,
        required: true,
    },
    // //changes
    // googleId: {
    //     type: String,
    //     unique: true, // Google ID must be unique
    //     sparse: true, // Allow for null or missing values
    // },
}, { timestamps: true })




module.exports = mongoose.model('User', userSchema)