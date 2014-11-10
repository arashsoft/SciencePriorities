function createPiechart(parrentDivID, entityName, propertyName, data){
	
	var parrentObject = $("#"+parrentDivID);
	
	var width = parrentObject[0].clientWidth;
	var height = parrentObject[0].clientHeight;
	var radius = Math.min(width, height) / 2;

	
	var color = d3.scale.category20();

	var arc = d3.svg.arc()
		 .outerRadius(radius - 10)
		 .innerRadius(0);

	var pie = d3.layout.pie()
		 .sort(null)
		 .value(function(d) { return d.value; });

	parrentObject.empty();
	var svg = d3.select("#"+parrentDivID).append("svg")
		 .attr("width", width)
		 .attr("height", height)
	  .append("g")
		 .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	// TODO: fix tooltip position
	var tip = d3.tip()
		 .attr('class', 'piechart d3-tip')
		 .offset([-10, 0])
		 .html(function(d) {
			 return "<strong>Name: </strong> <span style='color:red'>" + d.name + "</span><br><strong>Value: </strong> <span style='color:red'>" + d.value + "</span>";
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
		.on('mouseout', tip.hide);
		

  g.append("path")
		.attr("d", arc)
		.style("fill", function(d) { return color(d.data.name); });

  g.append("text")
		.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
		.attr("dy", ".35em")
		.style("text-anchor", "middle")
		.text(function(d) { return d.data.name.substring(0,12); });


}