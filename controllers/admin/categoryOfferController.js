const Category=require("../../models/categoryModel")
const categoryOffer=require("../../models/categoryOfferModel")
const Product=require("../../models/productModel")
const productOffer=require("../../models/productOfferModel")
const moment=require('moment')

const categoryOfferPage=async(req,res)=>{
    try{
        var page=1
        if(req.query.page){
            page=req.query.page
        }
        let limit=3
        let categoryOffers=await categoryOffer.find().skip((page-1)*limit).limit(limit*1).lean()
        const count=await categoryOffer.find({}).countDocuments()
        const totalPages=Math.ceil(count/limit)
        const pages=Array.from({length:totalPages},(_,i)=>i+1)
//here checking the categoryOffers has active or inactive status
        categoryOffers.forEach(async(data)=>{
            const isActive=data.endDate >= new Date() && data.startDate <=new Date()
            await categoryOffer.updateOne(
                {_id:data._id},
                {
                    $set:{
                        currentStatus:isActive
                    }
                }
            )
        })
//format the date to visible in yyyy(year)-mm(month)-day(dd) format
        categoryOffers=categoryOffers.map((data)=>{
            data.startDate=moment(data.startDate).format("YYYY-MM-DD")
            data.endDate=moment(data.endDate).format("YYYY-MM-DD")
            return data
        })

        res.render("admin/categoryOffer",{layout:"adminlayout",categoryOffers,pages})
    }catch(error){
        console.log(error.message)
    }
}

//In this controller load the adding the categoryOffer page with category data
const addCategoryOfferPage=async(req,res)=>{
    try{
        const category=await Category.find({}).lean()
        res.render("admin/addCategoryOffer",{layout:"adminlayout",category})
    }catch(error){
        console.log(error)
    }
}


const addCategoryOffer = async (req, res) => {
    try {
//destructuring the values which is entered by the admin
        const { categoryName, categoryOfferPercentage, categoryOfferStartDate, categoryOfferEndDate } = req.body;
const category = await Category.findOne({ category: categoryName });

        if (!category) {
            return res.status(404).send('category not found');
        }
//checking the category has already categoryOffer or not based on the categort id
        const existingOffer = await categoryOffer.findOne({
            categoryId: category._id,
            currentStatus: true
        });
//if the offer is exist it will show category offer is already exists
        if (existingOffer) {
            return res.status(400).send("An active category offer already exists for this category");
        }

        const discount = parseFloat(categoryOfferPercentage);

        if (isNaN(discount) || discount < 5 || discount > 90) {
            return res.status(400).send("Invalid discount percentage");
        }
//assignment to the field and save the category save
        const catOffer = new categoryOffer({
            categoryName,
            categoryId: category._id,
            categoryOfferPercentage: discount,
            startDate: new Date(categoryOfferStartDate),
            endDate: new Date(categoryOfferEndDate),
            currentStatus: new Date(categoryOfferEndDate) >= new Date() && new Date(categoryOfferStartDate) <= new Date()
        });
        await catOffer.save();
        console.log("Category offer saved:", catOffer);
//getting all products in the category based on the category id in the product collection
        const productsInCategory = await Product.find({ category: category._id });
    console.log("Products in Category before applying offer:", productsInCategory);
//modifying the price of the product based on the categoryOffer.It will create the productOffer
        for (const product of productsInCategory) {
            console.log("Product Details before applying offer:", product);
// Calculate the new discounted price
            const discountedPrice = product.price - (product.price * discount) / 100;
//checking here if already if the product has productOffer
            const existingProductOffer = await productOffer.findOne({ productId: product._id });
//if the product already has the productoffer assigning the offer based on the categoryOffer
            if (existingProductOffer) {
                existingProductOffer.productOfferPercentage = discount;
                existingProductOffer.discountPrice = discountedPrice;
                existingProductOffer.startDate = new Date(categoryOfferStartDate);
                existingProductOffer.endDate = new Date(categoryOfferEndDate);
                existingProductOffer.currentStatus = new Date(categoryOfferEndDate) >= new Date() && new Date(categoryOfferStartDate) <= new Date();
// Save the updated product offer
                await existingProductOffer.save();
                console.log("Updated Product Offer:", existingProductOffer);
            } else {
// If the product in the category does not have existing offer, create a new product offer
                const newProductOffer = new productOffer({
                    productId: product._id,
                    productName: product.name,
                    productOfferPercentage: discount,
                    discountPrice: discountedPrice,
                    startDate: new Date(categoryOfferStartDate),
                    endDate: new Date(categoryOfferEndDate),
                    currentStatus: new Date(categoryOfferEndDate) >= new Date() && new Date(categoryOfferStartDate) <= new Date()
                });

// Save the new product offer
                await newProductOffer.save();
                console.log("New Product Offer Created:", newProductOffer);
            }
            console.log(`Updated product offer for product: ${product.name}`);
        }
        res.redirect('/admin/categoryOffers');
    } catch (error) {
        console.log(error);
    }
};

