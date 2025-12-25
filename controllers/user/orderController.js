const Product=require("../../models/productModel")
const User=require("../../models/userModel")
const Address=require("../../models/addressModel")
const Order=require("../../models/orderModel")
const Coupon=require("../../models/couponModel")
const ProductOffer=require("../../models/productOfferModel")
const mongoose=require('mongoose')
const PDFDocument=require("pdfkit")
const moment = require('moment');



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
        const count=await Order.countDocuments({userId:new mongoose.Types.ObjectId(id)})
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
      console.log("Order ID:", orderId);
      const user = req.session.user;

      if (!user) {
          // If the user is not logged in, redirect to login
          return res.redirect('/login');
      }

      const userId = user._id;

      // Fetch user data and order details
      const userData = await User.findById(userId).lean();
      const myOrderDetails = await Order.findById(orderId).lean();

      if (!myOrderDetails) {
          return res.status(400).send("Order not found");
      }

      // Check if the logged-in user is the owner of the order
      if (myOrderDetails.userId.toString() !== userId.toString()) {
          // If the user doesn't own the order, redirect them to an error page or home
          return res.redirect('/error'); // Or use an appropriate route
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

      // Render the order details page for the correct user
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
      const { reason } = req.body;
      console.log('Order ID:', id);

      if (!mongoose.Types.ObjectId.isValid(id)) {
          console.log('Invalid order ID');
          return res.status(400).json({ success: false, error: 'Invalid order ID' });
      }

      const ID = new mongoose.Types.ObjectId(id);

      let canceledOrder = await Order.findOne({ _id: ID }).lean();

      if (!canceledOrder) {
          console.log('Order not found');
          return res.status(404).json({ success: false, error: 'Order not found' });
      }

      // Update order status to "Cancelled"
      await Order.updateOne({ _id: ID }, { $set: { status: 'Cancelled', Reason: reason } });

      // Lookup product offers and join with product data
      const productDetails = await Product.aggregate([
          { $match: { _id: { $in: canceledOrder.product.map(p => p._id) } } },
          {
              $lookup: {
                  from: 'productoffers',
                  localField: '_id',
                  foreignField: 'productId',
                  as: 'offerDetails'
              }
          },
          { $unwind: { path: '$offerDetails', preserveNullAndEmptyArrays: true } } // Unwind offers if any
      ]);

      // Update stock for each product and mark as cancelled
      for (const product of canceledOrder.product) {
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

      // Calculate the total refund amount, considering product offers and coupon
      let totalRefund = 0;
      let totalProductAmount = 0;
      const DELIVERY_CHARGE = 50;

      // Calculate total product amount (before coupon)
      canceledOrder.product.forEach((product) => {
          totalProductAmount += product.price * product.quantity;
      });

      // Subtract coupon amount (if any)
      let totalAmountAfterCoupon = totalProductAmount;
      if (canceledOrder.coupon) {
          totalAmountAfterCoupon -= canceledOrder.discountAmt;
      }

      console.log('Total amount after coupon (before delivery): ₹', totalAmountAfterCoupon);

      // Loop through products and calculate refund considering offers
      for (const product of canceledOrder.product) {
          if (!product.isCancelled) {
              const productDetail = productDetails.find(p => p._id.toString() === product._id.toString());
              let productTotal = 0;

              // Check if product has a product offer
              if (productDetail && productDetail.offerDetails) {
                  const offer = productDetail.offerDetails;
                  if (offer.discountPrice) {
                      // If offer has a discounted price
                      productTotal = offer.discountPrice * product.quantity;
                  } else if (offer.discountPercentage) {
                      // If offer has a discount percentage
                      const discount = (product.price * offer.discountPercentage) / 100;
                      productTotal = (product.price - discount) * product.quantity;
                  }
              } else {
                  // No offer, use regular price
                  productTotal = product.price * product.quantity;
              }

              // Subtract coupon amount if applicable
              if (canceledOrder.coupon) {
                  productTotal -= canceledOrder.discountAmt / canceledOrder.product.length;
              }

              totalRefund += Math.max(0, productTotal); // Ensure no negative refund
          }
      }

      console.log('Total Refund (before delivery charge): ₹', totalRefund);

      // Add delivery charge to the total refund (if applicable)
      //totalRefund += DELIVERY_CHARGE;

      console.log('Total Refund (including delivery charge): ₹', totalRefund);

      // Handle wallet update if payment method is wallet or razorpay
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
                          status: 'Refund for Order Cancellation',
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
      const { reason } = req.body;

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
      await Order.findByIdAndUpdate(ID, { $set: { status: 'Returned', Reason: reason } }, { new: true });

      // Lookup product offers and join with product data
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

      // Loop through the products and mark them as returned if not already cancelled or returned
      for (const product of returnedOrder.product) {
          if (!product.isCancelled && !product.isReturned) { // Check if not cancelled and not already returned
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

      // Calculate the refund amount for each product that is eligible for return
      let couponAmountEach = 0;
      if (returnedOrder.coupon) {
          couponAmountEach = returnedOrder.discountAmt / returnedOrder.product.length;
      }

      // Handle wallet or razorpay payment methods
      if (['wallet', 'razorpay'].includes(returnedOrder.paymentMethod)) {
          // Calculate the refund amount for all eligible products
          for (const product of returnedOrder.product) {
              if (!product.isCancelled && !product.isReturned) { // Only consider eligible products
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

                  totalRefund += Math.max(0, productTotal); // Ensure no negative refunds
                  console.log(`Product total before delivery charge: ₹${productTotal}`);
              }
          }

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

          // Calculate the refund amount for all eligible products before subtracting delivery charge
          for (const product of returnedOrder.product) {
              if (!product.isCancelled && !product.isReturned) { // Only consider eligible products
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

                  codRefundAmount += Math.max(0, productTotal); // Ensure no negative refunds
                  console.log(`COD Product total before delivery charge: ₹${productTotal}`);
              }
          }

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
    const { id, prodId, reason } = req.body; // Get reason from request body
    console.log(id, prodId, reason);

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(prodId)) {
      return res.status(500).json({ error: 'Invalid order or product ID' });
    }

    const ID = new mongoose.Types.ObjectId(id);
    const PRODID = new mongoose.Types.ObjectId(prodId);

    // Find the updated order and mark the product as cancelled
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: ID, 'product._id': PRODID },
      { $set: { 'product.$.isCancelled': true, Reason: reason } },
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

    // Update stock for the cancelled product
    await Product.findOneAndUpdate(
      { _id: PRODID },
      { $inc: { stock: productQuantity } }
    );

    // Calculate new total for the order after cancellation
    let newTotal = updatedOrder.total - productPrice; // Subtract the cancelled product price from the total

    // Update the order with the new total
    // await Order.updateOne(
    //   { _id: ID },
    //   { $set: { total: newTotal } }
    // );

    // Handle coupon refund logic if coupon is used
    if (updatedOrder.couponUsed) {
      const coupon = await Coupon.findOne({ code: updatedOrder.coupon });

      // Calculate the discount per product
      const totalProductsInOrder = updatedOrder.product.length;
      const discountPerProduct = coupon.maxDiscount / totalProductsInOrder;

      // Calculate the discount amount for the cancelled product
      const discountAmt = (discountPerProduct * productQuantity);

      // Refund calculation after applying discount
      const refundAmount = productPrice - discountAmt;

      // Refund the user
      await User.updateOne(
        { _id: req.session.user._id },
        { $inc: { wallet: refundAmount } }
      );

      await User.updateOne(
        { _id: req.session.user._id },
        {
          $push: {
            history: {
              amount: refundAmount,
              status: `refund of (after discount): ${result.product[0].name}`,
              date: Date.now()
            }
          }
        }
      );
      
    } else {
      // If no coupon was used, refund the original price of the cancelled product
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
      await Order.updateOne({ _id: ID }, { $set: { status: 'Cancelled' } });
    }

    res.json({ success: true, message: 'Successfully removed product and updated total' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'An error occurred while cancelling the product' });
  }
};

const returnOneProduct = async (req, res) => {
  try {
    const { id, prodId, reason } = req.body; // Get reason from request body
    console.log(id, prodId, reason);

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(prodId)) {
      return res.status(500).json({ error: 'Invalid order or product ID' });
    }

    const ID = new mongoose.Types.ObjectId(id);
    const PRODID = new mongoose.Types.ObjectId(prodId);

    // Find the updated order and check if the product is canceled before returning
    const updatedOrder = await Order.findOne({ _id: ID, 'product._id': PRODID }).lean();

    if (!updatedOrder) {
      return res.status(500).json({ error: 'Order or product not found' });
    }

    const product = updatedOrder.product.find(p => p._id.toString() === PRODID.toString());

    // If the product is canceled, refund should be zero
    if (product.isCancelled) {
      return res.json({
        success: false,
        message: 'This product is already cancelled. No refund will be processed.'
      });
    }

    // Mark the product as returned
    await Order.updateOne(
      { _id: ID, 'product._id': PRODID },
      { $set: { 'product.$.isReturned': true, Reason: reason } }
    );

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

    // Calculate new total for the order after returning the product
    let newTotal = updatedOrder.total - productPrice; // Subtract the returned product price from the total

    // Handle coupon refund logic if coupon was used
    if (updatedOrder.couponUsed) {
      const coupon = await Coupon.findOne({ code: updatedOrder.coupon });

      // Calculate the discount per product
      const totalProductsInOrder = updatedOrder.product.length;
      const discountPerProduct = coupon.maxDiscount / totalProductsInOrder;

      // Apply the discount for the returned product
      const discountAmt = (discountPerProduct * productQuantity);

      // Calculate refund amount after applying discount
      const refundAmount = productPrice - discountAmt;

      // Refund the user
      await User.updateOne(
        { _id: req.session.user._id },
        { $inc: { wallet: refundAmount } }
      );
      
      await User.updateOne(
        { _id: req.session.user._id },
        {
          $push: {
            history: {
              amount: refundAmount,
              status: `[return] refund of (after discount): ${result.product[0].name}`,
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

    res.json({ success: true, message: 'Successfully returned product and updated total' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: 'An error occurred while processing the return' });
  }
};

const getInvoice = async (req, res) => {
  try {
    const orderId = req.query.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const { userId, address: addressId, product: orderProducts } = order;
    const [user, address] = await Promise.all([
      User.findById(userId),
      Address.findById(addressId)
    ]);

    if (!user || !address) {
      return res.status(404).json({ message: "User or address not found" });
    }

    // Apply offers
    const productOffers = await ProductOffer.find({
      productId: { $in: orderProducts.map(p => p._id) },
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
      currentStatus: true,
    });

    let subtotal = 0;
    const items = orderProducts.map(item => {
      let price = parseFloat(item.price) || 0;
      const offer = productOffers.find(o => o.productId.toString() === item._id.toString());
      if (offer) {
        if (offer.discountPrice) {
          price = parseFloat(offer.discountPrice) || price;
        } else if (offer.productOfferPercentage) {
          const percentage = parseFloat(offer.productOfferPercentage) || 0;
          price = price - (price * percentage / 100);
        }
      }
      const quantity = parseInt(item.quantity) || 1;
      const total = price * quantity;
      subtotal += total;

      return {
        name: item.name || "Unknown Product",
        quantity: quantity,
        price: price.toFixed(2),
        total: total.toFixed(2),
      };
    });

    const deliveryCharge = parseFloat(order.deliveryCharge) || 50;
    subtotal += deliveryCharge;
    const discountAmt = parseFloat(order.discountAmt) || 0;
    const grandTotal = subtotal - discountAmt;

    // Create PDF
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice_${orderId}.pdf"`);

    // Pipe PDF directly to response
    doc.pipe(res);

    // Title
    doc.fontSize(26).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica')
      .text(`Invoice No: INV-${orderId.slice(-8)}`, { align: 'center' })
      .text(`Date: ${moment(order.date).format('MMMM D, YYYY')}`, { align: 'center' });
    doc.moveDown(2);

    // Company and Customer Info
    const startY = doc.y;

    // From (Company)
    doc.fontSize(14).font('Helvetica-Bold').text('From:', 50, startY);
    doc.fontSize(11).font('Helvetica')
      .text('BASHA BOOK', 50, startY + 20)
      .text('Park Avenue', 50, startY + 35)
      .text('Chennai - 600034', 50, startY + 50)
      .text('Tamil Nadu, India', 50, startY + 65);

    // Bill To (Customer)
    doc.fontSize(14).font('Helvetica-Bold').text('Bill To:', 300, startY);
    doc.fontSize(11).font('Helvetica')
      .text(user.name || 'Customer', 300, startY + 20)
      .text(address.adressLine1 || address.addressLine1 || 'N/A', 300, startY + 35)
      .text(`${address.city || ''}, ${address.state || ''} - ${address.pin || ''}`, 300, startY + 50)
      .text(`Mobile: ${address.mobile || 'N/A'}`, 300, startY + 65);

    doc.moveDown(6);

    // Table setup
    const tableTop = doc.y + 20;
    const tableLeft = 50;
    const colWidths = [220, 80, 100, 100]; // Description, Qty, Price, Total

    // Header
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text('Item Description', tableLeft, tableTop);
    doc.text('Qty', tableLeft + colWidths[0], tableTop, { width: colWidths[1], align: 'right' });
    doc.text('Unit Price', tableLeft + colWidths[0] + colWidths[1], tableTop, { width: colWidths[2], align: 'right' });
    doc.text('Total', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop, { width: colWidths[3], align: 'right' });

    // Header line
    doc.moveTo(tableLeft, tableTop + 18)
       .lineTo(tableLeft + 500, tableTop + 18)
       .stroke();

    // Body
    doc.font('Helvetica').fontSize(11);
    let y = tableTop + 35;

    items.forEach(item => {
      doc.text(item.name, tableLeft, y, { width: colWidths[0] });

      doc.text(item.quantity.toString(), tableLeft + colWidths[0], y, {
        width: colWidths[1],
        align: 'right'
      });

      doc.text(item.price, tableLeft + colWidths[0] + colWidths[1], y, {
        width: colWidths[2],
        align: 'right'
      });

      doc.text(item.total, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y, {
        width: colWidths[3],
        align: 'right'
      });

      y += 30;
    });

    // Delivery Charge
    doc.text('Delivery Charge', tableLeft, y, { width: colWidths[0] });
    doc.text(deliveryCharge.toFixed(2), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y, {
      width: colWidths[3],
      align: 'right'
    });
    y += 30;

    // Discount
    if (discountAmt > 0) {
      doc.text('Discount', tableLeft, y, { width: colWidths[0] });
      doc.text(`-${discountAmt.toFixed(2)}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y, {
        width: colWidths[3],
        align: 'right'
      });
      y += 30;
    }

    // Grand Total
    y += 20;
    doc.font('Helvetica-Bold').fontSize(16);
    doc.text('Grand Total', tableLeft, y);
    doc.text(grandTotal.toFixed(2), tableLeft + colWidths[0] + colWidths[1] + colWidths[2], y, {
      width: colWidths[3],
      align: 'right'
    });

    // Footer
    doc.moveDown(8);
    doc.fontSize(10).font('Helvetica').text('Thank you for shopping with BASHA BOOK!', { align: 'center' });
    doc.text('For support: support@bashabook.com', { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error("PDFKit Invoice error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Error generating invoice", error: error.message });
    }
  }
};
const verify=(req,res)=>{
  console.log(req.body.payment,"end")
  const {orderId}=req.body
  //destructuring the razorpay order id,payment id,signature provided by the razorpay that verify the integrity of the payment
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