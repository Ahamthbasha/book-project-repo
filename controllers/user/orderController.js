const Product=require("../../models/productModel")
const User=require("../../models/userModel")
const Address=require("../../models/addressModel")
const Order=require("../../models/orderModel")
const Coupon=require("../../models/couponModel")
const ProductOffer=require("../../models/productOfferModel")
const moment=require('moment')
const mongoose=require('mongoose')
const easyinvoice=require('easyinvoice')



const my_Orders=async(req,res)=>{
    try{
        const user=req.session.user
        const id=user._id
        const userData=await User.findById(id).lean()
        var page=1
        if(req.query.page){
            page=req.query.page
        }
        let limit=5
        const skip=(page-1)*limit
        console.log(userData,"userdata")
        const myOrders=await Order.aggregate([
            {
                $match:{
                    userId:new mongoose.Types.ObjectId(id)
                },
            },
            {
                $project:{
                    _id:1,
                    date:1,
                    orderId:1,
                    status:1,
                    total:1,
                },
            },
            {
                $sort:{
                    date:-1,
                },
            },
            {
                $skip:skip,
            },
            {
                $limit:limit,
            },
        ])
        const count=await Order.find({}).countDocuments()
        const totalPages=Math.ceil(count/limit)
        const pages=Array.from({length:totalPages},(_,i)=>i+1)
        console.log(myOrders,"myOrders")
        res.render("user/myOrders",{
            userData:userData,
            myOrders,
            pages,
            currentPage:page
        })
    }catch(error){
        console.log(error)
        res.status(500).send("Internal server error")
    }
}

const orderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const user = req.session.user;
        const userId = user._id;

        // Fetch user data and order details
        const userData = await User.findById(userId).lean();
        const myOrderDetails = await Order.findById(orderId).lean();

        if (!myOrderDetails) {
            return res.status(400).send("Order not found");
        }

        // Format the date
        myOrderDetails.date = moment(myOrderDetails.date).format('ddd MMM DD YYYY');

        // Fetch ordered product details
        const orderedProDet = await Order.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(orderId) } },
            { $unwind: "$product" },
            { $project: { _id: 1, product: 1 } }
        ]);

        // Fetch address
        const address = await Address.findOne({ userId: userId }).lean();

        // Fetch product offers for each product in the order
        const productIds = orderedProDet.map(item => item.product._id);
        const productOffers = await ProductOffer.find({
            productId: { $in: productIds },
            currentStatus: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        }).lean();

        // Create a map for quick access to offers
        const offerMap = {};
        productOffers.forEach(offer => {
            offerMap[offer.productId] = offer;
        });

        // Enhance ordered products with pricing logic
        const enhancedOrderedProDet = orderedProDet.map(item => {
            const offer = offerMap[item.product._id];
            if (offer) {
                return {
                    ...item,
                    product: {
                        ...item.product,
                        discountPrice: offer.discountPrice,
                        originalPrice: item.product.price,
                    }
                };
            } else {
                return {
                    ...item,
                    product: {
                        ...item.product,
                        discountPrice: item.product.price,
                        originalPrice: item.product.price,
                    }
                };
            }
        });

        console.log("Address:", address);
        console.log("Order Details:", myOrderDetails);
        console.log("Ordered Product Details:", enhancedOrderedProDet);

        res.render("user/orderDetails", {
            totalprice: myOrderDetails.total,
            address,
            orderedProDet: enhancedOrderedProDet,
            myOrderDetails,
            userData
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
};

const cancelOrder = async (req, res) => {
    try {
        const id = req.params.id;
        console.log('Order ID:', id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log('Invalid order ID');
            return res.status(400).json({ success: false, error: 'Invalid order ID' });
        }

        const ID = new mongoose.Types.ObjectId(id);
        let DELIVERY_CHARGE = 50;

        let canceledOrder = await Order.findOne({ _id: ID });
        console.log('Canceled Order:', canceledOrder);

        if (!canceledOrder) {
            console.log('Order not found');
            return res.status(404).json({ success: false, error: 'Order not found' });
        }

        await Order.updateOne({ _id: ID }, { $set: { status: 'Cancelled' } });
        console.log('Order status updated to Cancelled');

        for (const product of canceledOrder.product) {
            // Increase the stock if the ordered product is not cancelled
            if (!product.isCancelled) {
                await Product.updateOne(
                    { _id: product._id },
                    { $inc: { stock: product.quantity }, $set: { isCancelled: true } }
                );

                await Order.updateOne(
                    { _id: ID, 'product._id': product._id },
                    { $set: { 'product.$.isCancelled': true } }
                );
                console.log('Product stock and cancellation status updated');
            }
        }

        let totalRefund = canceledOrder.total - DELIVERY_CHARGE
        console.log(totalRefund)
        if (['wallet', 'razorpay'].includes(canceledOrder.paymentMethod)) {
            await User.updateOne(
                { _id: req.session.user._id },
                { $inc: { wallet: totalRefund } }
            );

            await User.updateOne(
                { _id: req.session.user._id },
                {
                    $push: {
                        history: {
                            amount: totalRefund,
                            status: 'refund for Order Cancellation',
                            date: Date.now()
                        }
                    }
                }
            );
            console.log('Wallet updated and history entry added');
        }

        console.log('Successfully cancelled Order');
        res.json({
            success: true,
            message: 'Successfully cancelled Order'
        });
    } catch (error) {
        console.log('Error:', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

const returnOrder = async (req, res) => {
  try {
      const id = req.params.id;

      // Validate the order ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ error: 'Invalid order ID' });
      }
      const ID = new mongoose.Types.ObjectId(id);
      let totalRefund = 0;
      let DELIVERY_CHARGE = 50;

      // Find the order to be returned
      let returnedOrder = await Order.findOne({ _id: ID }).lean();
      console.log(returnedOrder, "returnedOrder");

      if (!returnedOrder) {
          return res.status(404).json({ error: 'Order not found' });
      }

      // Mark the order status as returned
      const returnedOrderStatus = await Order.findByIdAndUpdate(ID, { $set: { status: 'Returned' } }, { new: true });

      // Lookup the product offers and join with the product data
      const productDetails = await Product.aggregate([
          { $match: { _id: { $in: returnedOrder.product.map(p => p._id) } } },
          {
              $lookup: {
                  from: 'productoffers',  // Assuming your product offers are stored in a 'productoffers' collection
                  localField: '_id',
                  foreignField: 'productId', // Assuming the product offer references the product via 'productId'
                  as: 'offerDetails'
              }
          },
          { $unwind: { path: '$offerDetails', preserveNullAndEmptyArrays: true } } // Unwind in case no offer exists
      ]);

      // Loop through the products and mark them as returned if not already cancelled
      for (const product of returnedOrderStatus.product) {
          if (!product.isCancelled) {
              await Product.updateOne(
                  { _id: product._id },
                  { $inc: { stock: product.quantity } }
              );

              await Order.updateOne(
                  { _id: ID, 'product._id': product._id },
                  { $set: { 'product.$.isReturned': true } }
              );
          }
      }

      // Calculate the refund amount for each product
      let couponAmountEach = 0;
      if (returnedOrder.coupon) {
          couponAmountEach = returnedOrder.discountAmt / returnedOrder.product.length;
      }

      // Handle wallet or razorpay payment methods
      if (['wallet', 'razorpay'].includes(returnedOrder.paymentMethod)) {
          // First, calculate the refund amount for all products
          for (const product of returnedOrder.product) {
              const productDetail = productDetails.find(p => p._id.toString() === product._id.toString());
              let productTotal = 0;

              // Check if product has a product offer and adjust the price accordingly
              if (productDetail && productDetail.offerDetails) {
                  const offer = productDetail.offerDetails;
                  // Assuming the product offer has discountPrice or discountPercentage
                  if (offer.discountPrice) {
                      // If the product offer contains a discounted price
                      productTotal = (offer.discountPrice * product.quantity) - couponAmountEach;
                  } else if (offer.discountPercentage) {
                      // If the product offer contains a discount percentage
                      const discount = (product.price * offer.discountPercentage) / 100;
                      productTotal = ((product.price - discount) * product.quantity) - couponAmountEach;
                  }
              } else {
                  // If no product offer, calculate using the regular price
                  productTotal = (product.price * product.quantity) - couponAmountEach;
              }

              totalRefund += productTotal;
              console.log(`Product total before delivery charge: ₹${productTotal}`);
          }

          // Now, the totalRefund should reflect the correct refund amount
          // Do not subtract the delivery charge here since it's not part of the refund
          console.log(`Total refund (without delivery charge): ₹${totalRefund}`);

          // Update the wallet balance for the user
          await User.updateOne(
              { _id: req.session.user._id },
              { $inc: { wallet: totalRefund } }
          );

          // Record the refund transaction in the user's history
          await User.updateOne(
              { _id: req.session.user._id },
              {
                  $push: {
                      history: {
                          amount: totalRefund,
                          status: 'Refund for Order Return',
                          date: Date.now()
                      }
                  }
              }
          );
          console.log('Wallet updated and refund history added');
      }

      // Special case for COD (Cash on Delivery) orders: Refund the amount to wallet
      if (returnedOrder.status === 'Delivered' && returnedOrder.paymentMethod === 'cash-on-delivery') {
          let codRefundAmount = 0;

          // Calculate the refund amount for all products before subtracting delivery charge
          for (const product of returnedOrder.product) {
              const productDetail = productDetails.find(p => p._id.toString() === product._id.toString());
              let productTotal = 0;

              // Check if product has a product offer and adjust the price accordingly
              if (productDetail && productDetail.offerDetails) {
                  const offer = productDetail.offerDetails;
                  if (offer.discountPrice) {
                      productTotal = (offer.discountPrice * product.quantity);
                  } else if (offer.discountPercentage) {
                      const discount = (product.price * offer.discountPercentage) / 100;
                      productTotal = ((product.price - discount) * product.quantity);
                  }
              } else {
                  productTotal = (product.price * product.quantity);
              }

              codRefundAmount += productTotal;
              console.log(`COD Product total before delivery charge: ₹${productTotal}`);
          }

          // Now, codRefundAmount should reflect the correct refund amount
          // Do not subtract the delivery charge here since it's not part of the refund
          console.log(`COD refund (without delivery charge): ₹${codRefundAmount}`);

          // Update wallet balance for COD orders
          await User.updateOne(
              { _id: req.session.user._id },
              { $inc: { wallet: codRefundAmount } }
          );

          // Record the COD refund in the user's history
          await User.updateOne(
              { _id: req.session.user._id },
              {
                  $push: {
                      history: {
                          amount: codRefundAmount,
                          status: 'COD Order Return Refund',
                          date: Date.now()
                      }
                  }
              }
          );
          console.log('COD refund history added');
      }

      // Send response indicating successful order return
      res.json({
          success: true,
          message: 'Successfully Returned Order'
      });

  } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: 'Internal server error' });
  }
};

