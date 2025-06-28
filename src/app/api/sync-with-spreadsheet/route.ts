import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { writeToSheet } from '../../../../lib/google-sheets'
import { logOperation, logError } from '../../../../lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { projectId, csvData } = await req.json()
    logOperation('sync-with-spreadsheet', `Starting sync for projectId=${projectId}`)

    // Log before database query
    logOperation('sync-with-spreadsheet', `Querying database for projectId=${projectId}`)

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { connectedSheet: true, user: true }
    })

    // Log database query results
    logOperation('sync-with-spreadsheet', `Database query complete - project found: ${!!project}`)

    if (!project) {
      logOperation('sync-with-spreadsheet', `Project not found for projectId=${projectId}`)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    logOperation('sync-with-spreadsheet', `Project found - checking connected sheet for projectId=${projectId}`)

    if (!project.connectedSheet) {
      logOperation('sync-with-spreadsheet', `Connected sheet not found for projectId=${projectId}`)
      return NextResponse.json({ error: 'Connected sheet not found' }, { status: 404 })
    }

    logOperation('sync-with-spreadsheet', `Connected sheet found - sheetId=${project.connectedSheet.spreadsheetId}`)

    // Parse CSV data
    logOperation('sync-with-spreadsheet', `Parsing CSV data - ${csvData?.length || 0} characters`)
    const lines = csvData.split('\n')
    const data = lines.map((line: string) => line.split(','))
    logOperation('sync-with-spreadsheet', `CSV parsed - ${lines.length} lines, ${data.length} rows`)

    // Write to Google Sheet
    logOperation('sync-with-spreadsheet', `Writing to Google Sheet - sheetId=${project.connectedSheet.spreadsheetId}`)
    await writeToSheet(project.connectedSheet.spreadsheetId, data)
    logOperation('sync-with-spreadsheet', `Successfully wrote to Google Sheet`)

    // Update last sync time
    logOperation('sync-with-spreadsheet', `Updating last sync time for connectedSheet.id=${project.connectedSheet.id}`)
    await prisma.connectedSheet.update({
      where: { id: project.connectedSheet.id },
      data: { lastSync: new Date() }
    })
    logOperation('sync-with-spreadsheet', `Last sync time updated`)

    logOperation('sync-with-spreadsheet', `Successfully synced projectId=${projectId}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    logError('sync-with-spreadsheet', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
