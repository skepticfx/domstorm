/**
 * Dom Storm. Built using Express, EJS, Mongoose, ACE
 */

console.log('Starting server.js');
var express = require('express');
var controllers = require('./controllers');
var modules = require('./controllers/modules.js');
var http = require('http');
var path = require('path');
var fs = require('fs');
var config = require('./config.js').config;

var ipaddress = '';
var port      = process.env.PORT || 8080;

var oneDay = '86400000';

var mongoose = require('mongoose');
mongoose.connect(config.DB_URL);
console.log('Hold On ! We are connecting to the database.');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
	console.log('Alright ! Connected to the database.');
	var Modules = require(process.cwd()+'/models/Modules.js').Modules;

	var app = express();

	// all environments
	app.set('port', process.env.PORT || 3000);
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'ejs');

	// middleware stack
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.json());
	app.use(express.urlencoded());
	app.use(app.router);
	app.use("/dynamic",express.static(path.join(__dirname, '/dynamic')));

	app.use(express.compress());
	app.use("/public",express.static(path.join(__dirname, '/public'), {maxAge: oneDay} ));


	// development only
	if ('development' == app.get('env')) {
		app.use(express.errorHandler());
	}

	// routing
	controllers.set(app);

	console.log('Hold On Again! We are fetching the list of modules.');
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
			fs.writeFile(process.cwd()+'/dynamic/js/modulesList.js', 'var topModules = '+ JSON.stringify(modulesList) + ' ;', function(err){
				if(err){
					console.log('There is some error in writing the list to modulesList.js');
				} else {
					console.log('Great ! Populated the list of modules.');
					http.createServer(app).listen(port, function(){
						console.log('Dom Storm server listening on port ' + port);
					});
				}
			});
		}
	});
});
