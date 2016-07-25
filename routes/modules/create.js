var express = require('express');
var router = express.Router();


router.get('/', function(req, res){
  res.render('modules/createModule', {
    'title': 'Create a new Module'
  });
});

router.post('/', function(req, res){
  var type = req.body._module_type;
  var results = {};

  if (type === 'FUZZER') {
    results._type = 'SIMPLE_TABLE';
    results.columns = ['Fuzz data'];
  }
  if (type === 'ENUM_FUNCTION') {
    results._type = req.body._results_type;
    var columns = [];
    if (results._type == 'SIMPLE_TABLE') {
      var num_cols = req.body._num_cols;
      for (var i = 1; i <= num_cols; i++) {
        columns.push(req.body['_cols_' + i]);
      }
    }
    results.columns = columns;
  }
  if (type === 'TESTHARNESS') {
    results._type = 'testharness';
    results.columns = ['Result', 'Test Name', 'Message'];
  }

  var tags = req.body._tags;
  tags = tags.replace(/-/g, '');
  tags = tags.split(',');

  var test = {};
  test.state = 'NOT_STARTED'; // ERROR, COMPLETE
  test._type = req.body._module_type;
  test.userScript = req.body._userScript;

  if (type === 'ENUM_FUNCTION')
    test.enum_data = req.body._enum_data;
  if (type === 'FUZZER')
    test.fuzz_data = req.body._fuzz_data;

  var newModule = {};
  newModule.results = results;
  newModule.test = test;
  newModule.name = req.body._name;
  newModule.description = req.body._desc;
  newModule.tags = tags;
  newModule.owner = req.user.handle || 'Anonymous';
  newModule.favs = [];

  req.Modules.add(newModule, function(err, module) {
    if (err) {
      res.render('misc/error', {
        'info': 'Something wrong happened, when we tried creating your new module.'
      });
    } else {
      res.redirect('/modules?id=' + module._id);
    }
  });

});


module.exports = router;


