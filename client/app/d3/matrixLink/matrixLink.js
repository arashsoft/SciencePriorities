/* sample data:
nodes: [{name:"abc" , department : "dasdas"},{name:"def"},{name:"123"},{name:546}],
links : [{source:"adc.id",target:"123.id", type:"award" , linkType:"departmentName or 0" },{source:"546",target:"def", ...}],
departments : [{name : chemistry},{name : computer science},{name : biology}]
*/

// remove object from Array
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

function  createMatrixLink(parentDivID, jsonFile){
	var parentObject = $("#"+parentDivID);
	var width = parentObject[0].clientWidth;
	var height = parentObject[0].clientHeight;;
	var margin = {width: width/5, height: height/5};
	var minLenght = Math.min(width,height);
	var moveToCenter = {x: margin.width/2 , y: margin.height/2 }
	var color = d3.scale.category20();
	var matrixSize = (minLenght/6);
	var transitionTime = 700;
	var selectedProfessors = [];
	
	// now we want to make department nodes and links to run a force layout on them
	// it helps us to find best places for our matrixes
	var forceNodes = jsonFile.departments
	var forceLinks = new Array();
	
	var departmentMatrixes = new Array();
	
	var nodeHash = new Object();
	for (var i =0 , length = forceNodes.length; i < length; i++){
		forceNodes[i].relatedNodes = [];
		
		nodeHash[forceNodes[i].name] = i;
		
		// make empty links and nodes for each department metrix
		departmentMatrixes[i] = new Object();
		departmentMatrixes[i].name = forceNodes[i].name;
		departmentMatrixes[i].links = new Array();
		departmentMatrixes[i].nodes = new Array();
	}
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
			tempLink.width = 1;
			// we remove dublicate links with this method
			if ($.isEmptyObject(forceLinkObjects[tempLink.source+"-"+tempLink.target])){
				forceLinkObjects[tempLink.source+"-"+tempLink.target]=tempLink;
			}else{
				forceLinkObjects[tempLink.source+"-"+tempLink.target].width++;
			}
		} else{
			// link inside a department
			departmentMatrixes[nodeHash[jsonFile.links[i].linkType]].links.push({source: jsonFile.nodes[jsonFile.links[i].source].departmentMatrixesPlace, target: jsonFile.nodes[jsonFile.links[i].target].departmentMatrixesPlace });
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
		.charge(-(minLenght*10))
		.linkDistance( minLenght/3)
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
	parentObject.empty();
	
	parentObject.append('<div class ="noselect" style="position:absolute; top:10px;left:10px; opacity: 0.85"> <ul id="'+ parentDivID+ 'professorsMenu"> <li class="ui-widget-header">Selected Professors</li></ul></div>');
	$("#"+parentDivID+"professorsMenu").menu({
		items: "> :not(.ui-widget-header)"
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
	
	var container = svg.append("g");
	
	// we add context-menu container and call it on departmentRects touchHold
	// we convert d3 select to jquery select  --> $(container[0])
	$(container[0]).contextmenu({
		preventContextMenuForPopup: true,
    preventSelect: true,
		menu: [
        {title: "Copy", cmd: "copy", uiIcon: "ui-icon-copy"},
        {title: "Arrange", children: [
            {title: "By name", cmd: "name"},
            {title: "By collaboration count", cmd: "count"}
						]}
        ],
			select: function(event, ui) {
				// call refreshMatrix method
				$(ui.target).trigger("refreshMatrix" ,ui.cmd);
			}
	});
	
	// we do not want to show department nodetrix - we just use it as matrix places
	// move department nodes to center (margin and other stupid things../)
	for (var i=0, length = forceNodes.length; i < length ; i++ ){
		forceNodes[i].x += moveToCenter.x;
		forceNodes[i].y += moveToCenter.y;
		forceNodes[i].size = matrixSize;
	}
	
	// scale for links width
	var lineScale = d3.scale.linear()
    .domain([1, 100])
    .range([0.3,10]);
	// draw links between departments for first time
	var matrixDepartmentlinks = container.selectAll(".matrixLink.link")
		.data(forceLinks)
			.enter().append("line")
			.attr("class" , "matrixLink link")
			.attr("x1", function(d) { return d.source.x + d.source.size/2})
			.attr("y1", function(d) { return d.source.y + d.source.size/2})
			.attr("x2", function(d) { return d.target.x + d.target.size/2})
			.attr("y2", function(d) { return d.target.y + d.target.size/2})
			.style("stroke-width", function(d){return lineScale(d.width)});
	
	// its time to show matrixes
	for (var i=0, length =forceNodes.length; i < length ; i++ ){
		createMatrix(forceNodes[i] , departmentMatrixes[i].links, departmentMatrixes[i].nodes);
	}
	
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
			matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0}; });
		});

		// Convert links to matrix; count character occurrences.
		links.forEach(function(link) {
			matrix[link.source][link.target].z += 1;
			matrix[link.target][link.source].z += 1;
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
			.datum(node)
			.on("dblclick", function(){
				if (d3.event.defaultPrevented) return;
				enlargeMatrix();
			});
		
		departmentRect.on("touchstart", function(){	
			departmentRectTimer = setTimeout(function(){
				// here we handle long-press function	
				// 500 is the length of time we want the user to touch before we do something	
				// TODO : we have to prevent tap becasue its hold d3.event.preventDefault does not work
				$(container[0]).contextmenu("open", $(departmentRect[0]));
			}, 250); 
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
			
		});
		
		departmentG.append("text")
			.attr("x", node.x)
			.attr("y", node.y)
			.attr("dy", "-2px")
			.text(node.name)
			.style("font-size","14px")
			.attr("class","matrixLink title");
		
		var row = departmentG.selectAll(".matrixLink.row")
			.data(matrix)
				.enter().append("g")
				.attr("class", "matrixLink row")
				.attr("transform", function(d, i) {return "translate(0," + (xScale(i) + node.y) + ")"; })
				.each(function (d){
					//createRow(d);
					d3.select(this).selectAll(".matrixLink.cell")
						.data(d.filter(function(d){return d.z;} ))
						.enter().append("rect")
							.attr("class", "matrixLink cell")
							.attr("x", function(d) { return (xScale(d.x) + node.x); })
							.attr("width", xScale.rangeBand())
							.attr("height", xScale.rangeBand())
							.style("fill", "rgb(44, 160, 44)");
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
	  function createRow(row) {
		//var tempData = $.grep(row, function(d) {return d.z ? d.z : null;});	
	  }
		
		function enlargeMatrix(){
			// we take 20% as margin (* 0.8)
			node.size = Math.min(height,width)*0.8;

			xScale.rangeBands([0, node.size]);
			
			departmentRect.transition().attr("width", node.size)
			.attr("height", node.size).duration(transitionTime);
			
			
			row.transition().attr("transform", function(d, i) {
				return "translate(0," + (xScale(i) + parseFloat(departmentRect.attr('y'))) + ")";
			}).duration(transitionTime)
			.each(function (d){
				//createRow(d);
				d3.select(this).selectAll(".matrixLink.cell")
						.transition().attr("x", function(d) { return xScale(d.x) + parseFloat((departmentRect.attr('x'))); })
						.attr("width", xScale.rangeBand())
						.attr("height", xScale.rangeBand()).duration(transitionTime);
			});
			
			column.transition().attr("transform", function(d, i) { return "translate(" + (xScale(i) + parseFloat((departmentRect.attr('x')))) + ")rotate(-90)"; }).duration(transitionTime);
			columnLines.attr("x1", -node.size);
			rowLines.attr("x2", node.size);
			
			// add professors text
			var rowText = row.append("text")
				.attr("x", -6 + parseFloat((departmentRect.attr('x'))))
				.attr("y", (xScale.rangeBand() / 2) )
				.attr("dy", ".32em")
				.attr("text-anchor", "end")
				.attr("class","matrixLink text")
				.style("font-Size", "14px")
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
					
				}else{
					
					// add to menu
					$("#"+parentDivID+"professorsMenu").append("<li id='" + parentDivID +nodes[i].ID+ "'>"+ nodes[i].name+"</li>");
					// add to selectedProfessors array
					selectedProfessors.push(nodes[i]);
					// set class to make them red
					d3.select(this).classed("selected",true);
					d3.select(columnText[0][i]).classed("selected",true);
				}
			});
			
			var columnText = column.append("text")
				.attr("x", 10 - parseFloat((departmentRect.attr('y'))))
				.attr("y", (xScale.rangeBand() / 2))
				.attr("dy", ".32em")
				.attr("text-anchor", "start")
				.attr("class","matrixLink text")
				.style("font-Size", "14px")
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
					
				}else{
					
					// add to menu
					$("#"+parentDivID+"professorsMenu").append("<li id='" + parentDivID +nodes[i].ID+ "'>"+ nodes[i].name+"</li>");
					// add to selectedProfessors array
					selectedProfessors.push(nodes[i]);
					// set class to make them red
					d3.select(this).classed("selected",true);
					d3.select(rowText[0][i]).classed("selected",true);
				}
			});
			
			departmentRect.on("dblclick", function(){
				if (d3.event.defaultPrevented) return;
				rowText.remove();
				columnText.remove();
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
				if (d3.select(this).select('rect').datum()==node) {
					d3.select(this).select('rect').classed("selected",1);
					return 1
				};
				
				// related departments
				for (var i=0;i<node.relatedNodes.length;i++){
					if(d3.select(this).select('rect').datum()==node.relatedNodes[i]){
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
			
			departmentRect.on("dblclick", function(){
				if (d3.event.defaultPrevented) return;
				enlargeMatrix(this);
			});
			
			row.transition().attr("transform", function(d, i) {
				return "translate(0," + (xScale(i) + parseFloat(departmentRect.attr('y'))) + ")";
			}).duration(transitionTime)
			.each(function (d){
				//createRow(d);
				d3.select(this).selectAll(".matrixLink.cell")
						.transition().attr("x", function(d) { return xScale(d.x) + parseFloat((departmentRect.attr('x'))); })
						.attr("width", xScale.rangeBand())
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