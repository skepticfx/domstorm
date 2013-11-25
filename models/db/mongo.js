var mongoose = require('mongoose');
a = mongoose.connect('mongodb://nafeez:secret123@ds053788.mongolab.com:53788/dom-storm');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
	console.log('Connected to mongoDB');
});


var modulesSchema = mongoose.Schema({
	name: String,
	description: String,
	test: {
			_type: {type: String},
			enum_data: {type: String},
			userScript: {type: String},
			state: {type: String}
		  },
	results: {
			_type: {type: String},
			raw: {type: String},
		  }		  

});

modulesSchema.statics.add = function(obj, callback){
	var instance = new Modules();
	instance.name = obj.name;
	instance.description = obj.description;
	instance.test._type = obj.test.type;
	instance.test.state = obj.test.state;
	instance.test.userScript = obj.test.userScript;
	instance.results._type = obj.results.type;
	
	instance.save(function (err){
		callback(err, instance);		
	});
};	

modulesSchema.statics.getModuleById = function(id, callback){
	this.findOne({_id: id}, function(err, module){
		if (!module) return callback(new Error('The module is not found'));
		return callback(null, module);
	});
}

var Modules = mongoose.model('Modules', modulesSchema);
exports.Modules = Modules;