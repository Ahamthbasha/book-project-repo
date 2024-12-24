const moment=require('moment')
const Sale=require("../../models//orderModel")
const Order=require("../../models/orderModel")
const hbs=require("hbs")
const Handlebars=require('handlebars')
const Product=require("../../models/productModel")
const Category=require("../../models/categoryModel")
const PDFDocument=require("pdfkit")


let months=[]
let odersByMonth=[]
let revnueByMonth=[]
let totalRevnue=0
let totalSales=0
let categories=[]
let revenues=[]

const loadDashboard=async(req,res)=>{
    try{
        const categoryCount=await Category.countDocuments()
        const categoryRevenue=await Order.aggregate([
            {$unwind:"$product"},
            {
                $lookup:{
                    from:"products",
                    localField:"product._id",
                    foreignField:"_id",
                    as:"productDetails"
                }
            },
            {$unwind:"$productDetails"},
            {
                $group:{
                    _id:"productDetails.category",
                    totalRevenue:{$sum:{$multiply:["$product.quantity","$productDetails.price"]}}
                }
            },
            {
                $lookup:{
                    from:"categories",
                    localField:"_id",
                    foreignField:"_id",
                    as:"categoryDetails"
                }
            },
            {$unwind:"$categoryDetails"},
            {
                $project:{
                    _id:0,
                    category:"$categoryDetails.category",
                    totalRevenue:1
                }
            },
            {$sort:{totalRevenue:-1}}
        ])

        categories=categoryRevenue.map(item=>item.category)
        revenues=categoryRevenue.map(item=>item.totalRevenue)

        console.log(categories)
        console.log("////////////////",categoryRevenue)

        const sales=await Sale.find({}).lean()

        const salesByMonth={}

        sales.forEach((sale)=>{
            const monthYear=moment(sale.date).format('MMMM YYYY')
            if(!salesByMonth[monthYear]){
                salesByMonth[monthYear]={
                    totalOrders:0,
                    totalRevenue:0
                }
            }
            salesByMonth[monthYear].totalOrders +=1
            salesByMonth[monthYear].totalRevenue+=sale.total
        })

        const chartData=[]

        Object.keys(salesByMonth).forEach((monthYear)=>{
            const {totalOrders,totalRevenue}=salesByMonth[monthYear]
            chartData.push({
                month:monthYear.split(' ')[0],
                totalOrders:totalOrders || 0,
                totalRevenue:totalRevenue||0
            })
        })
        console.log(chartData)

        months=[]
        odersByMonth=[]
        revnueByMonth=[]
        totalRevnue=0
        totalSales=0

        chartData.forEach((data)=>{
            months.push(data.month)
            odersByMonth.push(data.totalOrders)
            revnueByMonth.push(data.totalRevenue)
            totalRevnue+=Number(data.totalRevenue)
            totalSales+=Number(data.totalOrders)
        })

        const thisMonthOrder=odersByMonth.length > 0? odersByMonth[odersByMonth.length - 1]:0
        const thisMonthSales=revnueByMonth.length > 0?revnueByMonth[revnueByMonth.length -1]:0

        let bestSellings=await Product.find().sort({bestSelling:-1}).limit(5).lean()
        let popuarProducts=await Product.find().sort({popularity:-1}).limit(5).lean()
        let bestSellingCategory=await Category.find().sort({bestSelling:-1}).limit(5).lean()

        res.render("admin/home",{
            categoryCount,
            revnueByMonth,
            bestSellingCategory,
            bestSellings,
            popuarProducts,
            months,
            odersByMonth,
            totalRevnue,
            categoryRevenue,
            totalSales,
            thisMonthOrder,
            thisMonthSales,
            layout:'adminLayout'
        })
    }catch(error){
        console.log(error)
    }
}
// const getSales = async (req, res) => {  
//     const { stDate, edDate } = req.query;
//     console.log('Received dates:', stDate, edDate);

//     const startDate = new Date(stDate);
//     const endDate = new Date(new Date(edDate).setHours(23, 59, 59, 999));//include the entire final day

//     try {
//         const orders = await Order.find({
//             date: {
//                 $gte: startDate,
//                 $lte: endDate
//             },
//             status: 'Delivered'
//         }).sort({ date: "desc" });

//         console.log('Orders from DB:', orders);

//         // Format the date using moment() and ensure it's mapped correctly
//         const formattedOrders = orders.map((order) => {
//             const formattedDate = moment(order.date).format('DD-MM-YYYY'); // Ensure date is correctly formatted
//             console.log(`Formatted Date for order ${order.orderId}:`, formattedDate);

//             // Map through the products and ensure product details (including discountAmt) are added for each product
//             const productsWithDetails = order.product.map((product) => {
//                 return {
//                     name: product.name,  // Assuming the product has a `name` property
//                     quantity: product.quantity,  // Assuming the product has a `quantity` property
//                     price: product.price,  // Assuming the product has a `price` property
//                     discountAmt: order.discountAmt || 0,  // Adding the discountAmt to each product
//                 };
//             });

