require('dotenv').config();

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const methodOverride = require("method-override");
const connectDB = require('./server/config/db');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Session middleware
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Set to true in production for HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static('public')); // Serve static files before routes

// Templating Engine
app.use(expressLayouts);
app.set('layout', './layouts/main');
app.set('view engine', 'ejs');

// Routes
app.use('/', require('./server/routes/auth'));
app.use('/', require('./server/routes/index'));
app.use('/', require('./server/routes/dashboard'));

// Handle 404
app.get('*', function(req, res) {
  res.status(404).render('404');
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

// Google OAuth callback
app.get('/google/callback', async (req, res) => {
  const authorizationCode = req.query.code;

  if (!authorizationCode) {
    return res.redirect('/login');
  }

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code: authorizationCode,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: 'http://localhost:5000/google/callback', 
      grant_type: 'authorization_code',
    });

    const accessToken = tokenResponse.data.access_token;

    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    req.session.user = userInfoResponse.data;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth callback processing error:', error);
    res.redirect('/login');  
  }
});
