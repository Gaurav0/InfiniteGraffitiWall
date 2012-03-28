// Fix for console.log in IE9
if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function () {};

var TILE_SIZE = 256;
var IDLE_TIME = 5000;

function InfiniteViewport(canvas) {

	this.posX = 0;
	this.posY = 0;
	this.width = canvas.width;
	this.height = canvas.height;
	this.ctx = canvas.getContext("2d");
	
	// store and handle canvases
	this.canvases = {};
	
	this.getCanvas = function(x, y) {
		if (this.canvases[x])
			if (this.canvases[x][y])
				return this.canvases[x][y];
			else {
				var made = this.makeCanvas();
				this.canvases[x][y] = made;
				return made;
			}
		else {
			this.canvases[x] = {};
			var made = this.makeCanvas();
			this.canvases[x][y] = made;
			return made;
		}
	};

	this.makeCanvas = function() {
		var newCanvas = document.createElement("canvas");
		newCanvas.width = TILE_SIZE;
		newCanvas.height = TILE_SIZE;
		return newCanvas;
	};
	
	var RADIUS = 12;
	
	this.drawSpray = function(screenX, screenY) {
		var worldX = this.posX + screenX;
		var worldY = this.posY + screenY;
		var tx = Math.floor(worldX / TILE_SIZE);
		var ty = Math.floor(worldY / TILE_SIZE);
		for (var tileX = tx - 1; tileX <= tx + 1; ++tileX)
			for (var tileY = ty - 1; tileY <= ty + 1; ++tileY) {
				var canvasX = worldX - tileX * TILE_SIZE;
				var canvasY = worldY - tileY * TILE_SIZE;
				if (canvasX > -RADIUS && canvasX < TILE_SIZE + RADIUS &&
				    	canvasY > -RADIUS && canvasY < TILE_SIZE + RADIUS) {
					var cornerX = screenX - canvasX;
					var cornerY = screenY - canvasY;
					var currentCanvas = this.getCanvas(tileX, tileY);
					var currentCtx = currentCanvas.getContext("2d");
					currentCtx.fillStyle="#ff0000";
					currentCtx.beginPath();
					currentCtx.arc(canvasX, canvasY, RADIUS, 0, Math.PI*2, true);
					currentCtx.closePath();
					currentCtx.fill();
					this.ctx.drawImage(currentCanvas, cornerX, cornerY);				
					currentCanvas.setAttribute("data-saved", "false");
				}
			}
	};
	
	var buffer = document.createElement('canvas');
	buffer.width = this.width;
	buffer.height = this.height;
	var bufferCtx = buffer.getContext("2d");
	
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
		this.ctx.clearRect(0, 0, this.width, this.height);
		this.ctx.drawImage(buffer, 0, 0);
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
					var post = "{x:" + x + ",y:" + y + ",data:'" + data + "'}";
					console.log(post);
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
	var $sidewalkbg = $("#sidewalk-bg");
	
	// Disable dragging can image in Firefox
	$canimg.bind("dragstart", function(e) {
		return false;
	});
	
	// Set canvas width and height
	var c = $c.get(0);
	c.width = $c.width();
	c.height = $c.height();
	
	var view = new InfiniteViewport(c);
	
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
			view.posX -= 4;
		else if (animateDir == "right")
			view.posX += 4;
		else if (animateDir == "up")
			view.posY -= 4;
		else if (animateDir == "down")
			view.posY += 4;
		else if (animateDir == "leftup") {
			view.posX -= 3;
			view.posY -= 3;
		} else if (animateDir == "rightup") {
			view.posX += 3;
			view.posY -= 3;
		} else if (animateDir == "leftdown") {
			view.posX -= 3;
			view.posY += 3;
		} else if (animateDir == "rightdown") {
			view.posX += 3;
			view.posY += 3;
		} else
			return;
		
		$wall.css("background-position", -view.posX + "px " + -view.posY + "px");
		var sidewalkX = Modernizr.csstransforms3d ? Math.floor(-view.posX * 1.4) : -view.posX;
		$sidewalkbg.css("background-position", sidewalkX + "px 0px");
		view.redraw();
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
	$wall.mousewheel(function(event, delta, deltaX, deltaY) {
		view.posX -= 24 * deltaX;
		view.posY -= 24 * deltaY;
		$wall.css("background-position", -view.posX + "px " + -view.posY + "px");
		var sidewalkX = Modernizr.csstransforms3d ? Math.floor(-view.posX * 1.4) : -view.posX;
		$sidewalkbg.css("background-position", sidewalkX + "px 0px");
		view.redraw();
	});
	
	var mouseDown = false;
	var saveTimeout = null;
	
	// Draw to canvas on mousedown, drag
	$wall.mousedown(function(e) {
		view.drawSpray(e.pageX, e.pageY)
		mouseDown = true;
		if (saveTimeout != null)
			window.clearTimeout(saveTimeout);
	});
	
	$wall.mouseup(function(e) {
		mouseDown = false;
		if (saveTimeout != null)
			window.clearTimeout(saveTimeout);
		saveTimeout = window.setTimeout(function() {
			view.saveCanvases();
		}, IDLE_TIME);
	});
	
	$wall.mousemove(function(e) {
		if (mouseDown) {
			view.drawSpray(e.pageX, e.pageY);
			if (saveTimeout != null)
				window.clearTimeout(saveTimeout);
			e.preventDefault();
		}
	});
});
