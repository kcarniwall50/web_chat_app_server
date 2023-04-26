const express = require('express');
const messsageModel = require('../models/messageModel');
const router = express.Router()
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const userModel = require('../models/userModel');

router.post("/saveMessage",  async(req, res)=>{
   const {chatUserAvatar, msg} = req.body
  //  console.log({chatUserAvatar},msg)

   try{
    const userToken = req.cookies.userToken;
  
    // token verify
    const verified = jwt.verify(userToken, process.env.JWT_SECRET_KEY);
    // console.log("verified", verified, "verified id", verified.id, "...");
    // get user id
    
    const user = await userModel.findById({_id:verified.id},{password:0});
  
    //  console.log("user",user,"...")
    if (!user) {
      return res.status(404).send("User not Found");
      throw new Error("User not Found");
    }

const chatData = {
  message:msg,
  users:{
    senderId:user._id,
    sender:user.name,
    receiver:chatUserAvatar._id
  }
}

const chatInfo = await messsageModel.findById('643bbadeef8a81a044f37256')
//  console.log(chatInfo)
chatInfo.message.push(chatData)
await chatInfo.save()
res.status(200).json()

}
catch(e){
  res.status(500).json(e.message)
console.log(e)
}
}
)

// get all chats

router.get("/getAllChats", async(req, res)=>{


  try{
    const userToken = req.cookies.userToken;
  
    // token verify
    const verified = jwt.verify(userToken, process.env.JWT_SECRET_KEY);
    // console.log("verified", verified, "verified id", verified.id, "...");
    // get user id
    
    const user = await userModel.findById({_id:verified.id},{password:0});
  
    //  console.log("user",user,"...")
    if (!user) {
      return res.status(404).send("User not Found");
      throw new Error("User not Found");
    }


const chatInfo = await messsageModel.findById('643bbadeef8a81a044f37256')
//  console.log(chatInfo)

res.status(200).json(chatInfo)

}
catch(e){
  console.log(e)
  res.status(500).json(e.message)
}

})

module.exports= router