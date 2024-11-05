// server/middleware/checkAuth.js

exports.isLoggedIn = function (req, res, next) {
  if (req.user) {
    next(); // User is authenticated, proceed to the next middleware or route
  } else {
    return res.status(401).send('Access Denied'); // User is not authenticated, send a 401 response
  }
};
