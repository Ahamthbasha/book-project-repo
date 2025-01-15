const express=require('express')
const router=express.Router()
const adminController=require("../controllers/admin/adminController")
const customerController=require("../controllers/admin/customerController")
const categoryController=require("../controllers/admin/categoryController")
const productController=require("../controllers/admin/productController")
const orderController=require("../controllers/admin/orderController")
const couponController=require("../controllers/admin/couponController")
const dashboardController=require("../controllers/admin/dashboardController")
const offerController=require("../controllers/admin/productOfferController")
const categoryOfferController=require("../controllers/admin/categoryOfferController")

const store=require("../middlewares/multer")
const adminAuth=require('../middlewares/adminAuth')

//admin login and logout
router.get('/login',adminAuth.isLogout, adminController.adminLogin)
router.post('/login', adminAuth.isLogout,adminController.adminDoLogin)
router.get('/logout', adminController.adminLogout)

//dashboard side router
router.get('/home', adminAuth.isLogin, dashboardController.loadDashboard)
router.get('/get_sales',adminAuth.isLogin,dashboardController.getSales)
router.get('/get_chart_data',adminAuth.isLogin,dashboardController.getChartData)

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

//product offer management
router.get("/productOffers",adminAuth.isLogin,offerController.productOfferPage)
router.get("/addProOffers",adminAuth.isLogin,offerController.addProductOfferPage)
router.post("/addProOffers",adminAuth.isLogin,offerController.addProductOffer)
router.get("/editProductOffer/:id",adminAuth.isLogin,offerController.editProductOfferPage)
router.post("/editProductOffer/:id",adminAuth.isLogin,offerController.editProductOffer)
router.delete("/deleteProOffer/:id",adminAuth.isLogin,offerController.deleteProductOffer)

//category offer management
router.get('/categoryOffers',adminAuth.isLogin,categoryOfferController.categoryOfferPage)
router.get('/addCatOffers',adminAuth.isLogin, categoryOfferController.addCategoryOfferPage)
router.post('/addCatOffers',adminAuth.isLogin, categoryOfferController.addCategoryOffer)
router.get('/editCategoryOffer/:id',adminAuth.isLogin, categoryOfferController.editCategoryOfferPage)
router.post("/editCategoryOffer/:id",adminAuth.isLogin, categoryOfferController.editCategoryOffer);
router.delete('/deleteCatOffer/:id',adminAuth.isLogin, categoryOfferController.deleteCategoryOffer)

module.exports=router