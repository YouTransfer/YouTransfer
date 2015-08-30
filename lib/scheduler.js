'use strict';

var _ = require('lodash');
var nconf = require('nconf');
var schedule = require('node-schedule');

module.exports = (function() {

	var self = {};
	var schedules = [];

	self.add = function(name, cron, job) {
		if(!schedules[name]) {
			schedules[name] = schedule.scheduleJob(cron, job);
			return true;
		} else {
			return false;
		}
	}

	self.clear = function(name) {
		if(name) {
			schedules[name].cancel();
			schedules = _.remove(schedules, schedules[name]);
		} else {
			_.each(schedules, function(schedule) {
				schedule.cancel();
			});
			schedules = Array();
		}
		return true;
	}

	self.reschedule = function(name, cron, job) {
		if(schedules[name]) {
			self.clear(name);
		}
		return self.add(name, cron, job);
	}

	return self;
})()