from django.db import models

class Users(models.Model):
	first_name = models.CharField(max_length=30)
	last_name = models.CharField(max_length=30)

class Claims(models.Model):
	title = models.CharField(max_length=30)
	content = models.CharField(
	
