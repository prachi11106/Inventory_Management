
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Inventory Management API is running!");
});

app.use("/api/products", require("./routes/productRoutes"));

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: err.message || "Server error" });
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected Successfully");
        app.listen(process.env.PORT || 5000, () => {
            console.log("Server running on port 5000");
        });
    })
    .catch(err => console.log("MongoDB Error:", err.message));
