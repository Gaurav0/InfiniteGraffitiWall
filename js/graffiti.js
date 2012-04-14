// Fix for console.log in IE9
if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function () {};

var TILE_SIZE = 512;
var IDLE_TIME = 1000;
var SCROLL_RATE = 8;
var DIAG_SCROLL_RATE = Math.ceil(SCROLL_RATE /  Math.sqrt(2));
var WHEEL_SCROLL_RATE = 24;
var SIDEWALK_SCROLL_RATE = 2.0;
var Mode = "paint";

function InfiniteViewport(canvas) {

    //Get the current URL
    var url = window.location.href;
    if(url.indexOf("@") == -1) {
        locX = 0;
        locY = 0;
    } else {
        var url2 = url.substr(url.lastIndexOf("@") + 1);
        var loc = url2.split(",");
        if(loc.length != 2) {
            locX = 0;
            locY = 0;
        } else {
	        locX = loc[0];
	        locY = loc[1];
        }
    }
    this.posX = locX*TILE_SIZE;
    this.posY = locY*TILE_SIZE;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.color = "rgb(255, 0, 0)";
    this.radius = 12;
    
    // store and handle canvases
    this.canvases = {};
    
    this.getCanvas = function(x, y) {
        if (this.canvases[x])
            if (this.canvases[x][y])
                return this.canvases[x][y];
            else
                return this.newCanvas(x, y);
        else {
            this.canvases[x] = {};
            return this.newCanvas(x, y);
        }
    };
    
    this.inCanvases = function(x, y) {
        if (this.canvases[x])
            if (this.canvases[x][y])
                return true;
            else
                return false;
        else
            return false;
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
    
    this.requestCanvas = function(canvas, x, y, callback) {
        var img = new Image();
        var view = this;
        img.onload = function() {
            canvas.getContext("2d").drawImage(img, 0, 0);
            if (callback)
                callback();
            view.redraw();
        }
        img.src = "/tile?x=" + x + "&y=" + y;
    };
    
    //Draws the spray onto the wall
    this.drawSpray = function(screenX, screenY) {
        var worldX = this.posX + screenX;
        var worldY = this.posY + screenY;
        var tx = Math.floor(worldX / TILE_SIZE);
        var ty = Math.floor(worldY / TILE_SIZE);
        for (var tileX = tx - 1; tileX <= tx + 1; ++tileX)
            for (var tileY = ty - 1; tileY <= ty + 1; ++tileY) {
                //Determine the actual borders of the tile 
                var canvasX = worldX - tileX * TILE_SIZE;
                var canvasY = worldY - tileY * TILE_SIZE;
                //if falls within bounds of tie
                if (canvasX > -this.radius && canvasX < TILE_SIZE + this.radius &&
                        canvasY > -this.radius && canvasY < TILE_SIZE + this.radius) {
                    var cornerX = screenX - canvasX;
                    var cornerY = screenY - canvasY;
                    var currentCanvas = this.getCanvas(tileX, tileY);
                    var currentCtx = currentCanvas.getContext("2d");
                    sprayDetail(currentCtx, canvasX, canvasY, this.radius, this.color);
                    this.ctx.clearRect(cornerX, cornerY, TILE_SIZE, TILE_SIZE);
                    this.ctx.drawImage(currentCanvas, cornerX, cornerY);                
                    currentCanvas.setAttribute("data-saved", "false");
                }
            }
    };
    
    //Registers the caim into the database
    this.claimTile = function (screenX, screenY) {
        //Locates overall position on the wall
        var worldX = this.posX + screenX;
        var worldY = this.posY + screenY;
        //Selects the tile
        var tx = Math.floor(worldX / TILE_SIZE);
        var ty = Math.floor(worldY / TILE_SIZE);
        
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
                //Create an outline around the tiles in claim mode
                if(Mode == "claim")
                    bufferCtx.strokeRect(cornerX, cornerY, TILE_SIZE, TILE_SIZE);
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
    };
    
    this.onMessage = function(message) {
        console.log(message.data);
        var json = JSON.parse(message.data);
        var x = json.x;
        var y = json.y;
        if (this.inCanvases(x, y)) {
            var made = this.makeCanvas();
            var view = this;
            this.requestCanvas(made, x, y, function() {
                view.canvases[x][y] = made;
            });
        }
    };
}

function sprayDetail(context, centerX, centerY, radius, color) {

    var newCanvas = document.createElement("canvas");
    var ctx = newCanvas.getContext("2d");
    ctx.width = 2 * radius;
    ctx.height = 2 * radius;
	var dots = 6;
	var alpha = 1;
	var pi2 = 2 * Math.PI;
	var re = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/
	var m = re.exec(color);
	for (var radi = 0; radi < radius; radi++) {
		var acolor = "rgba(" + m[1] + ", " + m[2] + ", " + m[3] +
		    ", " + alpha + ")";
		ctx.fillStyle = acolor;
		var num = pi2 / dots;
		for (var i = 0; i < pi2; i += num) {
    		var x = Math.cos(i + (Math.random() / 2)) * radi;
    		var y = Math.sin(i + (Math.random() / 2)) * radi;
			ctx.beginPath();
			ctx.arc(radius + x, radius + y, 1, 0, pi2, true);
			ctx.closePath();
			ctx.fill();
    	}
    	dots++;
    	alpha -= 0.5 / radius;
    }
    context.drawImage(newCanvas, centerX - radius, centerY - radius);	
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
    var $sizepicker = $("#sizepicker");
    var $claimtile = $("#claimtile");
    
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
    updatePreview();
    
    // Enable real time updates
    var token = $("#token").val();
    var channel = new goog.appengine.Channel(token);
    var socket = channel.open();
    socket.onopen = function() {}
    socket.onmessage = function(message) {
        view.onMessage(message);
    }
    socket.onerror = function(err) {
        console.log(err.description);
    }
    socket.onclose = function() {}
    
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
        var hash = "@" + Math.round(view.posX / TILE_SIZE) + "," +
        	Math.round(view.posY / TILE_SIZE);
        if (window.history.replaceState)
        	window.history.replaceState(null, window.title, hash);
        else
        	window.location.hash = hash;
        	
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
        if(Mode == "paint")
        {
            view.drawSpray(e.pageX, e.pageY)
            mouseDown = true;
            if ($("#enableSound").attr("checked"))
                spray.play();
            if (saveTimeout != null)
                window.cancelAnimationFrame(saveTimeout);
        }
    });
    
    $wall.mouseup(function(e) {
        if(Mode == "paint")
        {
            mouseDown = false;
            spray.pause();
            if (saveTimeout != null)
                window.cancelAnimationFrame(saveTimeout);
            saveTimeout = window.setTimeout(function() {
                view.saveCanvases();
            }, IDLE_TIME);
        }
    });
    
    $wall.mousemove(function(e) {
        if(Mode == "paint")
        {
            if (mouseDown) {
                view.drawSpray(e.pageX, e.pageY);
                if (saveTimeout != null)
                    window.cancelAnimationFrame(saveTimeout);
                e.preventDefault();
            }
        }
    });
    
    var splitterPos;

    //Initiate claim
    $("#claimtile").click(function() {
        if(Mode == "paint")
        {
            document.getElementById('cursor').src = "images/Claim_Flag.png";
            document.getElementById('mode').src = "images/spraycan.png";
            Mode = "claim";
            view.redraw();
        }else if(Mode == "claim")
        {
            document.getElementById('cursor').src = "images/spraycan.png";
            document.getElementById('mode').src = "images/Claim_Flag.png";
            Mode = "paint";
            view.redraw();
        }
    });
    
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

    function updatePreview() {
        var preview = document.getElementById("preview");
        var previewCtx = preview.getContext("2d");
        previewCtx.clearRect(0, 0, preview.width, preview.height);
        sprayDetail(previewCtx, preview.width / 2, preview.height / 2,
            view.radius, view.color);
    }
    
    // colorpicker
    $("#colorpicker").CanvasColorPicker({
        flat: true,
        width: 300,
        height: 140,
        color: { r: 255, g: 0, b: 0 },
        showButtons: false,
        onColorChange: function(rgb, hsb) {
            view.color = "rgb(" + rgb.r + "," + rgb.g + "," + rgb.b + ")";
            updatePreview();
        }
        
    });
    
    //sizepicker
    $("#sizepicker").slider({
        value: 12,
        min: 4,
        max: 20,
        step: 1,
        orientation: "vertical",
        slide: function(event, ui) {
            view.radius = ui.value;
            updatePreview();
        }
    });
    
    $("#use3dTransforms").change(function (e) {
        if ($(this).attr("checked"))
            $sidewalk.addClass("use3dTransforms");
        else
            $sidewalk.removeClass("use3dTransforms");
    });
    
    
    
});
