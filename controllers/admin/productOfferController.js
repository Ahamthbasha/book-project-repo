const Product = require("../../models/productModel");
const ProductOffer = require("../../models/productOfferModel");
const moment = require("moment");

const productOfferPage = async (req, res) => {
    try {
        let page = parseInt(req.query.page) || 1;
        const limit = 3;

        let productOfferData = await ProductOffer.find()
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const count = await ProductOffer.countDocuments();
        const totalPages = Math.ceil(count / limit);
        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

        // Update currentStatus for all offers (better to do in background/cron in production)
        for (const data of productOfferData) {
            const isActive = data.endDate >= new Date() && data.startDate <= new Date();
            if (data.currentStatus !== isActive) {
                await ProductOffer.updateOne(
                    { _id: data._id },
                    { $set: { currentStatus: isActive } }
                );
            }
        }

        // Format dates for display
        productOfferData = productOfferData.map((data) => {
            data.startDate = moment(data.startDate).format("YYYY-MM-DD");
            data.endDate = moment(data.endDate).format("YYYY-MM-DD");
            return data;
        });

        res.render("admin/productOffer", {
            layout: "adminlayout",
            productOfferData,
            pages,
            currentPage: page,
        });
    } catch (error) {
        console.error("Product Offer Page Error:", error);
        res.status(500).send("Server error");
    }
};

const addProductOfferPage = async (req, res) => {
    try {
        const products = await Product.find({}).lean();
        res.render("admin/addProductOffer", { layout: "adminlayout", products });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
};

const addProductOffer = async (req, res) => {
    try {
        const { productName, productOfferPercentage, startDate, endDate } = req.body;

        // 1. Find product
        const product = await Product.findOne({ name: productName });
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // 2. Validate discount (5% to 90%)
        const discount = parseFloat(productOfferPercentage);
        if (isNaN(discount) || discount < 5 || discount > 90) {
            return res.status(400).json({ error: "Discount must be between 5% and 90%" });
        }

        // 3. Validate dates
        const today = moment().startOf("day");
        const start = moment(startDate).startOf("day");
        const end = moment(endDate).startOf("day");

        if (!start.isValid() || !end.isValid()) {
            return res.status(400).json({ error: "Invalid date format" });
        }

        // Start date must be today or future
        if (start.isBefore(today)) {
            return res.status(400).json({ error: "Start date must be today or a future date" });
        }

        // End date must be after start date (future from start)
        if (end.isSameOrBefore(start)) {
            return res.status(400).json({ error: "End date must be after start date" });
        }

        // 4. Check existing active offer
        const existingOffer = await ProductOffer.findOne({
            productId: product._id,
            currentStatus: true,
        });

        if (existingOffer) {
            return res.status(400).json({ error: "Active product offer already exists for this product" });
        }

        // 5. Calculate discount price
        const discountPrice = Math.round(product.price - (product.price * discount) / 100);

        // 6. Determine status
        const isActive = end.isSameOrAfter(today) && start.isSameOrBefore(today);

        // 7. Create offer
        const proOffer = new ProductOffer({
            productId: product._id,
            productName,
            productOfferPercentage: discount,
            discountPrice,
            startDate: start.toDate(),
            endDate: end.toDate(),
            currentStatus: isActive,
        });

        await proOffer.save();

        // 8. Link to product (optional - depends on your needs)
        product.productOfferId = proOffer._id;
        await product.save();

        res.redirect("/admin/productOffers");
    } catch (error) {
        console.error("Add Product Offer Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

const editProductOfferPage = async (req, res) => {
    try {
        const { id } = req.params;
        const editProductOfferData = await ProductOffer.findById(id).lean();
        if (!editProductOfferData) {
            return res.status(404).send("Product offer not found");
        }

        const products = await Product.find({}).lean();

        const startDate = moment(editProductOfferData.startDate).format("YYYY-MM-DD");
        const endDate = moment(editProductOfferData.endDate).format("YYYY-MM-DD");

        res.render("admin/editProductOffer", {
            layout: "adminlayout",
            editProductOfferData,
            startDate,
            endDate,
            products,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
};

const editProductOffer = async (req, res) => {
    try {
        const { offerId, productName, productOfferPercentage, startDate, endDate } = req.body;

        const offer = await ProductOffer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ error: "Product offer not found" });
        }

        const product = await Product.findOne({ name: productName });
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Discount validation (5% to 90%)
        const discount = parseFloat(productOfferPercentage);
        if (isNaN(discount) || discount < 5 || discount > 90) {
            return res.status(400).json({ error: "Discount must be between 5% and 90%" });
        }

        // Date validation
        const today = moment().startOf("day");
        const start = moment(startDate).startOf("day");
        const end = moment(endDate).startOf("day");

        // Start date must be today or future
        if (start.isBefore(today)) {
            return res.status(400).json({ error: "Start date must be today or a future date" });
        }

        // End date must be after start date
        if (end.isSameOrBefore(start)) {
            return res.status(400).json({ error: "End date must be after start date" });
        }

        // Check other active offers (except current one)
        const existingActive = await ProductOffer.findOne({
            productId: product._id,
            _id: { $ne: offerId },
            currentStatus: true,
        });

        if (existingActive) {
            return res.status(400).json({ error: "Another active offer already exists for this product" });
        }

        // Update offer
        offer.productName = productName;
        offer.productOfferPercentage = discount;
        offer.discountPrice = Math.round(product.price - (product.price * discount) / 100);
        offer.startDate = start.toDate();
        offer.endDate = end.toDate();
        offer.currentStatus = end.isSameOrAfter(today) && start.isSameOrBefore(today);

        await offer.save();

        res.redirect("/admin/productOffers");
    } catch (error) {
        console.error("Edit Product Offer Error:", error);
        res.status(500).json({ error: "Server error" });
    }
};

const deleteProductOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedOffer = await ProductOffer.findByIdAndDelete(id);
        
        if (!deletedOffer) {
            return res.status(404).json({ success: false, message: "Product offer not found" });
        }
        
        // Return JSON response for AJAX request
        res.status(200).json({ success: true, message: "Product offer deleted successfully" });
    } catch (error) {
        console.error("Delete Product Offer Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports = {
    productOfferPage,
    addProductOfferPage,
    addProductOffer,
    editProductOfferPage,
    editProductOffer,
    deleteProductOffer,
};