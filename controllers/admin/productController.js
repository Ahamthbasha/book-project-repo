const Product=require("../../models/productModel")
const productOffer=require("../../models/productOfferModel")
const Category=require("../../models/categoryModel")
const fs=require("fs")
const path=require("path")

// const getProduct=async(req,res)=>{
//     try{
//         var page=1
//         if(req.query.page){
//             page=req.query.page
//         }
//         const limit=1
//         const productData=await Product.aggregate([
//             {
//                 $lookup:{
//                     from:"categories",
//                     localField:"category",
//                     foreignField:"_id",
//                     as:"category",
//                 },
//             },
//             {
//                 $unwind:"$category",
//             },
//             {
//                 $limit:limit*1
//             }
//         ]);
//         const count=await Product.find({}).countDocuments();
//         // console.log(count)

//         const totalPages=Math.ceil(count/limit)
//         const pages=Array.from({length:totalPages},(_, i)=>i+1)

//         res.render("admin/products",{productData,pages,currendtPage:page,layout:'adminlayout'})

//     }catch(error){
//         console.log(error)
//     }
// }

//add product page

const getProduct = async (req, res) => {
  try {
      let page = 1;
      if (req.query.page) {
          page = parseInt(req.query.page, 10);  // Convert to an integer
      }

      const limit = 10; // Set the number of products per page
      const skip = (page - 1) * limit; // Skip the appropriate number of products

      // Fetch the product data with pagination and category lookup
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
              $skip: skip, // Skip products based on the current page
          },
          {
              $limit: limit, // Limit the number of products per page
          },
      ]);

      // Count the total number of products in the database (for pagination)
      const count = await Product.countDocuments();

      // Calculate total pages based on the count of products and the limit
      const totalPages = Math.ceil(count / limit);
      const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

      // Render the page with product data, pagination links, and current page
      res.render("admin/products", {
          productData,
          pages,
          currentPage: page,
          layout: 'adminlayout',
      });
  } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server Error');
  }
};


// const addProductPage=async(req,res)=>{
//     try{
//         const category=await Category.find({}).lean()

//         res.render("admin/addproduct",{layout:"adminlayout",category})

//     }catch(error){
//         console.log(error)
//     }
// }

// //post add product page

// const addNewProduct=async(req,res)=>{
//     try{
//         const files=req.files
//         const images=[]

//         files.forEach((file)=>{
//             const image=file.filename
//             images.push(image)
//         })

//         const product=new Product({
//             name:req.body.name,
//             price:req.body.price,
//             description:req.body.description,
//             category:req.body.category,
//             stock:req.body.stock,
//             imageUrl:images,
//         })

//         await product.save()
//         req.session.productsave=true
//         res.redirect("/admin/product")
//     }catch(error){
//         console.log(error)
//     }
// }

// const addNewProduct = async (req, res) => {
//   try {
//       const { name } = req.body;
//       const existingProduct = await Product.findOne({ name });

//       if (existingProduct) {
//           req.session.productExist = true;  // Set session flag if product exists
//           res.redirect('/admin/add_new_product'); // Redirect to the same page to show the message
//       }

//       // Proceed with saving the product if not a duplicate
//       const files = req.files;
//       const images = [];

//       files.forEach((file) => {
//           const image = file.filename;
//           images.push(image);
//       });

//       const product = new Product({
//           name,
//           price: req.body.price,
//           description: req.body.description,
//           category: req.body.category,
//           stock: req.body.stock,
//           imageUrl: images,
//       });

//       await product.save();
//       req.session.productsave = true;
//       res.redirect("/admin/product");

//   } catch (error) {
//       console.log(error);
//       res.status(500).send("Server Error");
//   }
// };


/// To edit Product ///

