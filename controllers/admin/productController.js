// const Product=require("../../models/productModel")
// const productOffer=require("../../models/productOfferModel")
// const Category=require("../../models/categoryModel")
// const fs=require("fs")
// const path=require("path")

// const getProduct = async (req, res) => {
//   try {
//       let page = 1;
//       if (req.query.page) {
//           page = parseInt(req.query.page, 10);  // Convert to an integer
//       }

//       const limit = 10; // Set the number of products per page
//       const skip = (page - 1) * limit; // Skip the appropriate number of products

//       // Fetch the product data with pagination and category lookup
//       const productData = await Product.aggregate([
//           {
//               $lookup: {
//                   from: "categories",
//                   localField: "category",
//                   foreignField: "_id",
//                   as: "category",
//               },
//           },
//           {
//               $unwind: "$category",
//           },
//           {
//               $skip: skip, // Skip products based on the current page
//           },
//           {
//               $limit: limit, // Limit the number of products per page
//           },
//       ]);

//       // Count the total number of products in the database (for pagination)
//       const count = await Product.countDocuments();

//       // Calculate total pages based on the count of products and the limit
//       const totalPages = Math.ceil(count / limit);
//       const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

//       // Render the page with product data, pagination links, and current page
//       res.render("admin/products", {
//           productData,
//           pages,
//           currentPage: page,
//           layout: 'adminlayout',
//       });
//   } catch (error) {
//       console.log(error);
//       res.status(500).send('Internal Server Error');
//   }
// };

// const addProductPage = async (req, res) => {
//   try {
//     const category = await Category.find({}).lean();
//     const productExists = req.session.productExists;
//     req.session.productExists = null; 

//     res.render("admin/addproduct", { layout: "adminlayout", category, productExists });
//   } catch (error) {
//     console.log(error.message);
//     res.status(500).send("Internal Server Error");
//   }
// };

// // Add New Product
// const addNewProduct = async (req, res) => {
//   try {
//     const { name, price, description, category, stock } = req.body;
//     const files = req.files;
//     const images = [];
//     files.forEach((file) => {
//       const image = file.filename;
//       images.push(image);
//     });

//     const existingProduct = await Product.findOne({
//       name: { $regex: new RegExp("^" + name + "$", "i") }, 
//     });

//     if (existingProduct) {
//       req.session.productExists = true;
//       return res.redirect("/admin/new_Product"); 
//     }

//     const newProduct = new Product({
//       name: req.body.name,
//       price: req.body.price,
//       description: req.body.description,
//       category: req.body.category,
//       stock: req.body.stock,
//       //imageUrl: req.body.image
//       imageUrl: images,
//     });
//     await newProduct
//       .save()
//       .then((result) => {
//         res.redirect("/admin/product");
//         console.log(newProduct);
//       })
//       .catch((err) => console.log(err));
//   } catch (error) {
//     console.error("Error creating Product:", error);
//     res.status(500).send("Internal Server Error");
//   }
// };

//   /// To update Product post///
  
// const editProduct = async (req, res) => {
//     try {
//         let proId = req.params.id;
//         const proData = await Product.findById(proId).lean();
//         const catogories = await Category.find({ isListed: true }).lean();

//         // Log the retrieved product data and categories
//         console.log("Product Data:", proData);
//         console.log("Categories:", catogories);

//         // Check if proData is found
//         if (!proData) {
//             return res.status(404).send('Product not found');
//         }

//         catogories.forEach((category) => {
//             category.isSelected = category._id.toString() === proData.category.toString();
//         });

//         res.render("admin/edit_product", { proData, catogories, layout: 'adminlayout' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server Error');
//     }
// };

// const updateProduct = async (req, res) => {
//   try {
//       const proId = req.params.id;

//       // Check for multer error (invalid image type)
//       if (req.fileValidationError) {
//           return res.status(400).render("admin/edit_product", {
//               proData: req.body,
//               catogories: await Category.find({ isListed: true }).lean(),
//               errorMessage: req.fileValidationError, // Send the error to the template
//               layout: 'adminlayout'
//           });
//       }

//       const { name, price, description, category, stock } = req.body;

//       // Fetch the product first
//       const product = await Product.findById(proId);

//       // Check if another product with the same name exists
//       const existingProduct = await Product.findOne({ name: name, _id: { $ne: proId } });

