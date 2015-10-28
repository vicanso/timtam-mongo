const timtamMongo = require('../');
const _ = require('lodash');
const moment = require('moment');

timtamMongo.init('mongodb://black:27017/timtam');


// get today log

timtamMongo.getByDate('test', moment().format('YYYY-MM-DD'), {
	limit: 3
}).then(function(res) {
		console.dir(res)
	},
	function(err) {
		console.error(err);
	});

// setInterval(function function_name(argument) {
// 	timtamMongo.add('test', {
// 		message: 'RequireJS takes a different approach to script loading than traditional <script> tags. While it can also run fast and optimize well, the primary goal is to encourage modular code. As part of that, it encourages using module IDs instead of URLs for script tags.',
// 		level: _.sample(['info', 'error', 'warn']),
// 		timestamp: (new Date()).toISOString()
// 	});
// }, 1000);