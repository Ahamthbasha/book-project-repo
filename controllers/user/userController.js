const User=require('../../models/userModel')
const Category=require('../../models/categoryModel')
const Product=require('../../models/productModel')
const ProductOffer=require('../../models/productOfferModel')
const Order=require("../../models/orderModel")
const argon2 = require('argon2')
const userHelper=require('../../helpers/userHelper')
const Referral=require("../../models/referralSchema")
const {v4:uuidv4}=require("uuid")
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
let redeemAmount
let referalAmount
let OwnerId

// const loadHome = async (req, res) => {
//     try {
//       const userData = req.session.user;
  
//       if(userData){
//           var id = userData._id;
//           var user = await User.findById(id).lean();
          
//       }

//       const loadProData = await Product.aggregate([
//         { $match: { is_blocked: false } },
//         {
//           $lookup: {
//             from: "categories",
//             localField: "category",
//             foreignField: "_id",
//             as: "category",
//           },
//         },
//         {
//           $unwind: "$category",
//         },
//       ]);
  

//       const category=await Category.find({isListed:true})
  
//       // console.log(userData);
     
//           res.render("user/home", { category,loadProData, userData:user});
  
  
//     } catch (error) {
//       console.log(error);
//       res.status(500).send("server error");
//     }
//   };

// const loadHome=async(req,res)=>{
//   try{
//     const loadProData=await Product.find({is_blocked:false}).limit(8).lean()
//     const newProduct=await Product.find({is_blocked:false}).sort({_id:-1}).limit(8).lean()
//     const loadCatData=await Category.find({isListed:true}).lean()
//     const popularbooks=await Product.find({popularity:{$gt:0}}).sort({popularity:-1}).limit(8).lean()
    
//     console.log(popularbooks);
    

//     console.log(loadProData)
//     console.log(newProduct)
//     console.log(loadCatData)
//     console.log(popularbooks)

//     const userData=req.session.user
//     console.log(userData)

//     if(userData){
//       res.render('user/home',{userData,loadProData,loadCatData,newProduct,popularbooks})
//     }else{
//       res.render('user/home',{userData,loadProData,loadCatData,newProduct,popularbooks})
//     }

//   }catch(error){
//     console.log(error)
//   }
// }

// const loadHome=async(req,res)=>{
//   try{
//     const loadProData=await Product.aggregate([
//       {$match:{is_blocked:false}},
//       {
//         $lookup:{
//           from:"categories",
//           localField:"category",
//           foreignField:"_id",
//           as:"category",
//         },
//       },
//       {
//         $unwind:{
//           path:"$productOffer",
//           preserveNullAndEmptyArrays:true,
//         },
//       },
//       {
//         $project:{
//           _id:1,
//           name:1,
//           price:1,
//           description:1,
//           stock:1,
//           popularity:1,
//           imageUrl:1,
//           category:{
//             _id:1,
//             category:1,
//             imageUrl:1,
//             isListed:1,
//           },
//           discountPrice:{
//             $cond:{
//               if:{$eq:["$productOffer.currentStatus",true]},
//               then:"$productOffer.discountPrice",
//               else:"$price"
//             }
//           }
//         }
//       }
//     ])

//     console.log(loadProData)

//     const userData=req.session.user
//     console.log(userData)
//     if(userData){
//       res.render("user/home",{userData,loadProData})
//     }else{
//       res.render("user/home",{userData,loadProData})
//     }
//   }catch(error){
//     console.log(error)
//   }
// }