const cancelOneProduct = async (req, res) => {
  try {
    const { id, prodId } = req.body;
    console.log(id, prodId);

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(prodId)) {
      return res.status(500).json({ error: 'Invalid order or product ID' });
    }

    const ID = new mongoose.Types.ObjectId(id);
    const PRODID = new mongoose.Types.ObjectId(prodId);

    // Find the updated order
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: ID, 'product._id': PRODID },
      { $set: { 'product.$.isCancelled': true } },
      { new: true }
    ).lean();

    if (!updatedOrder) {
      return res.status(500).json({ error: 'Order or product not found' });
    }

    const result = await Order.findOne(
      { _id: ID, 'product._id': PRODID },
      { 'product.$': 1 }
    ).lean();

    const productQuantity = result.product[0].quantity;
    
    // Check if there's an offer for the product
    const productOffer = await ProductOffer.findOne({
      productId: PRODID,
      currentStatus: true,
      startDate: { $lte: Date.now() },
      endDate: { $gte: Date.now() }
    });

    // Use the offer price if there's an active offer, otherwise use the original price
    const productPrice = productOffer ? productOffer.discountPrice * productQuantity : result.product[0].price * productQuantity;

    await Product.findOneAndUpdate(
      {_id:PRODID},
      {$inc:{stock:productQuantity}}
    )

    // Get the total number of products in the order
    const totalProductsInOrder = updatedOrder.product.length;

    // Handle coupon refund logic if coupon is used
    if (updatedOrder.couponUsed) {
      const coupon = await Coupon.findOne({ code: updatedOrder.coupon });
      
      // Calculate the discount per product
      const discountPerProduct = coupon.maxDiscount / totalProductsInOrder;

      // Calculate the discount amount for the cancelled product
      const discountAmt = (discountPerProduct * productQuantity);

      // Calculate the new total after applying the discount
      const newTotal = productPrice - discountAmt;

      // Refund the user
      await User.updateOne(
        { _id: req.session.user._id },
        { $inc: { wallet: newTotal } }
      );
      await User.updateOne(
        { _id: req.session.user._id },
        {
          $push: {
            history: {
              amount: newTotal,
              status: `refund of: ${result.product[0].name}`,
              date: Date.now()
            }
          }
        }
      );
    } else {
      await User.updateOne(
        { _id: req.session.user._id },
        { $inc: { wallet: productPrice } }
      );
      await User.updateOne(
        { _id: req.session.user._id },
        {
          $push: {
            history: {
              amount: productPrice,
              status: `refund of: ${result.product[0].name}`,
              date: Date.now()
            }
          }
        }
      );
    }

    // Check if all products are cancelled, and if so, update the order status to "Cancelled"
    const allCancelled = updatedOrder.product.every(p => p.isCancelled);
    if (allCancelled) {
      // Update the order status to "Cancelled" even if the payment method is COD
      await Order.updateOne({ _id: ID }, { $set: { status: 'Cancelled' } });
    }

    res.json({ success: true, message: 'Successfully removed product' });
  } catch (error) {
    console.log(error.message);
  }
};

