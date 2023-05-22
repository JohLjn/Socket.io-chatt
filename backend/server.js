const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 3000;
const moment = require("moment");

// Mongoose
const mongoose = require("mongoose");
const { Message } = require("./models");
const { User } = require("./models");

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

app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.post("/users", async (req, res) => {
  try {
    const { users } = req.body;

    const createdUsers = [];

    for (const user of users) {
      const newUser = new User({
        username: user.username,
        password: user.password,
      });

      const savedUser = await newUser.save();

      createdUsers.push(savedUser);
    }

    res
      .status(201)
      .json({ message: "Users created successfully", users: createdUsers });
  } catch (error) {
    console.error("Error creating users:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.delete("/users", async (req, res) => {
  try {
    await User.deleteMany();

    return res.status(200).json({ message: "Database deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

app.get("/messages", async (req, res) => {
  try {
    const allMessages = await Message.find();

    const formattedMessages = allMessages.map((message) => {
      const formattedDate = moment(message.date).format("YYYY-MM-DD HH:mm:ss");
      return {
        ...message.toObject(),
        date: formattedDate,
      };
    });

    return res.status(200).json(formattedMessages);
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

// Manuellt mata in en ny användare
app.post("/messages", async (req, res) => {
  try {
    const { user, message, reciever, date } = req.body;

    const newMessage = new Message({
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

// // Endpoint för att radera alla meddelanden
app.delete("/messages", async (req, res) => {
  try {
    await Message.deleteMany();

    return res.status(200).json({ message: "Database deleted successfully" });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
});

io.on("connection", (socket) => {
  console.log(`A client with id ${socket.id} connected to the chat!`);

  socket.on("typing", (user) => {
    socket.join("groupChat"); // Join the group chat room
    socket.to("groupChat").emit("userTyping", { username: user });
  });

  socket.on("notTyping", (user) => {
    socket.join("groupChat"); // Join the group chat room
    socket.to("groupChat").emit("userNotTyping", { username: user });
  });

  socket.on("chatMessage", (msg) => {
    let today = moment();
    let dateTime = today.format("YYYY-MM-DD HH:mm:ss");

    io.emit("newChatMessage", { message: msg, dateTime: dateTime });

    let user = msg.user;
    let message = msg.message;
    let reciever = msg.reciever;

    const newMessage = new Message({
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
