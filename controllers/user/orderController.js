const Product=require("../../models/orderModel")
const User=require("../../models/userModel")
const Address=require("../../models/addressModel")
const Order=require("../../models/orderModel")
const Category=require("../../models/categoryModel")
const Cart=require("../../models/cartModel")
const moment=require('moment')
const userHelper=require("../../helpers/userHelper")
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

// const cancelOrder=async(req,res)=>{
//     try{
//         const id=req.params.id
//         console.log(id)
//         if(!mongoose.Types.ObjectId.isValid(id)){
//             return res.status(400).json({error:"Invalid order ID"})
//         }
//         const ID=new mongoose.Types.ObjectId(id)
//         let notCancelledAmt=0
//         let canceledOrder=await Order.findOne({_id:ID})
//         if(!canceledOrder){
//             return res.status(404).json({error:"order not found"})
//         }
//         await Order.updateOne({_id:ID},{$set:{status:'cancelled'}})

//         for(const product of canceledOrder.product){

//             if(!product.isCancelled){
//                 await Product.updateOne(
//                     {_id:product._id},
//                     {$inc:{stock:product.quantity},$set:{isCancelled:true}}
//                 )

//                 await Order.updateOne(
//                     {_d:ID,'product._id':product._id},
//                     {$st:{"product.$.isCancelled":true}}
//                 )
//             }


//         }
//     }catch(error){
//         console.log(error)
//     }
// }

const orderDetails=async(req,res)=>{
    try {
        let ct=0
        let ct2=0
        const orderId=req.params.id
        const user=req.session.user
        const userId=user._id
        let offerprice=0
        const userData=await User.findById(userId).lean()
        const myOrderDetails=await Order.findById(orderId).populate('address').lean()
        await myOrderDetails.product.forEach((product)=>{
            if(product.isCancelled) ct2++
            offerprice+=product.price * product.quantity
        })

        let check=function(a,b){
            if(a+b === myOrderDetails.product.length){
                return true
            }else{
                return false
            }
        }

    if(!myOrderDetails){
        return res.status(400).send("order not found")
    }
    
    const orderedProDet=await Order.aggregate([
        {$match:{_id:new mongoose.Types.ObjectId(orderId)}},
        {$unwind:"$product"},
        {
            $project:{
                _id:1,
                product:1
            }
        }
    ])

    const address=await Address.findOne(
        {
            userId:userId
        }
    ).lean()

    console.log(address)

    console.log("myorderDetails",myOrderDetails)
    console.log("orderedProDet",orderedProDet)
    offerprice-=(myOrderDetails.total)
    res.render("user/order_Details",{offerprice,address,orderedProDet,myOrderDetails,userData})
    } catch (error) {
        console.log(error)
    }
}

const cancelOrder=async(req,res)=>{
    try{
        const id=req.query.id
        const userData=req.session.user
        const userId=userData._id

        const myOrderDetails=await Order.findOne({_id:id})

        console.log(myOrderDetails)

        let canceledOrder=await Order.findOne({_id:id})

        for(const product of canceledOrder.product){
            await Product.updateOne(
                {_id:product.id},
                {$inc:{stock:product.quantity}}
            )
        }

        await Order.findByIdAndUpdate(id,{$set:{status:'cancelled'}},{new:true})

        res.json('success')
    }catch(error){
        console.log(error)
    }
}

module.exports=
{
    my_Orders,
    orderDetails,
    cancelOrder
}