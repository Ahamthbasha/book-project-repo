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

const loadDashboard = async (req, res) => {
    try {
// Get the count of categories
        const categoryCount = await Category.countDocuments();
// Aggregation to calculate category revenue
        const categoryRevenue = await Order.aggregate([
            {
                $match:{
                    status:"Delivered"
                }
            },
            { $unwind: "$product" },
            {
                $lookup: {
                    from: "products",
                    localField: "product._id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" },
            {
                $group: {
                    _id: "$productDetails.category",
                    totalRevenue: { $sum: { $multiply: ["$product.quantity", "$productDetails.price"] } }
                }
            },
            {
                $lookup: {
                    from: "categories",
                    localField: "_id",
                    foreignField: "_id",
                    as: "categoryDetails"
                }
            },
            { $unwind: "$categoryDetails" },
            {
                $project: {
                    _id: 0,
                    category: "$categoryDetails.category",
                    totalRevenue: 1
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);
// Debugging categoryRevenue
console.log("Category Revenue Data:", categoryRevenue);
//[{category:categoryname,totalRevenue:1500},..]

// Ensure that categoryRevenue is not empty
        categories = categoryRevenue.map(item => item.category);//['ctegory name',..]
        revenues = categoryRevenue.map(item => item.totalRevenue);//['revenue',..]

// Fetch sales data and organize it by month
        const sales = await Sale.find({status: "Delivered"}).lean();
        //[{"date":"2024-12-01",total:2000},...]
//create the object
        const salesByMonth = {};

sales.forEach((sale) => {
            const monthYear = moment(sale.date).format('MMMM YYYY');
            if (!salesByMonth[monthYear]) {
                salesByMonth[monthYear] = { totalOrders: 0, totalRevenue: 0 };
            }
            salesByMonth[monthYear].totalOrders += 1;
            salesByMonth[monthYear].totalRevenue += sale.total;
        });//{"month year":{"totalOrders":3,"totalRevenue":7500}}

// Prepare data for the chart
        const chartData = [];
//it will take the keys from the salesByMonth object.
        Object.keys(salesByMonth).forEach((monthYear) => {
            const { totalOrders, totalRevenue } = salesByMonth[monthYear];//here destructure the totalOrders and totalRevenue from the salesByMonth
            chartData.push({
                month: monthYear.split(' ')[0],//assume you have keys like "December 2024".By this line it will take December
                totalOrders: totalOrders || 0,//total orders
                totalRevenue: totalRevenue || 0//totalRevenue
            });
        });
//Atlast the chartData has array of objects

// Reset and prepare the final dashboard data
        months = [];
        odersByMonth = [];
        revnueByMonth = [];
        totalRevnue = 0;
        totalSales = 0;

        chartData.forEach((data) => {
            months.push(data.month);
            odersByMonth.push(data.totalOrders);
            revnueByMonth.push(data.totalRevenue);
            totalRevnue += Number(data.totalRevenue);
            totalSales += Number(data.totalOrders);
        });

// Get data for best selling products, popular products, and best-selling categories
        let bestSellings = await Product.find().sort({ bestSelling: -1 }).limit(5).lean();
        let popuarProducts = await Product.find().sort({ popularity: -1 }).limit(5).lean();
        let bestSellingCategory = await Category.find().sort({ bestSelling: -1 }).limit(5).lean();

        // Render the dashboard page with data
        res.render("admin/home", {
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
            thisMonthOrder: odersByMonth.length > 0 ? odersByMonth[odersByMonth.length - 1] : 0,//here it will get the recent month data
            thisMonthSales: revnueByMonth.length > 0 ? revnueByMonth[revnueByMonth.length - 1] : 0,
            layout: 'adminLayout',
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

const getSales = async (req, res) => {  
    //destructure the startDate and endDate
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