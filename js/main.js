
$(function() {
	$('a').click(function() {
		var target = this.getAttribute('href');
		$(window).scrollTo($(target), 1000);
	});
});
