// Global variables
var systemId;
var varsInfo = null;
var graphs_info = null;
var views_info = null;
var xml_source_ip = null;

// tmp variable for remote systems/modules
var remote_module_name = "";
var remote_xml_source_ip = null;
/**************************************************************

SOAP SERVICES: getSystemID
PARAMETERS: Ip and Name (System)

Description: Returns ID of Lab. Needed for get lab structure !!!

**************************************************************/

function getSystemIdFunction(soapResponse,parameters){
	// Copy the ip in the global variable
	xml_source_ip = parameters.ip;
	var obj = soapResponse.toJSON().Body;
	var system = obj.getSystemIDResponse.return;
	if (typeof system == "string"){
		// Set global variable 'systemId'
		systemId = system;
	}
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
		//xmlDoc = $.parseXML(xmlContent.substring(3));
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
				//paintMultipleSelect();
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

function getRemoteXmlConfFileSuccessFunction(soapResponse, soapParams){
	var return_value = soapResponse.toJSON().Body.getXmlConfFileResponse.return;
	xmlContent = return_value.xmlConfFile;
	if (typeof xmlContent != "undefined"){
		//xmlDoc = $.parseXML(xmlContent.substring(3));
		xmlDoc = $.parseXML(xmlContent);
		$xml = $( xmlDoc );
		// Find experiments
		var $modules = $xml.find("module");
		$modules.each(function(){
			var name = $(this).attr('name');
			if (name==remote_module_name){
				// Add remote vars to local
				remoteVarsInfo = getVarsInfosFromRemoteModule($(this), $xml,remote_xml_source_ip);
				// Add to varsInfo array
				varsInfo = $.merge(varsInfo,remoteVarsInfo);
			}
		});
		
	} else {
		$('#xmlConfFile').html("No xml defined...");
	}
	// For the live view !!!
	// buildUI(systemId,viewObjectsArray,graphInfoObjectsArray);
}

function paintViewsInfo() {
	//$('#sltShowView').html('');
	var res = '';
	// Sample function
	var baseLocation = "http://lab.scc.uned.es/related/jar_files/webviews/" + systemId + "/";
			
	jQuery.each(views_info, function(i, ipos) {
		url = baseLocation + ipos.html_page;
		div_iframe_id = "View-" + i; 
		res = res + '<option value="' + div_iframe_id + '">' + ipos.name + '</option>';
		// Load the iframe !!!
		iframe = "<iframe width='600' height='800' sandbox='allow-scripts allow-top-navigation allow-same-origin' frameborder='0' src='" + url + "'></iframe>"
		$(iframe).attr('src',url);
		// Add to container
		viewDiv = "<div class='text-center text-success' style='padding-top: 10px;' id='" + div_iframe_id + "'><div class='panel panel-primary'>";
		viewDiv += "<div class='panel-heading'><h3 class='panel-title'>" + ipos.name + "</h3>";
		viewDiv += "</div><div class='panel-body'>" + iframe + "</div></div></div>";
		$(viewDiv).load();
		if (i==0){
			$('#liveShowView').html($(viewDiv));
		} else {
			$('#liveShowView').append($(viewDiv));
		}
	});
	$('#sltShowView').append(res);
	$('#sltShowView').multiselect('rebuild');
}

function paintGraphsInfo() {
	
	var res = '';
			
	jQuery.each(graphs_info, function(i, ipos) {
		//div_iframe_id = "Graphs-" + i; 
		div_iframe_id = ipos.module + "_";
		// Build graph title on select
		title = "Module: " + ipos.module + " --> ";
		jQuery.each(ipos.names, function(i,iname){
			title += iname + " ";

			if (ipos.names.length == (i + 1)) {
				div_iframe_id += iname + "~" + convertColorRGB(ipos.colors[i]);
			}
			else {
				div_iframe_id += iname  + "~" + convertColorRGB(ipos.colors[i]) + "-";
			}
		});
		
		res = res + '<option value="' + div_iframe_id + '">' + title + '</option>';
		// Build the graph for div
		// function to build the graph !!!
		graphDiv = "<div class='text-center text-success' style='padding-top: 10px;' id='" + div_iframe_id + "'><div class='panel panel-primary'>";
		graphDiv += "<div class='panel-heading'><h3 class='panel-title'>" + title + "</h3>";
		graphDiv += "</div><div class='panel-body'>Builded graph for " + title + "</div></div></div>";
		
		// Add to container
		/*if (i==0){
			$('#liveShowGraph').html($(graphDiv));
		} else {
			$('#liveShowGraph').append($(graphDiv));
		}
		*/
	});
	$('#sltShowGraph').append(res);
	$('#sltShowGraph').multiselect('rebuild');
}

function convertColorRGB(color) {
	var value = '';
	switch(color)
	{
		case "red":
			value = 'FF0000';
			break;
		case "yellow":
			value = 'FFFF00';
			break;
		case "blue":
			value = '0000FF';
			break;
		default:
			value = '000000';
	}
	return value;
}


function paintLiveStart() {
	$('#sltLiveStart').html('');
	var res = '';
	jQuery.each(graphs_info, function(i, ipos) {
		res = res + '<option value="' + ipos.html_dir + ipos.html_page + '">' + ipos.name + '</option>';
	});
	$('#sltLiveStart').append(res);
	$('#sltLiveStart').multiselect('rebuild');
}

function paintMultipleSelect() {
	var modules = [];
	var names = [];
	jQuery.each(varsInfo, function(i, ipos) {
		var found = $.inArray(ipos.moduleName, modules) > -1;
		if (!found) {
			modules.push(ipos.moduleName);
			names = [];
			names.push(ipos);
			modules[ipos.moduleName] = names;
		}
		else {
			names = modules[ipos.moduleName];
			names.push(ipos);
			modules[ipos.moduleName] = names;
		}
	});	
	$('.multipleselect').html('');
	jQuery.each(modules, function(i, ipos) {
		var res = '';
		jQuery.each(modules[ipos], function(j, jpos) {
			var name = jpos.name + '(' + jpos.units + ')';
			//var value = jpos.name + '_' + jpos.module;
			
			// jpos contains the variable
			// calculate the hash value to use as id
			var value = getHashValue(jpos);
			//res = res + '<option value=' + jpos.name + '_' + i + '>' + name + '</option>';
			res = res + '<option value=' + value + '>' + name + '</option>';
		});
		$('.multipleselect').append('<optgroup label="' + ipos + '">' + res + '</optgroup>');
	});
	$('.multipleselect').multiselect('rebuild');
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
		
		// Check for system name
		
		// Generate the full quailifies name
		// Format: //ip/systemname
		systemName = ($system_node.find('system')).attr('name');
		fullQualifiedSystemName = "//" + xml_source_ip + "/" + systemName;
		
		// Maybe a remote system??
		remote_system = null;
		if (module_type=="remote"){
			// Remote module !!!
			remote_system = $(this).attr('source');
			fullQualifiedSystemName = remote_system;
			// Find remote variables from remote system
			r_system = decodeRemoteSystem(remote_system);
			remote_system_id = r_system.id;
			remote_xml_source_ip = r_system.ip;
			remote_module_name = module_name;
			// Call the web service to get vars info from module
			loadSoapXMLLoaderWS('getXmlConfFile',{systemId:remote_system_id},getRemoteXmlConfFileSuccessFunction);
		}
		
		// All modules defined in system (local) !!!
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
					variable.moduleName = module_name;
					variable.fullQualifiedSystemName = fullQualifiedSystemName;
					varsInfoArray.push(variable);
				});
			}
		});
	});
	return varsInfoArray;
}

