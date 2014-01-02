// JavaScript Document


// Global variables
var systemId;
var varsInfo = null;
var graphs_info = null;
var views_info = null;

/**************************************************************

SOAP SERVICES: getSystemID
PARAMETERS: Ip and Name (System)

Description: Returns ID of Lab. Needed for get lab structure !!!

**************************************************************/

function getSystemIdFunction(soapResponse,parameters){
	var obj = soapResponse.toJSON().Body;
	var system = obj.getSystemIDResponse.return;
	if (typeof system == "string"){
		// Set global variable 'systemId'
		systemId = system;
	}
}

function loadSoapManageSystemsWS(method,parameters,successfunction) {
	var result;
	$("#divloading").removeClass("hidden");
	$.soap({
		url: 'https://lab.scc.uned.es:8443/axis2/services/ManageSystemsWS/',
		method: method,
		// method: 'getSampleTimeSession',
		//method: 'getDataSet',
		
		appendMethodToURL: true, 
		
		params: parameters,

		namespaceQualifier: 'systems',                     // used as namespace prefix for all elements in request (optional)
		namespaceURL: 'http://systems.ws.related.scc.uned.es',
		
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

/**************************************************************

SOAP SERVICES: getXmlConfFile
PARAMETERS: ID(System)

Description: Returns XML specification of Lab.

**************************************************************/
function getXmlConfFileSuccessFunction(soapResponse, soapParams){
	var return_value = soapResponse.toJSON().Body.getXmlConfFileResponse.return;
	xmlContent = return_value.xmlConfFile;
	if (typeof xmlContent != "undefined"){
		xmlDoc = $.parseXML(xmlContent);
		$xml = $( xmlDoc );
		// Find experiments
		var $experiments = $xml.find("experiment");
		// Get experiment name from UI
		experiment_name = $('#experiment-name').html();
		// Locate experiment-name in XML
		// to get graphs info and defined web views !!!
		$experiments.each(function(){
			var name = $(this).attr('name');
			if (name==experiment_name){
				// Set lab vars, graphs info and webviews
				varsInfo = getVarsInfos( $(this), $xml);
				graphs_info = getGraphInfos($(this),$xml);
				views_info = getViewsInfo($(this),$xml);
				// Build the UI (example) !!!
				buildUI(systemId, views_info,graphs_info)
			}
		});
		
	} else {
		$('#xmlConfFile').html("No xml defined...");
	}
	// For the live view !!!
	// buildUI(systemId,viewObjectsArray,graphInfoObjectsArray);
}

function loadSoapXmlWS(method,parameters,successfunction) {
	var result;
	$("#divloading").removeClass("hidden");
	$.soap({
		url: 'http://lab.scc.uned.es:8080/axis2/services/XMLLoaderWS/',
		method: method,
		// method: 'getSampleTimeSession',
		//method: 'getDataSet',
		
		appendMethodToURL: true, 
		
		params: parameters,

		namespaceQualifier: 'xmlconffileloader',                     // used as namespace prefix for all elements in request (optional)
		namespaceURL: 'http://xmlconffileloader.ws.web.related.scc.uned.es',
		
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
		enableLogging: true  
	});
}

/**************************************************************
	AUXILIAR PARSING XML FUNCTION --> Variables Info
***************************************************************/

function getVarsInfos($experiment_node,$system_node){
	varsInfoArray = new Array();
	// Find the view name on root <system>
	$run_modules = $experiment_node.find('run');
	$run_modules.each(function(index,element){
		// Find <modules> tags inside the system node
		// corresponding to the module name
		module_name = $(element).attr('module');
		module_type = $(element).attr('type');
		remote_system = null;
		if (module_type=="remote"){
			// Remote module !!!
			remote_system = $(this).attr('source');
		}
				
		// All modules defined in system !!!
		$modules = $system_node.find('module');
		$modules.each(function(index, element) {
			if ( $(element).attr('name') == module_name ){
				// Add all the vars to the array
				$vars = $(element).find('var');
				$vars.each(function(index, element) {
					variable_json = $.xml2json(element);
					variable = new Object();
					variable.name = variable_json.name;
					variable.description = variable_json.text;
					variable.type = variable_json.type;
					variable.max = variable_json.max;
					variable.min = variable_json.min;
					variable.initial = variable_json.initial;
					variable.units = variable_json.units;
					variable.module = module_name;
					if (remote_system!=null){
						variable.system = remote_system; 
					}
					varsInfoArray.push(variable);
				});
			}
		});
	});
	return varsInfoArray;
}


/**************************************************************
	AUXILIAR PARSING XML FUNCTION --> Original Graph Info
***************************************************************/

function getGraphInfos($experiment_node,$system_node){
	var paintObject;
	var paintObjectsArray = new Array();
	// Find the view name on root <system>
	var $run_modules = $experiment_node.find('run');
	$run_modules.each(function(){
		// Find <paint> tags inside the run tag	
		$paint_in_run_modules = $(this).find('paint');		
		// Build the graph info array to return...
		$paint_in_run_modules.each(function(index,element) {
			var paintObject = new Object();
			paintObject.module = $(element).parent().attr('module');
			// Module can be remote. Atributes are defined like this
			// type="remote" source="//62.204.199.218:1099/D71F73A7AE4E112B5DF4172E60E059E5"
			// Default value
			paintObject.isRemoteModule = false;
			if ( typeof $(this).attr('type') != "undefined"){
				moduleType = $(this).attr('type');
				if (moduleType=="remote"){
					// Remote module !!!
					paintObject.isRemoteModule = true;
					paintObject.remoteSystem = $(this).attr('source');
				}
			}
			// names and colors!!!
			paintObject.names = ($(this).attr('names')).split(",");
			paintObject.colors = ($(this).attr('colors')).split(",");
			paintObjectsArray.push(paintObject);	
			// END of each of paint tags
		});
		// END of each of run modules
	});
	return paintObjectsArray;
}

/*********************************************************
	AUXILIAR PARSING XML FUNCTION --> Original Web Views
*********************************************************/
function getViewsInfo($experiment_node,$system_node){
	views_info_array = new Array();
	// Web views defined in the experiment
	$webViews = $experiment_node.find('openweb');
	$webViews.each(function(index,element){
		name = $(element).attr('view');
		// Find all views in <system>
		$views_def = $system_node.find('webview');
		// For every one included in the experiment
		// build an object
		$views_def.each(function(index,element){
			var vname = $(element).attr('name');
			if (vname==name){
				viewObject = new Object();
				viewObject.name = vname;
				viewObject.description = $(element).attr('description');
				viewObject.html_dir = $(element).attr('html_dir');
				viewObject.html_page = $(element).attr('html_page');
				views_info_array.push(viewObject);
			}
		});
		
	});
	return views_info_array;
}

/*********************************************************
	BUILD "live" UI with graphs and views !!!
*********************************************************/

function buildUI(systemId, viewObjectsArray, graphInfoObjectsArray){
	// Sample function
	var baseLocation = "http://lab.scc.uned.es/related/jar_files/webviews/" + systemId + "/";
	
	if (viewObjectsArray.length>0){
		for (i=0; i<viewObjectsArray.length; i++){
			var url=baseLocation + viewObjectsArray[i].html_page;
			// Build an iframe
			iframe = "<iframe width='600' height='800' sandbox='allow-scripts allow-top-navigation allow-same-origin' frameborder='0' src='" + url + "'></iframe>"
			$(iframe).attr('src',url);
			$('#web_video_container').append(iframe);
		}
	}	
	 
}