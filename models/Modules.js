var mongoose = require('mongoose');


var modulesSchema = mongoose.Schema({
	name: String,
	description: String,
	test: {
			_type: {type: String},
			enum_data: {type: String},
			userScript: {type: String},
			state: {type: String},
			timeout: {type: String}
		  },
	results: {
			_type: {type: String}, // [SIMPLE_TABLE]
			columns: [],
			raw: {type: String}, // Deprecated.
			browsers:{
						GOOGLE_CHROME: {rows: [], version: String},
						MOZILLA_FIREFOX: {rows: [], version: String},
						INTERNET_EXPLORER: {rows: [], version: String},
						OPERA: {rows: [], version: String},
						SAFARI: {rows: [], version: String},
						OTHERS: {rows: [], version: String}
					}
		  },
	
	tags:  [],
	created: { type: Date, default: Date.now }	

});

modulesSchema.statics.add = function(obj, callback){
	var instance = new Modules();
	instance.name = obj.name;
	instance.description = obj.description;
	instance.test._type = obj.test.type;
	instance.test.state = obj.test.state;
	instance.test.userScript = obj.test.userScript;
	instance.test.enum_data = obj.test.enum_data;
	instance.results._type = obj.results.type;
	instance.results.columns = obj.results.columns;
	instance.tags = obj.tags;
	
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