/**
 * Authentication Middleware
 *
 * Handles everything from
 *  - user session Management
 *  - session persistence across restarts and apps
 *  - embed authentication helpers inside the request object
 *  - passport-twitter is the core authentication module.
 */
var User = require('../models/Modules').User;
var express = require('express');
var expressSession = require('express-session');
var MongoStore = require('connect-mongo')(expressSession);
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var authenticator = express();
var config;

var oneSecond = 1000; // milliseconds
var oneDay = (60 * oneSecond) *  (60 * 24); // 1 minute * 60 * 24

module.exports.init = function(app){
  var db = app.get('db');
  config = app.get('config');
  initPassportStrategy();
  authenticator.use(expressSession({
    key: 'domstorm_session_id',
    secret: config.EXPRESS_SESSION_SECRET,
    store: new MongoStore({mongooseConnection: db}),
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: oneDay * 31 // Persist for a month
    }
  }));
  authenticator.use(passport.initialize());
  authenticator.use(passport.session());

  // Setup a default dummy user using config.admin as the name if the app is running in no-auth mode.
  // Also set up an 'anonymous' user if there is no one logged in so far.
  if(!config.requireAuth) authenticator.use(defaultUser);

  authenticator.use(setAuthenticationHelpers);
  return authenticator;
};



function setAuthenticationHelpers(req, res, next){

  // Setting the user in locals, so it can be accessed globally in views as well.
  res.locals.user = req.user;
  res.locals.isAuthenticated = function(){ return true;};

  if(req.isAuthenticated()) req.username = req.user.handle;

  // helper functions
  req.isAdminUser = function(){
    return req.isAuthenticated() &&  (req.username === config.admin);
  };


  next();
}

function defaultUser(req, res, next) {
  var user;
  user = new User();
  user.provider = "noAuth";
  user.uid = '1';
  user.id = '1';
  user.name = config.admin;
  user.handle = config.admin;
  user.image = '';
  req.user = user;
  next();
}



function initPassportStrategy(){

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
            user = new User();
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
    config.requireAuth = false;
  }

}

