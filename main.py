from __future__ import with_statement
from models import Tile, Claim

import webapp2
import jinja2
import os

from google.appengine.ext.blobstore import blobstore
from google.appengine.api import files
from google.appengine.api import users
from google.appengine.ext import db

jinja_environment = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)))

class MainPage(webapp2.RequestHandler):
    def get(self):
        user = users.get_current_user()
        if user:
            login_url = users.create_logout_url(self.request.uri)
            login_label = 'logout'
        else:
            login_url = users.create_login_url(self.request.uri)
            login_label = 'login'

        template = jinja_environment.get_template('index.html')
        self.response.out.write(template.render(
            login_url=login_url,
            login_label=login_label))

class TestPage(webapp2.RequestHandler):
    def get(self):
        template = jinja_environment.get_template('unittests.html')
        self.response.out.write(template.render(''))

class SaveTile(webapp2.RequestHandler):
    def post(self):
	x = int(self.request.get('x'))
	y = int(self.request.get('y'))
	data = self.request.get('data')
	
	file_name = files.blobstore.create(mime_type='image/png')
	with files.open(file_name, 'a') as f :
	    f.write(data)

	files.finalize(file_name)
	blob_key = files.blobstore.get_blob_key(file_name)

	myTile = Tile(x=x,y=y,blob_key=blob_key)
	myTile.put()

app = webapp2.WSGIApplication([
        ('/', MainPage),
        ('/unittests', TestPage),
	('/save', SaveTile)],
    debug=True)
	
#tests  to check if the app loads
response = app.get_response('/')
assert response.status_int == 200

response = app.get_response('/unittests')
assert response.status_int == 200
