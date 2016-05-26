var express = require('express');
var router = express.Router();

var allowedRoutes = {
  '/': ['*'],
  '/search': ['*'],
  '/auth/twitter': ['*'],
  '/auth/twitter/callback': ['*'],
  '/modules/topModules.json': ['*']
};

/**
 * Make sure all routes are authenticated by default.
 * To allow a route to be accessed un-authenticated - add it to the public white list.
 * This default deny policy allows a much tighter control over the App's resources.
 */

router.use('/', ensureAuthenticated);

/**
 * Add routes along with their paths here
 */

router.use('/modules', require('./modules'));


module.exports = router;

function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated())
    return next();
  var path = req.path;
  var allowedUrls = Object.keys(allowedRoutes);
  if(allowedUrls.indexOf(path) !== -1 && (allowedRoutes[path].slice(0)[0] === '*' || allowedRoutes[path].indexOf(req.method) !== -1))
    return next();

  console.log('Unauthenticated request to ' + path, req.method);
  res.render('index', {'title': 'Home Page', 'authError': 1});
}