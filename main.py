from __future__ import with_statement
from models import Tile, Claim

import webapp2
import jinja2
import os
import base64
import logging
import urllib

from google.appengine.ext.blobstore import blobstore
from google.appengine.api import files
from google.appengine.api import users
from google.appengine.ext import db

from google.appengine.ext.webapp import blobstore_handlers

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


class GetTile(webapp2.RequestHandler):

    def get(self):
        x = int(self.request.get('x'))
        y = int(self.request.get('y'))

        query = Tile.gql("WHERE x = :1 AND y = :2", x, y)
        myTile = query.get()
        if myTile is None:
            self.response.set_status(404)
        else:
            self.response.headers["content-type"] = "image/png"
            blob_reader = blobstore.BlobReader(myTile.blob_key)
            self.response.write(blob_reader.read())


class SaveTile(webapp2.RequestHandler):

    def post(self):
        x = int(self.request.get('x'))
        y = int(self.request.get('y'))
        data = self.request.get('data')

        data = base64.b64decode(data)

        file_name = files.blobstore.create(mime_type='image/png')
        with files.open(file_name, 'a') as f:
            f.write(data)

        files.finalize(file_name)
        blob_key = files.blobstore.get_blob_key(file_name)

        # Check if tile is already in database
        query = Tile.gql("WHERE x = :1 AND y = :2", x, y)
        myTile = query.get()
        if myTile is None:
            myTile = Tile(x=x, y=y, blob_key=blob_key)
            myTile.put()
        else:
            old_key = myTile.blob_key
            myTile.blob_key = blob_key
            myTile.put()
            old_key.delete()


app = webapp2.WSGIApplication([
        ('/', MainPage),
        ('/unittests', TestPage),
        ('/save', SaveTile),
        ('/tile', GetTile)],
    debug=True)


#tests  to check if the app loads
response = app.get_response('/')
assert response.status_int == 200

response = app.get_response('/unittests')
assert response.status_int == 200
