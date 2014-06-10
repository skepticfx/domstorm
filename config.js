var config = {};

exports.config = config;

if(process.env.OPENSHIFT_MONGODB_DB_URL)
  config.DB_URL = process.env.OPENSHIFT_MONGODB_DB_URL + 'domstorm';
else
  config.DB_URL = 'mongodb://fx:fx@127.0.0.1/domstorm'; // Local Mongo Instance


config.TWITTER_CONSUMER_KEY = "4BA67Z9R1y42ulAR0RnU7rbWb";
config.TWITTER_CONSUMER_SECRET = "8AbsSbAQx4SEPcl8A3jkWdoXBjQu2x2VH6Z6xowSBI8OdIFn6a";
config.CALLBACK_URL = "http://localhost:8080/auth/twitter/callback";
