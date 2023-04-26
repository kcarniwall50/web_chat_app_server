const mongoose = require('mongoose')
const bcrypt = require("bcrypt")
const userSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  email:{
    type:String,
    required:[true, "Please enter Email Id"],
    unique:true,
    index: true,
    background:true,
    trim:true, // remove space
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/, 'is invalid'
    
    ]
  },
  password:{
    type:String,
    required:true
  },

  avatar:{
    type:String,
    default:''
  
  },
  isAvatarSet:{
    type:Boolean,
    default:false
  
  },

},
{
  timestamps:true
},
{ strict: true,
  strictQuery: false }
)

//  Encrpting password before saving in Database
userSchema.pre("save", async function(next){         // why not arrow function working
  if (!this.isModified("password")) {
    return next();
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
  next();
})

const userModel = mongoose.model("user", userSchema)
module.exports= userModel