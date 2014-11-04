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
  app.route('/jsonrequest/:entityName/:propertyName')
    .get(function(req, res) {
		res.send(jsonHandler.makeJson(req.params.entityName,req.params.propertyName));
    });
	 
  // All other routes should redirect to the index.html
  app.route('/')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });
};
