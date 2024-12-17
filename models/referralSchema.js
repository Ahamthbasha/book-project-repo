// const mongoose=require("mongoose")

// const referralSchema=new mongoose.Schema({
//     userId:{
//         type:mongoose.Schema.Types.ObjectId,
//         ref:'User',
//         required:true
//     },
//     referralCode:{
//         type:String
//     },
//     redeemedUsers:[
//         {
//             type:mongoose.Schema.Types.ObjectId,
//             ref:'User',
//             required:true
//         }
//     ]
// })
// module.exports=mongoose.model('Referral',referralSchema)

const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    referralCode: {
        type: String,
        required: true,  // Assuming you want this to be a required field
        unique: true  // Ensures the referral code is unique
    },
});

module.exports = mongoose.model('Referral', referralSchema);
