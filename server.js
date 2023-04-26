const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')

dotenv.config()

const app = express()

const userRouter = require('./routes/userRoutes')
const messageRouter = require('./routes/messageRoute')

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended:false}))


app.use(cors({
  origin: ["http://localhost:3000","https://web-chat-app-xyz.vercel.app"],
  credentials:true
}))

const socket = require("socket.io");

const PORT = 5000

mongoose.connect(process.env.MONGO_URI).then(
  //  app.listen(PORT, ()=>(
    //  console.log("server is running on port 5000...")
     console.log("MongoDB connected")
  //  )) 
).catch(error => (
  console.log(error.message)
))

app.use(userRouter)
app.use(messageRouter)

let users=[]

const server = app.listen(PORT, () =>
  console.log(`Server started on ${PORT}`)
);
const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});


io.on("connection", (socket) => {

  socket.on('new-user', (data) => {
      // console.log("new",data, "user");
     
     users.push(data);
    //  users.map(user=>{
    //   console.log("user each",user ,"55")
    //  })
  
    socket.broadcast.emit('newUserResponse', data)
})
  
  socket.on("message", (message) => {
     console.log("msg",message)

     socket.broadcast.emit('chat-message', message)
    })

    socket.on('typing', (data) => 
    socket.broadcast.emit('typingResponse', data));

    socket.on('stopTyping', (data) => 
    socket.broadcast.emit('typingResponseEnd', data));

    socket.on('disconnect', () => {
      // console.log('🔥: A user disconnected');
      console.log("users",users)
      users = users.filter((user) => user.socketID !== socket.id);

      let disconnectedUser
      users.map((user) => {
        console.log("map", user, "00")
     if(user.socketID === socket.id) 
     {
      disconnectedUser=user.userName
       socket.emit('user-disconnected',disconnectedUser )
      console.log("disconnected user", user.userName, disconnectedUser)
    }
    console.log("disconnected user", user.userName, disconnectedUser, "00")
    
      }
      );



     

    });
  })
