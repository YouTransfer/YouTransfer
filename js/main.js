
$(function() {
	$('[data-scrollto]').click(function(event) {
		event.preventDefault();
		var target = this.getAttribute('data-target');
		$(window).scrollTo($(target), 1000);
	});
});
