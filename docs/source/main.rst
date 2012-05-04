Main files
==========

.. toctree::
   :maxdepth: 2
   
.. py:class:: MainPage(webapp2.RequestHandler)
	
	.. py:method:: MainPage.dispatchs(self)
		Get a session store for this request.
		Dispatch the request.
		Save all sessions.
	.. py:method:: MainPage.session(self)
		Returns a session using the default cookie key.
	.. py:method:: MainPage.get(self, location)
		Checks if user is logged in.
		Checks for live updates.
		Checks for random inits.
		
.. py:class:: TestPage(webapp2.RequestHandler)
	
	.. py:method:: TestPage.get(self)
		Checks if user is logged in.
		Tests the page
		
.. py:class:: GetTile(webapp2.RequestHandler)

	.. py:method:: GetTile.get(self)
		Gets tiles from blobstore
		
.. py:class:: SaveTile(webapp2.RequestHandler)

	.. py:method:: SaveTile.dispatchs(self)
		Get a session store for this request.
		Dispatch the request.
		Save all sessions.
	.. py:method:: SaveTile.session(self)
		Returns a session using the default cookie key.
	.. py:method:: SaveTile.post(self)
		Check if tile is already in database.
		Checks for live updates
		

		
		

	

   


Files
-----
| main.py