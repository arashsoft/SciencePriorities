// sample data : data = [{"name":"ads","value":8},{"name":"asdfg","value":2 , child:[{"name":"arash","value":11},{"name":"abcdf","value":7}]},{"name":"gfhgfhgf","value":5},{"name":"oiloi","value":10}]

/* TODO: multi layer system only support one level of hierarcy
it is easy to fix with creating arrays of parentData
*/

function createBarchart(parentDivID, entityName, propertyName, data , parentData, parentPropertyName){
	
	var parentObject = $("#"+parentDivID);
	
	var divWidth = parentObject[0].clientWidth;
	var divHeight = parentObject[0].clientHeight;
	
	var margin = {top: 20, right: 20, bottom: 40, left: 80},
		 width = divWidth - margin.left - margin.right,
		 height = divHeight - margin.top - margin.bottom;

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
		 
	parentObject.empty();
	var svg = d3.select("#"+parentDivID).append("svg")
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
		.style("fill", function(d) { return color(xDomainMap[d.name]); })
		.on('mouseover', function(d){
			tip.hide(d);
			tip.show(d);
		})
      .on('mouseout', tip.hide)
		.on('click', function(d){
			if (typeof d.child != 'undefined'){
				clearInterval(intervalID);
				angular.element(parentObject[0]).scope().intervalID = createBarchart(parentDivID, entityName, d.name, d.child , data , propertyName);
			}else{
				return 0;
			}
		});
		
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
	
	// add return buttton for multi layer barcharts
	var backButtonG;
	if (typeof(parentData) != "undefined"){
		backButtonG = svg.append("g");
		backButtonG.on('click', function() {
			clearInterval(intervalID);
			angular.element(parentObject[0]).scope().intervalID = createBarchart(parentDivID, entityName, parentPropertyName, parentData);
		})
		 .append("rect")
			.attr("x", width-60)
			.attr("y",1)
			.attr("width",60)
			.attr("height",30)
			.attr("rx", 3)
			.attr("ry", 3)
			.style("fill", "rgb(107,76,155)");
		backButtonG.append("text")
		 .attr("x", width-45)
		 .attr("y", 20)
		 .attr ("fill","white")
		 .attr ("font-size","14px")
		 .attr("class", "clickableText")
		 .text("Back");
	}
	
	function resizeBarchart(){
		//console.log("resize function called");
		
		width = divWidth - margin.left - margin.right;
		height = divHeight - margin.top - margin.bottom;
		
		// skip resize for screens smaller than 100px * 40px
		if (height < 40 || width < 100){
			return;
		}
		
		x.rangeRoundBands([0, width], .1);
		y.range([height, 0]);
		
		d3.select("#"+parentDivID).select("svg")
		 .attr("width", width + margin.left + margin.right)
		 .attr("height", height + margin.top + margin.bottom);
		svg.attr("width", width + margin.left + margin.right)
		 .attr("height", height + margin.top + margin.bottom);
		
		// resize x axis
		tempTexts= svg.select("g.barchart.x.axis")
		 .attr("transform", "translate(0," + height + ")")
		 .call(xAxis)
		 .selectAll("text");
		// select the last text which is propertyName and give it the correct X
		d3.select(tempTexts[0].pop())
		  .attr("x", width/2);
		
		// resize y axis
		svg.select("g.barchart.y.axis")
		 .call(yAxis);
		// resize bars
		svg.selectAll("rect.barchart.bar")
		 .attr("x", function(d) { return x(xDomainMap[d.name]); })
		 .attr("width", x.rangeBand())
		 .attr("y", function(d) { return y(d.value); })
		 .attr("height", function(d) { return height - y(d.value); });
		
		//move back ButtonG
		if (typeof(parentData) != "undefined"){
			backButtonG.select("rect")
			 .attr("x", width-60);
			backButtonG.select("text")
			 .attr("x", width-45);
		}
	}
	
	// set resizer function every 1 sec
	var intervalID = setInterval(function () {
        if ( divWidth != parentObject[0].clientWidth || divHeight != parentObject[0].clientHeight) {
            divWidth = parentObject[0].clientWidth;
            divHeight = parentObject[0].clientHeight;
				resizeBarchart();
        }
    }, 1000);
	
	return intervalID;
}

function type(d) {
  d.frequency = +d.frequency;
  return d;
}

