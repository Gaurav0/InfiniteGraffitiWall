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
    """
    Call to either / or /@x,y.
    The first is opens the graffiti wall at a random tile.
    The second is opens the graffiti wall at tile x, y
    """

    def dispatch(self):
        """
        Enable session handling for this request
        """

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
        """ Returns a session using the default cookie key. """
        return self.session_store.get_session()

    def get(self, location=''):
        """
        Shows login button if not logged in, otherwise shows logout.
        Creates a new channel for use with live updates and chat.
        If location is unspecified, use a random initial tile.
        Output created using template index.html

        :param location: x, y of tile to display when opening the graffiti wall
        """

        #Check if user is logged in.
        user = users.get_current_user()
        if user:
            #If so, show logout button
            login_url = users.create_logout_url(self.request.uri)
            login_label = 'logout'
            user_login = 1
        else:
            #If not, show login button
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

        #Get random initial tile
        rand_num = random.random()
        tile = Tile.gql("WHERE rand_num >= :1 ORDER BY rand_num",
            rand_num).get()
        if tile is None:
            locX = 0
            locY = 0
        else:
            locX = tile.x
            locY = tile.y

        #Output from template
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
    """
    Call to /unittests
    Returns a page which will run client side QUnit tests
    """

    def get(self):
        """
        Shows login button if not logged in, otherwise shows logout.
        Output created using template unittests.html
        """

        #Check if user is logged in.
        user = users.get_current_user()
        if user:
            login_url = users.create_logout_url(self.request.uri)
            login_label = 'logout'
            user_login = 1
        else:
            login_url = users.create_login_url(self.request.uri)
            login_label = 'login'
            user_login = 0

        #Output from template
        template = jinja_environment.get_template('unittests.html')
        self.response.out.write(template.render(
            login_url=login_url,
            login_label=login_label,
            adnum=random.randint(0, 4),
            user_login=user_login))


class GetTile(webapp2.RequestHandler):
    """
    Call to /tile
    Returns a png
    """

    def get(self):
        """
        Generate a response to /tile?x=<tileX>&y=<tileY>
        If a record exists in the datastore for tileX, tileY,
        returns a png image from the blobstore corresponding to that tile.
        Otherwise, returns a 404 error status.
        """

        #Get Parameters
        x = int(self.request.get('x'))
        y = int(self.request.get('y'))

        #Get record for tile from the datastore
        query = Tile.gql("WHERE x = :1 AND y = :2", x, y)
        myTile = query.get()
        if myTile is None:
            #No corresponding tile data, return 404 status
            self.response.set_status(404)
        else:
            #Set headers indicating response is a png image
            self.response.headers["content-type"] = "image/png"

            #Get png image from blobstore
            blob_reader = blobstore.BlobReader(myTile.blob_key)

            #Return the image as the response.
            self.response.write(blob_reader.read())