const editCategoryOfferPage=async(req,res)=>{
    try{
//destructure the id 
        const {id}=req.params
//based on the id find the categoryOffer
        const editCategoryOfferData=await categoryOffer.findById(id).lean()
        if(!editCategoryOfferData){
            return res.status(400).send("The category offer does not exist")
        }
//load the category data
        const category=await Category.find().lean()
        console.log(editCategoryOfferData)
//format the date
        let startDate=moment(editCategoryOfferData.startDate).format("YYYY-MM-DD")
        let endDate=moment(editCategoryOfferData.endDate).format("YYYY-MM-DD")

        res.render("admin/editCategoryOffer",{layout:"adminlayout",editCategoryOfferData,startDate,endDate,category})
    }catch(error){
        console.log(error)
    }
}

const editCategoryOffer = async (req, res) => {
    try {
//getting the id
        const {id} = req.params;
//destructure the data given in the form
         const {categoryName, categoryOfferPercentage, categoryOfferStartDate, categoryOfferEndDate} = req.body;

    const discount = parseFloat(categoryOfferPercentage);
    if (isNaN(discount) || discount < 5 || discount > 90) {
            return res.status(400).send("Invalid discount percentage");
        }
//based on the id find the catOffer
    const catOffer = await categoryOffer.findById(id);
         if (!catOffer) {
            return res.status(404).send("Category offer not found");
        }
//based on the categoryName find the category
        const category = await Category.findOne({ category: categoryName });
        if (!category) {
            res.status(400).send("There is no category");
        }
// Update category offer data
        catOffer.categoryName = categoryName;
        catOffer.categoryOfferPercentage = discount;
        catOffer.startDate = new Date(categoryOfferStartDate);
        catOffer.endDate = new Date(categoryOfferEndDate);
        catOffer.currentStatus = new Date(categoryOfferEndDate) >= new Date() && new Date(categoryOfferStartDate) <= new Date();
//here saving the categoryOffer 
        await catOffer.save();
        console.log("Category offer updated:", catOffer);
//here now modifying the productOffer side.based on the category id find the products related to the category
        const productsInCategory = await Product.find({ category: category._id });
//assigning the offer based on the categoryOffer
        for (const product of productsInCategory) {
            const existingProductOffer = await productOffer.findOne({ productId: product._id });
//if the product already has the offer we assign the offer based on the category offer.
            if (existingProductOffer) {
                existingProductOffer.productOfferPercentage = discount;
                existingProductOffer.discountPrice = product.price - (product.price * discount) / 100;
                existingProductOffer.startDate = new Date(categoryOfferStartDate);
                existingProductOffer.endDate = new Date(categoryOfferEndDate);
            existingProductOffer.currentStatus = new Date(categoryOfferEndDate) >= new Date() && new Date(categoryOfferStartDate) <= new Date();
//save the productOffer
                await existingProductOffer.save();
            } else {
//if the product does not have any offer .create the productOffer based on the category offer
                const newProductOffer = new productOffer({
                productId: product._id,
                    productName: product.name,
                    productOfferPercentage: discount,
                    discountPrice: product.price - (product.price * discount) / 100,
                    startDate: new Date(categoryOfferStartDate),
                    endDate: new Date(categoryOfferEndDate),
                    currentStatus: new Date(categoryOfferEndDate) >= new Date() && new Date(categoryOfferStartDate) <= new Date()
                });
//save the productOffer
                await newProductOffer.save();
            }
        }
        res.redirect("/admin/categoryOffers");
    } catch (error) {
        console.log(error);
    }
};

const deleteCategoryOffer = async (req, res) => {
    try {
//destructuring the id
        const { id } = req.params;
//based on that id we found the categoryOffer
        const categoryOfferToDelete = await categoryOffer.findById(id);

        if (!categoryOfferToDelete) {
            return res.status(404).send("Category offer not found");
        }

//in category offer i have id of the category.Based on the category id i match with the product.
        const productsInCategory = await Product.find({ category: categoryOfferToDelete.categoryId });
//For each product, remove or update the related product offer
        for (const product of productsInCategory) {
// Check if there is an existing product offer
            const existingProductOffer = await productOffer.findOne({ productId: product._id });
//if the product has the productoffer related to the categoryOffer i will delete the productOffer
            if (existingProductOffer) {
                await productOffer.findByIdAndDelete(existingProductOffer._id);
                console.log(`Product offer for ${product.name} deleted`);
            }
        }
//atlast i delete the categoryOffer by its id
        await categoryOffer.findByIdAndDelete(id);
        console.log("Category offer deleted successfully");
        res.status(200).send("Category offer and associated product offers deleted successfully");
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred while deleting the category offer");
    }
};


module.exports={
    categoryOfferPage,
    addCategoryOfferPage,
    addCategoryOffer,
    editCategoryOfferPage,
    editCategoryOffer,
    deleteCategoryOffer
}