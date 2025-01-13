const nodemailer = require('nodemailer')
const argon2 = require('argon2')

//Email verification

// const verifyEmail = async(email)=>{
//     try {
//         otp = generateOtp()

//        const trasporter =  nodemailer.createTransport({
//             host: 'smtp.gmail.com',
//             port: 587,
//             secure: false,
//             requireTLS: true,
//             auth:{
//                 user: process.env.USER_EMAIL ,
//                 pass: process.env.USER_PASSWORD
//             }
//         })
        
//         const mailoptions = {
//                 from: process.env.USER_EMAIL,
//                 to: email,
//                 subject: "For verify mail",
//                 text: otp
//         }

//         trasporter.sendMail(mailoptions, (error, info)=>{
//           if(error){
//             console.log(error);
//           }else{
//             console.log("Email has been sent");
//           }
//         })

//         console.log("otp",otp)
//         return otp
        
//     } catch (error) {
//         console.log(error);
//     }
// }


// //gennerate otp

// const generateOtp = ()=>{
//      otp = `${Math.floor(1000 + Math.random() * 9000)}`
//     return otp
// }

// //password hashing

// const hashPassword = async (pasword) => {
//     try {
//         const passwordHash = await argon2.hash(pasword)
//         return passwordHash
//     } catch (error) {
//         console.log(error);
        
//     }
// }
// module.exports = {verifyEmail, generateOtp, hashPassword}

//2-01-2025
let otp
let otpTimestamp

// const verifyEmail = async(email)=>{
//     try {
//     otp = generateOtp()
//     otpTimestamp=Date.now()
//        const trasporter =  nodemailer.createTransport({
//             host: 'smtp.gmail.com',
//             port: 587,
//             secure: false,
//             requireTLS: true,
//             auth:{
//                 user: process.env.USER_EMAIL ,
//                 pass: process.env.USER_PASSWORD
//             }
//         })
        
//         const mailoptions = {
//                 from: process.env.USER_EMAIL,
//                 to: email,
//                 subject: "For verify mail",
//                 text: otp
//         }

//         trasporter.sendMail(mailoptions, (error, info)=>{
//           if(error){
//             console.log(error);
//           }else{
//             console.log("Email has been sent");
//           }
//         })

//         console.log("otp",otp)
//         return {otp,timestamp:otpTimestamp}
        
//     } catch (error) {
//         console.log(error);
//     }
// }


//gennerate otp

// const verifyEmail = async (email, req) => {
//     try {
//         otp = generateOtp(); // Generate an OTP
//         otpTimestamp = Date.now(); // Store current timestamp

//         // Store OTP in session
//         req.session.otp = otp; // Store OTP in session
//         req.session.otpTimestamp = otpTimestamp; // Store timestamp in session

//         const transporter = nodemailer.createTransport({
//             host: 'smtp.gmail.com',
//             port: 587,
//             secure: false,
//             requireTLS: true,
//             auth: {
//                 user: process.env.USER_EMAIL,
//                 pass: process.env.USER_PASSWORD
//             }
//         });

//         const mailOptions = {
//             from: process.env.USER_EMAIL,
//             to: email,
//             subject: "For verify mail",
//             text: otp // Send OTP in email body
//         };

//         transporter.sendMail(mailOptions, (error, info) => {
//             if (error) {
//                 console.log(error);
//             } else {
//                 console.log("Email has been sent");
//             }
//         });

//         console.log("otp", otp); // Log generated OTP
//         return { otp, timestamp: otpTimestamp }; // Return both OTP and timestamp
        
//     } catch (error) {
//         console.log(error);
//     }
// }


// const generateOtp = ()=>{
//      otp = `${Math.floor(1000 + Math.random() * 9000)}`
//     return otp
// }

// //password hashing

// const hashPassword = async (pasword) => {
//     try {
//         const passwordHash = await argon2.hash(pasword)
//         return passwordHash
//     } catch (error) {
//         console.log(error);
        
//     }
// }

// module.exports = {verifyEmail, generateOtp, hashPassword}

const verifyEmail = async (email, req) => {
    try {
        otp = generateOtp(); // Generate an OTP
        otpTimestamp = Date.now(); // Store current timestamp

        // Store OTP and timestamp in session
        req.session.otp = otp; 
        req.session.otpTimestamp = otpTimestamp; 

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.USER_EMAIL,
                pass: process.env.USER_PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.USER_EMAIL,
            to: email,
            subject: "For verify mail",
            text: otp // Send OTP in email body
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log("Email has been sent");
            }
        });

        console.log("otp", otp); // Log generated OTP
        return { otp, timestamp: otpTimestamp }; // Return both OTP and timestamp
        
    } catch (error) {
        console.log(error);
    }
};

// Generate OTP
const generateOtp = () => {
    otp = `${Math.floor(1000 + Math.random() * 9000)}`;
    return otp;
};

// Check OTP validity (within 60 seconds)
const isOtpValid = (req) => {
    const currentTime = Date.now();
    const timeDifference = currentTime - req.session.otpTimestamp; // Difference in milliseconds
    const expiryTime = 60000; // 60 seconds in milliseconds

    return timeDifference <= expiryTime; // Return true if OTP is valid within 60 seconds
};

// Password hashing
const hashPassword = async (password) => {
    try {
        const passwordHash = await argon2.hash(password);
        return passwordHash;
    } catch (error) {
        console.log(error);
    }
};

module.exports = { verifyEmail, generateOtp, hashPassword, isOtpValid };
