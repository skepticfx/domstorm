var express = require('express');
var router = express.Router();

/**
 * Allowed Routes - Routes which are allowed publicly and can be accessed without a user session.
 * Make sure all routes are authenticated by default.
 * To allow a route to be accessed un-authenticated - add it to the public white list of allowedRoutes.
 * This default deny policy allows a much tighter control over the App's resources.
 */

var allowedRoutes = {
  '/': ['*'],
  '/search': ['*'],
  '/auth/twitter': ['*'],
  '/auth/twitter/callback': ['*'],
  '/modules/topModules.json': ['GET'],
  '/modules/run': ['GET'],
  '/modules': ['GET'],
  '/helper': ['GET'],
  '/testrunner': ['GET'],
  '/helper/headers': ['GET'],
  '/modules/results/update': ['POST']
};

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
  if(path.length !== 1 && path.endsWith('/')) path = path.slice(0,-1);
  var allowedUrls = Object.keys(allowedRoutes);
  if(allowedUrls.indexOf(path) !== -1 && (allowedRoutes[path].slice(0)[0] === '*' || allowedRoutes[path].indexOf(req.method) !== -1))
    return next();

  console.log('Unauthenticated request to ' + path, req.method);
  res.render('index', {'title': 'Home Page', 'authError': 1});
}