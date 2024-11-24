const Address=require("../../models/addressModel")


const manageAddress=async(req,res)=>{
    try{
        const userData=req.session.user
        const id=userData._id
        const page=parseInt(req.query.page) || 1
        const limit=parseInt(req.query.limit)|| 4
        const skip=(page-1) * limit

        const [userAddress,totalAddress]=await Promise.all([
            Address.find({userId:id}).skip(skip).limit(limit).lean(),
            Address.find({userId:id}).countDocuments()
        ])

        const totalPages=Math.ceil(totalAddress/limit)
        const pages=Array.from({length:totalPages},(_,i)=>i+1)

        res.render('user/manage_address',{
            currentPage:page,
            totalPages,
            pages,
            userAddress,
            userData
        })

    }catch(error){
        console.log(error)
    }
}

const addNewAddress=async(req,res)=>{
    try{
        res.render("user/add_new_address")
    }catch(error){
        console.log(error)
    }
}

const addNewAddressPost=async(req,res)=>{
    try{
        const userData=req.session.user
        const id=userData._id
        console.log(req.body)
        const address=new Address({
            userId:id,
            name:req.body.name,
            mobile:req.body.mobile,
            adressLine1:req.body.address1,
            adressLine2:req.body.address2,
            city:req.body.city,
            state:req.body.state,
            pin:req.body.pin,
            is_default:false,
        })

        await address.save()
        res.redirect('/adresses')
    }catch(error){
        console.log(error)
    }
}

const editAddress=async(req,res)=>{
    try{
        const id=req.params.id;
        const address=await Address.findById(id).lean()
        res.render('user/editAddress',{address})
    }catch(error){
        console.log(error)
    }
}

const editAddressPost=async(req,res)=>{
    try{
        const id=req.params.id
        await Address.findByIdAndUpdate(id,{
            $set:{
                name:req.body.name,
                mobile:req.body.mobile,
                adressLine1:req.body.address1,
                adressLine2:req.body.address2,
                city:req.body.city,
                state:req.body.state,
                pin:req.body.pin,
                is_default:false,
            }
        })
        res.redirect('/adresses')
    }catch(error){
        console.log(error)
    }
}

const deleteAddress=async(req,res)=>{
    try{
        const id=req.params.id
        await Address.findByIdAndDelete(id)
        res.redirect('/adresses')
    }catch(error){
        console.log(error)
    }
}

module.exports=
{
    manageAddress,
    addNewAddress,
    addNewAddressPost,
    editAddress,
    editAddressPost,
    deleteAddress

}