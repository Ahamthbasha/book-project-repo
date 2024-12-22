const Product=require("../../models/productModel")
const User=require("../../models/userModel")
const Address=require("../../models/addressModel")
const Order=require("../../models/orderModel")
const productOffer=require("../../models/productOfferModel")
const moment=require('moment')
const mongoose=require('mongoose')

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

// const orderDetails=async(req,res)=>{
//     try {
//         const orderId=req.params.id
//         const user=req.session.user
//         const userId=user._id
//         let totalprice
//         const userData=await User.findById(userId).lean()
//         const myOrderDetails=await Order.findById(orderId).populate('address').lean()
//         myOrderDetails.date=moment(myOrderDetails.date).format('ddd MMM DD YYYY')
//         await myOrderDetails.product.forEach((product)=>{
            
//             totalprice=product.price * product.quantity
//         })

//     if(!myOrderDetails){
//         return res.status(400).send("order not found")
//     }
    
//     const orderedProDet=await Order.aggregate([
//         {$match:{_id:new mongoose.Types.ObjectId(orderId)}},
//         {$unwind:"$product"},
//         {
//             $project:{
//                 _id:1,
//                 product:1
//             }
//         }
//     ])

//     const address=await Address.findOne(
//         {
//             userId:userId
//         }
//     ).lean()

//     console.log(address)

//     console.log("myorderDetails",myOrderDetails)
//     console.log("orderedProDet",orderedProDet)
//     totalprice=(myOrderDetails.total)
//     res.render("user/order_Details",{totalprice,address,orderedProDet,myOrderDetails,userData})
//     } catch (error) {
//         console.log(error)
//     }
// }

//older
// const orderDetails = async (req, res) => {
//     try {
//         const orderId = req.params.id;
//         const user = req.session.user;
//         const userId = user._id;
//         let totalprice;
//         const userData = await User.findById(userId).lean();
//         const myOrderDetails = await Order.findById(orderId).populate('address').lean();

//         myOrderDetails.date = moment(myOrderDetails.date).format('ddd MMM DD YYYY');

//         await myOrderDetails.product.forEach((product) => {
//             totalprice = product.price * product.quantity;
//         });

//         if (!myOrderDetails) {
//             return res.status(400).send("order not found");
//         }

//         const orderedProDet = await Order.aggregate([
//             { $match: { _id: new mongoose.Types.ObjectId(orderId) } },
//             { $unwind: "$product" },
//             {
//                 $project: {
//                     _id: 1,
//                     product: 1
//                 }
//             }
//         ]);

//         const address = await Address.findOne({
//             userId: userId
//         }).lean();

//         // Ensure coupon data is included in the response
//         const couponCode = myOrderDetails.couponCode || "None";  // Fallback to 'None' if no coupon applied
//         const discountAmount = myOrderDetails.discountAmount || 0;

//         totalprice = myOrderDetails.total;

//         res.render("user/order_Details", {
//             totalprice,
//             address,
//             orderedProDet,
//             myOrderDetails,
//             userData,
//             couponCode,
//             discountAmount  // Pass discount details to the view
//         });
//     } catch (error) {
//         console.log(error);
//     }
// };


// const cancelOrder = async (req, res) => {
//     try {
//         const id = req.params.id;
//         console.log('Order ID:', id);

//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             console.log('Invalid order ID');
//             return res.status(400).json({ success: false, error: 'Invalid order ID' });
//         }

//         const ID = new mongoose.Types.ObjectId(id);
//         let notCancelledAmt = 0;
//         let DELIVERY_CHARGE=50

//         let canceledOrder = await Order.findOne({ _id: ID });
//         console.log('Canceled Order:', canceledOrder);

//         if (!canceledOrder) {
//             console.log('Order not found');
//             return res.status(404).json({ success: false, error: 'Order not found' });
//         }

//         await Order.updateOne({ _id: ID }, { $set: { status: 'Cancelled' } });
//         console.log('Order status updated to Cancelled');

//         for (const product of canceledOrder.product) {
//             //if the ordered product is not cancelled based on the product id i increase the stock and set the order is cancelled 
//             if (!product.isCancelled) {
//                 await Product.updateOne(
//                     { _id: product._id },
//                     { $inc: { stock: product.quantity }, $set: { isCancelled: true } }
//                 );

//                 await Order.updateOne(
//                     { _id: ID, 'product._id': product._id },
//                     { $set: { 'product.$.isCancelled': true } }
//                 );
//                 console.log('Product stock and cancellation status updated');
//             }
//         }

