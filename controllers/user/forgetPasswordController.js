const userHelper=require("../../helpers/userHelper")
const User=require("../../models/userModel")
const argon=require('argon2')

let otp
let email

const submitMail=(req,res)=>{
    try{
        const mailError='Invalid user'
        if(req.session.mailError){
            res.render('user/forgetPassword/mailSubmit',{mailError})
        }else{
            res.render('user/forgetPassword/mailSubmit')
        }
    }catch(error){
        console.log(error)
    }
}

const submitMailPost=async(req,res)=>{
    try{
        console.log(req.body)
        email=req.body.email
        const userDetails=await User.findOne({email:email})

        if(userDetails){
            otp=await userHelper.verifyEmail(email)
            res.redirect('/otp')
        }else{
            req.session.mailError=true
            res.redirect("/forget_password")
        }
    }catch(error){
        console.log(error)
    }
}

const submitOtp=async(req,res)=>{
    try{
        let otpErr="Incorrect otp"

        if(req.session.otpErr){
            res.render('user/forgetPassword/submitOtp',{otpErr})
        }else{
            res.render('user/forgetPassword/submitOtp')
        }
    }catch(error){
        console.log(error)
    }
}

const submitOtpPost=(req,res)=>{
    let enteredOtp=req.body.otp

    if(enteredOtp === otp){
        res.json({success:true,redirectUrl:'/reset_password'})
    }else{
        req.session.otpErr=true

        otpError="incorrect otp"

        res.json({error:otpError})
    }
}



const resetPassword=async(req,res)=>{
    try{
        res.render("user/forgetPassword/resetPassword")
    }catch(error){
        console.log(error)
    }
}

const resetPasswordpost=async(req,res)=>{
    try{
        const newPassword=req.body.newPassword
        const hashedpassword=await userHelper.hashPassword(newPassword)
        await User.updateOne({email:email},{$set:{password:hashedpassword}})
        req.session.newPas=true
        res.redirect('/login')
    }catch(error){
        console.log(error)
    }
}

module.exports=
{
    submitMail,
    submitMailPost,
    submitOtp,
    submitOtpPost,
    resetPassword,
    resetPasswordpost
}