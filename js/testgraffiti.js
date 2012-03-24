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
		var rect = $("#can").css("clip")
		if (rect.indexOf(",") != -1)
			rect = rect.split(",")
		else
			rect = rect.split(" ");
		equal(rect[1].trim(), "10px");
		equal(rect[2].trim(), "15px");
		equal($(window).width(), w);
		equal($(window).height(), h);		
	});
	
	test("mouseout", function() {
		$("body").simulate("mouseout", {});
		ok($("#can").is(":hidden"));
	});
	
	module("scroll");
	
	test("scroll", function() {
		$("#left").simulate("mouseover", {});
		equal($("body").css("background-position"), "4px 0px");
		$("#left").simulate("mouseout", {});
		
		$("#right").simulate("mouseover", {});
		equal($("body").css("background-position"), "0px 0px");
		$("#right").simulate("mouseout", {});

		$("#top").simulate("mouseover", {});
		equal($("body").css("background-position"), "0px 4px");
		$("#top").simulate("mouseout", {});

		$("#bottom").simulate("mouseover", {});
		equal($("body").css("background-position"), "0px 0px");
		$("#bottom").simulate("mouseout", {});

		$("#top_left").simulate("mouseover", {});
		equal($("body").css("background-position"), "3px 3px");
		$("#top_left").simulate("mouseout", {});

		$("#top_right").simulate("mouseover", {});
		equal($("body").css("background-position"), "0px 6px");
		$("#top_right").simulate("mouseout", {});

		$("#bottom_right").simulate("mouseover", {});
		equal($("body").css("background-position"), "-3px 3px");
		$("#bottom_right").simulate("mouseout", {});

		$("#bottom_left").simulate("mouseover", {});
		equal($("body").css("background-position"), "0px 0px");
		$("#bottom_left").simulate("mouseout", {});
	});
	
	module ("mousewheel-scroll");
	
	/* Test does not work - simulate.js does not support mousewheel
	test("mousewheel-scroll", function() {
		$("body").simulate("mousewheel", {
			deltaX: 1,
			deltaY: 1
		});
		equal($("body").css("background-position"), "24px 24px");
	});
	*/
	
	QUnit.log = function(result, message) {
		console.log(result + "::" + message);
	};
});