const mongoose = require('mongoose')

const messageSchema = mongoose.Schema({
  message:{
    type:Array
  },
 
},
{
  timestamps:true
})

const messsageModel = mongoose.model("message", messageSchema)

module.exports= messsageModel