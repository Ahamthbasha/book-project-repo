const Cart = require("../../models/cartModel");
const Product = require("../../models/productModel");
const Category = require("../../models/categoryModel");
const User = require("../../models/userModel");
const Wishlist = require('../../models/wishlistModel')

const mongoose = require("mongoose");
const ObjectId = require("mongoose");

const swal = require('sweetalert2')

let userData
const showWishlistPage = async (req, res) => {
    const userData = req.session.user;

    try {
        const userId = userData._id;

        // Find the user's wishlist
        const wishlist = await Wishlist.findOne({ user: new mongoose.Types.ObjectId(userId) });
        const wishlistCount = wishlist ? (wishlist.productId ? wishlist.productId.length : 0) : 0;

        // Fetch the cart items
        const cartItems = await Cart.find({ userId: new mongoose.Types.ObjectId(userId) });
        const cartProductIds = cartItems.map(item => item.product_Id.toString());

        // Aggregate the wishlist products
        const WishListProd = await Wishlist.aggregate([
            {
                $match: { user: new mongoose.Types.ObjectId(userId) }
            },
            {
                $unwind: '$productId'
            },
            {
                $lookup: {
                    from: 'products',
                    foreignField: '_id',
                    localField: 'productId',
                    as: 'product'
                }
            },
            {
                $project: {
                    _id: 1,
                    productId: 1,
                    productName: { $arrayElemAt: ['$product.name', 0] },
                    productImage: { $arrayElemAt: ['$product.imageUrl', 0] },
                    productPrice: { $arrayElemAt: ['$product.price', 0] },
                    productQuantity: { $arrayElemAt: ['$product.stock', 0] },
                    outOfStock: { $cond: { if: { $lte: [{ $arrayElemAt: ['$product.stock', 0] }, 0] }, then: true, else: false } },
                    ProductExistInCart: { $in: [{ $toString: '$productId' }, cartProductIds] }
                }
            }
        ]);

        console.log(WishListProd, "WishListProd");

        if (WishListProd.length > 0) {
            res.render('user/wishlist', { userData, WishListProd, wishCt: wishlistCount });
        } else {
            res.render('user/emptyWishlist', { userData });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
};

// const addToWishList = async (req, res) => {
//     try {
//         let { id } = (req.body)
//         // const Id = id.toString()
//         const userId = req.session.user
//         // console.log(Id)
//         let productData = await Product.findById(id).lean()
//         console.log(productData._id)
//         const productId = new mongoose.Types.ObjectId(id);


//         let wishlistData = await Wishlist.updateOne(
//             {
//                 user: userId
//             },
//             {
//                 $addToSet: {
//                     productId: productId,

//                 }

//             },
//             {
//                 upsert: true,
//                 new: true
//             }
//         )
//         if (wishlistData.modifiedCount > 0) {
//             res.json({ success: true });
//         } else {
//             res.json({ success: false });
//         }


//         console.log(wishlistData)
//     } catch (error) {
//         console.log(error.message);
//         res.status(500).send("Internal Server Error");
//     }

// }


const addToWishList = async (req, res) => {
    try {
        let { id } = req.body;
        const userId = req.session.user._id;  // Make sure you're using the correct user ID from the session

        // Find the product by ID
        let productData = await Product.findById(id).lean();
        if (!productData) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check if the product is already in the user's wishlist
        let wishlist = await Wishlist.findOne({ user: userId });
        if (wishlist && wishlist.productId.includes(productData._id)) {
            // Product already exists in the wishlist
            return res.json({ success: false, message: 'Product already exists in your wishlist' });
        }

        // If the product is not in the wishlist, add it
        let wishlistData = await Wishlist.updateOne(
            { user: userId },
            {
                $addToSet: { productId: productData._id }
            },
            {
                upsert: true,  // If no wishlist exists, create a new one
                new: true
            }
        );

        if (wishlistData.modifiedCount > 0 || wishlistData.upsertedCount > 0) {
            return res.json({ success: true });
        } else {
            return res.json({ success: false });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
}



const removeFromWishList = async (req, res) => {
    try {
        let { id, wishId } = req.body
        console.log(id, wishId)



        let productIdToRemove = new mongoose.Types.ObjectId(id);
        const wishListId = new mongoose.Types.ObjectId(wishId);

       
        let wishlistUpdateResult = await Wishlist.updateOne(
            { _id: wishListId },
            { $pull: { productId: productIdToRemove } }
        );
        if (wishlistUpdateResult.modifiedCount > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }

        
    } catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }

}

  module.exports={
    showWishlistPage,
    addToWishList,
    removeFromWishList
    
  }


