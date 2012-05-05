# -*- coding: utf-8 -*-
from __future__ import with_statement
from models import Tile, UpdateChannel, Claim, UserData
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
from google.appengine.api import mail
#testing imports. They should have nothing to do with the online system.
import unittest
from google.appengine.ext import db
from google.appengine.ext import testbed
import urllib2
import webtest

from webapp2_extras import sessions


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

    def get(self, location=''):
        user = users.get_current_user()
        if user:
            login_url = users.create_logout_url(self.request.uri)
            login_label = 'logout'
            user_login = 1
        else:
            login_url = users.create_login_url(self.request.uri)
            login_label = 'login'
            user_login = 0

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

        #For random init
        rand_num = random.random()
        tile = Tile.gql("WHERE rand_num >= :1 ORDER BY rand_num",
            rand_num).get()
        if tile is None:
            locX = 0
            locY = 0
        else:
            locX = tile.x
            locY = tile.y

        template = jinja_environment.get_template('index.html')
        self.response.out.write(template.render(
            login_url=login_url,
            login_label=login_label,
            token=token,
            locX=locX,
            locY=locY,
            adnum=random.randint(0, 4),
            user_login=user_login))


class TestPage(webapp2.RequestHandler):

    def get(self):
        user = users.get_current_user()
        if user:
            login_url = users.create_logout_url(self.request.uri)
            login_label = 'logout'
            user_login = 1
        else:
            login_url = users.create_login_url(self.request.uri)
            login_label = 'login'
            user_login = 0
        template = jinja_environment.get_template('unittests.html')
        self.response.out.write(template.render(
            login_url=login_url,
            login_label=login_label,
            adnum=random.randint(0, 4),
            user_login=user_login))


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
            myTile = Tile(x=x, y=y, blob_key=blob_key,
                rand_num=random.random())
            myTile.put()
        else:
            old_key = myTile.blob_key
            myTile.blob_key = blob_key
            myTile.put()
            google.appengine.ext.blobstore.delete(old_key)

        #For live updates
        channels = UpdateChannel.gql("").fetch(100)
        message = json.dumps({"x": x, "y": y, "Type": "Tile"})
        for ch in channels:
            ch_id = ch.channel_id
            d = parse_datetime(ch_id.split(",")[0])
            if d < datetime.now() + timedelta(hours=-2):
                ch.key.delete()
            elif ch_id != self.session.get("channel_id"):
                channel.send_message(ch.channel_id, message)

        self.response.set_status(200)


class UserTileClaimNumber(webapp2.RequestHandler):

    def get(self):
        user = users.get_current_user()
        day_time = datetime.today() - timedelta(1)

        query = UserData.gql("WHERE user = :1", user)
        thisUser = query.get()
        if thisUser is None:
            thisUser = UserData(user=user, lastemail=day_time, Number_Tiles=0)
            thisUser.put()
            N_tiles = 0
        else:
            N_tiles = thisUser.Number_Tiles
        self.response.write(N_tiles)


class CreateClaim(webapp2.RequestHandler):

    def post(self):
        user = users.get_current_user()
        x = int(self.request.get('x'))
        y = int(self.request.get('y'))

        if user is not None:
            #Check if tile is already claimed by this user
            query = Claim.gql("WHERE user = :1 AND x = :2 AND y = :3",
                user, x, y)
            thisClaim = query.get()
            if thisClaim is None:
                thisClaim = Claim(user=user, x=x, y=y)
                query2 = UserData.gql("WHERE user = :1", user)
                thisUser = query2.get()
                thisUser.Number_Tiles = thisUser.Number_Tiles + 1
                thisUser.put()
                thisClaim.put()


class InformClaimOwner(webapp2.RequestHandler):

    def post(self):
        x = int(self.request.get('x'))
        y = int(self.request.get('y'))
        currentdaytime = datetime.today()

        query = Claim.gql("WHERE x = :1 AND y = :2", x, y)
        Claim_itterator = query.iter(produce_cursors=True)

        for claim in Claim_itterator:
            query2 = UserData.gql("WHERE user = :1", claim.user)
            thisUser = query2.get()
            if thisUser.lastemail < currentdaytime - timedelta(1):
                message = mail.EmailMessage()
                message.sender = ("http://infinitegraffitiwall.appspot.com/ " +
                    "Tile Claim Service <gaurav9576@gmail.com>")
                message.to = claim.user.email()
                message.subject = ("A Tile that you have claimed " +
                    "has been changed today.")
                message.body = ("""
A Tile that you have claimed has been changed today.
Tile coordinates """ + str(x) + "," + str(y) + """.
Link to location: http://infinitegraffitiwall.appspot.com/@""" +
                    str(x) + "," + str(y))
                message.send()
                thisUser.lastemail = currentdaytime
                thisUser.put()


