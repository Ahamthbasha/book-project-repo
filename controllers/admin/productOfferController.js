const Product=require("../../models/productModel")
const ProductOffer=require("../../models/productOfferModel")
const moment=require("moment")

const productOfferPage=async(req,res)=>{
    try{
        var page=1
        if(req.query.page){
            page=req.query.page
        }
        let limit=3
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

        console.log("product offer data",productOfferData)

        productOfferData=productOfferData.map((data)=>{
            data.startDate=moment(data.startDate).format('YYYY-MM-DD')
            data.endDate=moment(data.endDate).format('YYYY-MM-DD')
            return data
        })

        console.log("formatted productOffer Data",productOfferData)
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
        console.log("received data:",req.body)

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

        const isActive=new Date(endDate) >= new Date() && new Date(startDate) <= new Date()

        const discountPrice=product.price - (product.price * discount)/100

        const proOffer=new ProductOffer({
            productId:product._id,
            productName:productName,
            productOfferPercentage:discount,
            discountPrice:discountPrice,
            startDate:new Date(startDate),
            endDate:new Date(endDate),
            currentStatus:isActive
        })

        await proOffer.save()
        console.log("product offer saved",proOffer)

        product.productOfferId=proOffer._id
        await product.save()

        console.log("product updated with new offer ID:",product)

        res.redirect("/admin/productOffers")
    }catch(error){
        console.log(error)
    }
}

const editProductOfferPage=async(req,res)=>{
    try{
        const {id}=req.params
        const editProductOfferData=await ProductOffer.findById(id).lean()
        if(!editProductOfferData){
            return res.status(404).send("product offer not found")
        }
        const products=await Product.find().lean()
        console.log("edit product offer Data",editProductOfferData)

        let startDate=moment(editProductOfferData.startDate).format('YYYY-MM-DD')
        let endDate=moment(editProductOfferData.endDate).format('YYYY-MM-DD')

        res.render("admin/editProductOffer",{layout:"adminlayout",editProductOfferData,startDate,endDate,products})

    }catch(error){
        console.log(error.message)
    }
}

const editProductOffer=async(req,res)=>{
    try{
       const {offerId, productName,productOfferPercentage,startDate,endDate}=req.body

       const productOfferData=await ProductOffer.findById(offerId)

       if(!productOfferData){
        res.status(404).send("product offer not found")
       }

       const product=await Product.findOne({name:productName})
       if(!product){
        res.status(404).send("product not found")
       }

       const discount=parseFloat(productOfferPercentage)
       if(isNaN(discount)||discount<5||discount>90){
        res.status(400).send("Invalid discount percentage")
       }

       const existingActiveOffer=await ProductOffer.findOne({
        productId:product._id,
        _id:{$ne:offerId},
        currentStatus:true
       })

       if(existingActiveOffer){
        return res.status(400).send("An active product offer already exists for this product")
       }

       const isActive=new Date(endDate) >= new Date() && new Date(startDate)<=new Date()

       const discountPrice=product.price - (product.price * discount)/100

       productOfferData.productName=productName
       productOfferData.productOfferPercentage=discount
       productOfferData.discountPrice=discountPrice
       productOfferData.startDate=new Date(startDate)
       productOfferData.endDate=new Date(endDate)
       productOfferData.currentStatus=isActive

       await productOfferData.save()

       console.log(`product offer updated successfulley:${product.name}`)
       res.redirect("/admin/productOffers")
    }catch(error){
        console.log(error)
    }
}

const deleteProductOffer=async(req,res)=>{
    try{
        const {id}=req.params
        await ProductOffer.findByIdAndDelete(id)
        res.status(200).send("product offer deleted")
    }catch(error){
        console.log(error)
    }
}
module.exports={
    productOfferPage,
    addProductOfferPage,
    addProductOffer,
    editProductOfferPage,
    editProductOffer,
    deleteProductOffer
}