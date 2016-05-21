// Set up a MongoDB instance and update DB_URI below.
// Raise an issue if something doesn't work.

var config = {};

exports.config = config;

config.DEV_MODE = false;

// The website which hosts this. (https://domstorm.skepticfx.com)
config.URI = process.env.URI || "http://localhost";


// To Use DomStorm in No-Auth mode (No Twitter Login required), set the below property to false and choose an admin name;
// can be overridden on shell using the '--noauth' option.
config.requireAuth = true;
// Logging capability
config.log = false;

// Twitter Config
config.TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY;
config.TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET;
config.admin = process.env.TWITTER_ADMIN || 'twitter'; // Twitter Username of the Admin.



if (process.env.DB_URI) {
  console.log('Detected DB URI.');
  config.DB_URI = process.env.DB_URI;
  config.CALLBACK_URL = config.URI + "/auth/twitter/callback";
} else {
  config.DEV_MODE = true;
  config.DB_URI = 'mongodb://fx:fx@127.0.0.1/domstorm'; // Local Mongo Instance
  config.CALLBACK_URL = "http://localhost:8080/auth/twitter/callback";
  config.requireAuth = false;
  config.log = true;
}

