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
    wallet:{
        type:Number,
        default:0
    },
    history:{
        type:Array,
        default:[]
    },
}, { timestamps: true })




module.exports = mongoose.model('User', userSchema)