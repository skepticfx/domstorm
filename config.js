// First things first
// Set up a mongoDB instance and update DB_URL below.
// By Default, there is no Auth used (Twitter Sign-In). To enable it, set requireAuth to 'true' and setup the admin name as your twitter handle.
// Leave the 'config.admin' as 'admin' if you are not using Auth Mode.
// Raise an issue if something does'nt work.

var config = {};

exports.config = config;

if(process.env.OPENSHIFT_MONGODB_DB_URL){
  config.DB_URL = process.env.OPENSHIFT_MONGODB_DB_URL + 'domstorm';
  config.CALLBACK_URL = "http://domstorm.skepticfx.com/auth/twitter/callback";
} else {
  config.DB_URL = 'mongodb://fx:fx@127.0.0.1/domstorm'; // Local Mongo Instance
  config.CALLBACK_URL = "http://localhost:8080/auth/twitter/callback";
}
config.TWITTER_CONSUMER_KEY = "4BA67Z9R1y42ulAR0RnU7rbWb";
config.TWITTER_CONSUMER_SECRET = "8AbsSbAQx4SEPcl8A3jkWdoXBjQu2x2VH6Z6xowSBI8OdIFn6a";

// To Use DomStorm in No-Auth mode (No Twitter Login required), set the below property to false and choose an admin name;

config.requireAuth = true;

config.admin = 'skeptic_fx'; // Twitter Username of the Admin account.
