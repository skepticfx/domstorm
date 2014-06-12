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

  app.get('/admin', function(req, res){
    Users.find({}, function(err, users){
      Modules.find({}, function(err, modules){
        for(x in modules){
          if(modules[x].owner === undefined)
            modules[x].owner = 'Anonymous';
        }
        res.render('admin/index', {'title': 'Admin Dashboard', 'users': users, 'modules': modules});
      });
    });
  });

}
