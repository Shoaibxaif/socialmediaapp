const mongoose = require("mongoose");

// Define the schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  name: String,
  age: Number,
  email: { type: String, required: true },
  password: { type: String, required: true },
  post:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }]

});

// Register the model
const User = mongoose.model("User", UserSchema);

module.exports = User;
