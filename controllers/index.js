/*
 * Controllers. This routes everything under the sun.
 */

var modules = require(process.cwd()+'/controllers/modules.js');
var helper = require(process.cwd()+'/controllers/helper.js');
var auth = require(process.cwd()+'/controllers/auth.js');

// All Local routing goes here.
exports.set = function(app){
	// Home page
	app.get('/', function(req, res){
    var authError = 0;
    if(typeof req.query.authError != 'undefined' && req.query.authError == 1)
      authError = 1;
		res.render('index', {'title': 'Home Page', 'authError': authError});
	});

	// Modules
	modules.create(app); // More specific routes comes first.
	modules.index(app);
	modules.run(app);
	modules.results(app);
	modules.edit(app);
	modules.fork(app);


	// Request Modules
	helper.index(app);
	helper.headers(app);

  // Auth Modules
  auth.index(app);
  auth.twitter(app);

};
