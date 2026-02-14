const sgMail = require('@sendgrid/mail')
const argon2 = require('argon2')

let otp
let otpTimestamp

const verifyEmail = async (email, req) => {
    try {
        otp = generateOtp(); // Generate an OTP
        otpTimestamp = Date.now(); // Store current timestamp

        // Store OTP and timestamp in session
        req.session.otp = otp; 
        req.session.otpTimestamp = otpTimestamp; 

        // Set SendGrid API key
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
            to: email,
            from: process.env.SENDGRID_VERIFIED_SENDER, // Use your verified sender email
            subject: "Email Verification OTP",
            text: `Your OTP for email verification is: ${otp}`,
            html: `<strong>Your OTP for email verification is: ${otp}</strong>`, // HTML version
        };

        // Send email using SendGrid
        await sgMail.send(msg);
        
        console.log("Email has been sent successfully");
        console.log("otp", otp); // Log generated OTP
        
        return { otp, timestamp: otpTimestamp }; // Return both OTP and timestamp
        
    } catch (error) {
        console.error("SendGrid Error:", error);
        
        // More detailed error logging
        if (error.response) {
            console.error("SendGrid Response Error:", error.response.body);
        }
        
        throw error; // Re-throw the error for handling in the calling function
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
