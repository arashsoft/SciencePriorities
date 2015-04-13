// IMPORTANT: we use fake database for generating matrix-link visualization (award relations are real but publication relations are based on fake tables)
// hard code awards based on their ID <= 20074 because of data problem

//added by Arman
// DEPENDENCIES
var async = require('async');
var _ = require('underscore');
var natural = require('natural');
natural.PorterStemmer.attach();
var tokenizer = new natural.WordTokenizer();
var lda = require('lda');

//GLOBAL LOG
function log(object) {
	console.log(object);
};

// semi-prototype function to check if an object is empty or not.
function isEmptyObject(obj) {
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}

exports.makeJson = function(entityName, propertyName, layoutName, callback){
	var mysql = require('mysql');
	var mysqlConf = require('./config/mysql.config');
	var connection = mysql.createConnection({
	  host : mysqlConf.HOST,
	  user : mysqlConf.USER,
	  password : mysqlConf.PASSWORD,
	  database : mysqlConf.DATABASE
	});
	connection.connect(function(err) {
		if (err) {
			console.error('error connecting to mysql');
			connection.end();
			callback("mysql connection error");
			return;
		}
		switch(entityName+"|"+ propertyName+"|"+layoutName) {
			case "Awards|Universities|barChart":
			case "Awards|Universities|pieChart":
				connection.query("select U.Short_Name as name, sum(A.Amount) as value from award as A join department as D on A.Department=D.ID join faculty as F on D.Faculty=F.ID join university as U on F.University=U.ID where A.ID <=20074 GROUP BY U.Long_Name", function(err, rows, fields) {
					connection.query("select U.Short_Name as name, sum(A.Amount) as value , D.name as department from award as A join department as D on A.Department=D.ID join faculty as F on D.Faculty=F.ID join university as U on F.University=U.ID where A.ID <=20074 GROUP BY U.Long_Name, D.name" , function (err2, rows2, fields2) {
						connection.end();
						// make childs for multi layer bar chart
						var jsonArray = new Array();
						for (var i = 0 ; i < rows.length ; i++){
							jsonArray[rows[i].name] = new Object();
							jsonArray[rows[i].name].name= rows[i].name;
							jsonArray[rows[i].name].value = rows[i].value;
							jsonArray[rows[i].name].child = new Array();
						}
						for (var i = 0 ; i < rows2.length ; i++){
							var tempChild = new Object();
							tempChild.name = rows2[i].department;
							tempChild.value = rows2[i].value;
							jsonArray[rows2[i].name].child.push(tempChild);
						}
						// convert result to accepted json format
						var jsonFile = new Array();
						for (var i = 0 ; i < rows.length ; i++){
							jsonFile.push(jsonArray[rows[i].name])
						}
						callback(jsonFile);
					});
				});
				break;
			case "Awards|Departments|barChart":
			case "Awards|Departments|pieChart":
				connection.query("select D.Name as name, sum(A.Amount) as value from award as A join department as D on A.Department=D.ID join faculty as F on D.Faculty=F.ID join university as U on F.University=U.ID where A.ID > 20074 and U.Short_Name='UWO'  GROUP BY A.Department", function(err, rows, fields) {
					connection.end();
					callback(rows);
				});
				break;
			case "Awards|Top Sponsors|barChart":
			case "Awards|Top Sponsors|pieChart":
				connection.query("select S.Name as name, sum(A.Amount) as value from award as A join program as P on A.Program = P.ID join sponsor as S on P.Sponsor = S.ID where A.ID > 20074 GROUP BY S.Name ORDER BY value DESC limit 10", function(err, rows, fields) {
					connection.end();
					callback(rows);
				});
				break;
			case "Awards|Source of funding|barChart":
			case "Awards|Source of funding|pieChart":
				connection.query("select SOF.sponsor_type as name, sum(A.Amount) as value from award as A join program as P on A.Program = P.ID join sponsor as S on P.Sponsor = S.ID join source_of_funding as SOF on S.Source=SOF.ID GROUP BY SOF.sponsor_type", function(err, rows, fields) {
					connection.end();
					callback(rows);
				});
				break;
			case "Professors|Research chair|barChart":
			case "Professors|Research chair|pieChart":
				connection.query("SELECT table1.type as name , count(*) as value FROM (select RCT.type from professor as P join research_chair as RC on P.ResearchChair = RC.ID join research_chair_type as RCT on RC.type = RCT.ID) as table1 GROUP BY type", function(err, rows, fields) {
					connection.end();
					callback(rows);
				});
				break;
			case "Professors|Department|barChart":
			case "Professors|Department|pieChart":
				connection.query("SELECT table1.type as name , count(*) as value FROM ( select D.Name as type from professor as P join department as D on P.Department_Primary=D.ID join faculty as F on D.Faculty=F.ID join university as U on F.University=U.ID where F.Name='Faculty of Science' and U.Short_Name='UWO' ) as table1 GROUP BY type", function(err, rows, fields) {
					connection.end();
					callback(rows);
				});
				break;
			case "Professors|Rank|barChart":
			case "Professors|Rank|pieChart":
				connection.query("SELECT table1.type as name , count(*) as value FROM ( select P.Rank as type from professor as P join department as D on P.Department_Primary=D.ID join faculty as F on D.Faculty=F.ID join university as U on F.University=U.ID where F.Name='Faculty of Science' and U.Short_Name='UWO' and  P.Rank != 'null' ) as table1 GROUP BY type", function(err, rows, fields) {
					connection.end();
					callback(rows);
				});
				break;
			case "Publications":
				//code block
				break;
			case "Students":
				//code block
				break;
			case "Collaboration|Node-Link|null":
			case "Collaboration|Matrix-Link|null":
				// this function runs after queries return
				function dataIsReady(data){	
					var jsonFile = new Object();
					jsonFile.nodes = data.nodes;
					jsonFile.departments = data.departments;
					
					// make hash table to convert Link IDs(node names) to their indexes
					// we have to it because of modules.force bug (it does not support node names as source and target)
					var nodeHash = new Object();
					for (var i =0; i < data.nodes.length; i++){
						nodeHash[data.nodes[i].ID] = i;
					}
					
					jsonFile.links = new Array();
					// award links
					for (var i=0 , length =data.links.length ; i < length; i++){
						var professorIDs = data.links[i].Professors.split("#");
						var departmentNames = data.links[i].Departments.split("#");
						for (var j1=0 , j1Length = professorIDs.length; j1 < j1Length; j1++){
							for (var j2= j1+1; j2 < j1Length; j2++){
								jsonFile.links.push({source: nodeHash[professorIDs[j1]],target:nodeHash[professorIDs[j2]],type:"award", linkType:(departmentNames[j1]==departmentNames[j2] ? departmentNames[j1]:0)});
							}
						}
					}
					// publication links
					for (var i=0 , length =data.publicationLinks.length ; i < length; i++){
						var professorIDs = data.publicationLinks[i].Professors.split("#");
						var departmentNames = data.publicationLinks[i].Departments.split("#");
						for (var j1=0 , j1Length = professorIDs.length; j1 < j1Length; j1++){
							for (var j2= j1+1; j2 < j1Length; j2++){
								jsonFile.links.push({source: nodeHash[professorIDs[j1]],target:nodeHash[professorIDs[j2]],type:"pub", linkType:(departmentNames[j1]==departmentNames[j2] ? departmentNames[j1]:0)});
							}
						}
					}
					
					for (var i=0 , length =data.coSupervisionLinks.length ; i < length; i++){
						var currentLink = data.coSupervisionLinks[i];
						jsonFile.links.push({source: nodeHash[currentLink.pID1], target: nodeHash[currentLink.pID2], type:"coSuper", linkType:(currentLink.pD1==currentLink.pD2? currentLink.departmentName:0) })
						
					}
					
					connection.end();
					callback(jsonFile);
				}
				// we want to run multi queries synchronously and then return their results to dataIsReady(data)
				var queryNumber = 5;
				var tempData = new Array();
				// return award links
				connection.query("SELECT ap.Grant, GROUP_CONCAT(P.ID SEPARATOR '#')  as Professors, GROUP_CONCAT(D.name SEPARATOR '#') as Departments FROM (select CONCAT(award_professor2.Grant, award_professor2.Professor) as tempColumn, award_professor2.Grant, award_professor2.Professor, award_professor2.ID from award_professor2 group by tempColumn) as ap join professor as P on P.ID= ap.Professor join department as D on P.Department_Primary=D.ID GROUP BY ap.Grant having count(ap.grant) > 1" , function (err,rows,fields){
					tempData.links = rows;
					// check if other queries already returned or not
					if (1 == queryNumber--){
						dataIsReady(tempData);
					}
				});
				
				// return publication links
				connection.query("SELECT pa.Publication, GROUP_CONCAT(P.ID SEPARATOR '#')  as Professors, GROUP_CONCAT(D.name SEPARATOR '#') as Departments FROM (select CONCAT(publication_author_profOnly.Author,'#', publication_author_profOnly.Publication) as tempColumn, publication_author_profOnly.* from publication_author_profOnly group by tempColumn) as pa join author_2_fake as a2 on a2.ID=pa.Author join professor as P on P.ID= a2.Professor_ID join department as D on P.Department_Primary=D.ID GROUP BY pa.Publication having count(pa.Publication) > 1" , function (err,rows,fields){
					tempData.publicationLinks = rows;
					// check if other queries already returned or not
					if (1 == queryNumber--){
						dataIsReady(tempData);
					}
				});
				
				// return co-supervision links
				connection.query("select p.ID as pID1,  p.Department_Primary as pD1, p2.ID as pID2, p2.Department_Primary as pD2 , d.Name as departmentName from student_fake as sf join professor as p on p.ID=sf.Supervisor1 join professor as p2 on p2.ID=sf.Supervisor2 join department as d on p.Department_Primary=d.ID where sf.Supervisor2 is not null" , function (err,rows,fields){
					tempData.coSupervisionLinks = rows;
					// check if other queries already returned or not
					if (1 == queryNumber--){
						dataIsReady(tempData);
					}
				});
				
				// TODO: add co-supervision
				// mega query!! this query makes list of active professors and takes around 5 sec on the current server machine to run
				connection.query("select P.ID as ID, concat(cast(P.Firstname as char(15)),',',cast(P.Middlename as CHAR(15)),' ',P.Lastname)  as name , D.name as department from publication_author_profOnly as pa join author_2_fake as a2f on pa.Author=a2f.ID join professor as P on P.Id=a2f.Professor_ID join department as D on D.ID = P.Department_Primary where pa.Publication in (select pa.Publication from publication_author_profOnly as pa join author_2_fake as a2f on a2f.ID=pa.Author where a2f.Professor_ID is not null group by pa.Publication having count(pa.Publication)>1) group by P.ID union select P.ID as ID, concat(cast(P.Firstname as char(15)),',',cast(P.Middlename as CHAR(15)),' ',P.Lastname)  as name , D.name as department from award_professor2 as AP2 join professor as P on P.Id=AP2.professor join department as D on D.ID = P.Department_Primary where AP2.Grant in (select multiGrants.* from (select AP.Grant from award_professor2 as AP group by AP.Grant having count(AP.Grant)>1) as multiGrants) group by AP2.Professor", function(err,rows,fields){
					tempData.nodes = rows;
					// check if other queries already returned or not
					if (1 == queryNumber--){
						dataIsReady(tempData);
					}
				});
				
				// TODO: add publication and co-supervision (I skiped publication becasue of saving time and the result is same in our fake data)
				// select department names
				connection.query("select distinct D.name as name from award_professor2 as AP2 join professor as P on P.Id=AP2.professor join department as D on D.ID = P.Department_Primary where AP2.Grant in (select multiGrants.* from (select AP.Grant from award_professor2 as AP group by AP.Grant having count(AP.Grant)>1) as multiGrants) group by AP2.Professor", function(err,rows,fields){
					tempData.departments = rows;
					// check if other queries already returned or not
					if (1 == queryNumber--){
						dataIsReady(tempData);
					}
				});
				
				break;
			case "Collaboration|Treemap|null":
			case "Correlation|Dual-Treemap|null":
				connection.query("select A.ID as id, A.Title as name, A.Amount as size, A.Abstract as abstract, A.BeginDate as beginDate, A.EndDate as endDate, D.Name as departmentName, P.Name as programName, S.Name as sponsorName from ((((award as A inner join department as D on A.Department=D.ID) inner join program as P on A.Program=P.ID) inner join sponsor as S on P.Sponsor=S.ID) inner join faculty as F on D.Faculty=F.ID) inner join university as U on F.University=U.ID where U.ID=1 and F.ID=4 and A.Amount>0 and A.BeginDate !=  '0000-00-00'", function(err, rows, fields) {
					connection.end();
					callback(rows);
				});
				/*connection.end();
				callback(new Object());*/
				break;
			default:
				connection.end();
				callback("unknown visualization request");
		}
	});
} // end of makeJson

