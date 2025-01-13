const User=require("../../models/userModel")
const path=require("path")
require("dotenv").config({path:path.resolve(__dirname,".env")})
const Razorpay=require("razorpay")

let instance=new Razorpay({
    key_id:process.env.KEY_ID,
    key_secret:process.env.KEY_SECRET
})


const walletpage = async (req, res) => {
    try {
        const sessionUser = req.session.user;
        const id = sessionUser._id;
        const userData = await User.findById(id).lean();

        let page = 1;
        if (req.query.page) {
            page = parseInt(req.query.page, 10);
        }
        const limit = 5;
        const skip = (page - 1) * limit;

        // Directly access the user's history with pagination
        const userHistory = await User.findById(id).lean();
        userHistory.history=userHistory.history || []
        const totalItems = userHistory.history.length;
        const totalPages = Math.ceil(totalItems / limit);
        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
        const sortedHistory = userHistory.history.sort((a, b) => new Date(b.date) - new Date(a.date));//descending wise sorting
        const paginatedHistory = sortedHistory.slice(skip, skip + limit);
        console.log('Page:', page);
        console.log('Skip:', skip);
        console.log('Limit:', limit);
        console.log('Sorted History:', sortedHistory);
        console.log('Paginated History:', paginatedHistory);
        console.log('Total Items:', totalItems);
        console.log('Total Pages:', totalPages);

        res.render('user/wallet', { userData, history: paginatedHistory, pages, page });
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Internal Server Error');
    }
};


let addMoneyToWallet=async(req,res)=>{
    try{
        console.log(req.body)

        var options={
            amount:parseInt(req.body.total)*100,
            currency:"INR",
            receipt:""+Date.now()
        }
        console.log("creating Razorpay order with options:",options)

        instance.orders.create(options,async function(error,order){
            if(error){
                console.log("Error while creating order:",error)
            }else{
                var amount=order.amount/100
                console.log(amount)
                await User.updateOne(
                    {
                        _id:req.session.user._id
                    },
                    {
                        $push:{
                            history:{
                                amount:amount,
                                status:"credit",
                                date:Date.now()
                            }
                        }
                    }
                )
            }

            res.json({
                order:order,
                razorpay:true
            })
        })

    }catch(error){
        console.log(error)
    }
}
                            
const verifyPayment=async(req,res)=>{
    try{
        let details=req.body
        console.log("req.body",details)
        let amount =parseInt(details.order.order.amount)/100
        console.log("wallet amount",amount)

        const updated=await User.updateOne(
            {
                _id:req.session.user._id
            },
            {
                $inc:{
                    wallet:amount
                }
            },
            {upsert:true}
        )
        console.log(updated)

        res.json({
            success:true
        })
    }catch(error){
        console.log(error)
    }
}
module.exports={
    walletpage,
    addMoneyToWallet,
    verifyPayment
}