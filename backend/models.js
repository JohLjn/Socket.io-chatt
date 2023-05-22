const mongoose = require("mongoose");

//User schema
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User", UserSchema);

//Message schema
const MessageSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  reciever: {
    type: String,
    default: true,
  },
  date: {
    type: Date,
    required: true,
  },
});

const Message = mongoose.model("message", MessageSchema);

//Export modules
module.exports = { User, Message };
