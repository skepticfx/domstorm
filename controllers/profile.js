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
  app.get('/profile', function(req, res){
    if(req.query && req.query.id){
      Users.findOne({'_id': req.query.id}, function(err, user){
        if(err){
          res.redirect('misc/404', {'info': 'This user profile does not exist'});
        }
        var username = user.handle;
        var userModules = [];
        var favModules = [];
        Modules.find({}, function(err, modules){
          for(x in modules){
            if(modules[x].owner === username){
              userModules.push(modules[x]);
            } else {
              if(modules[x].tags.indexOf(username) >= 0){
                favModules[x].push(modules[x]);
              }
            }
          }

          res.render('profile/index', {'title': username, 'user': user, 'userModules': userModules, 'favModules': favModules});
        });
      });
    } else {
      res.redirect('misc/404', {'info': 'Cannot find that page'});
    }
  });
}
