const mongoose = require("mongoose");

// Define the schema
const PostSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  date: {
    type: Date,
    default: new Date(),
  },
  content: String,
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

// Register the model
const Post = mongoose.model("Post", PostSchema);

module.exports = Post;