class TileClaimedByUser(webapp2.RequestHandler):

    def get(self):
        user = users.get_current_user()
        x = int(self.request.get('x'))
        y = int(self.request.get('y'))

        query = Claim.gql("WHERE user = :1 AND x = :2 AND y = :3", user, x, y)
        HasClaimOnTile = query.get()
        if HasClaimOnTile is None:
            HasClaim = 0
        else:
            HasClaim = 1
        self.response.write(HasClaim)


class RemoveClaim(webapp2.RequestHandler):

    def post(self):
        user = users.get_current_user()
        x = int(self.request.get('x'))
        y = int(self.request.get('y'))

        if user is not None:
            #Get the tile claim for this user
            query = Claim.gql("WHERE user = :1 AND x = :2 AND y = :3",
                user, x, y)
            thisClaim = query.get()
            if thisClaim is not None:
                thisClaim.key.delete()
                query2 = UserData.gql("WHERE user = :1", user)
                thisUser = query2.get()
                thisUser.Number_Tiles = thisUser.Number_Tiles - 1
                thisUser.put()


class SendMessage(webapp2.RequestHandler):

    def post(self):
        user = users.get_current_user()
        #Get the contetnts of the message
        message = self.request.get('message')

        #if there is a user, set him as sender, else use guest user
        if user is not None:
            sender = user.nickname()
        else:
            sender = "Guest User"

        #Distribute the message to all users
        channels = UpdateChannel.gql("").fetch(100)
        jpost = json.dumps({
            "Sender": sender,
            "Message": message,
            "Type": "Chat"})
        for ch in channels:
            ch_id = ch.channel_id
            d = parse_datetime(ch_id.split(",")[0])
            if d < datetime.now() + timedelta(hours=-2):
                ch.key.delete()
            channel.send_message(ch.channel_id, jpost)


