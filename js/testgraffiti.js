$(document).ready(function() {
	module("can-cursor");
	
	test("mouseover", function() {
		$("body").simulate("mouseover", {});
		ok(!($("#can").is(":hidden")));
	});
	
	test("mousemove", function() {
		$("body").simulate("mousemove", {
			clientX: 200,
			clientY: 100,
			screenX: 200,
			screenY: 100
		});
		equal($("#can").css("left"), "200px");
		equal($("#can").css("top"), "100px");
	});
	
	test("mouseout", function() {
		$("body").simulate("mouseout", {});
		ok($("#can").is(":hidden"));
	});
	
	QUnit.log = function(result, message) {
		console.log(result + "::" + message);
	};
});