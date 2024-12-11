const Cart=require("../../models/cartModel")
const Product=require("../../models/productModel")
const Category=require("../../models/categoryModel")
const User=require("../../models/userModel")
const Address=require("../../models/addressModel")
const Order=require("../../models/orderModel")
const Coupon=require('../../models/couponModel')
const Razorpay=require('razorpay')

const mongoose=require("mongoose")
const ObjectId=require("mongoose")

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
          $project: {
            _id: 1,
            userId: 1,
            quantity: 1,
            value: 1,
            productName: { $arrayElemAt: ["$productData.name", 0] },
            productPrice: { $arrayElemAt: ["$productData.price", 0] },
            productDescription: { $arrayElemAt: ["$productData.description", 0] },
            productImage: { $arrayElemAt: ["$productData.imageUrl", 0] },
          },
        },
      ]);
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
//     try {
//         console.log("place order ");
//         const userData = await User.findById(req.session.user._id).lean();
//         const ID = new mongoose.Types.ObjectId(userData._id);
//         const addressId = req.body.selectedAddress;
//         const payMethod = req.body.selectedPayment;
//         const totalamount = req.body.amount;
//         console.log("Request dot body  ", addressId, payMethod, totalamount);

//         const result = Math.random().toString(36).substring(2, 7);
//         const id = Math.floor(100000 + Math.random() * 900000);
//         const ordeId = result + id;

//         const productInCart = await Cart.aggregate([
//             { $match: { userId: ID } },
//             {
//                 $lookup: {
//                     from: "products",
//                     foreignField: "_id",
//                     localField: "product_Id",
//                     as: "productData"
//                 }
//             },
//             {
//                 $project: {
//                     product_Id: 1,
//                     userId: 1,
//                     quantity: 1,
//                     value: 1,
//                     name: { $arrayElemAt: ["$productData.name", 0] },
//                     price: { $arrayElemAt: ["$productData.price", 0] },
//                     productDescription: { $arrayElemAt: ["$productData.description", 0] },
//                     image: { $arrayElemAt: ["$productData.imageUrl", 0] }
//                 }
//             }
//         ]);
//         console.log("Products in cart:", productInCart);

//         let productDet = productInCart.map((item) => ({
//             _id: item.product_Id,
//             name: item.name,
//             price: item.price,
//             quantity: item.quantity,
//             image: item.image[0]
//         }));
//         console.log("Aggregated cart products:", productDet);

//         // Apply coupon if present
//         let discountAmt = 0;
//         if (req.body.couponData) {
//             console.log("Coupon data received:", req.body.couponData);
//             discountAmt = req.body.couponData.discountAmt;
//         }

//         const DELIVERY_CHARGE = 50;
//         const finalProductTotal = totalamount - discountAmt; // Total after applying discount
//         const grandTotal = finalProductTotal + DELIVERY_CHARGE; // Add delivery charge to final total

//         console.log("Final product total after discount:", finalProductTotal);
//         console.log("Grand total (with delivery charge):", grandTotal);

//         // Save the order
//         let saveOrder = async () => {
//             const order = new Order({
//                 userId: ID,
//                 product: productDet,
//                 address: addressId,
//                 orderId: ordeId,
//                 total: grandTotal,
//                 paymentMethod: payMethod,
//                 discountAmt: discountAmt,
//                 amountAfterDscnt: finalProductTotal, // The grand total after discount
//                 deliveryCharge: DELIVERY_CHARGE,
//                 coupon: req.body.couponName ? req.body.couponName : "",
//                 couponUsed: req.body.couponData ? true : false
//             });

//             if (req.body.status) {
//                 order.status = "Payment Failed";
//                 console.log("Payment Failed  ", order.status);
//             }

//             const ordered = await order.save();
//             console.log("Order saved:", ordered);

//             // Update stock of each product
//             for (const product of productDet) {
//                 await Product.updateOne(
//                     { _id: product._id },
//                     { $inc: { stock: -product.quantity } }
//                 );
//                 console.log(`Stock updated for product: ${product.name}`);
//             }

//             const deletedCart = await Cart.deleteMany({ userId: ID }).lean();
//             console.log("Deleted cart items:", deletedCart);
//         };