//             return {
//                 date: formattedDate,  // Include the formatted date
//                 orderId: order.orderId,
//                 total: order.total,
//                 paymentMethod: order.paymentMethod,
//                 coupon: order.coupon,
//                 couponUsed: order.couponUsed,
//                 product: productsWithDetails,  // Pass the correctly expanded product details
//                 discountAmt: order.discountAmt || 0, // Include discount amount in the return object
//             };
//         });

//         console.log('Formatted Orders:', formattedOrders);

//         let salesData = [];
//         let grandTotal = 0;
//         let overallDiscountAmount = 0;  // To store the total discount amount

//         // Loop through orders to calculate grand total and discount amount
//         formattedOrders.forEach((element) => {
//             salesData.push({
//                 date: element.date,
//                 orderId: element.orderId,
//                 total: element.total,
//                 payMethod: element.paymentMethod,
//                 coupon: element.coupon || "none",
//                 couponUsed: element.couponUsed,
//                 proName: element.product,
//             });

//             salesData.reverse()

//             // Calculate the total revenue and discount
//             grandTotal += element.total;
//             overallDiscountAmount += element.discountAmt; // Sum up the discount amounts
//         });

//         const salesCount = salesData.length; // Calculate the total number of orders

//         console.log('Grand Total:', grandTotal);
//         console.log('Overall Discount Amount:', overallDiscountAmount);

//         // Send the result with the total revenue, sales count, and discount amount
//         res.json({
//             grandTotal: grandTotal,
//             salesCount: salesCount,
//             overallDiscountAmount: overallDiscountAmount, // Include overall discount amount in response
//             orders: salesData,
//         });
//     } catch (error) {
//         console.log('Error fetching sales data:', error);
//         res.status(500).json({ error: 'Failed to fetch sales data' });
//     }
// };


const getSales = async (req, res) => {  
    const { stDate, edDate } = req.query;
    console.log('Received dates:', stDate, edDate);

    const startDate = new Date(stDate);
    const endDate = new Date(new Date(edDate).setHours(23, 59, 59, 999)); // Include the entire final day

    try {
        const orders = await Order.find({
            date: {
                $gte: startDate,
                $lte: endDate
            },
            status: 'Delivered'
        }).sort({ date: "desc" }); // Sorting by date in descending order

        console.log('Orders from DB:', orders);

        // Format the date using moment() and ensure it's mapped correctly
        const formattedOrders = orders.map((order) => {
            const formattedDate = moment(order.date).format('DD-MM-YYYY'); // Ensure date is correctly formatted
            console.log(`Formatted Date for order ${order.orderId}:`, formattedDate);

            // Map through the products and ensure product details (including discountAmt) are added for each product
            const productsWithDetails = order.product.map((product) => {
                return {
                    name: product.name,  // Assuming the product has a `name` property
                    quantity: product.quantity,  // Assuming the product has a `quantity` property
                    price: product.price,  // Assuming the product has a `price` property
                    discountAmt: order.discountAmt || 0,  // Adding the discountAmt to each product
                };
            });

            return {
                date: formattedDate,  // Include the formatted date
                orderId: order.orderId,
                total: order.total,
                paymentMethod: order.paymentMethod,
                coupon: order.coupon,
                couponUsed: order.couponUsed,
                product: productsWithDetails,  // Pass the correctly expanded product details
                discountAmt: order.discountAmt || 0, // Include discount amount in the return object
            };
        });

        console.log('Formatted Orders:', formattedOrders);

        let salesData = [];
        let grandTotal = 0;
        let overallDiscountAmount = 0;  // To store the total discount amount

        // Loop through orders to calculate grand total and discount amount
        formattedOrders.forEach((element) => {
            salesData.push({
                date: element.date,
                orderId: element.orderId,
                total: element.total,
                payMethod: element.paymentMethod,
                coupon: element.coupon || "none",
                couponUsed: element.couponUsed,
                proName: element.product,
            });

            // Calculate the total revenue and discount
            grandTotal += element.total;
            overallDiscountAmount += element.discountAmt; // Sum up the discount amounts
        });

        // No need to reverse formattedOrders explicitly unless required
        const salesCount = salesData.length; // Calculate the total number of orders

        console.log('Grand Total:', grandTotal);
        console.log('Overall Discount Amount:', overallDiscountAmount);

        // Send the result with the total revenue, sales count, and discount amount
        res.json({
            grandTotal: grandTotal,
            salesCount: salesCount,
            overallDiscountAmount: overallDiscountAmount, // Include overall discount amount in response
            orders: salesData, // This should already be sorted in descending order
        });
    } catch (error) {
        console.log('Error fetching sales data:', error);
        res.status(500).json({ error: 'Failed to fetch sales data' });
    }
};


const getChartData=(req,res)=>{
    try{
        res.json({
            months:months,
            revnueByMonth:revnueByMonth,
            odersByMonth:odersByMonth,
            cat:categories,
            revenue:revenues
        })
    }catch(error){
        console.log(error)
    }
}

module.exports={
    loadDashboard,
    getSales,
    getChartData
}