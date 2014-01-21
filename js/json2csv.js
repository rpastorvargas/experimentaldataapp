// JavaScript Document

// Expected and arry of values(time?)
function convertToCSV(sessionData,variables) {
	var str = createHeaderForCSV(variables);
	jQuery.each(sessionData, function(i, ipos) {
		var vars = JSON.parse(ipos);
		var tickSealedTime = vars.sealed_time;
		// Time in ms !!!
		var line = tickSealedTime/1000;
		jQuery.each(vars.vars, function(j, jpos) {
			// Value
			if (isInArray(variables,jpos.name,jpos.moduleName)){
				line += ',' + jpos.value;
			}
		});
		// Add the line
		str += line + '\r\n';
	});
		
	return str;
}

function createHeaderForCSV(variables){
	header = 'Time';
	for (i=0; i<variables.length;i++){
		header += "," + variables[i].name + " (" + variables[i].moduleName + ")"
	}
	header += '\r\n';
	return header;
}

function isInArray(variables,name,moduleName){
	var is = false;
	for (i=0; i<variables.length;i++){
		if (variables[i].name == name && variables[i].moduleName == moduleName) {
			is = true;
			break;			
		}
	}
	return is;
}