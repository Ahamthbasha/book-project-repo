const Cart=require("../../models/cartModel")
const Product=require("../../models/productModel")
const Category=require("../../models/categoryModel")
const User=require("../../models/userModel")
const Address=require("../../models/addressModel")
const Order=require("../../models/orderModel")
const mongoose=require("mongoose")
const ObjectId=require("mongoose")

const loadCheckoutPage=async(req,res)=>{
    try{
        let userData=await User.findById(req.session.user._id).lean()

        const ID=new mongoose.Types.ObjectId(userData._id)
        const addressData=await Address.find({userId:userData._id}).lean()
        const subTotal=await Cart.aggregate([
            {
                $match:{
                    userId:ID,
                },
            },
            {
                $group:{
                    _id:null,
                    total:{$sum:"$value"},
                },
            },
            {
                $project:{
                    _id:0,
                    total:1,
                },
            },
        ])
        let cart=await Cart.aggregate([
            {
                $match:{
                    userId:ID,
                },
            },
            {
                $lookup:{
                    from:"products",
                    foreignField:"_id",
                    localField:"product_Id",
                    as:"productData"
                },
            },
            {
                $project:{
                    _id:1,
                    userId:1,
                    quantity:1,
                    value:1,
                    productName:{$arrayElemAt:["$productData.name",0]},
                    productPrice:{$arrayElemAt:["$productData.price",0]},
                    productDescription:{$arrayElemAt:["$productData.description",0]},
                    productImage:{$arrayElemAt:["$productData.imageUrl",0]},
                },
            },
        ])
        console.log(cart)

        res.render("user/checkout/checkout",{
            userData,addressData,subTotal:subTotal[0].total,cart
        })
    }catch(error){
        console.log(error)
    }
}

const placeorder=async(req,res)=>{
    try{
       console.log("place order")
       userData=req.session.user
       const ID=new mongoose.Types.ObjectId(userData._id)
       const addressId=req.body.selectedAddress
       const payMethod=req.body.selectedPayment
       const totalAmount=req.body.amount 
       console.log("Request dot body",addressId, payMethod,totalAmount)

       const result=Math.random().toString(36).substring(2,7)
       const id=Math.floor(100000+ Math.random()*900000)
       const ordeId=result+id

       const productInCart=await Cart.aggregate([
        {
            $match:{
                userId:ID,
            },
        },
        {
            $lookup:{
                from:"products",
                foreignField:"_id",
                localField:"product_Id",
                as:"productData",
            },
        },
        {
            $project:{
                product_Id:1,
                userId:1,
                quantity:1,
                value:1,
                name:{$arrayElemAt:["$productData.name",0]},
                price:{$arrayElemAt:["$productData.price",0]},
                productDescription:{$arrayElemAt:["$productData.description",0]},
                image:{$arrayElemAt:["$productData.imageUrl",0]},
            },
        },
       ])
       console.log(productInCart)

       let productDet =productInCart.map((item)=>{
        return{
            _id:item.product_Id,
            name:item.name,
            price:item.price,
            quantity:item.quantity,
            image:item.image[0],
        }
       })

       console.log(productDet,"aggregated cart products")

       let finalTotal=totalAmount
       const DELIVERY_CHARGE=50
       const grandTotal=finalTotal+DELIVERY_CHARGE

       let saveOrder=async()=>{
        const order=new Order({
            userId:ID,
            product:productDet,
            address:addressId,
            orderId:ordeId,
            total:grandTotal,
            paymentMethod:payMethod,
        })

        const ordered= await order.save()
        console.log(ordered,"orderSaved")

        productDet.forEach(async(product)=>{
            await Product.updateMany(
                {_id:product._id},
                {$inc:{stock:-product.quantity}}
            )
        })
        const deletedCart=await Cart.deleteMany({
            userId:ID,
        }).lean()
        console.log(deletedCart,"deletedCart")
       }

       if(addressId){
        if(payMethod === "cash-on-delivery"){
            console.log("cash on delivery")
            await saveOrder()
            res.json({COD:true})
        }
       }

    }catch(error){
        console.log(error)
    }
}

const orderSuccess=async(req,res)=>{
    try{
        res.render("user/order_success")
    }catch(error){
        console.log(error)
        res.status(500).send("internal server error")
    }
}

module.exports={
    loadCheckoutPage,
    placeorder,
    orderSuccess
}