exports.makeDynamicJson = function(type, values1, callback){
	var mysql = require('mysql');
	var mysqlConf = require('./config/mysql.config');
	var connection = mysql.createConnection({
	  host : mysqlConf.HOST,
	  user : mysqlConf.USER,
	  password : mysqlConf.PASSWORD,
	  database : mysqlConf.DATABASE
	});

	if (type == "departmentSelect"){
		connection.connect(function(err) {
			if (err) {
				console.error('error connecting to mysql');
				connection.end();
				callback("mysql connection error");
				return;
			}

			var queryText = 'SELECT p.* , d.Name as departmentName FROM professor  as p join department  as d  join faculty as f join university as u WHERE p.Department_Primary = d.ID and d.Faculty = f.ID and f.University = u.ID and u.Short_Name = "UWO" and d.Name IN (';
			for (var i=0; i < values1.length; i++){
				queryText += '"'+ values1[i] + '",'
			}
			// remove the extra comma
			queryText = queryText.substring(0, queryText.length - 1);
			// add the last ")"
			queryText += ")";
			connection.query(queryText, function(err,rows,fields){
				// run second query based on professors name (rows)
				queryText = "SELECT ap.Grant, GROUP_CONCAT(P.ID SEPARATOR '#')  as Professors, GROUP_CONCAT(D.name SEPARATOR '#') as Departments FROM (select CONCAT(award_professor2.Grant, award_professor2.Professor) as tempColumn, award_professor2.Grant, award_professor2.Professor, award_professor2.ID from award_professor2 where award_professor2.Professor in ("
				for (var i=0;i<rows.length;i++){
					queryText += rows[i].ID + ",";
				}
				queryText = queryText.substring(0, queryText.length - 1);
				queryText += ") group by tempColumn) as ap join professor as P on P.ID= ap.Professor join department as D on P.Department_Primary=D.ID GROUP BY ap.Grant having count(ap.grant) > 1";
				
				connection.query(queryText, function(err2,rows2,fields2){
					connection.end();
					var tempResult = {};
					tempResult.nodes = rows;
					tempResult.department = values1;
					tempResult.links = new Array();
					
					var tempLinks = [];
					// we have to it because of modules.force bug (it does not support node names as source and target)
					var nodeHash = new Object();
					for (var i =0; i < rows.length; i++){
						nodeHash[rows[i].ID] = i;
					}
					for (var i=0 , length =rows2.length ; i < length; i++){
						var professorIDs = rows2[i].Professors.split("#");
						var departmentNames = rows2[i].Departments.split("#");
						for (var j1=0 , j1Length = professorIDs.length; j1 < j1Length; j1++){
							for (var j2= j1+1; j2 < j1Length; j2++){
								tempLinks.push({source: nodeHash[professorIDs[j1]],target:nodeHash[professorIDs[j2]], width:1 ,type:"award", linkType:(departmentNames[j1]==departmentNames[j2] ? departmentNames[j1]:0)});
							}
						}
					}
					// remove duplicates
					var LinkObjects = new Object();
					for (var i =0, length = tempLinks.length; i < length ; i++){
						// we remove dublicate links with this method
						if (isEmptyObject(LinkObjects[tempLinks[i].source+"-"+tempLinks[i].target])){
							LinkObjects[tempLinks[i].source+"-"+tempLinks[i].target]=tempLinks[i];
						}else{
							LinkObjects[tempLinks[i].source+"-"+tempLinks[i].target].width++;
						}
					}
					
					// convert object to array
					for (var tempLink in LinkObjects){
						tempResult.links.push(LinkObjects[tempLink])
					}

					callback(tempResult);
				});
			});
		}); // end of connection.connect()
	} // end of if(type == departmentSelect)
	else if (type == "professorSelect" ){
		connection.connect(function(err) {
			if (err) {
				console.error('error connecting to mysql');
				connection.end();
				callback("mysql connection error");
				return;
			}
			var queryText = "select distinct p.*, d.Name as departmentName from professor as p join department as d on p.Department_Primary=d.ID join award_professor2 as ap on ap.Professor=p.ID where ap.`Grant` in (select award.ID as awardID from award join award_professor2 as ap2 on ap2.`Grant`= award.ID where ap2.Professor in (";
			for (var i=0; i < values1.length; i++){
				queryText += '"'+ values1[i] + '",'
			}
			queryText = queryText.substring(0, queryText.length - 1);
			queryText += "))";
			connection.query(queryText, function(err,rows,fields){
				// now we have IDs of related professors to selected professors
				// run second query based on professors IDs (rows)
				queryText = "SELECT ap.Grant, GROUP_CONCAT(P.ID SEPARATOR '#')  as Professors, GROUP_CONCAT(D.name SEPARATOR '#') as Departments FROM (select CONCAT(award_professor2.Grant, award_professor2.Professor) as tempColumn, award_professor2.Grant, award_professor2.Professor, award_professor2.ID from award_professor2 where award_professor2.Professor in ("
				for (var i=0;i<rows.length;i++){
					queryText += rows[i].ID + ",";
				}
				queryText = queryText.substring(0, queryText.length - 1);
				queryText += ") group by tempColumn) as ap join professor as P on P.ID= ap.Professor join department as D on P.Department_Primary=D.ID GROUP BY ap.Grant having count(ap.grant) > 1";
				
				connection.query(queryText, function(err2,rows2,fields2){
					// now we have links in 34#23#12#... format
					var tempResult = {};
					tempResult.nodes = rows;
					tempResult.selectedNodes = values1;
					tempResult.links = new Array();
					
					var tempLinks = [];
					// we have to it because of modules.force bug (it does not support node names as source and target)
					var nodeHash = new Object();
					for (var i =0; i < rows.length; i++){
						nodeHash[rows[i].ID] = i;
					}
					for (var i=0 , length =rows2.length ; i < length; i++){
						var professorIDs = rows2[i].Professors.split("#");
						var departmentNames = rows2[i].Departments.split("#");
						for (var j1=0 , j1Length = professorIDs.length; j1 < j1Length; j1++){
							for (var j2= j1+1; j2 < j1Length; j2++){
								tempLinks.push({source: nodeHash[professorIDs[j1]],target:nodeHash[professorIDs[j2]], width:1 ,type:"award", linkType:(departmentNames[j1]==departmentNames[j2] ? departmentNames[j1]:0)});
							}
						}
					}
					// remove duplicates
					var LinkObjects = new Object();
					for (var i =0, length = tempLinks.length; i < length ; i++){
						// we remove dublicate links with this method
						if (isEmptyObject(LinkObjects[tempLinks[i].source+"-"+tempLinks[i].target])){
							LinkObjects[tempLinks[i].source+"-"+tempLinks[i].target]=tempLinks[i];
						}else{
							LinkObjects[tempLinks[i].source+"-"+tempLinks[i].target].width++;
						}
					}
					// convert object to array
					for (var tempLink in LinkObjects){
						tempResult.links.push(LinkObjects[tempLink])
					}
					
					connection.query("select distinct D.name as department from award_professor2 as AP2 join professor as P on P.Id=AP2.professor join department as D on D.ID = P.Department_Primary where AP2.Grant in (select multiGrants.* from (select AP.Grant from award_professor2 as AP group by AP.Grant having count(AP.Grant)>1) as multiGrants) group by AP2.Professor", function(err3,rows3,fields3){
						// we want to send department names too (rows3)
						tempResult.departments = rows3;
						connection.end();
						callback(tempResult);
					
					}); // end of query 3
				}); // end of query 2
			}); // end of query 1
		}); // end of connection.connect()
	}
	else if (type == "treemapSelect"){
		connection = mysql.createConnection({
			host : mysqlConf.HOST,
			user : mysqlConf.USER,
			password : mysqlConf.PASSWORD,
			database : mysqlConf.DATABASE2
		});

		connection.connect(function(err) {
			if (err) {
				console.error('error connecting to mysql');
				connection.end();
				callback("mysql connection error");
				return;
			}

			//var queryText = "select A.ID as id, A.Title as name, A.Amount as size, A.Abstract as abstract, A.BeginDate as beginDate, A.EndDate as endDate, D.Name as departmentName, P.Name as programName, S.Name as sponsorName from ((((award as A inner join department as D on A.Department=D.ID) inner join program as P on A.Program=P.ID) inner join sponsor as S on P.Sponsor=S.ID) inner join faculty as F on D.Faculty=F.ID) inner join university as U on F.University=U.ID where U.ID=1 and F.ID=4 and A.Amount>0 and A.BeginDate != '0000-00-00' and A.BeginDate >= '"
			var queryText = "select A.ID as id, A.Title as name, A.Amount as size, A.Abstract as abstract, A.BeginDate as beginDate, A.EndDate as endDate, D.Name as departmentName, P.Name as programName, S.Name as sponsorName from ((((((award_2 as A inner join award_professor as AP on A.ID=AP.Grant) inner join professor as PR on AP.Professor=PR.ID) inner join department as D on PR.Department_Primary=D.ID) inner join program as P on A.Program=P.ID) inner join sponsor as S on P.Sponsor=S.ID) inner join faculty as F on D.Faculty=F.ID) inner join university as U on F.University=U.ID where U.ID=1 and F.ID=4 and A.Amount>0 and A.BeginDate != '0000-00-00' and A.BeginDate >= '"
				 + values1.awardMinRange + "-00-00' and A.EndDate <= '"
				 + values1.awardMaxRange + "-00-00' and A.Amount >= "
				 + values1.awardMinAmount + " and A.Amount <= "
				+ values1.awardMaxAmount;

			connection.query(queryText, function(err,rows){
				connection.end();
				callback(rows);
			});
		}); // end of connection.connect()
	}
	else if (type == "awardAnalysisSelect"){
		connection = mysql.createConnection({
			host : mysqlConf.HOST,
			user : mysqlConf.USER,
			password : mysqlConf.PASSWORD,
			database : mysqlConf.DATABASE2
		});

		var algorithms = ['Algorithm1', 'Algorithm2', 'Algorithm3'];
		var algorithm_selection = '';

		switch(values1.setting.model) {
			case 'Very Relaxed':
				algorithm_selection = algorithms[0];
				break;
			case 'Relaxed':
				algorithm_selection = algorithms[1];
				break;
			case 'Specific':
				algorithm_selection = algorithms[2];
				break;
			default:
				break;
		};

		award_relationship_extractor(values1.selectedAwardID, [], [], values1.setting.publicationMinRange, values1.setting.publicationMaxRange, algorithm_selection, values1.setting.author, values1.setting.aggregation, values1.setting.keyword, values1.setting.topicNumber, values1.setting.termNumber, values1.setting.confidence, function(result){
			callback(result);
		});
	}
	else if (type === 'publicationsSelect') {
		connection = mysql.createConnection({
			host : mysqlConf.HOST,
			user : mysqlConf.USER,
			password : mysqlConf.PASSWORD,
			database : mysqlConf.DATABASE2
		});

		connection.connect(function(err) {
			if (err) {
				console.error('error connecting to mysql');
				connection.end();
				callback("mysql connection error");
				return;
			}

			var queryText = "select publication_author_2.Publication as publicationID, publication_author_2.Author as authorID, publication_2.Year as publicationYear, author_2.Fullname as authorFullName from ((publication_author_2 inner join publication_2 on publication_author_2.Publication=publication_2.ID) inner join author_2 on author_2.ID=publication_author_2.Author) where publication_author_2.Publication in (";
			for (var i=0; i < values1.length; i++){
				queryText += values1[i] + ","
			}
			// remove the extra comma
			queryText = queryText.substring(0, queryText.length - 1);
			// add the last ")"
			queryText += ") order by publicationYear, publicationID, authorFullName";
			log(queryText);
			connection.query(queryText, function(err,rows){
				connection.end();
				callback(rows);
			});
		}); // end of connection.connect()
	}
	else{
		// unknown visualization
		callback("unknown visualization request");
	}
} // end of makeDynamicJson


//Arman's analytics functions

