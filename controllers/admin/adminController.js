let adminData
///Admin home page ///

// const adminLogin = (req, res) => {
//     res.render("admin/login", { layout: 'loginlayout' });
//   };
  
//   /////Admin Login//////
  
//   const adminDoLogin = async (req, res) => {
//     try {
//       adminData = {
//         email: process.env.ADMIN_EMAIL,
//         password: process.env.ADMIN_PASSWORD
//       };
//       let adminEmail = req.body.email;
//       let adminPassword = req.body.password;
  
  
//       //adminData = await Admin.findOne({ email: adminEmail });
  
//       if (adminData) {
//         if (adminPassword === adminData.password && adminEmail ===adminData.email) {
//           req.session.aLoggedIn = true;
//           req.session.admin = adminData;
//           console.log(req.session.admin)
//           res.redirect("/admin/home");
//         } else {
//           res.render("admin/login", { message: "incorrect email or password", layout: 'loginlayout' });
//         }
//       } else {
//         res.render("admin/login", { message: "incorrect email or password", layout: 'loginlayout' });
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   };

const adminLogin = (req, res) => {
  res.render("admin/login", { layout: 'loginlayout', message: null });
};

const adminDoLogin = async (req, res) => {
  try {
    let adminData = {
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD
    };

    let adminEmail = req.body.email;
    let adminPassword = req.body.password;

    if (adminData) {
      if (adminPassword === adminData.password && adminEmail === adminData.email) {
        req.session.aLoggedIn = true;
        req.session.admin = adminData;
        res.redirect("/admin/home");
      } else {
        // Pass error message back to the template
        res.render("admin/login", { message: "Incorrect email or password", layout: 'loginlayout' });
      }
    } else {
      res.render("admin/login", { message: "Incorrect email or password", layout: 'loginlayout' });
    }
  } catch (error) {
    console.log(error);
    res.render("admin/login", { message: "An error occurred. Please try again.", layout: 'loginlayout' });
  }
};

  
  ///Admin logout ////////////////
  
  const adminLogout = async (req, res) => {
    try {
      req.session.admin = null
      res.redirect("/admin/login");
    } catch (error) {
      console.log(error.message);
    }
  };
  
  
  ///Get home page////////////
  
  
  const loadHome = (req, res) => {
    try {
      res.render("admin/home", { layout: 'adminlayout' });
    } catch (error) {
      console.log(error);
    }
  };
  
  module.exports=
  {
    adminLogin,
    adminDoLogin,
    loadHome,
    adminLogout
  }