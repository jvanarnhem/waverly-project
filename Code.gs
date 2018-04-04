function doGet(e) {
  var status = e.parameter.idNum;
  if (status) {
    var template = HtmlService.createTemplateFromFile('admin');
  }
  else {
    var template = HtmlService.createTemplateFromFile('initial');
  }
  var html = template.evaluate();
  return HtmlService.createHtmlOutput(html);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

function submitReport(data) { 
  var data3 = JSON.parse(data);
  
  try {
    var sheet = getSpreadsheet().getSheetByName('Pending');
    var newStuff = [];
    var subNumber = +new Date();
    newStuff.push(subNumber);
    Logger.log(newStuff);
    for (var i in data3) {
      if(typeof data3[i]=="object"){
        var dataString = data3[i].join(", ");
        newStuff.push(dataString);
      } else {
        newStuff.push(data3[i]);
      }
    }
    
    sheet.appendRow(newStuff);
    
    var htmlBody = "<p>The following discipline report was submitted:</p>";
    htmlBody += "<p>Submitter: " + "value" + "</p>";
    htmlBody += "<p>Date submitted: " + "value" + "</p>";
      htmlBody += "<p>Student involved: " + "value" + "</p>";
    htmlBody += "<p>&nbsp;</p>";
    htmlBody += '<p>Click <a href="' + ScriptApp.getService().getUrl()
       + '?idNum=' + subNumber
       + '">here</a> to see full details of report.</p>';
 
    // CHANGE THIS TO "jcarey@ofcs.net, lbarrett@ofcs.net, hhamilton@ofcs.net, kcillo@ofcs.net",
    MailApp.sendEmail({
      to: "javanarnhem@gmail.com",
      subject: "Action Required: Discipline Report from " + "value",
      htmlBody: htmlBody
    });
    return "Submission successful. You may close this window now.";
    
  } catch(err) {
    return "Something went wrong.";
  }
}

function moveCompleted() {
  // moves a row from a sheet to another when a magic value is entered in a column
  // adjust the following variables to fit your needs
  // see https://productforums.google.com/d/topic/docs/ehoCZjFPBao/discussion

  var sheetNameToWatch = "Pending";

  var columnNumberToWatch = 16; // column A = 1, B = 2, etc.
  //var valueToWatch = "APPROVED";
  var sheetNameToMoveTheRowTo = "Completed";
  
  var data = subSheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    Logger.log(data[i][columnNumberToWatch]);
    if (data[i][columnNumberToWatch] != "") {
      var targetSheet = ss.getSheetByName(sheetNameToMoveTheRowTo);
      var targetRange = targetSheet.getRange(targetSheet.getLastRow() + 1, 1);
      subSheet.getRange(i+1, 1, 1, subSheet.getLastColumn()).moveTo(targetRange);
      subSheet.deleteRow(i+1);
    }
  };
}
