var express = require('express');
var router = express.Router();

/**
 * Add specific methods here
 */
router.use('/:handle', function(req, res){
  var username;
  if (req.params && req.params.handle) {
    username = req.params.handle;
    req.User.getUserByName(username, function(err, user) {
      if(err || user === null) {
        res.render('misc/404', {'info': 'User profile does not exist'});
        res.end();
      } else {
        req.Modules.getModulesByUser(user.handle, function (err, userModules) {
          req.Modules.getFavsByUser(user.handle, function (err, favModules) {
            res.render('profile/index', {
              'title': user.handle,
              'profile': user,
              'userModules': userModules,
              'favModules': favModules,
              'showLogout': username === req.user.handle
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