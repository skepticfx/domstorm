/*
 * Controllers. This routes everything under the sun.
 */

var modules = require(process.cwd()+'/controllers/modules.js');
var helper = require(process.cwd()+'/controllers/helper.js');
var auth = require(process.cwd()+'/controllers/auth.js');
var datasets = require(process.cwd()+'/controllers/datasets.js');
var admin = require(process.cwd()+'/controllers/admin.js');
var profile = require(process.cwd()+'/controllers/profile.js');
var search = require(process.cwd()+'/controllers/search.js');

// All Local routing goes here.
exports.set = function(app){
	// Home page
	app.get('/', function(req, res){
    var authError = 0;
    if(typeof req.query.authError != 'undefined' && req.query.authError == 1)
      authError = 1;
		res.render('index', {'title': 'Home Page', 'authError': authError});
	});

app.get('/xss', function(req, res){

  res.render('misc/404', {'title': 'XSS Tester', 'info': req.query.xss});
});
	// Modules
	modules.create(app); // More specific routes comes first.
	modules.index(app);
	modules.run(app);
	modules.results(app);
	modules.edit(app);
	modules.fork(app);
	modules.favorite(app);


	// Request Modules
	helper.index(app);
	helper.headers(app);

  // Auth Modules
  auth.index(app);
  auth.twitter(app);

	// Dataset
	datasets.index(app);

	// Profile
	profile.index(app);

	// Add Admin Features
	admin.index(app);

	// All things Search
	search.index(app);

};
