// Global variables


// VARIABLES GLOBALES APARTADO LIVE

// Variable usada para definir el tiempo en el que nos encontramos
var interval = 0;
// Variable en la que guardamos nuestro objeto gráfica para establecer los datos en el timeout
var plot;
// Variable para ir metiendo en cada intervalo el dato correspondiente y ir desplazando
var data = [];
// Variable en la que guardamos el número de puntos que pintamos por muestra
var	totalPoints = 200;
// Variable que indica cada cuantos milisegundos ejecutamos nuestra función de SetInterval
var updateInterval = 10;
// Variable que representa al temporizador y que se usa en live...
var liveTimer = null;
// Variable que representa el intervalo de ejecución de la tarea asociada al live timer
var liveTimerTime = 1000;
// Variable for index in the points
var liveTimerIndex = 0;

// VARIABLES GENERALES
var dataSession = null;

// VARIABLES GLOBALES APARTADO SOAP

// Variable en la que guardamos el valor devuelto del método SOAP getExperimentalSessionInfo
// para no tener que volver a cargar el dato
var soapResponseData;
// Variable en la que guardamos el máximo tiempo que tarda en cargar la sesión para luego utilizar
// en la barra de desplazamiento
var maxtimesession;
// Variable en la que guardamos los datos de la gráfica para posteriormente pintarlos
var dataGraph = [];


