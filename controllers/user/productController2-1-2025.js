const Category=require('../../models/categoryModel')
const Product=require('../../models/productModel')
const User=require('../../models/userModel')
const Cart=require('../../models/cartModel')
const mongoose=require("mongoose")


const getProduct = async (req, res) => {
  let userData = false;
  if (req.session.user) {
    const user = req.session.user;
    const id = user._id;
    userData = await User.findById(id).lean();
    console.log(userData);
  }

  try {
    let page = 1; // Initial page is always 1 for the GET request
    const limit = 9;
    const loadCatData = await Category.find({}).lean();
    // const loadProData = await Product.aggregate([
    //   { $match: { is_blocked: false } }, // Filter for non-blocked products
    //   { $skip: (page - 1) * limit },
    //   { $limit: limit },
    //   {
    //     $lookup: {
    //       from: "productoffers", // Reference to the productOffers collection
    //       localField: "_id", // Product's offer reference
    //       foreignField: "productId", // Lookup by productId
    //       as: "productOffer", // Store the result in the productOffer array
    //     },
    //   },
    //   { 
    //     $unwind: { path: "$productOffer", preserveNullAndEmptyArrays: true } 
    //   },
    //   {
    //     $project: {
    //       _id: 1,
    //       name: 1,
    //       price: 1,
    //       description: 1,
    //       stock: 1,
    //       popularity: 1,
    //       imageUrl: 1,
    //       productOffer: 1,
    //       discountedPrice: {
    //         $cond: {
    //           if: {
    //             $and: [
    //               { $eq: ["$productOffer.currentStatus", true] },
    //               { $ne: ["$productOffer.discountPrice", null] },
    //             ],
    //           },
    //           then: "$productOffer.discountPrice", // Use the product offer discount price
    //           else: "$price", // Otherwise, use the original price
    //         },
    //       },
    //       offerAvailable: {
    //         $cond: {
    //           if: {
    //             $eq: ["$productOffer.currentStatus", true], // Only check product offer availability
    //           },
    //           then: true, // Offer is available
    //           else: false, // No offer
    //         },
    //       },
    //     },
    //   },
    // ]);
    
    const loadProData = await Product.aggregate([
      { $match: { is_blocked: false } }, // Filter for non-blocked products
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: "productoffers", // Reference to the productOffers collection
          localField: "_id", // Product's offer reference
          foreignField: "productId", // Lookup by productId
          as: "productOffer", // Store the result in the productOffer array
        },
      },
      { 
        $unwind: { path: "$productOffer", preserveNullAndEmptyArrays: true } 
      },
      // {
      //   $project: {
      //     _id: 1,
      //     name: 1,
      //     price: 1,
      //     description: 1,
      //     stock: 1,
      //     popularity: 1,
      //     imageUrl: 1,
      //     productOffer: 1,
      //     discountedPrice: {
      //       $cond: {
      //         if: {
      //           $and: [
      //             { $eq: ["$productOffer.currentStatus", true] },
      //             { $ne: ["$productOffer.discountPrice", null] },
      //           ],
      //         },
      //         then: "$productOffer.discountPrice", // Use the product offer discount price
      //         else: "$price", // Otherwise, use the original price
      //       },
      //     },
      //     offerAvailable: {
      //       $cond: {
      //         if: {
      //           $eq: ["$productOffer.currentStatus", true], // Only check product offer availability
      //         },
      //         then: true, // Offer is available
      //         else: false, // No offer
      //       },
      //     },
      //     offerPercentage: {
      //       $cond: {
      //         if: { $eq: ["$productOffer.currentStatus", true] }, // Check if offer is active
      //         then: "$productOffer.productOfferPercentage", // Fetch the offer percentage
      //         else: 0, // No offer, set percentage to 0
      //       },
      //     },
      //   },
      // },
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          description: 1,
          stock: 1,
          popularity: 1,
          imageUrl: 1,
          productOffer: 1,
          discountedPrice: {
            $cond: {
              if: {
                $and: [
                  { $eq: ["$productOffer.currentStatus", true] },
                  { $ne: ["$productOffer.discountPrice", null] },
                ],
              },
              then: "$productOffer.discountPrice",
              else: "$price",
            },
          },
          offerAvailable: {
            $cond: {
              if: {
                $eq: ["$productOffer.currentStatus", true],
              },
              then: true,
              else: false,
            },
          },
          offerPercentage: {
            $cond: {
              if: { $eq: ["$productOffer.currentStatus", true] }, // Check if offer is active
              then: "$productOffer.productOfferPercentage", // Fetch the offer percentage
              else: null, // Set to null if no offer
            },
          },
        },
      }
      
    ]);
    

    console.log("load the product data",loadProData); // To debug and check the results of the aggregation

    const count = await Product.countDocuments({ is_blocked: false });
    const totalPages = Math.ceil(count / limit);
    const proCount = count;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    // Fetch the latest 3 products for the 'new arrivals' section
    const newProduct = await Product.find({ is_blocked: false }).sort({ _id: -1 }).limit(3).lean();

    res.render('user/products', {
      userData,
      proData: loadProData,
      pages,
      currentPage: page,
      loadCatData,
      newProduct,
      currentFunction: 'getProductsPage',
      proCount
    });
  } catch (error) {
    console.log(error);
  }
};

