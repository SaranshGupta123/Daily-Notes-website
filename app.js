const express = require("express");
const session = require("express-session");
const passport = require("passport");
const authRoutes = require("./routes/auth"); // Adjust path as necessary
// Additional imports (mongoose, dotenv, etc.) if needed

const app = express();

// Set up session and passport
app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());

// Google Authentication Routes
app.use("/auth", authRoutes);

// Dashboard Route
app.get("/dashboard", (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`<h1>Welcome, ${req.user.displayName}!</h1>`); // Render your dashboard view here
  } else {
    res.redirect("/");
  }
});

// Home Route
app.get("/", (req, res) => {
  res.send("Home Page - <a href='/auth/google'>Login with Google</a>");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
