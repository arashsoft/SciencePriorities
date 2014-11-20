// sample data : data = [{"name":"ads","value":8},{"name":"asdfg","value":2},{"name":"gfhgfhgf","value":5},{"name":"oiloi","value":10}]

function createBarchart(parrentDivID, entityName, propertyName, data){
	
	var parrentObject = $("#"+parrentDivID);
	
	var margin = {top: 20, right: 20, bottom: 40, left: 80},
		 width = parrentObject[0].clientWidth - margin.left - margin.right-50,
		 height = parrentObject[0].clientHeight - margin.top - margin.bottom-25;

	var color = d3.scale.category20();
		 
	var x = d3.scale.ordinal()
		 .rangeRoundBands([0, width], .1);

	var y = d3.scale.linear()
		 .range([height, 0]);

	var xAxis = d3.svg.axis()
		 .scale(x)
		 .orient("bottom");

	var yAxis = d3.svg.axis()
		 .scale(y)
		 .orient("left");
		 

	parrentObject.empty();
	var svg = d3.select("#"+parrentDivID).append("svg")
		 .attr("width", width + margin.left + margin.right)
		 .attr("height", height + margin.top + margin.bottom)
	  .append("g")
		 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	
	
	// fix long name problem with .substring(0,8)
	var xDomainMap = new Array();
	for (var i = 0; i < data.length; i++){
		xDomainMap[data[i].name]=data[i].name.substring(0,8);
	};
	// rename duplicate names
	for (var i = 0; i < data.length; i++){
		for (var j = i+1; j < data.length; j++){
			if (xDomainMap[data[i].name]==xDomainMap[data[j].name]){
				xDomainMap[data[j].name] += ".";
			}
		}
	}
	
	x.domain(data.map(function(d) { return xDomainMap[d.name] }));
	y.domain([0, d3.max(data, function(d) { return d.value; })]);
		
	var tip = d3.tip()
	 .attr('class', 'barchart d3-tip')
	 .offset([-10, 0])
	 .html(function(d) {
		 return "<strong>Name: </strong> <span style='color:red'>" + d.name + "</span><br><strong>Value: </strong> <span style='color:red'>" + d.value + "</span>";
	 });
	svg.call(tip);
	
	svg.selectAll(".barchart.bar")
		.data(data)
	 .enter().append("rect")
		.attr("class", "barchart bar")
		.attr("x", function(d) { return x(xDomainMap[d.name]); })
		.attr("width", x.rangeBand())
		.attr("y", function(d) { return y(d.value); })
		.attr("height", function(d) { return height - y(d.value); })
		.on('mouseover', tip.show)
      .on('mouseout', tip.hide)
		.style("fill", function(d) { return color(xDomainMap[d.name]); });

	
		
	svg.append("g")
		.attr("class", "barchart x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis)
		.append("text")
		.attr("x", width/2)
		.attr("dy", "2.2em")
		.attr ("font-size","14px")
		.style("text-anchor", "end")
		.text(propertyName);

	svg.append("g")
		.attr("class", "barchart y axis")
		.call(yAxis)
	 .append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text(entityName);


}

function type(d) {
  d.frequency = +d.frequency;
  return d;
}

