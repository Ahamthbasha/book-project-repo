const express=require("express")
const router=express.Router()
const passport=require('passport')
const userController=require('../controllers/user/userController')
const profileController=require('../controllers/user/profileController')
const addressController=require('../controllers/user/addressController')
const forgetPasswordController=require('../controllers/user/forgetPasswordController')
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

//product detail page
router.get("/product",userController.getProduct)
router.post("/search",userController.searchSortFilter)
router.get("/productview",userController.productDetails)

//profile management
router.get("/profile",logedin,isBlocked,profileController.loadProfile)
router.get("/edit_details",logedin,isBlocked,profileController.editDetails)
router.post("/update_details/:id",logedin,isBlocked,profileController.updateDetails)

//address management in user profile side
router.get('/adresses',logedin,isBlocked,addressController.manageAddress)
router.get('/add_new_adress',logedin,isBlocked,addressController.addNewAddress)
router.post('/add_new_adress',logedin,isBlocked,addressController.addNewAddressPost)
router.get('/edit_address/:id',logedin,isBlocked,addressController.editAddress)
router.post('/edit_address/:id',logedin,isBlocked,addressController.editAddressPost)
router.get('/delete_address/:id',logedin,isBlocked,addressController.deleteAddress)

//forgot password
router.get('/forget_password',isLogout,forgetPasswordController.submitMail)
router.post('/forget_password',forgetPasswordController.submitMailPost)

//forgot password otp page
router.get('/otp',isLogout,forgetPasswordController.submitOtp)
router.post('/otp',forgetPasswordController.submitOtpPost)


router.get("/reset_password",isLogout,forgetPasswordController.resetPassword)
router.post("/reset_password",forgetPasswordController.resetPasswordpost)

module.exports=router