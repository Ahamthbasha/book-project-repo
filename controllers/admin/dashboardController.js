const moment=require('moment')
const Sale=require("../../models/orderModel")
const Order=require("../../models/orderModel")
const PDFDocument=require("pdfkit")
const hbs=require('hbs')
const Handlebars=require('handlebars')
const Product=require("../../models/productModel")
const Category=require("../../models/categoryModel")


const getSales=async(req,res)=>{
        const {stDate,edDate}=req.query
        console.log(stDate,edDate)

        const startDate=new Date(stDate)
        const endDate=new Date(new Date(edDate).setHours(23,59,59,999))
    try{
        const orders=await Order.find({
            date:{
                $gte:startDate,
                $lte:endDate
            },
            status:'Delivered'
        }).sort({date:"desc"})
        console.log(orders)

        const formattedOrders=orders.map((order)=>({
            date:moment(order.date).format('YYYY-MM-DD'),
            ...order._doc
        }))

        console.log(formattedOrders)


        let salesData=[]
        let grandTotal=0

        formattedOrders.forEach((element)=>{
            salesData.push({
                date:element.date,
                orderId:element.orderId,
                total:element.total,
                payMethod:element.paymentMethod,
                coupon:element.coupon,
                couponUsed:element.couponUsed,
                proName:element.product,
            })
            grandTotal+=element.total
        })

        const salesCount=salesData.length

        console.log(grandTotal)
        res.json({
            grandTotal:grandTotal,
            salesCount:salesCount,
            orders:salesData,
        })
    }catch(error){
        console.log(error)
    }
}


module.exports={
    getSales
}