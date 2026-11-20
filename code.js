/**
 * ============================================================================
 * GOOGLE APPS SCRIPT: NSE RSI & SHEET DATA API
 * File: code.js
 * ============================================================================
 * 
 * INSTRUCTIONS FOR DEPLOYMENT:
 * 1. Open your Google Sheet containing the NSE data.
 * 2. In the top menu, click Extensions > Apps Script.
 * 3. Delete any code in the editor and paste this entire code.js script.
 * 4. Click 'Save' (disk icon) or press Ctrl+S / Cmd+S.
 * 5. Click 'Deploy' > 'New deployment'.
 * 6. Select type: 'Web app' (gear icon > Web app).
 * 7. Set configuration:
 *    - Description: NSE RSI Screener API
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone" (crucial for React app client-side fetch without auth blocks)
 * 8. Click 'Deploy' and copy the 'Web app URL' (ends with /exec).
 * 9. Paste that URL into the React app's Google Apps Script URL configuration or in src/config.ts!
 * ============================================================================
 */

/**
 * Handles HTTP GET requests to serve Google Sheet data as JSON to the React App
 * @param {Object} e - Event parameter containing query params
 * @return {ContentService.TextOutput} JSON payload of sheet records
 */
function doGet(e) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getActiveSheet();
    const data = sheet.getDataRange().getValues();

    if (!data || data.length === 0) {
      return createJsonResponse({
        status: "error",
        message: "No data found in the active sheet",
        data: []
      });
    }

    // Attempt to extract 'Last Update' timestamp from top rows
    let lastUpdate = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    for (let r = 0; r < Math.min(5, data.length); r++) {
      for (let c = 0; c < data[r].length; c++) {
        const val = String(data[r][c] || "").trim();
        if (val.toLowerCase().includes("last update") || val.toLowerCase().includes("last updated")) {
          // Check adjacent cell or same cell
          if (data[r][c + 1]) {
            lastUpdate = String(data[r][c + 1]);
          } else {
            lastUpdate = val.replace(/last update[d]?\s*[:\t]*/i, "").trim() || lastUpdate;
          }
          break;
        }
      }
    }

    // Locate header row containing 'NSE Code' or 'CMP' or 'RSI'
    let headerRowIndex = -1;
    let nseCol = -1;
    let cmpCol = -1;
    let rsiCol = -1;

    for (let i = 0; i < data.length; i++) {
      const row = data[i].map(cell => String(cell || "").toLowerCase().trim());
      const hasCode = row.some(cell => cell.includes("nse code") || cell.includes("ticker") || cell.includes("symbol") || cell === "code");
      const hasCmp = row.some(cell => cell.includes("cmp") || cell.includes("price") || cell.includes("ltp"));
      const hasRsi = row.some(cell => cell.includes("rsi"));

      if (hasCode || (hasCmp && hasRsi)) {
        headerRowIndex = i;
        for (let j = 0; j < row.length; j++) {
          if (row[j].includes("nse code") || row[j].includes("ticker") || row[j].includes("symbol") || row[j] === "code") nseCol = j;
          else if (row[j].includes("cmp") || row[j].includes("price") || row[j].includes("ltp")) cmpCol = j;
          else if (row[j].includes("rsi")) rsiCol = j;
        }
        break;
      }
    }

    // Fallbacks if headers weren't named standard
    if (headerRowIndex === -1) {
      headerRowIndex = 1; // Assume row 2 if row 1 is metadata
      nseCol = 0;
      cmpCol = 1;
      rsiCol = 2;
    }
    if (nseCol === -1) nseCol = 0;
    if (cmpCol === -1) cmpCol = 1;
    if (rsiCol === -1) rsiCol = 2;

    // Parse records from rows below header
    const records = [];
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      const rawCode = String(row[nseCol] || "").trim();
      const rawCmp = parseFloat(String(row[cmpCol]).replace(/[^0-9.-]+/g, ""));
      const rawRsi = parseFloat(String(row[rsiCol]).replace(/[^0-9.-]+/g, ""));

      if (rawCode && !isNaN(rawRsi)) {
        records.push({
          code: rawCode,
          cmp: isNaN(rawCmp) ? 0 : rawCmp,
          rsi: rawRsi,
          status: getRsiStatus(rawRsi)
        });
      }
    }

    // Sort by RSI ascending (lowest RSI first)
    const sorted = [...records].sort((a, b) => a.rsi - b.rsi);

    // Filter top N if query parameter 'top' is specified (e.g. ?top=5)
    let outputRecords = records;
    const topParam = e && e.parameter && e.parameter.top;
    if (topParam) {
      const limit = parseInt(topParam, 10);
      if (!isNaN(limit) && limit > 0) {
        outputRecords = sorted.slice(0, limit);
      }
    }

    const payload = {
      status: "success",
      lastUpdate: lastUpdate,
      sheetUrl: spreadsheet.getUrl(),
      totalCount: records.length,
      topFiveLowestRsi: sorted.slice(0, 5),
      items: outputRecords
    };

    return createJsonResponse(payload);
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: err.toString(),
      data: []
    });
  }
}

/**
 * Determines RSI category / signal condition
 * @param {number} rsi - 14-period RSI value
 * @return {string} Status label
 */
function getRsiStatus(rsi) {
  if (rsi <= 30) return "Extremely Oversold";
  if (rsi <= 40) return "Oversold";
  if (rsi <= 60) return "Neutral";
  if (rsi <= 70) return "Bullish";
  return "Overbought";
}

/**
 * Formats data as JSON text output with CORS headers
 * @param {Object} dataObj - JavaScript object to serialize
 * @return {ContentService.TextOutput}
 */
function createJsonResponse(dataObj) {
  return ContentService.createTextOutput(JSON.stringify(dataObj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * OPTIONAL TRIGGER: Automated Email Alert for Low-RSI / Oversold stocks
 * Run this on a Time-Driven trigger (e.g. every 15 mins during market hours)
 */
function sendLowRsiEmailAlerts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const alertThreshold = 40.0; // Alert if RSI < 40
  const lowRsiItems = [];

  // Parse items
  for (let i = 2; i < data.length; i++) {
    const code = String(data[i][0] || "").trim();
    const cmp = parseFloat(data[i][1]);
    const rsi = parseFloat(data[i][2]);
    if (code && !isNaN(rsi) && rsi <= alertThreshold) {
      lowRsiItems.push({ code, cmp, rsi });
    }
  }

  if (lowRsiItems.length > 0) {
    const recipient = Session.getActiveUser().getEmail() || "your-email@gmail.com";
    const subject = `⚠️ Low RSI Alert: ${lowRsiItems.length} NSE Assets Below ${alertThreshold} RSI`;
    let body = `The following NSE assets have dropped into the oversold zone (RSI <= ${alertThreshold}):\n\n`;
    
    lowRsiItems.sort((a, b) => a.rsi - b.rsi).forEach((item, idx) => {
      body += `${idx + 1}. ${item.code} | CMP: ₹${item.cmp.toFixed(2)} | RSI (14): ${item.rsi.toFixed(2)}\n`;
    });

    body += `\nTimestamp: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;
    body += `\nCheck live screener for full details.`;

    MailApp.sendEmail(recipient, subject, body);
    Logger.log("Low RSI email alert sent to " + recipient);
  }
}
