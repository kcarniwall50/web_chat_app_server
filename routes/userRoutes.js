const express = require("express");
const router = express.Router();


const { signUp, login, forgotPassword, resetPassword, userUpdate, getAllUsers, setAvatar } = require("../controllers/userController");


// register user
router.post("/api/user/register", signUp );

// user login
router.post("/api/user/login",login );

// forgot password
router.post("/api/user/forgotPass",forgotPassword );

// reset password
router.put("/api/user/resetPassword/:resetToken",  resetPassword );


// get all users
router.get("/getAllUsers", getAllUsers );

// setAvatar
router.patch("/setAvatar", setAvatar);

module.exports = router;