$(document).ready(function() {
	
	// Check for workSession as parameter
	sessionId = $.getUrlParameter('sessionId');
	if (typeof sessionId == "undefined"){
		// DEBUG MODE: Quit on production !!!
		$("#workSessionID").html("531a9b43d93a4353b5020a3403b3fd3d");
		// This must present a error on the main page
		//$("body").html("No session Id has been selected...");
	} else {
		$("#workSessionID").html(sessionId);
	}
	
	
	
	$('.multipleselect').multiselect();
	//$('#sltLiveStart').multiselect();
	$('#sltShowView').multiselect();
	
	window.onresize = function(event) {
		if (typeof soapResponseData !== "undefined") {
			if ($("#sessioninfographics").is(":visible")) {
				paintGraph();
			}
			else if ($("#sessioninfolive").is(":visible")) {
				paintGraphInterval();
			}
		}
	}
	
	$('.button-icon-minimize').click(function() {
		visibleWidgetSessions($(this),false);
	});
	
	// This parameter (workSessionId) must be set as get parameter in the request !!!
	// Check for valid id !!!
	
	// This session has one experimental sessions (MAGLEV)
	// var workSessionId = "05893f0c0f6b4b8d85fd4525e90b9b25";
	
	// This session has an experimental session but no data stored!!! (MAGLEV)
	// var workSessionId = "b96540d25a614361b95d467b606d4244";
	
	// This session has not experimental sessions (Wind Turbine)
	// var workSessionId = "09676571718a476aa8e9029ff6a4955b";
	
	// This session has three experimental sessions (MOTOR QET)
	
	workSessionId = $("#workSessionID").html();
	
	// Populate the session Info table
	loadSoapSessionsWS_v2("getSessionInfo",{sessionId:workSessionId},getSessionInfoFunction);
	// Populate experimental sessions from a work session
	loadSoapSessionsWS_v2("getExperimentSessions",{sessionID:workSessionId},getExperimentSessionsFunction);
	
	$("#generateGraph").click(function() {
		paintGraph();
	});
	
	$("#startLive").click(function() {
		$("#liveShowView").hide();
		$("#liveGenerateGraph").show();
		
		/*if (plot !== "undefined") {
			plot.shutdown();
		}
		*/
		//paintGraphInterval();
		//updateProgressBar();
	});
	
	// Live control
	$("#btnStartLive").click(function(){
		$("#btnStartLive").addClass("hidden");
		$("#btnPauseLive").removeClass("hidden");
		// Init progess bar
		$('#progressbar').val(0);
		$('#rangebar').val(0);
		// Start the "live timer" using the 
		liveTimer = window.setInterval(	function(){liveTimerTask()},liveTimerTime);
	});
	
	$("#btnPauseLive").click(function(){
		$("#btnStartLive").removeClass("hidden");
		$("#btnPauseLive").addClass("hidden");
		window.clearInterval(liveTimer);
		liveTimer = null;
		liveTimerIndex=0;
	});
	
	// Buttons for generated graphs and views
	$("#showViewLive").click(function() {
		$("#liveShowView").show();
		$("#liveShowGraph").hide();
				// Select graph (value on select) and show
		div_to_shown = $("#sltShowView").val();
		var $views_divs = $('#liveShowView > div');
		$.each($views_divs, function(i,div){
			id = $(div).attr("id");
			if (id==div_to_shown){
				$(div).show();
			} else {
				$(div).hide();
			}
		});

	});
/*	$("#showGraphLive").click(function() {
		$("#liveShowView").hide();
		$("#liveShowGraph").show();
		// Select graph (value on select) and show
		div_to_shown = $("#sltShowGraph").val();
		var $graphs_divs = $('#liveShowGraph > div');
		$.each($graphs_divs, function(i,div){
			id = $(div).attr("id");
			if (id==div_to_shown){
				$(div).show();
			} else {
				$(div).hide();
			}
		});
	});
*/	
	$("#showGraphLive").click(function() {
		$("#liveShowView").hide();
		$("#liveShowGraph").show();
		
		paintGraphInterval();
	});
	
	$('#rangebar').change( function() {
		var newValue = this.value;
		$('#progressbar').val(newValue);
		$('.progress-value').html(newValue + '%');
	});
	
	$("#sessioninfoinfo").show();
	$("#sessioninfographics").hide();
	$("#sessioninfolive").hide();
	
	$("#shortcutinfo").click(function() {
		$(".shortcuts > a").removeClass("active");
		$("#shortcutinfo").addClass("active");
		$("#sessioninfoinfo").show("fast").fadeIn("fast");
		$("#sessioninfographics").hide("fast").fadeOut("fast");
		$("#sessioninfolive").hide("fast").fadeOut("fast");
	});
	$("#shortcutgraphics").click(function() {
		$(".shortcuts > a").removeClass("active");
		$("#shortcutgraphics").addClass("active");
		$("#sessioninfographics").show("fast").fadeIn("fast");
		$("#sessioninfolive").hide("fast").fadeOut("fast");
		$("#sessioninfoinfo").hide("fast").fadeOut("fast");
		paintGraph();
	});
	$("#shortcutlive").click(function() {
		$(".shortcuts > a").removeClass("active");
		$("#shortcutlive").addClass("active");
		$("#sessioninfolive").show("fast").fadeIn("fast");
		$("#sessioninfographics").hide("fast").fadeOut("fast");
		$("#sessioninfoinfo").hide("fast").fadeOut("fast");
		paintGraph();
	});
	
	$(document).on('click', ".graphlegend", function() {
		paintTable($(this).text());
		$('#myModal').modal('show');
	});
	
	$("#btnSave").click( function(){
		// Create the csv values using the select for names
		selected_names = "#names option:selected";
		vars_selected = new Array();
		$(selected_names).each(function() {
			var nameSelected = $(this).val().split('(')[0].split('_')[0];
			var moduleNameSelected = $(this).parent().attr( "label" );
			variable_selected = new Object();
			variable_selected.name = nameSelected;
			variable_selected.moduleName = moduleNameSelected;
			vars_selected.push(variable_selected);
		});
		// Data
		var sessionData = soapResponseData.toJSON().Body.getSessionSimpleDataSetResponse.return.data;
		
		if (vars_selected.length>0){
			dataToDownload = convertToCSV(sessionData,vars_selected);
			// Create a url object
			a = document.createElement("a");
			blob = new Blob([dataToDownload], {"type":"application\/octet-stream"});
			a.href = window.URL.createObjectURL(blob);
			a.download = sessionId + ".csv";
			a.click();
		}
	});
});

/******************************************************************




******************************************************************/
function liveTimerTask(){
	time = (liveTimerIndex*liveTimerTime)/1000.0;
	// Take a data set on point i and update graphs and views !!!
	$('#liveTime').html("T: " + time );
	
	maxtimesession = parseFloat($('#maxtimesession').val());
	if (time<maxtimesession){
		// Variables
		json_data = dataSession.data[liveTimerIndex];
		data = $.parseJSON(json_data);
		//data = JSON.parse(json_data);
		vars = data.vars;
		image_var = null;
		length = -1;
		// Patch the image value!!!
		for (var i = 0; i < vars.length; i++) {
			if (vars[i].name == "image") {
				image_var = vars[i];
				length_new = image_var.value.length;
				if ( length != length_new){
					console.log("image(" + length_new + ") --> " + time);
					length = length_new;
				}
				break;
			}
		}
		if (image_var!=null){
			image_var.value = JSON.stringify(image_var.value);
		}
		// Update views !!!
		views = $('#liveShowView > div');
		$.each(views,function(i,view){
			// Get the iframe
			div_id = $(view).attr("id");
			iframe = $('#' + div_id + " iframe");
			// Call the function
			$(iframe)[0].contentWindow.onRLABReceiveData(vars);
		});
		
		// Update graphs
		
		// Update time
		liveTimerIndex++;
	} else {
		$('#btnPauseLive').click();
	}
}



