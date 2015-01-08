// handle authentication methods - this module use passport module

var LocalStrategy = require('passport-local').Strategy;
var passport = require('passport');

// set users:
// TODO: read users from database
var users = [
  { id: 1, username: 'arash', password: 'secret' },
  { id: 2, username: 'joe', password: 'birthday'}
];

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

module.exports = passport;

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
