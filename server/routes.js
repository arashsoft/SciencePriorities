/**
 * Main application routes
 */

'use strict';
// set users:

var users = [
  { id: 1, username: 'bob', password: 'secret' },
  { id: 2, username: 'joe', password: 'birthday'}
];

function findById(id, fn) {
  var idx = id - 1;
  if (users[idx]) {
    fn(null, users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
}

function findByUsername(username, fn) {
	
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.username == username) {
      return fn(null, user);
    }
  }
  return fn(null, null);
}

var errors = require('./components/errors');
var jsonHandler = require("./makeJson.js")

// authentication
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

passport.use('local-login', new LocalStrategy({passReqToCallback : true }, function(req, username, password, done) {
	
	findByUsername( username , function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false,  req.flash('loginMessage', 'Incorrect username') );
      }
      if (user.password != password) {
        return done(null, false,  req.flash('loginMessage', 'Incorrect password')  );
      }
      return done(null, user);
   });
}));

passport.serializeUser(function(user, done) {
	done(null, user.id);
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
   findById(id, function(err, user) {
      done(err, user);
   });
});

module.exports = function(app) {

  // authentication
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Insert routes below
  app.use('/api/things', require('./api/thing'));
  
  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

	// json request
	app.get('/jsonrequest/:entityName/:propertyName/:layoutName',function(req, res) {
		if (req.isAuthenticated()){
			jsonHandler.makeJson(req.params.entityName,req.params.propertyName,req.params.layoutName , function (jsonFile){
				res.send(jsonFile);
			});
		}else{
			req.flash('loginMessage', 'Please sign in!');
			res.send({redirect: '/'});
		}
		
		/* it is a wrong way to work with event-driven node.js
		 I just keep it to remember
		 we should use callback function instead of return value; */
		//res.send(jsonHandler.makeJson(req.params.entityName,req.params.propertyName));
   });

	//login request
	app.post('/', passport.authenticate('local-login', { successRedirect: '/main', failureRedirect: '/', failureFlash: true }));
  
  // main page
	app.get('/main' , function(req, res) {
		if (req.isAuthenticated()){
			res.sendfile(app.get('appPath') + '/mainPage.html');
		}else{
			req.flash('loginMessage', 'Please sign in!');
			res.render('loginPage.ejs', { message: req.flash('loginMessage') });
		}
   });
	
	//logout 
	app.get('/logout', function(req, res) {
       req.logout();
       res.redirect('/');
   });
	 
	app.get('/' , function(req, res) {
		if (req.isAuthenticated()){
			res.sendfile(app.get('appPath') + '/mainPage.html');
		}else{
			res.render('loginPage.ejs', { message: req.flash('loginMessage') });
		}
   });
	 	 
};
