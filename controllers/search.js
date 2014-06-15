// Routes everything '/admin' related.

var Modules = require(process.cwd()+'/models/Modules.js').Modules;
var Users = require(process.cwd()+'/models/Modules.js').User;
var admin = require('../config.js').config.admin;

function ensureAdmin(req, res, next) {

  if (req.isAuthenticated() && req.user.handle === admin) {
    return next();
  } else {
    res.render('misc/userError', {info: 'You must be an Admin to do this action.'});
    res.end();
  }
}

// Auth Middleware and sets the logged in user to req.currentUser;
function ensureAuthenticated(req, res, next) {

  if (req.isAuthenticated()) {
    req.currentUser = req.user.handle;
    return next();
  }
  req.currentUser = 'Anonymous';
  res.redirect('/?authError=1');
}

exports.index = function(app){

  app.get('/search', function(req, res){
    if(req.query.q === undefined || req.query.q === ''){
      res.render('search/index', {'q': '', 'modules': []});
      res.end();
    } else {
      var q = req.query.q;
      Modules.searchAll(q, function(err, modules){
        if(err){
          res.render('misc/error', {'info': 'Something went wrong during the search.'});
          res.end();
        } else {
          res.render('search/index', {'q': q, 'modules': modules});
          res.end();
        }
      });
    }
  });
}
