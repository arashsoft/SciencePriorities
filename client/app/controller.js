angular.module('sciencePriorities2App')
	.controller('MainCtrl', ['$scope', '$stateParams', '$state', function(sc){
	
	 sc.benchmarkingEntities=[
		{"name":"Awards",
		"properties":["Departments","Sponsors-Programs","Source of funding"],},
		{"name":"Professors",
		"properties":["Research chair","Department","Rank"]},
		{"name":"Publications",
		"properties":["Type","Department"]},	
		{"name":"Students",
		"properties":["Academic Level","Department"]
		}
	 ];
	
}]);

angular.module('sciencePriorities2App').controller("CenterController" , ["$scope",function($scope){
	$scope.dropped= function (dragEl, dropEl ){
		console.log("Object "+dragEl+" Droped on " + dropEl);
	}
}]);