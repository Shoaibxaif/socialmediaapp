const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");


const UserModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
dotenv.config();
const app = express();
const port = process.env.PORT || 3000 ;

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());





// Connect to the database
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// routes

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/profile", IsloggedIn, async (req, res) => {
  const user = await UserModel.findOne({ email: req.user.email }).populate(
    "post"
  );
  res.render("profile", { user });
});

app.get("/like/:id", IsloggedIn, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id).populate("user");

    if (!post) {
      return res.status(404).send("Post not found");
    }

    const userIndex = post.likes.indexOf(req.user.userid);

    if (userIndex === -1) {
      post.likes.push(req.user.userid);
    } else {
      post.likes.splice(userIndex, 1);
    }

    await post.save();

    res.json({ likes: post.likes.length, liked: userIndex === -1 });
  } catch (err) {
    console.error("Error liking/unliking post:", err);
    res.status(500).json({ error: "An error occurred while processing your request." });
  }
});

//creating post
app.post("/post", IsloggedIn, async (req, res) => {
  const user = await UserModel.findOne({ email: req.user.email });
  let { content } = req.body;
  let post = await postModel.create({ user: user._id, content: content });

  user.post.push(post._id);
  await user.save();

  // Populate the post field before redirecting

  res.redirect("/profile");
});

//render all posts
app.get("/posts", IsloggedIn, async (req, res) => {
  try {
    const posts = await postModel.find().populate("user").populate("likes");
    res.render("posts", { posts, user: req.user });
  } catch (err) {
    console.error("Error fetching posts:", err);
    res.status(500).send("An error occurred while fetching posts.");
  }
});




app.post("/create", async (req, res) => {
  const { username, name, age, email, password } = req.body;

  let user = await UserModel.findOne({ email });
  if (user) return res.status(400).send("User Already Registered");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      const createdUser = await UserModel.create({
        username,
        name,
        email,
        password: hash,
        age,
      });
      const token = jwt.sign(
        { email: email, userid: createdUser._id },
        process.env.SECRET
      );
      res.cookie("token", token);
      res.redirect('/profile');
    });
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    let user = await UserModel.findOne({ email: email });
    if (!user) return res.status(400).send("Invalid email or password");

    // Load hash from your password DB and compare
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Internal Server Error");
      }

      if (result) {
        // Password is correct, create and send the token
        const token = jwt.sign(
          { email: email, userid: user._id },
          process.env.SECRET
        );
        res.cookie("token", token, { httpOnly: true });

        return res.status(200).redirect("/profile");
      } else {
        return res.status(400).send("Invalid email or password");
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

//edit post

app.get("/edit/:id", IsloggedIn, async (req, res) => {
  const post = await postModel.findById(req.params.id);
  const user = await UserModel.findOne({ email: req.user.email });
  res.render("edit", { post, user });
});

app.post("/edit/:id", IsloggedIn, async (req, res) => {
  try {
    const postId = req.params.id;
    const updatedContent = req.body.content;

    // Update the post content
    await postModel.findByIdAndUpdate(postId, { content: updatedContent });

    // Redirect to profile after successful update
    res.redirect("/profile");
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});



//middleware

function IsloggedIn(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect("/login");

  jwt.verify(token, process.env.SECRET, (err, decodedToken) => {
    const data = decodedToken;
    req.user = data;
    next();
  });
}

app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
});
