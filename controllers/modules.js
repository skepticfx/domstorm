// Routes for anything '/modules' related

var fs = require('fs');
var Modules = require(process.cwd()+'/models/Modules.js').Modules;

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
					'module_test': module.test
					};
					res.render('modules/getModule', module_details);
				}
			});
		} else {
			Modules.find({}, function(err, modules){
				if(err){
					console.log('There is some error populating the Modules List');
				} else {
					res.render('modules/index', {'title': 'Modules', 'modules': modules});	
				}
			});
		}
	});
}

// Loads and runs the module test page from /models/core/modules_test/
exports.run = function(app){

	app.get('/modules/run', function(req, res){
		if(typeof req.query.id != 'undefined'){
			var module_id = req.query.id;
			var module = Modules.getModuleById(module_id, function(err, module){
				if(err){
					res.render('misc/error', {'info': 'Oops ! The test module is missing.'});
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
					break;
					
					default:
					res.render('misc/error', {'info': 'The Test Type is not defined yet'});
					}
				}
			});
		} else {
			res.status(404);
			res.render('misc/404', {'info': 'Missing module id.' });	
		}
	});

}

// Creates a new module
exports.create = function(app){

	// The UI
	app.get('/modules/create', function(req, res){
		res.render('modules/createModule', {'title':'Create a new Module'});
	});

	// Form
	app.post('/modules/create', function(req, res){
		var results = {};
		results.type = req.body._results_type;
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

		Modules.add(newModule, function(err, module){
			if(err){
				res.render('misc/error', {'info': 'Something wrong happened, when we tried creating your new module.'});
			} else {
				var Obj = {}
				Obj.name = module.name;
				Obj.id = module._id;
				res.redirect('/update?module='+module._id);
			}
		});
	});	

}

// Creates a new module
exports.edit = function(app){

	// Deletes a module
	app.post('/modules/delete', function(req, res){
		if(typeof req.body._id != 'undefined'){
			Modules.findOne({_id: req.body._id}, function(err, module){
				if(err){
					res.render('misc/error', {'info': 'Apparently, the module is missing in our system.'});
					res.end();				
				} else {
					module.remove();
					res.redirect('/update?module='+req.body._id);
				}
			});
		} else {
			res.render('misc/error', {'info': 'Apparently, the module is missing in our system.'});
			res.end();
		}
	});

	// The UI
	app.get('/modules/edit', function(req, res){
		if(typeof req.query.id != 'undefined'){
			var module_id = req.query.id;
			var module = Modules.getModuleById(module_id, function(err, module){
				if(err){
					res.render('misc/error', {'info': 'Apparently, the module is missing in our system.'});
					res.end();
				} else {
					res.render('modules/editModule', {title: 'Edit this module', module: module});
				}
			});
		} else {
			res.render('misc/error', {'info': 'Apparently, the module is missing in our system.'});
			res.end();
		}
	});

	// Form
	app.post('/modules/edit', function(req, res){
		var results = {};
		results._type = req.body._results_type;
		results.raw = "";
		var test = {};
		test.state = 'NOT_STARTED'; // ERROR, COMPLETE
		test._type = req.body._module_type;
		test.userScript = req.body._userScript;
		test.enum_data = req.body._enum_data;
		var module_id = req.body._id;
		var newModule = {};
		newModule.results = results;
		newModule.test = test;
		newModule.name = req.body._name;
		newModule.description = req.body._desc;

		Modules.findOneAndUpdate({'_id': module_id}, newModule, function(err, module){
			if(err){
				res.render('misc/error', {'info': 'Something wrong happened, when we tried creating your new module.'});
			} else {
				res.redirect('/modules/?id='+ module._id);
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
		browser.name = req.body._browser;
		browser.raw = '';
		var test = {};
		test.state = 'COMPLETED'; //  COMPLETE

		Modules.findOneAndUpdate({'_id': module_id}, {'results.raw': results.raw, $push: {'results.browsers': browser}, 'test.state': test.state},  function(err, result){
			if(err){
				res.render('misc/error', {'info': 'Something wrong happened, when we tried creating your new module.'});
			} else {
				res.redirect('/modules/?id='+ result._id);
			}
		});
	});	
	
	// Hackish to Update the stuff.
	app.get('/update', function(req, res){
		Modules.find({}, function(err, modules){
			if(err){
				console.log('There is some error populating the Modules List');
			} else {
				var modulesList = [];
				for(x in modules){
					var obj = {};
					obj.name = modules[x].name;
					obj.id = modules[x]._id;
					modulesList.push(obj);
				}
				fs.writeFile(process.cwd()+'/public/js/modulesList.js', 'var topModules = '+ JSON.stringify(modulesList) + ' ;', function(err){
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
