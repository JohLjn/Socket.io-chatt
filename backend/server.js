const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 3000;

// Mongoose
const mongoose = require("mongoose");
const MessageModel = require("./models");

const start = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/devmongoosesocket3");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
start();
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.static("public"));
app.use(express.json());

// Endpoint för att visa meddelanden från mongoDB
app.get("/messages", async (req, res) => {
  try {
    const allMessages = await MessageModel.find();
    return res.status(200).json(allMessages);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

//Manuellt mata in en ny användare
app.post("/messages", async (req, res) => {
  try {
    const { user, message, reciever, date } = req.body;

    const newMessage = new MessageModel({
      user,
      message,
      reciever,
      date,
    });

    const savedMessage = await newMessage.save();

    return res.status(201).json(savedMessage);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

// Endpoint för att radera alla meddelanden
app.delete("/messages", async (req, res) => {
  try {
    await MessageModel.deleteMany();

    return res.status(200).json({ message: "Database deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

io.on("connection", (socket) => {
  console.log(`A client with id ${socket.id} connected to the chat!`);

  socket.on("chatMessage", (msg) => {
    let today = new Date();
    let date =
      today.getFullYear() +
      "-" +
      (today.getMonth() + 1) +
      "-" +
      today.getDate();
    let time =
      today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let dateTime = date + " " + time;

    // io.emit("chatUser", msg.user + " " + dateTime);
    io.emit("newChatMessage", { message: msg, dateTime: dateTime });

    let user = msg.user;
    let message = msg.message;
    let reciever = msg.reciever;

    // Sparar till MongoDB med Mongoose
    const newMessage = new MessageModel({
      message: message,
      user: user,
      reciever: reciever,
      date: dateTime,
    });
    newMessage.save();
  });

  socket.on("disconnect", () => {
    console.log(`Client ${socket.id} disconnected!`);
  });
});

server.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
