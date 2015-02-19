/* sample data:
nodes: [{name:"abc" , department : "dasdas"},{name:"def"},{name:"123"},{name:546}],
links : [{source:"adc.id",target:"123.id", type:"award" , linkType:"departmentName or 0" },{source:"546",target:"def", ...}],
departments : [{name : chemistry},{name : computer science},{name : biology}]
*/

// This module is not working with angular and everything is jquery base. It means we add elements to dom directly, but, everything above parentDivID is safe and can be angular base.
// loadingObject is optional

// remove object from Array prototype
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

function  createMatrixLink(parentDivID, jsonFile, loadingObject){
	var parentObject = $("#"+parentDivID);
	var width = parentObject[0].clientWidth;
	var height = parentObject[0].clientHeight;;
	var margin = {width: width/5, height: height/5};
	var minLenght = Math.min(width,height);
	var moveToCenter = {x: margin.width/2 , y: margin.height/2 }
	var departmentColor = d3.scale.category20();
	var matrixSize = (minLenght/6);
	var transitionTime = 700;
	var selectedProfessors = [];
	var selectedDepartments =[];

	
	// now we want to make department nodes and links to run a force layout on them
	// it helps us to find best places for our matrixes
	var forceNodes = jsonFile.departments
	var forceLinks = new Array();
	
	var departmentMatrixes = new Array();
	
	var nodeHash = new Object();
	for (var i =0 , length = forceNodes.length; i < length; i++){
		forceNodes[i].relatedNodes = [];
		forceNodes[i].ID = "Department" + i;
		nodeHash[forceNodes[i].name] = i;
		// make empty links and nodes for each department metrix
		departmentMatrixes[i] = new Object();
		departmentMatrixes[i].name = forceNodes[i].name;
		departmentMatrixes[i].links = new Array();
		departmentMatrixes[i].nodes = new Array();
	}
	
	// add departmentMatrixes Nodes
	for (var i =0, length = jsonFile.nodes.length; i < length ; i++){
		var arrayLenght = departmentMatrixes[nodeHash[jsonFile.nodes[i].department]].nodes.push(jsonFile.nodes[i]);
		// we store the index of the node in departmentMatrixesPlace, so we can use it to address the node in new format
		jsonFile.nodes[i].departmentMatrixesPlace = arrayLenght-1;
	}
	
	var forceLinkObjects = new Object();
	for (var i =0, length = jsonFile.links.length; i < length ; i++){
		if (!jsonFile.links[i].linkType){
			// link between departments
			var tempLink = new Object();
			tempLink.source = nodeHash[jsonFile.nodes[jsonFile.links[i].source].department];
			tempLink.target = nodeHash[jsonFile.nodes[jsonFile.links[i].target].department];
			tempLink.award = 0;
			tempLink.pub=0;
			tempLink.coSuper=0;
			tempLink.type = jsonFile.links[i].type;
			// we remove duplicate links with this method
			if ($.isEmptyObject(forceLinkObjects[tempLink.source+"-"+tempLink.target])){
				tempLink[tempLink.type] =1;
				forceLinkObjects[tempLink.source+"-"+tempLink.target]=tempLink;
			}else{
				forceLinkObjects[tempLink.source+"-"+tempLink.target][tempLink.type]++;
			}
		} else{
			// link inside a department
			departmentMatrixes[nodeHash[jsonFile.links[i].linkType]].links.push({source: jsonFile.nodes[jsonFile.links[i].source].departmentMatrixesPlace, target: jsonFile.nodes[jsonFile.links[i].target].departmentMatrixesPlace,type:jsonFile.links[i].type });
		}
	}
	// convert forceLinkObjects to forceLinks (object to array)
	for (var tempLink in forceLinkObjects){
		forceLinks.push(forceLinkObjects[tempLink]);
		// we add related nodes here to use when user enlarge one of matrixes (departments)
		forceNodes[forceLinkObjects[tempLink].source].relatedNodes.push(forceNodes[forceLinkObjects[tempLink].target]);
		forceNodes[forceLinkObjects[tempLink].target].relatedNodes.push(forceNodes[forceLinkObjects[tempLink].source]);
	}
	
	var force = d3.layout.force()
		.size([width- margin.width, height  -margin.height])
		.nodes(forceNodes)
		.links(forceLinks)
		.charge(-(minLenght*14))
		.linkDistance( minLenght/2.2)
		.friction(0.7)
		.gravity(0.2)
		.linkStrength(0.5);
	
	
	// let the force move for 1000 times to get matrix locations
	force.start();
	for (var i=0;i<1000;i++){
		force.tick();
	}
	force.stop();
	
	var screenDragZoom = d3.behavior.zoom()
    .scaleExtent([0.1, 5])
    .on("zoom", function(){
			container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
		});
		
	// empty parentObject and start adding items to it
	// 	if (typeof(loadingObject) !== 'undefined') { loadingObject.remove(); }
	parentObject.empty();
	
	// selectedDepartments menu - also select link types
	var selectDepartmentDiv= $('<div class ="noselect" style="position:absolute; top:11%; right:5px; opacity: 0.85; width:14%; min-width:125px;"><div align="center"><label class="btn btn-primary checkboxButton" style="background-color: rgb(0, 100, 0);">Award <input type="checkbox" value="award" checked></label><label class="btn btn-primary checkboxButton" style="background-color: rgb(17, 63, 170);">Publication <input type="checkbox" value="pub" checked></label><label class="btn btn-primary checkboxButton" style="background-color: rgb(214, 29, 29);">Supervision <input type="checkbox" value="coSuper" checked><label></div><ul class = "ui-menu ui-widget ui-widget-content ui-corner-all" id="'+ parentDivID+ 'departmentMenu" style="padding:10px; margin-top:10px; visibility:hidden"> <li class="ui-widget-header">Selected Departments</li> <label class="btn btn-primary" id="'+parentDivID+'departmentMenuButton" style="padding: 0px 3px;margin-top:15px;" >Show Relations</label></ul> </div>')
	selectDepartmentDiv.appendTo(parentObject);
	
	selectDepartmentDiv.find(".checkboxButton input").change(function() {
		var awardM = selectDepartmentDiv.find(".checkboxButton input[value='award']").is(":checked");
		var pubM = selectDepartmentDiv.find(".checkboxButton input[value='pub']").is(":checked");
		var coSuperM = selectDepartmentDiv.find(".checkboxButton input[value='coSuper']").is(":checked");
		matrixDepartmentlinks.transition().duration(400).style("stroke-width", function(d){
				return lineScale(d.award * awardM + d.pub * pubM + d.coSuper * coSuperM);
		});
		
	});
		
	
	// department selection bar
	parentObject.append('<div id="'+ parentDivID + 'departmentBar" class ="noselect niceScroll" style="position:absolute; top:5px;left:5px; max-height:10%; overflow-y: scroll; opacity: 0.85"></div>');
	
	// selectedProfessor menu
	var selectedProfMenu = $('<div class ="noselect" style="position:absolute; top:11%;left:5px; opacity: 0.85; width:14%; min-width:125px; visibility:hidden;"></div>');
	var selectedProfUl = $(' <ul style="padding:10px;"> <li class="ui-widget-header">Selected Professors</li></ul>');
	var selectedProf_Button = $('<label class="btn btn-primary" style="padding: 0px 3px;margin-top:15px;" >Show Relations</label>');
	
	selectedProfUl.append(selectedProf_Button);
	selectedProfMenu.append(selectedProfUl);
	parentObject.append(selectedProfMenu);
	
	selectedProfUl.menu({
		items: "> :not(.ui-widget-header)"
	});
  
	selectedProf_Button.click(function(){
		if (selectedProfessors.length==0){return;}
		var selectedProfessorsID = [];
		for (var i=0; i< selectedProfessors.length ; i++){
			selectedProfessorsID.push(selectedProfessors[i].ID);
		}
		
		var mainDiv = $('<div align="center" class="matrixLinkBenchmarkSelectDiv"><div class="btn btn-danger close-btn" onclick="var tempObject = $(this).parent().parent(); tempObject.hide(1000,function(){tempObject.remove()});">X</div></div>');
		$('<div class="matrixLinkBenchmarkSelect"></div>').append(mainDiv).appendTo(parentObject);
		var loadingGif = $('<img src="/assets/images/loading.gif" alt="loading" style="width: 40%; height:60%;">');
		loadingGif.appendTo(mainDiv);
		
		// get data for selected Professors
		$.get('/jsonrequest2/professorSelect/' + JSON.stringify(selectedProfessorsID) , function(result){
			compareDepartments(mainDiv ,result, departmentColor, loadingGif , selectedProfessorsID);
		});
		
	});
	
	
	var svg = d3.select("#"+parentDivID).append("svg")
		 .attr("width", width)
		 .attr("height", height);
	
	var mainSvg = svg;
	
	svg = svg.append("g")
		.call(screenDragZoom).on("dblclick.zoom", null);
	
	var mainRect = svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .style("fill", "none")
    .style("pointer-events", "all");
	
	// main g - all elements will add to container
	var container = svg.append("g");
	
	// we do not want to show department nodetrix - we just use it as matrix places
	// move department nodes to center (margin and other stupid things../)
	for (var i=0, length = forceNodes.length; i < length ; i++ ){
		forceNodes[i].x += moveToCenter.x;
		forceNodes[i].y += moveToCenter.y;
		forceNodes[i].size = matrixSize;
	}
	
	// scale for links width
	//var lineScale = d3.scale.linear()
	function lineScale(value){
		//.domain([1, 100])
    //.range([0.3,10]);
		if (value==0){return 0;}
		return (97/990)*value+(20/99);
	}
	// draw links between departments for first time
	var matrixDepartmentlinks = container.selectAll(".matrixLink.link")
		.data(forceLinks)
			.enter().append("line")
			.attr("class" , "matrixLink link")
			.attr("x1", function(d) { return d.source.x + d.source.size/2})
			.attr("y1", function(d) { return d.source.y + d.source.size/2})
			.attr("x2", function(d) { return d.target.x + d.target.size/2})
			.attr("y2", function(d) { return d.target.y + d.target.size/2})
			.style("stroke-width", function(d){return lineScale(d.award + d.pub + d.coSuper)});
	
	// its time to show matrixes
	for (var i=0, length =forceNodes.length; i < length ; i++ ){
		createMatrix(forceNodes[i] , departmentMatrixes[i].links, departmentMatrixes[i].nodes);
	}
	
	// we add context-menu to department rectangles (context-menu handle events itself)
	$(".departmentG").contextmenu({
		preventContextMenuForPopup: true,
    preventSelect: true,
		menu: [
        {title: "Select/UnSelect", cmd: "select"},
        {title: "Arrange", children: [
           {title: "By name", cmd: "name"},
           {title: "By collaboration count", cmd: "count"}
				]},
				{title: "Hide", cmd: "hide"}
        ],
			select: function(event, ui) {
				// call refreshMatrix method
				$(ui.target).trigger("refreshMatrix" ,ui.cmd);
			}
	});
	
	// time to add departmentbar items
	departmentBarLabels = d3.select("#"+parentDivID + "departmentBar").selectAll("label")
		.data(forceNodes).enter()
		.append("label")
		.attr("class","departmentButton btn btn-primary active")
		.attr("name",function(d){return d.name;})
		.style("background-color",function(d){return departmentColor(d.name);})
		.html(function(d){return d.name});
	
	//set onclick for departmentBar
	$("#"+parentDivID + "departmentBar > .btn.btn-primary").click(function(event){
		var element = $(event.currentTarget);
		if(element.hasClass("active")){
			// hide department
			element.removeClass("active");
			container.selectAll(".departmentG").style("visibility" , function(){ 
				if (d3.select(this).select(".matrixLink.background").data()[0].name==element.attr("name")){
					return "hidden";
				}else{
					return d3.select(this).style("visibility");
				}
			})
			// hide related links
			matrixDepartmentlinks.style("visibility", function(d){
				if (d.source.name == element.attr("name") || d.target.name == element.attr("name")){
					return "hidden";
				}else {
					return d3.select(this).style("visibility");
				}
			})
		}else{
			// show department
			element.addClass("active");
			container.selectAll(".departmentG").style("visibility" , function(){ 
				if (d3.select(this).select(".matrixLink.background").data()[0].name==element.attr("name")){
					return "visible";
				}else{
					return d3.select(this).style("visibility");
				}
			})
			// show related links
			matrixDepartmentlinks.style("visibility", function(d){
				// check if both sides of link are visible or not
				if ((d.source.name == element.attr("name") && $(d.target.element.node().parentNode).css("visibility")=="visible")|| (d.target.name == element.attr("name") && $(d.source.element.node().parentNode).css("visibility")=="visible")){
					return "visible";
				}else {
					return d3.select(this).style("visibility");
				}
			})
		}
	}) // end of departmentBar click
	
	//set onclick for departmentMenuButton
	$("#"+parentDivID+"departmentMenuButton").click(function(){
		
		var mainDiv = $('<div align="center" class="matrixLinkBenchmarkSelectDiv"><div class="btn btn-danger close-btn" onclick="var tempObject = $(this).parent().parent(); tempObject.hide(1000,function(){tempObject.remove()});">X</div></div>');
		$('<div class="matrixLinkBenchmarkSelect"></div>').append(mainDiv).appendTo(parentObject);
		var loadingGif = $('<img src="/assets/images/loading.gif" alt="loading" style="width: 40%; height:60%; position:absolute;left:30%;top:20%;">');
		loadingGif.appendTo(mainDiv);
		
		// request nodes and links for compare departments
		$.get('/jsonrequest2/departmentSelect/' + JSON.stringify(selectedDepartments) , function(result){
			compareDepartments(mainDiv,result,departmentColor, loadingGif);
		});
	});
	
	// "nodes" and "links" refer to elements inside the current matrix
	// but the parameter "node" refers to the matrix element itself
	function createMatrix(node, links, nodes ){
		var matrix = [];
		var n = nodes.length;
		var xScale = d3.scale.ordinal().rangeBands([0, node.size]);
		
		// Compute index per node.
		nodes.forEach(function(node, i) {
			node.index = i;
			node.count = 0;
			matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, award:0,pub:0,coSuper:0}; });
		});

		// Convert links to matrix; count link occurrence
		links.forEach(function(link) {
			if(link.type=="award"){
				matrix[link.source][link.target].award++;
				matrix[link.target][link.source].award++;
			}else if(link.type=="pub"){
				matrix[link.source][link.target].pub++;
				matrix[link.target][link.source].pub++;
			}else {
				matrix[link.source][link.target].coSuper++;
				matrix[link.target][link.source].coSuper++;
			}
			nodes[link.source].count ++;
			nodes[link.target].count ++;
		});

		// Pre-compute the orders.
		var orders = {
			name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
			count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
		};

		// The default sort order.
		xScale.domain(orders.name);
		
		// this function(behavior) handles matrix drags
		var matrixDrag = d3.behavior.drag()
			.on('dragstart', function() { 
				d3.event.sourceEvent.stopPropagation();
				d3.select(this).select("rect").classed("drag" , 1);
			})
			.on('drag', function() {
				// d3.event.sourceEvent.stopPropagation();
				// tempX and tempY are 0 at first move
				var tempX = parseFloat(d3.select(this).attr('x'));
				var tempY = parseFloat(d3.select(this).attr('y'));
				tempX += d3.event.dx;
				tempY += d3.event.dy;
				
				// move matrix
				d3.select(this)
					.attr("x", tempX)
					.attr("y", tempY)
					.attr("transform" , "translate(" + tempX + "," + tempY +")" );
				
				// move data position
				node.x += d3.event.dx;
				node.y += d3.event.dy;
				
				// now it is the time to move links
				matrixDepartmentlinks
					.attr("x1", function(d) { return d.source.x + d.source.size/2; })
					.attr("y1", function(d) { return d.source.y+ d.source.size/2; })
					.attr("x2", function(d) { return d.target.x+ d.target.size/2; })
					.attr("y2", function(d) { return d.target.y+ d.target.size/2; });
				
			})
			.on('dragend', function(d) {
				d3.event.sourceEvent.stopPropagation();
				d3.select(this).select("rect").classed("drag", 0);
			});
		
		var departmentG = container.append("g")
			.attr("x", 0)
			.attr("y", 0)
			.attr("class","departmentG")
			.call(matrixDrag);
		
		var departmentRectTimer;
		var departmentRect = departmentG.append("rect")
			.attr("class", "matrixLink background")
			.attr("x", node.x)
			.attr("y", node.y)
			.attr("width", node.size)
			.attr("height", node.size)
			.style("stroke", departmentColor(node.name))
			.datum(node);
			
		departmentRect.on("dblclick", function(){
				if (d3.event.defaultPrevented) return;
				enlargeMatrix();
			});
			
		// we make a link from data to element (because sometimes we have access to data but we do not want to loop between elements to find it)
		departmentRect.datum(function(d){
			d.element = departmentRect;
			return d;
		})
		
		departmentRect.on("touchstart", function(){
			var myevent = d3.event;
			departmentRectTimer = setTimeout(function(){
				// handle long-press function	
				// 1000 is the length of time we want the user to touch before we do something	
				// TODO : we have to prevent tap because it is hold d3.event.preventDefault does not work
				myevent.preventDefault();
				//$(container[0]).contextmenu("open", $(departmentRect[0]));
			}, 1000); 
		}).on("touchend", function(e){
			//stops short touches from firing the event	
			if (departmentRectTimer)
				clearTimeout(departmentRectTimer);
		}).on("touchmove", function(e){
			//stops short touches from firing the event	
			if (departmentRectTimer)
				clearTimeout(departmentRectTimer);
		});
		
		$(departmentRect[0]).bind("refreshMatrix" , function(event , order){
			switch(order) {
				case "name":
				case "count":
					if (order=="name"){
						xScale.domain(orders.name);
					}else if (order=="count"){
						xScale.domain(orders.count);
					}
					var t = departmentG.transition().duration(2500);
					t.selectAll(".matrixLink.row")
						.delay(function(d, i) { return xScale(i) * 4; })
						.attr("transform", function(d, i) { return "translate(0," + (xScale(i) + parseFloat(departmentRect.attr('y'))) + ")"; })
						.selectAll(".matrixLink.cell")
							.delay(function(d) { return xScale(d.x) * 4; })
							.attr("x", function(d) { return xScale(d.x) + parseFloat((departmentRect.attr('x'))); });

					t.selectAll(".matrixLink.column")
						.delay(function(d, i) { return xScale(i) * 4; })
						.attr("transform", function(d, i) { return "translate(" + (xScale(i) + parseFloat((departmentRect.attr('x')))) + ")rotate(-90)"; });
					break;
				case "hide":
					// hide department
					// make label de-active
					departmentBarLabels.each(function(d){
						if (d.name==node.name){
							d3.select(this).classed("active",false);
						}
					});
					departmentG.style("visibility","hidden");
					// hide related links
					matrixDepartmentlinks.style("visibility", function(d){
						if (d.source.name == node.name || d.target.name == node.name){
							return "hidden";
						}else {
							return d3.select(this).style("visibility");
						}
					})
					break;
				case "select":
					if (selectedDepartments.indexOf(node.name)!=-1){
						// unselect
						selectedDepartments.remove(node.name);
						node.selectMenuElement.remove();
						if (selectedDepartments.length==0){
							$("#"+parentDivID+ "departmentMenu").css("visibility","hidden");
						}
					}else{
						// select
						$("#"+parentDivID+ "departmentMenu").css("visibility","visible");
						selectedDepartments.push(node.name);
						node.selectMenuElement = $("<li id='" + parentDivID + node.ID+ "' class='matrixLink selectLi'>"+ node.name+"</li>").append('<style>#'+ parentDivID + node.ID +':before {color:'+departmentColor(node.name)+';}</style>');
						node.selectMenuElement.insertBefore("#"+parentDivID+"departmentMenuButton");
					}
					break;
				default:
				// default happens when user click on Arrange. nothing to do.
			}
		});
		
		// department titles
		var departmentTitle = departmentG.append("text")
			.attr("x",  parseFloat(departmentRect.attr("x")) + (parseFloat(departmentRect.attr("width")/2)))
			.attr("y", parseFloat(departmentRect.attr("y")) + parseFloat(departmentRect.attr("height")))
			.attr("dy", "14px")
			.text(node.name)
			.attr("class","matrixLink title");
		
		/* departmentG.insert("rect", "text")
			.attr("x",departmentTitle.node().getBBox().x)
			.attr("y",departmentTitle.node().getBBox().y)
			.attr("width",departmentTitle.node().getBBox().width)
			.attr("height",departmentTitle.node().getBBox().height)
			.style("fill" , departmentColor(node.name));
		 */
		
			
		
		var row = departmentG.selectAll(".matrixLink.row")
			.data(matrix)
			.enter().append("g")
			.attr("class", "matrixLink row")
			.attr("transform", function(d, i) {return "translate(0," + (xScale(i) + node.y) + ")"; })
			.each(function (d){
				createRow(this , d);
			});
		var rowLines = row.append("line")
			.attr("x2", node.size)
			.attr("class", "matrixLink line")
			.attr("transform","translate("+ node.x + ",0)");
