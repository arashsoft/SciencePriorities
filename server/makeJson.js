exports.makeJson = function(entityName, propertyName){

	var jsonFile={};
	
	switch(entityName+"|"+ propertyName) {
		case "Awards|Departments":
			//code block
			break;
		case "Awards|Sponsors-Programs":
			//code block
			break;
		case "Awards|Source of funding":
			//code block
			break;
		case "Professors|Research chair":
			//code block
			break;
		case "Professors|Department":
			//code block
			break;
		case "Professors|Rank":
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
	}
	
	return (jsonFile);
}