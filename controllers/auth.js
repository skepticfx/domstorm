var passport = require('passport');

// Routes everything '/helper' related.

exports.index = function(app){

	app.get('/auth', function(req, res){
		res.redirect('/auth/twitter');
	});
}

exports.twitter = function(app){

	app.get('/auth/twitter',
	  passport.authenticate('twitter'),
	  function(req, res){
	    // The request will be redirected to Twitter for authentication, so this
	    // function will not be called.
	  });

	app.get('/auth/twitter/callback',
	  passport.authenticate('twitter', { failureRedirect: '/login' }),
	  function(req, res) {
	    res.redirect('/');
	  });

	app.get('/logout', function(req, res){
	  req.logout();
	  res.redirect('/');
	});

}
