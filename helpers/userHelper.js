const nodemailer = require('nodemailer')
const argon2 = require('argon2')

//Email verification

const verifyEmail = async(email)=>{
    try {
        otp = generateOtp()

       const trasporter =  nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth:{
                user: process.env.USER_EMAIL ,
                pass: process.env.USER_PASSWORD
            }
        })
        
        const mailoptions = {
                from: process.env.USER_EMAIL,
                to: email,
                subject: "For verify mail",
                text: otp
        }

        trasporter.sendMail(mailoptions, (error, info)=>{
          if(error){
            console.log(error);
          }else{
            console.log("Email has been sent");
          }
        })

        console.log("otp",otp)
        return otp
        
    } catch (error) {
        console.log(error);
    }
}


//gennerate otp

const generateOtp = ()=>{
     otp = `${Math.floor(1000 + Math.random() * 9000)}`
    return otp
}

//password hashing

const hashPassword = async (pasword) => {
    try {
        const passwordHash = await argon2.hash(pasword)
        return passwordHash
    } catch (error) {
        console.log(error);
        
    }
}

module.exports = {verifyEmail, generateOtp, hashPassword}