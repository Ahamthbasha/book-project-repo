const Coupon=require("../../models/couponModel")
const moment=require("moment")

const couponPage= async(req,res)=>{
    try {

        const couponMsg = req.session.couponMsg;        
        req.session.couponMsg = null;
        const couponExMsg = req.session.couponExMsg;        
        req.session.couponExMsg = null;

        var page = 1
        if(req.query.page){
            page = req.query.page
        }
        let limit = 1     
        const couponData = await Coupon.find().skip((page-1)*limit).limit(limit*1).lean()
        const count = await Coupon.find({}).countDocuments();
        const totalPages = Math.ceil(count / limit);
        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);  
        console.log("coupon Data=>",couponData )
        res.render('admin/coupon',{couponData, couponMsg, couponExMsg, pages, currentPage: page,layout:'adminlayout'})
    } catch (error) {

        console.log(error.message);
        res.status(500).send("Internal Server Error");
        
    }
}

const addCouponPage= async(req,res)=>{
    const couponMsg = "Coupon added successfuly..!!";
    const couponExMsg = "Coupon alredy exist..!!";
    try {
        if (req.session.couponMsg) {
            res.render("admin/addCoupon",{  couponMsg ,title:"Admin",layout:'adminlayout'});
            req.session.couponMsg = false;
          } else if (req.session.couponExMsg) {
            res.render("admin/addCoupon", { couponExMsg ,title:"Admin",layout:'adminlayout'});
            req.session.couponExMsg = false;
          } else {
            res.render("admin/addCoupon",{ title:"Admin",layout:'adminlayout'});
          }
    } catch (error) {
      console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}

const addCouponPost = async (req, res) => {
  try {
      const { code, percent, expDate, maxDiscount, minPurchase } = req.body;


      console.log('Received data:', req.body);

   
      if (!code || !percent || !expDate || !maxDiscount || !minPurchase) {
          throw new Error('All fields are required');
      }

      const discount = parseFloat(percent);
      const minPurchaseAmount = parseFloat(minPurchase);
      const maxDiscountAmount = parseFloat(maxDiscount);

      if (isNaN(discount) || discount <= 0 || discount > 100) {
          throw new Error('Invalid discount value');
      }
      if (isNaN(minPurchaseAmount) || minPurchaseAmount < 0) {
          throw new Error('Invalid minimum purchase amount');
      }
      if (isNaN(maxDiscountAmount) || maxDiscountAmount < 0) {
          throw new Error('Invalid maximum discount amount');
      }

      const cpnExist = await Coupon.findOne({ code: code });

      if (!cpnExist) {
          const coupon = new Coupon({
              code: code,
              discount: discount,
              expiryDate: new Date(expDate),
              minPurchase: minPurchaseAmount,
              maxDiscount: maxDiscountAmount
          });

          await coupon.save();
          req.session.couponMsg = 'Coupon added successfully';
          res.redirect("/admin/coupons");
      } else {
          req.session.couponExMsg = 'Coupon already exists';
          res.redirect("/admin/coupons");
      }
  } catch (error) {
      console.error('Error adding coupon:', error.message);
      res.status(500).send("Internal Server Error");
  }
};

const editCouponPage = async (req, res) => {
    const { id } = req.params;
    try {
        console.log('Coupon ID:', id); 
        const coupon = await Coupon.findById(id).lean();
        if (!coupon) {
            return res.status(404).send("Coupon not found");
        }
        if (coupon) {
            // Format expiry date before passing to the view
            coupon.expiryDate = moment(coupon.expiryDate).format('YYYY-MM-DD');
        }
        res.render("admin/editCoupon", { coupon, layout: "adminlayout" });
        
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
};

const editCouponPost = async (req, res) => {
    try {
        const { code, discount, expDate, minPurchase, maxDiscount } = req.body;
        const couponId = req.params.id;
  
        // Find the coupon by ID and update the details
        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            return res.status(404).send("Coupon not found");
        }
  
        // Update coupon fields
        coupon.code = code;
        coupon.discount = parseFloat(discount);
        coupon.expiryDate = new Date(expDate);
        coupon.minPurchase = parseFloat(minPurchase);
        coupon.maxDiscount = parseFloat(maxDiscount);
  
        // Save the updated coupon
        await coupon.save();
  
        req.session.couponMsg = 'Coupon updated successfully';
        res.redirect('/admin/coupons'); // Redirect to the coupons list page
    } catch (error) {
        console.error('Error updating coupon:', error.message);
        res.status(500).send("Internal Server Error");
    }
};

const deleteCoupon = async (req, res) => {
    const couponId = req.params.id;
    await Coupon.findByIdAndDelete(couponId)
    res.redirect('/admin/coupons')
};

module.exports={
    couponPage,
    addCouponPage,
    addCouponPost,
    editCouponPage,
    editCouponPost,
    deleteCoupon
}