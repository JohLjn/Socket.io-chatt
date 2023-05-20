const mongoose = require("mongoose");

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

module.exports = mongoose.model("message", MessageSchema);
