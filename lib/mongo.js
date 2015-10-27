'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
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


function get(collection) {

}

exports.init = init;
exports.add = add;
exports.cacheMax = 20;
exports.flushInterval = 30 * 1000;