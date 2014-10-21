'use strict';

angular.module('sciencePriorities2App', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.bootstrap'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider
      .otherwise('/');

		
	$stateProvider
     .state('stage1', {
        url: '/',
        templateUrl: 'app/main/main.html',
        //controller: 'MainCtrl'
      });
		
    $locationProvider.html5Mode(true);
  });