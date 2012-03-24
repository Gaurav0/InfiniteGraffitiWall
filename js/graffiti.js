// Fix for console.log in IE9
if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function () {};

$(document).ready(function() {
	var $body = $("body");
	var $c = $("#c");
	var $can = $("#can");
	var $canimg = $("#can img");
	var $left = $("#left");
	var $right = $("#right");
	var $top = $("#top");
	var $bottom = $("#bottom");
	var $top_left = $("#top_left")
	var $top_right = $("#top_right")
	var $bottom_left = $("#bottom_left")
	var $bottom_right = $("#bottom_right")
	
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
	    var rect = "rect(0px, " + clipx + "px, " + clipy + "px, 0px)";
	    $can.css({ left: x, top: y, clip: rect });
	});
	
	$body.mouseout(function(e) {
		$can.hide();
	});
	
	$body.mouseover(function(e) {
		$can.show();
	});
	
	// Makes the background scroll when the cursor is at the edges
	var animateDir = "";
	var timeOut = null;
	var posX = 0;
	var posY = 0;
	
	function animate() {
		if (animateDir == "left")
			posX += 4;
		else if (animateDir == "right")
			posX -= 4;
		else if (animateDir == "up")
			posY += 4;
		else if (animateDir == "down")
			posY -= 4;
		else if (animateDir == "leftup") {
			posX += 3;
			posY += 3;
		} else if (animateDir == "rightup") {
			posX -= 3;
			posY += 3;
		} else if (animateDir == "leftdown") {
			posX += 3;
			posY -= 3;
		} else if (animateDir == "rightdown") {
			posX -= 3;
			posY -= 3;
		} else
			return;
		
		$body.css("background-position", posX + "px " + posY + "px");
		timeOut = window.setTimeout(animate, 1000 / 60);
	}
	
	$left.mouseover(function(e) {
		animateDir = "left";
		animate();
	});
	
	$left.mouseout(function(e) {
		animateDir = "";
		window.clearTimeout(timeOut);
	});
	
	$right.mouseover(function(e) {
		animateDir = "right";
		animate();
	});
	
	$right.mouseout(function(e) {
		animateDir = "";
		window.clearTimeout(timeOut);
	});
	
	$top.mouseover(function(e) {
		animateDir = "up";
		animate();
	});
	
	$top.mouseout(function(e) {
		animateDir = "";
		window.clearTimeout(timeOut);
	});
	
	$bottom.mouseover(function(e) {
		animateDir = "down";
		animate();
	});
	
	$bottom.mouseout(function(e) {
		animateDir = "";
		window.clearTimeout(timeOut);
	});
	
	$top_left.mouseover(function(e) {
		animateDir = "leftup";
		animate();
	});
	
	$top_left.mouseout(function(e) {
		animateDir = "";
		window.clearTimeout(timeOut);
	});
	
	$top_right.mouseover(function(e) {
		animateDir = "rightup";
		animate();
	});
	
	$top_right.mouseout(function(e) {
		animateDir = "";
		window.clearTimeout(timeOut);
	});
	
	$bottom_left.mouseover(function(e) {
		animateDir = "leftdown";
		animate();
	});
	
	$bottom_left.mouseout(function(e) {
		animateDir = "";
		window.clearTimeout(timeOut);
	});
	
	$bottom_right.mouseover(function(e) {
		animateDir = "rightdown";
		animate();
	});
	
	$bottom_right.mouseout(function(e) {
		animateDir = "";
		window.clearTimeout(timeOut);
	});
	
	// Makes the background scroll with the mouse wheel
	$body.mousewheel(function(event, delta, deltaX, deltaY) {
		posX += 24 * deltaX;
		posY += 24 * deltaY;
		$body.css("background-position", posX + "px " + posY + "px");
	});
});
	