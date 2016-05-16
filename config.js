// Set up a MongoDB instance and update DB_URI below.
// Raise an issue if something doesn't work.

var config = {};

exports.config = config;

config.URI = ""; // The website which hosts this.

if (process.env.DB_URI) {
  console.log('Detected DB URI.');
  config.DB_URI = process.env.DB_URI;
  config.CALLBACK_URL = config.URI + "/auth/twitter/callback";
} else {
  config.DB_URI = 'mongodb://fx:fx@127.0.0.1/domstorm'; // Local Mongo Instance
  config.CALLBACK_URL = "http://localhost:8080/auth/twitter/callback";
}
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  config.TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY;
  config.TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET;
} else {
  config.TWITTER_CONSUMER_KEY = ""; // Specify Twitter Consumer Key here
  config.TWITTER_CONSUMER_SECRET = ""; // Specify Twitter Consumer Secret here
}

config.admin = process.env.TWITTER_ADMIN; // Twitter Username of the Admin.


// To Use DomStorm in No-Auth mode (No Twitter Login required), set the below property to false and choose an admin name;
// can be overridden on shell using the '--noauth' option.
config.requireAuth = true;

// Logging capability
config.log = false;