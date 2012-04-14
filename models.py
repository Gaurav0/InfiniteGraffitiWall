from google.appengine.ext import ndb


class Tile(ndb.Model):

    x = ndb.IntegerProperty(required=True)
    y = ndb.IntegerProperty(required=True)
    blob_key = ndb.BlobKeyProperty(required=True)
    rand_num = ndb.FloatProperty(required=True)


class UpdateChannel(ndb.Model):

    channel_id = ndb.StringProperty(required=True)


class Claim(ndb.Model):

    user = ndb.UserProperty(required=True)
    x = ndb.IntegerProperty(required=True)
    y = ndb.IntegerProperty(required=True)
    lastemail = ndb.DateTimeProperty(required=True)
