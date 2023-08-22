const express = require('express');
const protect = require("../middleWare/authMiddleWare");

const router =  express.Router();
const {registerUser, loginUser, logout, getUser, loginStatus, updateUser, changePassword, forgotPassword, resetPassword,} = require('../controllers/userController')
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logout);
router.get("/getuser", protect, getUser);
router.get("/loggedinstatus", loginStatus);
router.patch("/updateuser", protect, updateUser)
router.patch("/changePassword", protect, changePassword)
router.post("/forgotpassword", forgotPassword);

router.put("resetpassword/:resetToken", resetPassword);

module.exports = router;