//       if (existingProduct) {
//           return res.status(400).render("admin/edit_product", {
//               proData: {
//                   ...req.body,
//                   imageUrl: product.imageUrl // Ensure existing images are included
//               },
//               catogories: await Category.find({ isListed: true }).lean(),
//               errorMessage: "A product with this name already exists.",
//               layout: 'adminlayout'
//           });
//       }

//       // Handle image files
//       const exImage = product.imageUrl;
//       const files = req.files;
//       let updImages = [];

//       if (files && files.length > 0) {
//           // Add new images to existing images
//           const newImages = files.map((file) => file.filename);
//           updImages = [...exImage, ...newImages];
//           product.imageUrl = updImages;
//       } else {
//           updImages = exImage; // Keep the existing images if no new images are uploaded
//       }

//       // Update product details
//       await Product.findByIdAndUpdate(
//           proId,
//           {
//               name: name,
//               price: price,
//               description: description,
//               category: category,
//               stock: stock,
//               is_blocked: false,
//               imageUrl: updImages,
//           },
//           { new: true }
//       );

//       // If the price has changed, we need to update the offer (if any)
//       if (product.price !== price) {
//           const existingOffer = await productOffer.findOne({
//               productId: product._id,
//               currentStatus: true // Ensure we are looking for active offers
//           });

//           if (existingOffer) {
//               // Recalculate the discount price based on the new product price
//               const newDiscountPrice = price - (price * existingOffer.productOfferPercentage) / 100;
//               existingOffer.discountPrice = newDiscountPrice;
//               await existingOffer.save(); // Save the updated offer
//           }
//       }

//       // Redirect to the product list after update
//       res.redirect("/admin/product");
//   } catch (error) {
//       console.log(error);
//       res.status(500).send('Server Error');
//   }
// };

//   const deleteProduct = async (req, res) => {
//     const proId = req.params.id;
//     await Product.findByIdAndDelete(proId)
//     res.redirect('/admin/product')

//   };
  
// const deleteProImage = async (req, res) => {
//     try {
//       const { id, image } = req.query;
  
//       // Check if product ID and image name are provided
//       if (!id || !image) {
//         return res.status(400).send({ error: "Product ID and image name must be provided" });
//       }
  
//       console.log(`Id: ${id} and image: ${image}`);
  
//       // Find the product by ID
//       const product = await Product.findById(id);
//       if (!product) {
//         return res.status(404).send({ error: "Product not found" });
//       }
  
//       // Check if the image exists in the product's imageUrl array
//       const imageIndex = product.imageUrl.indexOf(image);
//       if (imageIndex === -1) {
//         return res.status(400).send({ error: "Image not found" });
//       }
  
//       // Remove the image from the array
//       const deletedImage = product.imageUrl.splice(imageIndex, 1)[0];//it delete the image based on the imageIndex starting and delete it.The [0] extracts the first element of the array returned by splice()
//       console.log("Deleted image:", deletedImage);
  
//       // Save the product after removing the image
//       await product.save();
  
//       // Build the path to the image file
//       const imagePath = path.join(__dirname, `../../public/images/products/${deletedImage}`);
//       console.log("Image path:", imagePath);
  
//       // Check if the image exists on the filesystem and delete it
//       if (fs.existsSync(imagePath)) {
//         fs.unlinkSync(imagePath);
//         console.log("Image file deleted");
//       } else {
//         return res.status(404).send({ error: "Image file not found" });
//       }
  
//       // Respond with success message
//       res.status(200).send({ message: "Image deleted successfully" });
//     } catch (error) {
//       console.error("Error deleting image:", error);
//       res.status(500).send({ error: "Server error, could not delete image" });
//     }
//   };
  
//   const blockProduct = async (req, res) => {
//     const id = req.body.id
//     // const proId = req.params.id;
//     const prodData = await Product.findById(id);
//     const isBlocked = prodData.is_blocked;
  
//     const proData = await Product.findByIdAndUpdate(
//       id,
//       { $set: { is_blocked: !isBlocked } },
//       { new: true }
//     );
  
//     res.redirect("/admin/product");
//     req.session.proDelete = true;
//   };

