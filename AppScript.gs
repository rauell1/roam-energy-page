// ── Google Apps Script for Roam Energy Orders Sheet ──────────────────────────
// Spreadsheet: https://docs.google.com/spreadsheets/d/15NxEfUChcHFKuVmiLxYC9aPrj8bRSLW2pttRbvsREuU
//
// doPost handles two actions:
//   (default) – append a new order row
//   action:"update" – find the row by orderReference and update Status/Salesperson
//
// onSheetEdit is an installable trigger (set up via Triggers menu → onEdit event)
// that pushes Status/Salesperson cell changes back to Supabase via /api/orders-sync.
// Script Properties required:
//   ORDERS_SYNC_URL    = https://roam-energy.vercel.app/api/orders-sync
//   ORDERS_SYNC_SECRET = <same value as ORDERS_SYNC_SECRET Vercel env var>

var SPREADSHEET_ID = "15NxEfUChcHFKuVmiLxYC9aPrj8bRSLW2pttRbvsREuU";
var SHEET_NAME     = "Sheet1";

// Column indices (1-based)
var COL_TIMESTAMP   = 1;
var COL_REF         = 2;
var COL_NAME        = 3;
var COL_EMAIL       = 4;
var COL_PHONE       = 5;
var COL_AMOUNT      = 6;
var COL_CURRENCY    = 7;
var COL_ITEMS       = 8;
var COL_STATUS      = 9;
var COL_SALESPERSON = 10;
var COL_EXPIRY      = 11;
var COL_PDF         = 12;

function getSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp", "Order Reference", "Customer Name", "Customer Email",
      "Customer Phone", "Total Amount", "Currency", "Items",
      "Status", "Salesperson", "Expiry Date", "PDF Link"
    ]);
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Route to update handler when admin panel pushes a change
    if (data.action === "update") {
      return handleOrderUpdate(data);
    }

    // Default: append a new order row
    var sheet = getSheet();
    ensureHeaders(sheet);

    var now = new Date();
    var expiryDate = new Date();
    expiryDate.setDate(now.getDate() + 14);

    var safePhone = (data.customerPhone || "N/A").replace(/^'+/, "");

    sheet.appendRow([
      data.timestamp  || now.toISOString(),
      data.orderReference || "N/A",
      data.customerName   || "N/A",
      data.customerEmail  || "N/A",
      safePhone,
      data.totalAmount || 0,
      data.currency    || "KES",
      data.items       || "N/A",
      data.status      || "Draft",
      data.salesperson || "",
      expiryDate,
      data.pdfUrl      || "N/A"
    ]);

    // Format phone as plain text and expiry as date
    var lastRow  = sheet.getLastRow();
    var phoneCell  = sheet.getRange(lastRow, COL_PHONE);
    phoneCell.setNumberFormat("@");
    phoneCell.setValue(safePhone);

    var expiryCell = sheet.getRange(lastRow, COL_EXPIRY);
    expiryCell.setNumberFormat("yyyy-mm-dd");

    sendNotificationEmail(data, expiryDate);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Find the row with matching orderReference and update Status + Salesperson
function handleOrderUpdate(data) {
  try {
    var sheet   = getSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: "not_found" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var refs = sheet.getRange(2, COL_REF, lastRow - 1, 1).getValues();
    for (var i = 0; i < refs.length; i++) {
      if (refs[i][0] === data.orderReference) {
        var rowNum = i + 2; // +2 because data starts at row 2 (row 1 = headers)
        if (data.status      !== undefined) sheet.getRange(rowNum, COL_STATUS).setValue(data.status);
        if (data.salesperson !== undefined) sheet.getRange(rowNum, COL_SALESPERSON).setValue(data.salesperson);
        return ContentService
          .createTextOutput(JSON.stringify({ status: "updated", row: rowNum }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "not_found", ref: data.orderReference }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Installable trigger: set this up via Extensions → Apps Script → Triggers
// Event type: "From spreadsheet" → "On edit"
function onSheetEdit(e) {
  var sheet = e.source.getActiveSheet();
  if (sheet.getName() !== SHEET_NAME) return;

  var row = e.range.getRow();
  var col = e.range.getColumn();

  // Only react to Status or Salesperson column edits (not header row)
  if (row <= 1) return;
  if (col !== COL_STATUS && col !== COL_SALESPERSON) return;

  var orderRef   = sheet.getRange(row, COL_REF).getValue();
  if (!orderRef || orderRef === "N/A") return;

  var status      = sheet.getRange(row, COL_STATUS).getValue();
  var salesperson = sheet.getRange(row, COL_SALESPERSON).getValue();

  var props     = PropertiesService.getScriptProperties();
  var syncUrl    = props.getProperty("ORDERS_SYNC_URL");
  var syncSecret = props.getProperty("ORDERS_SYNC_SECRET");
  if (!syncUrl || !syncSecret) return;

  try {
    UrlFetchApp.fetch(syncUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({
        syncSecret:    syncSecret,
        orderReference: orderRef,
        status:        status,
        salesperson:   salesperson,
      }),
      muteHttpExceptions: true,
    });
  } catch (err) {
    Logger.log("Orders sync error: " + err.toString());
  }
}

function sendNotificationEmail(data, expiryDate) {
  var recipient = "roy.otieno@roam-electric.com";
  var subject   = "New Roam Energy Order: " + (data.orderReference || "N/A");

  var formattedExpiry = Utilities.formatDate(
    expiryDate,
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );

  var body =
    "Hi Roy,\n\n" +
    "A new order has been submitted on Roam Energy.\n\n" +
    "Order Details:\n" +
    "- Reference: "        + (data.orderReference || "N/A") + "\n" +
    "- Customer Name: "    + (data.customerName   || "N/A") + "\n" +
    "- Email: "            + (data.customerEmail  || "N/A") + "\n" +
    "- Phone: "            + (data.customerPhone  || "N/A") + "\n" +
    "- Total Amount: "     + (data.currency || "KES") + " " +
                             (data.totalAmount ? Number(data.totalAmount).toLocaleString() : "0") + "\n" +
    "- Items: "            + (data.items || "N/A") + "\n" +
    "- Status: "           + (data.status || "Draft") + "\n" +
    "- Assigned Salesperson: " + (data.salesperson || "Unassigned") + "\n" +
    "- Expiry Date: "      + formattedExpiry + "\n" +
    "- PDF Invoice: "      + (data.pdfUrl || "N/A") + "\n\n" +
    "View Sales Dashboard:\n" +
    "https://docs.google.com/spreadsheets/d/15NxEfUChcHFKuVmiLxYC9aPrj8bRSLW2pttRbvsREuU/edit\n\n" +
    "Best regards,\nRoam Energy Automated System";

  MailApp.sendEmail(recipient, subject, body);
}
