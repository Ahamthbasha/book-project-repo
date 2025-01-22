const User=require('../../models/userModel')
const Product=require('../../models/productModel')
const argon2 = require('argon2')
const userHelper=require('../../helpers/userHelper')
const Referral=require("../../models/referralSchema")
const {v4:uuidv4}=require("uuid")
const mongoose=require('mongoose')

let hashedPassword
let userRegData
let userData
let userEmail
let message2
let redeemAmount
let referalAmount
let OwnerId
let otp

const loadHome = async (req, res) => {
  try {
    //outline of the product offer showing.It first load every product.First it match with the is_blocked:false stage.Then we lookup it there we get that answer in an array.When we unwind it.It will become like a document.From that document we get projections atlast it shows every document in a structure like _id,name,price,description,stock,popularity,imageUrl,category,discountedprice,offerAvailable and offerPercentage.
    const loadProData = await Product.aggregate([
      {
        $match: { is_blocked: false },
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
          imageUrl: 1,
          productOffer: 1,
          categoryOffer: 1,
          discountedPrice: {
            $cond: {
              if: {
                $and: [
                  { $eq: ["$productOffer.currentStatus", true] },
                  { $ne: ["$productOffer.discountPrice", null] },
                ],
              },
              then: "$productOffer.discountPrice",
              else: "$price", // No category offer check, just fall back to the regular price
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
              if: {
                $eq: ["$productOffer.currentStatus", true],
              },
              then: "$productOffer.productOfferPercentage", // Directly use the stored offer percentage
              else: 0, // No offer
            },
          },
        },
      },
    ]);


    const newProduct = await Product.aggregate([
      {
        $match: { is_blocked: false },  // Filter products that are not blocked
      },
      {
        $lookup: {
          from: "productoffers",  // Reference to the 'productoffers' collection
          localField: "_id",  // The field in 'Product' that references 'productoffers'
          foreignField: "productId",  // Look for matching 'productId' in the 'productoffers' collection
          as: "productOffer",  // Store the result in the 'productOffer' field
        },
      },
      {
        $unwind: {
          path: "$productOffer",  // Unwind to flatten the 'productOffer' array into an object
          preserveNullAndEmptyArrays: true,  // Keep products without an offer
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
          imageUrl: 1,
          category: {
            _id: 1,
            category: 1,
            imageUrl: 1,
            isListed: 1,
          },
          discountedPrice: {
            $cond: {
              if: { $eq: ["$productOffer.currentStatus", true] }, // Check if the offer is active
              then: "$productOffer.discountPrice",  // Apply the discount price if active
              else: "$price",  // Otherwise, use the original price
            },
          },
          offerAvailable: {
            $cond: {
              if: { $eq: ["$productOffer.currentStatus", true] },
              then: true,  // Offer is available
              else: false, // No offer
            },
          },
          offerPercentage: {
            $cond: {
              if: { $eq: ["$productOffer.currentStatus", true] },
              then: "$productOffer.productOfferPercentage", // Include the offer percentage if the offer is active
              else: 0, // No offer, set percentage to 0
            },
          },
        },
      },
      {
        $sort: { _id: -1 },  // Sort products by latest first.last addedd to first addedd
      },
      {
        $limit: 8,  // Limit to 8 products
      },
    ]);
    
    
    const popularbooks = await Product.aggregate([
      {
        $match: {
          popularity: { $gt: 0 }, // Filter products with popularity greater than 0
          is_blocked: false,      // Ensure the product is not blocked
        },
      },
      {
        $lookup: {
          from: "productoffers",   // Reference to the 'productoffers' collection
          localField: "_id",       // The field in 'Product' that references 'productoffers'
          foreignField: "productId", // Look for matching 'productId' in the 'productoffers' collection
          as: "productOffer",      // Store the result in the 'productOffer' field
        },
      },
      {
        $unwind: {
          path: "$productOffer",    // Unwind to flatten the 'productOffer' array into an object
          preserveNullAndEmptyArrays: true,  // Keep products without an offer
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
          imageUrl: 1,
          category: {
            _id: 1,
            category: 1,
            imageUrl: 1,
            isListed: 1,
          },
          discountedPrice: {
            $cond: {
              if: { $eq: ["$productOffer.currentStatus", true] }, // Check if the offer is active
              then: "$productOffer.discountPrice",  // Apply the discount price if active
              else: "$price",  // Otherwise, use the original price
            },
          },
          offerAvailable: {
            $cond: {
              if: { $eq: ["$productOffer.currentStatus", true] },
              then: true,  // Offer is available
              else: false, // No offer
            },
          },
          offerPercentage: {
            $cond: {
              if: { $eq: ["$productOffer.currentStatus", true] },
              then: "$productOffer.productOfferPercentage", // Add the offer percentage if the offer is active
              else: 0, // No offer, set percentage to 0
            },
          },
        },
      },
      {
        $sort: { popularity: -1 }, // Sort products by popularity (highest first)
      },
      {
        $limit: 8,  // Limit to 8 popular products
      },
    ]);
    
    

    console.log(loadProData);
    console.log(newProduct)
    console.log(popularbooks)
    const userData = req.session.user;
    if (userData) {
      res.render("user/home", { userData, loadProData,newProduct,popularbooks});
    } else {
      res.render("user/home", { userData, loadProData,newProduct,popularbooks});
    }
  } catch (error) {
    console.log(error);
  }
};