const searchSortFilter = async (req, res) => {
  const { searchQuery, sortOption, categoryFilter, page = 1, limit = 9 } = req.body;

  // Match stage based on search query and category filter
  const matchStage = { $match: {} };
  if (searchQuery) {
    matchStage.$match.name = { $regex: searchQuery, $options: "i" };  // Case-insensitive search
  }
  if (categoryFilter) {
    matchStage.$match.category = new mongoose.Types.ObjectId(categoryFilter);  // Filter by category
  }

  // Construct the sort stage
  const sortStage = { $sort: {} };
  switch (sortOption) {
    case "priceAsc":
      sortStage.$sort.price = 1;
      break;
    case "priceDesc":
      sortStage.$sort.price = -1;
      break;
    case "nameAsc":
      sortStage.$sort.name = 1;
      break;
    case "nameDesc":
      sortStage.$sort.name = -1;
      break;
    case "newArrivals":
      sortStage.$sort.createdAt = -1;
      break;
    case "popularity":
      sortStage.$sort.popularity = -1;
      break;
    default:
      sortStage.$sort.createdAt = 1;  // Default sort by creation date
  }

  // Pagination: skip and limit
  const skipStage = { $skip: (page - 1) * limit };  // Skip records based on the current page
  const limitStage = { $limit: limit };  // Limit the number of results per page

  // Fetch products with aggregation pipeline
  const products = await Product.aggregate([
    matchStage, 
    {
      $lookup: {
        from: "categories", 
        localField: "category", 
        foreignField: "_id", 
        as: "category",
      },
    },
    {
      $unwind: {
        path: "$category", 
        preserveNullAndEmptyArrays: true, 
      },
    },
    {
      $lookup: {
        from: "productoffers",  
        localField: "_id",  
        foreignField: "productId",  
        as: "productOffer",
      },
    },
    {
      $unwind: {
        path: "$productOffer", 
        preserveNullAndEmptyArrays: true, 
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        price: 1,
        description: 1,
        stock: 1,
        popularity: 1,
        bestSelling: 1,
        imageUrl: 1,
        category: {
          _id: 1,
          category: 1,
          imageUrl: 1,
          isListed: 1,
          bestSelling: 1,
        },
        productOffer: 1,  
        discountPrice: {
          $cond: {
            if: { $eq: ["$productOffer.currentStatus", true] },  
            then: "$productOffer.discountPrice",  
            else: "$price",  
          },
        },
        offerAvailable: {
          $cond: {
            if: { $eq: ["$productOffer.currentStatus", true] },
            then: true,
            else: false,
          },
        },
        offerPercentage: {
          $cond: {
            if: { $eq: ["$productOffer.currentStatus", true] },
            then: {
              $multiply: [
                { $divide: [{ $subtract: ["$price", "$productOffer.discountPrice"] }, "$price"] },
                100,
              ], // Calculate offer percentage
            },
            else: 0,
          },
        },
      },
    },
    // {
    //   $project: {
    //     _id: 1,
    //     name: 1,
    //     price: 1,
    //     description: 1,
    //     stock: 1,
    //     popularity: 1,
    //     imageUrl: 1,
    //     productOffer: 1,
    //     discountedPrice: {
    //       $cond: {
    //         if: {
    //           $and: [
    //             { $eq: ["$productOffer.currentStatus", true] },
    //             { $ne: ["$productOffer.discountPrice", null] },
    //           ],
    //         },
    //         then: "$productOffer.discountPrice",
    //         else: "$price",
    //       },
    //     },
    //     offerAvailable: {
    //       $cond: {
    //         if: {
    //           $eq: ["$productOffer.currentStatus", true],
    //         },
    //         then: true,
    //         else: false,
    //       },
    //     },
    //     offerPercentage: {
    //       $cond: {
    //         if: { $eq: ["$productOffer.currentStatus", true] }, // Check if offer is active
    //         then: "$productOffer.productOfferPercentage", // Fetch the offer percentage
    //         else: null, // Set to null if no offer
    //       },
    //     },
    //   },
    // },
    sortStage, 
    skipStage, 
    limitStage, 
  ]);

  // Calculate total products count
  const totalProducts = await Product.countDocuments(matchStage.$match);

  // Calculate total number of pages
  const totalPages = Math.ceil(totalProducts / limit);
  
  // Return paginated results along with page details
  res.json({
    products,
    totalProducts,
    totalPages,  // Total pages
    currentPage: page,  // Current page
    limit,
  });
};


