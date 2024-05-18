const mongoose = require("mongoose");

// Define the schema
const PostSchema = new mongoose.Schema({
  user: [
    {
      post: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post",
        },
      ],
    },
  ],

  date: {
    type: Date,
    default: new Date(),
  },
  content: String,
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
    },
  ],
});

// Register the model
const Post = mongoose.model("Post", PostSchema);

module.exports = Post;
