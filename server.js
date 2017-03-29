/**
 * Dom Storm. Built using Express, EJS, Mongoose, ACE
 */

console.log('Starting server.js');
var express = require('express');
var controllers = require('./controllers');
var modules = require('./controllers/modules.js');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var logger = require('morgan');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var config = require('./config.js').config;
var User = require('./models/User');
var Modules = require('./models/Modules');
var appRouter = require('./routes');

var authenticationMiddleware = require('./middlewares/authentication');

var oneSecond = 1000; // milliseconds
var oneDay = (60 * oneSecond) *  (60 * 24); // 1 minute * 60 * 24
var app = express();

// Force No-Auth ?
if (typeof process.argv[2] !== 'undefined' && process.argv[2] === '--noauth')
  config.requireAuth = false;
if (!config.requireAuth)
  console.log('Running DomStorm in No Auth mode.');

console.log('Establishing connection to database.');
mongoose.connect(config.DB_URI);
var db = mongoose.connection;
db.on('error', function(err) {
  console.log('Connection error: ' + err.name + ': ' + err.message);
  console.log('If you are trying to run this locally, make sure you have configured config.js to have the correct username and password');
  console.log('You can create a Mongo user for the db domstorm using your mongo shell locally. ');
  console.log('*************');
  console.log('use domstorm;');
  console.log('db.createUser({"user": "fx", "pwd": "fx", "roles": ["readWrite"]});');
});




db.once('open', function() {
  console.log('Successfully connected to the database.');
  // all environments
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  app.set('port', process.env.PORT || process.env.NODE_PORT || 8080);
  app.set('ip', process.env.IP || process.env.NODE_IP || '0.0.0.0');

  app.set('db', db);
  app.set('config', config);

  if (typeof config.admin == 'undefined' || config.admin.length === 0) {
    console.log('admin must be configured in `config.js`. Setting admin to the name `twitter` ');
    config.admin = 'twitter';
  }

  app.use(redirectToHttps);
  app.use(favicon(__dirname + '/public/imgs/dom-storm-logo.png'));
  app.use("/public", express.static(path.join(__dirname, '/public'), { maxAge: oneDay }));

  // Handle browser logos if its not found in the public folder. (/public/imgs/browser-logos/unknown-browser-name.png)
  app.use("/public/imgs/browser-logos/:browser", express.static(path.join(__dirname, '/public/imgs/browser-logos/unknownbrowser.png'), { maxAge: oneDay }));


  // middleware stack
  app.use(logger('dev'));
  app.use(bodyParser.json({limit: '50mb'}));
  app.use(bodyParser.urlencoded({extended: false}));

  app.use(authenticationMiddleware.init(app));

  app.use(function(req, res, next){
    req.Modules = Modules;
    req.User = User;
    next();
  });

  app.locals.TESTRUNNER_MAXIMUM_IFRAMES = config.TESTRUNNER_MAXIMUM_IFRAMES || 10;

  // routing
  app.use('/', appRouter);
  controllers.set(app);
  /// catch 404 and forward to error handler
  app.use(function(req, res) {
    res.status(404);
    res.render('misc/404', {'info': 'Page Not found.'});
  });


  http.createServer(app).listen(app.get('port'), app.get('ip'), function() {
    if(!config.DEV_MODE) console.log('Running in production mode.');
    console.log('Dom Storm server listening on port: ' + app.get('port'));
  });
});


function redirectToHttps(req, res, next) {
  if (!config.DEV_MODE && req.headers['x-forwarded-proto'] == 'http') {
    res.redirect('https://' + req.headers.host + req.path);
  } else {
    return next();
  }
}
