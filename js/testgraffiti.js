$(document).ready(function() {
	module("can-cursor");
	
	test("mouseover", function() {
		$("#wall").simulate("mouseover", {});
		ok(!($("#can").is(":hidden")));
	});
	
	test("mousemove", function() {
		$("#wall").simulate("mousemove", {
			clientX: 200,
			clientY: 100
		});
		equal($("#can").css("left"), "200px");
		equal($("#can").css("top"), "100px");
	});
	
	test("clip", function() {
		var w = $("#c").width();
		var h = $("#c").height();
		$("#wall").simulate("mousemove", {
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
		equal($("#wall").width(), w);
		equal($("#wall").height(), h);		
	});
	
	test("mouseout", function() {
		$("#wall").simulate("mouseout", {});
		ok($("#can").is(":hidden"));
	});
	
	module("scroll", {
		setup: function() {
			var view = $("#c").data("view");
			view.posX = 0;
			view.posY = 0;
		}
	});
	
	test("scroll", function() {
		$("#left").simulate("mouseover", {});
		equal($("#wall").css("background-position"), SCROLL_RATE + "px 0px");
		$("#left").simulate("mouseout", {});
		
		$("#right").simulate("mouseover", {});
		equal($("#wall").css("background-position"), "0px 0px");
		$("#right").simulate("mouseout", {});

		$("#top").simulate("mouseover", {});
		equal($("#wall").css("background-position"), "0px " + SCROLL_RATE + "px");
		$("#top").simulate("mouseout", {});

		$("#bottom").simulate("mouseover", {});
		equal($("#wall").css("background-position"), "0px 0px");
		$("#bottom").simulate("mouseout", {});

		$("#top_left").simulate("mouseover", {});
		equal($("#wall").css("background-position"), 
			DIAG_SCROLL_RATE + "px " + DIAG_SCROLL_RATE + "px");
		$("#top_left").simulate("mouseout", {});

		$("#top_right").simulate("mouseover", {});
		equal($("#wall").css("background-position"), "0px " + 2 * DIAG_SCROLL_RATE + "px");
		$("#top_right").simulate("mouseout", {});

		$("#bottom_right").simulate("mouseover", {});
		equal($("#wall").css("background-position"), 
			-DIAG_SCROLL_RATE + "px " + DIAG_SCROLL_RATE + "px");
		$("#bottom_right").simulate("mouseout", {});

		$("#bottom_left").simulate("mouseover", {});
		equal($("#wall").css("background-position"), "0px 0px");
		$("#bottom_left").simulate("mouseout", {});
	});
	
	module("mousewheel-scroll");
	
	/* Test does not work - simulate.js does not support mousewheel
	test("mousewheel-scroll", function() {
		$("#wall").simulate("mousewheel", {
			deltaX: 1,
			deltaY: 1
		});
		equal($("#wall").css("background-position"), "24px 24px");
	});
	*/
	
	// This test never fails on modern browsers;
	// they no longer let you change the size of a window.
	/*
	module("resize", {
		setup: function() {
			this.w = $(window).width();
			this.h = $(window).height();
			window.resizeTo(this.w + 100, this.h - 100);
		},
		
		teardown: function() {
			window.resizeTo(this.w, this.h);
		}
	});
	
	test("resize", function() {
		equal($("#c").get(0).width, $("#c").width());
		equal($("#c").get(0).height, $("#c").height());
	});
	*/
	
	module("Infinite Viewport", {
		setup: function() {
			this.view = new InfiniteViewport($("#c").get(0));
			this.view.drawSpray(300, 200);
		}
	});
	
	test("makeCanvas", function() {
		var c = this.view.makeCanvas();
		equal(c.width, TILE_SIZE);
		equal(c.height, TILE_SIZE);
	});
	
	test("getCanvas", function() {
		var c1 = this.view.getCanvas(0, 0);
		var c2 = this.view.getCanvas(0, 1);
		var c3 = this.view.getCanvas(1, 0);
		var c4 = this.view.getCanvas(0, 0);
		strictEqual(c1, c4);
		deepEqual(c1, c4);
		notEqual(c1, c2);
		notEqual(c1, c3);
	});
	
	test("drawSpray", function() {
	
		// All pixels in this 7 x 7 rectangle should be red or transparent
		var pixels = this.view.ctx.getImageData(297, 197, 7, 7).data;
		for (var i = 0, n = pixels.length; i < n; i += 4) {
		    ok(pixels[i] == 255 || pixels[i] == 0) // red
		    equal(pixels[i+1], 0) // green
		    equal(pixels[i+2], 0) // blue
		}
	});
	
	test("redraw", function() {
	
		var pixels1 = this.view.ctx.getImageData(300, 200, 30, 30).data;
		this.view.posX -= 24;
		this.view.posY -= 24;
		this.view.redraw();
		var pixels2 = this.view.ctx.getImageData(324, 224, 30, 30).data;
		
		// Pixels after redraw (24 off) should be same as before redraw
		for (var i = 0, n = pixels1.length; i < n; i += 4) {
			equal(pixels1[i], pixels2[i]);
			equal(pixels1[i+1], pixels2[i+1]);
			equal(pixels1[i+2], pixels2[i+2]);
		}
	});
	
	module("splitter");
	
	test("dragSplitter", function() {
		$("#splitter").simulate("drag", {
			dx: 0,
			dy: 20
		});
		equal($("#splitter").css("bottom"), "180px");
		equal($("#wall").css("bottom"), "185px");
		equal($("#sidewalk").height(), 180);
	});
	
	module("minimize");
	
	asyncTest("minimize", function() {
		$("#minimize").click();
		window.setTimeout(function() {
			equal($("#sidewalk").height(), 0);
			equal($("#wall").css("bottom"), "0px");
			equal($("#sidewalk-tab").css("bottom"), "0px");
			start();
		}, 1280);
	});
	
	asyncTest("restore", function() {
		$("#sidewalk-tab img").click();
		window.setTimeout(function() {
			ok($("#sidewalk").height() > 0);
			ok(parseInt($("#wall").css("bottom")) > 0);
			ok(parseInt($("#sidewalk-tab").css("bottom")) < 0);
			start();
		}, 1280);
	});
	
	module("colorpicker");
	
	test("colorpicker", function() {
		var cp = $("#colorpicker").data("canvas-color-picker");
		var color = {r: 0, g: 0, b: 255};
		cp.setColor(color);
		cp.colorChanged(color);
		var view = $("#c").data("view");
		equal(view.color, "rgb(0,0,255)");
		cp.SwapColors();
		equal(view.color, "rgb(255,0,0)");
	});
	
});