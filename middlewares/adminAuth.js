const isLogin = (req, res, next)=>{
    try {
      if (!req.session.admin) {
        
        res.redirect("/admin/login")
        
      }
      else {
        next()
      }
    } catch (error) {
      console.log(error)
    }
  }
  
  const isLogout = async (req, res, next)=>{
    try {
      if (req.session.admin) {
        res.redirect("/admin/home")
        
      }
      else {
        next()
      }
    } catch (error) {
      console.log(error)
    }
  }
  
  module.exports = {
    isLogin,
    isLogout
  }