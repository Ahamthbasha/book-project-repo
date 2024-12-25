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

const addCategoryOfferPage=async(req,res)=>{
    try{
        const category=await Category.find({}).lean()
        res.render("admin/addCategoryOffer",{layout:"adminlayout",category})
    }catch(error){
        console.log(error)
    }
}



// const addCategoryOffer = async (req, res) => {
//     try {
//         const { categoryName, categoryOfferPercentage, categoryOfferStartDate, categoryOfferEndDate } = req.body;

//         const category = await Category.findOne({ category: categoryName });

//         if (!category) {
//             return res.status(404).send('category not found');
//         }

//         const existingOffer = await categoryOffer.findOne({
//             categoryId: category._id,
//             currentStatus: true
//         });

//         if (existingOffer) {
//             return res.status(400).send("An active category offer already exists for this category");
//         }

//         const discount = parseFloat(categoryOfferPercentage);

//         if (isNaN(discount) || discount < 5 || discount > 90) {
//             return res.status(400).send("Invalid discount percentage");
//         }

//         const catOffer = new categoryOffer({
//             categoryName,
//             categoryId: category._id,
//             categoryOfferPercentage: discount,
//             startDate: new Date(categoryOfferStartDate),
//             endDate: new Date(categoryOfferEndDate),
//             currentStatus: new Date(categoryOfferEndDate) >= new Date() && new Date(categoryOfferStartDate) <= new Date()
//         });
//         await catOffer.save();
//         console.log("Category offer saved:", catOffer);

//         const productsInCategory = await Product.find({ category: category._id });

//         // Log all the products in the category before applying the offer
//         console.log("Products in Category before applying offer:", productsInCategory);

//         for (const product of productsInCategory) {
//             // Log each individual product's details before applying the offer
//             console.log("Product Details before applying offer:", product);

//             // Log the original product price
//             console.log(`Original price of ${product.name}: ${product.price}`);

//             // Calculate the new discounted price
//             const discountedPrice = product.price - (product.price * discount) / 100;

//             // Log the new price after the discount
//             console.log(`Price after ${discount}% discount for ${product.name}: ${discountedPrice}`);

//             const existingProductOffer = await productOffer.findOne({ productId: product._id });

//             if (existingProductOffer) {
//                 // Update the existing product offer with the category offer discount
//                 existingProductOffer.productOfferPercentage = discount;
//                 existingProductOffer.discountPrice = discountedPrice;
//                 existingProductOffer.startDate = new Date(categoryOfferStartDate);
//                 existingProductOffer.endDate = new Date(categoryOfferEndDate);
//                 existingProductOffer.currentStatus = new Date(categoryOfferEndDate) >= new Date() && new Date(categoryOfferStartDate) <= new Date();

//                 // Save the updated product offer
//                 await existingProductOffer.save();

//                 // Log the updated product offer
//                 console.log("Updated Product Offer:", existingProductOffer);
//             } else {
//                 // If no existing offer, create a new product offer
//                 const newProductOffer = new productOffer({
//                     productId: product._id,
//                     productName: product.name,
//                     productOfferPercentage: discount,
//                     discountPrice: discountedPrice,
//                     startDate: new Date(categoryOfferStartDate),
//                     endDate: new Date(categoryOfferEndDate),
//                     currentStatus: new Date(categoryOfferEndDate) >= new Date() && new Date(categoryOfferEndDate) <= new Date()
//                 });

//                 // Save the new product offer
//                 await newProductOffer.save();

//                 // Log the newly created product offer
//                 console.log("New Product Offer Created:", newProductOffer);
//             }

//             console.log(`Updated product offer for product: ${product.name}`);
//         }

//         res.redirect('/admin/categoryOffers');
//     } catch (error) {
//         console.log(error);
//     }
// };