class SaveTile(webapp2.RequestHandler):
    """
    Call to /save
    Expects a post containing JSON data in the following format:
    {
        x: <tileX>,
        y: <tileY>,
        data: <base64 encoded png>
    }
    """

    def dispatch(self):
        """
        Enable session handling for this request
        """

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
        """ Returns a session using the default cookie key. """
        return self.session_store.get_session()

    def post(self):
        """
        Saves the image sent via JSON in the blobstore.
        If an entry for (x, y) is not in the Tile table of the datastore,
        create it with the blob key for the image.
        Otherwise update the entry with the new blob key and
        delete the existing associated blob.
        Send messages to any open channel that a change has been made to the
        tile.
        Delete any channels that may have been open for more than two hours.
        """

        #Get JSON data
        x = int(self.request.get('x'))
        y = int(self.request.get('y'))
        data = self.request.get('data')

        #base64 decode image
        data = base64.b64decode(data)

        #Write image to blobstore
        file_name = files.blobstore.create(mime_type='image/png')
        with files.open(file_name, 'a') as f:
            f.write(data)

        files.finalize(file_name)

        #Get blob key for newly created blob in blobstore
        blob_key = files.blobstore.get_blob_key(file_name)

        # Check if tile is already in database
        query = Tile.gql("WHERE x = :1 AND y = :2", x, y)
        myTile = query.get()
        if myTile is None:

            #Create new tile entry in database with key to new blob
            myTile = Tile(x=x, y=y, blob_key=blob_key,
                rand_num=random.random())
            myTile.put()
        else:

            #Update the blob key in the entry for this tile
            old_key = myTile.blob_key
            myTile.blob_key = blob_key
            myTile.put()

            #Delete the blob previously associated with the tile
            google.appengine.ext.blobstore.delete(old_key)

        #For live updates:
        #Send a message to the channels indicating this tile has changed.
        channels = UpdateChannel.gql("").fetch(100)
        message = json.dumps({"x": x, "y": y, "Type": "Tile"})
        for ch in channels:
            ch_id = ch.channel_id

            #if a channel is two hours old, delete it.
            d = parse_datetime(ch_id.split(",")[0])
            if d < datetime.now() + timedelta(hours=-2):
                ch.key.delete()
            elif ch_id != self.session.get("channel_id"):
                channel.send_message(ch.channel_id, message)

        #No response data to send.
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

        #Unit test for MainPage (MainPage_test1)
        #Checks to assure that the main page can load
        try:
            response = self.testapp.get('/')
            MainPage_test1 = "<font color=green>Passed</font>"

            #Unit test for MainPage (MainPage_test3)
            #Checks to assure that the page has a section "wall"
            try:
                response.mustcontain('<section id="wall">')
                MainPage_test3 = "<font color=green>Passed</font>"
                AllParts = AllParts + 1
            except:
                MainPage_test3 = ("<font color=red>Failed, the main " +
                    "page did not contain a section with ID wall.</font>")

            #Unit test for MainPage (MainPage_test4)
            #Checks to assure that the page has the directional scrolling divs
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
                MainPage_test4 = ("<font color=red>Failed, the main page " +
                    "did not contain a section with ID wall.</font>")

            #Unit test for MainPage (MainPage_test2)
            #Checks to assure that the page has the specified sections
            if AllParts == 2:
                MainPage_test2 = "<font color=green>Passed</font>"
            else:
                MainPage_test2 = ("<font color=red>Failed, this is " +
                    "not the page as it was intended..</font>")

        except:
            MainPage_test1 = ("<font color=red>Failed, the main page " +
                "did not respond at all.</font>")
            MainPage_test3 = ("<font color=red>Can't be run " +
                "if test 1 fails.</font>")

        #Unit test for MainPage (MainPage_test4)
        #Check to assure that the random tile  is retrieved correctly
        
        #Creating fake tile to test tile reading
        with open("UnitTestTile.png", "rb") as image_file:
            imageFile = image_file.read()
        
        image_file.close()
        
        blob_key = 'TestBlobkey'

        self.testbed.get_stub('blobstore').CreateBlob(blob_key, imageFile)
        
        #rand_num=1 to be always selected in a random selection
        Tile(x=-12, y=-1, blob_key=blobstore.BlobKey(blob_key),
             rand_num=1).put()

        try:
            response = self.testapp.get('/')
            try:
                response.mustcontain(
                    '<input id="locX" type="hidden" value="-12">')
                response.mustcontain(
                    '<input id="locY" type="hidden" value="-1">')
                MainPage_test5 = "<font color=green>Passed</font>"
            except:
                MainPage_test5 = ("<font color=red> The start location " +
                    "was not correct. </font>")
        except:
            MainPage_test5 = ("<font color=red> The location based page " +
                "failed to load. </font>")

        ##########################
        # GetTile Unit Testing
        ##########################

        #Reinitializes the fake blobstore and datastore for the next test
        self.testbed.init_blobstore_stub()
        self.testbed.init_datastore_v3_stub()

        #Creating fake tile to test tile reading
        with open("UnitTestTile.png", "rb") as image_file:
            imageFile = image_file.read()

        with open("UnitTestTile2.png", "rb") as image_file2:
            imageFile2 = image_file2.read()
        image_file2.close()

        image_file.close()

        blob_key = 'TestBlobkey'

        self.testbed.get_stub('blobstore').CreateBlob(blob_key, imageFile)

        Tile(x=0, y=0, blob_key=blobstore.BlobKey(blob_key),
             rand_num=random.random()).put()

        params = {'x': 0, 'y': 0}

        #Unit test for get tile (GetTile_test1)
        #Checks to assure that the file can load at all
        try:
            response = self.testapp.get('/tile', params)
            GetTile_test1 = "<font color=green>Passed</font>"

            #Unit test for get tile (GetTile_test2)
            #Checks to assure that the file can load correctly
            try:
                response.mustcontain(imageFile)
                GetTile_test2 = "<font color=green>Passed</font>"
            except:
                GetTile_test2 = ("<font color=red>Failed, the " +
                    "response did not contain the test image file</font>")

            #Unit test for get tile (GetTile_test3)
            #Checks to assure that the mach in test 1 is not erroneous
            try:
                response.mustcontain(imageFile2)
                GetTile_test3 = ("<font color=red>Failed, the tile " +
                    "retrieved does not correspond to the tile put in.</font>")
            except:
                GetTile_test3 = "<font color=green>Passed</font>"
        except:
            GetTile_test1 = ("<font color=red>Failed, there was no " +
                "response from the mock database.</font>")
            GetTile_test2 = ("<font color=red>Can't be run " +
                "if test 1 fails.</font>")
            GetTile_test3 = GetTile_test2

        #Unit test for get tile (GetTile_test4)
        #Checks to assure that a tile that does not
        #exist in the database does not load
        params = {'x': 0, 'y': 1}

        try:
            self.testapp.get('/tile', params)
            GetTile_test4 = ("<font color=red>The load did not " +
                "fail as it was intended to</font>")
        except:
            GetTile_test4 = "<font color=green>Passed</font>"

        ##########################
        # SaveTile Unit Testing
        ##########################

        #Reinitializes the fake blobstore and datastore for the next test
        self.testbed.init_blobstore_stub()
        self.testbed.init_datastore_v3_stub()

        #We can't actualy create an object in the test bed blobstore through the normal means
        #So we can only test that an object is created in the database
        #And that it has a valid blobstore key

        #Creating fake tile to test tile reading
        with open("UnitTestTile.png", "rb") as image_file:
            imageFile = image_file.read()

        encodeimgFile = base64.b64encode(imageFile)

        params = {'x': 100, 'y': 100, 'data': encodeimgFile}

        image_file.close()

        #Unit test for get tile (GetTile_test1)
        #Checks to assure that the file can load at all
        try:
            response = self.testapp.post('/save', params)
        except:
            SaveTile_test1 = ("<font color=red>Failed, SaveTile " +
                "did not respond at all.</font>")

        #Swaps the real systems back in,
        #and deactivates the fake testing system.
        self.testbed.deactivate()

        template = jinja_environment.get_template('PYUnitTest.html')
        self.response.out.write(template.render(
            MainPage_test1=MainPage_test1,
            MainPage_test2=MainPage_test2,
            MainPage_test3=MainPage_test3,
            MainPage_test4=MainPage_test4,
            MainPage_test5=MainPage_test5,
            GetTile_test1=GetTile_test1,
            GetTile_test2=GetTile_test2,
            GetTile_test3=GetTile_test3,
            GetTile_test4=GetTile_test4,
            SaveTile_test1=SaveTile_test1
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
