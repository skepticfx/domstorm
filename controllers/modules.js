// Routes for anything '/modules' related

var fs = require('fs');
var Modules = require(process.cwd()+'/models/Modules.js').Modules;

// test authentication
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {req.currentUser = req.user.handle; return next(); }
	req.currentUser = 'Anonymous';
	res.redirect('/?authError=1');
	//return next();
}


// Loads the module home and individual modules
exports.index = function(app){

	app.get('/modules', function(req, res){
		if(typeof req.query.id != 'undefined'){
			var module_id = req.query.id;
			var module = Modules.getModuleById(module_id, function(err, module){
				if(err){
					res.render('misc/error', {'info': 'Apparently, the module is missing in our system.'});
					res.end();
				} else {
					var module_details = {
					'module_id': module._id,
					'module_name': module.name,
					'module_description': module.description,
					'module_results': module.results,
					'module_test': module.test,
					'browsers': getBrowserResults(module),
					'module_owner': module.owner || 'Anonymous',
					'module': module.toObject()
					};
					res.render('modules/getModule', module_details);
					res.end();
				}
			});
		} else {
			Modules.find({}, function(err, modules){
				if(err){
					console.log('There is some error populating the Modules List');
				} else {
					res.render('modules/index', {'title': 'Modules', 'modules': modules});
					res.end();
				}
			});
		}
	});
}

// Loads and runs the module test page from /models/core/modules_test/
// Anyone can RUN a module to test it. No Auth required.
exports.run = function(app){

	app.get('/modules/run', function(req, res){
		if(typeof req.query.id != 'undefined'){
			var module_id = req.query.id;
			var module = Modules.getModuleById(module_id, function(err, module){
				if(err){
					res.render('misc/error', {'info': 'Oops ! The test module is missing.'});
					res.end();
				} else{
					var module_details = {
					'module_id': module._id,
					'module_name': module.name,
					'module_description': module.description,
					'module_results': module.results,
					'module_test': module.test
					};

					switch(module_details.module_test._type){
					case "ENUM_FUNCTION":
					res.render('modules/runModule_enum_function', module_details);
					res.end();
					break;

					default:
					res.render('misc/error', {'info': 'The Test Type is not defined yet'});
					res.end();
					}
				}
			});
		} else {
			res.status(404);
			res.render('misc/404', {'info': 'Missing module id.' });
			res.end();
		}
	});

}

// Creates a new module
exports.create = function(app){

	// The UI
	app.get('/modules/create', ensureAuthenticated, function(req, res){
		res.render('modules/createModule', {'title':'Create a new Module'});
		res.end();
	});

	// Form
	app.post('/modules/create', ensureAuthenticated, function(req, res){

		var results = {};
		results.type = req.body._results_type;
		var columns = [];
		if(results.type == 'SIMPLE_TABLE'){
			var num_cols = req.body._num_cols;
			for(var i=1;i <= num_cols; i++){
				columns.push(req.body['_cols_'+i]);
			}
		}
		results.columns = columns;

		var tags = req.body._tags;
		tags = tags.replace(/ /g,'');
		tags = tags.split(',');

		var test = {};
		test.state = 'NOT_STARTED'; // ERROR, COMPLETE
		test.type = req.body._module_type;
		test.userScript = req.body._userScript;
		test.enum_data = req.body._enum_data;

		var newModule = {};
		newModule.results = results;
		newModule.test = test;
		newModule.name = req.body._name;
		newModule.description = req.body._desc;
		newModule.tags = tags;
		newModule.owner = req.user.handle || 'Anonymous';

		Modules.add(newModule, function(err, module){
			if(err){
				res.render('misc/error', {'info': 'Something wrong happened, when we tried creating your new module.'});
				res.end();
			} else {
				var Obj = {}
				Obj.name = module.name;
				Obj.id = module._id;
				res.redirect('/update?module='+module._id);
			}
		});
	});

}

