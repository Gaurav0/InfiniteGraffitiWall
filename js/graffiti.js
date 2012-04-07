// Fix for console.log in IE9
if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function () {};

var TILE_SIZE = 512;
var IDLE_TIME = 5000;
var SCROLL_RATE = 8;
var DIAG_SCROLL_RATE = Math.ceil(SCROLL_RATE /  Math.sqrt(2));
var WHEEL_SCROLL_RATE = 24;
var SIDEWALK_SCROLL_RATE = 2.0;

function InfiniteViewport(canvas) {

	this.posX = 0;
	this.posY = 0;
	this.canvas = canvas;
	this.ctx = canvas.getContext("2d");
	this.color = "#ff0000";
	this.radius = 12;
	
	// store and handle canvases
	this.canvases = {};
	
	this.getCanvas = function(x, y) {
		if (this.canvases[x])
			if (this.canvases[x][y])
				return this.canvases[x][y];
			else {
				return this.newCanvas(x, y);
			}
		else {
			this.canvases[x] = {};
			return this.newCanvas(x, y);
		}
	};
	
	this.newCanvas = function(x, y) {
		var made = this.makeCanvas();
		this.requestCanvas(made, x, y);
		this.canvases[x][y] = made;
		return made;
	};

	this.makeCanvas = function() {
		var newCanvas = document.createElement("canvas");
		newCanvas.width = TILE_SIZE;
		newCanvas.height = TILE_SIZE;
		return newCanvas;
	};
	
	this.requestCanvas = function(canvas, x, y) {
		var img = new Image();
		var view = this;
		img.onload = function() {
			canvas.getContext("2d").drawImage(img, 0, 0);
			view.redraw();
		}
		img.src = "/tile?x=" + x + "&y=" + y;
	};
	
	this.drawSpray = function(screenX, screenY) {
		var worldX = this.posX + screenX;
		var worldY = this.posY + screenY;
		var tx = Math.floor(worldX / TILE_SIZE);
		var ty = Math.floor(worldY / TILE_SIZE);
		for (var tileX = tx - 1; tileX <= tx + 1; ++tileX)
			for (var tileY = ty - 1; tileY <= ty + 1; ++tileY) {
				var canvasX = worldX - tileX * TILE_SIZE;
				var canvasY = worldY - tileY * TILE_SIZE;
				if (canvasX > -this.radius && canvasX < TILE_SIZE + this.radius &&
				    	canvasY > -this.radius && canvasY < TILE_SIZE + this.radius) {
					var cornerX = screenX - canvasX;
					var cornerY = screenY - canvasY;
					var currentCanvas = this.getCanvas(tileX, tileY);
					var currentCtx = currentCanvas.getContext("2d");
					currentCtx.fillStyle = this.color;
					currentCtx.beginPath();
					currentCtx.arc(canvasX, canvasY, this.radius, 0, Math.PI*2, true);
					currentCtx.closePath();
					currentCtx.fill();
					this.ctx.drawImage(currentCanvas, cornerX, cornerY);				
					currentCanvas.setAttribute("data-saved", "false");
				}
			}
	};
	
	var buffer = document.createElement('canvas');
	buffer.width = this.canvas.width;
	buffer.height = this.canvas.height;
	var bufferCtx = buffer.getContext("2d");
	
	this.resize = function() {
		buffer.width = this.canvas.width;
		buffer.height = this.canvas.height;
		this.redraw();
	};
	
	this.redraw = function() {
		bufferCtx.clearRect(0, 0, buffer.width, buffer.height);
		var numTilesX = Math.ceil(buffer.width / TILE_SIZE);
		var numTilesY = Math.ceil(buffer.height / TILE_SIZE);
		var startX = Math.floor(this.posX / TILE_SIZE);
		var startY = Math.floor(this.posY / TILE_SIZE);
		var endX = startX + numTilesX;
		var endY = startY + numTilesY;
		for (var tileX = startX; tileX <= endX; ++tileX)
			for (var tileY = startY; tileY <=  endY; ++tileY) {
				var currentCanvas = this.getCanvas(tileX, tileY);
				var cornerX = tileX * TILE_SIZE - this.posX;
				var cornerY = tileY * TILE_SIZE - this.posY;
				bufferCtx.drawImage(currentCanvas, cornerX, cornerY);
			}
		this.ctx.clearRect(0, 0, buffer.width, buffer.height);
		this.ctx.drawImage(buffer, 0, 0);
		
		// Anticipate future requests
		for (var tileX = startX - 1; tileX <= endX + 1; ++tileX)
			for (var tileY = startY - 1; tileY <= endY + 1; ++tileY) {
				this.getCanvas(tileX, tileY);
			}
	};
	
	this.saveCanvases = function() {
		for (var x in this.canvases)
			for (var y in this.canvases[x]) {
				var canvasToSave = this.canvases[x][y];
				if (canvasToSave.getAttribute &&
					canvasToSave.getAttribute("data-saved") == "false") {
					canvasToSave.setAttribute("data-saved", "true");
					var data = canvasToSave.toDataURL("image/png");
					data = data.replace("data:image/png;base64,", "");
					console.log("saving data (" + x + "," + y + ") ...");
					$.ajax({
						url: "/save",
						async: true,
						type: "POST",
						data: {x: x, y: y, data: data},
						success: (function(x, y) {
							return function() {
								console.log("saved (" + x + "," + y + ")");
							}
						})(x, y),
						error: (function(x, y) {
							return function() {
								console.log("Error saving (" + x + "," + y + ")");
							}
						})(x, y),
					});
				}
			}
	}
}

