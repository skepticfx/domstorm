var express = require('express');
var router = express.Router();


router.post('/', function(req, res){
  if(typeof req.body._id != 'undefined'){
    req.Modules.findOne({_id: req.body._id}, function(err, module){
      if(err){
        res.render('misc/error', {'info': 'Apparently, the module is missing in our system.'});
        res.end();
      } else {
        if(module.owner == req.username || req.isAdminUser()){
          module.remove();
          res.redirect('/');
        } else {
          res.render('misc/userError', {'info': 'You must be the owner of this module to delete it.'});
          res.end();
        }
      }
    });
  } else {
    res.render('misc/error', {'info': 'Apparently, the module is missing in our system.'});
    res.end();
  }
});

module.exports = router;