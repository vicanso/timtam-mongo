'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const debug = require('debug')('jt.timtam-mongo');
const _ = require('lodash');
const logSchema = {
	message: String,
	level: String,
	timestamp: String
};
const logDict = {};

var client;
var modelDict = {};

/**
 * [init description]
 * @param  {[type]} uri     [description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
function init(uri, options) {
	options = _.extend({
		db: {
			native_parser: true
		},
		server: {
			poolSize: 5
		}
	}, options);
	client = mongoose.createConnection(uri, options);
	client.on('connected', function() {
		console.info(uri + ' connected');
	});
	client.on('disconnected', function() {
		console.info(uri + ' disconnected');
	});
	client.on('error', function(err) {
		console.error(err);
	});
	let timer = setTimeout(flush, exports.flushInterval);
	timer.unref();
}


/**
 * [getModel description]
 * @param  {[type]} collection [description]
 * @return {[type]}            [description]
 */
function getModel(collection) {
	if (!modelDict[collection]) {
		let schema = new Schema(logSchema);
		schema.index({
			timestamp: 1
		});
		schema.index({
			timestamp: 1,
			level: 1
		});
		modelDict[collection] = client.model(collection, schema);
	}

	return modelDict[collection];
}

/**
 * [add description]
 * @param {[type]} collection [description]
 * @param {[type]} data       [description]
 */
function add(collection, data) {

	let logData = logDict[collection];
	if (!logData) {
		logData = resetLogData(collection);
	}
	let logs = logData.logs;
	logs.push(data);
	if (logs.length > exports.cacheMax) {
		save(collection, logs);
		resetLogData(collection);
	}
}

/**
 * [resetLogData description]
 * @param  {[type]} collection [description]
 * @return {[type]}            [description]
 */
function resetLogData(collection) {
	let now = Date.now();
	let tmp = logDict[collection];
	if (tmp) {
		tmp.logs.length = 0;
		tmp.createdAt = now;
	} else {
		tmp = logDict[collection] = {
			logs: [],
			createdAt: now
		};
	}
	return tmp;
}

/**
 * [save description]
 * @param  {[type]} collection [description]
 * @param  {[type]} arr        [description]
 * @return {[type]}            [description]
 */
function save(collection, arr) {
	if (!client) {
		throw new Error('mongodb is not init!');
	}
	let Model = getModel(collection);
	Model.collection.insert(arr, function(err, docs) {
		if (err) {
			console.error(err);
		}
	});
}

/**
 * [flush description]
 * @return {[type]} [description]
 */
function flush() {
	let flushInterval = exports.flushInterval;
	let now = Date.now();
	_.forEach(logDict, function(logData, collection) {
		if (logData.createdAt + flushInterval < now) {
			save(collection, logData.logs);
			resetLogData(collection);
		};
	});
	let timer = setTimeout(flush, flushInterval);
	timer.unref();
}


/**
 * [get description]
 * @param  {[type]} collection [description]
 * @param  {[type]} conditions [description]
 * @param  {[type]} options    [description]
 * @return {[type]}            [description]
 */
function get(collection, conditions, options) {
	if (!client) {
		throw new Error('mongodb is not init!');
	}
	if (!conditions) {
		throw new Error('conditions cant not be null');
	}
	let Model = getModel(collection);
	options = _.extend({
		skip: 0,
		limit: 5,
		sort: {
			timestamp: -1
		}
	}, options);

	debug('conditions:%j, options:%j', conditions, options);
	return new Promise(function(resolve, reject) {
		Model.find(conditions, '-_id').setOptions(options).find(function(err, docs) {
			if (err) {
				reject(err);
			} else {
				docs = _.map(docs, function(doc) {
					doc = doc.toObject();
					return doc;
				});
				resolve(docs);
			}
		});
	});
}

/**
 * [getByDate description]
 * @param  {[type]} collection [description]
 * @param  {[type]} date       [description]
 * @return {[type]}            [description]
 */
function getByDate(collection, date, options) {
	if (_.isObject(date)) {
		options = date;
		date = null;
	}
	date = date || format(new Date());
	let begin = date + 'T00:00:00.000Z';
	let end = date + 'T24:00:00.000Z';
	let conditions = {
		timestamp: {
			'$gte': begin,
			'$lte': end
		}
	};
	return get(collection, conditions, options);
}


function count(collection, conditions) {
	if (!client) {
		throw new Error('mongodb is not init!');
	}
	if (!conditions) {
		throw new Error('conditions cant not be null');
	}
	let Model = getModel(collection);
	debug('count %s conditions:%j', collection, conditions);
	return Model.count(conditions);
}


function format(date) {
	let year = date.getFullYear();
	let month = date.getMonth() + 1;
	if (month < 10) {
		month = '0' + month;
	}
	let day = date.getDate();
	if (day < 10) {
		day = '0' + day;
	}
	return '' + year + '-' + month + '-' + day;
}

exports.init = init;
exports.add = add;
exports.cacheMax = 20;
exports.flushInterval = 30 * 1000;
exports.getByDate = getByDate;
exports.get = get;
exports.count = count;