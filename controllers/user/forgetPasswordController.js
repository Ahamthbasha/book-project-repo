const userHelper=require("../../helpers/userHelper")
const User=require("../../models/userModel")

let otp
let email

const submitMail = (req, res) => {
    try {
        const mailError = 'Invalid user';
        // If there is an error in the session, display it
        if (req.session.mailError) {
            res.render('user/forgetPassword/mailSubmit', { mailError });
        } else {
            res.render('user/forgetPassword/mailSubmit');
        }
    } catch (error) {
        console.log(error);
    }
};

const submitMailPost = async (req, res) => {
    try {
        const email = req.body.email;
        const userDetails = await User.findOne({ email: email });

        if (userDetails) {
            // Store the email in the session globally for further use
            req.session.userEmail = email;

            // Generate OTP and send email
            const { otp, timestamp } = await userHelper.verifyEmail(email, req);
            // Store OTP and timestamp in session
            req.session.otp = otp;
            req.session.otpTimestamp = timestamp;

            return res.redirect('/otp');  // Redirect to OTP page
        } else {
            req.session.mailError = true;
            return res.redirect("/forget_password");  // Invalid email, redirect back to the form
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'An error occurred while processing your request.' });
    }
};

const submitOtp = (req, res) => {
    try {
        let otpErr = "Incorrect OTP";

        // If there's an OTP error stored in the session, display it
        if (req.session.otpErr) {
            res.render('user/forgetPassword/submitOtp', { otpErr });
        } else {
            res.render('user/forgetPassword/submitOtp');
        }
    } catch (error) {
        console.log(error);
    }
};

const submitOtpPost = (req, res) => {
    const enteredOtp = req.body.otp;
    const storedOtp = req.session.otp;  // Get OTP from session

    // Validate OTP and check if it's expired
    if (enteredOtp === storedOtp && userHelper.isOtpValid(req)) {
        // OTP is correct and valid (within 60 seconds)
        req.session.userEmail = req.session.userEmail || req.body.email;  // Store email in session if not already done
        return res.json({ success: true, redirectUrl: '/reset_password' }); // Redirect to reset password page
    } else {
        // OTP is incorrect or expired
        req.session.otpErr = true;
        const otpError = "Incorrect or expired OTP";
        return res.json({ error: otpError });
    }
};

const resendOtp = async (req, res) => {
    try {
        console.log('Session data:', req.session);  // Check session data
        const email = req.session.userEmail;  // Get email from session

        if (!email) {
            return res.status(400).json({ error: 'No email found in session. Please submit your email first.' });
        }

        // Call the verifyEmail function to resend OTP
        const { otp, timestamp } = await userHelper.verifyEmail(email, req);

        // Optionally store the new OTP and timestamp in the session again
        req.session.otp = otp;
        req.session.otpTimestamp = timestamp;

        return res.json({ success: true, message: 'OTP resent successfully' });
    } catch (error) {
        console.log('Error resending OTP:', error);
        return res.status(500).json({ error: 'Error resending OTP. Please try again later.' });
    }
};

const resetPassword = (req, res) => {
    try {
        // Ensure the email is available in session
        const userEmail = req.session.userEmail;
        
        if (!userEmail) {
            // If no email is found in session, redirect to forget password page
            return res.redirect("/forget_password");
        }

        // Render the reset password page if session is valid
        res.render("user/forgetPassword/resetPassword");
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'An error occurred while rendering the reset password page' });
    }
};

const resetPasswordpost = async (req, res) => {
    try {
        const userEmail = req.session.userEmail;

        // Check if email exists in session
        if (!userEmail) {
            return res.redirect("/forget_password");
        }

        // Password reset logic
        const newPassword = req.body.newPassword;
        const hashedPassword = await userHelper.hashPassword(newPassword);

        // Update password in the database
        await User.updateOne({ email: userEmail }, { $set: { password: hashedPassword } });

        // Clear session after successful reset
        delete req.session.userEmail;  // Remove email from session
        delete req.session.otp;         // Optionally remove OTP as well
        req.session.newPas = true;     // Optional: Indicate password reset success

        // Redirect to login page
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
    resendOtp,
    resetPassword,
    resetPasswordpost,
}