const returnOneProduct = async (req, res) => {
  try {
    const { id, prodId } = req.body;
    console.log(id, prodId);

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(prodId)) {
      return res.status(HttpStatus.BadRequest).json({ error: 'Invalid order or product ID' });
    }

    const ID = new mongoose.Types.ObjectId(id);
    const PRODID = new mongoose.Types.ObjectId(prodId);

    // Find the updated order and mark the product as returned
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: ID, 'product._id': PRODID },
      { $set: { 'product.$.isReturned': true } },
      { new: true }
    ).lean();

    if (!updatedOrder) {
      return res.status(HttpStatus.NotFound).json({ error: 'Order or product not found' });
    }

    const result = await Order.findOne(
      { _id: ID, 'product._id': PRODID },
      { 'product.$': 1 }
    ).lean();

    const productQuantity = result.product[0].quantity;

    // Check if there's an offer for the product
    const productOffer = await ProductOffer.findOne({
      productId: PRODID,
      currentStatus: true,
      startDate: { $lte: Date.now() },
      endDate: { $gte: Date.now() }
    });

    // Use the offer price if there's an active offer, otherwise use the original price
    const productPrice = productOffer ? productOffer.discountPrice * productQuantity : result.product[0].price * productQuantity;

    // Update stock
    await Product.findOneAndUpdate(
      { _id: PRODID },
      { $inc: { stock: productQuantity } }
    );

    // Handle coupon refund logic if coupon was used
    if (updatedOrder.couponUsed) {
      const coupon = await Coupon.findOne({ code: updatedOrder.coupon });

      // Calculate the discount per product
      const totalProductsInOrder = updatedOrder.product.length;
      const discountPerProduct = coupon.maxDiscount / totalProductsInOrder;

      // Apply the discount for the returned product
      const discountAmt = (discountPerProduct * productQuantity);

      // Calculate the new total after applying the discount
      const newTotal = productPrice - discountAmt;

      // Refund the user
      await User.updateOne(
        { _id: req.session.user._id },
        { $inc: { wallet: newTotal } }
      );
      await User.updateOne(
        { _id: req.session.user._id },
        {
          $push: {
            history: {
              amount: newTotal,
              status: `[return] refund of: ${result.product[0].name}`,
              date: Date.now()
            }
          }
        }
      );
    } else {
      // No coupon used, refund the original price
      await User.updateOne(
        { _id: req.session.user._id },
        { $inc: { wallet: productPrice } }
      );
      await User.updateOne(
        { _id: req.session.user._id },
        {
          $push: {
            history: {
              amount: productPrice,
              status: `[return] refund of: ${result.product[0].name}`,
              date: Date.now()
            }
          }
        }
      );
    }

    // Check if all products are returned, and if so, update the order status to "Returned"
    const allReturned = updatedOrder.product.every(p => p.isReturned);
    if (allReturned) {
      await Order.updateOne({ _id: ID }, { $set: { status: 'Returned' } });
    }

    res.json({ success: true, message: 'Successfully returned product' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'An error occurred while processing the return' });
  }
};


