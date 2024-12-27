const User = require('../models/userModel')

const isLogin = async(req,res,next)=>{
    try {

        if(!req.session.user){
            //change res.redirect('/')
            res.redirect('/login')
        }else{
            next()
        }
       
    } catch (error) {
        console.log(error.message);
    }

}


const isLogout = async(req,res,next)=>{
    try {
        if(req.session.user){
            res.redirect('/')
        }else{
            next()
        }
      

    } catch (error) {
        console.log(error.message);
    }

} 


const logedin = async(req, res, next)=>{
    try {

        if(!req.session.user){
            res.redirect('/login')
        }else{
            next()
        }
        
    } catch (error) {
        console.log(error.message);
    }

}

// const isBlocked = async ( req, res, next ) => {

//     const userData = req.session.user;
//     const id = userData._id
//     const user = await User.findById(id)

//      if(user.isBlocked){
//        res.redirect('/logout')
//      }else{
//         next()
//    }
//  }

const isBlocked = async (req, res, next) => {
    const userData = req.session.user;
    if (!userData) {
       return res.redirect('/home'); 
    }
    const id = userData._id;
    const user = await User.findById(id);
    if (user && user.isBlocked) {
        return res.redirect('/logout');
    }
    next();
};


module.exports ={
    isLogin,
    isLogout,
    logedin,
    isBlocked,
}