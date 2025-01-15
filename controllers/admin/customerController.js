const User = require("../../models/userModel");

//Get all users data///////////////

const loadUsersData = async (req, res) => {
    try {
      var page = 1
      if (req.query.page) {
        page = req.query.page
      }
      const limit = 1;
      let allUsersData = await User.find()
        .skip((page - 1) * limit)
        .limit(limit * 1)
        .lean();
      const count = await User.find({}).countDocuments();
      const totalPages = Math.ceil(count / limit)
      const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
      res.render("admin/manage_users", { allUsersData, pages, currentPage: page, layout: 'adminlayout' });
    } catch (error) {
      console.log(error);
    }
  };
  
  
  
  const blockUser = async (req, res) => {
    try {
      let id = req.params.id;
      const blockUser = await User.findById(id);
      let isBlocked = blockUser.isBlocked;
  
      const usrData = await User.findByIdAndUpdate(
        id,
        { $set: { isBlocked: !isBlocked } },
        { new: true }
      );
  
      res.redirect("/admin/manage_users");
    } catch (error) {
      console.log(error);
    }
  };

  module.exports=
  {

    loadUsersData,
    blockUser

  }