//below we use toString()?
// productId and productItem._id are probably objectId.It is unique.When comparing objectId values you can't directly compare them using the === operator because objectId instances are complex object.For that reason we convert it into string representation and compare it.
const getInvoice = async (req, res) => {
    try {
      const orderId = req.query.id;
      const order = await Order.findById(orderId);
  
      if (!order) {
        return res.status(500).send({ message: "Order not found" });
      }
      //destructure the order it take userId,address and product
  const { userId, address: addressId, product } = order;
      const [user, address] = await Promise.all([
        User.findById(userId),
        Address.findById(addressId),
      ]);
  
      if (!user || !address) {
        return res.status(500).send({ message: "User or address not found" });
      }
  
      // Log the fetched order and products
      console.log("Fetched Order:", order);
      console.log("Fetched Products:", product);
  
      // Get product offers for the products in the order
      const productOffers = await ProductOffer.find({
        productId: { $in: product.map(p => p._id) },  // Make sure we use the correct field (_id of the product).Matching the orders in the product array which has offer collection
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
        currentStatus: true,
      });
  
      // Log the fetched product offers
      console.log("Fetched Active Product Offers:", productOffers);
  
      // Map through products and apply offer if available
      const products = await Promise.all(
        product.map(async (productItem) => {
          // Log each product before applying the offer
          console.log("Processing Product:", productItem);
  
          // Find the offer for the current product
          const offer = productOffers.find(
            (offer) => offer.productId.toString() === productItem._id.toString()
          );
  
          let price = productItem.price;
          if (offer) {
            // Apply the discount if an offer exists
            console.log(`Found offer for ${productItem.name}:`, offer);
  
            // If there's a discountPrice, apply it. Otherwise, apply the percentage discount.
            price = offer.discountPrice || price - (price * offer.productOfferPercentage) / 100;
            console.log(`Discounted Price for ${productItem.name}: ${price}`);
          }
  
          return {
            quantity: productItem.quantity.toString(),
            description: productItem.name,
            tax: productItem.tax || 0,  // Make sure tax is set (default 0 if undefined)
            price: price, // Use the offer price if available
          };
        })
      );
  
      // Log the products array after applying offers
      console.log("Products after applying offers:", products);
  
      // Add the delivery charge
      products.push({
        quantity: "1",
        description: "Delivery Charge",
        tax: 0,
        price: 50,
      });
  
      // Log the complete products array with delivery charge
      console.log("Final Products with Delivery Charge:", products);
  
      const date = moment(order.date).format("MMMM D, YYYY");
  
      const data = {
        mode: "development",
        currency: "INR",
        taxNotation: "vat",
        marginTop: 25,
        marginRight: 25,
        marginLeft: 25,
        marginBottom: 25,
  
        sender: {
          company: "BASHA BOOK",
          address: "Park Avenue",
          zip: "600034",
          city: "Chennai",
          country: "India",
        },
        client: {
          company: user.name,
          address: address.adressLine1,
          zip: address.pin,
          city: address.city,
          country: "India",
        },
        information: {
          number: `INV-${orderId}`,
          date: date,
        },
        products: products,
      };
  
      easyinvoice.createInvoice(data, function (result) {
        const fileName = `invoice_${orderId}.pdf`;
        const pdfBuffer = Buffer.from(result.pdf, "base64");//convert it into the buffer format pdfBuffer = <Buffer 25 50 44 46 2d 31 2e 34 0a 25 ... >;

        res.setHeader("Content-Type", "application/pdf");//browser will understand content is in pdf format
        res.setHeader("Content-Disposition", `attachment;filename=${fileName}`);
        //content-disposition -it tells the browser how to handle the file
        //attachment tells the browser to treat the content as a downloadable file
        //filename the browser suggest this filename when downloading
        res.send(pdfBuffer);//response body will be in the binary format but the content will be transmitted to the client with the headers set earlier
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Error generating invoice", error: error.message });
    }
};

const verify=(req,res)=>{
  console.log(req.body.payment,"end")
  const {orderId}=req.body
  //destructuring the razorpay order id,payment id,signature proovided by the razorpay that verify the integrity of the payment
  const{razorpay_order_id,razorpay_payment_id,razorpay_signature}=req.body.payment

  //create a hash based message authentication code.hmac created using crypto module.sha256 is a hashing algorithm
  let hmac=crypto.createHmac("sha256",process.env.KEY_SECRET)

  hmac.update(
    `${razorpay_order_id}|${razorpay_payment_id}`
  )//standardway razorpay creates the HMAC signature.After updating the hmac with the info.We get the final HMAC value in a hexadecimal string format.
  hmac=hmac.digest("hex")

  console.log(hmac,"hmac")
  console.log(razorpay_signature,"signature")

  if(hmac === razorpay_signature){
    console.log("true")
    changeOrderStatusToConfirmed(orderId)//call the function to change the order status
    res.json({status:true})
  }else{
    console.log("false")
      res.json({status:false})
  }
}

const retryPayment=async(req,res)=>{
  try{
    const id=req.params.id
    console.log("Retry Payment for order ID:",id)

    const updatedOrder=await Order.findByIdAndUpdate(id,{$set:{status:'pending'}})

    if(!updatedOrder){
      return res.status(404).json({
        success:false,
        message:"Order not found"
      })
    }

    res.json({
      success:true,
      message:"Payment status has been set to 'pending'.you can retry the payment",
      order:updatedOrder
    })
  }catch(error){
    console.log(error)
  }
}

module.exports=
{
    my_Orders,
    orderDetails,
    cancelOrder,
    returnOrder,
    cancelOneProduct,
    returnOneProduct,
    getInvoice,
    verify,
    retryPayment
}