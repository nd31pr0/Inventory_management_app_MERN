const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const cloudinary = require("cloudinary").v2;

const {fileSizeFormatter} = require("../utils/fileUpload");

//create product
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

// get single product
const getProduct = asyncHandler( async(req, res)=>{
    const product = await Product.findById(req.params.id)

    //if the product doesn't exist
    if (!product){
        res.status(404)
        throw new Error("Product not found")
    }
    //match product to its user
    if (product.user.toString() !== req.user.id){
        res.status(401)
        throw new Error("user not authorized")
    }
    res.status(200).json(product)
});

// delete product
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)

    //if the product doesn't exist
    if (!product){
        res.status(404)
        throw new Error("Product not found")
    }
    //match product to its user
    if (product.user.toString() !== req.user.id){
        res.status(401)
        throw new Error("user not authorized to delete product")
    }
    await product.deleteOne();
    res.status(200).json({message: "Product deleted successfully"})
});

// update product
const updateProduct = asyncHandler(async (req, res) => {
    const {name, category, quantity, price, description} = req.body;
    const {id} = req.params

    const product = await Product.findById(id)

    // check if the product exists
    if (!product){
        res.status(404)
        throw new Error("Product not found");
    }
    //match product to its user
    if (product.user.toString() !== req.user.id){
        res.status(401)
        throw new Error("user not authorized")
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

    // updating product
    const updatedProduct = await Product.findByIdAndUpdate(
        {_id:id}, 
        {
            name, 
            category, 
            quantity,
            price,
            description,
            image: Object.keys(fileData).length === 0 ? product?.image : fileData,
        },
        {
            new: true,
            runValidators: true
        }
    )

    res.status(200).json(updatedProduct);


});

module.exports = {
    createProduct, getProducts, getProduct, deleteProduct, updateProduct,
};
