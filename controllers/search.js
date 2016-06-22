// Routes everything '/admin' related.

var Modules = require('../models/Modules.js');


exports.index = function(app) {

  app.get('/search', function(req, res) {
    if (req.query.q === undefined || req.query.q === '') {
      res.render('search/index', {
        'q': '',
        'modules': [],
        'empty': true
      });
      res.end();
    } else {
      var q = req.query.q;
      Modules.searchAll(q, function(err, modules) {
        if (err) {
          res.render('misc/error', {
            'info': 'Something went wrong during the search.'
          });
          res.end();
        } else {
          res.render('search/index', {
            'q': q,
            'modules': modules,
            'empty': false
          });
          res.end();
        }
      });
    }
  });
}