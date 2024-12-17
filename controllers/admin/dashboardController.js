const moment=require('moment')
const Order=require("../../models/orderModel")
const PDFDocument=require("pdfkit")



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


module.exports={
    getSales
}