angular.module('sciencePriorities2App')
	.controller('MainCtrl', ['$scope', '$stateParams', '$state', function($scope){
	
	 $scope.benchmarkingEntities=[
		{
			"name":"Awards",
			"properties":["Universities","Departments","Top Sponsors","Source of funding"],
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
		// in fact, dropDiv is $($element),
		var dropDiv = $("#"+dropEl+ " > div");
		
		// pass drag parameters and drop-div id to associated controller scope
		angular.element(dropDiv[0]).scope().selectedEntity= drag[0].attributes.selectedEntity.value;
		angular.element(dropDiv[0]).scope().selectedProperty= drag[0].attributes.selectedProperty.value;
		angular.element(dropDiv[0]).scope().dropID = dropDiv[0].id;
		
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

angular.module('sciencePriorities2App').controller("layoutController" , ["$scope","$element",function($scope , $element){
	// $scope.dropID $scope.selectedProperty and $scope.selectedEntity set by drag&drop controller

	// handle benchmark selection
	$scope.layoutTypeClicked = function(selectedLayout){
		$.get("/jsonrequest/"+$scope.selectedEntity+"/"+$scope.selectedProperty+"/"+ selectedLayout, function (jsonFile){
			// if the session was expire or user loged out of the tool
			if (typeof jsonFile.redirect == 'string'){
				window.location = jsonFile.redirect;
			};
			
			// if the mysql server was down or any other types of error
			if (typeof jsonFile.error == 'string'){
				// I know its against angular manners but I prefer to manipulate DOM element directly
				// TODO: rewrite this code with angular
				$($element).append('<div class="alert alert-danger alert-dismissible" style="margin:10px;">'+jsonFile.error +'<span style="float:right; border: 1px solid #a94442; padding:1px; cursor:pointer; border-radius: 4px;" onclick="$(this).parent().hide(1000);">X</span> </div>');
				return;
			}
			clearInterval($scope.intervalID);
			if (selectedLayout=="barChart"){
				$scope.intervalID = createBarchart($scope.dropID, $scope.selectedEntity, $scope.selectedProperty, jsonFile);
			}else if (selectedLayout=="pieChart"){
				createPiechart($scope.dropID, $scope.selectedEntity, $scope.selectedProperty, jsonFile);
			}
		});
	};
}]);


