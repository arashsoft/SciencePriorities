'use strict';

angular.module('sciencePriorities2App', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.bootstrap'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    
	 $urlRouterProvider.otherwise('/');
    
	 $stateProvider
    .state('state1', {
      url: '/',
      template: '<p>Hi it is a test</p>',
      controller: 'MainCtrl',
      data:{}
    });
	 console.write("hello");
	 /*
    .state('state2', {
      url: '/route2',
      template: 'Hello from the 2nd Tab!<br>' +
                '<a ui-sref="state2.list">Show List</a><div ui-view></div>',
      controller: 'SecondCtrl',
      data: {}
    })
    .state('state2.list', {
      url: '/list',
      template: '<h2>Nest list state</h2><ul><li ng-repeat="thing in things">{{thing}}</li></ul>',
      controller: 'SecondCtrl',
      data: {}
    });
	 */
	 //$locationProvider.html5Mode(true);
	 
  });