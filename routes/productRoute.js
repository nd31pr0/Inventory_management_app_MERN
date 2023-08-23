const express = require('express');
const protect = require("../middleWare/authMiddleWare");
const {upload} = require('../utils/fileUpload');

const { createProduct, getProducts } = require('../controllers/productController');
const router =  express.Router();

router.post("/", protect, upload.single("image"), createProduct)
router.get("/", protect, getProducts)

module.exports = router;