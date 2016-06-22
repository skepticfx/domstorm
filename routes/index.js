var express = require('express');
var router = express.Router();

/**
 * Helper functions
 * */
function ensureAuthenticated(req, res, next){
  var path = req.path, allowedUrls, allowedUrlsWithWildCard, i, url, cleanUrl;
  if(req.isAuthenticated())
    return next();
  if(path.length !== 1 && path.endsWith('/')) path = path.slice(0,-1);
  allowedUrls = Object.keys(allowedRoutes);

  // Process wildcard routes.
  // Routes with '*' in them.

  allowedUrlsWithWildCard = allowedUrls.filter(function(url){ return url.includes('*'); });

  for(i=0; i< allowedUrlsWithWildCard.length; i++){
    // remove the /* and * occurances
    url = allowedUrlsWithWildCard[i];
    cleanUrl = url.replace(/\/\*/g, '').replace(/\*/g, '');
    if(path.startsWith(cleanUrl) && allowedRoutes[url].slice(0)[0] === '*' || allowedRoutes[url].indexOf(req.method) !== -1)
      return next();
  }
  if(allowedUrls.indexOf(path) !== -1 && (allowedRoutes[path].slice(0)[0] === '*' || allowedRoutes[path].indexOf(req.method) !== -1))
    return next();

  console.log('Unauthenticated request to ' + path, req.method);
  res.render('index', {'title': 'Home Page', 'authError': 1});
}


/**
 * Allowed Routes - Routes which are allowed publicly and can be accessed without a user session.
 * Make sure all routes are authenticated by default.
 * To allow a route to be accessed un-authenticated - add it to the public white list of allowedRoutes.
 * This default deny policy allows a much tighter control over the App's resources.
 */

var allowedRoutes = {
  '/': ['*'],
  '/modules/topModules.json': ['GET'],
  '/profile/*': ['*'],
  '/public/*': ['*'],
  '/modules': ['GET'],
  '/modules/results/update': ['POST'],
  '/auth/twitter': ['*'],
  '/auth/twitter/callback': ['*'],
  '/modules/run': ['GET'],
  '/helper': ['GET'],
  '/testrunner': ['GET'],
  '/search': ['*'],
  '/helper/headers': ['GET']

};

/**
 * Make sure all the routes starting from '/' passes through the authentication check.
 */
router.use('/', ensureAuthenticated);

/**
 * Add routes along with their paths here
 */

router.use('/modules', require('./modules'));
router.use('/profile', require('./profile'));






module.exports = router;

