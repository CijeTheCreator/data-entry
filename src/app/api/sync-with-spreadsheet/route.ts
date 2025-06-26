import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { writeToSheet } from '../../../../lib/google-sheets'
import { logOperation, logError } from '../../../../lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { projectId, csvData } = await req.json()

    logOperation('sync-with-spreadsheet', `Starting sync for projectId=${projectId}`)

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { connectedSheet: true, user: true }
    })

    if (!project || !project.connectedSheet) {
      return NextResponse.json({ error: 'Project or connected sheet not found' }, { status: 404 })
    }

    // Parse CSV data
    const lines = csvData.split('\n')
    const data = lines.map((line: string) => line.split(','))

    // Write to Google Sheet
    await writeToSheet(project.user.id, project.connectedSheet.sheetId, data)

    // Update last sync time
    await prisma.connectedSheet.update({
      where: { id: project.connectedSheet.id },
      data: { lastSync: new Date() }
    })

    logOperation('sync-with-spreadsheet', `Successfully synced projectId=${projectId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    logError('sync-with-spreadsheet', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}