$(document).ready(function() {
	var $wall = $("#wall");
	var $c = $("#c");
	var $can = $("#can");
	var $canimg = $("#can img");
	var $left = $("#left");
	var $right = $("#right");
	var $top = $("#top");
	var $bottom = $("#bottom");
	var $top_left = $("#top_left");
	var $top_right = $("#top_right");
	var $bottom_left = $("#bottom_left");
	var $bottom_right = $("#bottom_right");
	var $sidewalk = $("#sidewalk");
	var $sidewalkbg = $("#sidewalk-bg");
	var $tab = $("#sidewalk-tab");
	var $splitter = $("#splitter");
	
	// Disable dragging can image in Firefox
	$canimg.bind("dragstart", function(e) {
		return false;
	});
	
	// Set canvas width and height
	var c = $c.get(0);
	c.width = $c.width();
	c.height = $c.height();
	
	var view = new InfiniteViewport(c);
	$c.data("view", view);
	view.redraw();
	
	$(window).resize(function(e) {
		c.width = $c.width();
		c.height = $c.height();
		view.resize();
	});
	
	// Makes the can move around like the cursor
	$wall.mousemove(function(e) {
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
	
	$wall.mouseout(function(e) {
		$can.hide();
	});
	
	$wall.mouseover(function(e) {
		$can.show();
	});
	
	// Makes the background scroll when the cursor is at the edges
	var animateDir = "";
	var timeOut = null;
	
	function animate() {
		if (animateDir == "left")
			view.posX -= SCROLL_RATE;
		else if (animateDir == "right")
			view.posX += SCROLL_RATE;
		else if (animateDir == "up")
			view.posY -= SCROLL_RATE;
		else if (animateDir == "down")
			view.posY += SCROLL_RATE;
		else if (animateDir == "leftup") {
			view.posX -= DIAG_SCROLL_RATE;
			view.posY -= DIAG_SCROLL_RATE;
		} else if (animateDir == "rightup") {
			view.posX += DIAG_SCROLL_RATE;
			view.posY -= DIAG_SCROLL_RATE;
		} else if (animateDir == "leftdown") {
			view.posX -= DIAG_SCROLL_RATE;
			view.posY += DIAG_SCROLL_RATE;
		} else if (animateDir == "rightdown") {
			view.posX += DIAG_SCROLL_RATE;
			view.posY += DIAG_SCROLL_RATE;
		} else
			return;
		
		updateBackgroundPosition();
		timeOut = window.requestAnimationFrame(animate);
	}
	
	function updateBackgroundPosition() {
		$wall.css("background-position", -view.posX + "px " + -view.posY + "px");
		var sidewalkX = Modernizr.csstransforms3d &&
			$("#use3dTransforms").attr("checked") ?
			Math.floor(-view.posX * SIDEWALK_SCROLL_RATE) : -view.posX;
		$sidewalkbg.css("background-position", sidewalkX + "px 0px");
		view.redraw();
	}
	
	$left.mouseover(function(e) {
		animateDir = "left";
		animate();
	});
	
	$left.mouseout(function(e) {
		animateDir = "";
		window.cancelAnimationFrame(timeOut);
	});
	
	$right.mouseover(function(e) {
		animateDir = "right";
		animate();
	});
	
	$right.mouseout(function(e) {
		animateDir = "";
		window.cancelAnimationFrame(timeOut);
	});
	
	$top.mouseover(function(e) {
		animateDir = "up";
		animate();
	});
	
	$top.mouseout(function(e) {
		animateDir = "";
		window.cancelAnimationFrame(timeOut);
	});
	
	$bottom.mouseover(function(e) {
		animateDir = "down";
		animate();
	});
	
	$bottom.mouseout(function(e) {
		animateDir = "";
		window.cancelAnimationFrame(timeOut);
	});
	
	$top_left.mouseover(function(e) {
		animateDir = "leftup";
		animate();
	});
	
	$top_left.mouseout(function(e) {
		animateDir = "";
		window.cancelAnimationFrame(timeOut);
	});
	
	$top_right.mouseover(function(e) {
		animateDir = "rightup";
		animate();
	});
	
	$top_right.mouseout(function(e) {
		animateDir = "";
		window.cancelAnimationFrame(timeOut);
	});
	
	$bottom_left.mouseover(function(e) {
		animateDir = "leftdown";
		animate();
	});
	
	$bottom_left.mouseout(function(e) {
		animateDir = "";
		window.cancelAnimationFrame(timeOut);
	});
	
	$bottom_right.mouseover(function(e) {
		animateDir = "rightdown";
		animate();
	});
	
	$bottom_right.mouseout(function(e) {
		animateDir = "";
		window.cancelAnimationFrame(timeOut);
	});
	
	// Makes the background scroll with the mouse wheel
	$wall.mousewheel(function(event, delta, deltaX, deltaY) {
		view.posX -= WHEEL_SCROLL_RATE * deltaX;
		view.posY -= WHEEL_SCROLL_RATE * deltaY;
		updateBackgroundPosition();
	});
	
	var mouseDown = false;
	var saveTimeout = null;
	
	// Audio
	
	var spray = document.getElementById("spray");
	if (typeof spray.loop != "boolean") {
		spray.addEventListener("ended", function() {
			this.currentTime = 0;
			this.play();
		}, false);
	}
	
	// Draw to canvas on mousedown, drag
	$wall.mousedown(function(e) {
		view.drawSpray(e.pageX, e.pageY)
		mouseDown = true;
		if ($("#enableSound").attr("checked"))
			spray.play();
		if (saveTimeout != null)
			window.cancelAnimationFrame(saveTimeout);
	});
	
	$wall.mouseup(function(e) {
		mouseDown = false;
		spray.pause();
		if (saveTimeout != null)
			window.cancelAnimationFrame(saveTimeout);
		saveTimeout = window.setTimeout(function() {
			view.saveCanvases();
		}, IDLE_TIME);
	});
	
	$wall.mousemove(function(e) {
		if (mouseDown) {
			view.drawSpray(e.pageX, e.pageY);
			if (saveTimeout != null)
				window.cancelAnimationFrame(saveTimeout);
			e.preventDefault();
		}
	});
	
	var splitterPos;
	
	// Minimize sidewalk
	$("#minimize").click(function() {
		splitterPos = parseInt($splitter.draggable("widget").css("bottom"));
		$sidewalk.animate({ height: 0 }, "slow", "easeInOutCubic");
		$splitter.animate({ bottom: "-5px" }, "slow", "easeInOutCubic");
		$wall.animate({ bottom: 0 }, {
			duration: "slow", 
			easing: "easeInOutCubic", 
			step: function() {
				c.width = $c.width();
				c.height = $c.height();
				view.resize();
			},
			complete: function() {
				$tab.animate({ bottom: 0 }, "slow", "easeInOutCubic");
			}
		});
	});
	
	// Restore sidewalk
	$tab.click(function() {
		$tab.animate({ bottom: "-40px" },
				"slow", "easeInOutCubic", function() {
			$sidewalk.animate({ height: splitterPos },
				"slow", "easeInOutCubic");
			$splitter.animate({ bottom: splitterPos + "px" },
				"slow", "easeInOutCubic");
			$wall.animate({ bottom: splitterPos + 5 + "px"  }, {
				duration: "slow", 
				easing: "easeInOutCubic", 
				step: function() {
					c.width = $c.width();
					c.height = $c.height();
					view.resize();
				}
			});
		});
	});
	
	// Prevent drawing on tab
	$tab.mousedown(function(e) {
		e.stopPropagation();
	});
	
	$tab.mousemove(function(e) {
		e.stopPropagation();
	});
	
	// Splitter
	$splitter.draggable({
		helper: "clone",
		axis: "y",
		containment: [0, $(window).height() - 250, 0, $(window).height() - 10],
		snap: 'document',
		drag: function(event, ui) {
			$wall.css("bottom", $(window).height() - ui.offset.top + "px");
			$splitter.css("bottom", $(window).height() - ui.offset.top - 5 + "px");
			$sidewalk.height($(window).height() - ui.offset.top - 5);
			c.width = $c.width();
			c.height = $c.height();
			view.resize();
		}
	});
	
	// colorpicker
	$("#colorpicker").CanvasColorPicker({
		flat: true,
		width: 300,
		height: 140,
		color: { r: 255, g: 0, b: 0 },
		showButtons: false,
		onColorChange: function(rgb, hsb) {
			view.color = "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
		}
	});
	
	$("#sizepicker").slider({
		value: 12,
		min: 2,
		max: 20,
		step: 1,
		orientation: "vertical",
		change: function(event, ui) {
			view.radius = ui.value;
		}
	});
	
	$("#use3dTransforms").change(function (e) {
		if ($(this).attr("checked"))
			$sidewalk.addClass("use3dTransforms");
		else
			$sidewalk.removeClass("use3dTransforms");
	});
});
