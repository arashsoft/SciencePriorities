// matrixLink call this function but it can be use individually.
// unlike other modules, parrentDiv should be jquery object not the object ID
// departmentColor is optional
// loadingObject is optional
/* data has 
data.nodes
data.awardlinks
data.publinks
data.coSuplinks
data.department (it is array of selected departments)
*/		

function  compareDepartments(parentDiv, data ,departmentColor, loadingObject){
	if (typeof(departmentColor) === 'undefined') { departmentColor = d3.scale.category20(); }
	var linkColor = {};
	linkColor["award"] = "rgb(0, 100, 0)";
	linkColor["pub"] = "rgb(17, 63, 170)";
	linkColor["coSuper"] = "rgb(214, 29, 29)";
	
	
	data.links = new Array();
	data.links = data.awardLinks.concat(data.pubLinks,data.coSupLinks);
	
	var width = parentDiv.width();
	var height = parentDiv.height();
	var minLenght = Math.min(width,height);
	var circleSize = 30;
	var selectedProfs = [];

	// select prof menu
	var selectedProfDiv = $('<div class ="noselect" style="position:absolute; top:10px;left:5px; opacity: 0.85; width:200px;"></div>');
	var selectedProf_ul = $('<ul style="padding:10px;"> <li class="ui-widget-header">Selected Professors</li></ul>');
	var selectedProf_Button = $('<label class="btn btn-primary" style="padding: 0px 3px;margin-top:15px;" >Show Relations</label>');
	selectedProf_ul.append(selectedProf_Button);
	selectedProfDiv.append(selectedProf_ul);
	parentDiv.append(selectedProfDiv);
	selectedProf_ul.menu({items: "> :not(.ui-widget-header)"});
	
	selectedProf_Button.click(function(){
		if (selectedProfs.length==0){return;}
		var mainDiv = $('<div align="center" class="matrixLinkBenchmarkSelectDiv2"><div class="btn btn-danger close-btn" onclick="var tempObject = $(this).parent().parent(); tempObject.hide(1000,function(){tempObject.remove()});">X</div></div>');
		$('<div class="matrixLinkBenchmarkSelect"></div>').append(mainDiv).appendTo(parentDiv);
		var loadingGif = $('<img src="/assets/images/loading.gif" alt="loading" style="width: 40%; height:60%;">');
		loadingGif.appendTo(mainDiv);
		
		// get data for selected Professors
		$.get('/jsonrequest2/professorSelect/' + JSON.stringify(selectedProfs) , function(result){
			professorsRelation(mainDiv ,result, departmentColor, loadingGif);
		});
		
	});
	
	var selectLinkTypeDiv = $('<div class ="noselect" style="position:absolute; top:11%; right:5px; opacity: 0.85; width:14%; min-width:125px;"><div align="center"><label class="btn btn-primary checkboxButton" style="background-color: rgb(0, 100, 0);">Award <input type="checkbox" value="award" checked></label><label class="btn btn-primary checkboxButton" style="background-color: rgb(17, 63, 170);">Publication <input type="checkbox" value="pub" checked></label><label class="btn btn-primary checkboxButton" style="background-color: rgb(214, 29, 29);">Supervision <input type="checkbox" value="coSuper" checked><label></div>');
	parentDiv.append(selectLinkTypeDiv);
	// handle link type filters
	selectLinkTypeDiv.find(".checkboxButton input").change(function(event) {		
		if (event.currentTarget.value=="award"){
			if (event.currentTarget.checked){
				// add links
				data.links = data.links.concat(data.awardLinks);
				force.links(data.links);
			}else{
				// remove links
				for(var i = data.links.length - 1; i >= 0; i--) {
					if(data.links[i].type=="award") {
						 data.links.splice(i, 1);
					}
				}
			}
		}else if (event.currentTarget.value=="pub"){
			if (event.currentTarget.checked){
				// add links
				data.links = data.links.concat(data.pubLinks);
				force.links(data.links);
			}else{
				// remove links
				for(var i = data.links.length - 1; i >= 0; i--) {
					if(data.links[i].type=="pub") {
						 data.links.splice(i, 1);
					}
				}
			}
		}else if(event.currentTarget.value=="coSuper"){
			if (event.currentTarget.checked){
				// add links
				data.links = data.links.concat(data.coSupLinks);
				force.links(data.links);
			}else{
				// remove links
				for(var i = data.links.length - 1; i >= 0; i--) {
					if(data.links[i].type=="coSuper") {
						 data.links.splice(i, 1);
					}
				}
			}
		}
		var newLinks = container.selectAll(".compareD.link")
		.data(data.links);
		
		newLinks.exit().remove();
		
		newLinks.enter().append("line")
			.attr("class" , "compareD link")
			.attr("x1", function(d) { return d.source.x})
			.attr("y1", function(d) { return d.source.y})
			.attr("x2", function(d) { return d.target.x})
			.attr("y2", function(d) { return d.target.y});
		
		newLinks
			.style("stroke-width", function(d) { return d.width;})
			.style("stroke", function(d){return linkColor[d.type];}); 
		
		forceLinks = newLinks;
		force.resume();
		forceNodes.moveToFront();
		
	});
	
	// department selection bar
	var departmentBar = $('<div class ="noselect niceScroll" style="position:absolute; top:5px;left:220px; max-height:100px; overflow-y: scroll; opacity: 0.85"></div>');
	parentDiv.append(departmentBar);
	d3.selectAll(departmentBar.toArray()).selectAll("compareD departmentBarItem")
		.data(data.department).enter().append("div")
			.attr("class","departmentButton btn btn-primary active")
			.style("background-color",function(d){return departmentColor(d)})
			.text(function(d){return d})
			.on("click",function(d){
				if ($(this).hasClass("active")){
					// unselect
					d3.select(this).classed("active",0);
					forceNodeCircles.each(function(d2){
						if (d2.departmentName==d){d3.select(this.parentNode).style("opacity",0.1);}
					})
				}else{
					// select
					d3.select(this).classed("active",1);
					forceNodeCircles.each(function(d2){
						if (d2.departmentName==d){d3.select(this.parentNode).style("opacity",1);}
					})
				}
			});
	
	var screenDragZoom = d3.behavior.zoom()
    .scaleExtent([0.1, 5])
    .on("zoom", function(){
			container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
		});
	
	var svg = d3.selectAll(parentDiv.toArray()).append("svg")
		 .attr("width", width)
		 .attr("height", height);
	
	// this rect accept all drag&drops and all zooms but we move container instead of this one.
	svg.append("g")
		.call(screenDragZoom).on("dblclick.zoom", null)
		.append("rect")
			.attr("width", width)
			.attr("height", height)
			.style("stroke-width",3)
			.style("stroke","black")
			.style("fill", "none")
			.style("pointer-events", "all");
	
	var container = svg.append("g");
	
	var forceNode_drag = d3.behavior.drag()
		.on("dragstart", dragstart)
		.on("drag", dragmove)
		.on("dragend", dragend);
	
	function dragstart(d, i) {
		force.stop() // stops the force auto positioning before you start dragging
	}
	function dragmove(d, i) {
		d.px += d3.event.dx;
		d.py += d3.event.dy;
		d.x += d3.event.dx;
		d.y += d3.event.dy; 
		tickHandler(); // this is the key to make it work together with updating both px,py,x,y on d !
	}
	function dragend(d, i) {
		d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
		tickHandler();
		force.resume();
	}
		
	var forceLinks = container.selectAll(".compareD.link")
		.data(data.links)
			.enter().append("line")
			.attr("class" , "compareD link")
			.attr("x1", function(d) { return d.source.x})
			.attr("y1", function(d) { return d.source.y})
			.attr("x2", function(d) { return d.target.x})
			.attr("y2", function(d) { return d.target.y})
			.style("stroke-width", function(d) { return d.width;})
			.style("stroke", function(d){return linkColor[d.type];});
			
	var forceNodes = container.selectAll(".compareD.nodes")
		.data(data.nodes)
			.enter().append("g")
			.attr("class" , "compareD nodes");
		
	var forceNodeCircles = forceNodes.append("circle")
		.attr("r", circleSize)
		.attr("class","compareD circle")
		.style("fill", function(d){return departmentColor(d.departmentName)})
		.call(forceNode_drag)
		.on("click",function(d){
			if(d3.event.defaultPrevented) {return;}
			if (selectedProfs.indexOf(d.ID)!=-1){
				// unselect
				selectedProfs.remove(d.ID);
				d.selectMenuElement.remove();
				d3.select(this).classed("selected",0);
				//if (selectedProfs.length==0){ selectedProfDiv.css("visibility","hidden"); }
				
			}else{
				//select
				selectedProfs.push(d.ID);
				d.selectMenuElement = $("<li class='compareD selectLi'>"+ d.Firstname+ ", "+ d.Middlename + " "+ d.Lastname+"</li>");
				d.selectMenuElement.insertBefore(selectedProf_Button);
				d3.select(this).classed("selected",1);
				//selectedProfDiv.css("visibility","visible");
			}
		})
		.on("dblclick",function(d){d.fixed = false});
	
	var forceNodesTexts = forceNodes.append("text")
		.attr("class","compareD texts noselect")
		.attr('lengthAdjust',"spacingAndGlyphs")
		.attr('textLength', circleSize*2)
		.text( function (d) { return d.Firstname+ ", "+ d.Middlename + " "+ d.Lastname});
	
	
	forceNodes.append("title")
		.text(function(d) { return d.Firstname+ ", "+ d.Middlename + " "+ d.Lastname + "\n" + d.departmentName; });
		
	var force = d3.layout.force()
		.size([width, height])
		.nodes(data.nodes)
		.links(data.links)
		.gravity(.05)
		.distance(300)
		.charge(-400)
		.linkStrength(0.4)
		.on("tick", tickHandler)
		.start();
	
	// hide nodes without relation to make screen clean
	forceNodes.each(function(d){if(d.weight==0){$(this).hide();}});
	
	if (typeof(loadingObject) !== 'undefined') { loadingObject.remove(); }
	
	function tickHandler(e){
		forceNodeCircles.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });
		
		forceNodesTexts.attr("x", function(d) { return d.x; })
			.attr("y", function(d) { return d.y; })
		
		forceLinks.attr("x1", function(d) { return d.source.x})
			.attr("y1", function(d) { return d.source.y})
			.attr("x2", function(d) { return d.target.x})
			.attr("y2", function(d) { return d.target.y});
	}
	
} // end of compareDepartments


d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};









