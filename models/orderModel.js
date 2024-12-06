const mongoose = require("mongoose");

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
