Main files
==========

.. toctree::
   :maxdepth: 2
   
.. py:class:: MainPage(webapp2.RequestHandler)
	
	.. py:method:: MainPage.dispatchs(self)
	
	| Call to either / or /@x,y.
	| The first is opens the graffiti wall at a random tile.
	| The second is opens the graffiti wall at tile x, y
		
	.. py:method:: MainPage.session(self)
	
	:returns: a session using the default cookie key.
		
	.. py:method:: MainPage.get(self, location)
	
	| Shows login button if not logged in, otherwise shows logout.
	| Creates a new channel for use with live updates and chat.
	| If location is unspecified, use a random initial tile.
	| Output created using template index.html

	:param: location: x, y of tile to display when opening the graffiti wall
		
		
.. py:class:: TestPage(webapp2.RequestHandler)
	
| Call to /unittests
| Returns a page which will run client side QUnit tests
	
	.. py:method:: TestPage.get(self)
	
	| Shows login button if not logged in, otherwise shows logout.
	| Output created using template unittests.html
		
.. py:class:: GetTile(webapp2.RequestHandler)

	| Call to /tile

	:returns: a png

	.. py:method:: GetTile.get(self)
		
	| Generate a response to /tile?x=<tileX>&y=<tileY>
	| If a record exists in the datastore for tileX, tileY,
	
	:returns: a png image from the blobstore corresponding to that tile.
	
	| Otherwise, 
	
	:returns: a 404 error status.	
		
.. py:class:: SaveTile(webapp2.RequestHandler)

| Call to /save
| Expects a post containing JSON data in the following format:
| {

	:type: x: <tileX>,	
	:type: y: <tileY>,
	:type: data: <base64 encoded png>

| }

	.. py:method:: SaveTile.dispatchs(self)
	
	| Enable session handling for this request
	
		* Get a session store for this request.
		* Dispatch the request.
		* Save all sessions.
		
	.. py:method:: SaveTile.session(self)
	
		* Returns a session using the default cookie key.
		
	.. py:method:: SaveTile.post(self)
	
	| Saves the image sent via JSON in the blobstore.
	| If an entry for (x, y) is not in the Tile table of the datastore,
	| create it with the blob key for the image.
	| Otherwise update the entry with the new blob key and
	| delete the existing associated blob.
	| Send messages to any open channel that a change has been made to the tile.
	| Delete any channels that may have been open for more than two hours.
		
.. py:class:: UserTileClaimNumber(webapp2.RequestHandler)
		
	.. py:method:: UserTileClaimNumber.get(self)
	
		* Gets the User's Claimed tiles
		
.. py:class:: CreateClaim(webapp2.RequestHandler)
	
	.. py:method:: CreateClaim.post(self)
		
		* Check if tile is already claimed by this user.
		
.. py:class:: InformClaimOwner(webapp2.RequestHandler)

	.. py:method:: InformClaimOwner.post(self)
		
		* If users claimed tile get changed the user gets informed.
		
.. py:class:: TileClaimedByUser(webapp2.RequestHandler)
	
	.. py:method:: TileClaimedByUser.get(self)
		
		* Gets the tiles that user claimed.
		
.. py:class:: RemoveClaim(webapp2.RequestHandler)

	.. py:method:: RemoveClaim.post(self)
		
		* Gets the tiles that user claimed and then deletes the claim.
		
.. py:class:: SendMessage(webapp2.RequestHandler)

	.. py:method:: SendMessage.post(self)
		
		* Get the contents of the message
		* if there is a user, set him as sender, else use guest user
		* Distribute the message to all users



Files
-----
| main.py