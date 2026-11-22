
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    sku: {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    reorderLevel: {
        type: Number,
        default: 10
    },
    supplier: {
        type: String,
        default: "Not specified"
    }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
