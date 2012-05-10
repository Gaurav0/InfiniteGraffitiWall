Main files
==========

.. toctree::
   :maxdepth: 2
   
.. py:class:: MainPage(webapp2.RequestHandler)
	
	.. py:method:: MainPage.dispatchs(self)
	
		* Get a session store for this request.
		* Dispatch the request.
		* Save all sessions.
		
	.. py:method:: MainPage.session(self)
	
		* Returns a session using the default cookie key.
		
	.. py:method:: MainPage.get(self, location)
	
		* Checks if user is logged in.
		* Checks for live updates.
		* Checks for random inits.
		
.. py:class:: TestPage(webapp2.RequestHandler)
	
	.. py:method:: TestPage.get(self)
		
		* Checks if user is logged in.
		* Tests the page
		
.. py:class:: GetTile(webapp2.RequestHandler)

	.. py:method:: GetTile.get(self)
		
		* Gets tiles from blobstore
		
.. py:class:: SaveTile(webapp2.RequestHandler)

	.. py:method:: SaveTile.dispatchs(self)
	
		* Get a session store for this request.
		* Dispatch the request.
		* Save all sessions.
		
	.. py:method:: SaveTile.session(self)
	
		* Returns a session using the default cookie key.
		
	.. py:method:: SaveTile.post(self)
	
		* Check if tile is already in database.
		* Checks for live updates
		
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
		
		* Get the contetnts of the message
		* if there is a user, set him as sender, else use guest user
		* Distribute the message to all users



Files
-----
| main.py