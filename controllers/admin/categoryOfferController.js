const Category = require("../../models/categoryModel");
const categoryOffer = require("../../models/categoryOfferModel");
const Product = require("../../models/productModel");
const productOffer = require("../../models/productOfferModel");
const moment = require('moment');

const categoryOfferPage = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        const limit = 3;

        let categoryOffers = await categoryOffer.find()
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const count = await categoryOffer.countDocuments();
        const totalPages = Math.ceil(count / limit);
        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

        // Update currentStatus for all offers
        for (const data of categoryOffers) {
            const isActive = data.endDate >= new Date() && data.startDate <= new Date();
            if (data.currentStatus !== isActive) {
                await categoryOffer.updateOne(
                    { _id: data._id },
                    { $set: { currentStatus: isActive } }
                );
            }
        }

        // Format dates for display
        categoryOffers = categoryOffers.map((data) => {
            data.startDate = moment(data.startDate).format("YYYY-MM-DD");
            data.endDate = moment(data.endDate).format("YYYY-MM-DD");
            return data;
        });

        res.render("admin/categoryOffer", { layout: "adminlayout", categoryOffers, pages, currentPage: page });
    } catch (error) {
        console.error("Category Offer Page Error:", error);
        res.status(500).send("Server error");
    }
};

const addCategoryOfferPage = async (req, res) => {
    try {
        const category = await Category.find({}).lean();
        res.render("admin/addCategoryOffer", { layout: "adminlayout", category });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
};

const addCategoryOffer = async (req, res) => {
    try {
        const { categoryName, categoryOfferPercentage, categoryOfferStartDate, categoryOfferEndDate } = req.body;

        // 1. Find category
        const category = await Category.findOne({ category: categoryName });
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // 2. Validate discount (5% to 90%)
        const discount = parseFloat(categoryOfferPercentage);
        if (isNaN(discount) || discount < 5 || discount > 90) {
            return res.status(400).json({ error: "Discount must be between 5% and 90%" });
        }

        // 3. Validate dates
        const today = moment().startOf("day");
        const start = moment(categoryOfferStartDate).startOf("day");
        const end = moment(categoryOfferEndDate).startOf("day");

        if (!start.isValid() || !end.isValid()) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        // Start date must be today or future
        if (start.isBefore(today)) {
            return res.status(400).json({ error: "Start date must be today or a future date" });
        }

        // End date must be after start date
        if (end.isSameOrBefore(start)) {
            return res.status(400).json({ error: "End date must be after start date" });
        }

        // 4. Check existing active offer
        const existingOffer = await categoryOffer.findOne({
            categoryId: category._id,
            currentStatus: true
        });

        if (existingOffer) {
            return res.status(400).json({ error: "An active category offer already exists for this category" });
        }

        // 5. Determine status
        const isActive = end.isSameOrAfter(today) && start.isSameOrBefore(today);

        // 6. Create category offer
        const catOffer = new categoryOffer({
            categoryName,
            categoryId: category._id,
            categoryOfferPercentage: discount,
            startDate: start.toDate(),
            endDate: end.toDate(),
            currentStatus: isActive
        });
        await catOffer.save();
        console.log("Category offer saved:", catOffer);

        // 7. Apply offer to all products in the category
        const productsInCategory = await Product.find({ category: category._id });
        console.log("Products in Category before applying offer:", productsInCategory);

        for (const product of productsInCategory) {
            console.log("Product Details before applying offer:", product);
            const discountedPrice = Math.round(product.price - (product.price * discount) / 100);

            const existingProductOffer = await productOffer.findOne({ productId: product._id });

            if (existingProductOffer) {
                existingProductOffer.productOfferPercentage = discount;
                existingProductOffer.discountPrice = discountedPrice;
                existingProductOffer.startDate = start.toDate();
                existingProductOffer.endDate = end.toDate();
                existingProductOffer.currentStatus = isActive;
                await existingProductOffer.save();
                console.log("Updated Product Offer:", existingProductOffer);
            } else {
                const newProductOffer = new productOffer({
                    productId: product._id,
                    productName: product.name,
                    productOfferPercentage: discount,
                    discountPrice: discountedPrice,
                    startDate: start.toDate(),
                    endDate: end.toDate(),
                    currentStatus: isActive
                });
                await newProductOffer.save();
                console.log("New Product Offer Created:", newProductOffer);
            }
            console.log(`Updated product offer for product: ${product.name}`);
        }

        res.status(200).json({ success: true, message: "Category offer created successfully" });
    } catch (error) {
        console.error("Add Category Offer Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

const editCategoryOfferPage = async (req, res) => {
    try {
        const { id } = req.params;
        const editCategoryOfferData = await categoryOffer.findById(id).lean();
        
        if (!editCategoryOfferData) {
            return res.status(404).send("The category offer does not exist");
        }

        const category = await Category.find().lean();
        console.log(editCategoryOfferData);

        const startDate = moment(editCategoryOfferData.startDate).format("YYYY-MM-DD");
        const endDate = moment(editCategoryOfferData.endDate).format("YYYY-MM-DD");

        res.render("admin/editCategoryOffer", { 
            layout: "adminlayout", 
            editCategoryOfferData, 
            startDate, 
            endDate, 
            category 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
};

const editCategoryOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryName, categoryOfferPercentage, categoryOfferStartDate, categoryOfferEndDate } = req.body;

        // 1. Find category offer
        const catOffer = await categoryOffer.findById(id);
        if (!catOffer) {
            return res.status(404).json({ error: "Category offer not found" });
        }

        // 2. Find category
        const category = await Category.findOne({ category: categoryName });
        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        // 3. Validate discount (5% to 90%)
        const discount = parseFloat(categoryOfferPercentage);
        if (isNaN(discount) || discount < 5 || discount > 90) {
            return res.status(400).json({ error: "Discount must be between 5% and 90%" });
        }

        // 4. Validate dates
        const today = moment().startOf("day");
        const start = moment(categoryOfferStartDate).startOf("day");
        const end = moment(categoryOfferEndDate).startOf("day");

        if (!start.isValid() || !end.isValid()) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        // Start date must be today or future
        if (start.isBefore(today)) {
            return res.status(400).json({ error: "Start date must be today or a future date" });
        }

        // End date must be after start date
        if (end.isSameOrBefore(start)) {
            return res.status(400).json({ error: "End date must be after start date" });
        }

        // 5. Check other active offers (except current one)
        const existingActive = await categoryOffer.findOne({
            categoryId: category._id,
            _id: { $ne: id },
            currentStatus: true
        });

        if (existingActive) {
            return res.status(400).json({ error: "Another active offer already exists for this category" });
        }

        // 6. Determine status
        const isActive = end.isSameOrAfter(today) && start.isSameOrBefore(today);

        // 7. Update category offer
        catOffer.categoryName = categoryName;
        catOffer.categoryOfferPercentage = discount;
        catOffer.startDate = start.toDate();
        catOffer.endDate = end.toDate();
        catOffer.currentStatus = isActive;
        await catOffer.save();
        console.log("Category offer updated:", catOffer);

        // 8. Update all products in the category
        const productsInCategory = await Product.find({ category: category._id });

        for (const product of productsInCategory) {
            const discountedPrice = Math.round(product.price - (product.price * discount) / 100);
            const existingProductOffer = await productOffer.findOne({ productId: product._id });

            if (existingProductOffer) {
                existingProductOffer.productOfferPercentage = discount;
                existingProductOffer.discountPrice = discountedPrice;
                existingProductOffer.startDate = start.toDate();
                existingProductOffer.endDate = end.toDate();
                existingProductOffer.currentStatus = isActive;
                await existingProductOffer.save();
            } else {
                const newProductOffer = new productOffer({
                    productId: product._id,
                    productName: product.name,
                    productOfferPercentage: discount,
                    discountPrice: discountedPrice,
                    startDate: start.toDate(),
                    endDate: end.toDate(),
                    currentStatus: isActive
                });
                await newProductOffer.save();
            }
        }

        res.status(200).json({ success: true, message: "Category offer updated successfully" });
    } catch (error) {
        console.error("Edit Category Offer Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

const deleteCategoryOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const categoryOfferToDelete = await categoryOffer.findById(id);

        if (!categoryOfferToDelete) {
            return res.status(404).json({ success: false, message: "Category offer not found" });
        }

        // Find all products in the category
        const productsInCategory = await Product.find({ category: categoryOfferToDelete.categoryId });

        // Delete related product offers
        for (const product of productsInCategory) {
            const existingProductOffer = await productOffer.findOne({ productId: product._id });
            if (existingProductOffer) {
                await productOffer.findByIdAndDelete(existingProductOffer._id);
                console.log(`Product offer for ${product.name} deleted`);
            }
        }

        // Delete the category offer
        await categoryOffer.findByIdAndDelete(id);
        console.log("Category offer deleted successfully");
        
        res.status(200).json({ 
            success: true, 
            message: "Category offer and associated product offers deleted successfully" 
        });
    } catch (error) {
        console.error("Delete Category Offer Error:", error);
        res.status(500).json({ success: false, message: "An error occurred while deleting the category offer" });
    }
};

module.exports = {
    categoryOfferPage,
    addCategoryOfferPage,
    addCategoryOffer,
    editCategoryOfferPage,
    editCategoryOffer,
    deleteCategoryOffer
};