$(document).ready(function() {
	module("can-cursor");
	
	test("mouseover", function() {
		$("body").simulate("mouseover", {});
		ok(!($("#can").is(":hidden")));
	});
	
	test("mousemove", function() {
		$("body").simulate("mousemove", {
			clientX: 200,
			clientY: 100
		});
		equal($("#can").css("left"), "200px");
		equal($("#can").css("top"), "100px");
	});
	
	test("clip", function() {
		var w = $("#c").width();
		var h = $("#c").height();
		$("body").simulate("mousemove", {
			clientX: w - 10,
			clientY: h - 15
		});
		equal($("#can").css("left"), (w - 10) + "px");
		equal($("#can").css("top"), (h - 15) + "px");
		var rect = $("#can").css("clip").split(",");
		equal(rect[1].trim(), "10px");
		equal(rect[2].trim(), "15px");
		equal($(window).width(), w);
		equal($(window).height(), h);		
	});
	
	test("mouseout", function() {
		$("body").simulate("mouseout", {});
		ok($("#can").is(":hidden"));
	});
	
	QUnit.log = function(result, message) {
		console.log(result + "::" + message);
	};
});