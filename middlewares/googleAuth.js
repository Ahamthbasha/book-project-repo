const sgMail = require('@sendgrid/mail')
const argon2 = require('argon2')

// Set your SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

let otp
let otpTimestamp

const verifyEmail = async (email, req) => {
    try {
        otp = generateOtp(); // Generate an OTP
        otpTimestamp = Date.now(); // Store current timestamp

        // Store OTP and timestamp in session
        req.session.otp = otp; 
        req.session.otpTimestamp = otpTimestamp; 

        const msg = {
            to: email,
            from: process.env.SENDGRID_VERIFIED_SENDER, // Must be a verified sender in SendGrid
            subject: 'Email Verification OTP',
            text: `Your verification code is: ${otp}`,
            html: `<p>Your verification code is: <strong>${otp}</strong></p>
                   <p>This code will expire in 60 seconds.</p>`
        };

        await sgMail.send(msg);
        console.log("Email has been sent");
        console.log("otp", otp); // Log generated OTP
        
        return { otp, timestamp: otpTimestamp }; // Return both OTP and timestamp
        
    } catch (error) {
        console.error('SendGrid Error:', error);
        if (error.response) {
            console.error('SendGrid Error Details:', error.response.body);
        }
        throw error;
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