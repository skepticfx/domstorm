var express = require('express');
var router = express.Router();


router.get('/', function(req, res){
  if (typeof req.query.id !== 'undefined') {
    var module_id = req.query.id;
    var module = req.Modules.getModuleById(module_id, function(err, module) {
      if (err) {
        res.render('misc/error', {'info': 'Apparently, the module is missing in our system.'});
      } else {
        if (module.owner != req.username && !req.isAdminUser()) {
          res.render('misc/userError', {'info': 'You must be the owner of this module to edit it. You can fork this module though !'});
        } else {
          var module_tags_parsed = "";
          module = module.toObject();
          for (var x in module.tags)
            module_tags_parsed += module.tags[x] + ",";
          if (module_tags_parsed !== "")
            module_tags_parsed = module_tags_parsed.slice(0, -1);
          res.render('modules/editModule', {
            'title': 'Edit this module',
            'module': module,
            'columns': JSON.stringify(module.results.columns),
            'module_tags_parsed': module_tags_parsed
          });
        }
      }
    });
  } else {
    res.render('misc/error', {
      'info': 'Apparently, the module is missing in our system.'
    });
  }
});


// Form
// Get the already existing document and update as required. Can also be used for changes.
router.post('/', function(req, res) {
  var type, num_cols, i, newModule;
  req.Modules.getModuleById(req.body._id, function(err, module) {
    if (module.owner != req.username && !req.isAdminUser()) {
      res.render('misc/userError', {'info': 'You must be the owner of this module to edit it. You can fork this module though !'});
    } else {
      type = req.body._module_type;
      if (type === 'ENUM_FUNCTION') {
        module.results._type = req.body._results_type;
        module.results.columns = [];
        if (module.results._type == 'SIMPLE_TABLE') {
          num_cols = req.body._num_cols;
          for (i = 1; i <= num_cols; i++) {
            module.results.columns.push(req.body['_cols_' + i]);
          }
        }
      }

      if (type === 'FUZZER') {
        module.results._type = 'SIMPLE_TABLE';
        module.results.columns = ['Fuzz data'];
      }

      if (type === 'TESTHARNESS') {
        module.results._type = 'testharness';
        module.results.columns = ['Result', 'Test Name', 'Message'];
      }

      newModule = module.toObject();
      newModule.name = req.body._name;
      newModule.description = req.body._desc;
      newModule.test._type = req.body._module_type;
      newModule.test.userScript = req.body._userScript;
      newModule.test.fuzz_data = req.body._fuzz_data;
      if (type === 'ENUM_FUNCTION') {
        newModule.test.enum_data = req.body._enum_data;
        newModule.results.columns = module.results.columns;
      }

      var tags = req.body._tags;
      tags = tags.replace(/ /g, '');
      tags = tags.split(',');
      newModule.tags = tags;

      // The old owner should be the owner always !
      // DO NOT CHANGE module.owner

      delete newModule._id;
      req.Modules.findOneAndUpdate({
        '_id': module._id
      }, newModule, {
        'upsert': true
      }, function(err, module) {
        if (err) {
          res.render('misc/error', {
            'info': err + 'Something wrong happened, when we tried editing your module.'
          });
        } else {
          res.redirect('/modules/?id=' + module._id);
        }
      });
    }
  });
});

module.exports = router;
