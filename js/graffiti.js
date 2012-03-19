$(document).ready(function() {
	var $body = $("body");
	var $c = $("#c");
	var $can = $("#can");
	var $canimg = $("#can img");
	
	// Makes the can move around like the cursor
	$body.mousemove(function(e) {
	    var x = e.pageX;
	    var y = e.pageY;
	    var w = $canimg.width();
	    var h = $canimg.height();
	    var mx = $c.width();
	    var my = $c.height();
	    var clipx = x + w > mx ? mx - x : w;
	    var clipy = y + h > my ? my - y : h;
	    var rect = "rect(0px " + clipx + "px " + clipy + "px 0px)";
	    $can.css({ left: x, top: y, clip: rect });
	});
	
	$body.mouseout(function(e) {
		$can.hide();
	});
	
	$body.mouseover(function(e) {
		$can.show();
	});
});
	