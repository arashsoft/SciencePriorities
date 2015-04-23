String.prototype.contains = function(text) {
    return this.indexOf(text) != -1;
};

//GLOBAL LOG
function log(object) {
    console.log(object);
};

/**
 * @ngdoc function
 * @name extProApp.controller:AnalyticsCtrl
 * @description
 * # AnalyticsCtrl
 * Controller of the sciencePriorities2App
 */
angular.module('sciencePriorities2App')
    .controller('AnalyticsCtrl', function ($scope, $log, $http) {
        $scope.oneAtATime = true;
        $scope.status = {
            isFirstOpen: true,
            isFirstDisabled: false
        };

        this.treemapLabels = ['Departments', 'Sponsors', 'Programs'];

        this.treemapWeight = ['Uniform', 'Amount'];

        this.treemapType = ['single', 'dual'];

        this.analyticsModel = [
            {
                name: 'Very Relaxed',
                info: 'Explore through all relevant publications'
            },
            {
                name: 'Relaxed',
                info: 'Apply the keywords matching algorithm'
            },
            {
                name: 'Specific',
                info: 'Apply the topics modelling & matching algorithm'
            }
        ];

        this.awardSelection = {
            awardSelected: false,
            selectedAwardID: -1
        };

        this.selectedPublicationsAnalytics = false;

        //Filter box attributes
        this.filterSetting = {
            awardMinRange: 2000,
            awardMaxRange: 2015,
            awardMinAmount: 100000,
            awardMaxAmount: 15000000,
            awardStatusAccepted:true,
            awardStatusRejectedClosed:false,
            facet: 'Departments',
            analyzableSwitch: false,
            treemapWeight: 'Amount'
        };

        //Resets the filters
        this.resetFilters = function() {
            this.filterSetting = {
                awardMinRange: 2000,
                awardMaxRange: 2015,
                awardMinAmount: 1000,
                awardMaxAmount: 15000000,
                awardStatusAccepted:true,
                awardStatusRejectedClosed:false,
                facet: 'Departments',
                analyzableSwitch: false,
                treemapWeight: 'Amount'
            };
        };

        //Algorithm attributes
        this.analyticsSetting = {
            publicationMinRange: 2002,
            publicationMaxRange: 2012,
            model: '',
            author:'Primary',
            keyword: 'Linear',
            confidence: 0.6,
            topicNumber: 2,
            termNumber: 3,
            aggregation: 'Uniform'
        };

        //Resets the algorithm attributes
        this.resetAnalyticsAttributes = function() {
            this.analyticsSetting = {
                publicationMinRange: 2002,
                publicationMaxRange: 2012,
                model: '',
                author:'Primary',
                keyword: 'Linear',
                confidence: 0.6,
                topicNumber: 2,
                termNumber: 3,
                aggregation: 'Uniform'
            };
        };


        this.checkAwardSelected = function() {
            return (this.selectedAwardProposalID === -1);
        }
        this.checkAwardSelected = this.checkAwardSelected();
    }
);

angular.module('sciencePriorities2App')
    .directive('donutChart', function() {
        return { restrict: 'E',
            scope: { data: '=', id: "="},
            link: function(scope, element, attr) {
                var data = scope.data[0];
                var myId = attr.id;
                var param = scope.data[1];
                // the D3 bits...
                var color = d3.scale.category10();
                var width = 500;
                var height = 500;
                var pie = d3.layout.pie().sort(null);
                var arc = d3.svg.arc()
                    .outerRadius(width / 2 * 0.9)
                    .innerRadius(width / 2 * 0.5);
                var svg = d3.select(element[0]).append('svg')
                    .attr({width: width, height: height})
                    .append('g')
                    .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
                // add the <path>s for each arc slice
                svg.selectAll('path').data(pie(data)) // our data
                    .enter().append('path')
                    .style('stroke', 'white')
                    .attr('d', arc)
                    .attr('fill', function(d, i){ return color(i) });

                scope.$watch('data', function (newData) {
                    svg.selectAll('*').remove();
                    alert(param);
                    // add the <path>s for each arc slice
                    svg.selectAll('path').data(pie(data)) // our data
                        .enter().append('path')
                        .style('stroke', 'white')
                        .attr('d', arc)
                        .attr('fill', function(d, i){ return color(i) });
                },true);
            }};
    }
);

