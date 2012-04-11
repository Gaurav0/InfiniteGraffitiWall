# -*- coding: utf-8 -*-
from __future__ import with_statement
from models import Tile, UpdateChannel
from parse_datetime import parse_datetime

import webapp2
import jinja2
import os
import base64
import json
import random

from datetime import datetime
from datetime import timedelta

import google.appengine.ext.blobstore

from google.appengine.ext.blobstore import blobstore
from google.appengine.api import files
from google.appengine.api import users
from google.appengine.api import channel

from webapp2_extras import sessions

import re


jinja_environment = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)))


class MainPage(webapp2.RequestHandler):

    def dispatch(self):
        # Get a session store for this request.
        self.session_store = sessions.get_store(request=self.request)

        try:
            # Dispatch the request.
            webapp2.RequestHandler.dispatch(self)
        finally:
            # Save all sessions.
            self.session_store.save_sessions(self.response)

    @webapp2.cached_property
    def session(self):
        # Returns a session using the default cookie key.
        return self.session_store.get_session()

    def get(self, location = ''):
        locLST = re.split(r',',location)
        if len(locLST) == 2:
            try:
                locX = int(locLST[0])
                locY = int(locLST[1])
            except ValueError:
                locX = 0
                locY = 0
        else:
            locX = 0
            locY = 0
        user = users.get_current_user()
        if user:
            login_url = users.create_logout_url(self.request.uri)
            login_label = 'logout'
        else:
            login_url = users.create_login_url(self.request.uri)
            login_label = 'login'

        #For live updates
        token = self.session.get('token')
        if token is None:
            channel_id = (str(datetime.now()) + "," +
                str(random.randint(1, 10000)))
            token = channel.create_channel(channel_id)
            self.session['channel_id'] = channel_id
            self.session['token'] = token
            ch = UpdateChannel(channel_id=channel_id)
            ch.put()

        template = jinja_environment.get_template('index.html')
        self.response.out.write(template.render(
            login_url=login_url,
            login_label=login_label,
            token=token,
            adnum=random.randint(0, 4),
            locX=locX,
            locY=locY))


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

    def dispatch(self):
        # Get a session store for this request.
        self.session_store = sessions.get_store(request=self.request)

        try:
            # Dispatch the request.
            webapp2.RequestHandler.dispatch(self)
        finally:
            # Save all sessions.
            self.session_store.save_sessions(self.response)

    @webapp2.cached_property
    def session(self):
        # Returns a session using the default cookie key.
        return self.session_store.get_session()

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
            google.appengine.ext.blobstore.delete(old_key)

        #For live updates
        channels = UpdateChannel.gql("").fetch(100)
        message = json.dumps({"x": x, "y": y})
        for ch in channels:
            ch_id = ch.channel_id
            d = parse_datetime(ch_id.split(",")[0])
            if d < datetime.now() + timedelta(hours=-2):
                ch.key.delete()
            elif ch_id != self.session.get("channel_id"):
                channel.send_message(ch.channel_id, message)

        self.response.set_status(200)


config = {}
config['webapp2_extras.sessions'] = {
    'secret_key': 'cb8dcd50-18be-4042-bc3d-bfff84e5e8ab',
    'max_age': 3600
}

app = webapp2.WSGIApplication([
        ('/', MainPage),
        ('/unittests', TestPage),
        ('/save', SaveTile),
        ('/tile', GetTile),
		('/@', MainPage),
        ('/(.*)', MainPage)# to determine location
    ], debug=True, config=config)


#tests  to check if the app loads
response = app.get_response('/')
assert response.status_int == 200

response = app.get_response('/unittests')
assert response.status_int == 200