// Edits a module including delete, edit, fork etc.
exports.edit = function(app){

	// Deletes a module
	app.post('/modules/delete', ensureAuthenticated, function(req, res){
		if(typeof req.body._id != 'undefined'){
			Modules.findOne({_id: req.body._id}, function(err, module){
				if(err){
					res.render('misc/error', {'info': 'Apparently, the module is missing in our system.'});
					res.end();
				} else {
					if(module.owner == req.currentUser){
						module.remove();
						res.redirect('/');
					} else {
						res.render('misc/userError', {'info': 'You must be the owner of this module to delete it.'});
						res.end();
					}
				}
			});
		} else {
			res.render('misc/error', {'info': 'Apparently, the module is missing in our system.'});
			res.end();
		}
	});

	// The UI
	app.get('/modules/edit', ensureAuthenticated, function(req, res){
		if(typeof req.query.id != 'undefined'){
			var module_id = req.query.id;
			var module = Modules.getModuleById(module_id, function(err, module){
				if(err){
					res.render('misc/error', {'info': 'Apparently, the module is missing in our system.'});
					res.end();
				} else {
					if(module.owner != req.currentUser){
						res.render('misc/userError', {'info': 'You must be the owner of this module to edit it. You can fork this module though !'});
						res.end();
					} else {
						var module_tags_parsed = "";
						module = module.toObject();
						for(var x in module.tags)
							module_tags_parsed += module.tags[x] + ",";
						if(module_tags_parsed !== "")
							module_tags_parsed = module_tags_parsed.slice(0, -1);
						res.render('modules/editModule', {'title': 'Edit this module', 'module': module, 'columns': JSON.stringify(module.results.columns), 'module_tags_parsed': module_tags_parsed});
						res.end();
					}
				}
			});
		} else {
			res.render('misc/error', {'info': 'Apparently, the module is missing in our system.'});
			res.end();
		}
	});

	// Form
	// Get the already existing document and update as required. Can also be used for changes.
	app.post('/modules/edit', ensureAuthenticated, function(req, res){
		Modules.find({'_id': req.body._id}, function(err, modules){
			modules = modules.pop();
			if(modules.owner != req.currentUser){
				res.render('misc/userError', {'info': 'You must be the owner of this module to edit it. You can fork this module though !'+ modules.owner + req.currentUser});
				res.end();
			} else {
				modules.results._type = req.body._results_type;
				modules.results.columns = [];
				if(modules.results._type == 'SIMPLE_TABLE'){
					var num_cols = req.body._num_cols;
					for(var i=1;i <= num_cols; i++){
						modules.results.columns.push(req.body['_cols_'+i]);
					}
				}

				var module_id = modules._id;
				var newModule = modules.toObject();
				newModule.name = req.body._name;
				newModule.description = req.body._desc;
				newModule.test._type = req.body._module_type;
				newModule.test.userScript = req.body._userScript;
				newModule.test.enum_data = req.body._enum_data;
				newModule.results.columns = modules.results.columns;

				var tags = req.body._tags;
				tags = tags.replace(/ /g,'');
				tags = tags.split(',');
				newModule.tags = tags;

				newModule.owner = req.currentUser;

				delete newModule._id;
				Modules.findOneAndUpdate({'_id': modules._id}, newModule, {'upsert': true}, function(err, module){
					if(err){
						res.render('misc/error', {'info': err+'Something wrong happened, when we tried editing your module.'});
						res.end();
					} else {
						res.redirect('/modules/?id='+ module._id);
					}
				});
			}
		});
	});
}


