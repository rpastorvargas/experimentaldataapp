// Global variables


// VARIABLES GLOBALES APARTADO LIVE

// Variable usada para definir el tiempo en el que nos encontramos
var interval = 0;
// Variable en la que guardamos nuestro objeto gráfica para establecer los datos en el timeout
var plot;
// Variable para ir metiendo en cada intervalo el dato correspondiente y ir desplazando
var data = [];
// Variable en la que guardamos el número de puntos que pintamos por muestra
var	totalPoints = 2000;
// Variable que indica cada cuantos milisegundos ejecutamos nuestra función de SetInterval
var updateInterval = 1000;
// Variable que representa al temporizador y que se usa en live...
var liveTimer = null;
// Variable que representa el intervalo de ejecución de la tarea asociada al live timer
var liveTimerTime = 1000;
// Variable for index in the points
var liveTimerIndex = 0;
// variable for samples in the live graphics
var samplesOnLiveGraphics = 100;

var getMaxValueY = 0;

var updateTimeOut = null;

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

// Data to be painted in the live graph
var dataGraphLive = [];


/*************************************************************************
	Live graphics otions
*************************************************************************/
var options = {
    series: {
        lines: {
            show: true,
            lineWidth: 2 //1.2,
            //fill: true
        }
    },
    /* yaxis: {
        min: 0,
        max: getMaxValueY    
    }, */
	legend: {        
        labelBoxBorderColor: "#fff"
    },
    grid: {                
        backgroundColor: "#FFFFFF",
        tickColor: "#F0F8FF"
    }
};


$(document).ready(function() {
		
	// Create db to cache session data!!!
	cachedSessionsDB.open(function(){
		console.log("Sessions Caché DB created or updated");
	});
	
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
	
	// Live control
	$("#btnStartLive").click(function(){
		$("#btnStartLive").addClass("hidden");
		$("#btnPauseLive").removeClass("hidden");
		// Start the "live timer" using the sampleTime session
		liveTimer = window.setInterval(	function(){liveTimerTask()},liveTimerTime);
		// Disable rangebar
		$('#rangebar').jqxSlider({ disabled:true }); 
	});
	
	$("#btnPauseLive").click(function(){
		doPause();
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
				
				// TODO: Change size in original place
				var iframefind = $(div).find('iframe');
				iframefind.width('100%');
			} else {
				$(div).hide();
			}
		});
	});

	$("#showGraphLive").click(function() {
		// clearTimeout(updateTimeOut);
		// interval = 0;
		// getMaxValueY = 0;
		// dataGraphLive = [];
		$("#liveShowView").hide();
		$("#liveShowGraph").show();
		// Calculate MaxValue for Yaxis
		// maxvalueYAxis = getMaxValueYAxis();
		
		// sample time
		sampleTime = parseFloat($('#sampletimesession').val())*1000;
		//paintGraphInterval(liveTimerIndex,sampleTime,samplesOnLiveGraphics);
		liveTimerTask();
		
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
		//paintGraph();
	});
	$("#shortcutlive").click(function() {
		$(".shortcuts > a").removeClass("active");
		$("#shortcutlive").addClass("active");
		$("#sessioninfolive").show("fast").fadeIn("fast");
		$("#sessioninfographics").hide("fast").fadeOut("fast");
		$("#sessioninfoinfo").hide("fast").fadeOut("fast");
		configureProgressBar();
		// Update
		liveTimerTime = parseFloat($('#sampletimesession').val())*1000;
	});

	$('#sltShowGraph').change(function(){
		dataGraphLive = [];
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
		var sessionData = dataSession.data;
		
		if (vars_selected.length>0){
			dataToDownload = convertToCSV(sessionData,vars_selected);
			// Create a url object
			a = document.createElement("a");
			blob = new Blob([dataToDownload], {"type":"application\/octet-stream"});
			a.href = window.URL.createObjectURL(blob);
			a.download = $('#sessionselected').text() + ".csv";
			a.click();
		}
	});
	
});

