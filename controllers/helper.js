// Routes everything '/helper' related.

exports.index = function(app) {

    app.get('/helper', function(req, res) {
        res.render('helper/index', {
            'title': 'Request Modules'
        });
    });
}

exports.headers = function(app) {
    // Headers - Returns a JSON array of Request Headers
    app.get('/helper/headers', function(req, res) {
        / If a query param 'filter' is provided, then delete the header which
        / / does not contains the value specified in the filter
        var filter = req.query.filter;
        for (var item in req.headers) {
            if (req.headers[item] != filter) {
                delete(req.headers[item]);
            }
        }

        var headers = JSON.stringify(req.headers);
        res.end(headers);
    });
}