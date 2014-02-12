var cachedSessionsDB = (function() {
  var tDB = {};
  var datastore = null;

  // TODO: Add methods for interacting with the database here.
  tDB.open = function(callback) {
  	// Database version.
  	var version = 1;
  	// Open a connection to the datastore.
  	var request = indexedDB.open('cachedSessionsDB', version);

  	// Handle datastore upgrades.
  	request.onupgradeneeded = function(e) {
    	var db = e.target.result;
    	e.target.transaction.onerror = tDB.onerror;
    	
		// Delete the old datastore.
    	if (db.objectStoreNames.contains('sessions')) {
      		db.deleteObjectStore('sessions');
    	}

    	// Create a new datastore.
    	var store = db.createObjectStore('sessions', {keyPath: 'sessionId'});
  	};

  	// Handle successful datastore access.
  	request.onsuccess = function(e) {
    	// Get a reference to the DB.
    	datastore = e.target.result;
    	// Execute the callback.
    	callback();
  	};

  	// Handle errors when opening the datastore.
  	request.onerror = tDB.onerror;
	};


	/**
 	* Fetch all of the todo items in the datastore.
 	*/
	tDB.findBySessionId = function(sessionId, success_callback, error_callback) {
  		var db = datastore;
  		var transaction = db.transaction(['sessions'], 'readwrite');
  		var objStore = transaction.objectStore('sessions');

  		var keyRange = IDBKeyRange.only(sessionId);
  		var cursorRequest = objStore.openCursor(keyRange);

	  	var sessionInfo = null;
	
	  	transaction.oncomplete = function(e) {
			// Execute the callback function.
			success_callback(sessionInfo);
	  	};
	
	  	cursorRequest.onsuccess = function(e) {
			var result = e.target.result;
			if (result != null){
				sessionInfo = result.value;
				result.continue();
			} else {
				return;
			}
	  	};
	
	  	cursorRequest.onerror = function (e){
			error_callback(e);
		}
	};
	
	tDB.addSessionInfo = function(sessionId, maxTime,sampleTime, data,callback) {
	  // Get a reference to the db.
	  var db = datastore;
	
	  // Initiate a new transaction.
	  var transaction = db.transaction(['sessions'], 'readwrite');
	
	  // Get the datastore.
	  var objStore = transaction.objectStore('sessions');
		
	  // Create an object for the todo item.
	  var sessionInfoObject = {
		'sessionId': sessionId,
		'maxTime': maxTime,
		'sampleTime': sampleTime,
		'data': data
	  };
	
	  // Create the datastore request.
	  var request = objStore.put(sessionInfoObject);
	
	  // Handle a successful datastore put.
	  request.onsuccess = function(e) {
		// Execute the callback function.
		callback(sessionInfoObject);
	  };
	
	  // Handle errors.
	  request.onerror = tDB.onerror;
	};
	
	/**
	 * Delete item.
	 */
	tDB.deleteSessionInfo = function(sessionId, callback) {
	  var db = datastore;
	  var transaction = db.transaction(['sessions'], 'readwrite');
	  var objStore = transaction.objectStore('sessions');
	
	  var request = objStore.delete(sessionId);
	
	  request.onsuccess = function(e) {
		callback(sessionId);
	  }
	
	  request.onerror = function(e) {
		console.log(e);
	  }
	};

  // Export the tDB object.
  return tDB;
}());