/**
 * Created by arman on 18/02/15.
 */
function createDualTreemap(parentDivID, jsonFile, $compile) {
    var parentObject = $("#"+parentDivID);
    $.get("/app/modules/dualTreemap/views/dualTreemap.html", function(htmlFile) {
        var $el= parentObject.append(htmlFile);
				$el.css("overflow-y","auto");
        // compile the html template to angular scope so call methods works properly
        $compile($el)(angular.element(parentObject[0]).scope());

        // the apply function make sure binding values are set
        //angular.element(parentObject[0]).scope().refresh();
        angular.element(parentObject[0]).scope().$apply();
    });
}
