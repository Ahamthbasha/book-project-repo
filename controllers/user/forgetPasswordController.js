const userHelper=require("../../helpers/userHelper")
const User=require("../../models/userModel")
// const argon=require('argon2')

let otp
let email

const submitMail=(req,res)=>{
    try{
        const mailError='Invalid user'
        //if the mail has error it store the error in the session
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


// const submitOtpPost=(req,res)=>{
//     let enteredOtp=req.body.otp

//     if(enteredOtp === otp){
        
//         res.json({success:true,redirectUrl:'/reset_password'})
//     }else{
//         req.session.otpErr=true

//         otpError="incorrect otp"

//         res.json({error:otpError})
//     }
// }
//changes
const submitOtpPost = (req, res) => {
    let enteredOtp = req.body.otp;

    if (enteredOtp === otp) {
        // Store the email in session after OTP verification
        req.session.userEmail = email;
        res.json({ success: true, redirectUrl: '/reset_password' });
    } else {
        req.session.otpErr = true;
        otpError = "incorrect otp";
        res.json({ error: otpError });
    }
};

//reset page will be shown

const resetPassword=async(req,res)=>{
    try{
        res.render("user/forgetPassword/resetPassword")
    }catch(error){
        console.log(error)
    }
}



// const resetPasswordpost = async (req, res) => {
//     try {
//         const email = req.body.email; 
//         const newPassword = req.body.newPassword;
//         console.log('New Password:', newPassword); 
//         const hashedPassword = await userHelper.hashPassword(newPassword);
//         console.log('Hashed Password:', hashedPassword);
        
//         await User.updateOne({ email: email }, { $set: { password: hashedPassword } });

//         req.session.newPas = true;
//         res.redirect('/login');
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: 'An error occurred while resetting the password' });
//     }
// };

const resetPasswordpost = async (req, res) => {
    try {
        // Retrieve email from session (it was stored after OTP verification)
        const userEmail = req.session.userEmail; 

        // If no email is found in session, redirect to forget password page (for security)
        if (!userEmail) {
            return res.redirect("/forget_password");
        }

        // Password reset logic
        const newPassword = req.body.newPassword;
        const hashedPassword = await userHelper.hashPassword(newPassword);
        
        // Update password in the database
        await User.updateOne({ email: userEmail }, { $set: { password: hashedPassword } });

        // Optional: Clear OTP session or any sensitive data
        delete req.session.userEmail;

        req.session.newPas = true;
        res.redirect('/login');
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'An error occurred while resetting the password' });
    }
};

module.exports=
{
    submitMail,
    submitMailPost,
    submitOtp,
    submitOtpPost,
    resetPassword,
    resetPasswordpost,
}