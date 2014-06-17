// Routes for anything '/modules' related

var fs = require('fs');
var Modules = require(process.cwd()+'/models/Modules.js').Modules;
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

function populateUser(req, res, next){
	if(req.isAuthenticated()){
		req.currentUser = req.user.handle;
	} else {
		req.currentUser = 'Anonymous';
	}
return next();
}

// Loads the module home and individual modules
exports.index = function(app){

	app.get('/modules', populateUser, function(req, res){
		if(typeof req.query.id != 'undefined'){
			var module_id = req.query.id;
			var module = Modules.getModuleById(module_id, function(err, module){
				if(err){
					res.render('misc/error', {'info': 'Apparently, the module is missing in our system.'});
					res.end();
				} else {

					var userOptions = {};
					userOptions.blinkFav = false;
					if(req.query && req.query.info && req.query.info === 'fav_success')
						userOptions.blinkFav = true;

					userOptions.owner = false;
					if(module.owner == req.currentUser || req.currentUser == admin)
						userOptions.owner = true;

					if(req.currentUser !== 'Anonymous'){
						userOptions.status = 'enabled';
						userOptions.showFav = true;
						if(module.favs)
							if(module.favs.indexOf(req.currentUser) >= 0)
								userOptions.showFav = false;

					} else {
						userOptions.status ='disabled';
					}

					var module_details = {
					'module_id': module._id,
					'module_name': module.name,
					'module_description': module.description,
					'module_results': module.results,
					'module_test': module.test,
					'browsers': getBrowserResults(module),
					'module_owner': module.owner || 'Anonymous',
					'userOptions': userOptions,
					'module_favs': (module.favs && module.favs.length) || 0,
					'module': module.toObject(),
					'ds_title': module.name
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
						case "TESTHARNESS":
							if(req.query.iframe && req.query.iframe === '1')
								res.render('modules/runModule_testharness_iframe', module_details);
							else
								res.render('modules/runModule_testharness', module_details);
							res.end();
						break;

						case "ENUM_FUNCTION":
							if(req.query.iframe && req.query.iframe === '1')
								res.render('modules/runModule_enum_function_iframe', module_details);
							else
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
		var type = req.body._module_type;
		var results = {};
// Fuzzer remaining
		if(type === 'ENUM_FUNCTION'){
			results._type = req.body._results_type;
			var columns = [];
			if(results._type == 'SIMPLE_TABLE'){
				var num_cols = req.body._num_cols;
				for(var i=1;i <= num_cols; i++){
					columns.push(req.body['_cols_'+i]);
				}
			}
			results.columns = columns;
		}

		if(type === 'TESTHARNESS'){
			results._type = 'testharness';
			results.columns = ['Result', 'Test Name', 'Message'];
		}

		var tags = req.body._tags;
		tags = tags.replace(/ /g,'');
		tags = tags.split(',');

		var test = {};
		test.state = 'NOT_STARTED'; // ERROR, COMPLETE
		test._type = req.body._module_type;
		test.userScript = req.body._userScript;

		if(type === 'ENUM_FUNCTION')
			test.enum_data = req.body._enum_data;

		var newModule = {};
		newModule.results = results;
		newModule.test = test;
		newModule.name = req.body._name;
		newModule.description = req.body._desc;
		newModule.tags = tags;
		newModule.owner = req.user.handle || 'Anonymous';
		newModule.favs = [];

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
					if(module.owner == req.currentUser || req.currentUser == admin){
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
					if(module.owner != req.currentUser  && req.currentUser != admin){
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
			if(modules.owner != req.currentUser && req.currentUser != admin){
				res.render('misc/userError', {'info': 'You must be the owner of this module to edit it. You can fork this module though !'+ modules.owner + req.currentUser});
				res.end();
			} else {

				var type = req.body._module_type;
				if(type === 'ENUM_FUNCTION'){
					modules.results._type = req.body._results_type;
					modules.results.columns = [];
					if(modules.results._type == 'SIMPLE_TABLE'){
						var num_cols = req.body._num_cols;
						for(var i=1;i <= num_cols; i++){
							modules.results.columns.push(req.body['_cols_'+i]);
						}
					}
				}

				if(type === 'TESTHARNESS'){
					modules.results._type = 'testharness';
					modules.results.columns = ['Result', 'Test Name', 'Message'];
				}

				var module_id = modules._id;
				var newModule = modules.toObject();
				newModule.name = req.body._name;
				newModule.description = req.body._desc;
				newModule.test._type = req.body._module_type;
				newModule.test.userScript = req.body._userScript;
				if(type === 'ENUM_FUNCTION'){
					newModule.test.enum_data = req.body._enum_data;
					newModule.results.columns = modules.results.columns;
				}

				var tags = req.body._tags;
				tags = tags.replace(/ /g,'');
				tags = tags.split(',');
				newModule.tags = tags;

				// The old owner should be the owner always !
				// DO NOT CHANGE modules.owner

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
		var browser = {};
		browser.name = req.body._browser;
		browser.rows = JSON.parse(req.body._rows);
		browser.version = req.body._version;
		browser.os = req.body._os;
		var test = {};
		test.state = 'COMPLETED'; //  COMPLETE
		var updateObj = {};
		updateObj['test.state'] = test.state;
		updateObj['results.browsers.'+req.body._browser] = browser;

		Modules.findOneAndUpdate({'_id': module_id}, updateObj,  function(err, result){
			if(err){
				res.render('misc/error', {'info': 'Something wrong happened, when we tried updating the results'});
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


var getBrowserResults = function(module){

	var browser_results = {};
	var browsers = module.results.browsers;
	for(var x in browsers){
		var browser_temp = browsers[x];
		if(browser_temp.rows && browser_temp.rows.length > 0){
			if(browser_temp.name === undefined || browser_temp.name === '')	browser_temp.name = 'Unknown Browser';
			if(browser_temp.version === undefined || browser_temp.version === '')	browser_temp.version = 'Unknown Version';
			if(browser_temp.os === undefined || browser_temp.os === '')	browser_temp.os = 'Unknown OS';
			var table_html = '<br/><div class="table-responsive"><div class="label label-danger">Tested on</div><div class="label label-info">'+browser_temp.name +' - '+ browser_temp.version+' - '+ browser_temp.os+'</div><table class="table table-striped table-bordered table-hover"> <thead><tr class="TITLE">';
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
			browser_results[browser_temp.name] = table_html;
		}
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

// Favorites a given module by a logged in User.
exports.favorite = function(app){

	// The UI
	app.post('/modules/favorite', ensureAuthenticated, function(req, res){
		if(typeof req.body.id != 'undefined'){
			var module_id = req.body.id;
			var module = Modules.getModuleById(module_id, function(err, module){
				if(err){
					res.render('misc/error', {'info': 'Apparently, the module is missing in our system.'});
					res.end();
				} else {
					module = module.toObject();
					module.favs.push(req.currentUser);
					var id = module._id;
					delete module._id;
					Modules.findOneAndUpdate({'_id': id}, module, function(err, module){
						if(err){
							res.render('misc/error', {'info': err+'Something wrong happened, when we tried favoriting this module.'});
							res.end();
						} else {
							res.redirect('/modules/?id='+ module._id+'&info=fav_success');
						}
					});
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
