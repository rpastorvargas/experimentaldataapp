/**************************************************************
	FUNCIONES GENERICAS LLAMADAS A WEB SERVICES
**************************************************************/

function loadSoapSessionsWS_v2(method,parameters,successfunction) {
	var url = 'http://lab.scc.uned.es:8080/axis2/services/SessionsWS_v2/';
	var namespaceQualifier = 'sessions';
	var namespaceURL = 'http://sessions.ws.web.related.scc.uned.es';
	loadSoapExperimentSessions(method,parameters,successfunction,true,url,namespaceQualifier,namespaceURL);
}

function loadSoapSessionDataManagementWS(method,parameters,successfunction,hideloading) {
	var url = 'http://lab.scc.uned.es:8080/axis2/services/SessionDataManagementWS/';
	var namespaceQualifier = 'data';
	var namespaceURL = 'http://data.sessions.ws.related.scc.uned.es';
	loadSoapExperimentSessions(method,parameters,successfunction,hideloading,url,namespaceQualifier,namespaceURL);
}

function loadSoapXMLLoaderWS(method,parameters,successfunction) {	
	var url = 'http://lab.scc.uned.es:8080/axis2/services/XMLLoaderWS/';
	var namespaceQualifier = 'xmlconffileloader';
	var namespaceURL = 'http://xmlconffileloader.ws.web.related.scc.uned.es';
	loadSoapExperimentSessions(method,parameters,successfunction,true,url,namespaceQualifier,namespaceURL);
}

function loadSoapManageSystemsWS(method,parameters,successfunction) {	
	var url = 'https://lab.scc.uned.es:8443/axis2/services/ManageSystemsWS/';
	var namespaceQualifier = 'systems';
	var namespaceURL = 'http://systems.ws.related.scc.uned.es';
	loadSoapExperimentSessionsSecurity(method,parameters,successfunction,url,namespaceQualifier,namespaceURL);
}


function loadSoapExperimentSessions(method,parameters,successfunction,hideloading,url,namespaceQualifier,namespaceURL) {
	hideloading = typeof hideloading !== 'undefined' ? hideloading : 1;
	$("#divloading").removeClass("hidden");
	$.soap({
		url: url,
		method: method,
		
		appendMethodToURL: true, 
		
		params: parameters,

		namespaceQualifier: namespaceQualifier,                     // used as namespace prefix for all elements in request (optional)
		namespaceURL: namespaceURL,
		
		success: function (soapResponse) {
			if (hideloading) {
				$("#divloading").addClass("hidden");
			}
			eval(successfunction(soapResponse,this.data));
		},		
		error: function (soapResponse) {
			// show error
			if (hideloading) {
				$("#divloading").addClass("hidden");
			}
			document.write("ERROR: " + soapResponse);
		},
		// Async (default= false)
		async: true,
		// debugging
		enableLogging: true,
	});
}

function loadSoapExperimentSessionsSecurity(method,parameters,successfunction,url,namespaceQualifier,namespaceURL) {
	var result;
	$("#divloading").removeClass("hidden");
	$.soap({
		url: url,
		method: method,
		// method: 'getSampleTimeSession',
		//method: 'getDataSet',
		
		appendMethodToURL: true, 
		
		params: parameters,

		namespaceQualifier: namespaceQualifier,                     // used as namespace prefix for all elements in request (optional)
		namespaceURL: namespaceURL,
		
		success: function (soapResponse) {
			$("#divloading").addClass("hidden");
			eval(successfunction(soapResponse,this.data));
		},		
		error: function (soapResponse) {
			// show error
			$("#divloading").addClass("hidden");
			alert(soapResponse);
			document.write("ERROR: " + soapResponse);
		},
		// debugging
		enableLogging: true,
		// Soap Security Header
		wss: {
			username: 'related_developer',
			password: 'L+Fy/dOUQ4pLP5JTY92qEw=='
		}  
	});
}