/******************************************************************




******************************************************************/

function visibleWidgetSessions(selector,forcehide) {
	var ielement = selector.children('i');
	var element = selector.parents(".widget-header").next('.widget-content:first');
	if (forcehide || element.is(":visible")) {
		ielement.removeClass('fa-minus').addClass('fa-plus');
		element.hide();
	}
	else {
		ielement.removeClass('fa-plus').addClass('fa-minus');
		element.show();
	}
}

function updateProgressBar() {
	var progressbar = $('#progressbar'),
		max = progressbar.attr('max'),
		time = maxtimesession/1000,
		value = progressbar.val();
	
	var loading = function() {
		value += 1;
		addValue = progressbar.val(value);
		
		$('.progress-value').html(value + '%');
		$('#rangebar').val(value);

		if (value == max) {
			clearInterval(animate);
		}
	};

	var animate = setInterval(function() {
		loading();
	}, time);
}

function paintGraphInterval() {
	getGraphDataInterval("#sltShowGraph option:selected",interval,interval + 1000);
	//$.plot("#placeholder", dataGraph);
	/*plot = $.plot($("#placeholder2"), dataGraph, {
		series: {
			lines: {
			show: true
			},
			shadowSize: 0	// Drawing is faster without shadows
		},
		legend: {
				labelFormatter: function(label, series){
				//return '<a onclick="paintTable(\''+label+'\');">'+label+'</a>';
				return '<a class="graphlegend">'+label+'</a>';
			}
		}
	});
	*/
	//getRandomData2();
	plot = $.plot("#placeholder2", [] , {
		series: {
			shadowSize: 0	// Drawing is faster without shadows
		}
	});
	update();
}

function update() {

	plot.setData([getData()]);

	// Since the axes don't change, we don't need to call plot.setupGrid()
	plot.setupGrid();
	plot.draw();
	if (interval <= 120000) {
		setTimeout(update, updateInterval);
	}
}

function getData() {
	if (data.length == totalPoints) {
		data = data.slice(1);
	}
	
	var valSelect = $("#sltShowGraph option:selected").val();
	console.log(valSelect);
	var moduleName = valSelect.split('_')[1];
	var nameSelect = valSelect.split('_')[1].split('-')[0];
	var obj = soapResponseData.toJSON().Body;
	var returnval = obj.getSessionSimpleDataSetResponse.return;
	var vars = JSON.parse(returnval.data[interval]);
	var tickSealedTime = vars.sealed_time;
	jQuery.each(vars.vars, function(j, jpos) {
		if (nameSelect == jpos.name) {
			data.push([tickSealedTime/100, jpos.value]);
			return false;
		}
	});
	interval = interval + 1;
	return data;
}

function getGraphDataInterval(selector,intervalIni,intervalEnd) {
	dataGraph = [];
	$(selector).each(function() {
		var moduleName = $(this).val().split('_')[1];
		var nameSelect = $(this).val().split('_')[1].split('-')[0];
		var dataGraph2 = [];
		var obj = soapResponseData.toJSON().Body;
		var returnval = obj.getSessionSimpleDataSetResponse.return;
		jQuery.each(returnval.data, function(i, ipos) {
			var vars = JSON.parse(ipos);
			var tickSealedTime = vars.sealed_time;
			if (tickSealedTime >= intervalIni && tickSealedTime < intervalEnd) {
				jQuery.each(vars.vars, function(j, jpos) {
					if (nameSelect == jpos.name) {
						dataGraph2.push([tickSealedTime/100, jpos.value]);
						return false;
					}
				});
				maxtimesession = tickSealedTime;
			}
		});
		dataGraph.push( {label: nameSelect, data: dataGraph2} );
	});
}

function paintGraph() {
	console.log('paintGraph');
	getGraphData("#names option:selected");
	//$.plot("#placeholder", dataGraph);
	$.plot($("#placeholder"), dataGraph, {
		series: {
			lines: {
			show: true
			}
		},
		legend: {
				labelFormatter: function(label, series){
				//return '<a onclick="paintTable(\''+label+'\');">'+label+'</a>';
				return '<a class="graphlegend">'+label.split('_')[0] +'</a>';
			}
		}
	});
}

