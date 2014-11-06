exports.makeJson = function(entityName, propertyName, layoutName, callback){
		
	var mysql = require('mysql');
	var connection = mysql.createConnection({
	  host : 'localhost',
	  user : 'root',
	  password : '',
	  database : 'researchmap'
	});
	connection.connect();
	
	switch(entityName+"|"+ propertyName+"|"+layoutName) {
		case "Awards|Universities|barChart":
			connection.query("select U.Short_Name as name, sum(A.Amount/1000) as value from award as A join department as D on A.Department=D.ID join faculty as F on D.Faculty=F.ID join university as U on F.University=U.ID GROUP BY U.Long_Name", function(err, rows, fields) {
				connection.end();
				console.log(rows);
				callback(rows);
			});
			break;
		case "Awards|Departments|barChart":
			connection.query("select D.Name as name, sum(A.Amount) as value from award as A join department as D on A.Department=D.ID join faculty as F on D.Faculty=F.ID join university as U on F.University=U.ID where U.Short_Name='UWO' GROUP BY A.Department", function(err, rows, fields) {
				connection.end();
				console.log(rows);
				callback(rows);
			});
			break;
		case "Awards|Top Sponsors|barChart":
			connection.query("select S.Name as name, sum(A.Amount) as value from award as A join program as P on A.Program = P.ID join sponsor as S on P.Sponsor = S.ID GROUP BY S.Name ORDER BY value DESC limit 10", function(err, rows, fields) {
				connection.end();
				console.log(rows);
				callback(rows);
			});
			break;
		case "Awards|Source of funding|barChart":
			connection.query("select SOF.sponsor_type as name, sum(A.Amount) as value from award as A join program as P on A.Program = P.ID join sponsor as S on P.Sponsor = S.ID join source_of_funding as SOF on S.Source=SOF.ID GROUP BY SOF.sponsor_type", function(err, rows, fields) {
				connection.end();
				console.log(rows);
				callback(rows);
			});
			break;
		case "Professors|Research chair|barChart":
			connection.query("SELECT table1.type as name , count(*) as value FROM (select RCT.type from professor as P join research_chair as RC on P.ResearchChair = RC.ID join research_chair_type as RCT on RC.type = RCT.ID) as table1 GROUP BY type", function(err, rows, fields) {
				connection.end();
				console.log(rows);
				callback(rows);
			});
			break;
		case "Professors|Department|barChart":
			connection.query("SELECT table1.type as name , count(*) as value FROM ( select D.Name as type from professor as P join department as D on P.Department_Primary=D.ID join faculty as F on D.Faculty=F.ID join university as U on F.University=U.ID where F.Name='Faculty of Science' and U.Short_Name='UWO' ) as table1 GROUP BY type", function(err, rows, fields) {
				connection.end();
				console.log(rows);
				callback(rows);
			});
			break;
		case "Professors|Rank|barChart":
			connection.query("SELECT table1.type as name , count(*) as value FROM ( select P.Rank as type from professor as P join department as D on P.Department_Primary=D.ID join faculty as F on D.Faculty=F.ID join university as U on F.University=U.ID where F.Name='Faculty of Science' and U.Short_Name='UWO' and  P.Rank != 'null' ) as table1 GROUP BY type", function(err, rows, fields) {
				connection.end();
				console.log(rows);
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
}