//tree-map directive
angular.module('sciencePriorities2App')
    .directive('treeMap', function () {
        var treemapDirective = {};
        treemapDirective.restrict = 'E';
        treemapDirective.scope= {
            facet: '=',
            param1: '=',
            param2: '=',
            type: '='
            //weight: '='
        };
        treemapDirective.link = function (scope, element, attr) {
            // constants
            var margin = {top: 5, right: 5, bottom: 5, left: 5},
                treemapWidth = element.parent().width()*0.995,
                treemapHeight = 750,
                x = d3.scale.linear().range([0, treemapWidth]).clamp(true),
                y = d3.scale.linear().range([0, treemapHeight]).clamp(true),
                color = d3.scale.category20c(),
                root,
                node,
                treemap,
                formatNumber = d3.format(",d"),
                transitioning;

            var treemapSVGContainer = d3.select(element[0])
                .append('div')
                .style('width', treemapWidth)
                .style('height', treemapHeight)
                .append('svg')
                .attr('width', treemapWidth)
                .attr('height', treemapHeight)
                .append('svg:g')
                .attr('transform', 'translate(0,0)');

            var tip = d3.tip()
                .attr('class', 'd3-tip')
                .offset([0, 30])
                .html(function(d) {
                    var tipContainer =
                        "<strong>Award ID: </strong><span style='color:inherit'>" + d.id + "</span>" +
                        "<br>" +
                        "<strong>Award Title: </strong><span style='color:inherit'>" + d.name + "</span>" +
                        "<br>" +
                        "<strong>Award Amount: </strong><span style='color:inherit'>$" + d.size + "</span>" +
                        "<br>" +
                        "<strong>Department: </strong><span style='color:inherit'>" + d.departmentName + "</span>" +
                        "<br>" +
                        "<strong>Sponsor: </strong><span style='color:inherit'>" + d.sponsorName + "</span>" +
                        "<br>" +
                        "<strong>Program: </strong><span style='color:inherit'>" + d.programName + "</span>" +
                        "<br>" +
                        "<strong>Award Period: </strong><span style='color:inherit'>" + d.beginDate.slice(0, 10) + ' - ' + d.endDate.slice(0, 10) +"</span>";

                    return tipContainer;
                });


            treemapSVGContainer.call(tip);

            scope.$watchCollection('param1', function(newAnalyticsSetting) {
                treemapSVGContainer.selectAll("*").remove().transition().ease('elastic');

                treemapSVGContainer.append('text')
                    .text('Preparing the visual representation . . .')
                    .attr('transform', 'translate(' + 0 + ',' + 50 + ')')
                    .attr('id', 'waiting-text')
                    .attr('class', 'loadingMessage treemap');

                if(scope.type == 'single') {
                    $.get("/jsonrequest2/treemapSelect/" + JSON.stringify(newAnalyticsSetting), function (jsonFile){
                        //get the list of distinct departments, sponsors, and programs, to create the modified treemap data
                        var treemap_data = new Array();    //an array that will hold three different versions of the data based on departments, sponsors, and programs

                        var treemap_dept = new Object();    //one of the three different versions, organized based on departments
                        treemap_dept.name = 'UWO-Faculty of Science';
                        treemap_dept.children = new Array();

                        var treemap_spnsr = new Object();    //one of the three different versions, organized based on sponsors
                        treemap_spnsr.name = 'UWO-Faculty of Science';
                        treemap_spnsr.children = new Array();

                        var treemap_prgrm = new Object();    //one of the three different versions, organized based on programs
                        treemap_prgrm.name = 'UWO-Faculty of Science';
                        treemap_prgrm.children = new Array();

                        //get the unique list of departments, sponsors, and programs
                        var departments_uniq = _.uniq(_.pluck(jsonFile, 'departmentName'));
                        var sponsors_uniq = _.uniq(_.pluck(jsonFile, 'sponsorName'));
                        var programs_uniq = _.uniq(_.pluck(jsonFile, 'programName'));

                        //organize the awards accordingly
                        var department_temp = _.groupBy(jsonFile, function(award) { return award.departmentName});
                        var sponsor_temp = _.groupBy(jsonFile, function(award) { return award.sponsorName});
                        var program_temp = _.groupBy(jsonFile, function(award) { return award.programName});

                        departments_uniq.forEach(function(dept) {
                            var dept_temp = new Object();
                            dept_temp.name = dept;
                            dept_temp.children = department_temp[dept];
                            treemap_dept.children.push(dept_temp);
                        });

                        sponsors_uniq.forEach(function(spnsr) {
                            var spnsr_temp = new Object();
                            spnsr_temp.name = spnsr;
                            spnsr_temp.children = sponsor_temp[spnsr];
                            treemap_spnsr.children.push(spnsr_temp);
                        });

                        programs_uniq.forEach(function(prgrm) {
                            var prgrm_temp = new Object();
                            prgrm_temp.name = prgrm;
                            prgrm_temp.children = program_temp[prgrm];
                            treemap_prgrm.children.push(prgrm_temp);
                        });

                        treemap_data = [treemap_dept, treemap_spnsr, treemap_prgrm];

                        if(scope.facet === "Departments") {
                            drawTreemap(treemap_data[0], scope);
                        }
                        else if(scope.facet === "Sponsors") {
                            drawTreemap(treemap_data[1], scope);
                        }
                        else if(scope.facet === "Programs") {
                            drawTreemap(treemap_data[2], scope);
                        }
                    });
                }
                else if(scope.type == 'dual') {
                    $.get("/jsonrequest2/treemapSelect/" + JSON.stringify(newAnalyticsSetting), function (jsonFile){
                        //get the list of distinct departments, sponsors, and programs, to create the modified treemap data
                        var treemap_data = new Array();    //an array that will hold three different versions of the data based on departments, sponsors, and programs

                        var treemap_dept = new Object();    //one of the three different versions, organized based on departments
                        treemap_dept.name = 'UWO-Faculty of Science';
                        treemap_dept.children = new Array();

                        var treemap_spnsr = new Object();    //one of the three different versions, organized based on sponsors
                        treemap_spnsr.name = 'UWO-Faculty of Science';
                        treemap_spnsr.children = new Array();

                        var treemap_prgrm = new Object();    //one of the three different versions, organized based on programs
                        treemap_prgrm.name = 'UWO-Faculty of Science';
                        treemap_prgrm.children = new Array();

                        //get the unique list of departments, sponsors, and programs
                        var departments_uniq = _.uniq(_.pluck(jsonFile, 'departmentName'));
                        var sponsors_uniq = _.uniq(_.pluck(jsonFile, 'sponsorName'));
                        var programs_uniq = _.uniq(_.pluck(jsonFile, 'programName'));

                        //organize the awards accordingly
                        var department_temp = _.groupBy(jsonFile, function(award) { return award.departmentName});
                        var sponsor_temp = _.groupBy(jsonFile, function(award) { return award.sponsorName});
                        var program_temp = _.groupBy(jsonFile, function(award) { return award.programName});

                        departments_uniq.forEach(function(dept) {
                            var dept_temp = new Object();
                            dept_temp.name = dept;
                            dept_temp.children = department_temp[dept];
                            treemap_dept.children.push(dept_temp);
                        });

                        sponsors_uniq.forEach(function(spnsr) {
                            var spnsr_temp = new Object();
                            spnsr_temp.name = spnsr;
                            spnsr_temp.children = sponsor_temp[spnsr];
                            treemap_spnsr.children.push(spnsr_temp);
                        });

                        programs_uniq.forEach(function(prgrm) {
                            var prgrm_temp = new Object();
                            prgrm_temp.name = prgrm;
                            prgrm_temp.children = program_temp[prgrm];
                            treemap_prgrm.children.push(prgrm_temp);
                        });

                        treemap_data = [treemap_dept, treemap_spnsr, treemap_prgrm];

                        if(scope.facet === "Departments") {
                            drawTreemap(treemap_data[0], scope);
                        }
                        else if(scope.facet === "Sponsors") {
                            drawTreemap(treemap_data[1], scope);
                        }
                        else if(scope.facet === "Programs") {
                            drawTreemap(treemap_data[2], scope);
                        }
                    });
                }

            }, true);

            function drawTreemap(treemapData, scope) {
                node = root = treemapData;
                var selectedAward = -1;

                treemap = d3.layout.treemap()
                    .round(false)
                    .size([treemapWidth, treemapHeight])
                    .sticky(true)
                    .value(function(d) {
                        /*if(scope.weight === 'Uniform') {
                            return 1;
                        }
                        else if(scope.weight === 'Amount') {
                            return d.size;
                        }*/
                        return 1;
                        //return d.size;
                    });

                var nodes = treemap.nodes(root)
                    .filter(function(d) {
                        return !d.children;
                    });

                var cell = treemapSVGContainer.selectAll('g')
                    .data(nodes)
                    .enter()
                    .append('svg:g')
                    .attr('class', 'cell')
                    .attr('transform', function(d) {
                        return 'translate(' + d.x + ',' + d.y + ')';
                    });

                d3.selectAll('.loadingMessage').remove().transition().ease('elastic');

                cell.append('svg:rect')
                    .attr('width', function(d) {
                        return d.dx - 1;
                    })
                    .attr('height', function(d) {
                        return d.dy - 1;
                    })
                    .style('fill', function(d) {
                        return color(d.parent.name);
                    })
                    .attr('class', 'treemapCell treemap')
                    .on('mouseover', tip.show)
                    .on('mouseout', tip.hide)
                    .on('dblclick', function(d) {
                        //stop showing browser menu
                        d3.event.preventDefault();

                        return zoom(node === d.parent ? root : d.parent);
                    })
                    .on('click', function(d) {
                        if(scope.type === 'dual') {
                            d3.selectAll('.treemapCell').style('stroke', 'white');
                            d3.selectAll('.treemapCell').style('stroke-dasharray', '0,0');

                            if(!scope.param2.awardSelected) {
                                scope.param2.awardSelected = true;
                                scope.param2.selectedAwardID = d.id;

                                d3.select(this).style('stroke', 'black');
                                d3.select(this).style('stroke-dasharray', '5,5');
                            }
                            else {
                                if (scope.param2.selectedAwardID === d.id) {
                                    scope.param2.awardSelected = false;
                                    scope.param2.selectedAwardID = -1;

                                    d3.select(this).style('stroke', 'white');
                                    d3.select(this).style('stroke-dasharray', '0,0');
                                }
                                else {
                                    scope.param2.selectedAwardID = d.id;

                                    d3.select(this).style('stroke', 'black');
                                    d3.select(this).style('stroke-dasharray', '5,5');
                                }
                            }

                            //stop showing browser menu
                            d3.event.preventDefault();
                        }
                        else if(scope.type === 'single') {
                            d3.select(this).style('stroke', 'white');
                            d3.select(this).style('stroke-dasharray', '0,0');

                            //stop showing browser menu
                            d3.event.preventDefault();
                        }
                    })
                    .on('contextmenu', function(d) {
                        //stop showing browser menu
                        d3.event.preventDefault();
                    });

                cell.append('svg:text')
                    .attr('x', function(d) {
                        return d.dx / 2;
                    })
                    .attr('y', function(d) {
                        return d.dy / 2;
                    })
                    .attr('dy', '.35em')
                    .attr('text-anchor', 'middle')
										.attr('class','treemaptext')
                    .text(function(d) {
                        return d.name;
                    })
                    .style('opacity', function(d) {
                        d.w = this.getComputedTextLength();
                        return d.dx > d.w ? 1 : 0;
                    })
                    .on('mouseover', tip.show)
                    .on('mouseout', tip.hide)

                    .on('click', function(d) {
                        //stop showing browser menu
                        d3.event.preventDefault();

                        return zoom(node === d.parent ? root : d.parent);
                    })
                    .on('dblclick', function(d) {
                        /*if(scope.type === 'dual') {
                            d3.selectAll('.treemapCell').style('stroke', 'white');
                            d3.selectAll('.treemapCell').style('stroke-dasharray', '0,0');

                            if(!scope.param2.awardSelected) {
                                scope.param2.awardSelected = true;
                                scope.param2.selectedAwardID = d.id;

                                d3.select(this).style('stroke', 'black');
                                d3.select(this).style('stroke-dasharray', '5,5');
                            }
                            else {
                                if (scope.param2.selectedAwardID === d.id) {
                                    scope.param2.awardSelected = false;
                                    scope.param2.selectedAwardID = -1;

                                    d3.select(this).style('stroke', 'white');
                                    d3.select(this).style('stroke-dasharray', '0,0');
                                }
                                else {
                                    //alert('You can only select one award at a time.');
                                    scope.param2.selectedAwardID = d.id;

                                    d3.select(this).style('stroke', 'black');
                                    d3.select(this).style('stroke-dasharray', '5,5');
                                }
                            }
                        }
                        else if(scope.type === 'single') {
                            d3.select(this).style('stroke', 'white');
                            d3.select(this).style('stroke-dasharray', '0,0');
                        }*/

                        //stop showing browser menu
                        d3.event.preventDefault();
                    })
                    .on('contextmenu', function(d) {
                        //stop showing browser menu
                        d3.event.preventDefault();
                    });

                d3.select(window).on('click', function() {
                    zoom(root);
                });

                d3.select('select')
                    .on('change', function() {
                        treemap
                            .value(d.size)
                            .nodes(root);
                        zoom(node);
                    });

                function size(d) {
                    return d.size;
                };

                function count(d) {
                    return 1;
                };

                function zoom(d) {
                    var kx = parseFloat(treemapWidth / d.dx),
                        ky = parseFloat(treemapHeight / d.dy);
                    x.domain([d.x, d.x + d.dx]);
                    y.domain([d.y, d.y + d.dy]);

                    var t = treemapSVGContainer.selectAll('g.cell').transition()
                        .duration(d3.event.altKey ? 7500 : 750)
                        .attr('transform', function(d) {
                            return 'translate(' + x(d.x) + ',' + y(d.y) + ')';
                        });

                    t.select('rect')
                        .attr('width', function(d) {
                            return kx * d.dx - 1;
                        })
                        .attr('height', function(d) {
                            return ky * d.dy - 1;
                        });

                    t.select('text')
                        .attr('x', function(d) {
                            return kx * d.dx / 2;
                        })
                        .attr('y', function(d) {
                            return ky * d.dy / 2;
                        })
                        .style('opacity', function(d) {
                            return kx * d.dx > d.w ? 1 : 0;
                        });

                    node = d;
                    d3.event.stopPropagation();
                };
            };
        };

        return treemapDirective;
    }
);

