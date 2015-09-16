
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
	});

	// -------------------------------------------------------------------------------------- Testing get schedule

	it('should be possible to get schedule', function() {
		var schedule = scheduler.get(name);
		should.exist(schedule);
		schedule.name.should.equals(name);
	});

	// -------------------------------------------------------------------------------------- Testing reschedule

	it('should be possible to reschedule', function() {
		scheduler.reschedule(name, '*/30 * * * * *', job);
		var schedule = scheduler.get(name);
		should.exist(schedule);
		schedule.name.should.equals(name);
		schedule.job().should.equals('my awesome job');
	});

	// -------------------------------------------------------------------------------------- Testing remove

	it('should be possible to get schedule', function() {
		scheduler.remove(name);
		var schedule = scheduler.get(name);
		should.not.exist(schedule);
	});

	// -------------------------------------------------------------------------------------- Testing clear

	it('should be possible to get schedule', function() {
		scheduler.add(name, cron, job);
		scheduler.clear();
		var schedule = scheduler.get(name);
		should.not.exist(schedule);
	});

});