function paintTable(label) {
	jQuery.each(dataGraph, function(i, ipos) {
		if (ipos.label == label) {
			dataGraph2 = ipos.data;
			var tbody = $('#tabledata tbody');
			tbody.html("");
			jQuery.each(dataGraph2, function(i, val) {
				var row = $('<tr></tr>');
				jQuery.each(val, function(i, val2) {
					var cell = $('<td></td>').text(val2);
					row.append(cell);
				});
				tbody.append(row);
			});
		}
	});
}

function getGraphData(selector) {
	dataGraph = [];
	$(selector).each(function() {
		console.log($(this).val());
		var nameSelect = $(this).val().split('(')[0].split('_')[0];
		console.log('ENTRAMOS');
		console.log(nameSelect);
		var moduleName = $(this).parent().attr( "label" );
		var dataGraph2 = [];
		var obj = soapResponseData.toJSON().Body;
		var returnval = obj.getSessionSimpleDataSetResponse.return;
		jQuery.each(returnval.data, function(i, ipos) {
			var vars = JSON.parse(ipos);
			var tickSealedTime = vars.sealed_time;
			jQuery.each(vars.vars, function(j, jpos) {
				if (nameSelect == jpos.name && moduleName == jpos.moduleName) {
					dataGraph2.push([tickSealedTime/100, jpos.value]);
					return false;
				}
			});
			maxtimesession = tickSealedTime;
		});
		dataGraph.push( {label: nameSelect, data: dataGraph2} );
	});
}

/**************************************************************

SOAP SERVICES: getSessionSimpleDataSet, getSessionInfo 
PARAMETER: SessionID (Experimental)

Description:	Get data (JSON) from the experimental session
				Get info for experimental data !!! (if no data)

**************************************************************/

function getExperimentalSessionInfoFunction(soapResponse,parameters){
	soapResponseData = soapResponse;
	var obj = soapResponseData.toJSON().Body;
	var returnval = obj.getSessionInfoResponse.return;
	// If return value (sessionId property) is defined --> data is available for the session
	if (typeof returnval.sessionid == "undefined"){
		// Inform to user deleting the access button
		$("#sessionsTable td").filter(function() {
			if ($(this).text() == parameters.sessionId){;
				$('td:last', $(this).parents('tr')).text("No data");
			}
		});
	}
}

function getSessionSimpleDataSetFunction(soapResponse,parameters) {
//	var names = [];
//	var names2 = [];
	$( "#sessioninfo" ).removeClass("hidden");
	soapResponseData = soapResponse;
	var obj = soapResponseData.toJSON().Body;
	var returnval = obj.getSessionSimpleDataSetResponse.return;
	paintMultipleSelect();
	// Set the session data
	dataSession = returnval;
	// paintViewsInfo();
	//paintMultipleSelect();
/*	jQuery.each(returnval.data, function(i, ipos) {
		var vars = JSON.parse(ipos);
		jQuery.each(vars.vars, function(j, jpos) {
			var found = $.inArray(jpos.moduleName, names) > -1;
			var nameoption = '';
			if (!found) {
				names.push(jpos.moduleName);
				names2 = [];
				var index = names.indexOf(jpos.moduleName);
				var nameoption = jpos.name + '_' + index;
				names2.push(nameoption);
				names[jpos.moduleName] = names2;
			}
			else {		
				names2 = names[jpos.moduleName];
				var index = names.indexOf(jpos.moduleName);
				var nameoption = jpos.name + '_' + index;
				var found2 = $.inArray(nameoption, names2) > -1;
				if (!found2) {
					names2.push(nameoption);
					names[jpos.moduleName] = names2;
				}
			}
		});
	});
	var res = '';
	$('.multipleselect').html('');
	jQuery.each(names, function(i, name) {
		res = "";
		jQuery.each(names[name], function(j, name2) {
			res = res + '<option value=' + name2 + '>' + name2.split('_')[0] + '</option>';
		});
		$('.multipleselect').append('<optgroup label="' + name + '">' + res + '</optgroup>');
	});	
	$('.multipleselect').multiselect('rebuild');
*/	
	//$('.multipleselect').multiselect('rebuild');
}

/**************************************************************

SOAP SERVICES: getExperimentSessions, getSessionInfo 
PARAMETER: SessionID (Work session)

Description: Populate experimental sessions (ID) related to a work
			session

**************************************************************/

