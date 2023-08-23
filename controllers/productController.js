const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const cloudinary = require("cloudinary").v2;

const {fileSizeFormatter} = require("../utils/fileUpload");
const createProduct = asyncHandler (async (req, res) => {
    const {name, sku, category, quantity, price, description} = req.body;

    //validation 
    if (!name || !price || !category || !quantity || !description) {
        res.status(400);
        throw new Error("Please fill in all required fields")
    }

    //handle image upload
    let fileData = {}
    if (req.file){
        // save image to cloudinary
        let uploadedFile;
        try{
            uploadedFile = await cloudinary.uploader.upload(req.file.path, {folder: "Product_Inventory_app", resource_type: "image"})
        }catch(e){
            res.status(500)
            throw new Error("Image could not be uploaded")
        }
        fileData = {
            fileName: req.file.originalname,
            filePath: uploadedFile.secure_url,
            fileType: req.file.mimetype,
            fileSize: fileSizeFormatter(req.file.size, 2),
        }
    }

    // create product
    const product = await Product.create({
        user: req.user.id,
        name,
        sku, 
        category, 
        quantity,
        price,
        description,
        image: fileData
    })
    res.status(201).json(product)




});

// get all products
const getProducts = asyncHandler( async(req, res)=>{
    //res.json("get products")
    const products = await Product.find({user: req.user.id}).sort("-createdAt");
    res.status(200).json(products)
})

module.exports = {
    createProduct, getProducts,
};