//         if (['wallet', 'razorpay'].includes(canceledOrder.paymentMethod)) {
//             for (const data of canceledOrder.product) {
//                 await User.updateOne(
//                     { _id: req.session.user._id },
//                     //cash changes
//                     { $inc: { wallet: (data.price * data.quantity)+DELIVERY_CHARGE} }
//                 );
//                 notCancelledAmt += data.price * data.quantity;
//             }

//             await User.updateOne(
//                 { _id: req.session.user._id },
//                 {
//                     $push: {
//                         history: {
//                             amount: notCancelledAmt + DELIVERY_CHARGE,
//                             status: 'refund for Order Cancellation',
//                             date: Date.now()
//                         }
//                     }
//                 }
//             );
//             console.log('Wallet updated and history entry added');
//         }

//         console.log('Successfully cancelled Order');
//         res.json({
//             success: true,
//             message: 'Successfully cancelled Order'
//         });
//     } catch (error) {
//         console.log('Error:', error.message);
//         res.status(500).json({ success: false, message: 'Internal Server Error' });
//     }
// };

//18-12-2024
// const orderDetails = async (req, res) => {
//     try {
//         const orderId = req.params.id;
//         const user = req.session.user;
//         const userId = user._id;
//         const userData = await User.findById(userId).lean();
//         const myOrderDetails = await Order.findById(orderId).lean();
        
//         if (!myOrderDetails) {
//             return res.status(400).send("Order not found");
//         }

//         // Format the date
//         myOrderDetails.date = moment(myOrderDetails.date).format('ddd MMM DD YYYY');

//         const orderedProDet = await Order.aggregate([
//             { $match: { _id: new mongoose.Types.ObjectId(orderId) } },
//             { $unwind: "$product" },
//             { $project: { _id: 1, product: 1 } }
//         ]);

//         const address = await Address.findOne({ userId: userId }).lean();

//         console.log("Address:", address);
//         console.log("Order Details:", myOrderDetails);
//         console.log("Ordered Product Details:", orderedProDet);

//         // Check the values before rendering
//         console.log("amountAfterDscnt:", myOrderDetails.amountAfterDscnt);
//         console.log("total:", myOrderDetails.total);

//         res.render("user/order_Details", {
//             totalprice: myOrderDetails.total,
//             address,
//             orderedProDet,
//             myOrderDetails,
//             userData
//         });
//     } catch (error) {
//         console.log(error);
//         res.status(500).send("Internal Server Error");
//     }
// };

// const orderDetails = async (req, res) => {
//     try {
//         const orderId = req.params.id;
//         const user = req.session.user;
//         const userId = user._id;

//         // Fetch user data and order details
//         const userData = await User.findById(userId).lean();
//         const myOrderDetails = await Order.findById(orderId).lean();

//         if (!myOrderDetails) {
//             return res.status(400).send("Order not found");
//         }

//         // Format the date
//         myOrderDetails.date = moment(myOrderDetails.date).format('ddd MMM DD YYYY');

//         // Fetch ordered product details
//         const orderedProDet = await Order.aggregate([
//             { $match: { _id: new mongoose.Types.ObjectId(orderId) } },
//             { $unwind: "$product" },
//             { $project: { _id: 1, product: 1 } }
//         ]);

//         // Fetch address
//         const address = await Address.findOne({ userId: userId }).lean();

//         // Fetch product offers for each product in the order
//         const productIds = orderedProDet.map(item => item.product.productId);
//         const productOffers = await productOffer.find({
//             productId: { $in: productIds },
//             currentStatus: true,
//             startDate: { $lte: new Date() },
//             endDate: { $gte: new Date() }
//         }).lean();

//         // Create a map for quick access to offers
//         const offerMap = {};
//         productOffers.forEach(offer => {
//             offerMap[offer.productId] = offer;
//         });

//         // Enhance ordered products with pricing logic
//         const enhancedOrderedProDet = orderedProDet.map(item => {
//             const offer = offerMap[item.product.productId];
//             if (offer) {
//                 return {
//                     ...item,
//                     offerPrice: offer.discountPrice,
//                     originalPrice: item.product.price,
//                 };
//             } else {
//                 return {
//                     ...item,
//                     offerPrice: null,
//                     originalPrice: item.product.price,
//                 };
//             }
//         });

//         console.log("Address:", address);
//         console.log("Order Details:", myOrderDetails);
//         console.log("Ordered Product Details:", enhancedOrderedProDet);