function award_relationship_extractor(proposal_ID, keyword_filter_array, name_filter_array, begin_date, end_date, algorithm_selection, author_correlation, aggregation, keyword_correlation, number_topics, number_keywords, threshold , myfunction){
	//GLOBAL VARIABLES
	var _stopWords=['', 'a','able','about','above','abroad','according','accordingly','across','actually','adj','after','afterwards','again','against','ago','ahead','aint','all','allow','allows','almost','alone','along','alongside','already','also','although','always','am','amid','amidst','among','amongst','an','and','another','any','anybody','anyhow','anyone','anything','anyway','anyways','anywhere','apart','appear','appreciate','appropriate','are','arent','around','as','as','aside','ask','asking','associated','at','available','away','awfully','b','back','backward','backwards','be','became','because','become','becomes','becoming','been','before','beforehand','begin','behind','being','believe','below','beside','besides','best','better','between','beyond','both','brief','but','by','c','came','can','cannot','cant','cant','caption','cause','causes','certain','certainly','changes','clearly','cmon','co','co.','com','come','comes','concerning','consequently','consider','considering','contain','containing','contains','corresponding','could','couldnt','course','cs','currently','d','dare','darent','definitely','described','despite','did','didnt','different','directly','do','does','doesnt','doing','done','dont','down','downwards','during','e','each','edu','eg','eight','eighty','either','else','elsewhere','end','ending','enough','entirely','especially','et','etc','even','ever','evermore','every','everybody','everyone','everything','everywhere','ex','exactly','example','except','f','fairly','far','farther','few','fewer','fifth','first','five','followed','following','follows','for','forever','former','formerly','forth','forward','found','four','from','further','furthermore','g','get','gets','getting','given','gives','go','goes','going','gone','got','gotten','greetings','h','had','hadnt','half','happens','hardly','has','hasnt','have','havent','having','he','hed','hell','hello','help','hence','her','here','hereafter','hereby','herein','heres','hereupon','hers','herself','hes','hi','him','himself','his','hither','hopefully','how','howbeit','however','hundred','i','id','ie','if','ignored','ill','im','immediate','in','inasmuch','inc','inc.','indeed','indicate','indicated','indicates','inner','inside','insofar','instead','into','inward','is','isnt','it','itd','itll','its','its','itself','ive','j','just','k','keep','keeps','kept','know','known','knows','l','last','lately','later','latter','latterly','least','less','lest','let','lets','like','liked','likely','likewise','little','look','looking','looks','low','lower','ltd','m','made','mainly','make','makes','many','may','maybe','maynt','me','mean','meantime','meanwhile','merely','might','mightnt','mine','minus','miss','more','moreover','most','mostly','mr','mrs','much','must','mustnt','my','myself','n','name','namely','nd','near','nearly','necessary','need','neednt','needs','neither','never','neverf','neverless','nevertheless','new','next','nine','ninety','no','nobody','non','none','nonetheless','noone','no-one','nor','normally','not','nothing','notwithstanding','novel','now','nowhere','o','obviously','of','off','often','oh','ok','okay','old','on','once','one','ones','ones','only','onto','opposite','or','other','others','otherwise','ought','oughtnt','our','ours','ourselves','out','outside','over','overall','own','p','particular','particularly','past','per','perhaps','placed','please','plus','possible','presumably','probably','provided','provides','q','que','quite','qv','r','rather','rd','re','really','reasonably','recent','recently','regarding','regardless','regards','relatively','respectively','right','round','s','said','same','saw','say','saying','says','second','secondly','see','seeing','seem','seemed','seeming','seems','seen','self','selves','sensible','sent','serious','seriously','seven','several','shall','shant','she','shed','shell','shes','should','shouldnt','since','six','so','some','somebody','someday','somehow','someone','something','sometime','sometimes','somewhat','somewhere','soon','sorry','specified','specify','specifying','still','sub','such','sup','sure','t','take','taken','taking','tell','tends','th','than','thank','thanks','thanx','that','thatll','thats','thats','thatve','the','their','theirs','them','themselves','then','thence','there','thereafter','thereby','thered','therefore','therein','therell','therere','theres','theres','thereupon','thereve','these','they','theyd','theyll','theyre','theyve','thing','things','think','third','thirty','this','thorough','thoroughly','those','though','three','through','throughout','thru','thus','till','to','together','too','took','toward','towards','tried','tries','truly','try','trying','ts','twice','two','u','un','under','underneath','undoing','unfortunately','unless','unlike','unlikely','until','unto','up','upon','upwards','us','use','used','useful','uses','using','usually','v','value','various','versus','very','via','viz','vs','w','want','wants','was','wasnt','way','we','wed','welcome','well','well','went','were','were','werent','weve','what','whatever','whatll','whats','whatve','when','whence','whenever','where','whereafter','whereas','whereby','wherein','wheres','whereupon','wherever','whether','which','whichever','while','whilst','whither','who','whod','whoever','whole','wholl','whom','whomever','whos','whose','why','will','willing','wish','with','within','without','wonder','wont','would','wouldnt','x','y','yes','yet','you','youd','youll','your','youre','yours','yourself','yourselves','youve','z','zero'];
	var _MIN1 = 2.5,
		_MIN2 = 5,
		_MAX = 50;

	var mysql = require('mysql');
	var mysqlConf = require('./config/mysql.config');
	var pool  = mysql.createPool({
		host : mysqlConf.HOST,
		user : mysqlConf.USER,
		port : mysqlConf.PORT,
		password : mysqlConf.PASSWORD,
		database : mysqlConf.DATABASE2,
		connectionLimit: 500
	});

	var analyzed_award = new Object();
	analyzed_award._id = "analyzed_award ".concat(proposal_ID);
	analyzed_award._awardProposal = -1;
	analyzed_award._awardID = proposal_ID;
	analyzed_award._awardStatus = "";
	analyzed_award._awardBeginDate = "";
	analyzed_award._awardEndDate = "";
	analyzed_award._error = 0;
	analyzed_award._note = "";
	analyzed_award._title = "";
	analyzed_award._keyword = "";
	analyzed_award._abstract = "";

	var professor_ID_list = new Array();
	var uniq_professor_ID_list = new Array();

	async.series([
			//unify parameters
			function(callback) {
				name_filter_array = _.uniq(name_filter_array);
				keyword_filter_array = _.uniq(keyword_filter_array);

				callback();
			},

			//retrieve award information
			function(callback) {
				if(analyzed_award._error) {
					myfunction(analyzed_award);
					return;
				}
				else {
					var query_text = "SELECT * FROM award_2 WHERE ID=".concat(analyzed_award._awardID);

					pool.query(query_text, function(err, result) {
						if(err) {
							console.log(err);

							analyzed_award._error = 1;
							analyzed_award._note = err;
						}
						else {
							analyzed_award._title = result[0].Title;
							analyzed_award._keyword = result[0].Keyword;
							analyzed_award._abstract = result[0].Abstract;
							analyzed_award._awardStatus = result[0].AwardStatus;
							analyzed_award._awardBeginDate = result[0].BeginDate;
							analyzed_award._awardEndDate = result[0].EndDate;
							analyzed_award._amount= result[0].Amount;
							analyzed_award._awardKeywords = new Array();
						}

						callback();
					});
				}
			},

			//extract keywords for award from title and abstract
			function(callback) {
				if(analyzed_award._error) {
					myfunction(analyzed_award);
					return;
				}
				else {
					//tokenize, stem and remove stop words
					var _titleTokenized = tokenizer.tokenize(analyzed_award._title.toLowerCase());
					var _keywordTokenized = "";
					if(analyzed_award._keyword != null) {
						_keywordTokenized = tokenizer.tokenize(analyzed_award._keyword.toLowerCase());
					}
					var _abstractTokenized = "";
					if(analyzed_award._abstract != null) {
						_abstractTokenized = tokenizer.tokenize(analyzed_award._abstract.toLowerCase());
					}
					var _extractedKeywords = _.uniq(_titleTokenized.concat(_keywordTokenized.concat(_abstractTokenized)));

					var _awardKeywords = _.reject(_extractedKeywords, function(word) { return (filterItems(word.toLowerCase(), _stopWords)) });
					_awardKeywords = _.reject(_extractedKeywords, function(word) { return (isNumber(word.toLowerCase())) });
					_awardKeywords = _.reject(_extractedKeywords, function(word) { return (word === '') });

					analyzed_award._awardKeywords = _awardKeywords.sort(function(a, b) { return b.length - a.length});

					callback();
				}
			},

			//extract keywords and topics for award
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					//extract keywords
					//tokenize, stem and remove stop words
					var _titleTokenized = tokenizer.tokenize(analyzed_award._title.toLowerCase());
					var _keywordTokenized = "";
					if(analyzed_award._keyword != null) {
						_keywordTokenized = tokenizer.tokenize(analyzed_award._keyword.toLowerCase());
					}
					var _extractedKeywords = _.uniq(_titleTokenized.concat(_keywordTokenized));
					var _extractedKeywordsStopWordsRemoved = _.reject(_extractedKeywords, function(word) {
						return filterItems(word.toLowerCase(), _stopWords)
					});
					_extractedKeywordsStopWordsRemoved.forEach(function(word) {
						word = word.toLowerCase();
					});
					analyzed_award._awardKeywords = _.uniq(_extractedKeywordsStopWordsRemoved);

					//extract topics using lda
					var award_lda_text = analyzed_award._title.concat(".").concat(analyzed_award._keyword).concat(".");
					var award_lda_documents = award_lda_text.match( /[^\.!\?]+[\.!\?]+/g );
					var award_lda_result = lda(award_lda_documents, number_topics, number_keywords);
					award_lda_result.forEach(function(topic) {
						topic.forEach(function(tuple) {
							tuple.flag = false;
						});
					});
					analyzed_award._ldaResult = award_lda_result;

					_.delay(function() {
						callback();
					}, 100);
				}
			},

			//initialize the object and retrieve the investigators
			function(callback) {
				if(analyzed_award._error) {
					myfunction(analyzed_award);
					return ;
				}
				else {
					analyzed_award._note = "Accepted";
					analyzed_award._investigatorsList = new Array();
					analyzed_award._relatedPublicationsList = new Array();
					analyzed_award._rejectedPublicationList = new Array();
					analyzed_award._coAuthorsList = new Array();
					analyzed_award._inactiveCoAuthorsList = new Array();
					analyzed_award._addedKeywordsList = new Array();
					analyzed_award._inactiveKeywordsList = new Array();

					var query_text = "SELECT Professor, Principal FROM award_professor_2 WHERE `Grant`=".concat(analyzed_award._awardID);

					pool.query(query_text, function(err, result) {
						if(err) {
							console.log(err);

							analyzed_award._error = 1;
							analyzed_award._note = err;
						}
						else {
							result.forEach(function(record) {
								var temp = new Object();
								temp._professorID = record.Professor;
								temp._principal = record.Principal;
								analyzed_award._investigatorsList.push(temp);
							});
						}

						callback();
					});
				}
			},

			//retrieve the publications for the investigator(s)
			function(callback) {
				if(analyzed_award._error) {
					myfunction(analyzed_award);
					return ;
				}
				else {
					if(_.size(analyzed_award._investigatorsList) < 1) {
						console.log("******************************************HUGE ERROR******************************************");
						console.log("*************************************************************************************************");
						analyzed_award._error = 1;
						analyzed_award._note = "No investigators were associated with this award proposal in the database.";
					}
					else {
						if(author_correlation === 'Primary') {
							var query_values = "(";
							var principal_count = 0;
							analyzed_award._investigatorsList.forEach(function(investigator) {
								if(investigator._principal) {
									query_values = query_values.concat(investigator._professorID);
									principal_count++;
								}
							});
							if(principal_count > 1) {
								log("******************************************HUGE ERROR******************************************");
								log("*************************************************************************************************");
								log('More than 1 principal for ' + analyzed_award._id);
								analyzed_award._error = 1;
								analyzed_award._note = "Database error!";
							}
							query_values = query_values.concat(")");

							var query_text = "SELECT DISTINCT publication_author_2.Publication, publication_author_2.Author, author_2.Professor_ID, publication_2.Year, publication_2.Title, publication_2.AuthorKeywords, publication_2.IndexKeywords"
								+" FROM (publication_author_2 INNER JOIN author_2 ON publication_author_2.Author=author_2.ID) INNER JOIN publication_2 ON publication_2.ID=publication_author_2.Publication"
								+" WHERE publication_2.Year>=".concat(begin_date).concat(" AND publication_2.Year<=").concat(end_date).concat(" AND author_2.Professor_ID in ").concat(query_values);

							pool.query(query_text, function(err, result) {
								if(err) {
									console.log(err);

									analyzed_award._error = 1;
									analyzed_award._note = err;
								}
								else {
									if(_.size(result) > 0) {
										result.forEach(function(record) {
											if((record.Year >= begin_date) && (record.Year <= end_date)) {
												var temp = new Object();
												temp._publicationID = record.Publication;
												temp._year = record.Year;
												temp._title = record.Title;
												temp._authorKeywords = record.AuthorKeywords;
												temp._indexKeywords = record.IndexKeywords;
												temp._authors = new Array();
												temp._radius1 = 0;
												temp._radius2 = 0;
												temp._radius = 0;
												temp._active = true;
												temp._selected = false;
												temp._location = new Object();

												analyzed_award._relatedPublicationsList.push(temp);
											}
										});
									}
									else {
										analyzed_award._error = 1;
										analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
									}
								}

								callback();
							});
						}
						else if(author_correlation === 'All') {
							var query_values = "(";
							var principal_count = 0;
							analyzed_award._investigatorsList.forEach(function(investigator) {
								if(investigator._principal) {
									principal_count++;
								}
								query_values = query_values.concat(investigator._professorID).concat(',');
							});
							if(principal_count > 1) {
								log("******************************************HUGE ERROR******************************************");
								log("*************************************************************************************************");
								log('More than 1 principal for ' + analyzed_award._id);
								analyzed_award._error = 1;
								analyzed_award._note = "Database error!";
							}
							query_values = query_values.substring(0, query_values.length-1);
							query_values = query_values.concat(")");

							var query_text = "SELECT DISTINCT publication_author_2.Publication, publication_author_2.Author, author_2.Professor_ID, publication_2.Year, publication_2.Title, publication_2.AuthorKeywords, publication_2.IndexKeywords"
								+" FROM (publication_author_2 INNER JOIN author_2 ON publication_author_2.Author=author_2.ID) INNER JOIN publication_2 ON publication_2.ID=publication_author_2.Publication"
								+" WHERE publication_2.Year>=".concat(begin_date).concat(" AND publication_2.Year<=").concat(end_date).concat(" AND author_2.Professor_ID in ").concat(query_values);

							pool.query(query_text, function(err, result) {
								if(err) {
									console.log(err);

									analyzed_award._error = 1;
									analyzed_award._note = err;
								}
								else {
									if(_.size(result) > 0) {
										result.forEach(function(record) {
											if((record.Year >= begin_date) && (record.Year <= end_date)) {
												var temp = new Object();
												temp._publicationID = record.Publication;
												temp._year = record.Year;
												temp._title = record.Title;
												temp._authorKeywords = record.AuthorKeywords;
												temp._indexKeywords = record.IndexKeywords;
												temp._authors = new Array();
												temp._radius1 = 0;
												temp._radius2 = 0;
												temp._radius = 0;
												temp._active = true;
												temp._selected = false;
												temp._location = new Object();

												analyzed_award._relatedPublicationsList.push(temp);
											}
										});
									}
									else {
										analyzed_award._error = 1;
										analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
									}
								}

								callback();
							});
						}
						else {
							console.log("******************************************HUGE ERROR******************************************");
							console.log("*************************************************************************************************");
							analyzed_award._error = 1;
							analyzed_award._note = "Wrong entry for the author_correlation!!!   " + author_correlation;
						}
					}
				}
			},

			//check if we still have any other publications
			//find professor details for the authors of publications if they exist
			function(callback) {
				if(analyzed_award._error) {
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(analyzed_award._relatedPublicationsList) > 0) {
						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							var query_text = "SELECT Author, Fullname, Professor_ID FROM publication_author_2 INNER JOIN author_2 ON publication_author_2.Author = author_2.ID WHERE Publication ="
								.concat(publication._publicationID);

							pool.query(query_text, function(err, result) {
								if(err) {
									console.log(err);
									analyzed_award._error = 1;
									analyzed_award._note = err;
								}
								else {
									if(_.size(result) > 0) {
										result.forEach(function(record) {
											var temp = new Object();
											temp._authorID = record.Author;
											temp._fullName = record.Fullname;
											temp._professorID = record.Professor_ID;
											temp._role = "non-investigator";
											publication._authors.push(temp);
										});
									}
									else {
										analyzed_award._error = 1;
										analyzed_award._note = "The investigators listed for this proposal have no publication record in our database.";
									}
								}
							});
						});
						_.delay(function() {
							callback();
						}, 250);
					}
					else {
						analyzed_award._error = 1;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
					}
				}
			},

			//check authors for being investigators
			function(callback) {
				if(analyzed_award._error) {
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(analyzed_award._relatedPublicationsList) > 0) {
						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							publication._authors.forEach(function(author) {
								if(author._professorID != null) {
									var state = checkInvestigator(author._professorID, analyzed_award._investigatorsList);
									if(state._flag == true) {
										if(state._principal == 0) {
											author._role = "co-investigator";
										}
										else if(state._principal == 1) {
											author._role = "principal-investigator";
										}
									}
								}
							});
						});

						callback();
					}
					else {
						analyzed_award._error = 1;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
					}
				}
			},

			//calculate radius1
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}

				if(_.size(analyzed_award._relatedPublicationsList) > 0) {
					analyzed_award._relatedPublicationsList.forEach(function(publication) {
						var flag = false;
						var count = 0;

						publication._authors.forEach(function(author) {
							if(author._role == "principal-investigator") {
								flag = true;
							}
							if(author._role == "co-investigator") {
								count++;
							}
						});

						if(author_correlation == 'Primary') {
							if(flag) {
								publication._radius1 = _MAX;
							}
							else {
								publication._radius1 = _MIN1;
							}
						}
						else if(author_correlation == 'All') {
							if(flag) {
								//publication._radius1 = ((count+2)/(_.size(publication._authors)+1))*50;
								publication._radius1 = (_MAX + (count/_.size(publication._authors)-1)*50)/2;
							}
							else {
								//publication._radius1 = ((count)/(_.size(publication._authors)+1))*50;
								publication._radius1 = (count/_.size(publication._authors)-1)*50;
							}
						}
					});
				}
				else {
					analyzed_award._error = 1;
					analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
				}

				callback();
			},

			//extract keywords for publications
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(analyzed_award._relatedPublicationsList) > 0) {
						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							//tokenize, stem and remove stop words
							var _titleTokenized = tokenizer.tokenize(publication._title);
							var _authorKeywordTokenized = tokenizer.tokenize(publication._authorKeywords);
							var _indexKeywordTokenized = tokenizer.tokenize(publication._indexKeywords);
							var _extractedKeywords = _.uniq(_titleTokenized.concat(_authorKeywordTokenized.concat(_indexKeywordTokenized)));
							var _extractedKeywordsStopWordsRemoved = _.reject(_extractedKeywords, function(word) { return (filterItems(word.toLowerCase(), _stopWords)) });

							publication._keywords = _extractedKeywordsStopWordsRemoved;
						});

						callback();
					}
					else {
						analyzed_award._error = 1;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
					}
				}
			},

			//filter publications based on "name_filter_array"
			function(callback) {
				//	(.) set the _active flag to false for the publication that has a specific co-author
				//	(.) these publications will be removed later on
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(name_filter_array) > 0) {
						if(_.size(analyzed_award._relatedPublicationsList) > 0) {
							analyzed_award._relatedPublicationsList.forEach(function(publication) {
								name_filter_array.forEach(function(name) {
									publication._authors.forEach(function(author) {
										if(name == author._fullName) {
											publication._active = false;
											analyzed_award._inactiveCoAuthorsList.push(name);
										}
									});
								});
							});
							_.delay(function() {
								callback();
							}, 100);
						}
						else {
							analyzed_award._error = 1;
							analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
						}
					}
					else {
						callback();
					}
				}
			},

			//filter publications based on "keyword_filter_array"
			function(callback) {
				//	(.) set the _active flag to false for the publication that has a specific keyword
				//	(.) these publications will be removed later on
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(keyword_filter_array) > 0) {
						if(_.size(analyzed_award._relatedPublicationsList) > 0) {
							analyzed_award._relatedPublicationsList.forEach(function(publication) {
								keyword_filter_array.forEach(function(word) {
									if(_.size(publication._keywords) > 0) {
										publication._keywords.forEach(function(keyword) {
											if(word == keyword) {
												publication._active = false;
												analyzed_award._inactiveKeywordsList.push(word);
											}
										});
									}
								});
							});

							_.delay(function() {
								callback();
							}, 100);
						}
						else {
							analyzed_award._error = 1;
							analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
						}
					}
					else {
						callback();
					}
				}
			},

			//just wait!
			function(callback) {
				_.delay(function() {
					callback();
				}, 100);
			},

			//filter publications with !publication._active
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(analyzed_award._relatedPublicationsList) > 0) {
						var temp = new Array();
						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							if(publication._active) {
								temp.push(publication);
							}
							else {
								analyzed_award._rejectedPublicationList.push(publication);
							}
						});

						analyzed_award._relatedPublicationsList.splice(0, _.size(analyzed_award._relatedPublicationsList));
						analyzed_award._relatedPublicationsList = temp;

						_.delay(function() {
							callback();
						}, 100);
					}
					else {
						analyzed_award._error = 1;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
					}
				}
			},

			//check if we still have any other publications
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(analyzed_award._relatedPublicationsList) < 1) {
						analyzed_award._error = 1;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
						analyzed_award._inactiveKeywordsList = keyword_filter_array;
						var temp_list = new Array();
						_.uniq(name_filter_array).forEach(function(name) {
							var temp = new Object();
							temp.name = name;
							temp.frequency = 0;
							temp_list.push(temp);
						});
						analyzed_award._coAuthorsList = temp_list;
						analyzed_award._inactiveCoAuthorsList = temp_list;
						myfunction(analyzed_award);
						return;
					}
				}

				callback();
			},

			//create addedKeywordsList and sort
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(analyzed_award._relatedPublicationsList) > 0) {
						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							if(_.size(publication._keywords) > 0) {
								publication._keywords.forEach(function(keyword) {
									if(publication._active) {
										var temp = new Object();
										temp.word = keyword.toLowerCase();
										temp.frequency = 0
										analyzed_award._addedKeywordsList.push(temp);
									}
									else {
										console.log("--------> HOW COME?!");
									}
								});
							}
						});
						_.delay(function() {}, 100);

						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							if(_.size(publication._keywords) > 0) {
								publication._keywords.forEach(function(keyword) {
									analyzed_award._addedKeywordsList.forEach(function(keyword_tuple) {
										if(keyword_tuple.word == keyword) {
											keyword_tuple.frequency++;
										}
									});
								});
							}
						});
						_.delay(function() {}, 100);

						var temp = _.filter(analyzed_award._addedKeywordsList, function(keyword_item) {
							var flag = false;
							flag = ((_.isNumber(keyword_item.word)) || (_.isNumber(Number(keyword_item.word))) || (_.isNumber(parseInt(keyword_item.word))));
							return flag;
						});
						_.delay(function() {}, 100);

						//unify addedKeywordsList and add up the frequencies
						var uniqAddedKeywordsList = new Array();
						var uniqKeywords = _.uniq(_.pluck(analyzed_award._addedKeywordsList, 'word'));

						uniqKeywords.forEach(function(word) {
							var temp = new Object();
							temp.word = word;
							temp.frequency = 0;
							uniqAddedKeywordsList.push(temp);
						});

						uniqAddedKeywordsList.forEach(function(uniq_keyword) {
							analyzed_award._addedKeywordsList.forEach(function(keyword_tuple) {
								if(uniq_keyword.word == keyword_tuple.word) {
									uniq_keyword.frequency += keyword_tuple.frequency;
								}
							});
						});

						analyzed_award._addedKeywordsList = uniqAddedKeywordsList;

						//sort added by Arash to have the keywords ordered
						analyzed_award._addedKeywordsList.sort(function(a,b) {return a.frequency - b.frequency;});

						callback();
					}
					else {
						analyzed_award._error = 1;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
					}
				}
			},

			//calculate radius2
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(algorithm_selection == "Algorithm1") {
						//the "Exploration" algorithm
						//	(.) returns all the possible matches of publications for the group of investigators
						//	(.) allows the user to explore the cross-referenced publications
						//	(.) for the publications that have no keywords matched, returns _MIN1 as _radius2
						//	(.) for the publications that have some keywords matched, calculates _radius2 according to keyword_correlation
						if(_.size(analyzed_award._relatedPublicationsList) > 0) {
							analyzed_award._relatedPublicationsList.forEach(function(publication) {
								var match_count = 0;

								if((_.size(publication._keywords) > 0) && (publication._active)) {
									publication._keywords.forEach(function(publication_keyword) {
										analyzed_award._awardKeywords.forEach(function(award_keyword) {
											if((publication_keyword.toLowerCase() == award_keyword.toLowerCase()) ||
												(natural.PorterStemmer.stem(publication_keyword.toLowerCase()) == natural.PorterStemmer.stem(award_keyword.toLowerCase()))) {
												match_count++;
											}
										});
									});
								}

								var weight = ((match_count) / (Math.min(_.size(publication._keywords), _.size(analyzed_award._awardKeywords))));

								//if no keyword match exists
								if(weight <= 0) {
									publication._radius2 = _MIN1;
								}
								else {
									if(keyword_correlation === 'Linear') {
										//// ***SIMPLE LINEAR THRESHOLDING***
										if(weight >= (threshold)) {
											publication._radius2 = weight * 50;
										}
										else {
											publication._radius2 = _MIN2;
										}
									}
									else if(keyword_correlation === 'Sigmoid') {
										//// ***SIGMOID THRESHOLDING***
										var temp = 50 * ((2 * (1.01 - (threshold))) * sigmoid(weight - (threshold)));
										publication._radius2 = (temp > 50) ? 50 : temp;
									}
									else {
										console.log("******************************************HUGE ERROR******************************************");
										console.log("*************************************************************************************************");
										analyzed_award._error = 1;
										analyzed_award._note = "Wrong entry for the keyword_correlation!!!   " + keyword_correlation;
									}

								}
							});

							callback();
						}
						else {
							analyzed_award._error = 1;
							analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";

							callback();
						}

					}
					else if(algorithm_selection == "Algorithm2") {
						//the "Keyword Matching" algorithm
						//	(.) calculates _radius2 according to keyword_correlation
						if(_.size(analyzed_award._relatedPublicationsList) > 0) {
							analyzed_award._relatedPublicationsList.forEach(function(publication) {
								var match_count = 0;

								if((_.size(publication._keywords) > 0) && (publication._active)) {
									publication._keywords.forEach(function(publication_keyword) {
										analyzed_award._awardKeywords.forEach(function(award_keyword) {
											if((publication_keyword.toLowerCase() == award_keyword.toLowerCase()) ||
												(natural.PorterStemmer.stem(publication_keyword.toLowerCase()) == natural.PorterStemmer.stem(award_keyword.toLowerCase()))) {
												match_count++;
											}
										});
									});
								}

								var weight = ((match_count) / (Math.min(_.size(publication._keywords), _.size(analyzed_award._awardKeywords))));

								//if no keyword match exists
								if(match_count == 0) {
									publication._active = false;
								}
								else {
									if(weight <= 0) {
										publication._radius2 = 0;
									}
									else if(weight > 0) {
										if(keyword_correlation === 'Linear') {
											//// ***SIMPLE LINEAR THRESHOLDING***
											if(weight >= threshold) {
												publication._radius2 = weight * 50;
											}
											else {
												publication._radius2 = _MIN2;
											}
										}
										else if(keyword_correlation === 'Sigmoid') {
											//// ***SIGMOID THRESHOLDING***
											var temp = 50 * ((2 * (1.01 - (4*threshold))) * sigmoid(weight - (4*threshold)));
											publication._radius2 = (temp > 50) ? 50 : temp;
										}
										else {
											console.log("******************************************HUGE ERROR******************************************");
											console.log("*************************************************************************************************");
											analyzed_award._error = 1;
											analyzed_award._note = "Wrong entry for the keyword_correlation!!!   " + keyword_correlation;
										}

									}
								}
							});

							callback();
						}
						else {
							analyzed_award._error = 1;
							analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";

							callback();
						}
					}
					else if(algorithm_selection == "Algorithm3") {
						//the "Topic Modelling" algorithm
						//	(.) extracts topics for each publication
						//	(.) performs a cross referencing on the topics for the award and the topics extracted for each publication and returns a weight(i.e. _radius2) accordingly
						if(_.size(analyzed_award._relatedPublicationsList) > 0) {
							analyzed_award._relatedPublicationsList.forEach(function(publication) {
								if(publication._active) {
									//use lda to extract topics for each publication
									var publication_lda_text = publication._title.concat(".");
									if(_.size(publication._keywords) > 0) {
										var keywordsListed = ".";
										publication._keywords.forEach(function(keyword) {
											keywordsListed = keywordsListed.concat(keyword).concat(".");
										});
										publication_lda_text = publication_lda_text.concat(keywordsListed).concat(".");
									}
									_.delay(function() {}, 100);
									var publication_lda_documents = publication_lda_text.match( /[^\.!\?]+[\.!\?]+/g );
									var publication_lda_result = lda(publication_lda_documents, number_topics, number_keywords);

									publication._ldaResult = publication_lda_result;
								}
							});

							analyzed_award._relatedPublicationsList.forEach(function(publication) {
								if(publication._active) {
									publication._ldaResult.forEach(function(topic) {
										topic.forEach(function(tuple) {
											tuple.flag = false;
										});
									});
								}
							});

							//// CURRENTLY WE ONLY USE THE FIRST TOPIC
							if(_.size(analyzed_award._ldaResult) > 0) {
								analyzed_award._ldaResult.forEach(function (awardLdaTopic, topicIndex){
									//var match_count = 0;
									analyzed_award._relatedPublicationsList.forEach(function(publication) {
										if((_.size(publication._ldaResult) > 0) && (publication._active)) {
											awardLdaTopic.forEach(function(award_tuple) {
												publication._ldaResult[topicIndex].forEach(function(publication_tuple) {
													if(award_tuple.term == publication_tuple.term) {
														award_tuple.flag = true;
														publication_tuple.flag = true;
													}
												});
											});

											//calculate the summation of probabilities for this topic of the award
											var award_total_probability = 0;
											awardLdaTopic.forEach(function(award_tuple) {
												award_total_probability += award_tuple.probability;
											});

											//calculate the summation of probabilities for this topic of the publication
											var publication_total_probability = 0;
											publication._ldaResult[topicIndex].forEach(function(publication_tuple) {
												publication_total_probability += publication_tuple.probability;
											});

											//calculate the summation of matched probabilities for this topic of the award
											var award_matched_probability = 0;
											awardLdaTopic.forEach(function(award_tuple) {
												if(award_tuple.flag) {
													award_matched_probability += award_tuple.probability;
												}
											});

											// TODO NOT SURE IF THIS MIGHT BE OF ANY USE LATER, SO MAYBE FIND ONE!
											awardLdaTopic.totalProbability = award_matched_probability/ _.size(awardLdaTopic);

											//calculate the summation of matched probabilities for this topic of the publication
											var publication_matched_probability = 0;
											publication._ldaResult[topicIndex].forEach(function(publication_tuple) {
												if(publication_tuple.flag) {
													publication_matched_probability += publication_tuple.probability;
												}
											});
											publication._ldaResult[topicIndex].totalProbability = publication_matched_probability/ _.size(publication._ldaResult[topicIndex]);

											//// TODO: WE ARE CURRENTLY USING THE GEOMETRIC MEAN, BUT MIGHT ADD OTHER TYPES OF MEAN LATER (arithmetic, harmonic, etc)
											////	MAX SHOULD BE = 50 * 1, WHERE ALL TOPICS ARE MATCHED IN BOTH
											if((award_matched_probability > 0) && (publication_matched_probability > 0)) {
												publication._radius2 = 50 * Math.sqrt((award_matched_probability / award_total_probability) * (publication_matched_probability / publication_total_probability));
											}
											else {
												publication._radius2 = _MIN1;
												publication.active = false;
											}

										}
										else {
											publication._radius2 = _MIN1;
											publication._active = false;
										}
									});
								});
							}
							else {
								analyzed_award._error = 1;
								analyzed_award._note = "No topics could be extracted for the selected award.";
								analyzed_award._relatedPublicationsList.forEach(function(publication) {
									publication._active = false;
								});
							}

							callback();
						}
						else {
							analyzed_award._error = 1;
							analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";

							callback();
						}

					}
					else {
						console.log("******************************************HUGE ERROR******************************************");
						console.log("*************************************************************************************************");
						analyzed_award._error = 1;
						analyzed_award._note = "Wrong entry for the algorithm!!!   " + algorithm_selection;
					}
				}
			},

			//calculate radius
			function(callback) {
				if(analyzed_award._error){
					console.log("Analyzed award has an error: " + analyzed_award._note);
					myfunction(analyzed_award);
					return;
				}
				else {
					if((aggregation != 'Uniform') && aggregation != 'Weighted') {
						console.log("******************************************HUGE ERROR******************************************");
						console.log("*************************************************************************************************");
						analyzed_award._error = 1;
						analyzed_award._note = "Wrong entry for the aggregation!!!   " + aggregation;
					}
					else {
						if(_.size(analyzed_award._relatedPublicationsList) > 0) {
							analyzed_award._relatedPublicationsList.forEach(function(publication) {
								if(aggregation == 'Uniform') {
									//UNIFORM/SIMPLE ARITHMETIC MEAN
									publication._radius = (publication._radius1 + publication._radius2)/100;
								}
								else if(aggregation == 'Weighted') {
									//WEIGHTED ARITHMETIC MEAN
									var author_count = _.size(publication._authors);
									var keywords_count = _.size(publication._keywords);

									var weight1 = author_count / (author_count + keywords_count);
									var weight2 = keywords_count / (author_count + keywords_count);

									publication._radius = (weight1 * publication._radius1/50) + (weight2 * publication._radius2/50);
								}
							});
						}
						else {
							analyzed_award._error = 1;
							analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
						}
					}

					callback();
				}
			},

			//filter publications with !publication._active
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(analyzed_award._relatedPublicationsList) > 0) {
						var temp = new Array();
						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							if(publication._active) {
								temp.push(publication);
							}
							else {
								analyzed_award._rejectedPublicationList.push(publication);
							}
						});

						analyzed_award._relatedPublicationsList.splice(0, _.size(analyzed_award._relatedPublicationsList));
						analyzed_award._relatedPublicationsList = temp;

						_.delay(function() {
							callback();
						}, 100);
					}
					else {
						analyzed_award._error = 1;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
					}
				}
			},

			//check if we still have any other publications
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(analyzed_award._relatedPublicationsList) < 1) {
						analyzed_award._error = 1;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
						analyzed_award._inactiveKeywordsList = keyword_filter_array;
						var temp_list = new Array();
						_.uniq(name_filter_array).forEach(function(name) {
							var temp = new Object();
							temp.name = name;
							temp.frequency = 0;
							temp_list.push(temp);
						});
						analyzed_award._coAuthorsList = temp_list;
						analyzed_award._inactiveCoAuthorsList = temp_list;
						myfunction(analyzed_award);
						return;
					}
				}

				callback();
			},

			//create final list of co-authors
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					var coAuthorNames = new Array();
					var coAuthorList = new Array();

					if(_.size(analyzed_award._relatedPublicationsList) > 0) {
						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							if(publication._active) {
								publication._authors.forEach(function(author) {
									coAuthorNames.push(author._fullName);
								});
							}
							else {
								console.log("--------> HOW COME?!");
							}
						});

						coAuthorNames = _.uniq(coAuthorNames);
						coAuthorNames.forEach(function(name) {
							var temp = new Object();
							temp.name = name;
							temp.frequency = 0;
							coAuthorList.push(temp);
						});
						_.delay(function() {}, 100);

						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							if(publication._active) {
								publication._authors.forEach(function(author) {
									coAuthorList.forEach(function(coAuthor) {
										if(author._fullName == coAuthor.name) {
											coAuthor.frequency++;
										}
									});
								});
							}
							else {
								console.log("--------> HOW COME?!");
							}
						});

						var tempCoAuthorList = _.uniq(analyzed_award._inactiveCoAuthorsList);
						var inactiveCoAuthorList = new Array();
						tempCoAuthorList.forEach(function(tempCoAuthor) {
							var temp = new Object();
							temp.name = tempCoAuthor;
							temp.frequency = 0;
							inactiveCoAuthorList.push(temp);
						});
						analyzed_award._coAuthorsList = coAuthorList.concat(inactiveCoAuthorList);
						analyzed_award._inactiveCoAuthorsList = inactiveCoAuthorList;

						analyzed_award._coAuthorsList.sort(function(a,b) {return a.frequency - b.frequency;});

						_.delay(function() {
							callback();
						}, 100);
					}
					else {
						analyzed_award._error = 1;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
					}
				}
			},

			//unify _inactiveKeywordsList and add to the end of addedKeywordsList
			function(callback) {
				analyzed_award._inactiveKeywordsList = _.uniq(analyzed_award._inactiveKeywordsList);

				callback();
			},

			//create a list of authors for each publication
			function(callback) {
				analyzed_award._relatedPublicationsList.forEach(function (publication) {
					if(publication._radius < 0) {
						publication._radius = 0.001;
					}

					var list_of_authors = new Array();
					publication._authors.forEach(function (author) {
						list_of_authors.push(author._fullName);
					});
					publication._authorsArray = list_of_authors;
				});

				callback();
			}
		],
		function(err, results) {
			if(analyzed_award._error){
				pool.end(function (err) {});
				myfunction(analyzed_award);
				return;
			}

			if(err) {
				pool.end(function (err) {});
				console.log(err);
				analyzed_award._error = 1;
				analyzed_award._note = "Async.js error";
				myfunction(analyzed_award);
				return;
			}
			else {
				pool.end(function (err) {});
				myfunction(analyzed_award);
				return;
			}
		});
}

