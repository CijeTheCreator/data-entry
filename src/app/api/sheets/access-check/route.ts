import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { checkSpreadsheetAccess } from '../../../../../lib/google-sheets'
import { logOperation, logError } from '../../../../../lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { spreadsheetUrl } = await req.json()

    if (!spreadsheetUrl) {
      return NextResponse.json({ error: 'Spreadsheet URL is required' }, { status: 400 })
    }

    logOperation('access-check', `Checking access for spreadsheet: ${spreadsheetUrl}`)

    const result = await checkSpreadsheetAccess(spreadsheetUrl)

    if (result.hasAccess) {
      logOperation('access-check', `Access confirmed for spreadsheet: ${result.title}`)
      return NextResponse.json({
        hasAccess: true,
        title: result.title,
        serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
      })
    } else {
      logOperation('access-check', `Access denied: ${result.error}`)
      return NextResponse.json({
        hasAccess: false,
        error: result.error,
        serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
      })
    }
  } catch (error) {
    logError('access-check', error)
    return NextResponse.json({ 
      error: 'Failed to check spreadsheet access',
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    }, { status: 500 })
  }
}