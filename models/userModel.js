const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");


const userSchema =  mongoose.Schema({
    name: {
        type: "string",
        required: [true, "Please add a name"],
    },
    email: {
        type: "string",
        required: [true, "Please add a email"],
        unique: true,
        trim: true,
        match: [/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 
        "Please enter a valid email address"
          ]
    },
    password: {
        type: "string",
        required: [true, "Please enter a valid password"],
        minlength:[6, "password must be up to 6 characters long"],
        //maxlength:[23, "password must not be more than 23 characters long"],
    },
    photo:{
        type: "string",
        required: [true, "Please enter a photo"],
        default: "https://i.ibb.co/4pDNDk1/avatar.png",
    },
    phone:{
        type: "string",
        default: "+237",
    },
    bio:{
        type: "string",
        maxLength: [250, "Bio must not be more than 250 characters long"],
        default: "bio"
    }
}, {timestamps: true})

// Encrypt password before saving to db 

userSchema.pre("save", async function(next){

    if(!this.isModified("password")){
        return next();
    }
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword
    next();
})

const user = mongoose.model('User',userSchema);
module.exports = user;