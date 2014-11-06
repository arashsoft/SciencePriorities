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
			//code block
			break;
		case "Professors|Department|barChart":
			//code block
			break;
		case "Professors|Rank|barChart":
			//code block
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