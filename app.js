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
const port = 5000 || process.env.PORT;

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
  //cookie: { maxAge: new Date ( Date.now() + (3600000) ) } 
  // Date.now() - 30 * 24 * 60 * 60 * 1000
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Set to true in production for HTTPS
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride("_method"));
// Conntect to Database
connectDB();  

// Static Files
app.use(express.static('public'));

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
  //res.status(404).send('404 Page Not Found.')
  res.status(404).render('404');
})


app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

app.use(express.static('public'));
app.get('/', (req, res) => {
  res.render('app.js'); 
});


app.get('/google/callback', async (req, res) => {
  const authorizationCode = req.query.code;

  if (!authorizationCode) {
    // Redirect to login if no code is provided
    return res.redirect('/login');
  }

  try {
    // Exchange the authorization code for an access token
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code: authorizationCode,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: 'http://localhost:5000/google/callback',  // or your Render URL in production
      grant_type: 'authorization_code',
    });

    const accessToken = tokenResponse.data.access_token;

    // Use the access token to get user information from Google
    const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Store user data in session or database, as needed
    req.session.user = userInfoResponse.data;

    // Redirect to the dashboard after successful login
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error during OAuth callback processing:', error);
    // Redirect to login on error
    res.redirect('/login');
  }
});
