// JavaScript Document

function saveCachedDataSession(sessionId, max_time, sample_time, data){
	var saved = false;
	if (localStorage){
		cached_data = localStorage.getItem(sessionId);
		if (cached_data == null){
			sessionInfo = new Object();
			sessionInfo.maxTime = max_time;
			sessionInfo.sampleTime = sample_time;
			sessionInfo.data = data; 
			sessionInfo_to_string = JSON.stringify(sessionInfo);
			try {
				localStorage.setItem(sessionid,sessionInfo_to_string);
				saved = true;
			} catch (error){
				console.log("error saving in localstorage: " + error);
				console.log("data size: " + sessionInfo_to_string.length);		
			}
		} else {
			console.log("session data is cached --> sessionID: " + sessionId);
		}
	} else {
		console.log("LocalStorage is not defined...");
	}
	return saved;
}

function loadCachedDataSession(sessionId){
	var loaded_data = null;
	if (localStorage){
		// returns null if key is not present
		cached_data = localStorage.getItem(sessionId);
		if (cached_data != null){
			loaded_data = JSON.parse(cached_data);
		} else {
			console.log("session data is not cached --> sessionID: " + sessionId);
		}
	} else {
		console.log("LocalStorage is not defined...");
	}
	return loaded_data;
}