//         res.render("user/orderDetails", {
//             totalprice: myOrderDetails.total,
//             address,
//             orderedProDet: enhancedOrderedProDet,
//             myOrderDetails,
//             userData
//         });
//     } catch (error) {
//         console.log(error);
//         res.status(500).send("Internal Server Error");
//     }
// };



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
        const productOffers = await productOffer.find({
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
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid order ID' });
        }
        const ID = new mongoose.Types.ObjectId(id);
        let notCancelledAmt = 0;

        let returnedOrder = await Order.findOne({ _id: ID }).lean();
        console.log(returnedOrder, "returnedOrder")

        const returnedorder = await Order.findByIdAndUpdate(ID, { $set: { status: 'Returned' } }, { new: true });
        for (const product of returnedorder.product) {
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

        let couponAmountEach = 0
        if(returnedOrder.coupon){
            couponAmountEach = returnedOrder.discountAmt / returnedOrder.product.length

        }

        if (['wallet', 'razorpay'].includes(returnedOrder.paymentMethod)) {
            for (const data of returnedOrder.product) {
                //await Product.updateOne({ _id: data._id }, { $inc: { stock: data.quantity } });
                await User.updateOne(
                    { _id: req.session.user._id },
                    { $inc: { wallet: (data.price * data.quantity) - couponAmountEach } }
                );
                notCancelledAmt += data.price * data.quantity - couponAmountEach;
            }

            await User.updateOne(
                { _id: req.session.user._id },
                {
                    $push: {
                        history: {
                            amount: notCancelledAmt,
                            status: 'refund of Order Return',
                            date: Date.now()
                        }
                    }
                }
            );
        }

        res.json({
            success: true,
            message: 'Successfully Returned Order'

        });
    } catch (error) {
        console.log(error.message);
       // res.status(HttpStatus.InternalServerError).send('Internal Server Error');
    }
};

const cancelOneProduct = async (req, res) => {
    try {
        const { id, prodId } = req.body;
        console.log(id, prodId)

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(prodId)) {
            return res.status(HttpStatus.BadRequest).json({ error: 'Invalid order or product ID' });
        }

        const ID = new mongoose.Types.ObjectId(id);
        const PRODID = new mongoose.Types.ObjectId(prodId);

        const updatedOrder = await Order.findOneAndUpdate(
            { _id: ID, 'product._id': PRODID },
            { $set: { 'product.$.isCancelled': true } },
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
        const productprice = result.product[0].price * productQuantity

        await Product.findOneAndUpdate(
            { _id: PRODID },
            { $inc: { stock: productQuantity } }
        );
        if(updatedOrder.couponUsed){
            const coupon = await Coupon.findOne({ code: updatedOrder.coupon });
            const discountAmt = (productprice * coupon.discount) / 100;
            const newTotal = productprice - discountAmt;
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

        }else{
            await User.updateOne(
                { _id: req.session.user._id },
                { $inc: { wallet: productprice } }
            );
            await User.updateOne(
                { _id: req.session.user._id },
                {
                    $push: {
                        history: {
                            amount: productprice,
                            status: `refund of: ${result.product[0].name}`,
                            date: Date.now()
                        }
                    }
                }
            );
        }

        res.json({
            success: true,
            message: 'Successfully removed product'
        });
    } catch (error) {
        console.log(error.message);
        //res.status(HttpStatus.InternalServerError).send('Internal Server Error');
    }
};

const returnOneProduct = async (req, res) => {
    try {
        const { id, prodId } = req.body;
        console.log(id, prodId)

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(prodId)) {
            return res.status(HttpStatus.BadRequest).json({ error: 'Invalid order or product ID' });
        }

        const ID = new mongoose.Types.ObjectId(id);
        const PRODID = new mongoose.Types.ObjectId(prodId);

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
        const productprice = result.product[0].price * productQuantity

        await Product.findOneAndUpdate(
            { _id: PRODID },
            { $inc: { stock: productQuantity } }
        );
        if(updatedOrder.couponUsed){
            const coupon = await Coupon.findOne({ code: updatedOrder.coupon });
            const discountAmt = (productprice * coupon.discount) / 100;
            const newTotal = productprice - discountAmt;
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

        }else{
            await User.updateOne(
                { _id: req.session.user._id },
                { $inc: { wallet: productprice } }
            );
            await User.updateOne(
                { _id: req.session.user._id },
                {
                    $push: {
                        history: {
                            amount: productprice,
                            status: `[return]refund of: ${result.product[0].name}`,
                            date: Date.now()
                        }
                    }
                }
            );
        }

        res.json({
            success: true,
            message: 'Successfully removed product'
        });
    } catch (error) {
        console.log(error.message);
      //  res.status(HttpStatus.InternalServerError).send('Internal Server Error');
    }
}

module.exports=
{
    my_Orders,
    orderDetails,
    cancelOrder,
    returnOrder,
    cancelOneProduct,
    returnOneProduct
}