/*
		row.append("text")
			.attr("x", -6 + positionX)
			.attr("y", (xScale.rangeBand() / 2) )
			.attr("dy", ".32em")
			.attr("text-anchor", "end")
			.text(function(d, i) { return nodes[i].name; });
*/
	  var column = departmentG.selectAll(".matrixLink.column")
			.data(matrix)
		 .enter().append("g")
			.attr("class", "matrixLink column")
			.attr("transform", function(d, i) { return "translate(" + (xScale(i) + node.x) + ")rotate(-90)"; });

	  var columnLines = column.append("line")
			.attr("x1", -node.size)
			.attr("class", "matrixLink line")
			.attr("transform","translate("+ -node.y + ",0)");
/*
	  column.append("text")
			.attr("x", 6 + positionX)
			.attr("y", (xScale.rangeBand() / 2) + positionY)
			.attr("dy", ".32em")
			.attr("text-anchor", "start")
			.text(function(d, i) { return nodes[i].name; });
*/
	  function createRow(object , objectData) {
			// awards
			d3.select(object).selectAll(".matrixLink.cell.award")
				.data(objectData.filter(function(d){return d.award;} ))
				.enter().append("rect")
				.attr("class", "matrixLink cell award")
				.attr("x", function(d) { return (xScale(d.x) + node.x); })
				.attr("width", xScale.rangeBand()/3)
				.attr("height", xScale.rangeBand())
				.style("fill","green")
				.style("opacity",function(d){return 0.4+d.award*0.2;});
			// pubs
			d3.select(object).selectAll(".matrixLink.cell.pub")
				.data(objectData.filter(function(d){return d.pub;} ))
				.enter().append("rect")
				.attr("class", "matrixLink cell pub")
				.attr("x", function(d) { return (xScale(d.x) + node.x + xScale.rangeBand()/3); })
				.attr("width", xScale.rangeBand()/3)
				.attr("height", xScale.rangeBand())
				.style("fill","blue")
				.style("opacity",function(d){return 0.4+d.pub*0.2;});
			// co-Supervisor
			d3.select(object).selectAll(".matrixLink.cell.coSuper")
				.data(objectData.filter(function(d){return d.coSuper;} ))
				.enter().append("rect")
				.attr("class", "matrixLink cell coSuper")
				.attr("x", function(d) { return (xScale(d.x) + node.x + xScale.rangeBand()*2/3); })
				.attr("width", xScale.rangeBand()/3)
				.attr("height", xScale.rangeBand())
				.style("fill","red")
				.style("opacity",function(d){return 0.4+d.coSuper*0.2;});
			
	  }
		
		function enlargeMatrix(){
			// we take 20% as margin (* 0.8)
			node.size = Math.min(height,width)*0.8;

			xScale.rangeBands([0, node.size]);
			
			departmentRect.transition().attr("width", node.size)
			.attr("height", node.size).duration(transitionTime);
			
			departmentTitle.transition().attr("x", parseFloat(departmentRect.attr("x")) + (node.size/2))
			.attr("y", parseFloat(departmentRect.attr("y")) + node.size).duration(transitionTime);
			
			row.transition().attr("transform", function(d, i) {
				return "translate(0," + (xScale(i) + parseFloat(departmentRect.attr('y'))) + ")";
			}).duration(transitionTime)
			.each(function (d){
				//createRow(d);
				d3.select(this).selectAll(".matrixLink.cell.award")
						.transition().attr("x", function(d) { return xScale(d.x) + parseFloat((departmentRect.attr('x'))); })
						.attr("width", xScale.rangeBand()/3)
						.attr("height", xScale.rangeBand()).duration(transitionTime);
				d3.select(this).selectAll(".matrixLink.cell.pub")
						.transition().attr("x", function(d) { return xScale(d.x) + parseFloat((departmentRect.attr('x'))) + xScale.rangeBand()/3; })
						.attr("width", xScale.rangeBand()/3)
						.attr("height", xScale.rangeBand()).duration(transitionTime);
				d3.select(this).selectAll(".matrixLink.cell.coSuper")
						.transition().attr("x", function(d) { return xScale(d.x) + parseFloat((departmentRect.attr('x'))) + xScale.rangeBand()*2/3; })
						.attr("width", xScale.rangeBand()/3)
						.attr("height", xScale.rangeBand()).duration(transitionTime);
				
			});
			
			column.transition().attr("transform", function(d, i) { return "translate(" + (xScale(i) + parseFloat((departmentRect.attr('x')))) + ")rotate(-90)"; }).duration(transitionTime);
			columnLines.attr("x1", -node.size);
			rowLines.attr("x2", node.size);
			
			
			// add background for professors texts
			// jquery? because d3 is stupid at adding single elements
			/*
			var rowTextBackground = $("<rect/>").attr("x",  node.x-100)
				.attr("y",  node.y)
				.attr("width", 100)
				.attr("height", node.size)
				.attr("class", "matrixLink textBackground")
				.insertBefore($(row[0][0]));
			*/
			// surprise! jquery is not working! -> the problem is SVG is XML format not html! I use pure JS
			var rowTextBackground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
			rowTextBackground.setAttributeNS(null,"x",  parseFloat((departmentRect.attr('x')))-120);
			rowTextBackground.setAttributeNS(null,"y",  parseFloat((departmentRect.attr('y'))));
			rowTextBackground.setAttributeNS(null,"width", 120);
			rowTextBackground.setAttributeNS(null,"height", node.size);
			rowTextBackground.setAttributeNS(null,"class", "matrixLink textBackground");
			departmentG[0][0].insertBefore(rowTextBackground, row[0][0]);
			
			// add professors text
			var rowText = row.append("text")
				.attr("x", -6 + parseFloat((departmentRect.attr('x'))))
				.attr("y", (xScale.rangeBand() / 2) )
				.attr("dy", ".32em")
				.attr("text-anchor", "end")
				.attr("class","matrixLink text")
				.text(function(d, i) { return nodes[i].name; });
			
			
			
			// handle adding or removing professors to list
			rowText.on("click",function(d , i){
				if (d3.select(this).classed("selected")){
					// remove from menu
					$("#"+parentDivID +nodes[i].ID).remove();
					// remove from selectedProfessors array
					selectedProfessors.remove(nodes[i]);
					// remove class to make them black again
					d3.select(this).classed("selected",false);
					d3.select(columnText[0][i]).classed("selected",false);
					if (selectedProfessors.length==0)
						selectedProfUl.css("visibility","hidden");
					
				}else{
					
					// add to menu
					selectedProfUl.css("visibility","visible");
					
					var tempLi = $("<li class='matrixLink selectLi' id='" + parentDivID +nodes[i].ID+ "'>"+ nodes[i].name+"</li>");
					var tempLiStyle = $('<style>#'+ parentDivID +nodes[i].ID +':before {color:'+departmentColor(node.name)+';}</style>');
					tempLi.insertBefore(selectedProf_Button);
					tempLiStyle.insertBefore(selectedProf_Button);
					
					// add to selectedProfessors array
					selectedProfessors.push(nodes[i]);
					// set class to make them red
					d3.select(this).classed("selected",true);
					d3.select(columnText[0][i]).classed("selected",true);
				}
			});
			
			var columnTextBackground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
			columnTextBackground.setAttributeNS(null,"x",  parseFloat((departmentRect.attr('x'))));
			columnTextBackground.setAttributeNS(null,"y",  parseFloat((departmentRect.attr('y')))-120);
			columnTextBackground.setAttributeNS(null,"width", node.size);
			columnTextBackground.setAttributeNS(null,"height", 120);
			columnTextBackground.setAttributeNS(null,"class", "matrixLink textBackground");
			departmentG[0][0].insertBefore(columnTextBackground, row[0][0]);
			
			var columnText = column.append("text")
				.attr("x", 10 - parseFloat((departmentRect.attr('y'))))
				.attr("y", (xScale.rangeBand() / 2))
				.attr("dy", ".32em")
				.attr("text-anchor", "start")
				.attr("class","matrixLink text")
				.text(function(d, i) { return nodes[i].name; })
				.classed("selected",function(d,i){
					for (var j =0;j<selectedProfessors.length;j++){
						if(selectedProfessors[j].ID==nodes[i].ID){
							d3.select(rowText[0][i]).classed("selected",true);
							return true;
						}
					}
					return false;
				});
				
			columnText.on("click",function(d , i){
				if (d3.select(this).classed("selected")){
					// remove from menu
					$("#"+parentDivID +nodes[i].ID).remove();
					// remove from selectedProfessors array
					selectedProfessors.remove(nodes[i]);
					// remove class to make them black again
					d3.select(this).classed("selected",false);
					d3.select(rowText[0][i]).classed("selected",false);
					if (selectedProfessors.length==0)
						selectedProfUl.css("visibility","hidden");
				}else{
					
					// add to menu
					selectedProfUl.css("visibility","visible");
					
					var tempLi = $("<li class='matrixLink selectLi' id='" + parentDivID +nodes[i].ID+ "'>"+ nodes[i].name+"</li>");
					var tempLiStyle = $('<style>#'+ parentDivID +nodes[i].ID +':before {color:'+departmentColor(node.name)+';}</style>');
					tempLi.insertBefore(selectedProf_Button);
					tempLiStyle.insertBefore(selectedProf_Button);
					
					// add to selectedProfessors array
					selectedProfessors.push(nodes[i]);
					// set class to make them red
					d3.select(this).classed("selected",true);
					d3.select(rowText[0][i]).classed("selected",true);
				}
			});
			
			departmentRect.on("dblclick", function(){
				if (d3.event.defaultPrevented) return;
				// remove texts
				rowText.remove();
				columnText.remove();
				// remove text backgrounds
				departmentG[0][0].removeChild(rowTextBackground);
				departmentG[0][0].removeChild(columnTextBackground);
				
				shrinkMatrix();
			});
			
			// now it is the time to move other depratment rects
			container.selectAll('.departmentG')
				.attr('x', function(){
					var currentTranslateX = parseFloat(departmentG.attr('x'));
					var currentRectX = parseFloat(departmentRect.attr('x'));
					
					var elementTranslateX = parseFloat(d3.select(this).attr('x'));
					var elementRectX = parseFloat(d3.select(this).select('rect').attr('x'));
					
					var tempIf = (elementTranslateX+elementRectX) - (currentTranslateX+currentRectX);
					if (tempIf > 0){
						// it means we move the matrix
						d3.select(this).select('rect').datum().x = elementTranslateX + elementRectX + node.size;
						return elementTranslateX + node.size;
					
					}else if (tempIf < 0){
						// we  move  matrixes a bit left
						d3.select(this).select('rect').datum().x = elementTranslateX + elementRectX -200;
						return elementTranslateX -200;
					}else{
						// only for the selected matrix itself
						return elementTranslateX;
					}
				})
				// move matrixes
				.transition().attr("transform" , function(){
					return "translate(" + this.attributes.x.value + "," + this.attributes.y.value +")";
				}).duration(transitionTime);
			// move links
			matrixDepartmentlinks
					.transition().attr("x1", function(d) { return d.source.x + d.source.size/2; })
					.attr("y1", function(d) { return d.source.y + d.source.size/2; })
					.attr("x2", function(d) { return d.target.x + d.target.size/2; })
					.attr("y2", function(d) { return d.target.y + d.target.size/2; }).duration(transitionTime);
		
			// hide unrelated departments
			container.selectAll('.departmentG').style("opacity",function(){
				// reset related and selected classes
				d3.select(this).select('rect').classed("related",0).classed("selected",0);
				
				// selected department itself
				if (d3.select(this).select('rect').datum().name==node.name) {
					d3.select(this).select('rect').classed("selected",1);
					return 1
				};
				
				// related departments
				for (var i=0;i<node.relatedNodes.length;i++){
					if(d3.select(this).select('rect').datum().name==node.relatedNodes[i].name){
							d3.select(this).select('rect').classed("related",1);
							return 1;
					}
				}
				return 0.3;
			});
			
		} // end of enlargeMatrix function
		
		function shrinkMatrix(){
			
			var differentSize = node.size;
			node.size = matrixSize;

			xScale.rangeBands([0, node.size]);
			
			departmentRect.transition().attr("width", node.size)
			.attr("height", node.size).duration(transitionTime);
			
			departmentTitle.transition().attr("x", parseFloat(departmentRect.attr("x")) + (node.size/2))
			.attr("y", parseFloat(departmentRect.attr("y")) + node.size).duration(transitionTime);
			
			departmentRect.on("dblclick", function(){
				if (d3.event.defaultPrevented) return;
				enlargeMatrix(this);
			});
			
			row.transition().attr("transform", function(d, i) {
				return "translate(0," + (xScale(i) + parseFloat(departmentRect.attr('y'))) + ")";
			}).duration(transitionTime)
			.each(function (d){
				//createRow(d);
				d3.select(this).selectAll(".matrixLink.cell.award")
						.transition().attr("x", function(d) { return xScale(d.x) + parseFloat((departmentRect.attr('x'))); })
						.attr("width", xScale.rangeBand()/3)
						.attr("height", xScale.rangeBand()).duration(transitionTime);
				d3.select(this).selectAll(".matrixLink.cell.pub")
						.transition().attr("x", function(d) { return xScale(d.x) + parseFloat((departmentRect.attr('x'))) + xScale.rangeBand()/3; })
						.attr("width", xScale.rangeBand()/3)
						.attr("height", xScale.rangeBand()).duration(transitionTime);
				d3.select(this).selectAll(".matrixLink.cell.coSuper")
						.transition().attr("x", function(d) { return xScale(d.x) + parseFloat((departmentRect.attr('x'))) + xScale.rangeBand()*2/3; })
						.attr("width", xScale.rangeBand()/3)
						.attr("height", xScale.rangeBand()).duration(transitionTime);
			});
			
			column.transition().attr("transform", function(d, i) { return "translate(" + (xScale(i) + parseFloat((departmentRect.attr('x')))) + ")rotate(-90)"; }).duration(transitionTime);
			columnLines.attr("x1", -node.size);
			rowLines.attr("x2", node.size);
			
			// now it is the time to move other depratment rects
			container.selectAll('.departmentG')
				.attr('x', function(){
					var currentTranslateX = parseFloat(departmentG.attr('x'));
					var currentRectX = parseFloat(departmentRect.attr('x'));
					
					var elementTranslateX = parseFloat(d3.select(this).attr('x'));
					var elementRectX = parseFloat(d3.select(this).select('rect').attr('x'));
					
					var tempIf = (elementTranslateX+elementRectX) - (currentTranslateX+currentRectX);
					if (tempIf > 0){
						// it means we move the matrix
						d3.select(this).select('rect').datum().x = elementTranslateX + elementRectX - differentSize;
						return elementTranslateX - differentSize;
					
					}else if (tempIf < 0){
						// we  move  matrixes a bit right
						d3.select(this).select('rect').datum().x = elementTranslateX + elementRectX +200;
						return elementTranslateX +200;
					}else{
						// only for the selected matrix itself
						return elementTranslateX;
					}
				})
				
				// move matrixes
				.transition().attr("transform" , function(){
					return "translate(" + this.attributes.x.value + "," + this.attributes.y.value +")";
				}).duration(transitionTime);
			// move links
			matrixDepartmentlinks
					.transition().attr("x1", function(d) { return d.source.x + d.source.size/2; })
					.attr("y1", function(d) { return d.source.y + d.source.size/2; })
					.attr("x2", function(d) { return d.target.x + d.target.size/2; })
					.attr("y2", function(d) { return d.target.y + d.target.size/2; }).duration(transitionTime);
		
			// reset classes and opacity
			// hide unrelated departments
			container.selectAll('.departmentG').style("opacity",function(){
				// reset related and selected classes
				d3.select(this).select('rect').classed("related",0).classed("selected",0);
				return 1
			});

		} // end of shrinkMatrix
	} // end of createMatrix function
	
	// this function handle screen resize
	function matrixLinkResize(){
		mainSvg.attr("width", width)
		 .attr("height", height);
	
		mainRect.attr("width", width)
    .attr("height", height);
	}
	
	// set resizer function every 1 sec
	var intervalID = setInterval(function () {
		if ( width != parentObject[0].clientWidth || height != parentObject[0].clientHeight) {
			width = parentObject[0].clientWidth;
			height = parentObject[0].clientHeight;
			matrixLinkResize();
		}			
	}, 1000);
	
	return intervalID;
	
} // end of createMatrixLink function