
/* TODO: multi layer system only support one level of hierarcy
it is easy to fix with creating arrays of parentData
*/

function createPiechart(parentDivID, entityName, propertyName, data , parentData , parentPropertyName ){
	
	var parentObject = $("#"+parentDivID);
	
	var width = parentObject[0].clientWidth;
	var height = parentObject[0].clientHeight;
	var radius = Math.min(width, height) / 2;

	
	var color = d3.scale.category20();

	var arc = d3.svg.arc()
		 .outerRadius(radius - 10)
		 .innerRadius(0);

	var pie = d3.layout.pie()
		 .sort(null)
		 .value(function(d) { return d.value; });

	parentObject.empty();
	var svg = d3.select("#"+parentDivID).append("svg")
		 .attr("width", width)
		 .attr("height", height)
	  .append("g")
		 .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
	
	// TODO: fix tooltip position
	var tip = d3.tip()
		 .attr('class', 'piechart d3-tip')
		 .offset([-10, 0])
		 .html(function(d) {
			 return "<strong>Name: </strong> <span style='color:red'>" + d.data.name + "</span><br><strong>Value: </strong> <span style='color:red'>" + d.value + "</span>";
		 });
		svg.call(tip);
	tip.direction('e');
	
  data.forEach(function(d) {
	 d.value = +d.value;
  });
	
  var g = svg.selectAll(".piechart.arc")
		.data(pie(data))
	 .enter().append("g")
		.attr("class", "piechart arc")
		.on('mouseover', tip.show)
		.on('mouseout', tip.hide)
		.on('click', function(d){
				if (typeof d.data.child != 'undefined'){
					tip.hide(d);
					createPiechart(parentDivID, entityName, d.data.name, d.data.child , data , propertyName);
				}else{
					return 0;
				}
		});
		

  g.append("path")
		.attr("d", arc)
		.style("fill", function(d) { return color(d.data.name); });
		

  g.append("text")
		.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
		.attr("dy", ".35em")
		.style("text-anchor", "middle")
		.text(function(d) { return d.data.name.substring(0,9); });

	// add return buttton for multi layer barcharts
	if (typeof(parentData) != "undefined"){
		var tempG = svg.append("g");
		tempG.on('click', function() {createPiechart(parentDivID, entityName, parentPropertyName, parentData)})
		 .append("rect")
			.attr("x", width/2 - 100)
			.attr("y",-( height / 2)+40)
			.attr("width",60)
			.attr("height",30)
			.attr("rx", 3)
			.attr("ry", 3)
			.style("fill", "rgb(107,76,155)");
		tempG.append("text")
		 .attr("x", width/2 - 87)
		 .attr("y", -( height / 2)+60)
		 .attr ("fill","white")
		 .attr ("font-size","14px")
		 .attr("class", "clickableText")
		 .text("Back");
	}
}