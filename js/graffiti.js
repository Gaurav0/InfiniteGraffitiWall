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
	
	var animateDir = "";
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
		else
			return;
		
		$body.css("background-position", posX + "px " + posY + "px");
		window.setTimeout(animate, 1000 / 60);
	}
	
	$left.mouseover(function(e) {
		animateDir = "left";
		animate();
	});
	
	$left.mouseout(function(e) {
		animateDir = "";
	});
	
	$right.mouseover(function(e) {
		animateDir = "right";
		animate();
	});
	
	$right.mouseout(function(e) {
		animateDir = "";
	});
	
	$top.mouseover(function(e) {
		animateDir = "up";
		animate();
	});
	
	$top.mouseout(function(e) {
		animateDir = "";
	});
	
	$bottom.mouseover(function(e) {
		animateDir = "down";
		animate();
	});
	
	$bottom.mouseout(function(e) {
		animateDir = "";
	});
});
	