const usersignup = (req, res) => {
    try {
      res.render('user/signup')
    } catch (error) {
        console.log(error);
    }
}

const doSignup = async (req, res) => {
  try {
      hashedPassword = await userHelper.hashPassword(req.body.password);
      userEmail = req.body.email;
      userRegData = req.body;

      const userExist = await User.findOne({ email: userEmail });
      if (!userExist) {
          // Pass req to verifyEmail to access session
          const { otp } = await userHelper.verifyEmail(userEmail, req);
          res.redirect('/referals'); // Redirect to referral page after sending OTP
      } else {
          message2 = true;
          res.render('user/login', { message2 }); // Render login page if user already exists
      }
  } catch (error) {
      console.log(error);
  }
}


const loadReferalPage=async(req,res)=>{
  try{
    res.render('user/referals')
  }catch(error){
    console.log(error)
  }
}

//post referral offer 

const verifyReferelCode = async (req, res) => {
  try {
      const referalCode = req.body.referalCode
      console.log("referalCode  " , referalCode)
      const Owner = await Referral.findOne({referralCode : referalCode })
      OwnerId = Owner.userId

      console.log("Owner----->" , Owner)
      if (!Owner) {
          res.json({ message: "Invalid referral code!" })
          return
      } else {
          referalAmount = 200;
          redeemAmount = 100;
          res.json({ message: "Referral code verified successfully!" })
          return
      }

  } catch (error) {
      console.log(error.message);
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

const submitOtp = async (req, res) => {
  try {
      const userOtp = req.body.otp; // Get the OTP from request body
      const currentTime = Date.now(); // Get current time

      // Retrieve stored OTP from session
      const storedOtp = req.session.otp;
      const storedOtpTimestamp = req.session.otpTimestamp;

      // Check if the submitted OTP is valid and within 60 seconds
      if (userOtp === storedOtp && (currentTime - storedOtpTimestamp <= 60000)) { // 60000 ms = 60 seconds
          const user = new User({
              name: userRegData.name,
              email: userRegData.email,
              mobile: userRegData.phone,
              password: hashedPassword,
              isVerified: true,
              isBlocked: false,
          });
          await user.save();

          if(redeemAmount){
                    await User.updateOne(
                      {_id:user._id},
                      {
                        $inc:{wallet:redeemAmount},
                        $push:{
                          history:{
                            amount:redeemAmount,
                            status:'Referred',
                            date:Date.now()
                          }
                        }
                      }
                    )
                  }
                  const generateReferalCode=uuidv4()//generate a unique identifier in the version 4 format.
                  const referalCollection=new Referral({
                    userId:user._id,
                    referralCode:generateReferalCode
                  })
                  await referalCollection.save()
            
                  if(referalAmount && OwnerId){
                    await User.updateOne(
                      {_id:OwnerId},
                      {
                        $inc:{wallet:referalAmount},
                        $push:{
                          history:{
                            amount:referalAmount,
                            status:"Referred",
                            date:Date.now()
                          }
                        }
                      }
                    )
                  }
          req.session.regSuccessMsg = true; // Set success message in session
          res.json({ success: true, redirectUrl: '/login' }); // Respond with success
      } else {
          let otpError;
          if (currentTime - storedOtpTimestamp > 60000) { 
              otpError = "OTP has expired. Please request a new one."; // Expired message
          } else {
              otpError = "Incorrect OTP"; // Incorrect message
          }
          res.json({ error: otpError }); // Respond with error message
      }
  } catch (error) {
      console.log(error);
      res.json({ error: 'An error occurred while submitting the OTP.' }); // Handle errors
  }
}

const resendOtp = async (req, res) => {
  try {
      // Ensure you pass req to verifyEmail to access session
      otp = await userHelper.verifyEmail(userEmail, req); // Pass req here
      res.redirect('/get_otp'); // Redirect to get a new OTP page
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
  //It checks the user is blocked or not. If the user is blocked it store in the session to show the block message
      if (userData.isBlocked) {
        req.session.blockMsg = true;
        res.redirect("/login");
      } else {
        console.log("session => ",req.session)
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

const userLogin = (req, res) => {

  let regSuccessMsg = 'User registered sucessfully..!!'
  let blockMsg = 'Access Denied..!!'
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
      res.render('user/login', { blockMsg})
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
    res.render('user/login',{hideSearchBox:true})
  }
}

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

const aboutPage=async(req,res)=>{
  try{
    res.render("user/aboutPage")
  }catch(error){
    console.log(error)
  }
}


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
    loadReferalPage,
    verifyReferelCode,
    aboutPage
}