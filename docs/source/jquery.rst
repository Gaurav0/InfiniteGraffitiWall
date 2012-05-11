Jquery
======
.. toctree::
   :maxdepth: 2
   
Canvas
------   

.. js:function:: InfiniteViewport(canvas)

	* Get the current URL
	
	* Stores and handles canvases
	
	* Draws the spray onto the wall
	
	* Erase stuff on the wall
	
	* Creates outline around tiles in claim mode
	
	* Stores claim into database
	
	* Checks if a claim exists
	
.. js:function:: erase(context, centerX, centerY, radius, color)

	* function to erase on the wall

.. js:function:: drawCircularOutline(context, centerX, centerY, radius, color)

	* defines the spray 
	
	:default: 	color = red,
				size = 12

.. js:function:: sprayDetail(context, centerX, centerY, radius, color)

	*function to change the spray color and size
	
Document Ready
--------------

.. js:function:: document.ready()

	* Sets canvas width and height
	
	* Enable real time updates
	
	* Cursor becomes the spraycan
	
	* Makes background scrollable when cursor reaches edge
	
	* Makes background scrollabe with mouse wheel
	
	* Draw to canvas on mouse click and drag
	
	* Prevent scroll on touch move
	
	* Scroll with two fingers (for mobile devices)
	
.. js:function:: $undo.click()

	* Undo last draw
	
.. js:function:: "#spraycan_mode".click()

	* Sets cursor to spraycan mode
	
.. js:function:: "#eraser_mode".click()

	* Sets cursor to eraser mode

.. js:function:: "#claim_mode".click()

	* Sets cursor to claim wall mode

.. js:function:: "#unclaim_mode".click()

	* Sets cursor to unclaim wall mode
	
.. js:function:: "#minimize".click()

	* Hides the sidewalk
	
.. js:function:: "tab.click()

	* Restores the sidewalk
	
.. js:function:: $splitter.draggable()

	* Ablitity to change the size the sidewalk
	
.. js:function:: updatePreview()

	* Shows the size and color of the spray on the preview
	
.. js:function:: "#colorpicker".CanvasColorPicker()

	* Ablitity to choose color for the spray
	
.. js:function:: "#sizepicker".slider()

	* Ablitity to choose size for the spray

.. js:function:: "#use3dTransforms".change()

	* Ablitity to change size from 3D to 2D
	
.. js:function:: "#ChatInput".keypress()

	* Ablitity to write a message
	
.. js:function:: "#Submit".click()

	* Ablitity to send message written 

	

Files
-----
| graffiti.js