//foam-tree directive
angular.module('sciencePriorities2App')
    .directive('foamTree', function () {
        var foamTreeDirective = {};
        foamTreeDirective.restrict = 'E';
        foamTreeDirective.scope= {
            facet: '=',
            param1: '=',
            param2: '=',
            type: '='
            //weight: '='
        };
        foamTreeDirective.link = function (scope, element, attr) {
            scope.$watchCollection('param1', function(newAnalyticsSetting) {
                if(scope.type == 'single') {
                    $.get("/jsonrequest2/foamTreeSelect/" + JSON.stringify(newAnalyticsSetting), function (jsonFile){
                        //get the list of distinct departments, sponsors, and programs, to create the modified treemap data
                        var treemap_data = new Array();    //an array that will hold three different versions of the data based on departments, sponsors, and programs

                        var treemap_dept = new Object();    //one of the three different versions, organized based on departments
                        //treemap_dept.name = 'UWO-Faculty of Science';
                        treemap_dept.label = 'UWO-Faculty of Science';
                        //treemap_dept.children = new Array();
                        treemap_dept.groups = new Array();

                        var treemap_spnsr = new Object();    //one of the three different versions, organized based on sponsors
                        //treemap_spnsr.name = 'UWO-Faculty of Science';
                        treemap_spnsr.label = 'UWO-Faculty of Science';
                        //treemap_spnsr.children = new Array();
                        treemap_spnsr.groups = new Array();

                        var treemap_prgrm = new Object();    //one of the three different versions, organized based on programs
                        //treemap_prgrm.name = 'UWO-Faculty of Science';
                        treemap_prgrm.label = 'UWO-Faculty of Science';
                        //treemap_prgrm.children = new Array();
                        treemap_prgrm.groups = new Array();

                        //get the unique list of departments, sponsors, and programs
                        var departments_uniq = _.uniq(_.pluck(jsonFile, 'departmentName'));
                        var sponsors_uniq = _.uniq(_.pluck(jsonFile, 'sponsorName'));
                        var programs_uniq = _.uniq(_.pluck(jsonFile, 'programName'));

                        //organize the awards accordingly
                        var department_temp = _.groupBy(jsonFile, function(award) { return award.departmentName});
                        var sponsor_temp = _.groupBy(jsonFile, function(award) { return award.sponsorName});
                        var program_temp = _.groupBy(jsonFile, function(award) { return award.programName});

                        departments_uniq.forEach(function(dept) {
                            var dept_temp = new Object();
                            //dept_temp.name = dept;
                            dept_temp.label = dept;
                            //dept_temp.children = department_temp[dept];
                            dept_temp.groups = department_temp[dept];
                            //treemap_dept.children.push(dept_temp);
                            treemap_dept.groups.push(dept_temp);
                        });

                        sponsors_uniq.forEach(function(spnsr) {
                            var spnsr_temp = new Object();
                            //spnsr_temp.name = spnsr;
                            spnsr_temp.label = spnsr;
                            //spnsr_temp.children = sponsor_temp[spnsr];
                            spnsr_temp.groups = sponsor_temp[spnsr];
                            //treemap_spnsr.children.push(spnsr_temp);
                            treemap_spnsr.groups.push(spnsr_temp);
                        });

                        programs_uniq.forEach(function(prgrm) {
                            var prgrm_temp = new Object();
                            //prgrm_temp.name = prgrm;
                            prgrm_temp.label = prgrm;
                            //prgrm_temp.children = program_temp[prgrm];
                            prgrm_temp.groups = program_temp[prgrm];
                            //treemap_prgrm.children.push(prgrm_temp);
                            treemap_prgrm.groups.push(prgrm_temp);
                        });

                        treemap_data = [treemap_dept, treemap_spnsr, treemap_prgrm];

                        if(scope.facet === "Departments") {
                            drawFoamTree(treemap_data[0], scope, 'treemap');
                        }
                        else if(scope.facet === "Sponsors") {
                            drawFoamTree(treemap_data[1], scope, 'treemap');
                        }
                        else if(scope.facet === "Programs") {
                            drawFoamTree(treemap_data[2], scope, 'treemap');
                        }
                    });
                }
                else if(scope.type == 'dual') {
                    $.get("/jsonrequest2/foamTreeSelect/" + JSON.stringify(newAnalyticsSetting), function (jsonFile){
                        //get the list of distinct departments, sponsors, and programs, to create the modified treemap data
                        var treemap_data = new Array();    //an array that will hold three different versions of the data based on departments, sponsors, and programs

                        var treemap_dept = new Object();    //one of the three different versions, organized based on departments
                        //treemap_dept.name = 'UWO-Faculty of Science';
                        treemap_dept.label = 'UWO-Faculty of Science Awards';
                        //treemap_dept.children = new Array();
                        treemap_dept.groups = new Array();

                        var treemap_spnsr = new Object();    //one of the three different versions, organized based on sponsors
                        //treemap_spnsr.name = 'UWO-Faculty of Science';
                        treemap_spnsr.label = 'UWO-Faculty of Science Awards';
                        //treemap_spnsr.children = new Array();
                        treemap_spnsr.groups = new Array();

                        var treemap_prgrm = new Object();    //one of the three different versions, organized based on programs
                        //treemap_prgrm.name = 'UWO-Faculty of Science';
                        treemap_prgrm.label = 'UWO-Faculty of Science Awards';
                        //treemap_prgrm.children = new Array();
                        treemap_prgrm.groups = new Array();

                        //get the unique list of departments, sponsors, and programs
                        var departments_uniq = _.uniq(_.pluck(jsonFile, 'departmentName'));
                        var sponsors_uniq = _.uniq(_.pluck(jsonFile, 'sponsorName'));
                        var programs_uniq = _.uniq(_.pluck(jsonFile, 'programName'));

                        //organize the awards accordingly
                        var department_temp = _.groupBy(jsonFile, function(award) { return award.departmentName});
                        var sponsor_temp = _.groupBy(jsonFile, function(award) { return award.sponsorName});
                        var program_temp = _.groupBy(jsonFile, function(award) { return award.programName});

                        departments_uniq.forEach(function(dept) {
                            var dept_temp = new Object();
                            //dept_temp.name = dept;
                            dept_temp.label = dept;
                            //dept_temp.children = department_temp[dept];
                            dept_temp.groups = department_temp[dept];
                            //treemap_dept.children.push(dept_temp);
                            treemap_dept.groups.push(dept_temp);
                        });

                        sponsors_uniq.forEach(function(spnsr) {
                            var spnsr_temp = new Object();
                            //spnsr_temp.name = spnsr;
                            spnsr_temp.label = spnsr;
                            //spnsr_temp.children = sponsor_temp[spnsr];
                            spnsr_temp.groups = sponsor_temp[spnsr];
                            //treemap_spnsr.children.push(spnsr_temp);
                            treemap_spnsr.groups.push(spnsr_temp);
                        });

                        programs_uniq.forEach(function(prgrm) {
                            var prgrm_temp = new Object();
                            //prgrm_temp.name = prgrm;
                            prgrm_temp.label = prgrm;
                            //prgrm_temp.children = program_temp[prgrm];
                            prgrm_temp.groups = program_temp[prgrm];
                            //treemap_prgrm.children.push(prgrm_temp);
                            treemap_prgrm.groups.push(prgrm_temp);
                        });

                        treemap_data = [treemap_dept, treemap_spnsr, treemap_prgrm];

                        if(scope.facet === "Departments") {
                            drawFoamTree(treemap_data[0], scope, 'leftTreemap');
                        }
                        else if(scope.facet === "Sponsors") {
                            alert('Wrong facet was chosen!');
                            drawFoamTree(treemap_data[1], scope, 'treemap');
                        }
                        else if(scope.facet === "Programs") {
                            drawFoamTree(treemap_data[2], scope, 'rightTreemap');
                        }
                    });
                }

            }, true);

            function drawFoamTree(treemapData, scope, foamTreeId) {
                var foamtree = new CarrotSearchFoamTree({
                    id: foamTreeId,
                    dataObject: {
                        label: 'UWO-Faculty of Science Awards',
                        groups: treemapData.groups
                    },
                    layout: 'ordered',
                    //rainbowEndColor: "hsla(360, 100%, 55%, 1)",
                    groupBorderRadius: 0.15,
                    groupBorderWidth: 1.75,
                    groupInsetWidth: 16,
                    groupSelectionOutlineWidth: 8,
                    groupStrokeWidth: 1.5,
                    parentFillOpacity: 0.8,
                    rolloutEasing: "squareInOut",
                    rolloutScalingStrength: -0.3,
                    rolloutRotationStrength: 0,
                    pullbackEasing: "squareInOut",
                    pullbackDuration: 2000,
                    pullbackScalingStrength: -0.3,
                    pullbackRotationStrength: 0,
                    pullbackPolygonDelay: 0.1,
                    titleBarFontFamily: "Oxygen",
                    attributionPosition: 45
                });
                CarrotSearchFoamTree.hints(foamtree);
            };
        };

        return foamTreeDirective;
    }
);

