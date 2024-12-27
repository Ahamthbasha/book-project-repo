const express=require("express")
const router=express.Router()
const passport=require('passport')
const userController=require('../controllers/user/userController')
const profileController=require('../controllers/user/profileController')
const addressController=require('../controllers/user/addressController')
const forgetPasswordController=require('../controllers/user/forgetPasswordController')
const orderController=require('../controllers/user/orderController')
const cartController=require('../controllers/user/cartController')
const checkoutController=require('../controllers/user/checkoutController')
const productController=require('../controllers/user/productController')
const wishlistController=require('../controllers/user/wishlistController')
const walletController=require('../controllers/user/walletController')
const auth=require('../middlewares/userAuth')
const { isLogin, isLogout, isBlocked, logedin } = auth

require('../middlewares/googleAuth')


router.get('/',isBlocked,userController.loadHome)
router.get("/home",userController.loadHome)
//signup
router.get('/signup', isLogout, userController.usersignup)
router.post('/signup', isLogout,userController.doSignup)

//referals

router.get('/referals',isLogout,userController.loadReferalPage)
router.post('/verifyReferalCode',userController.verifyReferelCode)

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
router.get("/product",productController.getProduct)
router.post("/search",productController.searchSortFilter)
router.get("/productview",productController.productView)
//router.get('/productDetails/:id',productDetails)

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


//forgot password here we reset the password page
router.get("/reset_password",isLogout,forgetPasswordController.resetPassword)
router.post("/reset_password",forgetPasswordController.resetPasswordpost)


//Order page
router.get('/myOrders',logedin,isBlocked,orderController.my_Orders)
router.get("/orderDetails/:id",logedin,isBlocked,orderController.orderDetails)
router.put('/cancel-order/:id',logedin,isBlocked,orderController.cancelOrder)
router.put('/return-order/:id',logedin,isBlocked,orderController.returnOrder)
router.put('/cancel-one-product',logedin,isBlocked,orderController.cancelOneProduct)
router.put('/return-one-product',logedin,isBlocked,orderController.returnOneProduct)
//orderPage get invoice
router.get('/get_invoice',logedin,isBlocked,orderController.getInvoice)
//verify
router.post("/verifyPayment",logedin,isBlocked,orderController.verify)
router.post("/retry-payment/:id",logedin,isBlocked,orderController.retryPayment)
// router.post("/cancel_order/:id",logedin,isBlocked,orderController.cancelOrder)

//cart management
router.get('/cart',logedin,isBlocked,cartController.loadCart)
router.post("/addtocart/:id",logedin,isBlocked,cartController.addToCart)
router.post("/removeFromCart",logedin,isBlocked,cartController.removeFromCart)
router.post("/updatecart",cartController.updateCart)
router.post('/checkOutOfStock', cartController.checkOutOfStock);

//checkout management

router.get('/cart/checkout',logedin,isBlocked,checkoutController.loadCheckoutPage)
router.post('/placeorder',checkoutController.placeorder)
router.get("/orderPlaced",logedin,isBlocked,checkoutController.orderSuccess)
router.get('/payment_failed',logedin,isBlocked,checkoutController.payment_failed)


//wishlist management
router.get('/wishlist',logedin,isBlocked,wishlistController.showWishlistPage)
router.post('/addtowishlist', isLogin, isBlocked,wishlistController.addToWishList)
router.post('/removeFromWishList', logedin, isBlocked,wishlistController.removeFromWishList)

//user side coupon management

router.post('/validate_coupon',logedin,isBlocked,checkoutController.validateCoupon)
router.post('/apply_coupon',checkoutController.applyCoupon)
router.post('/remove_coupon',checkoutController.removeCoupon)

//wallet management
router.get('/wallet', logedin, isBlocked, walletController.walletpage)
router.post('/addmoneytowallet',logedin,isBlocked,walletController.addMoneyToWallet)
router.post('/verify_Payment',logedin,isBlocked,walletController.verifyPayment)


module.exports=router