'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

var _ = require('lodash');
var schedule = require('node-schedule');

// ------------------------------------------------------------------------------------------ Module definition

function Scheduler() {
	this.schedules = [];
}

Scheduler.prototype.get = function(name) {
	return this.schedules[name];
};

Scheduler.prototype.add = function(name, cron, job) {
	if(!this.schedules[name]) {
		this.schedules[name] = schedule.scheduleJob(name, cron, job);
		return true;
	} else {
		return false;
	}
};

Scheduler.prototype.remove = function(name) {
	this.clear(name);
};

Scheduler.prototype.clear = function(name) {
	var self = this;
	if(name) {
		var schedule = self.schedules[name];
		if(schedule) {
			schedule.cancel();
			self.schedules = _.remove(self.schedules, self.schedules[name]);
		}
	} else {
		_.forOwn(self.schedules, function(schedule, key) {
			schedule.cancel();
			delete self.schedules[key];
		});
		self.schedules = [];
	}
	return true;
};

Scheduler.prototype.reschedule = function(name, cron, job) {
	if(this.schedules[name]) {
		this.clear(name);
	}
	return this.add(name, cron, job);
};

// ------------------------------------------------------------------------------------------ Module Exposure

module.exports = new Scheduler();
