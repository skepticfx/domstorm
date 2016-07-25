var express = require('express');
var router = express.Router();

/**
 * Add specific methods here
 */
router.use('/create', require('./create'));
router.use('/run', require('./run'));


module.exports = router;