function getSessionInfoFunction(soapResponse,parameters){
	var obj = soapResponse.toJSON().Body;
	var session = obj.getSessionInfoResponse.return;
	if (typeof session == "object"){
		// Present data to user
		row = "<tr><td>";
		row += session.systemName;
		row += "</td>";
		row += '<td class="text-center">' +  session.user + '</td>';
		// To be filled...
		row += '<td class="text-center" id="experiment-name">' +  'experiment name' + '</td>';
		var startDate = new Date(session.startDate);
		row += '<td class="text-center">' + startDate.toLocaleString() + '</td>';
		var stopDate = new Date(session.stopDate); //Date.parse(session.stopDate);
		row += '<td class="text-center">' + stopDate.toLocaleString() + '</td>';
		row += '</tr>';
		row_object = $(row);
		$('#sessionsInformationTable').append(row_object);
		
		// Get system Id and set the global script variable 'systemId'
        loadSoapManageSystemsWS('getSystemID',{ip:session.IP, name:session.systemName}, getSystemIdFunction);
	}
}

function getExperimentSessionsFunction(soapResponse,parameters) {
	// soapResponseData = soapResponse;
	var obj = soapResponse.toJSON().Body;
	var returnval = obj.getExperimentSessionsResponse.return;
	var experiment_sessions = new Array();
	
	
	// Check return value
	if ($.isArray(returnval)){
		// Two or more sessions
		experiment_sessions = returnval;
	} else if (typeof returnval == "object"){
		// Only one session
		experiment_sessions.push(returnval);
	} // Otherwise no experiemntal sessions are associated
	
	var experiment_name = "";
	jQuery.each(experiment_sessions, function(i, session) {
		// Its the same for every session
		experiment_name = session.experimentName;
		// Add the session ID to table!!!
		// More data to add
		// Add the row !!!
		row = "<tr><td class='sessionid'>";
		row += session.ID;
		row += "</td>";
		row += '<td class="text-center"><img src="img/finished.' + session.sessionFinished + '.png"/></td>';
		var startDate = new Date(session.startDate); // Date.parse(session.startDate);
		row += '<td class="text-center">' + startDate.toLocaleString() + '</td>';
		var stopDate = new Date(session.stopDate); //Date.parse(session.stopDate);
		row += '<td class="text-center">' + stopDate.toLocaleString() + '</td>';
		row += '<td class="text-center"><a href="javascript:;" class="btn btn-default btn-primary">';
		row += '<i class="btn-icon-only fa fa-check selectsession">';
		row += '</i>';
		row += '</a></td></tr>';
		row_object = $(row);
		$('#sessionsTable').append(row_object);
		
		// check if experiment session has data session associated
		loadSoapSessionDataManagementWS('getSessionInfo',{ sessionId: session.ID },getExperimentalSessionInfoFunction);
	});
	
	/// Add the handler
	// Click handler related to the associated session
	$(".selectsession").click(function() {
		var sessionIDval = $(this).closest("tr").find(".sessionid").text();
		var parameters = { sessionId: sessionIDval };
		// Check for session data in experimental data service
		// If yes, data will be loaded
		// otherwise nothing to do (message?)
		$('#names option').remove();
		visibleWidgetSessions($('.marketing .button-icon-minimize'),true);
		$('#sessionselected').html(sessionIDval);
		$('#sessionid').val(sessionIDval);
		
		loadSoapSessionDataManagementWS('getSessionSimpleDataSet',parameters,getSessionSimpleDataSetFunction,1);
		
		loadSoapSessionDataManagementWS('getMaxTimeSession',parameters,getMaxTimeSessionFunction,0);
		
		loadSoapSessionDataManagementWS('getSampleTimeSession',parameters,getSampleTimeSessionFunction,0);
	});
	
	// Fill the id="experiment-name"
	// created on sessionInfoTable
	$('#experiment-name').html(experiment_name);
	
	// Populate info about lab
	// Get XML file in order to buid experimental interface in "live" button
    // systemId is a global variable  defined in related-ws-xml-js
	// and need the #experiment_name component to create original structures
    loadSoapXMLLoaderWS('getXmlConfFile',{systemId:systemId},getXmlConfFileSuccessFunction);
}

function getMaxTimeSessionFunction(soapResponse) {
	var obj = soapResponse.toJSON().Body;
	var returnval = obj.getMaxTimeSessionResponse.return;
	$('#maxtimesession').val(returnval/1000.0);
}

function getSampleTimeSessionFunction(soapResponse) {
	var obj = soapResponse.toJSON().Body;
	var returnval = obj.getSampleTimeSessionResponse.return;
	$('#sampletimesession').val(returnval/1000.0);
	liveTimerTime = parseInt(returnval);
}

// Find parameters
$.extend({
  getUrlParameters: function(){
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
      hash = hashes[i].split('=');
      vars.push(hash[0]);
      vars[hash[0]] = hash[1];
    }
    return vars;
  },
  getUrlParameter: function(name){
    return $.getUrlParameters()[name];
  }
});