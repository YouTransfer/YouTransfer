'use strict';

// ------------------------------------------------------------------------------------------ Dependencies

var _ = require('lodash');
var nconf = require('nconf');
var schedule = require('node-schedule');

// ------------------------------------------------------------------------------------------ Module definition

function Scheduler() {
	this.schedules = new Array();
};

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
	if(name) {
		this.schedules[name].cancel();
		this.schedules = _.remove(this.schedules, this.schedules[name]);
	} else {
		for(var name in this.schedules) {
			var schedule = this.schedules[name];
			schedule.cancel();
			delete this.schedules[name];
		};
		this.schedules = new Array();
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
