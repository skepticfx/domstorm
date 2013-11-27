// Routes everything '/helper' related.

exports.index = function(app){

	app.get('/helper', function(req, res){
		res.render('helper/index', {'title': 'Request Modules'});
	});	
}

exports.headers = function(app){
	// Headers - Returns a JSON array of Request Headers
	app.get('/helper/headers', function(req, res){
		var headers = JSON.stringify(req.headers);
		res.end(headers);
	});
}	