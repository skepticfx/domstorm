var mongoose = require('mongoose');

var UserSchema = mongoose.Schema({
  provider: String,
  uid: String,
  handle: String,
  name: String,
  image: String,
  created: {type: Date, default: Date.now}
});


var ModulesSchema = mongoose.Schema({
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
			browsers: {}
		  },
	tags:  [],
  owner: String,
  favs: [],
	created: { type: Date, default: Date.now }

});

ModulesSchema.statics.add = function(obj, callback){
	var instance = new Modules();

	instance.name = obj.name;
	instance.description = obj.description;
	instance.test._type = obj.test._type;
	instance.test.state = obj.test.state;
	instance.test.userScript = obj.test.userScript;
  if(obj.test.enum_data)
	 instance.test.enum_data = obj.test.enum_data;
	instance.results._type = obj.results._type;
  if(obj.results.columns)
	 instance.results.columns = obj.results.columns;
	instance.tags = obj.tags;
	instance.owner = obj.owner;
	instance.favs = new Array();


	instance.save(function (err){
		callback(err, instance);
	});
};

ModulesSchema.statics.getModuleById = function(id, callback){
	this.findOne({_id: id}, function(err, module){
		if (!module) return callback(new Error('The module is not found'));
		return callback(null, module);
	});
}

// Search by Name, Description and also by tags if starts with [tags]:
ModulesSchema.statics.searchAll = function(str, cb){
  var query = {};
  str = str.toLowerCase().trim();
  if(str.indexOf('[tags]:') === 0){
    var tags = str.substr(7).split(' ');
    query.tags = {};
    query.tags.$in = tags;
    console.log(tags);
  } else {
    query.$or = [];
    var obj = {};
    obj.name = {};
    obj.name.$regex = '.*' + str +'.*';
    obj.name.$options = 'i';

    query.$or.push(obj);
    obj = {};
    obj.description = {};
    obj.description.$regex = '.*' + str +'.*';
    obj.description.$options = 'i';
    query.$or.push(obj);
  }

  this.find(query, function(err, modules){
      if(err)
        console.log(err);

      modules.forEach(function(module){
        module.browsers_tested = Object.keys(module.results.browsers).length;
      });
      cb(err, modules);
  });
}


var Modules = mongoose.model('Modules', ModulesSchema);
var User = mongoose.model('User', UserSchema);

exports.Modules = Modules;
exports.User = User;
