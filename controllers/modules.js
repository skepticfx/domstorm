// Routes for anything '/modules' related
var Modules = require('../models/Modules');



// Loads the module home and individual modules
exports.index = function(app) {

  app.get('/modules', function(req, res) {
    if (typeof req.query.id != 'undefined') {
      var module_id = req.query.id;
      var module = req.Modules.getModuleByIdAndIncreaseViewCount(module_id, function(err, module) {
        if (err) {
          res.render('misc/error', {
            'info': 'Apparently, the module is missing in our system.'
          });

        } else {

          var userOptions = {};
          userOptions.blinkFav = false;
          if (req.query && req.query.info && req.query.info === 'fav_success')
            userOptions.blinkFav = true;

          userOptions.owner = false;
          if (module.owner == req.username || req.isAdminUser())
            userOptions.owner = true;
          if (req.username !== 'Anonymous') {
            userOptions.status = 'enabled';
            userOptions.showFav = true;
            if (module.favs)
              if (module.favs.indexOf(req.username) >= 0)
                userOptions.showFav = false;

          } else {
            userOptions.status = 'disabled';
          }

          var module_details = {
            'module_id': module._id,
            'module_name': module.name,
            'module_description': module.description,
            'module_results': module.results,
            'module_test': module.test,
            'browsers': getBrowserResults(module),
            'module_owner': module.owner || 'Anonymous',
            'userOptions': userOptions,
            'module_favs': (module.favs && module.favs.length) || 0,
            'module_viewCount': module.viewCount + 1 || 1,
            'module': module.toObject(),
            'ds_title': module.name
          };
          res.render('modules/getModule', module_details);

        }
      });
    } else {
      Modules.find({}, function(err, modules) {
        if (err) {
          console.log('There is some error populating the Modules List');
        } else {
          res.render('modules/index', {
            'title': 'Modules',
            'modules': modules
          });

        }
      });
    }
  });
};






exports.results = function(app) {

  // Can be Ajax
  app.post('/modules/results/update', function(req, res) {
    var module_id = req.body._module_id;
    var browser = {};
    browser.name = req.body._browser;
    browser.rows = JSON.parse(req.body._rows);
    browser.version = req.body._version;
    browser.os = req.body._os;
    browser.last_run = browser.os;
    var test = {};
    test.state = 'COMPLETED'; //  COMPLETE
    var updateObj = {};
    updateObj['test.state'] = test.state;
    updateObj['results.browsers.' + req.body._browser] = browser;

    Modules.findOneAndUpdate({
      '_id': module_id
    }, updateObj, function(err, result) {
      if (err) {
        res.render('misc/error', {
          'info': 'Something wrong happened, when we tried updating the results'
        });
      } else {
        res.redirect('/modules/?id=' + result._id);
      }
    });
  });

  // Hackish to Update the stuff.
  app.get('/update', function(req, res) {
    Modules.find({}, function(err, modules) {
      if (err) {
        console.log('There is some error populating the Modules List');
      } else {
        var modulesList = [];
        for (x in modules) {
          var obj = {};
          obj.name = encode(modules[x].name);
          obj.id = modules[x]._id;
          modulesList.push(obj);
        }
        if (typeof req.query.module != 'undefined') {
          res.redirect('/modules/?id=' + req.query.module);
        } else {
          res.redirect('/');
        }
      }
    });
  });
};


