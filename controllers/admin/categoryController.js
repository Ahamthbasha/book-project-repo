const Category = require("../../models/categoryModel");
const { cloudinary } = require('../../middlewares/multer');

let catSaveMsg = "Category added successfully..!!";

// Helper function to extract public_id from Cloudinary URL
function extractPublicId(imageUrl) {
  try {
    const parts = imageUrl.split('/');
    const uploadIndex = parts.indexOf('upload');
    
    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL');
    }
    
    let pathAfterUpload = parts.slice(uploadIndex + 1).join('/');
    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');
    const publicId = pathAfterUpload.substring(0, pathAfterUpload.lastIndexOf('.'));
    
    return publicId;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    throw error;
  }
}

/// To get category page ///
const getCategory = async (req, res) => {
  try {
    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 3;
    let allCtegoryData = await Category.find()
      .skip((page - 1) * limit)
      .limit(limit * 1)
      .lean();
    const count = await Category.find({}).countDocuments();
    const totalPages = Math.ceil(count / limit);
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    let catUpdtMsg = "Category updated successfully..!!";

    if (req.session.categoryUpdate) {
      res.render("admin/category", { 
        allCtegoryData, 
        pages, 
        currentPage: page, 
        catUpdtMsg, 
        layout: 'adminlayout' 
      });
      req.session.categoryUpdate = false;
    } else {
      res.render("admin/category", { 
        allCtegoryData, 
        pages, 
        currentPage: page, 
        layout: 'adminlayout' 
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

/// To render add category page ///
const addCategory = (req, res) => {
  try {
    let catExistMsg = "Category already exists!";
    let error = req.session.error;

    if (req.session.categorySave) {
      res.render("admin/add_category", { catSaveMsg, layout: 'adminlayout' });
      req.session.categorySave = false;
    } else if (req.session.catExist) {
      res.render("admin/add_category", { catExistMsg, layout: 'adminlayout' });
      req.session.catExist = false;
    } else if (error) {
      res.render("admin/add_category", { error: error, layout: 'adminlayout' });
      req.session.error = null;
    } else {
      res.render("admin/add_category", { layout: 'adminlayout' });
    }
  } catch (error) {
    console.log(error);
    res.render("admin/add_category", { 
      error: "An error occurred, please try again.", 
      layout: 'adminlayout' 
    });
  }
};

/// Add new category ///
const addNewCategory = async (req, res) => {
  try {
    console.log("=== ADD NEW CATEGORY ===");
    console.log("Body:", req.body);
    console.log("File:", req.file);

    const catName = req.body.name;
    const image = req.file;

    // Validate input
    if (!catName || catName.trim().length === 0) {
      req.session.error = 'Category name is required.';
      return res.redirect('/admin/add_category');
    }

    // Validate image upload
    if (!image) {
      req.session.error = 'Please upload a valid image file (PNG, JPEG, JPG, AVIF, WebP).';
      return res.redirect('/admin/add_category');
    }

    // Check if category already exists
    const catExist = await Category.findOne({
      category: { $regex: new RegExp("^" + catName.trim() + "$", "i") },
    });

    if (catExist) {
      // Delete uploaded image from Cloudinary if category exists
      try {
        await cloudinary.uploader.destroy(image.filename);
        console.log('Deleted duplicate category image from Cloudinary');
      } catch (err) {
        console.error('Error deleting image:', err);
      }
      
      req.session.catExist = true;
      return res.redirect("/admin/add_category");
    }

    // Create new category with Cloudinary URL
    const category = new Category({
      category: catName.trim(),
      imageUrl: image.path, // Cloudinary URL (e.g., https://res.cloudinary.com/...)
    });

    await category.save();
    console.log('✓ Category saved successfully:', category._id);
    
    req.session.categorySave = true;
    res.redirect("/admin/add_category");
  } catch (error) {
    console.error("❌ Error creating category:", error);
    
    // Clean up uploaded image if error occurs
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
        console.log('Cleaned up uploaded image');
      } catch (err) {
        console.error('Error cleaning up image:', err);
      }
    }
    
    req.session.error = "An error occurred while saving the category.";
    res.redirect("/admin/add_category");
  }
};

/// Render edit category page ///
const editCategory = async (req, res) => {
  let catId = req.params.id;

  try {
    const catData = await Category.findById({ _id: catId }).lean();

    if (!catData) {
      return res.status(404).send("Category not found");
    }

    let catExistMsg = req.session.catExist 
      ? "Category with this name already exists." 
      : null;

    req.session.catExist = false;

    res.render("admin/edit_category", { 
      catData, 
      catExistMsg, 
      layout: 'adminlayout' 
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

/// Update category ///
const updateCategory = async (req, res) => {
  try {
    console.log("=== UPDATE CATEGORY ===");
    console.log("Body:", req.body);
    console.log("File:", req.file);

    const catName = req.body.name;
    const image = req.file;
    const catId = req.params.id;

    // Validate input
    if (!catName || catName.trim().length === 0) {
      req.session.error = 'Category name is required.';
      return res.redirect(`/admin/edit_category/${catId}`);
    }

    // Check if another category with the same name exists
    const catExist = await Category.findOne({ 
      category: { $regex: new RegExp("^" + catName.trim() + "$", "i") }, 
      _id: { $ne: catId } 
    });

    if (catExist) {
      // Delete newly uploaded image if name conflict
      if (image) {
        try {
          await cloudinary.uploader.destroy(image.filename);
          console.log('Deleted conflicting image from Cloudinary');
        } catch (err) {
          console.error('Error deleting image:', err);
        }
      }
      
      req.session.catExist = true;
      return res.redirect(`/admin/edit_category/${catId}`);
    }

    // Get current category
    const cat = await Category.findById(catId);
    
    if (!cat) {
      return res.status(404).send("Category not found");
    }

    const oldImageUrl = cat.imageUrl;
    let updImageUrl;

    if (image) {
      // New image uploaded - use Cloudinary URL
      updImageUrl = image.path;
      
      // Delete old image from Cloudinary if it exists and is a Cloudinary URL
      if (oldImageUrl && oldImageUrl.includes('cloudinary')) {
        try {
          const publicId = extractPublicId(oldImageUrl);
          await cloudinary.uploader.destroy(publicId);
          console.log('✓ Deleted old category image from Cloudinary:', publicId);
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }
    } else {
      // No new image - keep existing
      updImageUrl = oldImageUrl;
    }

    // Update category
    await Category.findByIdAndUpdate(
      catId,
      {
        category: catName.trim(),
        imageUrl: updImageUrl,
      },
      { new: true }
    );

    console.log('✓ Category updated successfully');
    req.session.categoryUpdate = true;
    res.redirect("/admin/category");
  } catch (error) {
    console.error("❌ Error updating category:", error);
    
    // Clean up uploaded image if error occurs
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
        console.log('Cleaned up uploaded image');
      } catch (err) {
        console.error('Error cleaning up image:', err);
      }
    }
    
    res.status(500).send('Server Error');
  }
};

/// Delete/Unlist category ///
const deleteCategory = async (req, res) => {
  try {
    const id = req.body.id;
    let category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).send("Category not found");
    }
    
    let newListed = category.isListed;

    await Category.findByIdAndUpdate(
      id,
      { isListed: !newListed },
      { new: true }
    );
    
    res.redirect('/admin/category');
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

/// Unlist category ///
const unListCategory = async (req, res) => {
  try {
    const { id } = req.body;
    let category = await Category.findById(id);
    
    if (!category) {
      return res.status(404).send("Category not found");
    }
    
    let newListed = category.isListed;
    
    await Category.findByIdAndUpdate(
      id,
      { $set: { isListed: !newListed } },
      { new: true }
    );
    
    res.redirect("/admin/category");
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getCategory,
  addCategory,
  addNewCategory,
  editCategory,
  updateCategory,
  deleteCategory,
  unListCategory
};