var express = require('express');
var router = express.Router();

/**
 * Add specific methods here
 */
router.use('/:handle', function(req, res){
  var username, showLogout = false;
  if (req.params && req.params.handle) {
    username = req.params.handle;
    req.User.getUserByName(username, function(err, user) {
      if(err || user === null) {
        res.render('misc/404', {'info': 'User profile does not exist'});
        res.end();
      } else {
        req.Modules.getModulesByUser(user.handle, function (err, userModules) {
          req.Modules.getFavsByUser(user.handle, function (err, favModules) {
            if(req.user && req.user.handle) {
              showLogout =(user.handle === req.user.handle);
            }
            res.render('profile/index', {
              'title': user.handle,
              'profile': user,
              'userModules': userModules,
              'favModules': favModules,
              'showLogout': showLogout
            });
          });
        });
      }
    });
  } else {
    res.render('misc/404', {'info': 'No profile name specified'});
    res.end();
  }
});


module.exports = router;