const addProductPage = async (req, res) => {
  try {
    const category = await Category.find({}).lean();
    const productExists = req.session.productExists;
    req.session.productExists = null; 

    res.render("admin/addproduct", { layout: "adminLayout", category, productExists });
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
};



// Add New Product
const addNewProduct = async (req, res) => {
  try {
    const { name, price, description, category, stock } = req.body;
    const files = req.files;
    const images = [];
    files.forEach((file) => {
      const image = file.filename;
      images.push(image);
    });

    const existingProduct = await Product.findOne({
      name: { $regex: new RegExp("^" + name + "$", "i") }, 
    });

    if (existingProduct) {
      req.session.productExists = true;
      return res.redirect("/admin/new_Product"); 
    }

    const newProduct = new Product({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      category: req.body.category,
      stock: req.body.stock,
      //imageUrl: req.body.image
      imageUrl: images,
    });
    await newProduct
      .save()
      .then((result) => {
        res.redirect("/admin/product");
        console.log(newProduct);
      })
      .catch((err) => console.log(err));
  } catch (error) {
    console.error("Error creating Product:", error);
    res.status(500).send("Internal Server Error");
  }
};

// const editProduct = async (req, res) => {
//     try {
//       let proId = req.params.id;
//       const proData = await Product.findById({ _id: proId }).lean()
//       const catogories = await Category.find({ isListed: true }).lean()
//       catogories.forEach((category) => {
//         category.isSelected = category._id.toString() === proData.category.toString();
//       });
//       res.render("admin/edit_product", {proData, catogories, layout: 'adminlayout' })
//     } catch (error) {
//       console.log(error);
//     }
//   };
  
  /// To update Product post///
  
  const editProduct = async (req, res) => {
    try {
        let proId = req.params.id;
        const proData = await Product.findById(proId).lean();
        const catogories = await Category.find({ isListed: true }).lean();

        // Log the retrieved product data and categories
        console.log("Product Data:", proData);
        console.log("Categories:", catogories);

        // Check if proData is found
        if (!proData) {
            return res.status(404).send('Product not found');
        }

        catogories.forEach((category) => {
            category.isSelected = category._id.toString() === proData.category.toString();
        });

        res.render("admin/edit_product", { proData, catogories, layout: 'adminlayout' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};


  const updateProduct = async (req, res) => {
    try {
      const proId = req.params.id;
      const product = await Product.findById(proId);
      const exImage = product.imageUrl;
      const files = req.files;
      let updImages = [];
  
      if (files && files.length > 0) {
        const newImages = req.files.map((file) => file.filename);
        updImages = [...exImage, ...newImages];
        product.imageUrl = updImages;
      } else {
        updImages = exImage;
      }
  
      const { name, price, description, category, stock} = req.body;
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

      if(product.price !== price){
        const existingOffer=await productOffer.findOne({
          productId:product._id,
          currentStatus:true
        })

        if(existingOffer){
          const newDiscountPrice=price - (price * existingOffer.productOfferPercentage)/100
          existingOffer.discountPrice=newDiscountPrice
          await existingOffer.save()
        }
      }
  
      // req.session.productSave = true
      res.redirect("/admin/product");
    } catch (error) {
      console.log(error);
    }
  };
  
  / To delete Product ///
  
  const deleteProduct = async (req, res) => {
    const proId = req.params.id;
    await Product.findByIdAndDelete(proId)
    res.redirect('/admin/product')

  };

  // const deleteProImage=async(req,res)=>{
  //   try{
  //     const {id,image}=req.query;
  //     console.log(`Id:${id} and image:${image}`)
  //     const product=await Product.findById(id)
  //     if(!product){
  //       return res.status(404).send({error:"product not found"})
  //     }
  //     const deletedImage=product.imageUrl.splice(image,1)[0]
  //     if(!deletedImage){
  //       return res.status(400).send({error:"Image not found"})
  //     }
  //     console.log("deleted image:",deletedImage)
  //     await product.save()
  //     const imagePath=path.join(
  //       __dirname,
  //       `../../public/images/products/${deletedImage}`
  //     )
  //     console.log("Image path:",imagePath)
  //     if(fs.existsSync(imagePath)){
  //       fs.unlinkSync(imagePath)
  //     }else{
  //       return res.status(404).send({error:"Image file not found"})
  //     }
  //     res.status(200).send({message:"Image deleted successfully"})
  //   }catch(error){
  //     console.log(error)
  //   }
  // }




  //changes
  
  
const deleteProImage = async (req, res) => {
    try {
      const { id, image } = req.query;
  
      // Check if product ID and image name are provided
      if (!id || !image) {
        return res.status(400).send({ error: "Product ID and image name must be provided" });
      }
  
      console.log(`Id: ${id} and image: ${image}`);
  
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
      const deletedImage = product.imageUrl.splice(imageIndex, 1)[0];//it delete the image based on the imageIndex starting and delete it.The [0] extracts the first element of the array returned by splice()
      console.log("Deleted image:", deletedImage);
  
      // Save the product after removing the image
      await product.save();
  
      // Build the path to the image file
      const imagePath = path.join(__dirname, `../../public/images/products/${deletedImage}`);
      console.log("Image path:", imagePath);
  
      // Check if the image exists on the filesystem and delete it
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log("Image file deleted");
      } else {
        return res.status(404).send({ error: "Image file not found" });
      }
  
      // Respond with success message
      res.status(200).send({ message: "Image deleted successfully" });
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).send({ error: "Server error, could not delete image" });
    }
  };
  
  const blockProduct = async (req, res) => {
    const id = req.body.id
    // const proId = req.params.id;
    const prodData = await Product.findById(id);
    const isBlocked = prodData.is_blocked;
  
    const proData = await Product.findByIdAndUpdate(
      id,
      { $set: { is_blocked: !isBlocked } },
      { new: true }
    );
  
    res.redirect("/admin/product");
    req.session.proDelete = true;
  };

module.exports={
    getProduct,
    addProductPage,
    addNewProduct,
    editProduct,
    updateProduct,
    deleteProImage,
    blockProduct,
    deleteProduct
}