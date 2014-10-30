angular.module('sciencePriorities2App')
	.controller('MainCtrl', ['$scope', '$stateParams', '$state', function($scope){
	
	 $scope.benchmarkingEntities=[
		{
			"name":"Awards",
			"properties":["Departments","Sponsors-Programs","Source of funding"],
			"isOpen":"true"
		},		
		{
			"name":"Professors",
			"properties":["Research chair","Department","Rank"],
			"isOpen":"true"
		},
		{
			"name":"Publications",
			"properties":["Type","Department"],
			"isOpen":"true"
		},	
		{
			"name":"Students",
			"properties":["Academic Level","Department"],
			"isOpen":"true"
		}
	 ];

}]);

angular.module('sciencePriorities2App').controller("CenterController" , ["$scope",function($scope){
	$scope.multiViewModel="single"
	$scope.dropped= function (dragEl, dropEl ){
		//console.log("Object "+dragEl+" Droped on " + dropEl);
		drag= $("#"+dragEl);
		createBarchart(dropEl,"test","test");
	}
}]);