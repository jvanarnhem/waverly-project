//Copyright 2013 Google Inc. All Rights Reserved.
var SPREADSHEET_KEY = "1Dqc7FUJEyVvvCv3_8t9_IJLR-5tmjCoQ4dUFzbNELSg"; //UPDATE WITH CURRENT SPREADSHEET



// Configurable Values

var RESPONSES_SHEET = "Pending";
var COMPLETED_SHEET = "Completed"; // original LOG_SHEET = "Execution Log"
var SETTINGS_SHEET = "__Settings";
var CACHE_SETTINGS = false;
var SETTINGS_CACHE_TTL = 900;

// Constants
var BLANK_STATE = undefined;
var PENDING_STATE = "PENDING";
var COMPLETED_STATE = "COMPLETED"; // original APPROVED_STATE = "APPROVED"
var EMAIL_REGEX = new RegExp("[a-zA-Z+0-9\.-]+@[a-zA-Z0-9\.-]+", 'i'); 
 
function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_KEY);
}

// Returns true if the cell where cellData was read from is empty.
// Arguments:
//   - cellData: string
function isCellEmpty(cellData) {
  return typeof(cellData) == "string" && cellData == "";
}

// Returns true if the character char is alphabetical, false otherwise.
function isAlnum(char) {
  return char >= 'A' && char <= 'Z' ||
    char >= 'a' && char <= 'z' ||
    isDigit(char);
}

// Returns true if the character char is a digit, false otherwise.
function isDigit(char) {
  return char >= '0' && char <= '9';
}

function SheetHandler(sheet) {
  var _sheet = sheet;
  var _data = getRowsData(_sheet);
  
  var _markPending = function(d) {
    
    d.state = PENDING_STATE;
    d.identifier = Utils.generateUUID();
    
    admin_email = SETTINGS.ADMIN_EMAILS.match(EMAIL_REGEX);
    
    var scriptUri = ScriptApp.getService().getUrl();
    Logger.log("URL: "+scriptUri);
    // hack some values on to the data just for email templates.
    d.approval_url = scriptUri + "?i=" + d.identifier + '&state=' + APPROVED_STATE;
    d.deny_url = scriptUri + "?i=" + d.identifier + '&state=' + DENIED_STATE;
    d.admin_email = admin_emails

    message = Utils.processTemplate(SETTINGS.ADMIN_EMAIL_BODY, d);
    subject = Utils.processTemplate(SETTINGS.ADMIN_EMAIL_SUBJECT, d);
    
    MailApp.sendEmail(admin_email,subject,"",{ htmlBody: message });
    
    //setRowData(_sheet, d);
  }
  
  var _getDataByKey = function(k) {
    row = undefined;
    _data.forEach(function(d) {
      if (d.identifier == k) {
        row = d;
      }
    });
    return row;
  }
  
  var processSheet = function() {
    _data.forEach(function(d) {
      if(d.state == BLANK_STATE) {
        _markPending(d);
      }
    });
  }

  var approveByKey = function(k, user) {
    var d = _getDataByKey(k);
    d.state = COMPLETED_STATE;
    d.actor = user;
    
    var message = Utils.processTemplate(SETTINGS.USER_APPROVAL_EMAIL, d);
    var subject = Utils.processTemplate(SETTINGS.USER_APPROVAL_EMAIL_SUBJECT, d);
    MailApp.sendEmail(d.emailAddress,subject,"",{ htmlBody: message });
    
    if(SETTINGS.SEND_APPROVAL_NOTICE_EMAIL == 1) {
      var message = Utils.processTemplate(SETTINGS.APPROVAL_NOTICE_EMAIL, d);
      var subject = Utils.processTemplate(SETTINGS.APPROVAL_NOTICE_EMAIL_SUBJECT, d);
      MailApp.sendEmail(SETTINGS.APPROVAL_NOTICE_EMAIL_TO, subject, "",{ htmlBody: message });
    }
    
    
    setRowData(_sheet, d);
  }

  return {
    'processSheet': processSheet,
    'approveByKey': approveByKey,
    'denyByKey': denyByKey
  }
};

function authorize() {
  var mail = MailApp.getRemainingDailyQuota();
}

// ----------------------------------------------------------------------------------- GOOD STUFF BELOW
// Globals
var cache = JSONCacheService();
var SETTINGS = getSettings();

function JSONCacheService() {
  var _cache = CacheService.getPublicCache();
  var _key_prefix = "_json#";
  
  var get = function(k) {
    var payload = _cache.get(_key_prefix+k);
    if(payload !== undefined) {
      JSON.parse(payload);
    }
    return payload
  }
  
  var put = function(k, d, t) {
    _cache.put(_key_prefix+k, JSON.stringify(d), t);
  }
  
  return {
    'get': get,
    'put': put
  }
}

function getSettings() { 
  if(CACHE_SETTINGS) {
    var settings = cache.get("_settings");
  }
  
  if(settings == undefined) {
    var sheet = getSpreadsheet().getSheetByName(SETTINGS_SHEET);
    var values = sheet.getDataRange().getValues();
  
    var settings = {};
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      settings[row[0]] = row[1];
    }
    
    cache.put("_settings", settings, SETTINGS_CACHE_TTL);
  }
  //Logger.log(settings);
  return settings;
}

// Uses namespacing to create an object called Utils
function Utils() {}

Utils.generateUUID = function() {
  var d = new Date().getTime();
  var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = (d + Math.random()*16)%16 | 0;
    d = Math.floor(d/16);
    return (c=='x' ? r : (r&0x7|0x8)).toString(16);
  });
  return uuid;
}

Utils.processTemplate = function(template, object) {
  // Do a cheap string replace on several template values.
  if(template == undefined) {
    return "NOT DEFINED";
  }
  for(var k in object) {
     var objectForPrint = object[k];
     if (object[k] instanceof Date) {  
      objectForPrint = object[k].toDateString();
    } else {  
      objectForPrint = object[k];
    }
    template = template.replace(SETTINGS.TEMPLATE_OPEN_TAG + k + SETTINGS.TEMPLATE_CLOSE_TAG, objectForPrint);
    
  }
  return template
}

function testStuff() {
  Logger.log(SETTINGS.SPREADSHEET_ID);
}