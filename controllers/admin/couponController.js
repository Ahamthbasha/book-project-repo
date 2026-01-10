const Coupon = require("../../models/couponModel");
const moment = require("moment");

const couponPage = async (req, res) => {
    try {
        const couponMsg = req.session.couponMsg;
        req.session.couponMsg = null;
        const couponExMsg = req.session.couponExMsg;
        req.session.couponExMsg = null;

        const page = parseInt(req.query.page) || 1;
        const limit = 10; // ← Recommended: increase limit (1 is too small for admin)

        const couponData = await Coupon.find()
            .skip((page - 1) * limit)
            .limit(limit)
            .lean()
            .sort({ createdAt: -1 }); // optional: newest first

        const count = await Coupon.countDocuments();
        const totalPages = Math.ceil(count / limit);
        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

        res.render("admin/coupon", {
            couponData,
            couponMsg,
            couponExMsg,
            pages,
            currentPage: page,
            layout: "adminlayout",
        });
    } catch (error) {
        console.error("Coupon page error:", error);
        res.status(500).send("Internal Server Error");
    }
};

const addCouponPage = async (req, res) => {
    try {
        res.render("admin/addCoupon", {
            title: "Add New Coupon",
            layout: "adminlayout",
            todayFormatted: new Date().toISOString().split("T")[0],
            couponMsg: req.session.couponMsg,
            couponExMsg: req.session.couponExMsg,
        });

        // Clear messages after render
        req.session.couponMsg = null;
        req.session.couponExMsg = null;
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};

const addCouponPost = async (req, res) => {
    try {
        const { code, percent, expDate, maxDiscount, minPurchase } = req.body;

        if (!code || !percent || !expDate || !maxDiscount || !minPurchase) {
            req.session.couponExMsg = "All fields are required";
            return res.redirect("/admin/add_coupon");
        }

        const discount = parseFloat(percent);
        const minPurchaseAmount = parseFloat(minPurchase);
        const maxDiscountAmount = parseFloat(maxDiscount);

        if (isNaN(discount) || discount < 1 || discount > 90) {
            req.session.couponExMsg = "Discount must be between 1 and 90%";
            return res.redirect("/admin/add_coupon");
        }

        if (isNaN(minPurchaseAmount) || minPurchaseAmount < 0) {
            req.session.couponExMsg = "Minimum purchase amount cannot be negative";
            return res.redirect("/admin/add_coupon");
        }

        if (isNaN(maxDiscountAmount) || maxDiscountAmount < 0) {
            req.session.couponExMsg = "Maximum discount amount cannot be negative";
            return res.redirect("/admin/add_coupon");
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const selectedExpiry = new Date(expDate);
        if (selectedExpiry < today) {
            req.session.couponExMsg = "Expiry date must be today or in the future";
            return res.redirect("/admin/add_coupon");
        }

        const existingCoupon = await Coupon.findOne({ code: code.trim().toUpperCase() });

        if (existingCoupon) {
            req.session.couponExMsg = "Coupon code already exists";
            return res.redirect("/admin/add_coupon");
        }

        const coupon = new Coupon({
            code: code.trim().toUpperCase(),
            discount,
            expiryDate: selectedExpiry,
            minPurchase: minPurchaseAmount,
            maxDiscount: maxDiscountAmount,
        });

        await coupon.save();

        req.session.couponMsg = "Coupon created successfully!";
        res.redirect("/admin/coupons");
    } catch (error) {
        console.error("Add coupon error:", error);
        req.session.couponExMsg = "Failed to create coupon. Please try again.";
        res.redirect("/admin/add_coupon");
    }
};

const editCouponPage = async (req, res) => {
    try {
        const { id } = req.params;

        const coupon = await Coupon.findById(id).lean();
        if (!coupon) {
            req.session.couponExMsg = "Coupon not found";
            return res.redirect("/admin/coupons");
        }

        // Format date for <input type="date">
        coupon.expiryDateFormatted = moment(coupon.expiryDate).format("YYYY-MM-DD");

        res.render("admin/editCoupon", {
            coupon,
            layout: "adminlayout",
            todayFormatted: new Date().toISOString().split("T")[0],
            couponMsg: req.session.couponMsg,
            couponExMsg: req.session.couponExMsg,
        });

        // Clear flash messages
        req.session.couponMsg = null;
        req.session.couponExMsg = null;
    } catch (error) {
        console.error("Edit coupon page error:", error);
        res.status(500).send("Internal Server Error");
    }
};

const editCouponPost = async (req, res) => {
    try {
        const { code, discount, expDate, minPurchase, maxDiscount } = req.body;
        const couponId = req.params.id;

        const coupon = await Coupon.findById(couponId);
        if (!coupon) {
            req.session.couponExMsg = "Coupon not found";
            return res.redirect("/admin/coupons");
        }

        const discountNum = parseFloat(discount);
        if (isNaN(discountNum) || discountNum < 1 || discountNum > 90) {
            req.session.couponExMsg = "Discount must be between 1 and 90%";
            return res.redirect(`/admin/editcoupon/${couponId}`);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiry = new Date(expDate);
        if (expiry < today) {
            req.session.couponExMsg = "Expiry date must be today or in the future";
            return res.redirect(`/admin/editcoupon/${couponId}`);
        }

        // Update fields
        coupon.code = code.trim().toUpperCase();
        coupon.discount = discountNum;
        coupon.expiryDate = expiry;
        coupon.minPurchase = parseFloat(minPurchase);
        coupon.maxDiscount = parseFloat(maxDiscount);

        await coupon.save();

        req.session.couponMsg = "Coupon updated successfully!";
        res.redirect("/admin/coupons");
    } catch (error) {
        console.error("Edit coupon error:", error);
        req.session.couponExMsg = "Failed to update coupon. Please try again.";
        res.redirect(`/admin/editcoupon/${req.params.id}`);
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        await Coupon.findByIdAndDelete(id);
        req.session.couponMsg = "Coupon deleted successfully";
        res.redirect("/admin/coupons");
    } catch (error) {
        console.error("Delete coupon error:", error);
        req.session.couponExMsg = "Failed to delete coupon";
        res.redirect("/admin/coupons");
    }
};

module.exports = {
    couponPage,
    addCouponPage,
    addCouponPost,
    editCouponPage,
    editCouponPost,
    deleteCoupon,
};