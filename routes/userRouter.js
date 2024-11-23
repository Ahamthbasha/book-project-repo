const express=require("express")
const router=express.Router()
const passport=require('passport')
const userController=require('../controllers/user/userController')
const auth=require('../middlewares/userAuth')
const { isLogin, isLogout, isBlocked, logedin } = auth

require('../middlewares/googleAuth')


router.get('/',userController.loadHome)

//signup
router.get('/signup', isLogout, userController.usersignup)
router.post('/signup', isLogout,userController.doSignup)

//otp
router.get('/get_otp', isLogout, userController.getOtp)
router.post('/submit_otp',isLogout, userController.submitOtp)
router.get('/resend_otp', isLogout,userController.resendOtp)

//google authentication
router.get('/auth/google',  passport.authenticate('google', { scope: ['email', 'profile'] }))
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), userController.googleCallback)

//login
router.get('/login', isLogout, userController.userLogin)
router.post('/', userController.doLogin)
router.get('/logout', userController.doLogout)

module.exports=router