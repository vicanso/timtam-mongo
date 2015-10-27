const timtamMongo = require('../');


timtamMongo.init('mongodb://localhost:27017/timtam');


// setInterval(function function_name(argument) {
// 	timtamMongo.add('test', {
// 		message: 'RequireJS takes a different approach to script loading than traditional <script> tags. While it can also run fast and optimize well, the primary goal is to encourage modular code. As part of that, it encourages using module IDs instead of URLs for script tags.',
// 		level: 'info',
// 		timestamp: (new Date()).toISOString()
// 	});
// }, 1000);