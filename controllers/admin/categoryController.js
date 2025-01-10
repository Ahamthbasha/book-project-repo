const Category=require("../../models/categoryModel");
const upload=require('../../middlewares/multer')

let catSaveMsg = "Category added suceessfully..!!";

/// To get category page ///

const getCategory = async (req, res) => {
    try {
      var page = 1
      if (req.query.page) {
        page = req.query.page
      }
      const limit = 3;
      let allCtegoryData = await Category.find()
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .lean();
      const count = await Category.find({}).countDocuments();
      const totalPages = Math.ceil(count / limit)
      const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  
      let catUpdtMsg = "Category updated successfully..!!";
  
      if (req.session.categoryUpdate) {
        res.render("admin/category", { allCtegoryData, pages, currentPage: page, catUpdtMsg, layout: 'adminlayout' });
        req.session.categoryUpdate = false;
      } else {
        res.render("admin/category", { allCtegoryData, pages, currentPage: page, layout: 'adminlayout' });
      }
    } catch (error) {
      console.log(error);
    }
  };
  
  /// To get add category page ///
  
  // const addCategory = (req, res) => {
  //   try {
  //     let catExistMsg = "Category alredy Exist..!!";
  
  //     if (req.session.categorySave) {
  //       res.render("admin/add_category", { catSaveMsg, layout: 'adminlayout' });
  //       req.session.categorySave = false;
  //     } else if (req.session.catExist) {
  //       res.render("admin/add_category", { catExistMsg, layout: 'adminlayout' });
  //       req.session.catExist = false;
  //     } else {
  //       res.render("admin/add_category", { layout: 'adminlayout' });
  //     }
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };
  
  /// To add new category post///
  
  // const addNewCategory = async (req, res) => {
  //   const catName = req.body.name;
  //   const image = req.file;
  //   const lCatName = catName;
  
  //   try {
  //     const catExist = await Category.findOne({ category: { $regex: new RegExp("^" + lCatName + "$", "i") } });
  //     if (!catExist) {
  //       const category = new Category({
  //         category: lCatName,
  //         imageUrl: image.filename,
  //       });
  
  //       await category.save();
  //       req.session.categorySave = true;
  //       res.redirect("/admin/add_category");
  //     } else {
  //       req.session.catExist = true;
  //       res.redirect("/admin/add_category");
  //     }
  //   } catch (error) { }
    
  // };

 
  
  
  /// To edit category ///
  
  const addCategory = (req, res) => {
    try {
      let catExistMsg = "Category already exists!";
  
      if (req.session.categorySave) {
        res.render("admin/add_category", { catSaveMsg, layout: 'adminlayout' });
        req.session.categorySave = false;
      } else if (req.session.catExist) {
        res.render("admin/add_category", { catExistMsg, layout: 'adminlayout' });
        req.session.catExist = false;
      } else if (req.session.error) {
        // If there's an error related to Multer (invalid file type), we display it
        res.render("admin/add_category", { error: req.session.error, layout: 'adminlayout' });
        req.session.error = null; // Clear session error after it's displayed
      } else {
        res.render("admin/add_category", { layout: 'adminlayout' });
      }
    } catch (error) {
      console.log(error);
      res.render("admin/add_category", { error: "An error occurred, please try again.", layout: 'adminlayout' });
    }
  };
  
  const addNewCategory = async (req, res) => {
    const catName = req.body.name;
    const image = req.file;
    const lCatName = catName;
  
    try {
      // If image was not uploaded (multer error handling)
      if (!image) {
        req.session.error = 'Please upload a valid image file (PNG, JPEG, JPG, AVIF).';
        return res.redirect('/admin/add_category');
      }
  
      const catExist = await Category.findOne({
        category: { $regex: new RegExp("^" + lCatName + "$", "i") },
      });
  
      if (!catExist) {
        const category = new Category({
          category: lCatName,
          imageUrl: image.filename,
        });
  
        await category.save();
        req.session.categorySave = true;
        res.redirect("/admin/add_category");
      } else {
        req.session.catExist = true;
        res.redirect("/admin/add_category");
      }
    } catch (error) {
      console.log(error);
      req.session.error = "An error occurred while saving the category.";
      res.redirect("/admin/add_category");
    }
  };
  

  const editCategory = async (req, res) => {
    let catId = req.params.id;
  
    try {
      const catData = await Category.findById({ _id: catId }).lean();

      let catExistMsg = req.session.catExist 
          ? "Category with this name already exists." 
          : null;

      req.session.catExist = false; // Reset the session flag

      res.render("admin/edit_category", { 
          catData, 
          catExistMsg, 
          layout: 'adminlayout' 
      });
    } catch (error) {
      console.log(error);
    }
  };

  //   try {
  //     const catName = req.body.name;
  //     const image = req.file;
  //     const catId = req.params.id;
  
  //     const cat = await Category.findById(catId);
  //     const catImg = cat.imageUrl;
  //     let updImge;
  
  //     if (image) {
  //       updImge = image.filename;
  //     } else {
  //       updImge = catImg;
  //     }
  
  
  //     const catExist = await Category.findOne({ category: { $regex: new RegExp("^" + catName + "$", "i") } });
  
  //     if (!catExist) {
  //       await Category.findByIdAndUpdate(
  //         catId,
  //         {
  //           category: req.body.name,
  //           imageUrl: updImge,
  //         },
  //         { new: true }
  //       );
  
  //       req.session.categoryUpdate = true;
  //       res.redirect("/admin/category");
  //     } else {
  //       // req.session.catExist = true
  //       res.redirect("/admin/category");
  //     }
  //   } catch (error) { }
  // };
  const updateCategory = async (req, res) => {
    try {
        const catName = req.body.name;
        const image = req.file;
        const catId = req.params.id;

        // Check if another category with the same name exists
        const catExist = await Category.findOne({ category: { $regex: new RegExp("^" + catName + "$", "i") }, _id: { $ne: catId } });

        if (catExist) {
            // If a duplicate is found, set the session flag and redirect back to edit page
            req.session.catExist = true; // Set session flag for duplicate category
            return res.redirect(`/admin/edit_category/${catId}`); // Redirect back to the edit page
        }

        const cat = await Category.findById(catId);
        const catImg = cat.imageUrl;
        let updImge;

        if (image) {
            updImge = image.filename;
        } else {
            updImge = catImg;
        }

        await Category.findByIdAndUpdate(
            catId,
            {
                category: catName,
                imageUrl: updImge,
            },
            { new: true }
        );

        req.session.categoryUpdate = true; // Set session flag for successful update
        res.redirect("/admin/category");
    } catch (error) {
        console.log(error);
        res.status(500).send('Server Error');
    }
};

