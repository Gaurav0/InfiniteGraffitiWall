import webapp2
import jinja2
import os

from google.appengine.api import users

jinja_environment = jinja2.Environment(
    loader=jinja2.FileSystemLoader(os.path.dirname(__file__)))


class MainPage(webapp2.RequestHandler):
    def get(self):
        user = users.get_current_user()
        if user:
            login_url = users.create_login_url(self.request.uri)
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

app = webapp2.WSGIApplication([
        ('/', MainPage),
        ('/unittests', TestPage)],
    debug=True)

#tests  to check if the app loads
response = app.get_response('/')
assert response.status_int == 200

response = app.get_response('/unittests')
assert response.status_int == 200
