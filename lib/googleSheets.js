import { google } from 'googleapis';

// Initialize Google Sheets API client
const getGoogleSheetsClient = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
};

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// Get all accounts from Google Sheets
export async function getAccounts() {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Accounts!A2:J1000', // Skip header row
    });

    const rows = response.data.values || [];
    return rows.map(row => ({
      id: row[0],
      phoneNumber: row[1],
      telegramUsername: row[2],
      telegramUserId: row[3],
      firstName: row[4],
      lastName: row[5],
      sessionStatus: row[6] || 'unknown',
      integratedAt: row[7],
      integrationMethod: row[8],
      accountOwnership: row[9] || 'user_owned',
      dailyDmQuota: 200,
      dailyDmSentToday: 0,
      lastActive: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return [];
  }
}

// Create new account in Google Sheets
export async function createAccount(accountData) {
  try {
    const sheets = getGoogleSheetsClient();
    const values = [[
      accountData.id || Date.now().toString(),
      accountData.phoneNumber,
      accountData.telegramUsername,
      accountData.telegramUserId,
      accountData.firstName,
      accountData.lastName,
      accountData.sessionStatus || 'active',
      new Date().toISOString(),
      accountData.integrationMethod,
      accountData.accountOwnership || 'user_owned',
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Accounts!A:J',
      valueInputOption: 'RAW',
      resource: { values },
    });

    // Also add session tracking
    await createSessionRecord(accountData.id, accountData.sessionFilePath);

    return { success: true, id: values[0][0] };
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
}

// Create session record
async function createSessionRecord(accountId, sessionPath) {
  try {
    const sheets = getGoogleSheetsClient();
    const values = [[
      accountId,
      sessionPath,
      new Date().toISOString(),
      new Date().toISOString(),
      'active',
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Sessions!A:E',
      valueInputOption: 'RAW',
      resource: { values },
    });
  } catch (error) {
    console.error('Error creating session record:', error);
  }
}

// Update account status
export async function updateAccount(accountId, updates) {
  try {
    const sheets = getGoogleSheetsClient();
    
    // Find the row with this account ID
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Accounts!A:A',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === accountId);

    if (rowIndex === -1) {
      throw new Error('Account not found');
    }

    // Update specific columns based on what's in updates
    if (updates.sessionStatus) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `Accounts!G${rowIndex + 1}`,
        valueInputOption: 'RAW',
        resource: { values: [[updates.sessionStatus]] },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
}

// Delete account
export async function deleteAccount(accountId) {
  try {
    const sheets = getGoogleSheetsClient();
    
    // Find and delete the row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Accounts!A:A',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === accountId);

    if (rowIndex !== -1) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        resource: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: 0, // Accounts sheet
                dimension: 'ROWS',
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          }],
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
}

// Log activity
export async function logActivity(accountId, action, status, details) {
  try {
    const sheets = getGoogleSheetsClient();
    const values = [[
      new Date().toISOString(),
      accountId,
      action,
      status,
      details,
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Activity_Log!A:E',
      valueInputOption: 'RAW',
      resource: { values },
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}