//         if (addressId) {
//             if (payMethod === "cash-on-delivery") {
//                 console.log("CASH ON DELIVERY");
//                 await saveOrder();
//                 res.json({ COD: true });
//             } else if (payMethod === "razorpay") {
//                 const amount = grandTotal;
//                 let instance = new Razorpay({
//                     key_id: "rzp_test_QhDPSiMt8ea6IF",
//                     key_secret: "5wg9GfJ3ESDupFYCxdSpPbRP"
//                 });
//                 const order = await instance.orders.create({
//                     amount: amount * 100, // paise 1rupee=100paise
//                     currency: "INR",
//                     receipt: "Ahamathbasha"
//                 });
//                 await saveOrder();
//                 res.json({ razorPaySucess: true, order, amount });
//             } else if (payMethod === "wallet") {
//                 console.log("Current Wallet Balance:", userData.wallet);
//                 const newWallet = userData.wallet - grandTotal;
//                 console.log("Updated Wallet Balance:", newWallet);

//                 // Update the user's wallet and history
//                 await User.findByIdAndUpdate(
//                     userData._id,
//                     {
//                         $set: { wallet: newWallet },
//                         $push: {
//                             history: {
//                                 amount: grandTotal,
//                                 status: "debit",
//                                 date: new Date()
//                             }
//                         }
//                     },
//                     { new: true }
//                 );

//                 await saveOrder();
//                 res.json({ walletSuccess: true });
//             }
//         }
//     } catch (error) {
//         console.log("Error during order placement:", error.message);
//         res.status(500).send("Internal Server Error");
//     }
// };

// const placeorder = async (req, res) => {
//   try {
//     console.log("Place order process started");

//     const userData = await User.findById(req.session.user._id).lean();
//     const ID = new mongoose.Types.ObjectId(userData._id);
//     const addressId = req.body.selectedAddress;
//     const payMethod = req.body.selectedPayment;
//     let subtotal = req.body.amount; // This should be the product price without delivery charge
//     console.log("Request Body Data: ", addressId, payMethod, subtotal);

//     const result = Math.random().toString(36).substring(2, 7);
//     const id = Math.floor(100000 + Math.random() * 900000);
//     const ordeId = result + id;

//     const productInCart = await Cart.aggregate([
//       { $match: { userId: ID } },
//       {
//         $lookup: {
//           from: "products",
//           foreignField: "_id",
//           localField: "product_Id",
//           as: "productData"
//         }
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
//           image: { $arrayElemAt: ["$productData.imageUrl", 0] }
//         }
//       }
//     ]);
//     console.log("Products in cart:", productInCart);

//     let productDet = productInCart.map((item) => ({
//       _id: item.product_Id,
//       name: item.name,
//       price: item.price,
//       quantity: item.quantity,
//       image: item.image[0]
//     }));
//     console.log("Aggregated cart products:", productDet);

//     // Apply coupon if present
//     let discountAmt = 0;
//     let finalProductTotal = subtotal;

//     if (req.body.couponData) {
//       console.log("Coupon data received:", req.body.couponData);
//       discountAmt = req.body.couponData.discountAmt; // Discount value should be 30 in this case
//       finalProductTotal = req.body.couponData.newTotal; // New total after discount from applyCoupon
//     }

//     console.log("discountAmt we get", discountAmt);

//     const DELIVERY_CHARGE = 50;

//     // Check if coupon is applied; if yes, don't add delivery charge to final product total
//     const grandTotal = req.body.couponData ? subtotal : finalProductTotal + DELIVERY_CHARGE;

//     console.log("Final product total after discount:", finalProductTotal); // Should be 720 (750 - 30)
//     console.log("Grand total (final product total + delivery charge):", grandTotal); // Should be 770 (720 + 50 or 720 without delivery charge)

//     // Save the order
//     let saveOrder = async () => {
//       const order = new Order({
//         userId: ID,
//         product: productDet,
//         address: addressId,
//         orderId: ordeId,
//         subtotal: subtotal, // original subtotal (without discount)
//         total: grandTotal, // grand total after discount and delivery charge
//         paymentMethod: payMethod,
//         discountAmt: discountAmt, // coupon discount applied
//         amountAfterDscnt: finalProductTotal, // the product total after discount
//         deliveryCharge: req.body.couponData ? 0 : DELIVERY_CHARGE, // Only apply delivery charge if no coupon
//         coupon: req.body.couponName ? req.body.couponName : "",
//         couponUsed: req.body.couponData ? true : false
//       });

//       if (req.body.status) {
//         order.status = "Payment Failed";
//         console.log("Payment Failed  ", order.status);
//       }

//       const ordered = await order.save();
//       console.log("Order saved:", ordered);

//       // Update stock of each product
//       for (const product of productDet) {
//         await Product.updateOne(
//           { _id: product._id },
//           { $inc: { stock: -product.quantity } }
//         );
//         console.log(`Stock updated for product: ${product.name}`);
//       }

