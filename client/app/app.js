'use strict';

angular.module('sciencePriorities2App', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.bootstrap',
  'lvl.directives.dragdrop',
	'ngDraggable'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider
      .otherwise('/');

		
	$stateProvider
     .state('stage1', {
        url: '/',
        templateUrl: 'app/main/main-template.html',
        controller: 'MainCtrl'
      });
		
    $locationProvider.html5Mode(true);
  });