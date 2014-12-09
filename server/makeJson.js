// hard code awards based on their ID <= 20074 because of data problem

exports.makeJson = function(entityName, propertyName, layoutName, callback){
		
	var mysql = require('mysql');
	var mysqlConf = require('./config/mysql.config');
	var connection = mysql.createConnection({
	  host : mysqlConf.HOST,
	  user : mysqlConf.USER,
	  password : mysqlConf.PASSWORD,
	  database : mysqlConf.DATABASE
	});
	//connection.connect();
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
				connection.query("SELECT ap.Grant, GROUP_CONCAT(P.ID SEPARATOR '#')  as Professors, GROUP_CONCAT(P.Department_Primary SEPARATOR '#') as Departments FROM (select CONCAT(award_professor.Grant, award_professor.Professor) as tempColumn, award_professor.Grant, award_professor.Professor, award_professor.ID from award_professor group by tempColumn) as ap join professor as P on P.ID= ap.Professor  GROUP BY ap.Grant having count(ap.grant) > 1" , function (err,rows,fields){
					connection.query("select P.ID as ID, concat(cast(P.Firstname as char(15)),',',cast(P.Middlename as CHAR(15)),' ',P.Lastname)  as name , D.name as department from award_professor2 as AP2 join professor as P on P.Id=AP2.professor join department as D on D.ID = P.Department_Primary where AP2.Grant in (select multiGrants.* from (select AP.Grant from award_professor2 as AP group by AP.Grant having count(AP.Grant)>1) as multiGrants) group by AP2.Professor", function(err2,rows2,fields2){
						// rows2 is professors IDs (nodes)					
						var jsonFile = new Object();
						jsonFile.nodes = rows2;
						
						// make hash table to convert Link IDs to indexes
						var nodeHash = new Object();
						for (var i =0; i < rows2.length; i++){
							nodeHash[rows2[i].ID] = i;
						}
						
						jsonFile.links = new Array();
						for (var i=0; i < rows.length; i++){
							var professorIDs = rows[i].Professors.split("#");
							var departmentIDs = rows[i].Departments.split("#");
							for (var j1=0; j1 < professorIDs.length; j1++){
								for (var j2=0; j2 < professorIDs.length; j2++){
									if (j1 == j2) continue;
									jsonFile.links.push({source: nodeHash[professorIDs[j1]],target:nodeHash[professorIDs[j2]],type:"award", linkType:(departmentIDs[j1]==departmentIDs[j2] ? 1:0)});
								}
							}
						}
						connection.end();
						callback(jsonFile);
					});
				});			
				break;
			default:
				connection.end();
				callback("unknown visualizaition request");
		}
	});
}