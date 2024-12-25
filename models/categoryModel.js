const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
    category: {
        type: String,
        required: true
    },
    imageUrl:{
        type: String,
        required: true
    },
    isListed:{
        type:Boolean,
        default:true
    },
    bestSelling:{
        type:Number,
        default:0
    }
},{timestamps:true})


// const Category = mongoose.model('category', categorySchema); 

//change i made 25-12-2024
const Category = mongoose.model('Category', categorySchema);

module.exports = Category; 

