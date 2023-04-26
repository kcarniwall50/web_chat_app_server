const express = require('express')
// const productModel = require('../model/productModel')
const userModel = require('../models/userModel')
const router= express.Router()
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const tokenModel = require('../models/tokenModel');
const sendEmail = require('../utils/sendEmail');


// register user
router.post("/api/user/register", async(req, res)=>{
console.log(req.body)
  const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
  };

  const {name, email, password} = req.body
  // console.log(req.body, "...")
  try{
  
  // checking if user exists
  const user= await userModel.findOne({email:email},{password:0})
      //  console.log("uuu", user, "....")

      if(user)
      {
        return res.status(200).send("user already exist")
      }
  
  const newUser = {
    name,
    email,
    password,
  };
  const userCreated=await userModel.create(newUser)

  // creating token for new user
  const token = generateToken(userCreated._id);


  res.cookie("token", token, { 
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400),
    sameSite: "none",
    secure: true,
  });
// console.log("token", token, "..")
   res.status(201).json(userCreated)
}
catch(e)
{
  throw new Error(e)
  return  res.status(500).send(e)
}

})




// user login
 router.post("/api/user/login", async(req, res)=>{
  const {email, password} = req.body

// checking if user exists
const user= await userModel.findOne({email:email})
      // console.log("userrrr", user, "....")

try{

if(!user)
{
  // throw new Error("User is not registered")
 return res.status(404).send("user does not exist")  // why not being sent 401
}
else{

  // checking if password is correct
  const IsPasswordCorrect = await bcrypt.compare(password, user.password);
  // console.log("kk", IsPasswordCorrect, "ll")
  if (IsPasswordCorrect) {

    const generateToken = (id) => {
      return jwt.sign({ id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
    };

    // generating token
    let userToken = generateToken(user._id);
//  console.log("kk", userToken, "kk")
    // sending HTTP-Only cookie

    res.cookie("userToken", userToken, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // 1 day
      sameSite: "none",
      secure: true,
    });
    const userInfo = {
      _id:user._id,
      name:user.name,
      email:user.email,
      avatar:user.avatar,
      isAvatarSet:user.isAvatarSet
    }
    // console.log(userInfo)
res.status(200).json(userInfo)

  }

 else{
  // console.log("kp")
     return  res.status(401).send("password is not correct")
 }

   
}
}
catch(error)
{
   console.log("err", error,",,")
  // throw new Error("Something went wrong")
  res.status(500).send(error)
}

 })

 // logout user

 // forgot password
 router.post("/api/user/forgotPass", async(req, res)=>{
    const {email} = req.body
    // console.log("em", email,"kk")

  // checking if user is registered
   const user= await userModel.findOne({email})
   if(!user)
   {
     return res.status(400).json("User is not registered")
    // throw new Error("User is not registered")
   }

   // checking if token exists
   const token = await tokenModel.findOne({userId:user._id})
   if(token)
   {
     await token.deleteOne()
   }

   // creating reset token
const resetToken= crypto.randomBytes(32).toString("hex")+user._id
    console.log("resetToken", resetToken)
// hashed reset token
const hashedResetToken= crypto.createHash("sha256").update(resetToken).digest("hex")
 console.log("hashedResetToken", hashedResetToken)

 // save in token model
  await new tokenModel(
    {
      userId: user._id,
      token: hashedResetToken,
      createdAt: Date.now()
    }
  ).save()

  // constructing reset url
  const resetURL= `${process.env.Frontend_URL}/resetPassword/${resetToken}`

  const subject= "Password Reset Request"
  const sent_from=process.env.Email_User
  const send_to= user.email
  const message= `
  <h2>Hello, ${user.name}</h2>
  <p>You have requested for reset password</p>
  <p>   Below reset password link is valid only for 60 minutes </p>
  <br/>
  <a href=${resetURL} backtracking=off>${resetURL}</a>
  <br/>
  <p>regards...</p>
  <p>Inventroy Team</p>
  `
  console.log("resert", resetURL, "end")

  try{
    await sendEmail(subject, message, send_to, sent_from)
     res.status(200).json("Password Reset Email Sent ")  
  }
  catch(error)
  {
    console.log(error)
    res.status(500).json("Email not sent, Please try again")
  }
  


 })



 // reset password
 router.post("/api/user/resetPassword/:resetToken", async(req, res)=>{
  const {password} = req.body
  console.log("em", password,"kk")

   const {resetToken}= req.params            // resetToken  from forgot Password
  console.log("param token", resetToken)
    // hash token then check if it is in tokenModel
    const hashedToken= crypto.createHash("sha256").update(resetToken).digest("hex") 
     // find in tokenModel
     console.log("hashed token", hashedToken )
     const userToken = await tokenModel.findOne(
      {
         token:hashedToken,
        //  createdAt: {$gt: Date.now()}
     })
  // console.log("token", userToken)
       if(!userToken)
       {
        res.status(400).send("Invalid or expired token")
        throw new Error("Invalid or expired token")
       }
  
       
       // Find user and saving new password in Model(user)
        const user = await userModel.findOne({_id:userToken.userId})
        user.password= password
        await user.save()
        res.status(200).json(
          "Password reset successfully, Please login"
        )

})


 //user update
  router.patch("/api/user/update", async(req, res)=>{
    const {userName, oldPassword, newPassword} = req.body

// console.log("us", userName, "old", oldPassword, "new", newPassword, "end")

const userToken = req.cookies.userToken;
  // console.log("reqcookiesr" ,req.cookies.token,"body", req.data, "...")

  // token verify
  const verified = jwt.verify(userToken, process.env.JWT_SECRET_KEY);
  // console.log("verified", verified, "verified id", verified.id, "...");
  // get user id
  
  const user = await userModel.findById(verified.id);
  //  const user =  await dataModel.findById(verified.id.select("-password"))

  //  console.log("user",user,"...")
  if (!user) {
    return res.status(404).send("User not Found");
    throw new Error("User not Found");
  }

try{
  // exceptional case 
if(userName === user.name && oldPassword==='')
{
  // after updating first time, try again and again to update same
 return res.status(204).json("Please reload page")
 // here return is necessary otherwise  Cannot set headers after they are sent to the client
}

if(userName!=='' && oldPassword==='')
{
     user.name= userName
    await user.save()
    res.status(200).json(user.name)
}
 if(userName==='' && oldPassword!=='')
{
    // checking if password is correct
    const IsPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
    //  console.log("kk", IsPasswordCorrect, "ll")
    if (IsPasswordCorrect) {
        user.password = newPassword
        await user.save()
        res.status(201).send("Password changed successfully")
    }
    else{
      res.status(401).send("Old Password is not correct")
    }
    
}
if(userName!=='' && oldPassword!=='')
{
     // checking if password is correct
  const IsPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
  // console.log("kk", IsPasswordCorrect, "ll")
  if (IsPasswordCorrect) {
      user.password = newPassword
      user.name = userName
      await user.save()
      res.status(202).send(user.name)
  }
  else{
    res.status(401).send("Old Password is not correct")
  }
}


}

catch(e)
{
  console.log(e)
  res.status(500).json(e)
}

  })






  // get all users
  router.get("/getAllUsers", async(req, res)=>{
      
    try{
      const userToken = req.cookies.userToken;
    
      // token verify
      const verified = jwt.verify(userToken, process.env.JWT_SECRET_KEY);
      // console.log("verified", verified, "verified id", verified.id, "...");
      // get user id
      
      const user = await userModel.findById({_id:verified.id},{password:0});
      //  const user =  await dataModel.findById(verified.id.select("-password"))
    
      //  console.log("user",user,"...")
      if (!user) {
        return res.status(404).send("User not Found");
        throw new Error("User not Found");
      }

      const allUsers = await userModel.find({ "_id": { $ne: user._id } },{password:0} )
      // console.log(allUsers)
      // console.log({user},"end",{allUsers})
      res.status(200).json({"allUsers":allUsers, "currentUser":user})
    
    }
        catch(e){
          res.status(500).json(e.message)
    console.log(e)
        }
  })



  // setAvatar
  router.patch("/setAvatar", async(req, res)=>{
    const url = req.body.URL
  //   console.log(url)

try{
  const userToken = req.cookies.userToken;

  // token verify
  const verified = jwt.verify(userToken, process.env.JWT_SECRET_KEY);
  // console.log("verified", verified, "verified id", verified.id, "...");
  // get user id
  
  const user = await userModel.findById(verified.id);
  //  const user =  await dataModel.findById(verified.id.select("-password"))

  //  console.log("user",user,"...")
  if (!user) {
    return res.status(404).send("User not Found");
    throw new Error("User not Found");
  }
  // console.log(user)
   user.avatar=url
   user.isAvatarSet=true

  await user.save()
  // console.log("ii", user, "00")
  res.status(201).json(user)

}
    catch(e){
      res.status(500).json(e.message)
console.log(e)
    }
  })

module.exports=router