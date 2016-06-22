// Routes everything '/admin' related.

var Modules = require('../models/Modules');
var User = require('../models/User');

function ensureAdmin(req, res, next) {

  if (req.isAdminUser()) {
    return next();
  } else {
    res.render('misc/userError', {
      info: 'You must be an Admin to do this action.'
    });
    res.end();
  }
}

exports.index = function(app) {

  app.get('/admin', ensureAdmin, function(req, res) {
    User.getAllUsers(function(err, users) {
      Modules.find({}, function(err, modules) {
        for (x in modules) {
          if (modules[x].owner === undefined)
            modules[x].owner = 'Anonymous';
        }
        res.render('admin/index', {
          'title': 'Admin Dashboard',
          'users': users,
          'modules': modules
        });
      });
    });
  });

}