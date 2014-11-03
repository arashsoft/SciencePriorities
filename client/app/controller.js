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

angular.module('sciencePriorities2App').controller("CenterController" , ["$scope","$compile","$templateCache",function($scope, $compile, $templateCache){
	$scope.multiViewModel="single"
	$scope.dropped= function (dragEl, dropEl ){
		var drag= $("#"+dragEl);
		var dropDiv = $("#"+dropEl+ " > div");
		
		// pass drag parameter to associated controller scope
		console.log(drag[0].attributes.selectedEntity);
		angular.element(dropDiv[0]).scope().selectedEntity= drag[0].attributes.selectedEntity.value;
		angular.element(dropDiv[0]).scope().selectedProperty= drag[0].attributes.selectedProperty.value;
			
		// load select benchmark template
		$.get("app/benchmarkMenu/benchmarkMenu.html", function(htmlFile) {	
		
			//angular.element(dropDiv[0]).scope().HTMLplace= htmlFile;
			var $el= $("#"+dropEl+ " > div").empty().append(htmlFile);
			// compile the code to angular scope so call methods works properly
			$compile($el)(angular.element(dropDiv[0]).scope());
			
			// jquery code which is not acceptable in angular
			//$("#"+dropEl+ " > div").empty().append(htmlFile);
		});
	};
}]);

angular.module('sciencePriorities2App').controller("layoutController" , ["$scope",function($scope){
	// handle d3 animation
	$scope.layoutTypeClicked = function(selectedLayout){
		//console.log("btn click: "+ selectedLayout + "pro: "+$scope.selectedProperty+"ent: "+$scope.selectedEntity);
	};
}]);


