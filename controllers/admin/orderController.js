const Order=require("../../models/orderModel")
const Address=require("../../models/addressModel")
const Product=require("../../models/productModel")
const Category=require("../../models/categoryModel")
const Cart=require("../../models/cartModel")
const User=require("../../models/userModel")
const moment=require('moment')
const mongoose=require("mongoose")
const ObjectId=require("mongoose")

const ordersPage=async(req,res)=>{
    try {
        const user=await User.findOne({_id:req.session.user_id})
        var page=1
        if(req.query.page){
            page=req.query.page
        }
        console.log(page)
        let limit=5
        const ordersData=await Order.find()
        .sort({date:-1})
        .skip((page-1) * limit)
        .limit(limit*1)
        .lean()
        const count=await Order.find({}).countDocuments()
        const totalPages=Math.ceil(count/limit)
        const pages=Array.from({length:totalPages},(_,i)=>i+1)
        res.render("admin/orders",{
            pages,currentPage:page,ordersData,layout:"adminlayout"
        })
    } catch (error) {
        console.log(error)
    }
}
 



const orderDetails = async (req, res) => {
    try {
      const orderId = req.params.id;
      const IDORDER = new mongoose.Types.ObjectId(orderId);
  
      const myOrderDetails = await Order.findOne({ _id: orderId }).lean();
      const address = await Address.findOne({
        _id: myOrderDetails.address,
      }).lean();
      console.log(address, "myOrderDetails");
      const orderedProDet = await Order.aggregate([
        {
          $match: { _id: IDORDER },
        },
        {
          $unwind: "$product",
        },
        // {
        //   $unwind: "$product", 
        // },
        {
          $project: {
            _id: 0,
            product: 1,
          },
        },
      ]);
      console.log(orderedProDet);
      res.render("admin/order_Details", {
        admin: true,
        orderedProDet,
        layout: "adminlayout",
        address,
        myOrderDetails,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).send("Internal Server Error");
    }
  };

// const changeOrderStatus=async(req,res)=>{
//     console.log(req.body)

//     try{
//         const id=req.query.id
//         const status=req.body.status
//         console.log(status)
//         const order=await Order.findByIdAndUpdate(
//             id,
//             {$set:{status:status}},
//             {new:true}
//         )
//         res.redirect("/admin/orders")
//     }catch(error){
//         console.log(error)
//     }
// }

const changeOrderStatus = async (req, res) => {
  console.log(req.body);
  try {
      const id = req.query.id;
      const status = req.body.status;
      console.log(status);
      const order = await Order.findById(id);
      if (!order) {
          return res.status(404).json({ message: "Order not found" });
      }
      order.status = status;

      // Log the entire product array to inspect its structure
      console.log('Order products:', order.product);

      if (status === 'Delivered') {
          for (const product of order.product) {
              const productId = product.id || product._id; // Ensure we're using the correct field
              console.log('Updating product:', productId);
              const result = await Product.updateOne(
                  { _id: productId },
                  { $inc: { popularity: product.quantity } }
              );
              console.log(`Updated product ${productId}:`, result);
          }
      }

      await order.save();
      res.redirect("/admin/orders");
  } catch (error) {
      console.log('Error updating order status:', error);
      res.status(500).json({ message: 'An error occurred while updating the order status' });
  }
};



module.exports=
{
    ordersPage,
    orderDetails,
    changeOrderStatus
}