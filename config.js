var config = {};

exports.config = config;

if(process.env.OPENSHIFT_MONGODB_DB_URL)
  config.DB_URL = process.env.OPENSHIFT_MONGODB_DB_URL + 'domstorm';
else
  config.DB_URL = 'mongodb://fx:fx@127.0.0.1/domstorm'; // Local Mongo Instance

//config.DB_URL = 'mongodb://nafeez:secret123@ds053788.mongolab.com:53788/dom-storm';
//config.DB_URL = 'mongodb://fx:fx@127.0.0.1/domstorm';
//mongodb://nafeez:secret123@ds053788.mongolab.com:53788/dom-storm
//mongodb://admin:4fcnQu43EG3n@127.12.118.130:27017/domstorm

/*
//provide a sensible default for local development
mongodb_connection_string = 'mongodb://127.0.0.1:27017/' + db_name;
//take advantage of openshift env vars when available:
if(process.env.OPENSHIFT_MONGODB_DB_URL){
  mongodb_connection_string = process.env.OPENSHIFT_MONGODB_DB_URL + db_name;
}

*/