function award_relationship_extractor2(proposal_ID, keyword_filter_array, name_filter_array, begin_date, end_date, algorithm_selection, author_correlation, aggregation, keyword_correlation, number_topics, number_keywords, threshold , myfunction){
	//GLOBAL VARIABLES
	var _stopWords=['', 'a','able','about','above','abroad','according','accordingly','across','actually','adj','after','afterwards','again','against','ago','ahead','aint','all','allow','allows','almost','alone','along','alongside','already','also','although','always','am','amid','amidst','among','amongst','an','and','another','any','anybody','anyhow','anyone','anything','anyway','anyways','anywhere','apart','appear','appreciate','appropriate','are','arent','around','as','as','aside','ask','asking','associated','at','available','away','awfully','b','back','backward','backwards','be','became','because','become','becomes','becoming','been','before','beforehand','begin','behind','being','believe','below','beside','besides','best','better','between','beyond','both','brief','but','by','c','came','can','cannot','cant','cant','caption','cause','causes','certain','certainly','changes','clearly','cmon','co','co.','com','come','comes','concerning','consequently','consider','considering','contain','containing','contains','corresponding','could','couldnt','course','cs','currently','d','dare','darent','definitely','described','despite','did','didnt','different','directly','do','does','doesnt','doing','done','dont','down','downwards','during','e','each','edu','eg','eight','eighty','either','else','elsewhere','end','ending','enough','entirely','especially','et','etc','even','ever','evermore','every','everybody','everyone','everything','everywhere','ex','exactly','example','except','f','fairly','far','farther','few','fewer','fifth','first','five','followed','following','follows','for','forever','former','formerly','forth','forward','found','four','from','further','furthermore','g','get','gets','getting','given','gives','go','goes','going','gone','got','gotten','greetings','h','had','hadnt','half','happens','hardly','has','hasnt','have','havent','having','he','hed','hell','hello','help','hence','her','here','hereafter','hereby','herein','heres','hereupon','hers','herself','hes','hi','him','himself','his','hither','hopefully','how','howbeit','however','hundred','i','id','ie','if','ignored','ill','im','immediate','in','inasmuch','inc','inc.','indeed','indicate','indicated','indicates','inner','inside','insofar','instead','into','inward','is','isnt','it','itd','itll','its','its','itself','ive','j','just','k','keep','keeps','kept','know','known','knows','l','last','lately','later','latter','latterly','least','less','lest','let','lets','like','liked','likely','likewise','little','look','looking','looks','low','lower','ltd','m','made','mainly','make','makes','many','may','maybe','maynt','me','mean','meantime','meanwhile','merely','might','mightnt','mine','minus','miss','more','moreover','most','mostly','mr','mrs','much','must','mustnt','my','myself','n','name','namely','nd','near','nearly','necessary','need','neednt','needs','neither','never','neverf','neverless','nevertheless','new','next','nine','ninety','no','nobody','non','none','nonetheless','noone','no-one','nor','normally','not','nothing','notwithstanding','novel','now','nowhere','o','obviously','of','off','often','oh','ok','okay','old','on','once','one','ones','ones','only','onto','opposite','or','other','others','otherwise','ought','oughtnt','our','ours','ourselves','out','outside','over','overall','own','p','particular','particularly','past','per','perhaps','placed','please','plus','possible','presumably','probably','provided','provides','q','que','quite','qv','r','rather','rd','re','really','reasonably','recent','recently','regarding','regardless','regards','relatively','respectively','right','round','s','said','same','saw','say','saying','says','second','secondly','see','seeing','seem','seemed','seeming','seems','seen','self','selves','sensible','sent','serious','seriously','seven','several','shall','shant','she','shed','shell','shes','should','shouldnt','since','six','so','some','somebody','someday','somehow','someone','something','sometime','sometimes','somewhat','somewhere','soon','sorry','specified','specify','specifying','still','sub','such','sup','sure','t','take','taken','taking','tell','tends','th','than','thank','thanks','thanx','that','thatll','thats','thats','thatve','the','their','theirs','them','themselves','then','thence','there','thereafter','thereby','thered','therefore','therein','therell','therere','theres','theres','thereupon','thereve','these','they','theyd','theyll','theyre','theyve','thing','things','think','third','thirty','this','thorough','thoroughly','those','though','three','through','throughout','thru','thus','till','to','together','too','took','toward','towards','tried','tries','truly','try','trying','ts','twice','two','u','un','under','underneath','undoing','unfortunately','unless','unlike','unlikely','until','unto','up','upon','upwards','us','use','used','useful','uses','using','usually','v','value','various','versus','very','via','viz','vs','w','want','wants','was','wasnt','way','we','wed','welcome','well','well','went','were','were','werent','weve','what','whatever','whatll','whats','whatve','when','whence','whenever','where','whereafter','whereas','whereby','wherein','wheres','whereupon','wherever','whether','which','whichever','while','whilst','whither','who','whod','whoever','whole','wholl','whom','whomever','whos','whose','why','will','willing','wish','with','within','without','wonder','wont','would','wouldnt','x','y','yes','yet','you','youd','youll','your','youre','yours','yourself','yourselves','youve','z','zero'];
	var _MIN1 = 2.5,
		_MIN2 = 5,
		_MAX = 50;

	var mysql = require('mysql');
	var mysqlConf = require('./config/mysql.config');
	var pool  = mysql.createPool({
		host : mysqlConf.HOST,
		user : mysqlConf.USER,
		port : mysqlConf.PORT,
		password : mysqlConf.PASSWORD,
		database : mysqlConf.DATABASE2
	});

	var analyzed_award = new Object();
	analyzed_award._id = "analyzed_award ".concat(proposal_ID);
	analyzed_award._awardProposal = -1;
	analyzed_award._awardID = proposal_ID;
	analyzed_award._awardStatus = "";
	analyzed_award._awardBeginDate = "";
	analyzed_award._awardEndDate = "";
	analyzed_award._error = 0;
	analyzed_award._note = "";
	analyzed_award._title = "";
	analyzed_award._keyword = "";
	analyzed_award._abstract = "";

	var professor_ID_list = new Array();
	var uniq_professor_ID_list = new Array();

	async.series([
			//unify parameters
			function(callback) {
				name_filter_array = _.uniq(name_filter_array);
				keyword_filter_array = _.uniq(keyword_filter_array);

				callback();
			},

			//retrieve award information
			function(callback) {
				if(analyzed_award._error) {
					myfunction(analyzed_award);
					return;
				}
				else {
					var query_text = "SELECT * FROM award_2 WHERE ID=".concat(analyzed_award._awardID);

					pool.query(query_text, function(err, result) {
						if(err) {
							console.log(err);

							analyzed_award._error = 1;
							analyzed_award._note = err;
						}
						else {
							analyzed_award._title = result[0].Title;
							analyzed_award._keyword = result[0].Keyword;
							analyzed_award._abstract = result[0].Abstract;
							analyzed_award._awardStatus = result[0].AwardStatus;
							analyzed_award._awardBeginDate = result[0].BeginDate;
							analyzed_award._awardEndDate = result[0].EndDate;
							analyzed_award._amount= result[0].Amount;
							analyzed_award._awardKeywords = new Array();
						}

						callback();
					});
				}
			},

			//extract keywords for award from title and abstract
			function(callback) {
				if(analyzed_award._error) {
					myfunction(analyzed_award);
					return;
				}
				else {
					//tokenize, stem and remove stop words
					var _titleTokenized = tokenizer.tokenize(analyzed_award._title.toLowerCase());
					var _keywordTokenized = "";
					if(analyzed_award._keyword != null) {
						_keywordTokenized = tokenizer.tokenize(analyzed_award._keyword.toLowerCase());
					}
					var _abstractTokenized = "";
					if(analyzed_award._abstract != null) {
						_abstractTokenized = tokenizer.tokenize(analyzed_award._abstract.toLowerCase());
					}
					var _extractedKeywords = _.uniq(_titleTokenized.concat(_keywordTokenized.concat(_abstractTokenized)));

					var _awardKeywords = _.reject(_extractedKeywords, function(word) { return (filterItems(word.toLowerCase(), _stopWords)) });
					_awardKeywords = _.reject(_extractedKeywords, function(word) { return (isNumber(word.toLowerCase())) });
					_awardKeywords = _.reject(_extractedKeywords, function(word) { return (word === '') });

					analyzed_award._awardKeywords = _awardKeywords.sort(function(a, b) { return b.length - a.length});

					callback();
				}
			},

			//extract keywords and topics for award
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					//extract keywords
					//tokenize, stem and remove stop words
					var _titleTokenized = tokenizer.tokenize(analyzed_award._title.toLowerCase());
					var _keywordTokenized = "";
					if(analyzed_award._keyword != null) {
						_keywordTokenized = tokenizer.tokenize(analyzed_award._keyword.toLowerCase());
					}
					var _extractedKeywords = _.uniq(_titleTokenized.concat(_keywordTokenized));
					var _extractedKeywordsStopWordsRemoved = _.reject(_extractedKeywords, function(word) {
						return filterItems(word.toLowerCase(), _stopWords)
					});
					_extractedKeywordsStopWordsRemoved.forEach(function(word) {
						word = word.toLowerCase();
					});
					analyzed_award._awardKeywords = _.uniq(_extractedKeywordsStopWordsRemoved);

					//extract topics using lda
					var award_lda_text = analyzed_award._title.concat(".").concat(analyzed_award._keyword).concat(".");
					var award_lda_documents = award_lda_text.match( /[^\.!\?]+[\.!\?]+/g );
					var award_lda_result = lda(award_lda_documents, number_topics, number_keywords);
					award_lda_result.forEach(function(topic) {
						topic.forEach(function(tuple) {
							tuple.flag = false;
						});
					});
					analyzed_award._ldaResult = award_lda_result;

					_.delay(function() {
						callback();
					}, 100);
				}
			},

			//initialize the object and retrieve the investigators
			function(callback) {
				if(analyzed_award._error) {
					myfunction(analyzed_award);
					return ;
				}
				else {
					analyzed_award._note = "Accepted";
					analyzed_award._investigatorsList = new Array();
					analyzed_award._relatedPublicationsList = new Array();
					analyzed_award._rejectedPublicationList = new Array();
					analyzed_award._coAuthorsList = new Array();
					analyzed_award._inactiveCoAuthorsList = new Array();
					analyzed_award._addedKeywordsList = new Array();
					analyzed_award._inactiveKeywordsList = new Array();

					var query_text = "SELECT Professor, Principal FROM award_professor_2 WHERE `Grant`=".concat(analyzed_award._awardID);

					pool.query(query_text, function(err, result) {
						if(err) {
							console.log(err);

							analyzed_award._error = 1;
							analyzed_award._note = err;
						}
						else {
							result.forEach(function(record) {
								var temp = new Object();
								temp._professorID = record.Professor;
								temp._principal = record.Principal;
								analyzed_award._investigatorsList.push(temp);
							});
						}

						callback();
					});
				}
			},

			//retrieve the publications for the investigator(s)
			function(callback) {
				if(analyzed_award._error) {
					myfunction(analyzed_award);
					return ;
				}
				else {
					if(_.size(analyzed_award._investigatorsList) < 1) {
						console.log("******************************************HUGE ERROR 1******************************************");
						console.log("*************************************************************************************************");
						analyzed_award._error = 1;
						analyzed_award._note = "No investigators were associated with this award proposal in the database.";
					}
					else if(_.size(analyzed_award._investigatorsList) == 1) {
						var investigator = analyzed_award._investigatorsList[0];

						var query_text = "SELECT DISTINCT publication_author_2.Publication, publication_author_2.Author, author_2.Professor_ID, publication_2.Year, publication_2.Title, publication_2.AuthorKeywords, publication_2.IndexKeywords"
							+" FROM (publication_author_2 INNER JOIN author_2 ON publication_author_2.Author=author_2.ID) INNER JOIN publication_2 ON publication_2.ID=publication_author_2.Publication"
							+" WHERE publication_2.Year>=".concat(begin_date).concat(" AND publication_2.Year<=").concat(end_date).concat(" AND author_2.Professor_ID =").concat(investigator._professorID);


						pool.query(query_text, function(err, result) {
							if(err) {
								console.log(err);

								analyzed_award._error = 1;
								analyzed_award._note = err;
							}
							else {
								if(_.size(result) > 0) {
									result.forEach(function(record) {
										if((record.Year >= begin_date) && (record.Year <= end_date)) {
											var temp = new Object();
											temp._publicationID = record.Publication;
											temp._year = record.Year;
											temp._title = record.Title;
											temp._authorKeywords = record.AuthorKeywords;
											temp._indexKeywords = record.IndexKeywords;
											temp._authors = new Array();
											temp._radius1 = 0;
											temp._radius2 = 0;
											temp._radius = 0;
											temp._active = true;

											analyzed_award._relatedPublicationsList.push(temp);
										}
									});
								}
								else {
									analyzed_award._error = 1;
									analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
								}
							}

							callback();
						});
					}
					else if(_.size(analyzed_award._investigatorsList) > 1) {
						var query_values = "";

						analyzed_award._investigatorsList.forEach(function(investigator) {
							query_values = query_values.concat(investigator._professorID).concat(" OR author_2.Professor_ID=");
						});
						query_values = query_values.substring(0, query_values.length - 26);


						var query_text = "SELECT DISTINCT publication_author_2.Publication, publication_author_2.Author, author_2.Professor_ID, publication_2.Year, publication_2.Title, publication_2.AuthorKeywords, publication_2.IndexKeywords"
							+" FROM (publication_author_2 INNER JOIN author_2 ON publication_author_2.Author=author_2.ID) INNER JOIN publication_2 ON publication_2.ID=publication_author_2.Publication"
							+" WHERE publication_2.Year>=".concat(begin_date).concat(" AND publication_2.Year<=").concat(end_date).concat(" AND author_2.Professor_ID =").concat(query_values);

						pool.query(query_text, function(err, result) {
							if(err) {
								console.log(err);

								analyzed_award._error = 1;
								analyzed_award._note = err;
							}
							else {
								if(_.size(result) > 0) {
									result.forEach(function(record) {
										if((record.Year >= begin_date) && (record.Year <= end_date)) {
											var temp = new Object();
											temp._publicationID = record.Publication;
											temp._year = record.Year;
											temp._title = record.Title;
											temp._authorKeywords = record.AuthorKeywords;
											temp._indexKeywords = record.IndexKeywords;
											temp._authors = new Array();
											temp._radius1 = 0;
											temp._radius2 = 0;
											temp._radius = 0;
											temp._active = true;

											analyzed_award._relatedPublicationsList.push(temp);
										}
									});
								}
								else {
									analyzed_award._error = 1;
									analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
								}
							}

							callback();
						});
					}
				}
			},

			//check if we still have any other publications
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(analyzed_award._relatedPublicationsList) == 0) {
						analyzed_award._error = 0;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
						myfunction(analyzed_award);
						return;
					}
				}

				callback();
			},

			//find professor details for the authors of publications
			function(callback) {
				if(analyzed_award._error) {
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(analyzed_award._relatedPublicationsList) > 0) {
						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							var query_text = "SELECT Author, Fullname, Professor_ID FROM publication_author_2 INNER JOIN author_2 ON publication_author_2.Author = author_2.ID WHERE Publication ="
								.concat(publication._publicationID);

							pool.query(query_text, function(err, result) {
								if(err) {
									console.log(err);
									analyzed_award._error = 1;
									analyzed_award._note = err;
								}
								else {
									if(_.size(result) > 0) {
										result.forEach(function(record) {
											var temp = new Object();
											temp._authorID = record.Author;
											temp._fullName = record.Fullname;
											temp._professorID = record.Professor_ID;
											temp._role = "non-investigator";
											publication._authors.push(temp);
										});
									}
									else {
										analyzed_award._error = 1;
										analyzed_award._note = "The investigators listed for this proposal have no publication record in our database.";
									}
								}
							});
						});
						_.delay(function() {
							callback();
						}, 250);
					}
					else {
						analyzed_award._error = 1;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
					}
				}
			},

			//check authors for being investigators
			function(callback) {
				if(analyzed_award._error) {
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(analyzed_award._relatedPublicationsList) > 0) {
						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							publication._authors.forEach(function(author) {
								if(author._professorID != null) {
									var state = checkInvestigator(author._professorID, analyzed_award._investigatorsList);
									if(state._flag == true) {
										if(state._principal == 0) {
											author._role = "co-investigator";
										}
										else if(state._principal == 1) {
											author._role = "principal-investigator";
										}
									}
								}
							});
						});

						callback();
					}
					else {
						analyzed_award._error = 1;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
					}
				}
			},

			//calculate radius1
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}

				if((author_correlation != 'Primary') && (author_correlation != 'All')) {
					console.log("******************************************HUGE ERROR 2******************************************");
					console.log("*************************************************************************************************");
					analyzed_award._error = 1;
					analyzed_award._note = "Wrong entry for the author_correlation!!!   " + author_correlation;
				}
				else {
					if(_.size(analyzed_award._relatedPublicationsList) > 0) {
						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							var flag = false;
							var count = 0;

							publication._authors.forEach(function(author) {
								if(author._role == "principal-investigator") {
									flag = true;
								}
								if(author._role == "co-investigator") {
									count++;
								}
							});

							if(author_correlation == 'Primary') {
								if(flag) {
									publication._radius1 = _MAX;
								}
								else {
									publication._radius1 = _MIN1;
								}
							}
							else if(author_correlation == 'All') {
								if(flag) {
									publication._radius1 = ((count+2)/(_.size(publication._authors)+1))*50;
								}
								else {
									publication._radius1 = ((count)/(_.size(publication._authors)+1))*50;
								}
							}
						});
					}
					else {
						analyzed_award._error = 1;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
					}
				}

				callback();
			},

			//extract keywords for publications
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(analyzed_award._relatedPublicationsList) > 0) {
						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							//tokenize, stem and remove stop words
							var _titleTokenized = tokenizer.tokenize(publication._title);
							var _authorKeywordTokenized = tokenizer.tokenize(publication._authorKeywords);
							var _indexKeywordTokenized = tokenizer.tokenize(publication._indexKeywords);
							var _extractedKeywords = _.uniq(_titleTokenized.concat(_authorKeywordTokenized.concat(_indexKeywordTokenized)));
							var _extractedKeywordsStopWordsRemoved = _.reject(_extractedKeywords, function(word) { return (filterItems(word.toLowerCase(), _stopWords)) });

							publication._keywords = _extractedKeywordsStopWordsRemoved;
						});

						callback();
					}
					else {
						analyzed_award._error = 1;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
					}
				}
			},

			//filter publications based on "name_filter_array"
			function(callback) {
				//	(.) set the _active flag to false for the publication that has a specific co-author
				//	(.) these publications will be removed later on
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(name_filter_array) > 0) {
						if(_.size(analyzed_award._relatedPublicationsList) > 0) {
							analyzed_award._relatedPublicationsList.forEach(function(publication) {
								name_filter_array.forEach(function(name) {
									publication._authors.forEach(function(author) {
										if(name == author._fullName) {
											publication._active = false;
											analyzed_award._inactiveCoAuthorsList.push(name);
										}
									});
								});
							});
							_.delay(function() {
								callback();
							}, 100);
						}
						else {
							analyzed_award._error = 1;
							analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
						}
					}
					else {
						callback();
					}
				}
			},

			//filter publications based on "keyword_filter_array"
			function(callback) {
				//	(.) set the _active flag to false for the publication that has a specific keyword
				//	(.) these publications will be removed later on
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(keyword_filter_array) > 0) {
						if(_.size(analyzed_award._relatedPublicationsList) > 0) {
							analyzed_award._relatedPublicationsList.forEach(function(publication) {
								keyword_filter_array.forEach(function(word) {
									if(_.size(publication._keywords) > 0) {
										publication._keywords.forEach(function(keyword) {
											if(word == keyword) {
												publication._active = false;
												analyzed_award._inactiveKeywordsList.push(word);
											}
										});
									}
								});
							});

							_.delay(function() {
								callback();
							}, 100);
						}
						else {
							analyzed_award._error = 1;
							analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
						}
					}
					else {
						callback();
					}
				}
			},

			//just wait!
			function(callback) {
				_.delay(function() {
					callback();
				}, 100);
			},

			//filter publications with !publication._active
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(analyzed_award._relatedPublicationsList) > 0) {
						var temp = new Array();
						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							if(publication._active) {
								temp.push(publication);
							}
							else {
								analyzed_award._rejectedPublicationList.push(publication);
							}
						});

						analyzed_award._relatedPublicationsList.splice(0, _.size(analyzed_award._relatedPublicationsList));
						analyzed_award._relatedPublicationsList = temp;

						_.delay(function() {
							callback();
						}, 100);
					}
					else {
						analyzed_award._error = 1;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
					}
				}
			},

			//check if we still have any other publications
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(analyzed_award._relatedPublicationsList) < 1) {
						analyzed_award._error = 0;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
						analyzed_award._inactiveKeywordsList = keyword_filter_array;
						var temp_list = new Array();
						_.uniq(name_filter_array).forEach(function(name) {
							var temp = new Object();
							temp.name = name;
							temp.frequency = 0;
							temp_list.push(temp);
						});
						analyzed_award._coAuthorsList = temp_list;
						analyzed_award._inactiveCoAuthorsList = temp_list;
						myfunction(analyzed_award);
						return;
					}
				}

				callback();
			},

			//create addedKeywordsList and sort
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(analyzed_award._relatedPublicationsList) > 0) {
						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							if(_.size(publication._keywords) > 0) {
								publication._keywords.forEach(function(keyword) {
									if(publication._active) {
										var temp = new Object();
										temp.word = keyword.toLowerCase();
										temp.frequency = 0
										analyzed_award._addedKeywordsList.push(temp);
									}
									else {
										console.log("--------> HOW COME?!");
									}
								});
							}
						});
						_.delay(function() {}, 100);

						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							if(_.size(publication._keywords) > 0) {
								publication._keywords.forEach(function(keyword) {
									analyzed_award._addedKeywordsList.forEach(function(keyword_tuple) {
										if(keyword_tuple.word == keyword) {
											keyword_tuple.frequency++;
										}
									});
								});
							}
						});
						_.delay(function() {}, 100);

						var temp = _.filter(analyzed_award._addedKeywordsList, function(keyword_item) {
							var flag = false;
							flag = ((_.isNumber(keyword_item.word)) || (_.isNumber(Number(keyword_item.word))) || (_.isNumber(parseInt(keyword_item.word))));
							return flag;
						});
						_.delay(function() {}, 100);

						//unify addedKeywordsList and add up the frequencies
						var uniqAddedKeywordsList = new Array();
						var uniqKeywords = _.uniq(_.pluck(analyzed_award._addedKeywordsList, 'word'));

						uniqKeywords.forEach(function(word) {
							var temp = new Object();
							temp.word = word;
							temp.frequency = 0;
							uniqAddedKeywordsList.push(temp);
						});

						uniqAddedKeywordsList.forEach(function(uniq_keyword) {
							analyzed_award._addedKeywordsList.forEach(function(keyword_tuple) {
								if(uniq_keyword.word == keyword_tuple.word) {
									uniq_keyword.frequency += keyword_tuple.frequency;
								}
							});
						});

						analyzed_award._addedKeywordsList = uniqAddedKeywordsList;

						//sort added by Arash to have the keywords ordered
						analyzed_award._addedKeywordsList.sort(function(a,b) {return a.frequency - b.frequency;});

						callback();
					}
					else {
						analyzed_award._error = 1;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
					}
				}
			},

			//calculate radius2
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(algorithm_selection == "Algorithm1") {
						//the "Exploration" algorithm
						//	(.) returns all the possible matches of publications for the group of investigators
						//	(.) allows the user to explor the cross-referenced publications
						//	(.) for the publications that have no keywords matched, returns _MIN1 as _radius2
						//	(.) for the publications that have some keywords matched, calculates _radius2 according to keyword_correlation
						if(_.size(analyzed_award._relatedPublicationsList) > 0) {
							analyzed_award._relatedPublicationsList.forEach(function(publication) {
								var match_count = 0;

								if((_.size(publication._keywords) > 0) && (publication._active)) {
									publication._keywords.forEach(function(publication_keyword) {
										analyzed_award._awardKeywords.forEach(function(award_keyword) {
											if((publication_keyword.toLowerCase() == award_keyword.toLowerCase()) ||
												(natural.PorterStemmer.stem(publication_keyword.toLowerCase()) == natural.PorterStemmer.stem(award_keyword.toLowerCase()))) {
												match_count++;
											}
										});
									});
								}

								var weight = ((match_count) / (Math.min(_.size(publication._keywords), _.size(analyzed_award._awardKeywords))));

								//if no keyword match exists
								if(weight <= 0) {
									publication._radius2 = _MIN1;
									publication._radius1 = _MIN1;
								}
								else {
									if(keyword_correlation == 0) {
										//// ***SIMPLE LINEAR THRESHOLDING***
										if(weight >= (4*threshold)) {
											publication._radius2 = weight * 50;
										}
										else {
											publication._radius2 = _MIN2;
											publication._radius1 = _MIN2;
										}
									}
									else if(keyword_correlation == 1) {
										//// ***SIGMOID THRESHOLDING***
										var temp = 50 * ((2 * (1.01 - (4*threshold))) * sigmoid(weight - (4*threshold)));
										publication._radius2 = (temp > 50) ? 50 : temp;
									}

								}
							});

							callback();
						}
						else {
							analyzed_award._error = 1;
							analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";


							callback();
							/*myfunction(analyzed_award);
							 return;*/
						}

					}
					else if(algorithm_selection == "Algorithm2") {
						//the "Keyword Matching" algorithm
						//	(.) calculates _radius2 according to keyword_correlation
						if(_.size(analyzed_award._relatedPublicationsList) > 0) {
							analyzed_award._relatedPublicationsList.forEach(function(publication) {
								var match_count = 0;

								if((_.size(publication._keywords) > 0) && (publication._active)) {
									publication._keywords.forEach(function(publication_keyword) {
										analyzed_award._awardKeywords.forEach(function(award_keyword) {
											if((publication_keyword.toLowerCase() == award_keyword.toLowerCase()) ||
												(natural.PorterStemmer.stem(publication_keyword.toLowerCase()) == natural.PorterStemmer.stem(award_keyword.toLowerCase()))) {
												match_count++;
											}
										});
									});
								}

								var weight = ((match_count) / (Math.min(_.size(publication._keywords), _.size(analyzed_award._awardKeywords))));

								//if no keyword match exists
								if(weight <= 0) {
									publication._radius2 = 0;
									publication._radius1 = _MIN1;
								}
								else {
									if(keyword_correlation == 0) {
										//// ***SIMPLE LINEAR THRESHOLDING***
										if(weight >= threshold) {
											publication._radius2 = weight * 50;
										}
										else {
											publication._radius2 = _MIN2;
											publication._radius1 = _MIN2;
										}
									}
									else if(keyword_correlation == 1) {
										//// ***SIGMOID THRESHOLDING***
										var temp = 50 * ((2 * (1.01 - (4*threshold))) * sigmoid(weight - (4*threshold)));
										publication._radius2 = (temp > 50) ? 50 : temp;
									}

								}
							});

							callback();
						}
						else {
							analyzed_award._error = 1;
							analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";

							callback();
							/*myfunction(analyzed_award);
							 return;*/
						}
					}
					else if(algorithm_selection == "Algorithm3") {
						//the "Topic Modelling" algorithm
						//	(.) extracts topics for each publication
						//	(.) performs a cross referencing on the topics for the award and the topics extracted for each publication and returns a weight(i.e. _radius2) accordingly
						if(_.size(analyzed_award._relatedPublicationsList) > 0) {
							analyzed_award._relatedPublicationsList.forEach(function(publication) {
								if(publication._active) {
									//use lda to extract topics for each publication
									var publication_lda_text = publication._title.concat(".");
									if(_.size(publication._keywords) > 0) {
										var keywordsListed = ".";
										publication._keywords.forEach(function(keyword) {
											keywordsListed = keywordsListed.concat(keyword).concat(".");
										});
										publication_lda_text = publication_lda_text.concat(keywordsListed).concat(".");
									}
									_.delay(function() {}, 100);
									var publication_lda_documents = publication_lda_text.match( /[^\.!\?]+[\.!\?]+/g );
									var publication_lda_result = lda(publication_lda_documents, number_topics, number_keywords);

									publication._ldaResult = publication_lda_result;
								}
							});

							analyzed_award._relatedPublicationsList.forEach(function(publication) {
								if(publication._active) {
									publication._ldaResult.forEach(function(topic) {
										topic.forEach(function(tuple) {
											tuple.flag = false;
										});
									});
								}
							});

							var match_count = 0;

							//// CURRENTLY WE ONLY USE THE FIRST TOPIC
							if(_.size(analyzed_award._ldaResult) > 0) {
								analyzed_award._relatedPublicationsList.forEach(function(publication) {
									if((_.size(publication._ldaResult) > 0) && (publication._active)) {
										analyzed_award._ldaResult[0].forEach(function(award_tuple) {
											publication._ldaResult[0].forEach(function(publication_tuple) {
												if(award_tuple.term == publication_tuple.term) {
													award_tuple.flag = true;
													publication_tuple.flag = true;
												}
											});
										});

										//calculate the summation of probabilities for this topic of the award
										var award_total_probability = 0;
										analyzed_award._ldaResult[0].forEach(function(award_tuple) {
											award_total_probability += award_tuple.probability;
										});

										//calculate the summation of probabilities for this topic of the publication
										var publication_total_probability = 0;
										publication._ldaResult[0].forEach(function(publication_tuple) {
											publication_total_probability += publication_tuple.probability;
										});

										//calculate the summation of matched probabilities for this topic of the award
										var award_matched_probability = 0;
										analyzed_award._ldaResult[0].forEach(function(award_tuple) {
											if(award_tuple.flag) {
												award_matched_probability += award_tuple.probability;
											}
										});

										//calculate the summation of matched probabilities for this topic of the publication
										var publication_matched_probability = 0;
										publication._ldaResult[0].forEach(function(publication_tuple) {
											if(publication_tuple.flag) {
												publication_matched_probability += publication_tuple.probability;
											}
										});

										//// TODO: WE ARE CURRENTLY USING THE GEOMETRIC MEAN, BUT MIGHT ADD OTHER TYPES OF MEAN LATER (arithmetic, harmonic, etc)
										////	MAX SHOULD BE = 50 * 1, WHERE ALL TOPICS ARE MATCHED IN BOTH
										if((award_matched_probability > 0) && (publication_matched_probability > 0)) {
											publication._radius2 = 50 * Math.sqrt((award_matched_probability / award_total_probability) * (publication_matched_probability / publication_total_probability));
										}
										else {
											publication._radius2 = _MIN1;
											publication.active = false;
										}

									}
									else {
										publication._radius2 = _MIN1;
										publication._active = false;
									}
								});
							}
							else {
								analyzed_award._error = 1;
								analyzed_award._note = "No topics could be extracted for the selected award.";
								analyzed_award._relatedPublicationsList.forEach(function(publication) {
									publication._active = false;
								});
								/*myfunction(analyzed_award);
								 return;*/
							}

							callback();
						}
						else {
							analyzed_award._error = 1;
							analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";

							callback();
							/*myfunction(analyzed_award);
							 return;*/
						}

					}
					else {
						console.log("******************************************HUGE ERROR 3******************************************");
						console.log("*************************************************************************************************");
						analyzed_award._error = 1;
						analyzed_award._note = "Wrong entry for the algorithm!!!   " + algorithm_selection;
					}
				}
			},

			//calculate radius
			function(callback) {
				if(analyzed_award._error){
					console.log("analyzed award has an error: " + analyzed_award._note);
					myfunction(analyzed_award);
					return;
				}
				else {
					if((aggregation != 'Uniform') && aggregation != 'Weighted') {
						console.log("******************************************HUGE ERROR 4******************************************");
						console.log("*************************************************************************************************");
						analyzed_award._error = 1;
						analyzed_award._note = "Wrong entry for the aggregation!!!   " + aggregation;
					}
					else {
						if(_.size(analyzed_award._relatedPublicationsList) > 0) {
							analyzed_award._relatedPublicationsList.forEach(function(publication) {
								if(aggregation == 'Uniform') {
									//UNIFORM/SIMPLE ARITHMETIC MEAN
									publication._radius = (publication._radius1 + publication._radius2);
								}
								else if(aggregation == 'Weighted') {
									//WEIGHTED ARITHMETIC MEAN
									var author_count = _.size(publication._authors);
									var keywords_count = _.size(publication._keywords);

									var weight1 = author_count / (author_count + keywords_count);
									var weight2 = keywords_count / (author_count + keywords_count);

									publication._radius = (weight1 * publication._radius1) + (weight2 * publication._radius2);
								}
							});
						}
						else {
							analyzed_award._error = 1;
							analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
						}
					}

					callback();
				}
			},

			//filter publications with !publication._active
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(analyzed_award._relatedPublicationsList) > 0) {
						var temp = new Array();
						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							if(publication._active) {
								temp.push(publication);
							}
							else {
								analyzed_award._rejectedPublicationList.push(publication);
							}
						});

						analyzed_award._relatedPublicationsList.splice(0, _.size(analyzed_award._relatedPublicationsList));
						analyzed_award._relatedPublicationsList = temp;

						_.delay(function() {
							callback();
						}, 100);
					}
					else {
						analyzed_award._error = 1;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
					}
				}
			},

			//check if we still have any other publications
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					if(_.size(analyzed_award._relatedPublicationsList) < 1) {
						analyzed_award._error = 0;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
						analyzed_award._inactiveKeywordsList = keyword_filter_array;
						var temp_list = new Array();
						_.uniq(name_filter_array).forEach(function(name) {
							var temp = new Object();
							temp.name = name;
							temp.frequency = 0;
							temp_list.push(temp);
						});
						analyzed_award._coAuthorsList = temp_list;
						analyzed_award._inactiveCoAuthorsList = temp_list;
						myfunction(analyzed_award);
						return;
					}
				}

				callback();
			},

			//create final list of co-authors
			function(callback) {
				if(analyzed_award._error){
					myfunction(analyzed_award);
					return;
				}
				else {
					var coAuthorNames = new Array();
					var coAuthorList = new Array();

					if(_.size(analyzed_award._relatedPublicationsList) > 0) {
						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							if(publication._active) {
								publication._authors.forEach(function(author) {
									coAuthorNames.push(author._fullName);
								});
							}
							else {
								console.log("--------> HOW COME?!");
							}
						});

						coAuthorNames = _.uniq(coAuthorNames);
						coAuthorNames.forEach(function(name) {
							var temp = new Object();
							temp.name = name;
							temp.frequency = 0;
							coAuthorList.push(temp);
						});
						_.delay(function() {}, 100);

						analyzed_award._relatedPublicationsList.forEach(function(publication) {
							if(publication._active) {
								publication._authors.forEach(function(author) {
									coAuthorList.forEach(function(coAuthor) {
										if(author._fullName == coAuthor.name) {
											coAuthor.frequency++;
										}
									});
								});
							}
							else {
								console.log("--------> HOW COME?!");
							}
						});

						var tempCoAuthorList = _.uniq(analyzed_award._inactiveCoAuthorsList);
						var inactiveCoAuthorList = new Array();
						tempCoAuthorList.forEach(function(tempCoAuthor) {
							var temp = new Object();
							temp.name = tempCoAuthor;
							temp.frequency = 0;
							inactiveCoAuthorList.push(temp);
						});
						analyzed_award._coAuthorsList = coAuthorList.concat(inactiveCoAuthorList);
						analyzed_award._inactiveCoAuthorsList = inactiveCoAuthorList;

						analyzed_award._coAuthorsList.sort(function(a,b) {return a.frequency - b.frequency;});

						_.delay(function() {
							callback();
						}, 100);
					}
					else {
						analyzed_award._error = 1;
						analyzed_award._note = "None of the publications within our current database have correlations with this award and/or criteria.";
					}
				}
			},

			//unify _inactiveKeywordsList and add to the end of addedKeywordsList
			function(callback) {
				analyzed_award._inactiveKeywordsList = _.uniq(analyzed_award._inactiveKeywordsList);

				callback();
			}
		],
		function(err, results) {
			if(analyzed_award._error){
				myfunction(analyzed_award);
				return;
			}

			if(err) {
				console.log(err);
				analyzed_award._error = 1;
				analyzed_award._note = "Async.js error";
				myfunction(analyzed_award);
				return;
			}
			else {
				pool.end(function (err) {});
				myfunction(analyzed_award);
				return;
			}
		});
}

function checkInvestigator(_pid, _list) {
	var _temp = new Object();
	_temp._flag = "false";
	_temp._principal = -1;

	_list.forEach(function(_item) {
		if(_item._professorID == _pid) {
			_temp._flag = true;
			_temp._principal = _item._principal;
		}
	});

	return _temp;
}

function filterItems(_item, _list) {
	var _flag = false;
	_list.forEach(function(name) {
		if(name == _item) {
			_flag = true;
		}
	});

	return _flag;
}

function isNumber(_item) {
	var regex = /\$([0-9\.]+)\b/g;
	return ((typeof parseInt(_item)) === ("number"));
}

function sigmoid(t) {
	return 1/(1+Math.pow(Math.E, -t));
}

