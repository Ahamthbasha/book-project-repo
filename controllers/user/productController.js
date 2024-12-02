const Category=require('../../models/categoryModel')
const Product=require('../../models/productModel')
const User=require('../../models/userModel')
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
    const proData = await Product.find({ is_blocked: false })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'category')
      .lean();
    const count = await Product.countDocuments({ is_blocked: false });
    const totalPages = Math.ceil(count / limit);
    const proCount = count;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    const newProduct = await Product.find({ is_blocked: false }).sort({ _id: -1 }).limit(3).lean();
    console.log(newProduct);
    res.render('user/products', {
      userData,
      proData,
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
  const { searchQuery, sortOption, categoryFilter, page, limit } = req.body;
  const matchStage = { $match: { is_blocked: false } };
  if (searchQuery) {
    matchStage.$match.name = { $regex: searchQuery, $options: "i" };
  }
  if (categoryFilter) {
    matchStage.$match.category = new mongoose.Types.ObjectId(categoryFilter);
  }
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
      sortStage.$sort.createdAt = 1;
  }
  const skipStage = { $skip: (page - 1) * limit };
  const limitStage = { $limit: limit };
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
    sortStage,
    skipStage,
    limitStage,
  ]);
  console.log(products);
  const totalProducts = await Product.countDocuments(matchStage.$match);
  res.json({ products, totalProducts });
};


const productView = async (req, res) => {
  try {
    const proId = req.query.id;
    console.log(proId, "....");
    const proData = await Product.findById(proId).lean();
    console.log(proData);
    if (!proData || proData.is_blocked) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const outOfStock = proData.stock === 0;
    const relatedProducts = await Product.find({
      category: proData.category,
      _id: { $ne: proId },
      is_blocked: false
    }).limit(4).lean();
    res.render('user/productview', { proData, relatedProducts, outOfStock });
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