// module.exports={
//     getProduct,
//     addProductPage,
//     addNewProduct,
//     editProduct,
//     updateProduct,
//     deleteProImage,
//     blockProduct,
//     deleteProduct
// }









































const Product = require("../../models/productModel");
const productOffer = require("../../models/productOfferModel");
const Category = require("../../models/categoryModel");
const { cloudinary } = require("../../middlewares/multer")

const getProduct = async (req, res) => {
  try {
    let page = 1;
    if (req.query.page) {
      page = parseInt(req.query.page, 10);
    }

    const limit = 10;
    const skip = (page - 1) * limit;

    const productData = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ]);

    const count = await Product.countDocuments();
    const totalPages = Math.ceil(count / limit);
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    res.render("admin/products", {
      productData,
      pages,
      currentPage: page,
      layout: "adminlayout",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const addProductPage = async (req, res) => {
  try {
    const category = await Category.find({}).lean();
    const productExists = req.session.productExists;
    req.session.productExists = null;

    res.render("admin/addproduct", {
      layout: "adminlayout",
      category,
      productExists,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};

const addNewProduct = async (req, res) => {
  try {
    const { name, price, description, category, stock } = req.body;
    const files = req.files;
    const images = [];

    // Extract Cloudinary URLs from uploaded files
    if (files && files.length > 0) {
      files.forEach((file) => {
        images.push(file.path); // Cloudinary URL is stored in file.path
      });
    }

    // Check if product already exists
    const existingProduct = await Product.findOne({
      name: { $regex: new RegExp("^" + name + "$", "i") },
    });

    if (existingProduct) {
      // Delete uploaded images from Cloudinary if product exists
      if (files && files.length > 0) {
        for (const file of files) {
          await cloudinary.uploader.destroy(file.filename);
        }
      }
      req.session.productExists = true;
      return res.redirect("/admin/new_Product");
    }

    const newProduct = new Product({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      category: req.body.category,
      stock: req.body.stock,
      imageUrl: images,
    });

    await newProduct.save();
    res.redirect("/admin/product");
    console.log("New product added:", newProduct);
  } catch (error) {
    console.error("Error creating Product:", error);
    
    // Clean up uploaded files if error occurs
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          await cloudinary.uploader.destroy(file.filename);
        } catch (err) {
          console.error("Error deleting image from Cloudinary:", err);
        }
      }
    }
    
    res.status(500).send("Internal Server Error");
  }
};

const editProduct = async (req, res) => {
  try {
    let proId = req.params.id;
    const proData = await Product.findById(proId).lean();
    const catogories = await Category.find({ isListed: true }).lean();

    console.log("Product Data:", proData);
    console.log("Categories:", catogories);

    if (!proData) {
      return res.status(404).send("Product not found");
    }

    catogories.forEach((category) => {
      category.isSelected =
        category._id.toString() === proData.category.toString();
    });

    res.render("admin/edit_product", {
      proData,
      catogories,
      layout: "adminlayout",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

const updateProduct = async (req, res) => {
  try {
    const proId = req.params.id;

    if (req.fileValidationError) {
      return res.status(400).render("admin/edit_product", {
        proData: req.body,
        catogories: await Category.find({ isListed: true }).lean(),
        errorMessage: req.fileValidationError,
        layout: "adminlayout",
      });
    }

    const { name, price, description, category, stock } = req.body;
    const product = await Product.findById(proId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Check if another product with the same name exists
    const existingProduct = await Product.findOne({
      name: name,
      _id: { $ne: proId },
    });

    if (existingProduct) {
      // Delete newly uploaded images if name conflict
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          await cloudinary.uploader.destroy(file.filename);
        }
      }
      
      return res.status(400).render("admin/edit_product", {
        proData: {
          ...req.body,
          imageUrl: product.imageUrl,
        },
        catogories: await Category.find({ isListed: true }).lean(),
        errorMessage: "A product with this name already exists.",
        layout: "adminlayout",
      });
    }

    // Handle image files
    const exImage = product.imageUrl;
    const files = req.files;
    let updImages = [];

    if (files && files.length > 0) {
      // Add new Cloudinary URLs to existing images
      const newImages = files.map((file) => file.path);
      updImages = [...exImage, ...newImages];
    } else {
      updImages = exImage;
    }

    // Update product details
    await Product.findByIdAndUpdate(
      proId,
      {
        name: name,
        price: price,
        description: description,
        category: category,
        stock: stock,
        is_blocked: false,
        imageUrl: updImages,
      },
      { new: true }
    );

    // Update product offer if price changed
    if (product.price !== price) {
      const existingOffer = await productOffer.findOne({
        productId: product._id,
        currentStatus: true,
      });

      if (existingOffer) {
        const newDiscountPrice =
          price - (price * existingOffer.productOfferPercentage) / 100;
        existingOffer.discountPrice = newDiscountPrice;
        await existingOffer.save();
      }
    }

    res.redirect("/admin/product");
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

const deleteProduct = async (req, res) => {
  try {
    const proId = req.params.id;
    const product = await Product.findById(proId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Delete all product images from Cloudinary
    if (product.imageUrl && product.imageUrl.length > 0) {
      for (const imageUrl of product.imageUrl) {
        try {
          // Extract public_id from Cloudinary URL
          const publicId = extractPublicId(imageUrl);
          await cloudinary.uploader.destroy(publicId);
          console.log(`Deleted image from Cloudinary: ${publicId}`);
        } catch (err) {
          console.error("Error deleting image from Cloudinary:", err);
        }
      }
    }

    // Delete product from database
    await Product.findByIdAndDelete(proId);
    res.redirect("/admin/product");
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send("Server Error");
  }
};

const deleteProImage = async (req, res) => {
  try {
    const { id, image } = req.query;

    if (!id || !image) {
      return res.status(400).send({ error: "Product ID and image URL must be provided" });
    }

    console.log(`Id: ${id} and image URL: ${image}`);

    // Find the product by ID
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).send({ error: "Product not found" });
    }

    // Check if the image exists in the product's imageUrl array
    const imageIndex = product.imageUrl.indexOf(image);
    if (imageIndex === -1) {
      return res.status(400).send({ error: "Image not found" });
    }

    // Remove the image from the array
    const deletedImage = product.imageUrl.splice(imageIndex, 1)[0];
    console.log("Deleted image URL:", deletedImage);

    // Save the product after removing the image
    await product.save();

    // Delete image from Cloudinary
    try {
      const publicId = extractPublicId(deletedImage);
      const result = await cloudinary.uploader.destroy(publicId);
      console.log("Cloudinary deletion result:", result);
      
      if (result.result === "ok") {
        console.log("Image deleted from Cloudinary successfully");
      } else {
        console.log("Image may not exist in Cloudinary or already deleted");
      }
    } catch (cloudinaryError) {
      console.error("Error deleting from Cloudinary:", cloudinaryError);
      return res.status(500).send({ error: "Failed to delete image from Cloudinary" });
    }

    res.status(200).send({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).send({ error: "Server error, could not delete image" });
  }
};

const blockProduct = async (req, res) => {
  try {
    const id = req.body.id;
    const prodData = await Product.findById(id);
    
    if (!prodData) {
      return res.status(404).send({ error: "Product not found" });
    }
    
    const isBlocked = prodData.is_blocked;

    await Product.findByIdAndUpdate(
      id,
      { $set: { is_blocked: !isBlocked } },
      { new: true }
    );

    res.redirect("/admin/product");
    req.session.proDelete = true;
  } catch (error) {
    console.error("Error blocking/unblocking product:", error);
    res.status(500).send("Server Error");
  }
};

// Helper function to extract public_id from Cloudinary URL
function extractPublicId(imageUrl) {
  // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
  // or with transformations: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/v{version}/{public_id}.{format}
  
  const parts = imageUrl.split('/');
  const uploadIndex = parts.indexOf('upload');
  
  if (uploadIndex === -1) {
    throw new Error('Invalid Cloudinary URL');
  }
  
  // Get everything after 'upload/' and before the file extension
  let pathAfterUpload = parts.slice(uploadIndex + 1).join('/');
  
  // Remove version number if present (v1234567890)
  pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');
  
  // Remove file extension
  const publicId = pathAfterUpload.substring(0, pathAfterUpload.lastIndexOf('.'));
  
  return publicId;
}

module.exports = {
  getProduct,
  addProductPage,
  addNewProduct,
  editProduct,
  updateProduct,
  deleteProImage,
  blockProduct,
  deleteProduct,
};