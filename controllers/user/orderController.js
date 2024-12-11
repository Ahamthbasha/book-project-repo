const Product=require("../../models/productModel")
const User=require("../../models/userModel")
const Address=require("../../models/addressModel")
const Order=require("../../models/orderModel")
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

const orderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const user = req.session.user;
        const userId = user._id;
        const userData = await User.findById(userId).lean();
        const myOrderDetails = await Order.findById(orderId).lean();
        
        if (!myOrderDetails) {
            return res.status(400).send("Order not found");
        }

        // Format the date
        myOrderDetails.date = moment(myOrderDetails.date).format('ddd MMM DD YYYY');

        const orderedProDet = await Order.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(orderId) } },
            { $unwind: "$product" },
            { $project: { _id: 1, product: 1 } }
        ]);

        const address = await Address.findOne({ userId: userId }).lean();

        console.log("Address:", address);
        console.log("Order Details:", myOrderDetails);
        console.log("Ordered Product Details:", orderedProDet);

        // Check the values before rendering
        console.log("amountAfterDscnt:", myOrderDetails.amountAfterDscnt);
        console.log("total:", myOrderDetails.total);

        res.render("user/order_Details", {
            totalprice: myOrderDetails.total,
            address,
            orderedProDet,
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


module.exports=
{
    my_Orders,
    orderDetails,
    cancelOrder
}