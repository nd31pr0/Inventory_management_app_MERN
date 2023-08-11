const asyncHandler = require('express-async-handler')
const User = require('../models/userModel');
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: "1d"})
}

const registerUser = asyncHandler( async (req, res) => {
    const {name, email, password} = req.body
    

    //Validation 
    if (!name || !email || !password){
        res.status(400)
        throw new Error("Please fill in all required fields")
    }
    if(password.length < 6){
        res.status(400)
        throw new Error("Please password must be up to 6 characters")
    }

    // check if user email exists already 
    const userExists = await User.findOne({ email })
    if (userExists){
        res.status(400)
        throw new Error("Email has already been registered");
    }


    //create new user 
    const user = await User.create({
        name, 
        email,
        password,
    })

    // Generate token after creating user 
    const token =generateToken(user._id)

    if(user){
        const {_id, name, email, photo, phone, bio} = user
        res.status(201).json({
            _id,
            name,
            email, 
            photo, 
            phone, 
            bio,
            token,
        })
    } else {
        res.status(400)
        throw new Error("invalid user data")
    }
});

module.exports = {
    registerUser
};