const express=require('express')
const router=express.Router()
const adminController=require("../controllers/admin/adminController")
const customerController=require("../controllers/admin/customerController")
const categoryController=require("../controllers/admin/categoryController")
const productController=require("../controllers/admin/productController")
const orderController=require("../controllers/admin/orderController")
const couponController=require("../controllers/admin/couponController")
const dashboardController=require("../controllers/admin/dashboardController")
const offerController=require("../controllers/admin/offerController")
const store=require("../middlewares/multer")
const adminAuth=require('../middlewares/adminAuth')

router.get('/login',adminAuth.isLogout, adminController.adminLogin)
router.post('/login', adminAuth.isLogout,adminController.adminDoLogin)

router.get('/logout', adminController.adminLogout)

router.get('/home', adminAuth.isLogin, adminController.loadHome)

//user management
router.get('/manage_users', adminAuth.isLogin, customerController.loadUsersData)

router.get('/block_user/:id', adminAuth.isLogin, customerController.blockUser)

//category management
router.get("/category",adminAuth.isLogin,categoryController.getCategory)
router.get("/add_category",adminAuth.isLogin,categoryController.addCategory)
router.post("/add_category",adminAuth.isLogin,store.single('image'),categoryController.addNewCategory)
router.get("/edit_category/:id",adminAuth.isLogin,categoryController.editCategory)
router.post("/update_category/:id",adminAuth.isLogin,store.single('image'),categoryController.updateCategory)
router.post("/delete_category",adminAuth.isLogin,categoryController.deleteCategory)
router.post("/unlistCategory",adminAuth.isLogin,categoryController.unListCategory)

//product management

router.get("/product",adminAuth.isLogin,productController.getProduct)
router.get("/new_Product",adminAuth.isLogin,productController.addProductPage)
router.post("/add_new_product",store.array('image',5),productController.addNewProduct)
router.get("/edit_product/:id",store.array('image',5),adminAuth.isLogin,productController.editProduct)
router.post("/update_product/:id",store.array('image',5),adminAuth.isLogin,productController.updateProduct)
router.delete("/product_img_delete",adminAuth.isLogin,productController.deleteProImage)
router.post("/block_product",adminAuth.isLogin,productController.blockProduct)
router.get("/delete_product/:id",adminAuth.isLogin,productController.deleteProduct)

//order management
router.get('/orders', adminAuth.isLogin, orderController.ordersPage)
router.get('/order_details/:id', adminAuth.isLogin, orderController.orderDetails)
router.post('/change_status', orderController.changeOrderStatus)

//coupon management

router.get('/coupons',adminAuth.isLogin,couponController.couponPage)
router.get('/addcoupon',adminAuth.isLogin,couponController.addCouponPage)
router.post('/add_coupon',couponController.addCouponPost)
router.get('/editcoupon/:id', couponController.editCouponPage);
router.post('/editcoupon/:id',couponController.editCouponPost)
router.get("/delete_coupon/:id",adminAuth.isLogin,couponController.deleteCoupon)

//sales

router.get('/get_sales',adminAuth.isLogin,dashboardController.getSales)

//offer management
router.get("/productOffers",adminAuth.isLogin,offerController.productOfferPage)
router.get("/addProOffers",adminAuth.isLogin,offerController.addProductOfferPage)
module.exports=router