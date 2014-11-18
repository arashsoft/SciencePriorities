// hard code awards based on their ID <= 20074 because of data problem

exports.makeJson = function(entityName, propertyName, layoutName, callback){
		
	var mysql = require('mysql');
	var connection = mysql.createConnection({
	  host : 'localhost',
	  user : 'root',
	  password : '',
	  database : 'researchmap'
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
					connection.end();
					callback(rows);
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
			default:
				console.log("unknown visualizaition request");
				connection.end();
		}
	});
}