const productView = async (req, res) => {
  try {
    const userData = req.session.user; // Get the logged-in user data from session
    const proId = req.query.id; // Product ID from the query
    console.log("Product ID: ", proId);

    // Fetch product data along with the offer from productoffers collection using aggregation
    const products = await Product.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(proId) } }, // Match product by productID
      {
        $lookup: {
          from: "productoffers", // Lookup from the productoffers collection
          localField: "_id", // The field from Product that we are matching (product ID)
          foreignField: "productId", // The field in productoffers that refers to Product's ID
          as: "productOffer", // The name of the field where the offer data will be stored
        },
      },
      {
        $unwind: {
          path: "$productOffer",  // Unwind the array so that we can access individual offer data
          preserveNullAndEmptyArrays: true, // If no offer exists, it will be null
        },
      },
    ]);

    const proData = products[0]; // Assuming the aggregation returns an array, we take the first element
    console.log(proData);

    // If product is not found or is blocked, return a 404 error
    if (!proData || proData.is_blocked) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if the product is out of stock
    const outOfStock = proData.stock === 0;

    // Fetch related products based on category, excluding the current product
    const relatedProducts = await Product.find({
      category: proData.category,
      _id: { $ne: proId },
      is_blocked: false,
    }).limit(4).lean();

    // Increment product popularity (to track how often it's viewed)
    await Product.updateOne(
      { _id: proId },
      { $inc: { popularity: 1 } }
    );

    // Check if the product exists in the user's cart (if the user is logged in)
    let productExistInCart = false;
    if (userData) {
      const ProductExist = await Cart.find({
        userId: userData._id,
        product_Id: proId,
      });

      if (ProductExist.length > 0) {
        productExistInCart = true;
      }
    }

    // Render the product details page with all the necessary data, including productOffer
    res.render("user/productview", {
      proData,               // Pass product data
      productOffer: proData.productOffer, // Pass product offer data
      outOfStock,            // Pass outOfStock status
      productExistInCart,    // Pass cart status
      userData,              // Pass user data (if logged in)
      relatedProducts,       // Pass related products
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'An error occurred while loading the product view' });
  }
};


module.exports={
    getProduct,
    searchSortFilter,
    productView
}