const loadHome = async (req, res) => {
  try {
    const loadProData = await Product.aggregate([
      {
        $match: { is_blocked: false },  // Filter products that are not blocked
      },
      {
        $lookup: {
          from: "productoffers",  // Reference to the productOffers collection
          localField: "productOfferId",  // Product's offer reference
          foreignField: "_id",  // Lookup the product offer by ID
          as: "productOffer",  // Store the result in the productOffer array
        },
      },
      {
        $unwind: {
          path: "$productOffer",  // Flatten the productOffer array into an object
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
          productOffer:1,
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
        },
      }      
    ]);

    const newProduct = await Product.aggregate([
      {
        $match: { is_blocked: false },  // Filter products that are not blocked
      },
      {
        $lookup: {
          from: "productoffers",  // Reference to the 'productoffers' collection
          localField: "productOfferId",  // The field in 'Product' that references 'productoffers'
          foreignField: "_id",  // Look for matching '_id' in the 'productoffers' collection
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
        },
      },
      {
        $sort: { _id: -1 },  // Sort products by latest first
      },
      {
        $limit: 8,  // Limit to 8 products
      },
    ]);

    const popularbooks = await Product.aggregate([
      {
        $match: { 
          popularity: { $gt: 0 }, // Filter products with popularity greater than 0
          is_blocked: false,       // Ensure the product is not blocked
        },
      },
      {
        $lookup: {
          from: "productoffers",  // Reference to the 'productoffers' collection
          localField: "productOfferId",  // The field in 'Product' that references 'productoffers'
          foreignField: "_id",  // Look for matching '_id' in the 'productoffers' collection
          as: "productOffer",  // Store the result in the 'productOffer' field
        },
      },
      {
        $unwind: {
          path: "$productOffer",  // Unwind the 'productOffer' array into an object
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
            res.redirect('/referals')
            //res.render('user/submitOtp')
        }
        else {
            message2 = true

            res.render('user/login', { message2 })

        }

    } catch (error) {
        console.log(error);
    }
}

//referal code
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



//Submit otp and save user

// const submitOtp = async (req, res) => {
//     try {
//         userOtp = req.body.otp;


//         if (userOtp == otp) {
//             const user = new User({
//                 name: userRegData.name,
//                 email: userRegData.email,
//                 mobile: userRegData.phone,
//                 password: hashedPassword,
//                 isVerified: true,
//                 isBlocked: false,
//             });

//             await user.save();

//             const userWalletData=await User.findOne({email:userRegData.email})

//             // const walletData={
//             //   userId:new mongoose.Types.ObjectId(userWalletData._id),
//             //   wallet:0,
//             //   history:[]
//             // }

//             if(redeemAmount){
//               walletData.wallet=redeemAmount
//               walletData.history.push({
//                 amount:redeemAmount,
//                 status:'Referred',
//                 date:Date.now()
//               })

//               await User.updateOne(
//                 {userId:OwnerId},
//                 {
//                   $inc:{wallet:referalAmount},
//                   $push:{
//                     history:{
//                       amount:referalAmount,
//                       status:"referred",
//                       date:Date.now()
//                     }
//                   }
//                 }
//               )
//               .then(data=>console.log("codeonwer Wallet=>",data))
//             }

//             const wallet=new Wallet(walletData)
//             await user.save()

//             const generateReferalCode=uuidv4()

//             const referalCollection=new Referral({
//               userId:new mongoose.Types.ObjectId(userWalletData._id),
//               referralCode:generateReferalCode
//             })

//             await referalCollection.save()

//             req.session.regSuccessMsg = true;

//             // Send JSON response with success message
//             res.json({ success: true, redirectUrl: '/login' });
//         } else {
//             otpError = 'incorrect otp';

//             // Send JSON response with error message
//             res.json({ error: otpError });
//         }
//     } catch (error) {
//         console.log(error);

//         // Send JSON response with error message
//         res.json({ error: 'An error occurred while submitting the OTP.' });
//     }
// };


const submitOtp=async(req,res)=>{
  try{
    userOtp=req.body.otp
    if(userOtp === otp){
      const user=new User({
        name:userRegData.name,
        email:userRegData.email,
        mobile:userRegData.phone,
        password:hashedPassword,
        isVerified:true,
        isBlocked:false,
      })
      await user.save()
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
      const generateReferalCode=uuidv4()
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
      req.session.regSuccessMsg=true
      res.json({success:true,redirectUrl:'/login'})
    }else{
      otpError="IncorrectOtp"
      res.json({error:otpError})
    }
  }catch(error){
    console.log(error)
  }
}



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
    verifyReferelCode
}