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
  app.get('/profile/:handle', function(req, res){
    if(req.params && req.params.handle){
      Users.findOne({'handle': req.params.handle}, function(err, user){
        if(err || user === null){
          res.render('misc/404', {'info': 'This user profile does not exist'});
          res.end();
        } else {
          var username = user.handle;
          var userModules = [];
          var favModules = [];
          Modules.find({}, function(err, modules){
            for(x in modules){
              if(modules[x].owner === username){
                userModules.push(modules[x]);
              } else {
                if(modules[x].favs.indexOf(username) >= 0){
                  favModules.push(modules[x]);
                }
              }
            }
            res.render('profile/index', {'title': username, 'user': user, 'userModules': userModules, 'favModules': favModules});
          });
        }
      });
    } else {
      res.render('misc/404', {'info': 'Cannot find that profile'});
      res.end();
    }
  });
}
