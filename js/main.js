$(document).ready(function() {
	
	$('.multipleselect').multiselect();
	
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
	workSessionId = "e4039c4e21d54708a9ea2d0a966ee1c0";
	
	// Populate the session Info table
	loadSoapSessionsWS("getSessionInfo",{sessionId:workSessionId},getSessionInfoFunction);
	// Populate experimental sessions from a work session
	loadSoapSessionsWS("getExperimentSessions",{sessionID:workSessionId},getExperimentSessionsFunction);
	
	$("#generarGrafica").click(function() {
		paintGraph();
	});
	
	$("#startlive").click(function() {
		$('#progressbar').val(0);
		$('#rangebar').val(0);
		/*if (plot !== "undefined") {
			plot.shutdown();
		}
		*/
		paintGraphInterval();
		updateProgressBar();
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
});

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

var interval = 0;
var plot;
function paintGraphInterval() {
	getGraphDataInterval("#names2 option:selected",interval,interval + 1000);
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

var data = [],
	totalPoints = 200;

var updateInterval = 10;
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
	
	var nameSelect = $("#names2").val();
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
		var nameSelect = $(this).val();
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
				return '<a class="graphlegend">'+label+'</a>';
			}
		}
	});
}

var soapResponseData;
var maxtimesession;
var dataGraph = [];

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
		var nameSelect = $(this).val().split('_')[0];
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
	var names = [];
	var names2 = [];
	$( "#sessioninfo" ).removeClass("hidden");
	soapResponseData = soapResponse;
	var obj = soapResponseData.toJSON().Body;
	var returnval = obj.getSessionSimpleDataSetResponse.return;
	jQuery.each(returnval.data, function(i, ipos) {
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
			res = res + '<option value=' + name2 + '>' + name2 + '</option>';
		});
		$('.multipleselect').append('<optgroup label="' + name + '">' + res + '</optgroup>');
	});	
	$('.multipleselect').multiselect('rebuild');
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
		loadSoapExperimentSessionsWS('getSessionInfo',{ sessionId: session.ID },getExperimentalSessionInfoFunction);
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
		
		loadSoapExperimentSessionsWS('getSessionSimpleDataSet',parameters,getSessionSimpleDataSetFunction,1);
		
		loadSoapExperimentSessionsWS('getMaxTimeSession',parameters,getMaxTimeSessionFunction,0);
		
		loadSoapExperimentSessionsWS('getSampleTimeSession',parameters,getSampleTimeSessionFunction,0);
	});
	
	// Fill the id="experiment-name"
	// created on sessionInfoTable
	$('#experiment-name').html(experiment_name);
}

function getMaxTimeSessionFunction(soapResponse) {
	var obj = soapResponse.toJSON().Body;
	var returnval = obj.getMaxTimeSessionResponse.return;
	$('#maxtimesession').val(returnval);
}

function getSampleTimeSessionFunction(soapResponse) {
	var obj = soapResponse.toJSON().Body;
	var returnval = obj.getSampleTimeSessionResponse.return;
	$('#sampletimesession').val(returnval);
}

/**************************************************************
	
	FUNCIONES GENERICAS LLAMADAS A WEB SERVICES

**************************************************************/
function loadSoapExperimentSessionsWS(method,parameters,successfunction,hideloading) {
	hideloading = typeof hideloading !== 'undefined' ? hideloading : 1;
	$("#divloading").removeClass("hidden");
	$.soap({
		url: 'http://lab.scc.uned.es:8080/axis2/services/SessionDataManagementWS/',
		method: method,
		
		appendMethodToURL: true, 
		
		params: parameters,

		namespaceQualifier: 'data',                     // used as namespace prefix for all elements in request (optional)
		namespaceURL: 'http://data.sessions.ws.related.scc.uned.es',
		
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
		enableLogging: true   
	});
}

function loadSoapSessionsWS(method,parameters,successfunction) {
	var result;
	$("#divloading").removeClass("hidden");
	$.soap({
		url: 'http://lab.scc.uned.es:8080/axis2/services/SessionsWS_v2/',
		method: method,

		appendMethodToURL: true, 
		
		params: parameters,

		namespaceQualifier: 'sessions',                     // used as namespace prefix for all elements in request (optional)
		namespaceURL: 'http://sessions.ws.web.related.scc.uned.es',
		
		success: function (soapResponse) {
			$("#divloading").addClass("hidden");
			eval(successfunction(soapResponse,this.data));
		},		
		error: function (soapResponse) {
			// show error
			$("#divloading").addClass("hidden");
			document.write("ERROR: " + soapResponse);
		},
		// debugging
		enableLogging: true   
	});
}