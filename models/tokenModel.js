
const mongoose = require('mongoose')

const tokenSchema = mongoose.Schema({
  userId:{
    type: mongoose.Schema.Types.ObjectId
  },

  token:{
    type:String,
    required: [true]
  }
},
{
   timestamps:true
}
)

const tokenModel = mongoose.model("token", tokenSchema)
module.exports = tokenModel