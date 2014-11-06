/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');
var jsonHandler = require("./makeJson.js")

module.exports = function(app) {

  // Insert routes below
  app.use('/api/things', require('./api/thing'));
  
  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

  // json request
  app.route('/jsonrequest/:entityName/:propertyName/:layoutName')
    .get(function(req, res) {
		jsonHandler.makeJson(req.params.entityName,req.params.propertyName,req.params.layoutName , function (jsonFile){
			res.send(jsonFile);
		});
		/* it is a wrong way to work with event-driven node.js
		 I just keep it to remember
		 we should use callback function instead of return value; */
		//res.send(jsonHandler.makeJson(req.params.entityName,req.params.propertyName));
    });
	 
  // All other routes should redirect to the index.html
  app.route('/')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });
};
