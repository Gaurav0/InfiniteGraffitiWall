// Fix for console.log in IE9
if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function () {};

var TILE_SIZE = 512;
var IDLE_TIME = 1000;
var SCROLL_RATE = 8;
var DIAG_SCROLL_RATE = Math.ceil(SCROLL_RATE /  Math.sqrt(2));
var WHEEL_SCROLL_RATE = 24;
var SIDEWALK_SCROLL_RATE = 2.0;
var MAX_TILECLAIMS_PER_USER = 10;
var BORDER_SIZE = 30;

var Mode = "paint";

//An array that holds 0 for every tile viewed in unclaim mode that has not been claimed.
//And 1 for every tile viewed in unclaim mode that has been claimed.
//Used to avoid making a database call for every tile every time the screen moves.
var viewClaimedTiles = new Array ();

function InfiniteViewport(canvas) {

    //Get the current URL
    var url = window.location.href;
    var locX, locY;
    if(url.indexOf("@") == -1) {
    	locX = parseInt(window.localStorage.getItem("x"));
    	locY = parseInt(window.localStorage.getItem("y"));
    	if (isNaN(locX) || isNaN(locY)) {
    		locX = parseInt($("#locX").val());
    		locY = parseInt($("#locY").val());
    	}
    } else {
        var url2 = url.substr(url.lastIndexOf("@") + 1);
        var loc = url2.split(",");
        if(loc.length != 2) {
	    	locX = parseInt(window.localStorage.getItem("x"));
	    	locY = parseInt(window.localStorage.getItem("y"));
    		if (isNaN(locX) || isNaN(locY)) {
	    		locX = parseInt($("#locX").val());
	    		locY = parseInt($("#locY").val());
	    	}
        } else {
	        locX = loc[0];
	        locY = loc[1];
        }
    }
    
    this.posX = locX * TILE_SIZE;
    this.posY = locY * TILE_SIZE;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.color = "rgb(255, 0, 0)";
    this.radius = 12;
    
    // store and handle canvases
    this.canvases = {};
    this.oldcanvases = {};
    
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
        newCanvas.setAttribute("data-cloned", "false");
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
   
	this.cloneCanvas = function(oldCanvas, x, y) {
		var newCanvas = document.createElement('canvas');
        newCanvas.width = TILE_SIZE;
        newCanvas.height = TILE_SIZE;
    	var context = newCanvas.getContext('2d');
    	context.drawImage(oldCanvas, 0, 0);
		if (!this.oldcanvases[x])
			this.oldcanvases[x] = {};
		this.oldcanvases[x][y] = newCanvas;
		oldCanvas.setAttribute("data-cloned", "true");
	};

	this.swapCanvases = function() {
		for (var x in this.canvases)
			for (var y in this.canvases[x])
				if (this.oldcanvases[x])
					if (this.oldcanvases[x][y]) {
						var tmp = this.oldcanvases[x][y];
						this.oldcanvases[x][y] = this.canvases[x][y];
						this.canvases[x][y] = tmp;
					}
	};
	
	this.resetCanvases = function() {
		this.oldcanvases = {};
		for (var x in this.canvases)
			for (var y in this.canvases[x])
				this.canvases[x][y].setAttribute("data-cloned", "false");
	}
	
	// Any changes to the wall go through this function
	// Callback: the function to edit one tile; should take arguments
	// context, centerX, centerY, radius, color
	this.editWall = function(screenX, screenY, callback) {
        var worldX = this.posX + screenX;
        var worldY = this.posY + screenY;
        var tx = Math.floor(worldX / TILE_SIZE);
        var ty = Math.floor(worldY / TILE_SIZE);
        window.localStorage.setItem("x", tx);
        window.localStorage.setItem("y", ty);
        for (var tileX = tx - 1; tileX <= tx + 1; ++tileX)
            for (var tileY = ty - 1; tileY <= ty + 1; ++tileY) {
                //Determine the actual borders of the tile 
                var canvasX = worldX - tileX * TILE_SIZE;
                var canvasY = worldY - tileY * TILE_SIZE;
                //if falls within bounds of tile
                if (canvasX > -this.radius && canvasX < TILE_SIZE + this.radius &&
                        canvasY > -this.radius && canvasY < TILE_SIZE + this.radius) {
                    var cornerX = screenX - canvasX;
                    var cornerY = screenY - canvasY;
                    var currentCanvas = this.getCanvas(tileX, tileY);
					// clone canvas
                    if (currentCanvas.getAttribute("data-cloned") == "false")
                        this.cloneCanvas(currentCanvas, tileX, tileY);
                    var currentCtx = currentCanvas.getContext("2d");
                    callback(currentCtx, canvasX, canvasY, this.radius, this.color);
                    this.ctx.clearRect(cornerX, cornerY, TILE_SIZE, TILE_SIZE);
                    this.ctx.drawImage(currentCanvas, cornerX, cornerY);                
                    currentCanvas.setAttribute("data-saved", "false");
                }
            }
    };
 
    //Draws the spray onto the wall
    this.drawSpray = function(screenX, screenY) {
    	this.editWall(screenX, screenY, sprayDetail)
    };
    
    //Erases stuff on the wall
    this.erase = function(screenX, screenY) {
    	this.editWall(screenX, screenY, erase)
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
                if (Mode == "claim") {
                    bufferCtx.strokeRect(cornerX, cornerY, TILE_SIZE, TILE_SIZE);
                } else if (Mode == "unclaim") {
                    var i = 0;
                    var tileincach = 0;
                    var hastileclaim = 0;
                    while (i < viewClaimedTiles.length && tileincach == 0) {
                        if (viewClaimedTiles[i] === tileX && viewClaimedTiles[i+1] === tileY) {
                            hastileclaim = viewClaimedTiles[i+2];
                            tileincach = 1;
                        }
                        i += 3;
                    }
                    
                    if (tileincach === 0) {
                    	var view = this;
                        $.ajax({
                            url: "/hasclaimontile?x=" + tileX + "&y=" + tileY,
                            async: true,
                            type: "GET",
                            success: (function(tileX, tileY) {
                            	return function(result) {
                                    viewClaimedTiles.push(tileX);
                                    viewClaimedTiles.push(tileY);
                                    viewClaimedTiles.push(parseInt(result));
                                    view.redraw();
                            	}
                            })(tileX, tileY)
                        });
                    }
                    
                    if (hastileclaim === 1) {
                        bufferCtx.strokeStyle = '#0f0';
                        bufferCtx.lineWidth = 2;
                        bufferCtx.strokeRect(cornerX+2, cornerY+2, TILE_SIZE-4, TILE_SIZE-4);
                        bufferCtx.strokeStyle = '#000';
                        bufferCtx.lineWidth = 1;
                    }
                    bufferCtx.strokeRect(cornerX, cornerY, TILE_SIZE, TILE_SIZE);
                }
            }
        this.ctx.clearRect(0, 0, buffer.width, buffer.height);
        this.ctx.drawImage(buffer, 0, 0);
        
        // Anticipate future requests
        for (var tileX = startX - 1; tileX <= endX + 1; ++tileX)
            for (var tileY = startY - 1; tileY <= endY + 1; ++tileY) {
                this.getCanvas(tileX, tileY);
            }
        console.log(viewClaimedTiles);
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
                    console.log("informing claimed users (" + x + "," + y + ") ...");
                    $.ajax({
                        url: "/informclaim",
                        async: true,
                        type: "POST",
                        data: {x: x, y: y},
                    });
                }
            }
    };
    
    //Registers the claim into the database
    this.claimTile = function (screenX, screenY) {
        //Locates overall position on the wall
        var worldX = this.posX + screenX;
        var worldY = this.posY + screenY;
        //Selects the tile
        var tx = Math.floor(worldX / TILE_SIZE);
        var ty = Math.floor(worldY / TILE_SIZE);
        
        $.ajax({
            url: "/howmenytiles",
            async: false,
            type: "GET",
            success: (function(result){
                user_tile_claims = parseInt(result);
            })
        })
        
        if(user_tile_claims < MAX_TILECLAIMS_PER_USER) {
            $.ajax({
            url: "/claim",
            async: true,
            type: "POST",
            data: {x: tx, y: ty},
                success: (function(tx, ty) {
                    return function() {
                        console.log("claim made (" + tx + "," + ty + ")");
                        /*
                        alert("You have claimed tile " + 
                        	tx + "," + ty + "\n" +
                        	"If someone else draws on this tile you will be " + 
                        	"notified by email" + "\n" + 
                    		"(max 1 per day per tile)");
                    	*/
                        $("#onClaimX").text(tx);
                        $("#onClaimY").text(ty);
                        $("#onClaim").dialog("open");
                        //add to cach
                        var i = 0;
                        var tileincach = 0;
                        while(i < viewClaimedTiles.length && tileincach == 0) {
                            if(viewClaimedTiles[i] === tx && viewClaimedTiles[i+1] === ty) {
                                hastileclaim = viewClaimedTiles[i+2]
                                tileincach = 1;
                            }
                            i = i + 3;
                        }
                        
                        i = i - 3;
                        
                        if(tileincach === 1) {
                            viewClaimedTiles[i+2] = 1;
                        } else {
                            viewClaimedTiles.push(tx);
                            viewClaimedTiles.push(ty);
                            viewClaimedTiles.push(1);
                        }
                    }
                })(tx, ty),
                error: (function(tx, ty) {
                    return function() {
                        console.log("claim error (" + tx + "," + ty + ")");
                    }
                })(tx, ty),
            });
        } else {
            /* alert("Any user may only claim upto 10 tiles \n If you want to claim this tile please unclaim some other tile."); */
        	$("tooManyClaims").dialog("open");
        }
    };
    
    //Checks if a claim exists on a tile and remove it if it does
    this.unclaimTile = function (screenX, screenY) {
        //Locates overall position on the wall
        var worldX = this.posX + screenX;
        var worldY = this.posY + screenY;
        //Selects the tile
        var tx = Math.floor(worldX / TILE_SIZE);
        var ty = Math.floor(worldY / TILE_SIZE);
        
        var i = 0;
        var tileincach = 0;
        var hastileclaim = 0;
        while (i < viewClaimedTiles.length && tileincach == 0) {
            if(viewClaimedTiles[i] === tx && viewClaimedTiles[i+1] === ty) {
                hastileclaim = viewClaimedTiles[i+2]
                tileincach = 1;
            }
            i += 3;
        }
        i -= 3;
        
        if (hastileclaim === 1) {
            $.ajax({
            url: "/unclaim",
            async: true,
            type: "POST",
            data: {x: tx, y: ty},
                success: (function(tx, ty) {
                    return function() {
                        console.log("claim removed (" + tx + "," + ty + ")");
                        /*
	                    alert("You have unclaimed tile " + 
	                    	tx + "," + ty + "\n" +
	                    	"You will nolonger be notified if someone  draws on this tile" + "\n");
	                    */
                        $("#onUnClaimX").text(tx);
                        $("#onUnClaimY").text(ty);
                        $("#onUnClaim").dialog("open");
                    }
                })(tx, ty),
                error: (function(tx, ty) {
                    return function() {
                        console.log("unclaim error (" + tx + "," + ty + ")");
                    }
                })(tx, ty),
            });
            
            viewClaimedTiles[i+2] = 0;
            this.redraw();
            //Change it to unclaimed in the array.
        } else {
            /*alert("You do not have a claim on this tile. \n The tiles you have claimed should be outlined in green.");*/
        	$("#notClaimed").dialog("open");
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
    
    this.onMessageChat = function(message) {
        console.log(message.data);
        var json = JSON.parse(message.data);
        var Message = json.Message;
        var User = json.Sender;
        var currentTime = new Date();
        
        if(String(currentTime.getMinutes()).length <2)
        {
            minutes = "0" + String(currentTime.getMinutes());
        }else{
            minutes = String(currentTime.getMinutes());
        }
        
        document.getElementById("chatbox").innerHTML += "<br/> " + User + ": " + Message + " <font size='1' color=gray>(" + currentTime.getHours() + ":" + minutes + ")</font>";
        document.getElementById("chatbox").scrollTop = 9999999;
    };
}

//function to erase on the wall
function erase(context, centerX, centerY, radius, color) {
	context.save();
	context.beginPath();
	context.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
	context.closePath();
	context.clip();
	context.clearRect(centerX - radius, centerY - radius, 2 * radius, 2 * radius);
	context.restore();
}

//defines the spray
//default: 	color = red
//			size = 12
function drawCircularOutline(context, centerX, centerY, radius, color) {
	context.beginPath();
	context.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
	context.closePath();
	context.strokeStyle = "#000000";
	context.stroke();
}

//function to changing the spray color and size
function sprayDetail(context, centerX, centerY, radius, color) {

    var newCanvas = document.createElement("canvas");
    var ctx = newCanvas.getContext("2d");
    ctx.width = 2 * radius;
    ctx.height = 2 * radius;
	var dots = 1;
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
    		var x = Math.floor(Math.cos(i + (Math.random() / 2)) * radi);
    		var y = Math.floor(Math.sin(i + (Math.random() / 2)) * radi);
			ctx.fillRect(radius + x, radius + y, 1, 1);
    	}
    	dots += 5;
    	alpha -= 0.9 / radius;
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
    var $spraycan_mode = $("#spraycan_mode");
    var $eraser_mode = $("#eraser_mode");
    var $claim_mode = $("#claim_mode");
    var $unclaim_mode = $("#unclaim_mode");
    var $undo = $("#undo_button");
    
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
    updateBackgroundPosition();
    updatePreview();
    

    document.getElementById('mode_paint').src = "images/spraycan.png";
    document.getElementById('mode_erase').src = "images/eraser.png";
    if(user_login == 1) {
        document.getElementById('mode_claim').src = "images/Claim_Flag.png";
        document.getElementById('mode_unclaim').src = "images/Un_Claim_Flag.png";
    }
    
    // Enable real time updates
    var token = $("#token").val();
    var channel = new goog.appengine.Channel(token);
    var socket = channel.open();
    socket.onopen = function() {}
    socket.onmessage = function(message) {
        var json = JSON.parse(message.data);
        if(json.Type == "Tile")
        {
            view.onMessage(message);
        }else if(json.Type == "Chat")
        {
            view.onMessageChat(message);
        }
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
    
    socket.onerror = function(err) {
        console.log(err.description);
    }
    
    socket.onclose = function() {}
    
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
    
    // Audio
    
    var spray = document.getElementById("spray");
    if (typeof spray.loop != "boolean") {
        spray.addEventListener("ended", function() {
            this.currentTime = 0;
            this.play();
        }, false);
    }
    
    var mouseDown = false;
    var saveTimeout = null;
    
    function checkInBounds(x, y) {
    	var minX = BORDER_SIZE;
    	var minY = BORDER_SIZE;
    	var maxX = $wall.width() - BORDER_SIZE;
    	var maxY = $wall.height() - BORDER_SIZE;
    	return x > minX && x < maxX && y > minY && y < maxY;
    }
    
    // Draw to canvas on mousedown, drag
    $wall.mousedown(function(e) {
        if (Mode == "paint") {
        	if (checkInBounds(e.pageX, e.pageY)) {
        		$undo.text("Undo");
        		view.resetCanvases();
            	view.drawSpray(e.pageX, e.pageY);
        	}
            mouseDown = true;
            if ($("#enableSound").attr("checked"))
                spray.play();
            if (saveTimeout != null)
                window.cancelAnimationFrame(saveTimeout);
        } else if (Mode == "erase") {
        	if (checkInBounds(e.pageX, e.pageY)) {
        		$undo.text("Undo");
        		view.resetCanvases();
        		view.erase(e.pageX, e.pageY)
        	}
        	mouseDown = true;
            if (saveTimeout != null)
                window.cancelAnimationFrame(saveTimeout);
        } else if (Mode == "claim") {
            view.claimTile(e.pageX, e.pageY)
        } else if (Mode == "unclaim") {
            view.unclaimTile(e.pageX, e.pageY);
        }
    });
    
    $wall.mouseup(function(e) {
        if (Mode == "paint" || Mode == "erase") {
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
        if(Mode == "paint" || Mode == "erase") {
            if (mouseDown) {
        		if (checkInBounds(e.pageX, e.pageY)) {
        			if (Mode == "erase")
        				view.erase(e.pageX, e.pageY)
        			else
        				view.drawSpray(e.pageX, e.pageY);
        		}
                if (saveTimeout != null)
                    window.cancelAnimationFrame(saveTimeout);
                e.preventDefault();
            }
        }
    });
    
	// Undo / Redo
    
	$undo.click(function() {
		view.swapCanvases();
		view.redraw();
		if ($undo.text() == "Undo")
			$undo.text("Redo");
		else
			$undo.text("Undo");
        if (saveTimeout != null)
            window.cancelAnimationFrame(saveTimeout);
        saveTimeout = window.setTimeout(function() {
            view.saveCanvases();
        }, IDLE_TIME);
	});
    
    // Prevent scroll on touch move
    $("body").get(0).addEventListener("touchmove", function(e) {
    	e.preventDefault();
    }, false);
    
    var lastX0 = -1;
    var lastY0 = -1;
    var lastX1 = -1;
    var lastY1 = -1;
    
    // Scroll with two fingers on touch move (for mobile devices)
    $wall.get(0).addEventListener("touchmove", function(e) {
    	var touches = e.targetTouches;
    	if (touches.length == 2) {
    		if (lastX0 == -1) {
    			lastX0 = touches[0].pageX;
    			lastX1 = touches[1].pageX;
    			lastY0 = touches[0].pageY;
    			lastY1 = touches[1].pageY;
    		} else {
    			deltaX0 = touches[0].pageX - lastX0;
    			deltaX1 = touches[1].pageX - lastX1;
    			deltaY0 = touches[0].pageY - lastY0;
    			deltaY1 = touches[1].pageY - lastY1;
    			deltaX = Math.abs(deltaX0) < Math.abs(deltaX1) ? deltaX0 : deltaX1;
    			deltaY = Math.abs(deltaY0) < Math.abs(deltaY1) ? deltaY0 : deltaY1;
    			view.posX -= deltaX;
    			view.posY -= deltaY;
    		}
    	}
    }, false);
    
    // Dialogs
    $(".dialog").dialog({
    	show: "fadeIn",
    	hide: "fadeOut",
    	autoOpen: false,
    	buttons: {
    		"OK": function() {
    			$(this).dialog("close");
    		}
    	}
    });

    //Mode buttons
	//Sets cursor to spraycan mode
    $("#spraycan_mode").click(function() {
        if(Mode != "paint") {
            document.getElementById('cursor').src = "images/spraycan.png";
            Mode = "paint";
            view.redraw();
            updatePreview();
        }
    });
	//Sets cursor to eraser mode
    $("#eraser_mode").click(function() {
        if(Mode != "erase") {
            document.getElementById('cursor').src = "images/eraser.png";
            Mode = "erase";
            view.redraw();
            updatePreview();
        }
    });
	//Sets cursor to claim mode
    $("#claim_mode").click(function() {
        if(Mode != "claim") {
            document.getElementById('cursor').src = "images/Claim_Flag.png";
            Mode = "claim";
            view.redraw();
        }
    });
	//Sets cursor to unclaim mode
    $("#unclaim_mode").click(function() {
        if(Mode != "unclaim") {
            document.getElementById('cursor').src = "images/Un_Claim_Flag.png";
            Mode = "unclaim";
            view.redraw();
        }
    });
    
    var splitterPos;
    
    // Minimize sidewalk & Hides the sidewalk
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
    
    // Ablitity to change the size of the sidewalk
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
	
	// shows the size and color of the spray on the preview
    function updatePreview() {
        var preview = document.getElementById("preview");
        var previewCtx = preview.getContext("2d");
        previewCtx.clearRect(0, 0, preview.width, preview.height);
        if (Mode == "paint")
	        sprayDetail(previewCtx, preview.width / 2, preview.height / 2,
	            view.radius, view.color);
        else if (Mode == "erase")
        	drawCircularOutline(previewCtx, preview.width / 2, preview.height / 2,
    	        view.radius);
    }
    
    // Ability to choose color for the spray
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
    
    //Abliity to choose size for the spray
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
    // Ablitity to change size from 3D to 2D
    $("#use3dTransforms").change(function (e) {
        if ($(this).attr("checked"))
            $sidewalk.addClass("use3dTransforms");
        else
            $sidewalk.removeClass("use3dTransforms");
    });
    

    //Chat functionality: Send message, enter or press buttn
    $("#ChatInput").keypress(function(e){
        if(e.which == 13){
            console.log("Sending message (" + document.getElementById('ChatInput').value + ") ...");
            $.ajax({
                url: "/sendmessage",
                async: true,
                type: "POST",
                data: {message: document.getElementById('ChatInput').value},
                success: (function() {
                    return function() {
                        document.getElementById('ChatInput').value = "";
                    }
                })(),
            });
        }
    });
    //Ablitity to send messages written
    $("#Submit").click(function() {
        console.log("Sending message (" + document.getElementById('ChatInput').value + ") ...");
        $.ajax({
            url: "/sendmessage",
            async: true,
            type: "POST",
                data: {message: document.getElementById('ChatInput').value},
            success: (function() {
                return function() {
                    document.getElementById('ChatInput').value = "";
                }
            })(),
        });
    });
});
