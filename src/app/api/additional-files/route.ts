import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '../../../../lib/prisma'
import { extractAndProcessDocuments } from '../../../../lib/extract-document-helpers'
import { logOperation, logError } from '../../../../lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logOperation('additional-files', `Starting additional files processing for userId=${userId}`)

    const body = await req.json()
    const { projectId, fileUrls } = body

    if (!projectId || !fileUrls || !Array.isArray(fileUrls) || fileUrls.length === 0) {
      return NextResponse.json({ error: 'Project ID and file URLs are required' }, { status: 400 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get project and verify ownership
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
      include: { connectedSheet: true }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    logOperation('additional-files', `Processing additional files for project ${projectId}`)

    // Extract and process the new documents
    const { csvData, jsonData, dataPoints } = await extractAndProcessDocuments(fileUrls)

    // Update project with new file URLs and combined data
    const updatedFileUrls = [...project.fileUrls, ...fileUrls]
    
    // Combine existing JSON data with new data
    const existingData = project.jsonData as any[] || []
    const combinedJsonData = [...existingData, ...jsonData]

    await prisma.project.update({
      where: { id: projectId },
      data: {
        fileUrls: updatedFileUrls,
        jsonData: combinedJsonData,
        csvData,
        dataPoints: dataPoints + project.dataPoints,
        updatedAt: new Date()
      }
    })

    // Create new state version
    const latestState = await prisma.projectState.findFirst({
      where: { projectId },
      orderBy: { version: 'desc' }
    })

    const newVersion = (latestState?.version || 0) + 1

    await prisma.projectState.create({
      data: {
        projectId,
        version: newVersion,
        jsonData: combinedJsonData,
        csvData
      }
    })

    // Sync with spreadsheet if connected
    if (project.connectedSheet) {
      logOperation('additional-files', `Syncing additional data with spreadsheet for project ${projectId}`)
      
      fetch(`${req.nextUrl.origin}/api/sync-with-spreadsheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, csvData })
      }).catch(error => {
        logError('additional-files', error, { step: 'sync-spreadsheet', projectId })
      })
    }

    logOperation('additional-files', `Successfully processed additional files for project ${projectId}`)

    return NextResponse.json({
      success: true,
      message: 'Additional files processed successfully',
      data: {
        projectId,
        newDataPoints: dataPoints,
        totalDataPoints: dataPoints + project.dataPoints,
        newRecords: jsonData.length
      }
    })

  } catch (error) {
    logError('additional-files', error)
    return NextResponse.json({ error: 'Failed to process additional files' }, { status: 500 })
  }
}