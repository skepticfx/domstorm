// Routes everything '/helper' related.

exports.index = function(app){

  app.get('/datasets', function(req, res){
    res.render('misc/error', {'info': 'Work in Progress'});
  });
}
