const referralSchema = require("../../models/referralSchema")
const User=require("../../models/userModel")

const loadProfile=async(req,res)=>{
    try{
        const user=req.session.user
        const id=user._id
        const userData=await User.findById(id).lean()
        const referralData=await referralSchema.find({userId:id},{referralCode:1}).lean()
        console.log(referralData)
        res.render("user/about_me",{userData,referralData})
    }catch(error){
        console.log(error)
    }
}

const editDetails=async(req,res)=>{
    try{
        const userData=req.session.user
        res.render("user/edit_user",{userData})
    }catch(error){
        console.log(error)
    }
}


//changes
const updateDetails=async(req,res)=>{
    try{
        const id=req.params.id
        const updatedUser=await User.findByIdAndUpdate(id,{
            $set:{
              name:req.body.name,
              mobile:req.body.mobile,
              email:req.body.email,  
            }
        },{new:true})
        req.session.user=updatedUser
        res.redirect("/profile")
    }catch(error){
        console.log(error)
    }
}

module.exports=
{
    loadProfile,
    editDetails,
    updateDetails,
}