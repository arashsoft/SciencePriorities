/**
 * Created by arman on 18/02/15.
 */
function createTreemap(parentDivID, jsonFile, $compile) {
    //console.log(jsonFile);
    var parentObject = $("#"+parentDivID);
    $.get("/app/modules/treemap/views/treemap.html", function(htmlFile) {
        var $el= parentObject.append(htmlFile);
        // compile the html template to angular scope so call methods works properly
        $compile($el)(angular.element(parentObject[0]).scope());

        // the apply function make sure binding values are set
        //angular.element(parentObject[0]).scope().refresh();
        angular.element(parentObject[0]).scope().$apply();
    });
}
