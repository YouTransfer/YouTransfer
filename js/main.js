
$(function() {
	$('a').click(function(event) {
		event.preventDefault();
		var target = this.getAttribute('href');
		$(window).scrollTo($(target), 1000);
	});
});