class PYTest(webapp2.RequestHandler):

    def get(self):
        self.testbed = testbed.Testbed()
        self.testapp = webtest.TestApp(app)
        #activates the testbed (Used for creating face DB and blobstore)
        #Swaps the fake systems in for the real systems
        #Should make this only work offline
        self.testbed.activate()
        
        #Initializes the fake blobstore and datastore
        self.testbed.init_blobstore_stub()
        self.testbed.init_datastore_v3_stub()

        ##########################
        # MainPage Unit Testing
        ##########################
        
        AllParts = 0
        #Unit test for MainPage (MainPage_test1) Checks to assure that the main page can load
        try:
            response = self.testapp.get('/')
            MainPage_test1 = "<font color=green>Passed</font>"
            #Unit test for MainPage (MainPage_test3) Checks to assure that the page has a section "wall"
            try:
                response.mustcontain('<section id="wall">')
                MainPage_test3 = "<font color=green>Passed</font>"
                AllParts = AllParts + 1
            except:
                MainPage_test3 = "<font color=red>Failed, the main page did not contain a section with ID wall.</font>"
                
            #Unit test for MainPage (MainPage_test4) Checks to assure that the page has a the directional scrolling divs
            try:
                response.mustcontain('<div id="left">')
                response.mustcontain('<div id="right">')
                response.mustcontain('<div id="top">')
                response.mustcontain('<div id="bottom">')
                response.mustcontain('<div id="top_left">')
                response.mustcontain('<div id="top_right">')
                response.mustcontain('<div id="bottom_left">')
                response.mustcontain('<div id="bottom_right">')
                MainPage_test4 = "<font color=green>Passed</font>"
                AllParts = AllParts + 1
            except:
                MainPage_test4 = "<font color=red>Failed, the main page did not contain a section with ID wall.</font>"
            
            #Unit test for MainPage (MainPage_test2) Checks to assure that the page has the specified sections
            if AllParts == 2:
                MainPage_test2 = "<font color=green>Passed</font>"
            else:
                MainPage_test2 = "<font color=red>Failed, this is not the page as it was intended..</font>"
                
        except:
            MainPage_test1 = "<font color=red>Failed, the main page did not respond at all.</font>"
            MainPage_test3 = "<font color=red>Can't be run if test 1 fails.</font>"
        
        try:
            response = self.testapp.get('/@-12,-1')
            try:
                response.mustcontain('<input id="locX" type="hidden" value="-12">')
                response.mustcontain('<input id="locY" type="hidden" value="-1">')
                MainPage_test5 = "<font color=green>Passed</font>"
            except:
                MainPage_test5 = "<font color=red> The start location was not correct. </font>"
        except:
            MainPage_test5 = "<font color=red> The location based page failed to load. </font>"
        
        ##########################
        # GetTile Unit Testing
        ##########################

        #Createing fake tile to test tile reading
        with open("UnitTestTile.png", "rb") as image_file:
            imageFile = image_file.read()
        
        with open("UnitTestTile2.png", "rb") as image_file2:
            imageFile2 = image_file2.read()
        image_file2.close()
            
        image_file.close()
        
        blob_key = 'TestBlobkey'
        
        self.testbed.get_stub('blobstore').CreateBlob(blob_key, imageFile)
        
        Tile(x=0, y=0, blob_key=blobstore.BlobKey(blob_key), rand_num=random.random()).put()
        
        params={'x': 0, 'y': 0}
        
        #Unit test for get tile (GetTile_test1) Checks to assure that the file can load at all
        try:
            response = self.testapp.get('/tile', params)
            GetTile_test1 = "<font color=green>Passed</font>"
            #Unit test for get tile (GetTile_test2) Checks to assure that the file can load correctly
            try:
                response.mustcontain(imageFile)
                GetTile_test2 = "<font color=green>Passed</font>"
            except:
                GetTile_test2 = "<font color=red>Failed, the responce did not contain the test image file</font>"
            
            #Unit test for get tile (GetTile_test3) Checks to assure that the mach in test 1 is not erroneous
            try:
                response.mustcontain(imageFile2)
                GetTile_test3 = "<font color=red>Failed, the tile retreaved does not correspond to the tile put in.</font>"
            except:
                GetTile_test3 = "<font color=green>Passed</font>"
        except:
            GetTile_test1 = "<font color=red>Failed, there was no responce from the mock database.</font>"
            GetTile_test2 = "<font color=red>Can't be run if test 1 fails.</font>"
            GetTile_test3 = GetTile_test2
        
        #Unit test for get tile (GetTile_test4) Checks to assure that a tile that does not exist in the database does not load
        params={'x': 0, 'y': 1}
        
        try:
            self.testapp.get('/tile', params)
            GetTile_test4 = "<font color=red>The load did not fail as it was intended to</font>"
        except:
            GetTile_test4 = "<font color=green>Passed</font>"
        
        #Swaps the real systems back in, and deactivates the fake testing system.
        self.testbed.deactivate()

        template = jinja_environment.get_template('PYUnitTest.html')
        self.response.out.write(template.render(
            MainPage_test1 = MainPage_test1,
            MainPage_test2 = MainPage_test2,
            MainPage_test3 = MainPage_test3,
            MainPage_test4 = MainPage_test4,
            MainPage_test5 = MainPage_test5,
            GetTile_test1 = GetTile_test1,
            GetTile_test2 = GetTile_test2,
            GetTile_test3 = GetTile_test3,
            GetTile_test4 = GetTile_test4
            ))

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
        ('/howmenytiles', UserTileClaimNumber),
        ('/claim', CreateClaim),
        ('/unclaim', RemoveClaim),
        ('/informclaim', InformClaimOwner),
        ('/hasclaimontile', TileClaimedByUser),
        ('/sendmessage', SendMessage),
        ('/@(.*)', MainPage),  # to determine location
        ('/PyUnitTest', PYTest)
    ], debug=True, config=config)


#tests  to check if the app loads
response = app.get_response('/')
assert response.status_int == 200

response = app.get_response('/unittests')
assert response.status_int == 200
