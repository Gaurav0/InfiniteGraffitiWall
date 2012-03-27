from google.appengine.ext import db
from google.appengine.ext.blobstore import blobstore


class Tile(db.Model):

    x = db.IntegerProperty(required=True)
    y = db.IntegerProperty(required=True)
    blob_key = blobstore.BlobReferenceProperty(required=True)


class Claim(db.Model):
    user = db.UserProperty(required=True)
    x = db.IntegerProperty(required=True)
    y = db.IntegerProperty(required=True)
