/**
 * Dom Storm. Built using Express, EJS, Mongoose, ACE
 */

console.log('Starting server.js');
var crypto = require('crypto');
var express = require('express');
var controllers = require('./controllers');
var modules = require('./controllers/modules.js');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var bodyParser = require('body-parser');
var TwitterStrategy = require('passport-twitter').Strategy;
var config = require('./config.js').config;
var User = require(process.cwd() + '/models/Modules.js').User;
var Modules = require(process.cwd() + '/models/Modules.js').Modules;

var oneDay = '86400000';
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
  console.log('> use domstorm; db.createUser({"user": "fx", "pwd": "fx", "roles": ["readWrite"]});');
});
db.once('open', function() {
  console.log('Successfully connected to the database.');
  // all environments
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  app.set('port', process.env.PORT || process.env.NODE_PORT || 8080);
  app.set('ip', process.env.IP || process.env.NODE_IP || '127.0.0.1');

  if (typeof config.admin == 'undefined' || config.admin.length === 0) {
    console.log('admin must be configured in `config.js`. Setting admin to the name `twitter` ');
    config.admin = 'twitter';
  }

  function defaultUser(req, res, next) {
    var user;
    if (!config.requireAuth) {
      user = new User();
      user.provider = "noAuth";
      user.uid = '90823457769194527583260';
      user.id = '90823457769194527583260';
      user.name = config.admin;
      user.handle = config.admin;
      user.image = '';
      req.user = user;
    }
    res.locals.user = req.user;
    next();
  }



  // middleware stack
  app.use(redirectToHttps);
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(cookieSession({
    name :'expressSession',
    secret: crypto.randomBytes(16).toString('hex')
  }));

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(defaultUser);

  app.use("/", express.static(path.join(__dirname, '/public'), {
    maxAge: oneDay
  }));
  app.use("/public", express.static(path.join(__dirname, '/public'), {
    maxAge: oneDay
  }));


  if (config.requireAuth && config.TWITTER_CONSUMER_KEY.length !== 0 && config.TWITTER_CONSUMER_SECRET.length !== 0) {
    passport.use(new TwitterStrategy({
        consumerKey: config.TWITTER_CONSUMER_KEY,
        consumerSecret: config.TWITTER_CONSUMER_SECRET,
        callbackURL: config.CALLBACK_URL
      },
      function(token, tokenSecret, profile, done) {
        User.findOne({
          uid: profile.id
        }, function(err, user) {
          if (user) {
            done(null, user);
          } else {
            var user = new User();
            user.provider = "twitter";
            user.uid = profile.id;
            user.id = profile._id;
            user.name = profile.displayName;
            user.handle = profile.username;
            user.image = profile._json.profile_image_url;
            user.save(function(err) {
              if (err) {
                throw err;
              }
              done(null, user);
            });
          }
        })
      }
    ));


    passport.serializeUser(function(user, done) {
      done(null, user.uid);
    });

    passport.deserializeUser(function(uid, done) {
      User.findOne({
        uid: uid
      }, function(err, user) {
        done(err, user);
      });
    });
  } else {
    console.log('Running in no-auth mode.');
  }


  // routing
  controllers.set(app);

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
