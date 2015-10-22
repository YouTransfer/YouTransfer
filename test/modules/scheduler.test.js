'use strict';

// ------------------------------------------------------------------------------------------ Test Dependencies

var should = require('chai').should();
var scheduler = require('../../lib/scheduler');

// ------------------------------------------------------------------------------------------ Test Definition

describe('YouTransfer Scheduler module', function() {

	var name = 'schedule';
	var cron = '*/10 * * * * *';
	var job = function() {
		return "my awesome job";
	};

	// -------------------------------------------------------------------------------------- Testing add schedule

	it('should be possible to set schedule', function() {
		var result = scheduler.add(name, cron, job);
		result.should.equals(true);
		scheduler.clear();
	});

	it('should not be possible to set schedule if it already exists', function() {
		scheduler.add(name, cron, job);
		var result = scheduler.add(name, cron, job);
		result.should.equals(false);
		scheduler.clear();
	});

	// -------------------------------------------------------------------------------------- Testing get schedule

	it('should be possible to get schedule', function() {
		scheduler.add(name, cron, job);
		var schedule = scheduler.get(name);
		should.exist(schedule);
		schedule.name.should.equals(name);
		scheduler.clear();
	});

	// -------------------------------------------------------------------------------------- Testing reschedule

	it('should be possible to reschedule', function() {
		scheduler.add(name, cron, job);
		var schedule = scheduler.get(name);
		should.exist(schedule);

		scheduler.reschedule(name, '*/30 * * * * *', job);

		schedule = scheduler.get(name);
		schedule.name.should.equals(name);
		schedule.job().should.equals('my awesome job');

		scheduler.clear();
	});

	it('should be possible to schedule through reschedule', function() {
		scheduler.reschedule(name, '*/30 * * * * *', job);

		var schedule = scheduler.get(name);
		should.exist(schedule);
		schedule.name.should.equals(name);
		schedule.job().should.equals('my awesome job');

		scheduler.clear();
	});

	// -------------------------------------------------------------------------------------- Testing remove

	it('should be possible to remove a schedule', function() {
		scheduler.add(name, cron, job);
		var schedule = scheduler.get(name);
		should.exist(schedule);

		scheduler.remove(name);
		schedule = scheduler.get(name);
		should.not.exist(schedule);
	});

	// -------------------------------------------------------------------------------------- Testing clear

	it('should be possible to clear existing schedule', function() {
		scheduler.add(name, cron, job);
		scheduler.clear();
		var schedule = scheduler.get(name);
		should.not.exist(schedule);
	});

	it('should not be possible to clear an existing schedule if it does not exist', function() {
		scheduler.add(name, cron, job);
		scheduler.clear('othername');
		var schedule = scheduler.get(name);
		should.exist(schedule);
		scheduler.clear();
	});

	it('should be possible to clear existing schedules', function() {
		var result = false;

		result = scheduler.add(name, cron, job);
		result.should.equals(true);

		result = scheduler.add('schedule2', cron, job);
		result.should.equals(true);

		result = scheduler.clear();
		result.should.equals(true);

		var schedule = scheduler.get(name);
		should.not.exist(schedule);
	});

});