//keyword-ext directive
angular.module('sciencePriorities2App')
    .directive('keywordExt', function () {
        var keywordExtDirective = {};

        keywordExtDirective.restrict = 'E';
        keywordExtDirective.transclude = true;
        keywordExtDirective.scope = {
            data: '=',
            param1: '=',
            param2: '=',
            param3: '='
        };
        keywordExtDirective.link = function (scope, element, attr) {
            var analyticsSetting = scope.param1;
            var publicationsSelected = scope.param3;

            var margin = {top: 5, right: 5, bottom: 5, left: 5},
                chartWidth = 1300,
                chartHeight = 3000,
                padding = 50;

            //var awardKeywordColors = d3.scale.category20();
            //var awardKeywordColors = d3.scale.arman_category1();
            var awardKeywordColors = d3.scale.arman_category2();

            /*///////////////////////////////////////////////////////////////////////////////*/

            // set up the main svg container

            var analysisSVGContainer = d3.select(element[0])
                .append('svg')
                .attr('width', chartWidth)
                .attr('height', chartHeight)
                .attr('id', 'analysisSVGContainer')
                .style('background-color', 'transparent')
                .attr('transform', 'translate(' + 0 + ',' + 0 + ')');

            /*///////////////////////////////////////////////////////////////////////////////*/

            scope.$watchCollection('param1', function(newAnalyticsSetting, oldAnalyticsSetting) {
                if(scope.param1.model === '') {
                    if(scope.param2.selectedAwardID == -1) {
                        analysisSVGContainer.append('text')
                            .text('Please select an award from either of the above treemaps.')
                            .attr('transform', 'translate(' + 0 + ',' + padding + ')')
                            .attr('id', 'update-text')
                            .attr('class', 'message treemap');
                    }
                    else {
                        analysisSVGContainer.selectAll("#graph-root").remove().transition().duration(500).ease('elastic');
                        analysisSVGContainer.selectAll(".awardInfo").remove().transition().duration(500).ease('elastic');
                        analysisSVGContainer.selectAll(".correlatedkeywords").transition().duration(500).ease('elastic');
                        analysisSVGContainer.selectAll(".message").remove().transition().duration(500).ease('elastic');
                        d3.selectAll('.loadingMessage').remove().transition().duration(500).ease('elastic');

                        analysisSVGContainer.append('text')
                            .text('Please choose one of the available analytics models.')
                            .attr('transform', 'translate(' + 0 + ',' + padding + ')')
                            .attr('id', 'update-text')
                            .attr('class', 'message treemap');
                    }
                }
                else {
                    if(scope.param2.selectedAwardID == -1) {
                        analysisSVGContainer.selectAll("#graph-root").remove().transition().duration(500).ease('elastic');
                        analysisSVGContainer.selectAll(".awardInfo").remove().transition().duration(500).ease('elastic');
                        analysisSVGContainer.selectAll(".correlatedkeywords").transition().duration(500).ease('elastic');
                        analysisSVGContainer.selectAll(".message").remove().transition().duration(500).ease('elastic');
                        analysisSVGContainer.selectAll(".errorMessage").remove().transition().duration(500).ease('elastic');
                        d3.selectAll('.loadingMessage').remove().transition().duration(500).ease('elastic');

                        analysisSVGContainer.append('text')
                            .text('Please select an award from either of the above treemaps.')
                            .attr('transform', 'translate(' + 0 + ',' + padding + ')')
                            .attr('id', 'update-text')
                            .attr('class', 'message treemap');
                    }
                    else {
                        var selectedAwardID = scope.param2.selectedAwardID;
                        var setting = newAnalyticsSetting;
                        var analysisObject = {
                            selectedAwardID: scope.param2.selectedAwardID,
                            setting: scope.param1
                        };

                        analysisSVGContainer.selectAll('*').remove();
                        analysisSVGContainer.append('text')
                            .text('Preparing the visual representation . . .')
                            .attr('transform', 'translate(' + 2.5*padding + ',' + 4*padding/5 + ')')
                            .attr('id', 'waiting-text')
                            .attr('class', 'loadingMessage treemap');

                        $.get('/jsonrequest2/awardAnalysisSelect/' + JSON.stringify(analysisObject) , function(analyzedAward){
                            var filteredPublications = filterPublications(analyzedAward._relatedPublicationsList, setting);
                            analyzedAward._relatedPublicationsList = filteredPublications;
                            //drawGraph(analyzedAward, newAnalyticsSetting, publicationsSelected);
                            drawGraph2(analyzedAward, newAnalyticsSetting, publicationsSelected);
                        }).fail(function() {});
                    }
                }
            }, true);

            Object.observe(scope.param2, function() {
                if(scope.param2.selectedAwardID == -1) {
                    analysisSVGContainer.selectAll("#graph-root").remove().transition().duration(500).ease('elastic');
                    analysisSVGContainer.selectAll(".awardInfo").remove().transition().duration(500).ease('elastic');
                    analysisSVGContainer.selectAll(".correlatedkeywords").transition().duration(500).ease('elastic');
                    analysisSVGContainer.selectAll(".message").remove().transition().duration(500).ease('elastic');
                    analysisSVGContainer.selectAll(".errorMessage").remove().transition().duration(500).ease('elastic');
                    d3.selectAll('.metadataDiv').remove().transition().duration(500).ease('elastic');
                    d3.selectAll('.metadataText').remove().transition().duration(500).ease('elastic');
                    d3.selectAll('.loadingMessage').remove().transition().duration(500).ease('elastic');


                    analysisSVGContainer.append('text')
                        .text('Please select an award from either of the above treemaps.')
                        .attr('transform', 'translate(' + 0 + ',' + padding + ')')
                        .attr('id', 'update-text')
                        .attr('class', 'message treemap');
                }
                else {
                    if(analyticsSetting.model == '') {
                        analysisSVGContainer.selectAll("#graph-root").remove().transition().ease('elastic');
                        analysisSVGContainer.selectAll(".awardInfo").remove().transition().ease('elastic');
                        analysisSVGContainer.selectAll(".correlatedkeywords").remove().transition().ease('elastic');
                        analysisSVGContainer.selectAll(".message").remove().transition().ease('elastic');
                        d3.selectAll('.loadingMessage').remove().transition().duration(500).ease('elastic');

                        analysisSVGContainer.append('text')
                            .text('Please choose one of the available analytics models.')
                            .attr('transform', 'translate(' + 0 + ',' + padding + ')')
                            .attr('id', 'update-text')
                            .attr('class', 'message treemap');
                    }
                    else {
                        var selectedAwardID = scope.param2.selectedAwardID;
                        var setting = scope.param1;
                        var analysisObject = {
                            selectedAwardID: scope.param2.selectedAwardID,
                            setting: scope.param1
                        };

                        analysisSVGContainer.selectAll('*').remove();
                        analysisSVGContainer.append('text')
                            .text('Preparing the visual representation . . .')
                            .attr('transform', 'translate(' + 2.5*padding + ',' + 4*padding/5 + ')')
                            .attr('id', 'waiting-text')
                            .attr('class', 'loadingMessage treemap');


                        $.get('/jsonrequest2/awardAnalysisSelect/' + JSON.stringify(analysisObject) , function(analyzedAward){
                            var filteredPublications = filterPublications(analyzedAward._relatedPublicationsList, setting);
                            analyzedAward._relatedPublicationsList = filteredPublications;
                            //drawGraph(analyzedAward, setting, publicationsSelected);
                            drawGraph2(analyzedAward, setting, publicationsSelected);
                        });
                    }

                }
            });

            //functions withing the scope of link
            function drawGraph2(analyticsAward, analyticsSetting, publicationsSelected) {
                // constants and variables that determine the scales
                //for award
                var awardKeywords = analyticsAward._awardKeywords;
                var awardTopics = analyticsAward._ldaResult;

                //for publications
                var yearValues = _.uniq(_.pluck(analyticsAward._relatedPublicationsList, '_year')).sort(function(a, b){return b-a});
                var analyticsAwardModified = orderByYear(analyticsAward);
                var maxPublicationNumberPerYear = _.size(analyticsAwardModified._relatedPublicationsList[yearValues[0]]);
                var minPublicationNumberPerYear = _.size(analyticsAwardModified._relatedPublicationsList[yearValues[0]]);
                yearValues.forEach(function(year) {
                    if(_.size(analyticsAwardModified._relatedPublicationsList[year]) > maxPublicationNumberPerYear) {maxPublicationNumberPerYear = _.size(analyticsAward._relatedPublicationsList[year])};
                    if(_.size(analyticsAwardModified._relatedPublicationsList[year]) < minPublicationNumberPerYear) {minPublicationNumberPerYear = _.size(analyticsAward._relatedPublicationsList[year])};
                });

                /*///////////////////////////////////////////////////////////////////////////////*/

                var authorCollaborationAnalysisArray = new Array();
                var authorTopicComparisonArray = new Array();

                /*///////////////////////////////////////////////////////////////////////////////*/

                //clean the SVG
                analysisSVGContainer.selectAll('*').remove().transition().duration(500).ease('elastic');

                //add award information
                analysisSVGContainer.append('text')
                    .text('Award Title: ' + analyticsAwardModified._title)
                    .attr('transform', 'translate(' + 300 + ',' + padding/5 + ')')
                    .attr('id', 'award-title')
                    .attr('class', 'awardInfo');

                analysisSVGContainer.append('text')
                    .text('Award Amount: $' + analyticsAwardModified._amount)
                    .attr('transform', 'translate(' + 300 + ',' + 3*padding/5 + ')')
                    .attr('id', 'award-amount')
                    .attr('class', 'awardInfo');

                if(analyticsAwardModified._awardBeginDate.slice(0,4) === '0000') {
                    analysisSVGContainer.append('text')
                        .text('Award Dates: Not available')
                        .attr('transform', 'translate(' + 300 + ',' + 5*padding/5 + ')')
                        .attr('id', 'award-dates')
                        .attr('class', 'awardInfo');
                }
                else {
                    analysisSVGContainer.append('text')
                        .text('Award Dates: ' + analyticsAwardModified._awardBeginDate.slice(0,10) + ' to ' + analyticsAwardModified._awardEndDate.slice(0,10))
                        .attr('transform', 'translate(' + 300 + ',' + 5*padding/5 + ')')
                        .attr('id', 'award-dates')
                        .attr('class', 'awardInfo');
                }


                if(analyticsSetting.model == 'Specific') {
                    analysisSVGContainer.append('text')
                        .text('Award Topics')
                        .attr('transform', 'translate(' + 0 + ',' + padding/5 + ')')
                        .attr('id', 'award-keywords')
                        .attr('class', 'awardInfo')
                        .style("text-decoration", "underline")
                        .style("font-weight", "bold");

                    var awardTopicsInfo = new Array();

                    var awardTopicsDivsGroup = analysisSVGContainer.append('g')
                        .attr('id', 'awardKeywords')
                        .attr('transform', 'translate(' + 0 + ',' + 3*padding/5 + ')')

                    var topicNumber = analyticsSetting.topicNumber;
                    var termNumber = analyticsSetting.termNumber;
                    var base = 0;
                    var termCounter = 0;
                    awardTopics.forEach(function(awardTopic, index) {
                        var awardTopicLabels = awardTopicsDivsGroup.append('text')
                            .text('Topic #' + index + ':')
                            .attr('class', 'awardInfo')
                            .attr('x', 0)
                            .attr('y', base);

                        var awardTopicsDivs = awardTopicsDivsGroup.selectAll('text.awardKeywordText')
                            .data(awardTopic)
                            .enter()
                            .append('text')
                            .text(function(d,i) { return d.term; })
                            .attr('class', 'awardInfo')
                            .attr('id', function(d,i) { return 'award-topic-'+index+'-term'+i;})
                            .attr('x', 3*padding/5)
                            .attr('y', function(d,i) {
                                return (base+ 2*padding/5) + i*2*padding/5;
                            })
                            .style('stroke', function(d,i) {
                                return awardKeywordColors(termCounter + i);
                            })
                            .each(function(d,i) {
                                var award_topic_info = new Object();
                                award_topic_info.id = 'award-keyword-'+i;
                                award_topic_info.keyword = d.term;
                                award_topic_info.color = awardKeywordColors(termCounter+i);
                                award_topic_info.x = 0;
                                award_topic_info.y = (base+ 2*padding/5) + i*2*padding/5;

                                base += 2*padding/5;
                                termCounter ++;

                                awardTopicsInfo.push(award_topic_info);
                            });

                        base += 4*padding/5;
                    });
                }
                else {
                    analysisSVGContainer.append('text')
                        .text('Award Keywords')
                        .attr('transform', 'translate(' + 0 + ',' + padding/5 + ')')
                        .attr('id', 'award-keywords')
                        .attr('class', 'awardInfo')
                        .style("text-decoration", "underline")
                        .style("font-weight", "bold");

                    var awardKeywordsInfo = new Array();
                    var awardKeywordsDivsGroup = analysisSVGContainer.append('g')
                        .attr('id', 'awardKeywords')
                        .attr('transform', 'translate(' + 0 + ',' + 3*padding/5 + ')')

                    var awardKeywordsDivs = awardKeywordsDivsGroup.selectAll('text.awardKeywordText')
                        .data(awardKeywords.slice(0,20))    //ONLY USING THE FIRST 20 KEYWORDS
                        .enter()
                        .append('text')
                        .text(function(d,i) { return d; })
                        .attr('class', 'awardInfo')
                        .attr('id', function(d,i) { return 'award-keyword-'+i;})
                        .attr('x', 0)
                        .attr('y', function(d,i) { return i*2*padding/5;})
                        .style('stroke', function(d,i) {return awardKeywordColors(i);})
                        .each(function(d,i) {
                            var award_keyword_info = new Object();
                            award_keyword_info.id = 'award-keyword-'+i;
                            award_keyword_info.keyword = d;
                            award_keyword_info.color = awardKeywordColors(i);
                            award_keyword_info.x = 0;
                            award_keyword_info.y = i*2*padding/5;

                            awardKeywordsInfo.push(award_keyword_info);
                        });
                }

                /*///////////////////////////////////////////////////////////////////////////////*/

                if(analyticsAwardModified._error) {
                    d3.selectAll('.loadingMessage').remove().transition().duration(5000).ease('elastic');
                    d3.selectAll('.errorMessage').remove().transition().duration(500).ease('elastic');

                    var graphRootContainer = analysisSVGContainer.append('g')
                        .attr('id', 'graph-root')
                        .attr('transform', 'translate(' + 2.5*padding + ',' + 4*padding/5 + ')');

                    graphRootContainer.append('text')
                        .text(analyticsAwardModified._note)
                        .attr('transform', 'translate(' + 3*padding + ',' + 2*padding + ')')
                        .attr('id', 'update-text')
                        .attr('class', 'errorMessage');
                }
                else {
                    var graphRootContainer = analysisSVGContainer.append('g')
                        .attr('id', 'graph-root')
                        .attr('transform', 'translate(' + 2.5*padding + ',' + 4*padding/5 + ')');

                    var authorsContainer = analysisSVGContainer.append('g')
                        .attr('id', 'authorsContainer')
                        .attr('transform', 'translate(' + (chartWidth-8*padding) + ',' + (padding/2) + ')');

                    var selectedAuthorsContainer = analysisSVGContainer.append('g')
                        .attr('id', 'selectedAuthorsContainer')
                        .attr('transform', 'translate(' + (chartWidth-5.5*padding) + ',' + (padding/2) + ')');

                    /*///////////////////////////////////////////////////////////////////////////////*/
                        //TIPS

                    var publicationTip = d3.tip()
                        .attr('class', 'd3-tip')
                        .offset([-50, 50])
                        .html(function(d) {
                            var tip = "<strong>Title:</strong> <span style='color:black'>" + d._title + "</span>" +
                                "<br>" +
                                "<strong>Year: </strong><span style='color:black'>" + d._year + "</span>" +
                                "<br>" +
                                "<strong>Authors: </strong><span style='color:black'>" + d._authorsArray + "</span>" +
                                "<br>" +
                                "<strong>Confidence Level: </strong><span style='color:black'>" + d._radius + "</span>";

                            return tip;
                        });
                    analysisSVGContainer.call(publicationTip);

                    var authorSymbolTip = d3.tip()
                        .attr('class', 'd3-tip')
                        .offset([-50, 50])
                        .html(function(d) {
                            var tip = "<strong>Author:</strong> <span style='color:black'>" + d.author + "</span>";

                            return tip;
                        });
                    analysisSVGContainer.call(authorSymbolTip);

                    /*///////////////////////////////////////////////////////////////////////////////*/

                        //THE FULL LIST OF ALL AUTHORS
                    var fullAuthorList = new Array();
                    yearValues.forEach(function(year,yearIndex) {
                        analyticsAward._relatedPublicationsList[year].forEach(function(publication) {
                            publication._authorsArray.forEach(function(author) {
                                fullAuthorList.push(author);
                            });
                        });
                    });
                    fullAuthorList = _.uniq(fullAuthorList);
                        //AND THEIR CORRESPONDING SYMBOLS
                    var superSymbols = d3.superformulaTypes;
                    var symboledAuthors = new Array();
                    var authorSymbols = new Array();
                    var symbolCounter = 0;
                    fullAuthorList.forEach(function(author) {
                        if(symboledAuthors.indexOf(author) < 1) {
                            symboledAuthors.push(author);
                            authorSymbols.push(superSymbols[symbolCounter++]);
                        }
                    });

                    var authorSymbolTuples = new Array();
                    symboledAuthors.forEach(function(auth,i) {
                        var temp = new Object();
                        temp.author = auth;
                        temp.symbol = authorSymbols[i];
                        authorSymbolTuples.push(temp);
                    });

                        //THE GRAPH
                    var publicationCircleRadius = 0.3*padding;
                    var publicationPadding = padding;
                    var publicationAxisHeight = 6;
                    var horizontalPadding = 0.60*padding;

                    var progressScale = d3.scale.linear()
                        .domain([0, 1])
                        .range([0, 2*padding])
                        .clamp(true)
                        .nice();

                    var selectedPublications = new Array();
                    var selectedAuthors = new Array();

                    d3.selectAll('.loadingMessage').remove().transition().duration(5000).ease('elastic');
                    d3.selectAll('.errorMessage').remove().transition().duration(500).ease('elastic');

                    yearValues.forEach(function(year,yearIndex) {
                            //THE CONTAINER
                        var yearContainer = graphRootContainer.append('g')
                            .attr('id', 'publications-year-'+year)
                            .attr('transform', 'translate(' + (padding/5) + ',' + (publicationPadding) + ')');

                            //THE YEAR BUCKETS
                        var bucketData = [
                            {
                                'x':0,
                                'y':0
                            },
                            {
                                'x':0,
                                //'y': (_.size(analyticsAward._relatedPublicationsList[year])*2*publicationCircleRadius)
                                'y': (_.size(analyticsAward._relatedPublicationsList[year]) - 1)*horizontalPadding
                            }
                        ];
                        var yearBucket = d3.svg.line()
                            .x(function(d) { return d.x; })
                            .y(function(d) { return d.y; })
                            .interpolate("linear");

                        yearContainer.append('path')
                            .attr('d', yearBucket(bucketData))
                            .attr('id', 'bucket-'+year)
                            .attr('class', 'yearBucket');

                        yearContainer.append('text')
                            .text(year)
                            .attr('id', 'yearBucket-'+year)
                            .attr('class', 'awardInfo treemap')
                            .attr('transform', 'rotate(' + (-90) + ')');

                            //THE CONFIDENCE AXIS
                        yearContainer.selectAll('rect.progressAxis')
                            .data(analyticsAward._relatedPublicationsList[year])
                            .enter()
                            .append('rect')
                            .attr('class', 'progressAxis')
                            .attr('id', function(d,i) {
                                return 'publication-'+year+'-'+i+'-axis';
                            })
                            .attr('x', function(d,i) {
                                return 0.2*padding;
                            })
                            .attr('y', function(d,i) {
                                return (i*horizontalPadding)-0.5;
                            })
                            .attr('width', function(d,i) {
                                return 2*padding;
                            })
                            .attr('height', 1);

                            //THE CONFIDENCE
                        yearContainer.selectAll('rect.progressBar')
                            .data(analyticsAward._relatedPublicationsList[year])
                            .enter()
                            .append('rect')
                            .attr('class', 'progressBar')
                            .attr('id', function(d,i) {
                                return 'publication-'+year+'-'+i+'-confidence';
                            })
                            .attr('x', function(d,i) {
                                return (2*padding)-progressScale(d._radius);
                            })
                            .attr('y', function(d,i) {
                                return (i*horizontalPadding)-1;
                            })
                            .attr('width', function(d,i) {
                                return progressScale(d._radius);
                            })
                            .attr('height', 2);

                        yearContainer.selectAll('circle.publicationCircle')
                            .data(analyticsAward._relatedPublicationsList[year])
                            .enter()
                            .append('circle')
                            .attr('class', 'publicationCircle')
                            .attr('id', function(d,i) {
                                return year + '-publication-'+i;
                            })
                            .attr('cx', (1.8*padding+publicationCircleRadius))
                            .attr('cy', function(d,i) {
                                return (i*horizontalPadding);
                            })
                            .attr('r', publicationCircleRadius)
                            .attr('authors', function(d,i) {
                                return d._authorsArray;
                            })
                            .on('mouseover', publicationTip.show)
                            .on('mouseout', publicationTip.hide)
                            .on('click', function(d,i) {
                                if(!d.selected) {
                                    d.selected = true;
                                    d3.select(this).style('stroke-width', '3');
                                    d3.select(this).style('stroke', 'green');
                                    selectedPublications.push(d);
                                }
                                else {
                                    d.selected = false;
                                    d3.select(this).style('stroke-width', '2');
                                    d3.select(this).style('stroke', 'gray');
                                    selectedPublications.splice(selectedPublications.indexOf(d), 1);
                                }
                            })
                            .on('dblclick', function(d,i){
                                d3.event.preventDefault();
                            })
                            .each(function(d,i) {
                                //set the locations for the author axis
                                d._location.container = yearContainer;
                                d._location.x = 1.8*padding+publicationCircleRadius;
                                d._location.y = i*horizontalPadding;
                                //find the keyword correlations
                                //this depends on the chosen analytics model
                                if(analyticsSetting.model == 'Specific') {
                                    var correlationMatrix = new Array();
                                    awardTopicsInfo.forEach(function(keywordObject) {
                                        var temp = new Object();
                                        temp.word = keywordObject.keyword;
                                        temp.flag = false;
                                        temp.prob = 0;
                                        temp.color = keywordObject.color;

                                        if(d._keywords.indexOf(keywordObject.keyword) > 0) {
                                            temp.flag = true;
                                            temp.prob = 1;
                                        }
                                        if(d._indexKeywords.contains(keywordObject.keyword)) {
                                            temp.flag = true;
                                            temp.prob = 1;
                                        }
                                        if(d._authorKeywords.contains(keywordObject.keyword)) {
                                            temp.flag = true;
                                            temp.prob = 1;
                                        }
                                        if(d._title.contains(keywordObject.keyword)) {
                                            temp.flag = true;
                                            temp.prob = 1;
                                        }

                                        correlationMatrix.push(temp);
                                    });
                                }
                                else {
                                    var correlationMatrix = new Array();
                                    awardKeywordsInfo.forEach(function(keywordObject) {
                                        var temp = new Object();
                                        temp.word = keywordObject.keyword;
                                        temp.flag = false;
                                        temp.prob = 0;
                                        temp.color = keywordObject.color;

                                        if(d._keywords.indexOf(keywordObject.keyword) > 0) {
                                            temp.flag = true;
                                            temp.prob = 1;
                                        }
                                        if(d._indexKeywords.contains(keywordObject.keyword)) {
                                            temp.flag = true;
                                            temp.prob = 1;
                                        }
                                        if(d._authorKeywords.contains(keywordObject.keyword)) {
                                            temp.flag = true;
                                            temp.prob = 1;
                                        }
                                        if(d._title.contains(keywordObject.keyword)) {
                                            temp.flag = true;
                                            temp.prob = 1;
                                        }

                                        correlationMatrix.push(temp);
                                    });
                                }

                                var start = 0;
                                var step = 2 * Math.PI/_.size(correlationMatrix);
                                var end = 2 * Math.PI/_.size(correlationMatrix);
                                correlationMatrix.forEach(function(element,index) {
                                    var elementArc = d3.svg.arc()
                                        .innerRadius(0)
                                        .outerRadius(publicationCircleRadius*0.75)
                                        .startAngle(start)
                                        .endAngle(end);

                                    start += step;
                                    end += step;

                                    if(element.flag) {
                                        d._location.container.append('path')
                                            .attr('d', elementArc)
                                            .attr('id', element.word)
                                            .attr('fill', element.color)
                                            .attr('transform', 'translate(' + d._location.x + ',' + d._location.y + ')');
                                    }
                                });

                            });

                        publicationPadding += _.size(analyticsAward._relatedPublicationsList[year])*horizontalPadding + padding;

                        Object.observe(selectedPublications, function() {
                            d3.selectAll('.authorsAxis').remove().transition().ease('elastic');
                            d3.selectAll('.authorSymbol').remove().transition().ease('elastic');
                            authorsContainer.selectAll('*').remove().transition().ease('elastic');

                                //CREATE THE LIST OF AUTHORS FROM THE SELECTED PUBLICATIONS
                            var tempAuthorList = new Array();
                            selectedPublications.forEach(function(selectedPublication) {
                                selectedPublication._authorsArray.forEach(function(author) {
                                    var temp = new Object();
                                    temp.author = author;
                                    temp.symbol = null;
                                    tempAuthorList.push(temp);
                                });
                            });
                            tempAuthorList = _.uniq(tempAuthorList, function(item) { return item.author; });

                            authorSymbolTuples.forEach(function(tuple, index) {
                                tempAuthorList.forEach(function(item) {
                                    if(tuple.author === item.author) {
                                        item.symbol = tuple.symbol;
                                    }
                                });
                            });

                                //INSERT LEGENDS AND SYMBOLS
                            if(_.size(selectedPublications) > 0) {
                                    //Legends Header
                                authorsContainer.append('text')
                                    .text('Authors List')
                                    .attr('transform', 'translate(' + (0) + ',' + padding/5 + ')')
                                    .attr('class', 'awardInfo')
                                    .attr('id', 'legendsTitle')
                                    .style('text-decoration', 'underline')
                                    .style('font-weight', 'bold');

                                tempAuthorList.sort(function(a,b) {
                                    if (a.author.toLowerCase() < b.author.toLowerCase()) {return -1;}
                                    if (a.author.toLowerCase() > b.author.toLowerCase()) {return 1;}
                                    return 0;
                                }).forEach(function(tuple,index) {
                                    var authorSymbolContextMenu = [
                                        {
                                            title: 'Add this author for further collaboration analysis',
                                            action: function(elm, d, i) {
                                                log(elm.id + ' added');
                                                authorCollaborationAnalysisArray.push(elm.id);
                                            }
                                        },
                                        {
                                            title: 'Remove this author from further collaboration analysis',
                                            action: function(elm, d, i) {
                                                authorCollaborationAnalysisArray.splice(authorCollaborationAnalysisArray.indexOf(elm.id), 1);
                                            }
                                        },
                                        {
                                            title: '----------------------------------------',
                                            action: function(elm, d, i) {

                                            }
                                        },
                                        {
                                            title: 'Add this author for further collaboration analysis',
                                            action: function(elm, d, i) {
                                                log(elm.id);
                                                authorCollaborationAnalysisArray.push(elm.id);
                                            }
                                        },
                                        {
                                            title: 'Remove this author from further research topic comparison',
                                            action: function(elm, d, i) {
                                                authorTopicComparisonArray.splice(authorTopicComparisonArray.indexOf(elm.id), 1);                                            }
                                        }
                                    ];
                                    authorsContainer.append('g')
                                        .attr('id', 'legendContainer')
                                        .attr('transform', 'translate(' + (0) + ',' + (3*padding/5) + ')')
                                        .append('path')
                                        .attr('class', 'authorSymbol')
                                        .attr('stroke', 'darkgray')
                                        .attr('id', tuple.author.replace(/[\. ]+/g, ' '))
                                        .attr('d', d3.superformula().type(tuple.symbol).size(175))
                                        .attr('transform', 'translate(' + (0) + ',' + (index*2*padding/5) + ')')
                                        .on('contextmenu', d3.contextMenu(authorSymbolContextMenu, function() {
                                            d3.event.preventDefault();
                                        }));

                                    authorsContainer.append('g')
                                        .attr('id', 'nameContainer')
                                        .attr('transform', 'translate(' + (2*padding/5) + ',' + (3.2*padding/5) + ')')
                                        .append('text')
                                        .text(function() {
                                            return tuple.author;
                                        })
                                        .attr('class', 'authorLegendName')
                                        .attr('stroke', 'gray')
                                        .attr('stroke-width', '0.25')
                                        .attr('id', tuple.author.replace(/[\. ]+/g, ''))
                                        .attr('transform', 'translate(' + (0) + ',' + (index*2*padding/5) + ')');
                                });

                                    //SHOW THE AUTHORS FOR EACH SELECTED PUBLICATION
                                selectedPublications.forEach(function(selectedPublication, index) {
                                        //AXIS
                                    selectedPublication._location.container.append('rect')
                                        .attr('class', 'authorsAxis')
                                        .attr('x', (selectedPublication._location.x + publicationCircleRadius)+2)
                                        .attr('y', (selectedPublication._location.y)-publicationAxisHeight/2)
                                        .attr('height', publicationAxisHeight)
                                        .attr('width', function() {
                                            return _.size(selectedPublication._authorsArray)*(padding/2.5)+(padding/2.5);
                                        });

                                        //SYMBOLS
                                    var orderedSymbols = new Array();
                                    selectedPublication._authorsArray.sort().forEach(function(author) {
                                        var authorIndex = symboledAuthors.indexOf(author);
                                        var authorSymbol = authorSymbols[authorIndex];
                                        var temp = new Object();
                                        temp.symbol = authorSymbol;
                                        temp.author = author;
                                        orderedSymbols.push(temp);
                                    });
                                    orderedSymbols.forEach(function(symbolTuple,symbolIndex) {
                                        var flag = false;
                                        var authorSymbolContextMenu = [
                                            {
                                                title: 'Add this author for further collaboration analysis',
                                                action: function(elm, d, i) {
                                                    log(elm.id + ' added');
                                                    authorCollaborationAnalysisArray.push(elm.id);
                                                }
                                            },
                                            {
                                                title: 'Remove this author from further collaboration analysis',
                                                action: function(elm, d, i) {
                                                    authorCollaborationAnalysisArray.splice(authorCollaborationAnalysisArray.indexOf(elm.id), 1);
                                                }
                                            },
                                            {
                                                title: '----------------------------------------',
                                                action: function(elm, d, i) {

                                                }
                                            },
                                            {
                                                title: 'Add this author for further collaboration analysis',
                                                action: function(elm, d, i) {
                                                    log(elm.id);
                                                    authorCollaborationAnalysisArray.push(elm.id);
                                                }
                                            },
                                            {
                                                title: 'Remove this author from further research topic comparison',
                                                action: function(elm, d, i) {
                                                    authorTopicComparisonArray.splice(authorTopicComparisonArray.indexOf(elm.id), 1);                                            }
                                            }
                                        ];
                                        selectedPublication._location.container.append('path')
                                            .attr('d', d3.superformula().type(symbolTuple.symbol).size(175))
                                            .attr('class', 'authorSymbol')
                                            .attr('id', symbolTuple.author.replace(/[\. ]+/g, ' '))
                                            .attr('stroke', 'darkgray')
                                            .attr('fill', 'gray')
                                            .attr('transform', 'translate(' + (((selectedPublication._location.x + publicationCircleRadius)+(padding/2.5)) + symbolIndex*padding/2.5) + ',' + (2+(selectedPublication._location.y)-publicationAxisHeight/2) + ')')
                                            .on('mouseover', function() {
                                                d3.selectAll('text#'+this.id)
                                                    .attr('stroke', 'green')
                                                    .attr('stroke-width', '0.75');

                                                d3.selectAll('path#'+this.id)
                                                    .attr('fill-opacity', '1');
                                            })
                                            .on('mouseout', function() {
                                                d3.selectAll('text#'+this.id)
                                                    .attr('stroke', 'gray')
                                                    .attr('stroke-width', '0.25');

                                                d3.selectAll('path#'+this.id)
                                                    .attr('fill-opacity', '0.85');
                                            })
                                            .on('click', function() {
                                                if(!flag) {
                                                    //d3.selectAll('text#'+this.id).attr('stroke', 'green').attr('stroke-width', '0.75').attr('text-decoration', 'underline')
                                                    selectedAuthors.push(symbolTuple);
                                                    flag = true;
                                                }
                                                else {
                                                    //d3.selectAll('text#'+this.id).attr('stroke', 'gray').attr('stroke-width', '0.25').attr('text-decoration', 'none')
                                                    selectedAuthors.splice(selectedAuthors.indexOf(symbolTuple), 1);
                                                    flag = false;
                                                }
                                            })
                                            .on('contextmenu', d3.contextMenu(authorSymbolContextMenu, function() {
                                                d3.event.preventDefault();
                                            })
                                        );
                                    });
                                });


                            }
                        });

                            //CURRENT SETTING ALLOWS AUTHORS FROM MULTIPLE STAGES TO BE SELECTED
                        Object.observe(selectedAuthors, function() {
                            selectedAuthorsContainer.selectAll('*').remove().transition().ease('elastic');

                            if((_.size(selectedPublications) > 0) && (_.size(selectedAuthors) > 0)) {
                                //Legends Header
                                selectedAuthorsContainer.append('text')
                                    .text('Selected Authors')
                                    .attr('transform', 'translate(' + (0) + ',' + padding / 5 + ')')
                                    .attr('class', 'awardInfo')
                                    .attr('id', 'legendsTitle')
                                    .style('text-decoration', 'underline')
                                    .style('font-weight', 'bold')
                                    .transition()
                                    .ease('elastic')
                                    .duration(5000);

                                _.uniq(selectedAuthors, function(item) { return item. author; }).forEach(function(selectedAuthorTuple, selectedAuthorIndex) {
                                    selectedAuthorsContainer.append('g')
                                        .attr('id', 'nameContainer')
                                        .attr('transform', 'translate(' + (2*padding/5) + ',' + (3.2*padding/5) + ')')
                                        .append('text')
                                        .text(selectedAuthorTuple.author)
                                        .attr('class', 'authorLegendName')
                                        .attr('stroke', 'green')
                                        .attr('stroke-width', '0.25')
                                        .attr('transform', 'translate(' + (0) + ',' + ((selectedAuthorIndex*2*padding/5)) + ')');

                                    selectedAuthorsContainer.append('button')
                                        .text('Remove', 'button').on('click', function(selectedAuthorTuple) { log(selectedAuthorTuple.author + 'clicked'); });
                                });
                            }
                        });
                    });

                    /*///////////////////////////////////////////////////////////////////////////////*/

                    var furtherAuthorAnalysisContainer = analysisSVGContainer.append('g')
                        .attr('id', 'furtherAuthorAnalysisContainer')
                        .attr('transform', 'translate(' + 0 + ',' + (_.size(analyticsAward._relatedPublicationsList)*50*4) + ')');
                    var topicVoronoi = d3.geom.voronoi().clipExtent([0,0], [500,500]);
                    var voronoiColors = d3.scale.category10();

                    Object.observe(authorCollaborationAnalysisArray, function() {
                        furtherAuthorAnalysisContainer.attr('height', function(authorCollaborationAnalysisArray, authorTopicComparisonArray) {
                            if((_.size(authorCollaborationAnalysisArray) > 0) || (_.size(authorTopicComparisonArray) > 0)) {
                                return 20;
                            }
                            else {
                                return 500;
                            }
                        });

                        d3.select('#furtherAuthorAnalysisContainer').selectAll('*').remove().transition().ease('elastic');

                        /*furtherAuthorAnalysisContainer.selectAll('text')
                            .data(authorCollaborationAnalysisArray)
                            .enter()
                            .append('text')
                            .text(function(d,i) {
                                return d;
                            })
                            .attr('transform', function(d,i) {
                                return 'translate(' + (padding*(i+1)) + ',' + padding*(i+1) + ')';
                            })
                            .attr('id', 'waiting-text')
                            .attr('class', 'loadingMessage');*/

                        var vertices = d3.range(10).map(function(d) {
                            return [Math.random() * 500, Math.random() * 500];
                        });

                        var path = furtherAuthorAnalysisContainer.append('g').selectAll('.dualTreemap path');
                        furtherAuthorAnalysisContainer.selectAll('.dualTreemap circle')
                            .data(vertices.slice(1))
                            .enter()
                            .append('circle')
                            .attr('r',2.5)
                            .attr('transform', function(d) { return 'translate(' + d + ')'; });
                        redraw();

                        function redraw() {
                            path = path.data(voronoi(vertices), polygon);
                            path.exit()
                                .remove();
                            path.enter()
                                .append('path')
                                .attr('d', polygon)
                                .attr('fill', function(d, i) { return voronoiColors(i); })
                        };

                        function polygon(d) {
                            return 'M'+ d.join('L')+'Z';
                        }
                    });

                    Object.observe(authorTopicComparisonArray, function() {
                        furtherAuthorAnalysisContainer.attr('height', function(authorCollaborationAnalysisArray, authorTopicComparisonArray) {
                            if((_.size(authorCollaborationAnalysisArray) > 0) || (_.size(authorTopicComparisonArray) > 0)) {
                                return 20;
                            }
                            else {
                                return 500;
                            }
                        });

                        d3.select('#furtherAuthorAnalysisContainer').selectAll('*').remove().transition().ease('elastic');

                        /*furtherAuthorAnalysisContainer.selectAll('text')
                            .data(authorCollaborationAnalysisArray)
                            .enter()
                            .append('text')
                            .text(d)
                            .attr('transform', function(d,i) {
                                return 'translate(' + (padding*(i+1)) + ',' + padding*(i+1) + ')';
                            })
                            .attr('id', 'waiting-text')
                            .attr('class', 'loadingMessage');*/
                    });

                    /*///////////////////////////////////////////////////////////////////////////////*/



                    /*///////////////////////////////////////////////////////////////////////////////*/



                    /*///////////////////////////////////////////////////////////////////////////////*/



                    /*///////////////////////////////////////////////////////////////////////////////*/



                    /*///////////////////////////////////////////////////////////////////////////////*/



                    /*///////////////////////////////////////////////////////////////////////////////*/



                    /*///////////////////////////////////////////////////////////////////////////////*/



                    /*///////////////////////////////////////////////////////////////////////////////*/



                    /*///////////////////////////////////////////////////////////////////////////////*/
                }
            };

            function degrees(radians) {
                return radians / Math.PI * 180 - 90;
            }

            function filterPublications(data, setting) {
                var temp = new Array();
                data.forEach(function(item) {
                    if(item._year >= setting.publicationMinRange && item._year <= setting.publicationMaxRange) {
                        temp.push(item);
                    }
                });

                return temp;
            }

            function orderByYear(data) {
                if(_.size(data._relatedPublicationsList) > 0) {
                    //organize the publication by year
                    var publication_ordered = _.groupBy(data._relatedPublicationsList, function(publication) { return publication._year});
                    data._relatedPublicationsList = publication_ordered;

                    return data;
                }
                else if(_.size(data._relatedPublicationsList) == 0) {
                    data._error = 1;
                    data._note = "None of the publications within our current database have correlations with this award and/or criteria.";

                    return data;
                }
                else if(_.size(data._relatedPublicationsList) < 0) {
                    log('Negative number of publications?!?!?!?!?!?!?!?!?!?!?!?!')
                }
            };
        };

        return keywordExtDirective;
    }
);