function doPause() {
	$("#btnStartLive").removeClass("hidden");
	$("#btnPauseLive").addClass("hidden");
	window.clearInterval(liveTimer);
	liveTimer = null;
	$('#rangebar').jqxSlider({ disabled:false }); 
}

function getMaxValueYAxis() {

	console.log('Entramos');

	var valSelect = $("#sltShowGraph option:selected").val();
	var moduleName = valSelect.split('_')[0];
	var namesSelect = valSelect.split('_')[1].split('-');
	for (i = 0; i < namesSelect.length; i++) {
		var nameSelect = namesSelect[i].split('~')[0];
		jQuery.each(dataSession.data, function(i, ipos) {
			var vars = JSON.parse(ipos);
			jQuery.each(vars.vars, function(j, jpos) {
				if (nameSelect == jpos.name) {
					if (jpos.value > getMaxValueY) {
						getMaxValueY = parseInt(jpos.value);
					}
				}
			});
		});
	}
	console.log('Maximo valor ' + getMaxValueY);
}

/******************************************************************




******************************************************************/
function liveTimerTask(){
	time = (liveTimerIndex*liveTimerTime)/1000.0;
	// Take a data set on point i and update graphs and views !!!
	$('#liveTime').html("T: " + time.toFixed(1) );
	
	maxtimesession = parseFloat($('#maxtimesession').val());
	sampleTime = parseFloat($('#sampletimesession').val())*1000;
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
					// console.log("image(" + length_new + ") --> " + time);
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
		// 100 samples
		updateLiveGraph(liveTimerIndex,sampleTime,samplesOnLiveGraphics);
		
		// Update progressbar
		updateProgressBar(time);
		// Update index for samples/time
		liveTimerIndex++;
	} else {
		$('#rangebar').jqxSlider('setValue', 0);
		$('#liveTime').html("T: 0.0");
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

/******************************************************************

*****************************************************************/

function updateProgressBar(timeValue){
	$('#rangebar').jqxSlider('setValue', timeValue);
}

function configureProgressBar() {
	maxtimesession = parseFloat($('#maxtimesession').val());
	sampleTime = parseFloat($('#sampletimesession').val());
	barOptions = { theme: 'bootstrap', 
		max: maxtimesession,
		min: 0,
		step: sampleTime,
		width: '100%',
		showButtons:  false,
		ticksPosition: 'both',
		value: 0 };
		
		
	$("#rangebar").jqxSlider(barOptions);
	$('#rangebar').bind('change', function (event) {	
		// udpate only if not play button is presses
		running = $("#btnStartLive").hasClass('hidden');
		if (!running){
			// Time
			var newValue = event.args.value;
			// Calculate new value
			sampleTime = parseFloat($('#sampletimesession').val());
			// calculus must be fixed to sample time interval values!!!
			var new_liveTimerIndex = parseInt(newValue/sampleTime);
			if (liveTimerIndex != new_liveTimerIndex){
				// Update
				// console.log("new: " +  new_liveTimerIndex + " <-- old: " + liveTimerIndex);
				liveTimerIndex = new_liveTimerIndex;
				liveTimerTask();	
			}
		} 
    });
	
	//progressbar = $('#progressbar');
	
	//progressbar.attr('max',maxtimesession);
	$('.progress-value').html(0 + ' %');
	$('#rangebar').val(0);
	$('#rangebar').attr('max',maxtimesession);
	$('#rangebar').attr('step',sampleTime);
} 

function paintGraphInterval(liveTimerIndex,sampleTime,samplesOnLiveGraphics) {
	getGraphDataInterval("#sltShowGraph option:selected",interval,sampleTime,samplesOnLiveGraphics);
	//options.yaxis.max = getMaxValueY  + (getMaxValueY/5);
	plot = $.plot($("#placeholder2"), dataGraphLive, options);
	plot.setupGrid();
	updateLiveGraph();
}

// Time in ms
function updateLiveGraph(liveTimerIndex,sampleTime, samplesOnLiveGraphics) {
	// maxtimesession = parseFloat($('#maxtimesession').val()) * 1000;
	getGraphDataInterval("#sltShowGraph option:selected",liveTimerIndex,sampleTime,samplesOnLiveGraphics);
	$.plot($("#placeholder2"), dataGraphLive, options);
	
	/*interval = interval + 1000;	
	if (interval <= maxtimesession) {
		updateTimeOut = setTimeout(update, updateInterval);
	} */
}

function getGraphDataInterval(selector,liveTimerIndex,sampleTime,samplesOnLiveGraphics) {
	$(selector).each(function() {
		var moduleName = $(this).val().split('_')[0];
		var namesSelect = $(this).val().split('_')[1].split('-');
		for (var i = 0; i < namesSelect.length; i++) {
			dataGraphLive.shift();
		}
		for (var i = 0; i < namesSelect.length; i++) {
			var nameValues = namesSelect[i].split('~');
			var nameSelect = nameValues[0];
			var color = "#" + nameValues[1];
			getGraphDataIntervalSimple(liveTimerIndex,sampleTime,samplesOnLiveGraphics,moduleName,nameSelect,color);
		}
	});
	// console.log(dataGraphLive);
}

function getGraphDataIntervalSimple(liveTimerIndex,sampleTime,samplesOnLiveGraphics, moduleName,nameSelect,color) {
	var dataGraph2 = [];
	// samplesOnLiveGraphics = 100; // 10 seconds (depens on sampleTime of experimental session
								 // This case: 0.1 s --> 0.1x100 = 10 s
	if (typeof liveTimerIndex != "undefined"){ 
		end = liveTimerIndex;
		start = liveTimerIndex - samplesOnLiveGraphics;
		if (start<0){
			start = 0;
		}
		// console.log("liveTimerIndex: " + liveTimerIndex);
		// console.log("data from index: " + start + " to " + end);
		dataInInterval = dataSession.data.slice(start,end);
		
		jQuery.each(dataInInterval, function(i, ipos) {
			var vars = JSON.parse(ipos);
			var tickSealedTime = vars.sealed_time;
			jQuery.each(vars.vars, function(j, jpos) {
				if (nameSelect == jpos.name && moduleName == jpos.moduleName) {
					// time in ms
					dataGraph2.push([tickSealedTime/1000, jpos.value]);
					return false;
				}
			});
			
		});
		dataGraphLive.push( {label: nameSelect, data: dataGraph2, color: color } );
	}
}

function paintGraph() {
	getGraphData("#names option:selected");
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
		//var nameSelect = $(this).val().split('(')[0].split('_')[0];
		// var moduleName = $(this).parent().attr( "label" );
		var hash_value = $(this).val(); 
		var nameSelect = "";
		var dataGraph2 = [];
		// dataSession stores the session data !!!
		jQuery.each(dataSession.data, function(i, ipos) {
			var vars = JSON.parse(ipos);
			var tickSealedTime = vars.sealed_time;
			jQuery.each(vars.vars, function(j, jpos) {
				// jpos contains the variable 
				var_hash_value = getHashValue(jpos);
				if (hash_value == var_hash_value) {
					dataGraph2.push([tickSealedTime/1000, jpos.value]);
					// Set the name
					nameSelect = jpos.name;
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
	
	// Save in localstorage
	maxTime = parseFloat($('#maxtimesession').val());
	sampleTime = parseFloat($('#sampletimesession').val());
	// saveCachedDataSession(parameters.sessionId,maxTime,sampleTime,dataSession);
	cachedSessionsDB.addSessionInfo(parameters.sessionId,maxTime,sampleTime,dataSession, 
			function(sessionInfoObject){
				console.log("Session data saved: " + sessionInfoObject.sessionId);
				msg = $('#sessionselected_source_webservice').html();
				msg += "<br/>Data has been stored in the local cache";
				$('#sessionselected_source_webservice').html(msg);
			}
	);
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
		row += '<td class="text-center"><a href="javascript:;" class="btn btn-default btn-primary" title="Load data">';
		row += '<i class="btn-icon-only fa fa-check selectsession">';
		row += '</i></a> ';
		row += '<a href="javascript:;" class="btn btn-default btn-primary" title="Refresh Cache">';
		row += '<i class="btn-icon-only fa fa-rotate-right refreshcache">';
		row += '</i>';
		row += '</a></td></tr>';
		row_object = $(row);
		$('#sessionsTable').append(row_object);
		
		// check if experiment session has data session associated
		loadSoapSessionDataManagementWS('getSessionInfo',{ sessionId: session.ID },getExperimentalSessionInfoFunction);
	});
	
	/// Add the handlers
	$(".refreshcache").click(function() {
		var sessionIDval = $(this).closest("tr").find(".sessionid").text();
		cachedSessionsDB.deleteSessionInfo(sessionIDval, 
			function(){
				$( "#sessioninfo" ).addClass("hidden");
				console.log("Cache deleted for session " + sessionIDval);
			}
		);
	});
	// Click handler related to the associated session
	$(".selectsession").click(function() {
		
		old_session = $('#sessionselected').html();
		
		var sessionIDval = $(this).closest("tr").find(".sessionid").text();
		var parameters = { sessionId: sessionIDval };
		// Check for session data in experimental data service
		// If yes, data will be loaded
		// otherwise nothing to do (message?)
		$('#names option').remove();
		visibleWidgetSessions($('.marketing .button-icon-minimize'),true);
		$('#sessionselected').html(sessionIDval);
		$('#sessionid').val(sessionIDval);
		
		// This must be done if the sessionId selected is diferent from
		// actual data
		if (old_session != "" &&
				old_session != sessionIDval){
			// Call click info button !!!
			$('#shortcutinfo').click();
			// Reset graph and live views !!!
			paintGraph(); // None selected
			// Restore the default behavouir
			$("#liveShowView").hide();
			$("#liveShowGraph").hide();
			// stop the timer !!!
			if ($('#btnStartLive').hasClass('hidden')){
				// running
				// stop it
				$("#btnPauseLive").click();
			}
			// reset values for live 
			liveTimerIndex = 0;
		}
		// Look for cached data
		cachedSessionsDB.findBySessionId(sessionIDval, 
			function (sessionInfoData){
				if (sessionInfoData != null){
					// Data loaded !!!
					console.log("Data loaded from cache for sessionId: " + sessionInfoData.sessionId);
					dataSession = sessionInfoData.data;
					$('#maxtimesession').val(sessionInfoData.maxTime);
					$('#sampletimesession').val(sessionInfoData.sampleTime);
					paintMultipleSelect();
					$( "#sessioninfo" ).removeClass("hidden");
					// Warn to user !!
					$('#sessionselected_source_cache').removeClass('hidden');
					$('#sessionselected_source_webservice').addClass('hidden');
				} else {
					// Data is not loaded
					// get from services source
					console.log('Cargamos SOAP');
					loadSoapSessionDataManagementWS('getMaxTimeSession',parameters,getMaxTimeSessionFunction,0);
					loadSoapSessionDataManagementWS('getSampleTimeSession',parameters,getSampleTimeSessionFunction,0);
					loadSoapSessionDataManagementWS('getSessionSimpleDataSet',parameters,getSessionSimpleDataSetFunction,1);
					$('#sessionselected_source_cache').addClass('hidden');
					$('#sessionselected_source_webservice').removeClass('hidden');
				}
			},
			function (error){
				console.log(error);
			}
		);
		
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