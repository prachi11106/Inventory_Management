
const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        console.log("POST REQUEST RECEIVED:", req.body);

        const product = new Product({
            name: req.body.name,
            sku: req.body.sku,
            category: req.body.category,
            price: req.body.price,
            quantity: req.body.quantity,
            reorderLevel: req.body.reorderLevel,
            supplier: req.body.supplier
        });

        console.log("SKU BEING SAVED:", product.sku);

        await product.save();

        res.status(201).json(product);

    } catch (err) {
        console.log("DATABASE ERROR:", err.message);
        res.status(400).json({ message: err.message });
    }
});

// GET ALL PRODUCTS
router.get("/", async (req, res) => {
    try {
        const {
            category, search, sort = "createdAt",
            order = "desc", page = 1, limit = 10
        } = req.query;

        const filter = {};

        if (category) filter.category = new RegExp(category, "i");
        if (search) filter.name = new RegExp(search, "i");

        const pageNumber = Math.max(1, Number(page) || 1);
        const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));

        const products = await Product.find(filter)
            .sort({ [sort]: order === "asc" ? 1 : -1 })
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize);

        const total = await Product.countDocuments(filter);

        res.json({
            total,
            page: pageNumber,
            totalPages: Math.ceil(total / pageSize),
            products
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// LOW STOCK REPORT
router.get("/low-stock", async (req, res) => {
    try {
        const products = await Product.find({
            $expr: { $lte: ["$quantity", "$reorderLevel"] }
        });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CATEGORY SUMMARY
router.get("/summary", async (req, res) => {
    try {
        const summary = await Product.aggregate([
            {
                $group: {
                    _id: "$category",
                    totalProducts: { $sum: 1 },
                    totalQuantity: { $sum: "$quantity" },
                    totalValue: {
                        $sum: { $multiply: ["$price", "$quantity"] }
                    }
                }
            }
        ]);
        res.json(summary);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET ONE PRODUCT
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// UPDATE PRODUCT
router.put("/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// ADJUST STOCK
router.patch("/:id/stock", async (req, res) => {
    try {
        const change = Number(req.body.change);

        if (!Number.isInteger(change) || change === 0) {
            return res.status(400).json({ message: "Enter a non-zero integer change" });
        }

        const product = await Product.findOneAndUpdate(
            {
                _id: req.params.id,
                quantity: { $gte: change < 0 ? -change : 0 }
            },
            { $inc: { quantity: change } },
            { new: true, runValidators: true }
        );

        if (!product) return res.status(400).json({
            message: "Product not found or insufficient stock"
        });

        res.json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE PRODUCT
router.delete("/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
