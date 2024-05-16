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
const port = 3000;

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Connect to the database
mongoose
  .connect("mongodb://127.0.0.1:27017/miniproject", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

  // routes

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/profile", IsloggedIn ,(req,res)=>{
  res.send("welcome back in your profile")
} )

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
      res.send("successful Registered");
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

        return res.status(200).send("You can login");
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

//middleware 

function IsloggedIn (req,res,next){
  const token = req.cookies.token;
  if(!token) return res.send("you need to logged in");

  jwt.verify(token, process.env.SECRET, (err, decodedToken) => {
    const data = decodedToken;
    req.user = data;
    next();
  });
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
