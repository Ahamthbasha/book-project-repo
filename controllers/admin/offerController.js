const Product=require("../../models/productModel")
const ProductOffer=require("../../models/productOfferModel")
//const productModel=require("../../models/productModel")
const moment=require("moment")

const productOfferPage=async(req,res)=>{
    try{
        var page=1
        if(req.query.page){
            page=req.query.page
        }
        limit=3
        let productOfferData=await ProductOffer.find().skip((page-1)*limit).limit(limit*1).lean()
        const count=await ProductOffer.find({}).countDocuments()
        const totalPages=Math.ceil(count/limit)
        const pages=Array.from({length:totalPages},(_,i)=>i+1)

        productOfferData.forEach(async(data)=>{
            const isActive=data.endDate>=new Date() && data.startDate<=new Date()
            await ProductOffer.updateOne(
                {_id:data._id},
                {
                    $set:{
                    currentStatus:isActive
                    }
                }
            )
        })

        console.log(productOfferData)

        productOfferData=productOfferData.map((data)=>{
            data.startDate=moment(data.startDate).format('YYYY-MM-DD')
            data.endDate=moment(data.endDate).format('YYYY-MM-DD')
        })

        console.log(productOfferData)
        res.render("admin/productOffer",{layout:"adminlayout",productOfferData,pages})
    }catch(error){
        console.log(error)
    }
}

const addProductOfferPage=async(req,res)=>{
    try{
        const products=await Product.find({}).lean()
        res.render("admin/addProductOffer",{layout:"adminlayout",products})
    }catch(error){
        console.log(error)
    }
}

const addProductOffer=async(req,res)=>{
    try{
        const {productName,productOfferPercentage,startDate,endDate}=req.body
        console.log(req.body)

        const product=await Product.findOne({name:productName})
        if(!product){
            return res.status(404).send("there is no product based on that name")
        }

        const existingOffer=await ProductOffer.findOne({
            productId:product._id,
            currentStatus:true
        })

        if(existingOffer){
            return res.status(400).send("Active product offer already exists for this product")
        }

        const discount=parseFloat(productOfferPercentage)

        if(isNaN(discount)||discount <5 ||discount >90){
            return res.status(400).send("discount is invalid")
        }



    }catch(error){
        console.log(error)
    }
}

module.exports={
    productOfferPage,
    addProductOfferPage,
}