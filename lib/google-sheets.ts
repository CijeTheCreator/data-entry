import { google } from 'googleapis'
import { prisma } from './prisma'
import { decrypt } from './encryption'

export async function getGoogleSheetsClient(userId: string) {
  const oauthToken = await prisma.oAuthToken.findUnique({
    where: { userId_provider: { userId, provider: 'google' } }
  })

  if (!oauthToken) {
    throw new Error('No Google OAuth token found')
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  oauth2Client.setCredentials({
    access_token: decrypt(oauthToken.accessToken),
    refresh_token: decrypt(oauthToken.refreshToken),
  })

  return google.sheets({ version: 'v4', auth: oauth2Client })
}

export async function createGoogleSheet(userId: string, title: string) {
  const sheets = await getGoogleSheetsClient(userId)
  
  const response = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title,
      },
    },
  })

  return response.data
}

export async function writeToSheet(userId: string, sheetId: string, data: string[][]) {
  const sheets = await getGoogleSheetsClient(userId)
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: 'A1',
    valueInputOption: 'RAW',
    requestBody: {
      values: data,
    },
  })
}