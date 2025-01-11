const mongoose = require("mongoose");
const Handlebars=require("../helpers/handlebarsHelper")
const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  product: [
    {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      name: { type: String },
      price: { type: Number },
      quantity: { type: Number },
      image: { type: String },
      address: { type: Object },
      isCancelled:{type:Boolean,default:false},
      isReturned:{type:Boolean,default:false}
    },
  ],

  address: {
    type: String,
    required: true,
  },

  orderId: {
    type: String,
    required: true,
  },

  total: {
    type: Number,
    required: true,
  },
//changes start
  discountAmt: {
    type: Number,
  },

  amountAfterDscnt: {
    type: Number,
  
  },
  coupon: {
    type: String,
  },
  couponUsed: {
    type: Boolean,
    default: false,
  },
  //change end
  paymentMethod: {
    type: String,
    required: true,
  },
  deliveryCharge: {
    type: Number,
    default: 50
  },

  status: {
    type: String,
    enum: ["pending", "Payment Failed" , "Shipped", "Delivered", 'Cancelled', 'Returned'],
    default: "pending",
  },

  date: {
    type: Date,
    default: Date.now,
  },

  reason :{
    type:String,
    default:'',
  }
});

module.exports = mongoose.model("Order", orderSchema);
