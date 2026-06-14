function doPost(e) {
  try {
    var jsonString = e.postData.contents;
    var data = JSON.parse(jsonString);
    
    // Explicitly open the spreadsheet provided by the user
    var ss = SpreadsheetApp.openById("15NxEfUChcHFKuVmiLxYC9aPrj8bRSLW2pttRbvsREuU");
    var sheet = ss.getSheets()[0] || ss.getActiveSheet();
    
    // Add headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp", 
        "Order Reference", 
        "Customer Name", 
        "Customer Email", 
        "Customer Phone", 
        "Total Amount", 
        "Currency", 
        "Items",
        "PDF Link"
      ]);
    }
    
    // Sanitize phone number: strip leading apostrophe if accidentally double-quoted
    var rawPhone = data.customerPhone || "N/A";
    // Store as plain text to prevent formula injection, but without the apostrophe artifact
    var safePhone = rawPhone.replace(/^'+/, ''); // remove any leading apostrophes from raw string
    
    // Append the order row
    var rowData = [
      data.timestamp || new Date().toISOString(),
      data.orderReference || "N/A",
      data.customerName || "N/A",
      data.customerEmail || "N/A",
      safePhone,
      data.totalAmount || 0,
      data.currency || "KES",
      data.items || "N/A",
      data.pdfUrl || "N/A"
    ];
    
    var newRow = sheet.appendRow(rowData);
    
    // Force the phone number cell to plain text format to avoid '#ERROR!' parsing
    var lastRow = sheet.getLastRow();
    var phoneCell = sheet.getRange(lastRow, 5); // Column 5 = Customer Phone
    phoneCell.setNumberFormat('@'); // '@' = plain text
    phoneCell.setValue(safePhone);
    
    // Trigger email notification to Roy Otieno
    sendNotificationEmail(data);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendNotificationEmail(data) {
  var recipient = "roy.otieno@roam-electric.com";
  var subject = "New Roam Energy Order: " + (data.orderReference || "N/A");
  
  var pdfLinkText = data.pdfUrl ? "View PDF Invoice: " + data.pdfUrl : "PDF not available";
  
  var body = "Hi Roy,\n\n" +
             "A new order has been submitted on Roam Energy.\n\n" +
             "Order Details:\n" +
             "- Reference: " + (data.orderReference || "N/A") + "\n" +
             "- Customer Name: " + (data.customerName || "N/A") + "\n" +
             "- Email: " + (data.customerEmail || "N/A") + "\n" +
             "- Phone: " + (data.customerPhone || "N/A") + "\n" +
             "- Total Amount: " + (data.currency || "KES") + " " + (data.totalAmount ? Number(data.totalAmount).toLocaleString() : "0") + "\n" +
             "- Items: " + (data.items || "N/A") + "\n" +
             "- " + pdfLinkText + "\n\n" +
             "This data has been auto-appended to your Google Sheet:\n" +
             "https://docs.google.com/spreadsheets/d/15NxEfUChcHFKuVmiLxYC9aPrj8bRSLW2pttRbvsREuU/edit\n\n" +
             "Best regards,\n" +
             "Roam Energy Automated System";
             
  MailApp.sendEmail(recipient, subject, body);
}
