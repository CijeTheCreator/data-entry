import { google } from 'googleapis'
import { prisma } from './prisma'

// Initialize Google Sheets client with service account
function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      project_id: process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID,
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  })

  return google.sheets({ version: 'v4', auth })
}

function getGoogleDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      project_id: process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID,
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  })
  return google.drive({ version: 'v3', auth })
}

// Extract spreadsheet ID from various Google Sheets URL formats
export function extractSpreadsheetId(url: string): string | null {
  const patterns = [
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
    /^([a-zA-Z0-9-_]+)$/, // Direct ID
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return null
}

// Check if service account has access to a spreadsheet
export async function checkSpreadsheetAccess(spreadsheetUrl: string): Promise<{ hasAccess: boolean; title?: string; error?: string }> {
  try {
    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl)

    if (!spreadsheetId) {
      return {
        hasAccess: false,
        error: 'Invalid Google Sheets URL format'
      }
    }

    const sheets = getGoogleSheetsClient()

    const response = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'properties.title'
    })

    return {
      hasAccess: true,
      title: response.data.properties?.title || 'Untitled Spreadsheet'
    }
  } catch (error: any) {
    if (error.code === 403) {
      return {
        hasAccess: false,
        error: `Please share your Google Sheet with this email address: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`
      }
    } else if (error.code === 404) {
      return {
        hasAccess: false,
        error: 'Spreadsheet not found. Please check the URL and make sure the sheet exists.'
      }
    } else {
      return {
        hasAccess: false,
        error: 'Failed to access spreadsheet. Please try again.'
      }
    }
  }
}

// Create a new Google Sheet
export async function createGoogleSheet(title: string): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  try {
    const sheets = getGoogleSheetsClient()
    const drive = getGoogleDriveClient()

    const response = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
        },
      },
    })

    const spreadsheetId = response.data.spreadsheetId!
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`

    // Make the sheet viewable by anyone with the link
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    return {
      spreadsheetId,
      spreadsheetUrl
    }
  } catch (error) {
    console.error('Failed to create Google Sheet:', error)
    throw new Error('Failed to create Google Sheet')
  }
}

// Write data to a Google Sheet
export async function writeToSheet(spreadsheetId: string, data: string[][]): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient()

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: data,
      },
    })
  } catch (error) {
    console.error('Failed to write to Google Sheet:', error)
    throw new Error('Failed to write to Google Sheet')
  }
}

// Read data from a Google Sheet
export async function readFromSheet(spreadsheetId: string, range: string = 'A1:Z1000'): Promise<string[][]> {
  try {
    const sheets = getGoogleSheetsClient()

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    })

    return response.data.values || []
  } catch (error) {
    console.error('Failed to read from Google Sheet:', error)
    throw new Error('Failed to read from Google Sheet')
  }
}

// Parse CSV string into array of arrays
export function parseCsv(csvData: string): string[][] {
  if (!csvData.trim()) {
    return []
  }

  const lines = csvData.trim().split('\n')
  return lines.map(line => {
    // Simple CSV parsing - handles basic cases
    // For more complex CSV parsing with quotes, escapes, etc., consider using a CSV library
    return line.split(',').map(cell => cell.trim())
  })
}

// Merge existing spreadsheet data with new CSV data
export function mergeSpreadsheetData(existingData: string[][], newCsvData: string[][]): string[][] {
  // If no existing data, return new data
  if (!existingData || existingData.length === 0) {
    return newCsvData
  }

  // If no new data, return existing data
  if (!newCsvData || newCsvData.length === 0) {
    return existingData
  }

  // Get headers from both datasets
  const existingHeaders = existingData[0] || []
  const newHeaders = newCsvData[0] || []

  // Create a combined header set, preserving order of existing headers first
  const combinedHeaders: string[] = [...existingHeaders]

  // Add new headers that don't exist in existing headers
  newHeaders.forEach(header => {
    if (!existingHeaders.includes(header)) {
      combinedHeaders.push(header)
    }
  })

  // Create header index maps for easier lookup
  const existingHeaderMap = new Map<string, number>()
  existingHeaders.forEach((header, index) => {
    existingHeaderMap.set(header, index)
  })

  const newHeaderMap = new Map<string, number>()
  newHeaders.forEach((header, index) => {
    newHeaderMap.set(header, index)
  })

  const combinedHeaderMap = new Map<string, number>()
  combinedHeaders.forEach((header, index) => {
    combinedHeaderMap.set(header, index)
  })

  // Start building the merged data with the combined headers
  const mergedData: string[][] = [combinedHeaders]

  // Add existing data rows (skip header row)
  for (let i = 1; i < existingData.length; i++) {
    const existingRow = existingData[i]
    const newRow = new Array(combinedHeaders.length).fill('')

    // Map existing data to new structure
    existingHeaders.forEach((header, oldIndex) => {
      const newIndex = combinedHeaderMap.get(header)
      if (newIndex !== undefined && existingRow[oldIndex] !== undefined) {
        newRow[newIndex] = existingRow[oldIndex]
      }
    })

    mergedData.push(newRow)
  }

  // Add new CSV data rows (skip header row)
  for (let i = 1; i < newCsvData.length; i++) {
    const newCsvRow = newCsvData[i]
    const newRow = new Array(combinedHeaders.length).fill('')

    // Map new CSV data to combined structure
    newHeaders.forEach((header, oldIndex) => {
      const newIndex = combinedHeaderMap.get(header)
      if (newIndex !== undefined && newCsvRow[oldIndex] !== undefined) {
        newRow[newIndex] = newCsvRow[oldIndex]
      }
    })

    mergedData.push(newRow)
  }

  return mergedData
}

// Clear entire sheet and write new data
export async function clearAndWriteToSheet(spreadsheetId: string, data: string[][]): Promise<void> {
  try {
    const sheets = getGoogleSheetsClient()

    // First, clear the existing content
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'A1:Z1000', // Clear a large range to ensure all data is removed
    })

    // Then write the new data
    if (data.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'A1',
        valueInputOption: 'RAW',
        requestBody: {
          values: data,
        },
      })
    }
  } catch (error) {
    console.error('Failed to clear and write to Google Sheet:', error)
    throw new Error('Failed to clear and write to Google Sheet')
  }
}
