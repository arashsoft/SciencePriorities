/* sample data:
nodes: [{name:"abc" , department : "dasdas"},{name:"def"},{name:"123"},{name:546}],
links : [{source:"adc.id",target:"123.id", type:"award" , linkType:"departmentName or 0" },{source:"546",target:"def", ...}],
departments : [{name : chemistry},{name : computer science},{name : biology}]
*/
function  createMatrixLink(parentDivID, jsonFile){
	var parentObject = $("#"+parentDivID);
	var width = parentObject[0].clientWidth;
	var height = parentObject[0].clientHeight;;
	var margin = {width: width/5, height: height/5};
	var minLenght = Math.min(width,height);
	var moveToCenter = {x: margin.width/2 , y: margin.height/2 }
	var color = d3.scale.category20();
	
	// now we want to make department nodes and links to run a force layout on them
	// it helps us to find best places for our matrixes
	var forceNodes = jsonFile.departments
	var forceLinks = new Array();
	
	var departmentMatrixes = new Array();
	
	var nodeHash = new Object();
	for (var i =0 , length = forceNodes.length; i < length; i++){
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
			// we remove dublicate links with this method
			forceLinkObjects[tempLink.source+"-"+tempLink.target]=tempLink;
		} else{
			// link inside a department
			departmentMatrixes[nodeHash[jsonFile.links[i].linkType]].links.push({source: jsonFile.nodes[jsonFile.links[i].source].departmentMatrixesPlace, target: jsonFile.nodes[jsonFile.links[i].target].departmentMatrixesPlace });
		}
	}
	// convert forceLinkObjects to forceLinks (object to array)
	for (var tempLink in forceLinkObjects){
		forceLinks.push(forceLinkObjects[tempLink]);
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
	
	// empty parentObject and start adding items to it
	parentObject.empty();
	var svg = d3.select("#"+parentDivID).append("svg")
		 .attr("width", width)
		 .attr("height", height);
		 
	// we do not want to show department nodetrix - we just use it as matrix places
	
	var matrixDepartmentlinks = svg.selectAll(".matrixLink.link")
		.data(forceLinks)
			.enter().append("line")
			.attr("class", "matrixLink link")
			.attr("x1", function(d) { return d.source.x + moveToCenter.x; })
			.attr("y1", function(d) { return d.source.y + moveToCenter.y; })
			.attr("x2", function(d) { return d.target.x + moveToCenter.x; })
			.attr("y2", function(d) { return d.target.y + moveToCenter.y; });
	/*
	var matrixDepartments = svg.selectAll(".matrixLink.node")
		.data(forceNodes)
			.enter().append("circle")
			.attr("class", "matrixLink node")
			.attr("r", 10)
			.style("fill", function(d) { return color(d.name); })
			.attr("cx", function(d) { return d.x + moveToCenter.x; })
			.attr("cy", function(d) { return d.y + moveToCenter.y; });
			
	matrixDepartments.append("title")
		.text(function(d) { return d.name; });
	*/
	
	// its time to show matrixes
	for (var i=0, length =forceNodes.length; i < length ; i++ ){
		createMatrix(forceNodes[i].x + moveToCenter.x-(minLenght/12), forceNodes[i].y + moveToCenter.y-(minLenght/12), (minLenght/6), departmentMatrixes[i].links, departmentMatrixes[i].nodes , forceNodes[i]);
	}
	
	function createMatrix(positionX , positionY , size, links, nodes , node){
		var matrix = [];
		var n = nodes.length;
		var xScale = d3.scale.ordinal().rangeBands([0, size]);
		
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

		// Precompute the orders.
		var orders = {
			name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
			count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
		};

		// The default sort order.
		xScale.domain(orders.name);
		
		var matrixDrag = d3.behavior.drag()
			.on('dragstart', function() { d3.select(this).select("rect").attr("class", "matrixLink background drag") })
			.on('drag', function() {
				var tempX = parseFloat(d3.select(this).attr('x'));
				var tempY = parseFloat(d3.select(this).attr('y'));
				tempX += d3.event.dx;
            tempY += d3.event.dy;
				
				d3.select(this)
					.attr("x", tempX)
					.attr("y", tempY)
					.attr("transform" , "translate(" + tempX + "," + tempY +")" );
				node.x = tempX + positionX -(minLenght/12);
				node.y = tempY + positionY -(minLenght/12);
				// now it is the time to move links
				matrixDepartmentlinks
					.attr("x1", function(d) { return d.source.x + moveToCenter.x; })
					.attr("y1", function(d) { return d.source.y + moveToCenter.y; })
					.attr("x2", function(d) { return d.target.x + moveToCenter.x; })
					.attr("y2", function(d) { return d.target.y + moveToCenter.y; });
				
				
			})
			.on('dragend', function(d) { d3.select(this).select("rect").attr("class", "matrixLink background") });
		
		var departmentG = svg.append("g")
			.attr("x", 0)
			.attr("y", 0)
			.call(matrixDrag);
		
		
		departmentG.append("rect")
		.attr("class", "matrixLink background")
			.attr("x", positionX)
			.attr("y", positionY)
			.attr("width", size)
			.attr("height", size);
		
		departmentG.append("text")
			.attr("x", positionX)
			.attr("y", positionY)
			.attr("dy", "-2px")
			.text(node.name);
		
		
		var row = departmentG.selectAll(".matrixLink.row")
			.data(matrix)
				.enter().append("g")
				.attr("class", "matrixLink row")
				.attr("transform", function(d, i) { return "translate(0," + (xScale(i) + positionY) + ")"; })
				.each(function (d){
					//createRow(d);
					var cell = d3.select(this).selectAll(".matrixLink.cell")
						.data(d.filter(function(d){return d.z;} ))
						.enter().append("rect")
							.attr("class", "matrixLink cell")
							.attr("x", function(d) { return (xScale(d.x) + positionX); })
							.attr("width", xScale.rangeBand())
							.attr("height", xScale.rangeBand())
							.style("fill", "rgb(44, 160, 44)");
				});
		
		row.append("line")
			.attr("x2", size);
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
			.attr("transform", function(d, i) { return "translate(" + (xScale(i) + positionX) + ")rotate(-90)"; });

	  column.append("line")
			.attr("x1", -size);
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

	} // end of createMatrix function
} // end of createMatrixLink function