const addCategoryOffer = async (req, res) => {
    try {
        const { categoryName, categoryOfferPercentage, categoryOfferStartDate, categoryOfferEndDate } = req.body;

        const category = await Category.findOne({ category: categoryName });

        if (!category) {
            return res.status(404).send('category not found');
        }

        const existingOffer = await categoryOffer.findOne({
            categoryId: category._id,
            currentStatus: true
        });

        if (existingOffer) {
            return res.status(400).send("An active category offer already exists for this category");
        }

        const discount = parseFloat(categoryOfferPercentage);

        if (isNaN(discount) || discount < 5 || discount > 90) {
            return res.status(400).send("Invalid discount percentage");
        }

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

        const productsInCategory = await Product.find({ category: category._id });

        // Log all the products in the category before applying the offer
        console.log("Products in Category before applying offer:", productsInCategory);

        for (const product of productsInCategory) {
            // Log each individual product's details before applying the offer
            console.log("Product Details before applying offer:", product);

            // Calculate the new discounted price
            const discountedPrice = product.price - (product.price * discount) / 100;

            const existingProductOffer = await productOffer.findOne({ productId: product._id });

            if (existingProductOffer) {
                // Update the existing product offer with the category offer discount
                existingProductOffer.productOfferPercentage = discount;
                existingProductOffer.discountPrice = discountedPrice;
                existingProductOffer.startDate = new Date(categoryOfferStartDate);
                existingProductOffer.endDate = new Date(categoryOfferEndDate);
                existingProductOffer.currentStatus = new Date(categoryOfferEndDate) >= new Date() && new Date(categoryOfferStartDate) <= new Date();

                // Save the updated product offer
                await existingProductOffer.save();

                // Log the updated product offer
                console.log("Updated Product Offer:", existingProductOffer);
            } else {
                // If no existing offer, create a new product offer
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

                // Log the newly created product offer
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
        const {id}=req.params
        const editCategoryOfferData=await categoryOffer.findById(id).lean()
        if(!editCategoryOfferData){
            return res.status(400).send("The category offer does not exist")
        }

        const category=await Category.find().lean()
        console.log(editCategoryOfferData)

        let startDate=moment(editCategoryOfferData.startDate).format("YYYY-MM-DD")
        let endDate=moment(editCategoryOfferData.endDate).format("YYYY-MM-DD")

        res.render("admin/editCategoryOffer",{layout:"adminlayout",editCategoryOfferData,startDate,endDate,category})
    }catch(error){
        console.log(error)
    }
}


// const editCategoryOffer=async(req,res)=>{
//     try{
//         const {id}=req.params
//         const {categoryName,categoryOfferPercentage,categoryOfferStartDate,categoryOfferEndDate}=req.body

//         const discount=parseFloat(categoryOfferPercentage)
//         if(isNaN(discount)||discount < 5||discount >90){
//             return res.status(400).send("discount valid")
//         }

//         const catOffer=await categoryOffer.findById(id)
//         if(!catOffer){
//             return res.status(404).send("Category offer not found")
//         }

//         const category=await Category.findOne({category:categoryName})

//         if(!category){
//             res.status(400).send("There is no category")
//         }

//         catOffer.categoryName=categoryName
//         catOffer.categoryOfferPercentage=discount
//         catOffer.startDate=new Date(categoryOfferStartDate)
//         catOffer.endDate=new Date(categoryOfferEndDate)
//         catOffer.currentStatus=new Date(categoryOfferEndDate) >= new Date() && new Date(categoryOfferStartDate) <=new Date()

//         await catOffer.save()
//         console.log("category offer updated",catOffer)

//         const productsInCategory=await Product.find({category:category._id})
//         for(const product of productsInCategory){
//            const existingProductOffer=await productOffer.findOne({productId:product._id})
           
//            if(existingProductOffer){
//             existingProductOffer.productOfferPercentage=discount

//             existingProductOffer.discountPrice=product.price-(product.price * discount)/100

//             existingProductOffer.startDate=new Date(categoryOfferStartDate)
//             existingProductOffer.endDate=new Date(categoryOfferEndDate)

//             existingProductOffer.currentStatus=new Date(categoryOfferEndDate) >= new Date() && new Date(categoryOfferStartDate) <= new Date()

//             await existingProductOffer.save()
//            }else{
//             const newProductOffer=new productOffer({
//                 productId:product._id,
//                 productName:product.name,
//                 productOfferPercentage:discount,
//                 discountPrice:product.price - (product.price*discount)/100,
//                 startDate:new Date(categoryOfferStartDate),
//                 endDate:new Date(categoryOfferEndDate),
//                 currentStatus:new Date(categoryOfferEndDate) >= new Date() && new Date(categoryOfferStartDate) <= new Date()
//             })
//             await newProductOffer.save()
//            }
//         }
//         res.redirect("/admin/categoryOffers")
//     }catch(error){
//         console.log(error)
//     }
// }

const editCategoryOffer = async (req, res) => {
    try {
        const {id} = req.params;
        const {categoryName, categoryOfferPercentage, categoryOfferStartDate, categoryOfferEndDate} = req.body;

        const discount = parseFloat(categoryOfferPercentage);
        if (isNaN(discount) || discount < 5 || discount > 90) {
            return res.status(400).send("Invalid discount percentage");
        }

        const catOffer = await categoryOffer.findById(id);
        if (!catOffer) {
            return res.status(404).send("Category offer not found");
        }

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

        await catOffer.save();
        console.log("Category offer updated:", catOffer);

        const productsInCategory = await Product.find({ category: category._id });

        for (const product of productsInCategory) {
            const existingProductOffer = await productOffer.findOne({ productId: product._id });

            if (existingProductOffer) {
                existingProductOffer.productOfferPercentage = discount;
                existingProductOffer.discountPrice = product.price - (product.price * discount) / 100;
                existingProductOffer.startDate = new Date(categoryOfferStartDate);
                existingProductOffer.endDate = new Date(categoryOfferEndDate);
                existingProductOffer.currentStatus = new Date(categoryOfferEndDate) >= new Date() && new Date(categoryOfferStartDate) <= new Date();

                await existingProductOffer.save();
            } else {
                const newProductOffer = new productOffer({
                    productId: product._id,
                    productName: product.name,
                    productOfferPercentage: discount,
                    discountPrice: product.price - (product.price * discount) / 100,
                    startDate: new Date(categoryOfferStartDate),
                    endDate: new Date(categoryOfferEndDate),
                    currentStatus: new Date(categoryOfferEndDate) >= new Date() && new Date(categoryOfferStartDate) <= new Date()
                });

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
        const { id } = req.params;

        // Step 1: Fetch the category offer to delete
        const categoryOfferToDelete = await categoryOffer.findById(id);

        if (!categoryOfferToDelete) {
            return res.status(404).send("Category offer not found");
        }

        // Step 2: Get the products in the category linked to this category offer
        const productsInCategory = await Product.find({ category: categoryOfferToDelete.categoryId });

        // Step 3: For each product, remove or update the related product offer
        for (const product of productsInCategory) {
            // Check if there is an existing product offer
            const existingProductOffer = await productOffer.findOne({ productId: product._id });

            if (existingProductOffer) {
                // Option 1: Delete the product offer
                await productOffer.findByIdAndDelete(existingProductOffer._id);
                console.log(`Product offer for ${product.name} deleted`);
            }
        }

        // Step 4: Delete the category offer itself
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