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
	
	var randomSize = 10;
	var departmentName = "Computer Science";
	connection.query('select a2f.ID as ID from award_professor2 as AP2 join professor as P on P.Id=AP2.professor join department as D on D.ID = P.Department_Primary join author_2_fake as a2f on a2f.Professor_ID= P.ID where  AP2.Grant in (select multiGrants.* from (select AP.Grant from award_professor2 as AP group by AP.Grant having count(AP.Grant)>1) as multiGrants) and D.name="'+departmentName+'" group by AP2.Professor  order by rand() limit '+randomSize, function(err,rows,fields){
		
		connection.query('select a2f.ID as ID from award_professor2 as AP2 join professor as P on P.Id=AP2.professor join department as D on D.ID = P.Department_Primary join author_2_fake as a2f on a2f.Professor_ID= P.ID where  AP2.Grant in (select multiGrants.* from (select AP.Grant from award_professor2 as AP group by AP.Grant having count(AP.Grant)>1) as multiGrants) and D.name="'+departmentName+'" group by AP2.Professor  order by rand() limit '+randomSize, function(err2,rows2,fields2){
			var insertQuery = 'INSERT INTO publication_author_profOnly (Publication,Author) VALUES ';
			for (var i=0;i<rows.length;i++){
				var publicationID = Math.floor((Math.random() * 2000) + 1);
				insertQuery += '('+ publicationID +','+ rows[i].ID +'),('+publicationID+','+ rows2[i].ID + '),';
			}				
			insertQuery = insertQuery.substring(0, insertQuery.length - 1);
			
			connection.query(insertQuery,function(err3,row3,field3){
					if (err3) throw err3;
					
					console.log("\n"+err3);
					console.log("data generated successfully");
					connection.end();
					process.exit();
			}); // end of query 3	(insert Query)
		}); // end of query 2
	}); // end of query 1
}); // end of connection.connect