const User=require('../../models/userModel')
const Category=require('../../models/categoryModel')
const Product=require('../../models/productModel')
const argon2 = require('argon2')
const userHelper=require('../../helpers/userHelper')
const mongoose=require('mongoose')

let otp
let userOtp
let hashedPassword
let userRegData
let otpError = ''
let isLogedin = false
let userData
let userEmail
let productSearched = false
let message2

const loadHome = async (req, res) => {
    try {
      const userData = req.session.user;
  
      if(userData){
          var id = userData._id;
          var user = await User.findById(id).lean();
          
      }

      const loadProData = await Product.aggregate([
        { $match: { is_blocked: false } },
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
      ]);
  

      const category=await Category.find({isListed:true})
  
      // console.log(userData);
     
          res.render("user/home", { category,loadProData, userData:user});
  
  
    } catch (error) {
      console.log(error);
      res.status(500).send("server error");
    }
  };
  
// //changes
// const loadHome = async (req, res) => {
//     try {
//       const userData = req.session.user;
  
//       if(userData){
//           var id = userData._id;
//           var user = await User.findById(id).lean();
//           res.render("user/home",{userData:user})
          
//       }
//       else{
//         return res.render("user/home")
//       }
//     } catch (error) {
//       console.log(error);
//       res.status(500).send("server error");
//     }
//   };

const userLogin = (req, res) => {

    let regSuccessMsg = 'User registered sucessfully..!!'
    let blockMsg = 'Sorry something went wrong..!!'
    let mailErr = 'Incorrect email or password..!!'
    let newpasMsg = 'Your password reseted successfuly..!!'
    message2 = false


    if (req.session.mailErr) {
        res.render('user/login', { mailErr })
        req.session.mailErr = false
    }
    else if (req.session.regSuccessMsg) {
        res.render('user/login', { regSuccessMsg })
        req.session.regSuccessMsg = false
    }
    else if (req.session.userBlocked) {
        res.render('user/login', { blockMsg })
        req.session.userBlocked = false
    }
    else if (req.session.LoggedIn) {
        res.render('user/login')
        req.session.LoggedIn = false
    }
    else if (req.session.newPas) {
        res.render('user/login', { newpasMsg })
        req.session.newPas = false
    }
    else {
        res.render('user/login')
    }
}


//user signup page



const usersignup = (req, res) => {
    try {
        res.render('user/signup')
    } catch (error) {
        console.log(error);
    }
}

//user signup
//changes
// const doSignup = async (req, res) => {

//     try {
//         hashedPassword = await userHelper.hashPassword(req.body.password)
//         userEmail = req.body.email
//         userRegData = req.body


//         const userExist = await User.findOne({ email: userEmail })

//         if(userExist){
//             return res.render("user/signup",{message:"user with this email already exists"})
//         }

//         if (!userExist) {
//             otp = await userHelper.verifyEmail(userEmail)
//             //changes 1
//             req.session.userData=userEmail
//             //changes end
//             res.render('user/submitOtp')
//         }
//         else {
//             message2 = true

//             res.render('user/login', { message2 })

//         }

//     } catch (error) {
//         console.log(error);
//     }
// }

//user signup

const doSignup = async (req, res) => {

    try {
        hashedPassword = await userHelper.hashPassword(req.body.password)
        userEmail = req.body.email
        userRegData = req.body


        const userExist = await User.findOne({ email: userEmail })
        if (!userExist) {
            otp = await userHelper.verifyEmail(userEmail)
            res.render('user/submitOtp')
        }
        else {
            message2 = true

            res.render('user/login', { message2 })

        }

    } catch (error) {
        console.log(error);
    }
}


//To get otp page

const getOtp = (req, res) => {
    try {
        res.render('user/submitOtp')
    } catch (error) {
        console.log(error);
    }
}



//Submit otp and save user

const submitOtp = async (req, res) => {
    try {
        userOtp = req.body.otp;


        if (userOtp == otp) {
            const user = new User({
                name: userRegData.name,
                email: userRegData.email,
                mobile: userRegData.phone,
                password: hashedPassword,
                isVerified: true,
                isBlocked: false,
            });

            await user.save();

            req.session.regSuccessMsg = true;

            // Send JSON response with success message
            res.json({ success: true, redirectUrl: '/login' });
        } else {
            otpError = 'incorrect otp';

            // Send JSON response with error message
            res.json({ error: otpError });
        }
    } catch (error) {
        console.log(error);

        // Send JSON response with error message
        res.json({ error: 'An error occurred while submitting the OTP.' });
    }
};

//To resend otp

const resendOtp = async (req, res) => {
    try {
        res.redirect('/get_otp')
        otp = await userHelper.verifyEmail(userEmail)
    } catch (error) {
        console.log(error);
    }
}

const googleCallback = async (req, res) => {
    try {
      userData = await User.findOneAndUpdate(
        { email: req.user.email },
        { $set: { name: req.user.displayName, isVerified: true, isBlocked:false,} },
        { upsert: true, new: true }
      );
      console.log(userData);
  
      if (userData.isBlocked) {
        req.session.blockMsg = true;
        res.redirect("/login");
      } else {
        // req.session.LoggedIn = true;
        console.log("session => ",req.session , req.session.admin)
        req.session.user = userData;

        console.log("session AFTER USER=> ",req.session)
        req.session.admin = userData
        res.redirect("/");
      }
    } catch (err) {
      console.error(err);
      res.redirect("/login");
    }
  };