exports.results = function(app){

	// Can be Ajax
	app.post('/modules/results/update', function(req, res){
		var module_id = req.body._module_id;
		var results = {};
		results.raw = req.body._results_raw;
		var browser = {};
		browser.rows = JSON.parse(req.body._rows);
		browser.version = "";
		var test = {};
		test.state = 'COMPLETED'; //  COMPLETE
		var updateObj = {};
		updateObj['test.state'] = test.state;
		updateObj['results.browsers.'+req.body._browser] = browser;

		Modules.findOneAndUpdate({'_id': module_id}, updateObj,  function(err, result){
			if(err){
				res.render('misc/error', {'info': 'Something wrong happened, when we tried creating your new module.'});
				res.end();
			} else {
				res.redirect('/modules/?id='+ result._id);
			}
		});
	});

	// Hackish to Update the stuff.
	app.get('/update', ensureAuthenticated, function(req, res){
		Modules.find({}, function(err, modules){
			if(err){
				console.log('There is some error populating the Modules List');
			} else {
				var modulesList = [];
				for(x in modules){
					var obj = {};
					obj.name = encode(modules[x].name);
					obj.id = modules[x]._id;
					modulesList.push(obj);
				}
				fs.writeFile(process.cwd()+'/dynamic/js/modulesList.js', 'var topModules = '+ JSON.stringify(modulesList) + ' ;', function(err){
					if(err){
						console.log('There is some error in writing the list to modulesList.js');
					} else {
						console.log('Great ! Populated the list of modules.');
						if(typeof req.query.module != 'undefined'){
							res.redirect('/modules/?id='+req.query.module);
						} else {
							res.redirect('/');
						}
					}
				});
			}
		});
	});
}


// Supporting Functions, Don't know where the hell to put this in the MVC stuff :( Any suggestions?
var getBrowserResults = function(module){
	var browser_results = {};

	var browser_list = ['GOOGLE_CHROME', 'MOZILLA_FIREFOX', 'OPERA', 'SAFARI', 'INTERNET_EXPLORER', 'OTHERS'];
	for(var x in browser_list){
		var browser_temp = module.results.browsers[browser_list[x]];
		if(browser_temp.rows.length == 0){
			browser_results[browser_list[x]] = "<h4> This module was never tested on this browser. Why don't you contribute? </h4>";
			continue;
		}
		var table_html = '<div class="bs-example table-responsive"><table class="table table-striped table-bordered table-hover"> <thead><tr class="TITLE">';
		// Iterate the columns
		for(var i=0; i<module.results.columns.length; i++){
			table_html += '<th>'+ module.results.columns[i] +'</th>'
		}
		table_html += '</tr></thead><tbody>';
		// Iterate the Rows, PS: Its a 2D array
		for(i=0; i<browser_temp.rows.length; i++){
			table_html += '<tr class="'+browser_temp.rows[i].type+'">';
			for(j=0; j<browser_temp.rows[i].data.length; j++){
				table_html += '<td>'+ browser_temp.rows[i].data[j] +'</td>';
			}
			table_html += '</tr>';
		}
		table_html += '</tbody></table></div>';
		browser_results[browser_list[x]] = table_html;
	}
return browser_results;
}



// Forks a new module
exports.fork = function(app){

	// The UI
	app.get('/modules/fork', ensureAuthenticated, function(req, res){
		if(typeof req.query.id != 'undefined'){
			var module_id = req.query.id;
			var module = Modules.getModuleById(module_id, function(err, module){
				if(err){
					res.render('misc/error', {'info': 'Apparently, the module is missing in our system.'});
					res.end();
				} else {
					var module_tags_parsed = "";
					module = module.toObject();
					for(var x in module.tags)
						module_tags_parsed += module.tags[x] + ",";
					if(module_tags_parsed !== "")
						module_tags_parsed = module_tags_parsed.slice(0, -1);
					res.render('modules/forkModule', {'title': 'Fork this module', 'module': module, 'columns': JSON.stringify(module.results.columns), 'module_tags_parsed': module_tags_parsed});
					res.end();
				}
			});
		} else {
			res.render('misc/error', {'info': 'Apparently, the module is missing in our system.'});
			res.end();
		}
	});
}


function encode(str){
	str = str.replace(/</gi, '&lt;');
	str = str.replace(/>/gi, '&gt;');
	str = str.replace(/"/gi, '&quot;');
return str;
}
