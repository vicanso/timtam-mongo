const timtamMongo = require('../');
const _ = require('lodash');
const moment = require('moment');

timtamMongo.init('mongodb://localhost/timtam');


timtamMongo.getAllLogColections().then(function(apps) {
	console.dir(apps);
});


// get today log

// 只查某天的日志
timtamMongo.getByDate('test', moment().format('YYYY-MM-DD'), {
	limit: 3
}).then(function(res) {
		console.dir(res)
	},
	function(err) {
		console.error(err);
	});

// 正则匹配出错日志
timtamMongo.get('test', {
	message: /RequireJS/gi,
	level: 'error'
}).then(function(res) {
	console.dir(res);
}, function(err) {
	// body...
});

// 统计某天的出错日志数量
timtamMongo.count('test', {
	level: 'error',
	timestamp: {
		'$gte': moment().format('YYYY-MM-DD') + 'T00:00:00.000Z',
		'$lte': moment().format('YYYY-MM-DD') + 'T24:00:00.000Z'
	}
}).then(function(res) {
	console.dir(res);
}, function(err) {
	// body...
});


// 获取最新的100条日志
timtamMongo.get('test', {}, {
	limit: 50
}).then(function(res) {
	console.dir(res.length);
}, function(err) {
	// body...
})

// setInterval(function function_name(argument) {
// 	timtamMongo.add('test', {
// 		message: 'RequireJS takes a different approach to script loading than traditional <script> tags. While it can also run fast and optimize well, the primary goal is to encourage modular code. As part of that, it encourages using module IDs instead of URLs for script tags.',
// 		level: _.sample(['info', 'error', 'warn']),
// 		timestamp: (new Date()).toISOString()
// 	});
// }, 1000);