var getBrowserResults = function(module) {

  var browser_results = {};
  var browsers = module.results.browsers;
  for (var x in browsers) {
    var browser_temp = browsers[x];
    if (browser_temp.rows && browser_temp.rows.length > 0) {
      if (browser_temp.name === undefined || browser_temp.name === '') browser_temp.name = 'Unknown Browser';
      if (browser_temp.version === undefined || browser_temp.version === '') browser_temp.version = 'Unknown Version';
      if (browser_temp.os === undefined || browser_temp.os === '') browser_temp.os = 'Unknown OS';
      if (browser_temp.last_run === undefined || browser_temp.last_run === '') browser_temp.last_run = 'Unknown OS';
      let is_last_run = (browser_temp.os === browser_temp.last_run)? '<div class="label label-success">This browser ran the most recent scan</div>': "";
      var table_html = '<br/><div class="table-responsive"><div class="label label-danger">Tested on</div>"+ is_last_run +"<div class="label label-info">' + browser_temp.name + ' - ' + browser_temp.version + ' - ' + browser_temp.os + '</div><table class="table table-striped table-bordered table-hover"> <thead><tr class="TITLE">';
      // Iterate the columns
      for (var i = 0; i < module.results.columns.length; i++) {
        table_html += '<th>' + module.results.columns[i] + '</th>'
      }
      table_html += '</tr></thead><tbody>';
      // Iterate the Rows, PS: Its a 2D array
      for (i = 0; i < browser_temp.rows.length; i++) {
        table_html += '<tr class="' + browser_temp.rows[i].type + '">';
        for (j = 0; j < browser_temp.rows[i].data.length; j++) {
          table_html += '<td>' + browser_temp.rows[i].data[j] + '</td>';
        }
        table_html += '</tr>';
      }
      table_html += '</tbody></table></div>';
      browser_results[browser_temp.name] = table_html;
    }
  }
  return browser_results;
}


// Forks a new module
exports.fork = function(app) {

  // The UI
  app.get('/modules/fork', function(req, res) {
    if (typeof req.query.id != 'undefined') {
      var module_id = req.query.id;
      var module = Modules.getModuleById(module_id, function(err, module) {
        if (err) {
          res.render('misc/error', {
            'info': 'Apparently, the module is missing in our system.'
          });

        } else {
          var module_tags_parsed = "";
          module = module.toObject();
          for (var x in module.tags)
            module_tags_parsed += module.tags[x] + ",";
          if (module_tags_parsed !== "")
            module_tags_parsed = module_tags_parsed.slice(0, -1);
          res.render('modules/forkModule', {
            'title': 'Fork this module',
            'module': module,
            'columns': JSON.stringify(module.results.columns),
            'module_tags_parsed': module_tags_parsed
          });

        }
      });
    } else {
      res.render('misc/error', {
        'info': 'Apparently, the module is missing in our system.'
      });

    }
  });
};

exports.init = function(app) {


  app.get('/mymodules', function (req, res) {
    Modules.getModulesByUser(req.username, function (err, modules) {
      modules = modules.map(function(module){
        return {id: module._id, name: module.name, description: module.description, favorites: module.favs}
      });
      res.render('modules/myModules', {modules: modules});
    });
  });

  // Favorites a given module by a logged in User.
  app.post('/modules/favorite', function (req, res) {
    if (typeof req.body.id != 'undefined') {
      var module_id = req.body.id;
      var module = Modules.getModuleById(module_id, function (err, module) {
        if (err) {
          res.render('misc/error', {
            'info': 'Apparently, the module is missing in our system.'
          });

        } else {
          module = module.toObject();
          module.favs.push(req.username);
          var id = module._id;
          delete module._id;
          Modules.findOneAndUpdate({
            '_id': id
          }, module, function (err, module) {
            if (err) {
              res.render('misc/error', {
                'info': err + 'Something wrong happened, when we tried favoriting this module.'
              });

            } else {
              res.redirect('/modules/?id=' + module._id + '&info=fav_success');
            }
          });
        }
      });
    } else {
      res.render('misc/error', {
        'info': 'Apparently, the module is missing in our system.'
      });

    }
  });

  app.get('/modules/topModules.json', function (req, res) {
    Modules.getTopModules(function (err, topModules) {
      let modules = new Map();
      topModules.forEach((m) =>{
        modules.set(m.name, m._id);
      });
      let arr = [];  
      for (let [k,v] of modules) {
        arr.push({id: v, name: k});
      }
  
      res.json({topModules: arr});
    });
  });

};

function encode(str) {
  str = str.replace(/</gi, '&lt;');
  str = str.replace(/>/gi, '&gt;');
  str = str.replace(/"/gi, '&quot;');
  return str;
}