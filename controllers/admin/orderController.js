const Orders=require("../../models/orderModel")
const Address=require("../../models/addressModel")
const moment=require('moment')


const getOrders=async(req,res)=>{
    try{
        const PAGE_SIZE=5
        const page=parseInt(req.query.page)||1
        const skip=(page-1)*PAGE_SIZE

        const orders=await Orders.find()
        .sort({date:-1})
        .skip(skip)
        .limit(PAGE_SIZE)

        const now=moment()

        const ordersData=orders.map((order)=>{
            const formattedDate=moment(order.date).format("MMMM D,YYYY")
            
            return{
                ...order.toObject(),
                date:formattedDate,
            }
        })

        const totalPages=Math.ceil(await Orders.countDocuments()/PAGE_SIZE)

        const pages=Array.from({length:totalPages},(_,i)=>i+1)

        console.log(ordersData)

        res.render("admin/orders",{
            ordersData,pages,
            currentPage:page,
            layout:'adminlayout'
        })

    }catch(error){
        console.log(error)
    }
}

const orderDetails=async(req,res)=>{
    try{
        const userData=req.session.userData
        const orderId=req.query.orderId

        const myOrderDetails=await Orders.findById(orderId).lean()
        const orderedProDet=myOrderDetails.product
        const addressId=myOrderDetails.address
        console.log(orderedProDet)
        const address=await Address.findById(addressId).lean()
        res.render("admin/order_Details",{
            myOrderDetails,
            orderedProDet,
            userData,
            address,
            layout:'adminlayout'
        })
    }catch(error){
        console.log(error)
    }
}

const changeOrderStatus=async(req,res)=>{
    console.log(req.body)

    try{
        const id=req.query.id
        const status=req.body.status
        console.log(status)
        const order=await Orders.findByIdAndUpdate(
            id,
            {$set:{status:status}},
            {new:true}
        )
        res.redirect("/admin/orders")
    }catch(error){
        console.log(error)
    }
}


module.exports=
{
    getOrders,
    orderDetails,
    changeOrderStatus
}