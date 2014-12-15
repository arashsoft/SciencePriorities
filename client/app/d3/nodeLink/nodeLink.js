/* sample data:
nodes: [{name:"abc"},{name:"def"},{name:"123"},{name:546}],
links : [{source:"adc.id",target:"123.id", type:"award" , linkType:"departmentName or 0" },{source:"546",target:"def", ...}],
departments : [{chemistry},{computer science},{biology}]
*/
function  createNodeLink(parentDivID, jsonFile){

	var parentObject = $("#"+parentDivID);
	
	var width = parentObject[0].clientWidth;
	var height = parentObject[0].clientHeight;;
	var margin = {width: width/5, height: height/5};
	
	var minLenght = Math.min(width,height);
	
	var moveToCenter = {x: margin.width/2 , y: margin.height/2 }
	var color = d3.scale.category20();

	parentObject.empty();
	var svg = d3.select("#"+parentDivID).append("svg")
		 .attr("width", width)
		 .attr("height", height);

	
	var force = d3.layout.force()
		.size([width- margin.width, height  -margin.height])
		.nodes(jsonFile.nodes)
		.links(jsonFile.links)
		.charge(-(minLenght/4))
		.linkDistance(function (d){return (d.linkType? minLenght/12: minLenght/8);})
		.friction(0.7)
		.gravity(0.25)
		.linkStrength(function (d){return (d.linkType? 0.7: 0.4);})
		.start();

	var link = svg.selectAll(".nodeLink.link")
			.data(jsonFile.links)
				.enter().append("line")
				.attr("class", "nodeLink link");

	var node = svg.selectAll(".nodeLink.node")
		.data(jsonFile.nodes)
			.enter().append("circle")
			.attr("class", "nodeLink node")
			.attr("r", minLenght/60)
			.attr("cx", minLenght/60)
			.attr("cy",minLenght/60)
			.style("fill", function(d) { return color(d.department); })
			.call(force.drag);

	node.append("title")
		.text(function(d) { return d.name + "\n" + d.department; });
	
	force.on("tick", function() {
		link.attr("x1", function(d) { return d.source.x + moveToCenter.x; })
			.attr("y1", function(d) { return d.source.y + moveToCenter.y; })
			.attr("x2", function(d) { return d.target.x + moveToCenter.x; })
			.attr("y2", function(d) { return d.target.y + moveToCenter.y; });

		node.attr("cx", function(d) { return d.x + moveToCenter.x; })
			.attr("cy", function(d) { return d.y + moveToCenter.y; });
	});
}