//       const deletedCart = await Cart.deleteMany({ userId: ID }).lean();
//       console.log("Deleted cart items:", deletedCart);
//     };

//     // Check the payment method
//     if (addressId) {
//       if (payMethod === "cash-on-delivery") {
//         console.log("Cash on Delivery");
//         await saveOrder();
//         res.json({ COD: true });
//       } else if (payMethod === "razorpay") {
//         const amount = grandTotal;
//         let instance = new Razorpay({
//           key_id: "rzp_test_QhDPSiMt8ea6IF",
//           key_secret: "5wg9GfJ3ESDupFYCxdSpPbRP"
//         });
//         const order = await instance.orders.create({
//           amount: amount * 100, // paise 1rupee=100paise
//           currency: "INR",
//           receipt: "Ahamathbasha"
//         });
//         await saveOrder();
//         res.json({ razorPaySucess: true, order, amount });
//       } else if (payMethod === "wallet") {
//         console.log("Current Wallet Balance:", userData.wallet);
//         const newWallet = userData.wallet - grandTotal;
//         console.log("Updated Wallet Balance:", newWallet);

//         // Update the user's wallet and history
//         await User.findByIdAndUpdate(
//           userData._id,
//           {
//             $set: { wallet: newWallet },
//             $push: {
//               history: {
//                 amount: grandTotal,
//                 status: "debit",
//                 date: new Date()
//               }
//             }
//           },
//           { new: true }
//         );

//         await saveOrder();
//         res.json({ walletSuccess: true });
//       }
//     }
//   } catch (error) {
//     console.log("Error during order placement:", error.message);
//     res.status(500).send("Internal Server Error");
//   }
// };

const placeorder = async (req, res) => {
  try {
    console.log("Place order process started");

    const userData = await User.findById(req.session.user._id).lean();
    const ID = new mongoose.Types.ObjectId(userData._id);
    const addressId = req.body.selectedAddress;
    const payMethod = req.body.selectedPayment;
    let subtotal = req.body.amount; // This should be the product price without delivery charge
    console.log("Request Body Data: ", addressId, payMethod, subtotal);

    const result = Math.random().toString(36).substring(2, 7);
    const id = Math.floor(100000 + Math.random() * 900000);
    const ordeId = result + id;

    const productInCart = await Cart.aggregate([
      { $match: { userId: ID } },
      {
        $lookup: {
          from: "products",
          foreignField: "_id",
          localField: "product_Id",
          as: "productData"
        }
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
          image: { $arrayElemAt: ["$productData.imageUrl", 0] }
        }
      }
    ]);
    console.log("Products in cart:", productInCart);

    let productDet = productInCart.map((item) => ({
      _id: item.product_Id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image[0]
    }));
    console.log("Aggregated cart products:", productDet);

    // Apply coupon if present
    let discountAmt = 0;
    let finalProductTotal = subtotal;

    if (req.body.couponData) {
      console.log("Coupon data received:", req.body.couponData);
      discountAmt = req.body.couponData.discountAmt; // Discount value should be 30 in this case
      finalProductTotal = req.body.couponData.newTotal; // New total after discount from applyCoupon
    }

    console.log("discountAmt we get", discountAmt);

    const DELIVERY_CHARGE = 50;

    // Check if coupon is applied; if yes, don't add delivery charge to final product total
    const grandTotal = req.body.couponData ? subtotal : finalProductTotal + DELIVERY_CHARGE;

    console.log("Final product total after discount:", finalProductTotal); // Should be 720 (750 - 30)
    console.log("Grand total (final product total + delivery charge):", grandTotal); // Should be 770 (720 + 50 or 720 without delivery charge)

    // Save the order
    let saveOrder = async () => {
      const order = new Order({
        userId: ID,
        product: productDet,
        address: addressId,
        orderId: ordeId,
        subtotal: subtotal, // original subtotal (without discount)
        total: grandTotal, // grand total after discount and delivery charge
        paymentMethod: payMethod,
        discountAmt: discountAmt, // coupon discount applied
        amountAfterDscnt: finalProductTotal, // the product total after discount
        deliveryCharge: req.body.couponData ? 0 : DELIVERY_CHARGE, // Only apply delivery charge if no coupon
        coupon: req.body.couponName ? req.body.couponName : "",
        couponUsed: req.body.couponData ? true : false
      });

      if (req.body.status) {
        order.status = "Payment Failed";
        console.log("Payment Failed  ", order.status);
      }

      const ordered = await order.save();
      console.log("Order saved:", ordered);

      productDet.forEach(async (product)=>{
        await Product.updateMany(
          {_id:product._id},
          {$inc:{stock:-product.quantity,bestSelling:1}}
        )
      })

      productDet.forEach(async (product)=>{
        const populatedProd=await Product.findById(product._id).populate("category").lean()
        await Category.updateMany({_id:populatedProd.category._id},{$inc:{bestSelling:1}})
      })

      const deletedCart = await Cart.deleteMany({ userId: ID }).lean();
      console.log("Deleted cart items:", deletedCart);
    };

    // Check the payment method
    if (addressId) {
      if (payMethod === "cash-on-delivery") {
        console.log("Cash on Delivery");
        await saveOrder();
        res.json({ COD: true });
      } else if (payMethod === "razorpay") {
        const amount = grandTotal;
        let instance = new Razorpay({
          key_id: "rzp_test_QhDPSiMt8ea6IF",
          key_secret: "5wg9GfJ3ESDupFYCxdSpPbRP"
        });
        const order = await instance.orders.create({
          amount: amount * 100, // paise 1rupee=100paise
          currency: "INR",
          receipt: "Ahamathbasha"
        });
        await saveOrder();
        res.json({ razorPaySucess: true, order, amount });
      } else if (payMethod === "wallet") {
        console.log("Current Wallet Balance:", userData.wallet);
        const newWallet = userData.wallet - grandTotal;
        console.log("Updated Wallet Balance:", newWallet);

        // Update the user's wallet and history
        await User.findByIdAndUpdate(
          userData._id,
          {
            $set: { wallet: newWallet },
            $push: {
              history: {
                amount: grandTotal,
                status: "debit",
                date: new Date()
              }
            }
          },
          { new: true }
        );

        await saveOrder();
        res.json({ walletSuccess: true });
      }
    }
  } catch (error) {
    console.log("Error during order placement:", error.message);
    res.status(500).send("Internal Server Error");
  }
};


