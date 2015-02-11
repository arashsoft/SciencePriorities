var mysql = require('mysql');
var mysqlConf = require('./mysql.config');
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
	
	var insertSize = 7;
	var departmentName = "Biology";
	// list all professors for selected department
	connection.query("select P.ID as ID, concat(cast(P.Firstname as char(15)),',',cast(P.Middlename as CHAR(15)),' ',P.Lastname)  as name , D.ID as dID , D.name as department from award_professor2 as AP2 join professor as P on P.Id=AP2.professor join department as D on D.ID = P.Department_Primary where AP2.Grant in (select multiGrants.* from (select AP.Grant from award_professor2 as AP group by AP.Grant having count(AP.Grant)>1) as multiGrants) and D.Name='"+departmentName+"' group by AP2.Professor ", function(err,rows,fields){
		
		var insertQuery = 'INSERT INTO student_fake (Department,Supervisor1,Supervisor2) VALUES ';
		for (var i=0;i<insertSize;i++){
			var prof1 = 0;
			var prof2 = 0;
			while(prof1==prof2){
				prof1 = rows[Math.floor((Math.random() * rows.length))];
				prof2 = rows[Math.floor((Math.random() * rows.length))];
			}
			insertQuery += '('+prof1.dID+','+prof1.ID +','+prof2.ID+'),';
		}
		insertQuery = insertQuery.substring(0, insertQuery.length - 1);
		connection.query(insertQuery,function(err3,row3,field3){
					if (err3) throw err3;
					console.log("\n Error: "+err3);
					console.log("data generated successfully");
					connection.end();
					process.exit();
			}); // end of insert query
	}); // end of prof query
	
}); // end of connection.connect