//user login controller
const doLogin = async (req, res) => {

    try {
        let email = req.body.email
        let password = req.body.password

        userData = await User.findOne({ email: email });
        if (userData) {
            console.log(userData.password)
            console.log(email)
            console.log(password)

        }


        if (userData) {
            if (await argon2.verify(userData.password, password)) {

                const isBlocked = userData.isBlocked

                if (!isBlocked) {

                    req.session.LoggedIn = true
                    req.session.user = userData

                    res.redirect('/')
                } else {
                    userData = null
                    req.session.userBlocked = true
                    res.redirect('/login')
                }
            }
            else {
                req.session.mailErr = true
                res.redirect('/login')
            }
        } else {
            req.session.mailErr = true
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error);
    }
}

const doLogout=async(req,res)=>{
    try{
        req.session.user=null
        res.redirect("/login")
    }catch(error){
        console.log(error)
    }
}

const getProduct = async (req, res) => {
    let userData = false;
    if (req.session.user) {

        const user = req.session.user;
        const id = user._id
        userData = await User.findById(id).lean();
        console.log(userData)

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
        const proCount = count

        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

        //const newProduct = await Product.find({ is_blocked: false }).sort({ _id: -1 }).limit(3).lean()
       // console.log(newProduct)

        res.render('user/products', {
            userData,
            proData,
            pages,
            currentPage: page,
            loadCatData,
            // newProduct,
            currentFunction: 'getProductsPage',
            proCount

        });
    } catch (error) {
        console.log(error);
    }
};

// const searchSortFilter = async (req, res) => {
//     const { searchQuery, sortOption, categoryFilter, page, limit } = req.body;
//     console.log(req.body);

//     // Construct the query object
//     const query = {};
//     if (searchQuery) {
//         console.log('searching...');
//         query.name = { $regex: searchQuery, $options: 'i' };
//         console.log(query.name);
//     }
//     if (categoryFilter) {
//         query.category = new mongoose.Types.ObjectId(categoryFilter);
//     }

//     // Construct the sort object
//     const sort = {};
//     switch (sortOption) {
//         case 'priceAsc':
//             sort.price = 1;
//             break;
//         case 'priceDesc':
//             sort.price = -1;
//             break;
//         case 'nameAsc':
//             sort.name = 1;
//             break;
//         case 'nameDesc':
//             sort.name = -1;
//             break;
//         case 'newArrivals':
//             sort.createdAt = -1;
//             break;
//         case 'popularity':
//             sort.popularity = -1; // Assuming there's a popularity field
//             break;
//         default:
//             sort.createdAt = -1; // Default sort by new arrivals
//     }

//    // Perform the query with pagination and sorting
//     const [products, totalProducts] = await Promise.all([
//         Product.find(query)
//             .populate('category')
//             .sort(sort)
//             .skip((page - 1) * limit)
//             .limit(limit)
//             .lean(),
//         Product.countDocuments(query)
//     ]);




//     res.json({ products, totalProducts });
// };

const searchSortFilter = async (req, res) => {
    const { searchQuery, sortOption, categoryFilter, page, limit } = req.body;
  
    const matchStage = { $match: {} };
    if (searchQuery) {
      matchStage.$match.name = { $regex: searchQuery, $options: "i" };
    }
    if (categoryFilter) {
      matchStage.$match.category = new mongoose.Types.ObjectId(categoryFilter);
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
      let outOfStock;
      if (proData.stock === 0) {
        outOfStock = true;
      }
      res.render("user/productview", { proData, outOfStock });



    // let reviewed
        // const proId = req.query.id
        // const proData = await Product.findById(proId).lean()
        // console.log(proData)
        // const userData = req.session.user
        // let reviewExist = true //variable to check review exist or not
        // const reviews = await Review.aggregate([
        //     {
        //         $match: { isListed: true, productId: ObjectId(proId) }
        //     }

        // ]);
        // console.log("Reviewsssssssss",reviews)

        // if (reviews.length == 0) {
        //     reviewExist = false
        // }

        // let userCanReview = false; //variable to check user can able to review or not


        // let productExist  //store the user data if the product exist in the respective user's cart
        // let productExistInCart //

        // let totalRating = 0
        // reviews.forEach((rev)=>{
        //     totalRating = totalRating + rev.rating;
        // })

        // let avgRating = Math.round(totalRating / reviews.length)
        // console.log(avgRating)

        // if (userData) {

        //     const userId = userData._id
        //     console.log(userData)


        //     // query
        //     productExist = await User.find({ _id: userId, "cart.product": new ObjectId(proId) }).lean();

        //     console.log(productExist)
        //     if (productExist.length === 0) productExistInCart = false
        //     else productExistInCart = true
        //     console.log(productExistInCart)



            // const orders = await Order.aggregate([
            //     {
            //         $match: {
            //             userId: ObjectId(userId),
            //             status: "Delivered"
            //         }
            //     },
            //     {
            //         $unwind: "$product"
            //     },
            //     {
            //         $match: {
            //             "product.id": proData._id
            //         }
            //     },
            //     {
            //         $project: {
            //             _id: 0,
            //             product: 1
            //         }
            //     }
            // ]);
            // console.log("Orders:", orders);

            // reviewed = await Review.find({
            //     userId: userData._id, 
            //     productId : new ObjectId(proId)
            // })

        //     console.log("..................",reviewed)


        //     if (orders.length > 0 && reviewed.length != 1 ) {
        //         userCanReview = true;
        //         // console.log("I found", orders[0].product.name);
        //     }

        //     console.log(userCanReview)

//          }



//         if (userData) {
//             console.log(userCanReview)
//             res.render('user/productview', { proData, userData, productExistInCart})
//         } else {
//             res.render('user/productview', {proData  })
//         }
    } catch (error) {
      console.log(error);
    }
  };



module.exports={
    loadHome,
    userLogin,
    usersignup,
    doSignup,
    getOtp,
    resendOtp,
    submitOtp,
    googleCallback,
    doLogin,
    doLogout,
    getProduct,
    productView,
    searchSortFilter
}