const orderSuccess=async(req,res)=>{
    try{
        res.render("user/order_success")
    }catch(error){
        console.log(error)
        res.status(500).send("internal server error")
    }
}

const validateCoupon=async(req,res)=>{
    try{
       const {couponVal,subTotal}=req.body
       console.log(couponValsubTotal)

       const coupon=await Coupon.findOne({code:couponVal})

       if(!coupon){
        res.json("invalid")
       }else if(coupon.expiryDate< new Date()){
        res.json("expired")
       }else if(subTotal < coupon.minPurchase){
        res.json("Minimum Amount required")
       }else{
        const couponId=coupon._id
        const discount=coupon.discount;
        const userId=req.session.user._id
        const isCpnAlreadyUsed=await Coupon.findOne({
            _id:couponId,
            usedBy:{$in:[userId]},
        })

        if(isCpnAlreadyUsed){
            res.json("already used")
        }else{
            const discnt=Number(discount)
            const discountAmt=(subTotal * discnt)/100
            const newTotal=subTotal-discountAmt

            const user=User.findById(userId)

            res.json({
                discountAmt,
                newTotal,
                discount,
                succes:"success"
            })
        }
       }
    }catch(error){
        console.log(error)
    }
}

const applyCoupon=async(req,res)=>{
    try{
        const {couponVal,subTotal}=req.body
        const coupon=await Coupon.findOne({code:couponVal})
        const userId=req.session.user._id

        if(!coupon){
            return res.json({status:"invalid"})
        }else if(coupon.expiryDate < new Date()){
            return res.json({status:"expired"})
        }else if(coupon.usedBy.includes(userId)){
            return res.json({status:"already_used"})
        }else if(subTotal < coupon.minPurchase){
            return res.json({status:"min_purchase_not_met"})
        }else{
            await Coupon.updateOne(
                {_id:coupon._id},
                {$push:{usedBy:userId}}
            )
        
            let discountAmt=(subTotal * coupon.discount)/100
            if(discountAmt > coupon.maxDiscount){
                discountAmt=coupon.maxDiscount
            }
            const newTotal=subTotal-discountAmt

            console.log("subtotal value",subTotal)

            console.log("newTotal while applying the coupon",newTotal)

            return res.json({
                discountAmt,
                newTotal,
                discount:coupon.discount,
                status:"applied",
                couponVal
            })
        }
    }catch(error){
        console.log(error.message)
    }
}


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

module.exports={
    loadCheckoutPage,
    placeorder,
    orderSuccess,
    validateCoupon,
    applyCoupon,
    removeCoupon
}