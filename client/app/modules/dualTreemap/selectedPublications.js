function selectedPublicationsAnalysis(parentDiv, publications, colors, loadingObject, data){
	var width = parentDiv.width();
	var height = parentDiv.height();
	var padding = 50;

	var publicationAnalysisContainer = d3.select(parentDiv)
		.append('svg')
		.attr('width', width - 6*padding)
		.attr('height', height)
		.attr('id', 'publicationAnalysisContainer')
		.style('background-color', 'lightgrey')
		//.attr('transform', 'translate(' + 0 + ',' + (height + padding) + ')');

	publicationAnalysisContainer.append('text')
	 .text('publication analysis')
	 .attr('id', 'publicationsSelectedAnalysis')
	 .attr('class', 'message')
	 .attr('transform', 'translate(' + padding + ',' + ((height/2)-padding) + ')');

	 publicationAnalysisContainer.selectAll('rect.selectedPublicationsAnalysis')
	 .data(publications)
	 .enter()
	 .append('rect')
	 .attr('x', function(d,i) { return (padding*i)/2; })
	 .attr('y', function(d,i) { return (padding*i)/2; })
	 .attr('width', 50)
	 .attr('height', 50)
	 .style('fill', function(d,i) { return colors(i); });

	if (typeof(loadingObject) !== 'undefined') { loadingObject.remove(); }
};
