const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv").config();
const bodyParser = require("body-parser");

const app = express();

const userRouter = require("./routes/userRoutes");
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  cors({
    origin: ["http://localhost:3000", "https://web-chat-app-kp.vercel.app/"],
    credentials: true,
  })
);

const socket = require("socket.io");

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(console.log("MongoDB connected"))
  .catch((error) => console.log(error.message));

// console.log
if (process.env.NODE_ENV === "development") {
  console.log = function () {};
}

app.use(userRouter);

let users = [];

const server = app.listen(PORT, () => console.log(`Server started on ${PORT}`));
const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("new-user", (data) => {
    users.push(data);
    socket.broadcast.emit("newUserResponse", data);
  });

  socket.on("message", (message) => {
    socket.broadcast.emit("chat-message", message);
  });

  socket.on("typing", (data) => socket.broadcast.emit("typingResponse", data));

  socket.on("stopTyping", (data) =>
    socket.broadcast.emit("typingResponseEnd", data)
  );

  socket.on("disconnect", () => {
    let dropedUser;
    users.map((user) => {
      if (user.socketID === socket.id) {
        dropedUser = user.userName;
        socket.broadcast.emit("user-disconnected", dropedUser);
        console.log("disconnected user", user.userName, dropedUser);
      }
      users = users.filter((user) => user.socketID !== socket.id);
    });
  });
});
