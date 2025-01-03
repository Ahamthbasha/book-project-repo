const Cart = require("../../models/cartModel");
const Product = require("../../models/productModel");
const Category = require("../../models/categoryModel");
const User = require("../../models/userModel");
const Address = require("../../models/addressModel");
const Order = require("../../models/orderModel");
const Coupon = require("../../models/couponModel");
const Razorpay = require('razorpay');

const mongoose = require("mongoose");
const ObjectId = require("mongoose");

const loadCheckoutPage = async (req, res) => {
  try {
    let userData = await User.findById(req.session.user._id).lean();
    const ID = new mongoose.Types.ObjectId(userData._id);

    const addressData = await Address.find({ userId: userData._id }).lean();
    let coupon = await Coupon.find().lean();

    const subTotal = await Cart.aggregate([
      {
        $match: {
          userId: ID,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$value" },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
        },
      },
    ]);
    let cart = await Cart.aggregate([
      {
        $match: {
          userId: ID,
        },
      },
      {
        $lookup: {
          from: "products",
          foreignField: "_id",
          localField: "product_Id",
          as: "productData",
        },
      },
      {
        $lookup: {
            from: "productoffers", // Ensure this matches your ProductOffer model
            localField: "product_Id",
            foreignField: "productId",
            as: "offerData",
        },
    },
      {
        $project: {
          _id: 1,
          userId: 1,
          quantity: 1,
          value: 1,
          productName: { $arrayElemAt: ["$productData.name", 0] },
          productPrice: { $arrayElemAt: ["$productData.price", 0] },
          productDescription: { $arrayElemAt: ["$productData.description", 0] },
          productImage: { $arrayElemAt: ["$productData.imageUrl", 0] },
          offerPercentage: { $arrayElemAt: ["$offerData.productOfferPercentage", 0] }
        },
      },
    ]);

            // Calculate final prices based on offers
            cart = cart.map(item => {
            const originalPrice = item.productPrice;
            const discountPercentage = item.offerPercentage || 0;
            const discountedPrice = originalPrice - (originalPrice * (discountPercentage / 100));
                
                return {
                    ...item,
                    finalPrice: discountPercentage > 0 ? discountedPrice : originalPrice,
                };
            });
    console.log(cart);

    res.render("user/checkout/checkout", {
      userData,
      addressData,
      subTotal: subTotal[0].total,
      cart,
      coupon,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};


// const placeorder = async (req, res) => {
//   try {
//     console.log("place order ");
//     userData = req.session.user;
//     const ID = new mongoose.Types.ObjectId(userData._id);
//     const addressId = req.body.selectedAddress;
//     const payMethod = req.body.selectedPayment;
//     const totalamount = req.body.amount;
//     console.log("Request dot body  ", addressId, payMethod, totalamount);

//     console.log('Coupon data:', req.body.couponData); // To check if the couponData is passed
// console.log('Coupon Name:', req.body.couponName); // To check the coupon name value

//     const result = Math.random().toString(36).substring(2, 7);
//     const id = Math.floor(100000 + Math.random() * 900000);
//     const ordeId = result + id;

//     const productInCart = await Cart.aggregate([
//       {
//         $match: {
//           userId: ID,
//         },
//       },
//       {
//         $lookup: {
//           from: "products",
//           foreignField: "_id",
//           localField: "product_Id",
//           as: "productData",
//         },
//       },
//       {
//         $project: {
//           product_Id: 1,
//           userId: 1,
//           quantity: 1,
//           value: 1,
//           name: { $arrayElemAt: ["$productData.name", 0] },
//           price: { $arrayElemAt: ["$productData.price", 0] },
//           productDescription: { $arrayElemAt: ["$productData.description", 0] },
//           image: { $arrayElemAt: ["$productData.imageUrl", 0] },
//         },
//       },
//     ]);
//     console.log(productInCart);

//     let productDet = productInCart.map((item) => {
//       return {
//         _id: item.product_Id,
//         name: item.name,
//         price: item.price,
//         quantity: item.quantity,
//         image: item.image[0],
//       };
//     });

//     console.log(productDet, "aggregated cart prods");

//     // Apply coupon if present
//     let finalTotal = totalamount;
//     let discountAmt = 0;

//     if (req.body.couponData) {
//       console.log(req.body.couponData)
//       finalTotal = req.body.couponData.newTotal;
//       discountAmt = req.body.couponData.discountAmt;
//     }

//     const DELIVERY_CHARGE = 50;
//     const grandTotal = finalTotal + DELIVERY_CHARGE;



//     // Save the order
//     let saveOrder = async () => {
//       const order = new Order({
//         userId: ID,
//         product: productDet,
//         address: addressId,
//         orderId: ordeId,
//         total: grandTotal,
//         paymentMethod: payMethod,
//         discountAmt: discountAmt,
//         amountAfterDscnt: grandTotal,  // The grand total after discount + delivery charge
//         coupon: req.body.couponName ? req.body.couponName : "",
//         couponUsed: req.body.couponData ? true : false,
//       });

//       if (req.body.status) {
//         order.status = "Payment Failed";
//         console.log("Payment Failed  ", order.status)
//     }

//       const ordered = await order.save();
//       console.log(ordered, "ordersaved DATAAAA");

//       productDet.forEach(async (product) => {
//         await Product.updateMany(
//           { _id: product._id },
//           { $inc: { stock: -product.quantity, bestSelling:1 } }
//         );
//       });
//       productDet.forEach(async (product) => {
//         const populatedProd= await Product.findById(product._id).populate("category").lean()
//         await Category.updateMany({ _id: populatedProd.category._id }, { $inc: { bestSelling:1} });

//     })

//       const deletedCart = await Cart.deleteMany({
//         userId: ID,
//       }).lean();

//       console.log(deletedCart, "deletedCart");
//     };

//     if (addressId) {
//       if (payMethod === "cash-on-delivery") {
//         console.log("CASH ON DELIVERY");
//         await saveOrder();
//         res.json({ COD: true });
//       } else if (payMethod === "razorpay") {
//         const amount = grandTotal;
//         let instance = new Razorpay({
//           key_id: "rzp_test_QhDPSiMt8ea6IF",
//           key_secret: "5wg9GfJ3ESDupFYCxdSpPbRP",
//         });
//         const order = await instance.orders.create({
//           amount: amount * 100,
//           currency: "INR",
//           receipt: "Ahamathbasha",
//         });
//         await saveOrder();

//         res.json({
//           razorPaySucess: true,
//           order,
//           amount,
//         });
//       } else if (payMethod === "wallet") {
//         const newWallet = req.body.updateWallet;

//         await User.findByIdAndUpdate(
//           userData._id,
//           { $set: { wallet: newWallet + 50 } },
//           { new: true }
//         );

//         await saveOrder();

//         res.json({ walletSucess: true });
//       }
//     }
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send("Internal Server Error");
//   }
// };




// const placeorder = async (req, res) => {
//     try {
//       console.log("place order ");
//       userData = req.session.user;
//       const ID = new mongoose.Types.ObjectId(userData._id);
//       const addressId = req.body.selectedAddress;
//       const payMethod = req.body.selectedPayment;
//       const totalamount = req.body.amount;
//       console.log("Request dot body  ", addressId, payMethod, totalamount);
  
//       console.log('Coupon data:', req.body.couponData); // To check if the couponData is passed
//       console.log('Coupon Name:', req.body.couponName); // To check the coupon name value
  
//       const result = Math.random().toString(36).substring(2, 7);
//       const id = Math.floor(100000 + Math.random() * 900000);
//       const ordeId = result + id;
  
//       const productInCart = await Cart.aggregate([
//         {
//           $match: {
//             userId: ID,
//           },
//         },
//         {
//           $lookup: {
//             from: "products",
//             foreignField: "_id",
//             localField: "product_Id",
//             as: "productData",
//           },
//         },
//         {
//           $project: {
//             product_Id: 1,
//             userId: 1,
//             quantity: 1,
//             value: 1,
//             name: { $arrayElemAt: ["$productData.name", 0] },
//             price: { $arrayElemAt: ["$productData.price", 0] },
//             productDescription: { $arrayElemAt: ["$productData.description", 0] },
//             image: { $arrayElemAt: ["$productData.imageUrl", 0] },
//           },
//         },
//       ]);
//       console.log(productInCart);
  
//       let productDet = productInCart.map((item) => {
//         return {
//           _id: item.product_Id,
//           name: item.name,
//           price: item.price,
//           quantity: item.quantity,
//           image: item.image[0],
//         };
//       });
  
//       console.log(productDet, "aggregated cart prods");
  
//       // Apply coupon if present
//       let finalTotal = totalamount;
//       let discountAmt = 0;
//       console.log("finalTotal",finalTotal)
  
//       if (req.body.couponData) {
//         console.log(req.body.couponData)
//         finalTotal = req.body.couponData.newTotal;
//         discountAmt = req.body.couponData.discountAmt;
//       }
  
//       const DELIVERY_CHARGE = 50;
//       const grandTotal = finalTotal + DELIVERY_CHARGE;
//       console.log("grandTotal",grandTotal)
  
//       // Save the order
//       let saveOrder = async () => {
//         const order = new Order({
//           userId: ID,
//           product: productDet,
//           address: addressId,
//           orderId: ordeId,
//           total: grandTotal,
//           paymentMethod: payMethod,
//           discountAmt: discountAmt,
//           amountAfterDscnt: grandTotal,  // The grand total after discount + delivery charge
//           coupon: req.body.couponName ? req.body.couponName : "",
//           couponUsed: req.body.couponData ? true : false,
//         });
  
//         if (req.body.status) {
//           order.status = "Payment Failed";
//           console.log("Payment Failed  ", order.status)
//         }
  
//         const ordered = await order.save();
//         console.log(ordered, "ordersaved DATAAAA");
  
//         productDet.forEach(async (product) => {
//           await Product.updateMany(
//             { _id: product._id },
//             { $inc: { stock: -product.quantity, bestSelling: 1 } }
//           );
//         });
  
//         // Mark the coupon as used after the order is placed
//         if (req.body.couponData) {
//           await Coupon.updateOne(
//             { code: req.body.couponName },
//             { $push: { usedBy: ID } }
//           );
//         }
  
//         const deletedCart = await Cart.deleteMany({
//           userId: ID,
//         }).lean();
  
//         console.log(deletedCart, "deletedCart");
//       };
  
//       if (addressId) {
//         if (payMethod === "cash-on-delivery") {
//           console.log("CASH ON DELIVERY");
//           await saveOrder();
//           res.json({ COD: true });
//         } else if (payMethod === "razorpay") {
//           const amount = grandTotal;
//           let instance = new Razorpay({
//             key_id: "rzp_test_QhDPSiMt8ea6IF",
//             key_secret: "5wg9GfJ3ESDupFYCxdSpPbRP",
//           });
//           const order = await instance.orders.create({
//             amount: amount * 100,
//             currency: "INR",
//             receipt: "Ahamathbasha",
//           });
//           await saveOrder();
  
//           res.json({
//             razorPaySucess: true,
//             order,
//             amount,
//           });
//         } else if (payMethod === "wallet") {
//           const newWallet = req.body.updateWallet;
//           console.log("newWallet",newWallet)
  
//           await User.findByIdAndUpdate(
//             userData._id,
//             { $set: { wallet: newWallet } },
//             { new: true }
//           );

//           await User.updateOne(
//             {_id:req.session.user._id},
//             {
//               $push:{
//                 history:{
//                   amount:grandTotal,
//                   status:`debited`,
//                   date:Date.now()
//                 }
//               }
//             }
//           )
  
//           await saveOrder();
  
//           res.json({ walletSucess: true });
//         }
//       }
//     } catch (error) {
//       console.log(error.message);
//       res.status(500).send("Internal Server Error");
//     }
//   };

const placeorder = async (req, res) => {
  try {
    console.log("place order ");
    userData = req.session.user;
    const ID = new mongoose.Types.ObjectId(userData._id);
    const addressId = req.body.selectedAddress;
    const payMethod = req.body.selectedPayment;
    let totalamount = req.body.amount;

    console.log("Request body:", addressId, payMethod, totalamount);
    console.log('Coupon data:', req.body.couponData); // To check if the couponData is passed
    console.log('Coupon Name:', req.body.couponName); // To check the coupon name value

    // Ensure that totalamount is a valid number
    if (isNaN(totalamount)) {
      throw new Error('Invalid total amount in request body');
    }

    const result = Math.random().toString(36).substring(2, 7);
    const id = Math.floor(100000 + Math.random() * 900000);
    const orderId = result + id;

    const productInCart = await Cart.aggregate([
      {
        $match: {
          userId: ID,
        },
      },
      {
        $lookup: {
          from: "products",
          foreignField: "_id",
          localField: "product_Id",
          as: "productData",
        },
      },
      {
        $project: {
          product_Id: 1,
          userId: 1,
          quantity: 1,
          value: 1,
          name: { $arrayElemAt: ["$productData.name", 0] },
          price: { $arrayElemAt: ["$productData.price", 0] },
          productDescription: { $arrayElemAt: ["$productData.description", 0] },
          image: { $arrayElemAt: ["$productData.imageUrl", 0] },
        },
      },
    ]);
    console.log(productInCart);

    let productDet = productInCart.map((item) => {
      return {
        _id: item.product_Id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image[0],
      };
    });

    console.log(productDet, "aggregated cart prods");

    // Apply coupon if present
    let finalTotal = totalamount;
    let discountAmt = 0;
    console.log("finalTotal", finalTotal);

    if (req.body.couponData) {
      console.log(req.body.couponData);
      if (isNaN(req.body.couponData.newTotal)) {
        throw new Error('Invalid coupon data: newTotal is not a valid number');
      }
      finalTotal = req.body.couponData.newTotal;
      discountAmt = req.body.couponData.discountAmt;
    }

    // Ensure finalTotal is a valid number before using it in calculation
    if (isNaN(finalTotal)) {
      throw new Error('Invalid final total amount');
    }

    const DELIVERY_CHARGE = 50;
    const grandTotal = finalTotal + DELIVERY_CHARGE;
    console.log("grandTotal", grandTotal);

    // Save the order
    let saveOrder = async () => {

      const order = new Order({
        userId: ID,
        product: productDet,
        address: addressId,
        orderId: orderId,
        total: grandTotal,
        paymentMethod: payMethod,
        discountAmt: discountAmt,
        amountAfterDscnt: grandTotal,  // The grand total after discount + delivery charge
        coupon: req.body.couponName ? req.body.couponName : "",
        couponUsed: req.body.couponData ? true : false,
      });

      if (req.body.status) {
        order.status = "Payment Failed";
        console.log("Payment Failed", order.status);
      }

      const ordered = await order.save();
      console.log(ordered, "ordersaved DATAAAA");

      // Update product stock and bestSelling after the order is placed
      productDet.forEach(async (product) => {
        await Product.updateMany(
          { _id: product._id },
          { $inc: { stock: -product.quantity, bestSelling: 1 } }
        );
      });

      // Mark the coupon as used after the order is placed
      if (req.body.couponData) {
        await Coupon.updateOne(
          { code: req.body.couponName },
          { $push: { usedBy: ID } }
        );
      }

      // Delete cart after the order is placed
      const deletedCart = await Cart.deleteMany({
        userId: ID,
      }).lean();

      console.log(deletedCart, "deletedCart");
    };

    if (addressId) {
      if (payMethod === "cash-on-delivery") {
        console.log("CASH ON DELIVERY");
        await saveOrder();
        res.json({ COD: true });
      } else if (payMethod === "razorpay") {
        const amount = grandTotal;
        let instance = new Razorpay({
          key_id: "rzp_test_QhDPSiMt8ea6IF",
          key_secret: "5wg9GfJ3ESDupFYCxdSpPbRP",
        });
        const order = await instance.orders.create({
          amount: amount * 100,
          currency: "INR",
          receipt: "Ahamathbasha",
        });
        await saveOrder();

        res.json({
          razorPaySucess: true,
          order,
          amount,
        });
      } else if (payMethod === "wallet") {
        const newWallet = req.body.updateWallet;
        console.log("newWallet", newWallet);

        // Update wallet balance after the order is placed
        await User.findByIdAndUpdate(
          userData._id,
          { $set: { wallet: newWallet } },
          { new: true }
        );

        // Log the transaction in user history
        await User.updateOne(
          { _id: req.session.user._id },
          {
            $push: {
              history: {
                amount: grandTotal,
                status: `debited`,
                date: Date.now(),
              },
            },
          }
        );

        await saveOrder();

        res.json({ walletSucess: true });
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};



const orderSuccess = async (req, res) => {
  try {
    res.render("user/order_success", {
      title: "Order Placed",
      userData,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const validateCoupon = async (req, res) => {
  try {
    const { couponVal, subTotal } = req.body;
    console.log(couponVal, subTotal);
    const coupon = await Coupon.findOne({ code: couponVal });

    if (!coupon) {
      res.json("invalid");
    } else if (coupon.expiryDate < new Date()) {
      res.json("expired");
    } else if (subTotal < coupon.minPurchase) {
      res.json("Minimum Amount Required");
    } else {
      const couponId = coupon._id;
      const discount = coupon.discount;
      const userId = req.session.user._id;

      const isCpnAlredyUsed = await Coupon.findOne({
        _id: couponId,
        usedBy: { $in: [userId] },
      });

      if (isCpnAlredyUsed) {
        res.json("already used");
      } else {
        //await Coupon.updateOne({ _id: couponId }, { $push: { usedBy: userId } });

        const discnt = Number(discount);
        const discountAmt = (subTotal * discnt) / 100;
        const newTotal = subTotal - discountAmt;

        const user = User.findById(userId);

        res.json({
          discountAmt,
          newTotal,
          discount,
          succes: "succes",
        });
      }
    }
  } catch (error) {
    console.log(error);
  }
};

// const applyCoupon = async (req, res) => {
//   try {
//     const { couponVal, subTotal } = req.body;
//     const coupon = await Coupon.findOne({ code: couponVal });
//     const userId = req.session.user._id;

//     if (!coupon) {
//       return res.json({ status: "invalid" });
//     } else if (coupon.expiryDate < new Date()) {
//       return res.json({ status: "expired" });
//     } else if (coupon.usedBy.includes(userId)) {
//       return res.json({ status: "already_used" });
//     } else if (subTotal < coupon.minPurchase) {
//       return res.json({ status: "min_purchase_not_met" });
//     } else {
//       // Add user ID to usedBy array
//       await Coupon.updateOne(
//         { _id: coupon._id },
//         { $push: { usedBy: userId } }
//       );

//       // Calculate the new total by subtracting the discount amount
//       let discountAmt = (subTotal * coupon.discount) / 100;
//       if (discountAmt > coupon.maxDiscount) {
//         discountAmt = coupon.maxDiscount;
//       }
//       const newTotal = subTotal - discountAmt;

//       return res.json({
//         discountAmt,
//         newTotal,
//         discount: coupon.discount,
//         status: "applied",
//         couponVal,
//       });
//     }
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ status: "error", error });
//   }
// };

const applyCoupon = async (req, res) => {
    try {
      const { couponVal, subTotal } = req.body;
      const coupon = await Coupon.findOne({ code: couponVal });
      const userId = req.session.user._id;
  
      if (!coupon) {
        return res.json({ status: "invalid" });
      } else if (coupon.expiryDate < new Date()) {
        return res.json({ status: "expired" });
      } else if (coupon.usedBy.includes(userId)) {
        return res.json({ status: "already_used" });
      } else if (subTotal < coupon.minPurchase) {
        return res.json({ status: "min_purchase_not_met" });
      } else {
        // Calculate the discount without marking the coupon as used yet
        let discountAmt = (subTotal * coupon.discount) / 100;
        if (discountAmt > coupon.maxDiscount) {
          discountAmt = coupon.maxDiscount;
        }
        const newTotal = subTotal - discountAmt;
  
        return res.json({
          discountAmt,
          newTotal,
          discount: coupon.discount,
          status: "applied",
          couponVal,
        });
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ status: "error", error });
    }
  };  

const removeCoupon = async (req, res) => {
  try {
    const { couponVal, subTotal } = req.body;
    const coupon = await Coupon.findOne({ code: couponVal });
    const userId = req.session.user._id;

    if (!coupon) {
      return res.json({ status: "invalid" });
    } else if (!coupon.usedBy.includes(userId)) {
      return res.json({ status: "not_used" });
    } else {
      // Remove user ID from usedBy array
      await Coupon.updateOne(
        { _id: coupon._id },
        { $pull: { usedBy: userId } }
      );

      // Calculate the new total by adding back the discount amount correctly
      const discountAmt = 0;
      const newTotal = subTotal;

      return res.json({
        discountAmt,
        newTotal,
        discount: coupon.discount,
        status: "removed",
        couponVal,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ status: "error", error });
  }
};

const payment_failed=(req,res)=>{
  try{
    const userData=req.session.user
    const {error,payment_method,order_id}=req.query
    
    res.render("user/paymentFailed",{
      userData,
      error,
      payment_method,
      order_id,
      message:'Your payment attempt failed.Please try again or choose another payment method'
    })
  }catch(error){
    console.log(error)
  }
}

module.exports = {
  loadCheckoutPage,
  placeorder,
  orderSuccess,
  validateCoupon,
  applyCoupon,
  removeCoupon,
  payment_failed
};