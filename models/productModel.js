const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,//It store a unique identifier for a document in another collection.This enables a relationship or link between two collections
      ref: "category",//refer the category collection
      required: true,
    },

    imageUrl: {
      type: Array,
      required: true,
    },

    stock: {
      type: Number,
      required: true,
    },
    popularity: {
      type: Number,
      default: 0,
    },
    bestSelling:{
      type:Number,
      default:0
    },
    is_blocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);