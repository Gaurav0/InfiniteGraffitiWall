$(document).ready(function() {

	var body = $("body");
	var c = $("#c");
	var can = $("#can");
	
	// Make the can move around like the cursor
	body.mousemove(function(e) {
	    var x = e.pageX;
	    var y = e.pageY;
	    var w = can.width();
	    var h = can.height();
	    var mx = c.width();
	    var my = c.height();
	    can.css({
	        left: x + w < mx ? x : mx - w,
	        top: y + h < my ? y : my - h
	    });
	});
	
	body.mouseout(function(e) {
		can.hide();
	});
	
	body.mouseover(function(e) {
		can.show();
	});

});