function getVarsInfosFromRemoteModule($module_node,$system_node,ip){
	varsInfoArray = new Array();
	
	module_name = $module_node.attr('name');
	// Generate the full quailifies name
	// Format: //ip/systemname
	systemName = ($system_node.find('system')).attr('name');
	fullQualifiedSystemName = "//" + ip + "/" + systemName;
	$vars = $module_node.find('var');
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
		variable.moduleName = module_name;
		variable.fullQualifiedSystemName = fullQualifiedSystemName;
		varsInfoArray.push(variable);
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
	
	if (viewObjectsArray.length>0){
		paintViewsInfo();
	}	
	if (graphInfoObjectsArray.length>0){
		paintGraphsInfo();
	}
}

/*********************************************************************

CALCULATE HASH VALUE FOR A VARIABLE

Returns a MD5 Hash of variables properties: name, module, system (unique id)
Use the javascript library located in:
http://pajhome.org.uk/crypt/md5/
Supports MD5, RIPE, SHA, SHA-256 & SHA-512
**********************************************************************/
function getHashValue(variable){
	// Create an unique id for the variable
	var hash_value = null;
	
	if (variable != null){
		// Take properties from variables
		string_properties = variable.name + ":" + variable.moduleName + ":" + variable.fullQualifiedSystemName;
		// Call the library function
		hash_value = hex_md5(string_properties); 
	}
	
	return hash_value;
	
}

function decodeRemoteSystem(remote_source){
	// FORMAT --> //ip/id
	var subStrings = remote_source.split("/");
	// The last is the good!!!
	id = subStrings[subStrings.length-1];
	
	// Ip
	subStrings = (subStrings[subStrings.length-2]).split(":");
	ip = subStrings[0];
	
	remote_system = new Object();
	remote_system.id = id;
	remote_system.ip = ip;
	return remote_system;
}