const asyncHandler = require('express-async-handler')
const User = require('../models/userModel');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: "1d"})
}

// register user
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

    // send HTTP only cookie 
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), // 1day from now.
        sameSite: "none",
        secure: true
    })
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

// Login user 
const loginUser = asyncHandler( async (req, res) => {
    const {email, password} = req.body 

    //validate request 
    if(!email || !password) {
        res.status(400);
        throw new Error("Please add email and password")
    } 
    const user = await User.findOne({email})
    if(!user) {
        res.status(400);
        throw new Error("User not found, please signup")
    } 

    // user exists, now check if password is correct 
    const passwordIsCorrect = await bcrypt.compare(password, user.password) 

    // Generate token after creating user 
    const token =generateToken(user._id)

    // send HTTP only cookie 
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), // 1day from now.
        sameSite: "none",
        secure: true
    })

    if(user && passwordIsCorrect) {
        const {_id, name, email, photo, phone, bio} = user;
        res.status(200).json({
            _id,
            name,
            email, 
            photo, 
            phone, 
            bio,
            token,
        });
} else {
    res.status(400);
    throw new Error("invalid email or password")
}

});

//logout User
const logout = asyncHandler (async (req, res) => {
    res.cookie("token", "", {
        path: "/",
        httpOnly: true,
        expires: new Date(0), // 1day from now.
        sameSite: "none",
        secure: true
    });
    return res.status(200).json({
        message: "logout successful"
    });
});

// get user profile data
const getUser = asyncHandler (async (req, res) => {
    const user = await User.findById(req.user._id)

    if(user){
        const {_id, name, email, photo, phone, bio} = user
        res.status(201).json({
            _id,
            name,
            email, 
            photo, 
            phone, 
            bio,
        })
    } else {
        res.status(400)
        throw new Error("User not found")
    }
});
// get login status
const loginStatus = asyncHandler (async (req, res) => {
    const token = req.cookies.token;
    if(!token){
        return res.json(false)
    }

    // verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET)
    if(verified){
        return res.json(true)
    }
    return res.json(false)
})
const updateUser = asyncHandler (async (req, res) => {
    const user = await User.findById(req.user._id)

    if (user){
        const { name, email, photo, phone, bio} = user;
        user.email = email;
        user.name = req.body.name || name;
        user.phone = req.body.phone || phone;
        user.photo = req.body.photo || photo;
        user.bio = req.body.bio || bio;
        
        const updatedUser = await user.save()
        res.status(200).json({
            name: updatedUser.name,
            email: updatedUser.email, 
            photo: updatedUser.photo, 
            phone: updatedUser.phone, 
            bio: updatedUser.bio,
        })
    } else {
        res.status(404)
        throw new Error("User not found")
    }
})
const changePassword = asyncHandler(async (req,res) =>{
    const user = await User.findById(req.user._id);

    const {oldPassword, password} = req.body
    if(!user) {
        res.status(400)
        throw new Error("user not found, please sign up")
    }

    // validate password
    if(!oldPassword || !password) {
        res.status(400)
        throw new Error("Please add old password and then the new password")
    }

    // check if old password matches password in db
    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password)

    // save new password 
    if(user && passwordIsCorrect) {
        user.password = password;
        await user.save();
        res.status(200).send("password change succesful")
    } else {
        res.status(400);
        throw new Error("Old password is incorrect")
    }
});
const forgotPassword = asyncHandler(async(req, res)=>{
    const {email} = req.body;
    const user = User.findOne({email}) 

    if(!user) {
        res.status(404)
        throw new Error("User does not exist")
    }

    // Delete token if it exists in DB 
    let token = await Token.findOne({userId: user._id })
    if(token) {
        await token.deleteOne();
    }


    // create reset token
    let resetToken = crypto.randomBytes(32).toString("hex") + user._id 

    // hash the token before saving to db 
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    //save token to db 
    await new Token({
        userId: user._id,
        token: hashedToken,
        createdAt: Date.now(),  
        expiresAt: Date.now() + 30 * (60 * 1000) //thirty minutes
    }).save(); 

    // Construct Reset Url
    const reseturl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`

    // Reset Email 
    const message = `
        <h2>Hello ${user.name}</h2>
        <p>Please use the url below to reset your password</p>
        <p>This reset link is valid for only 30 minutes.</p>

        <a href=${reseturl} clicktracking=off>${reseturl}</a>
        <p>Regards...</p>
        <p>Inventory App Team...</p>
    `;
    const subject = "Password Reset Request for Inventory App"
    const send_to = user.email
    const sent_from = process.env.EMAIL_USER

    try {
        await sendEmail(subject, message, send_to, sent_from)
        res.status(200).json({success: true, message: "Reset Email Sent"})
    } catch (error) {
        res.status(500)
        throw new Error("Email not sent, please try again")
    }

});

// reset password
const resetPassword = asyncHandler(async (req, res) =>{
    const {password} = req.body 
    const {resetToken} = req.params
    
    // hash token from params and compare to contents in DB
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    // find token in DB 
    const userToken = await Token.findOne({
        token: hashedToken,
        expiresAt: {$gt: Date.now()}
    })
    if (!userToken){
        res.status(404);
        throw new Error("Invalid or expired token ")
    }
    //find the user 
    const user = await User.findOne({_id: userToken.userId})
    user.password = password
    await user.save()
    res.status(200).json({
        message:"Password reset successful, please login"})
})

module.exports = {
    registerUser,
    loginUser,
    logout,
    getUser,
    loginStatus,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword,
};