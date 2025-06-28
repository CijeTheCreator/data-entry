import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { readFromSheet, parseCsv, mergeSpreadsheetData, clearAndWriteToSheet } from '../../../../lib/google-sheets'
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

    // Step 1: Read existing data from Google Sheet
    logOperation('sync-with-spreadsheet', `Reading existing data from Google Sheet - sheetId=${project.connectedSheet.spreadsheetId}`)
    const existingData = await readFromSheet(project.connectedSheet.spreadsheetId)
    logOperation('sync-with-spreadsheet', `Existing data read - ${existingData.length} rows`)

    // Step 2: Parse incoming CSV data
    logOperation('sync-with-spreadsheet', `Parsing CSV data - ${csvData?.length || 0} characters`)
    const newCsvData = parseCsv(csvData)
    logOperation('sync-with-spreadsheet', `CSV parsed - ${newCsvData.length} rows`)

    // Log headers for debugging
    if (existingData.length > 0) {
      logOperation('sync-with-spreadsheet', `Existing headers: ${existingData[0].join(', ')}`)
    }
    if (newCsvData.length > 0) {
      logOperation('sync-with-spreadsheet', `New CSV headers: ${newCsvData[0].join(', ')}`)
    }

    // Step 3: Merge the data
    logOperation('sync-with-spreadsheet', `Merging data - existing: ${existingData.length} rows, new: ${newCsvData.length} rows`)
    const mergedData = mergeSpreadsheetData(existingData, newCsvData)
    logOperation('sync-with-spreadsheet', `Data merged - result: ${mergedData.length} rows`)

    if (mergedData.length > 0) {
      logOperation('sync-with-spreadsheet', `Merged headers: ${mergedData[0].join(', ')}`)
    }

    // Step 4: Clear and write merged data to Google Sheet
    logOperation('sync-with-spreadsheet', `Writing merged data to Google Sheet - sheetId=${project.connectedSheet.spreadsheetId}`)
    await clearAndWriteToSheet(project.connectedSheet.spreadsheetId, mergedData)
    logOperation('sync-with-spreadsheet', `Successfully wrote merged data to Google Sheet`)

    // Step 5: Update last sync time
    logOperation('sync-with-spreadsheet', `Updating last sync time for connectedSheet.id=${project.connectedSheet.id}`)
    await prisma.connectedSheet.update({
      where: { id: project.connectedSheet.id },
      data: { lastSync: new Date() }
    })
    logOperation('sync-with-spreadsheet', `Last sync time updated`)

    logOperation('sync-with-spreadsheet', `Successfully synced projectId=${projectId} - final data has ${mergedData.length} rows`)
    return NextResponse.json({
      success: true,
      summary: {
        existingRows: existingData.length,
        newRows: newCsvData.length,
        mergedRows: mergedData.length,
        totalColumns: mergedData.length > 0 ? mergedData[0].length : 0
      }
    })
  } catch (error) {
    logError('sync-with-spreadsheet', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}
