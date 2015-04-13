/**
 * Main application routes
 */
'use strict';
var errors = require('./components/errors');
var jsonHandler = require('./makeJson.js');
var passport = require('./authenticate.js');
var path = require('path');

module.exports = function(app) {

  // authentication
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Insert routes below
  app.use('/api/things', require('./api/thing'));
  
  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

	//login request send false login to / and correct login to /main
	app.post('/', passport.authenticate('local-login', { successRedirect: '/main', failureRedirect: '/', failureFlash: true }));
	
	// json request
	app.get('/jsonrequest/:entityName/:propertyName/:layoutName',function(req, res) {
		if (req.isAuthenticated()){
			jsonHandler.makeJson(req.params.entityName,req.params.propertyName,req.params.layoutName , function (jsonFile){
				if (jsonFile=="mysql connection error"){
					res.send({"error":'Error: cannot connect to the database please contact with your server administrator'});
				}else if ( jsonFile=="unknown visualization request"){
					res.send({"error":'Your requested visualization is not available.'});
				}else{
					res.send(jsonFile);
				}
			});
		}else{
			req.flash('loginMessage', 'Please sign in!');
			res.send({"redirect": '/'});
		}
		
		/* it is a wrong way to work with event-driven node.js
		 I just keep it to remember
		 we should use callback function instead of return value; */
		//res.send(jsonHandler.makeJson(req.params.entityName,req.params.propertyName));
   });
	 
	 //jsonrequest2/departmentSelect/' + JSON.stringify(selectedDepartments)
	 // dynamic json request
	app.get('/jsonrequest2/:param1/:values1',function(req, res) {
		if (req.isAuthenticated()){
			jsonHandler.makeDynamicJson(req.params.param1,JSON.parse(req.params.values1), function (jsonFile){
				if (jsonFile=="mysql connection error"){
					res.send({"error":'Error: cannot connect to the database please contact with your server administrator'});
				}else if ( jsonFile=="unknown visualization request"){
					res.send({"error":'Your requested visualization is not available.'});
				}else{
					res.send(jsonFile);
				}
			});
		}else{
			// not authenticated
			// the client side should handle redirect
			req.flash('loginMessage', 'Please sign in!');
			res.send({"redirect": '/'});
		}
  });
	 
  
  // main page
	app.get('/main' , function(req, res) {
		if (req.isAuthenticated()){  
			//res.render('mainPage.html.ejs', { message: req.flash('loginMessage') });
			res.sendfile(path.resolve('./client/mainPage.html'));
			// res.sendfile(path.resolve('../client/mainPage.html'));
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
			//res.render('mainPage.html.ejs', { message: req.flash('loginMessage') });
			res.sendfile(app.get('appPath') + '/mainPage.html');
		}else{
			res.render('loginPage.ejs', { message: req.flash('loginMessage') });
		}
   });
	 	 
};
