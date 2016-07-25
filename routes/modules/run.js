var express = require('express');
var router = express.Router();

// Loads and runs the module test page from /models/core/modules_test/
// Anyone can RUN a module to test it. No Auth required.
router.get('/', function(req, res){
  if (typeof req.query.id != 'undefined') {
    var module_id = req.query.id;
    var module = req.Modules.getModuleById(module_id, function(err, module) {
      if (err) {
        res.render('misc/error', {'info': 'Oops ! The test module is missing.'});
      } else {
        var module_details = {
          'module_id': module._id,
          'module_name': module.name,
          'module_description': module.description,
          'module_results': module.results,
          'module_test': module.test
        };

        switch (module_details.module_test._type) {
          case "TESTHARNESS":
            if (req.query.iframe && req.query.iframe === '1')
              res.render('modules/runModule_testharness_iframe', module_details);
            else
              res.render('modules/runModule_testharness', module_details);

            break;

          case "ENUM_FUNCTION":
            if (req.query.iframe && req.query.iframe === '1')
              res.render('modules/runModule_enum_function_iframe', module_details);
            else
              res.render('modules/runModule_enum_function', module_details);

            break;

          case "FUZZER":
            if (req.query.iframe && req.query.iframe === '1')
              res.render('modules/runModule_fuzzer_iframe', { module: module});
            else
              res.render('modules/runModule_fuzzer', { module: module});

            break;
          default:
            res.render('misc/error', {
              'info': 'The Test Type is not defined yet'
            });

        }
      }
    });
  } else {
    res.status(404);
    res.render('misc/404', {'info': 'Missing module id.'});
  }

});

module.exports = router;