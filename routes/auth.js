const express = require("express");
const passport = require("passport");
const router = express.Router();

// Google Authentication Route
router.get("/google", passport.authenticate("google", {
  scope: ["profile", "email"],
}));

// Google Callback Route
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login-failure" }),
  (req, res) => {
    // Successful authentication
    console.log("Callback received with user data:", req.user);
    
    // Redirect to the dashboard after successful login
    res.redirect("/dashboard");
  }
);

// Login failure route
router.get("/login-failure", (req, res) => {
  res.send("Login failed. Please try again.");
});

module.exports = router;
