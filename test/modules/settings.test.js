
// ------------------------------------------------------------------------------------------ Test Dependencies

var should = require('chai').should();
var settings = require('../../lib/settings.js')({
	path: './test/modules/settings.json'
});

// ------------------------------------------------------------------------------------------ Test Definition

describe('YouTransfer Settings module', function() {
	var title = "My Awesome Title";

	// -------------------------------------------------------------------------------------- Testing constructor

	it('should be possible to set options', function() {
		settings.options.path.should.equal('./test/modules/settings.json');
	});

	// -------------------------------------------------------------------------------------- Testing write

	it('should be possible to set title', function() {
		settings.push({ title: title }, function(err) {
			should.not.exist(err);
		});
	});

	// -------------------------------------------------------------------------------------- Testing read

	it('should be possible to get title', function() {
		settings.get(function(err, output) {
			should.not.exist(err);
			output.title.should.equal(title);
		});
	});
});