// const updateCategory = async (req, res) => {
//   try {
//     // Handle the file upload using multer
//     upload.single('image')(req, res, async (err) => {
//       if (err) {
//         if (err.message === 'Invalid image type') {
//           // Handle invalid image type error
//           req.session.catExist = true;
//           return res.redirect(`/admin/edit_category/${req.params.id}`);
//         }
//         // Handle other Multer errors
//         return res.status(500).send('Server Error');
//       }

//       // Proceed with the category update logic if image validation passes
//       const catName = req.body.name;
//       const catId = req.params.id;
//       const image = req.file;
      
//       // Check if another category with the same name exists
//       const catExist = await Category.findOne({ 
//         category: { $regex: new RegExp("^" + catName + "$", "i") },
//         _id: { $ne: catId }
//       });

//       if (catExist) {
//         req.session.catExist = true;
//         return res.redirect(`/admin/edit_category/${catId}`);
//       }

//       const cat = await Category.findById(catId);
//       const catImg = cat.imageUrl;
//       let updImage;

//       if (image) {
//         updImage = image.filename;
//       } else {
//         updImage = catImg;
//       }

//       // Update the category with the new image or old image
//       await Category.findByIdAndUpdate(
//         catId,
//         {
//           category: catName,
//           imageUrl: updImage,
//         },
//         { new: true }
//       );

//       req.session.categoryUpdate = true;
//       res.redirect("/admin/category");

//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send('Server Error');
//   }
// };


  
  
  const deleteCategory = async (req, res) => {
    try {
      const id = req.body.id
      // const catId = req.params.id
      let user = await Category.findById(id)
      let newListed = user.isListed
  
      await Category.findByIdAndUpdate(id, {
        isListed: !newListed
      },
        { new: true })
  
      res.redirect('/admin/category')
  
  
  
    } catch (error) {
      console.log(error)
  
    }
  }

const unListCategory=async(req,res)=>{
  try{
    const {id}=req.body
    let category=await Category.findById(id)
    let newListed=category.isListed;
    await Category.findByIdAndUpdate(
      id,
      {$set:{isListed:!newListed}},
      {new:true}
    )
    res.redirect("/admin/category")
  }catch(error){
    console.log(error)
  }
}



module.exports={
  getCategory,
  addCategory,
  addNewCategory,
  editCategory,
  updateCategory,
  deleteCategory,
  unListCategory
}