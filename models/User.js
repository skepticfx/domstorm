var mongoose = require('mongoose');

var UserSchema = mongoose.Schema({
  provider: String,
  uid: String,
  handle: String,
  name: String,
  image: String,
  created: {
    type: Date,
    default: Date.now
  }
});

UserSchema.statics.getAllUsers = function(callback) {
  this.find(function(err, user) {
    return callback(null, user);
  });
};


UserSchema.statics.getUserByName = function(username, callback) {
  this.findOne({ 'handle': username }, function(err, user) {
    return callback(null, user);
  });
};

var User = mongoose.model('User', UserSchema);

module.exports = User;