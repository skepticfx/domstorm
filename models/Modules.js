var mongoose = require('mongoose');


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
			browsers: [
				{	name: String,
					raw: String
				}
					]
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