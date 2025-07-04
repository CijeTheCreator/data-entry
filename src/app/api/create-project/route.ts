import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '../../../../lib/prisma'
import { createGoogleSheet } from '../../../../lib/google-sheets'
import { logOperation, logError } from '../../../../lib/utils'

// Function to extract sheet ID from Google Sheets URL
function extractSheetId(url: string): string | null {
  if (!url) return null

  try {
    // Match pattern: https://docs.google.com/spreadsheets/d/{SHEET_ID}/...
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  } catch (error) {
    logError('create-project', error, { step: 'extract-sheet-id', url })
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    logOperation('create-project', 'Starting authentication check')
    const { userId } = auth()
    if (!userId) {
      logOperation('create-project', 'Authentication failed - no userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    logOperation('create-project', `Starting project creation for userId=${userId}`)

    logOperation('create-project', 'Parsing request body')
    const body = await req.json()
    const { name, fileUrls, type, columnNames, context, sheetId, spreadsheetUrl } = body
    logOperation('create-project', `Request params: name=${name}, type=${type}, sheetId=${sheetId}, spreadsheetUrl=${spreadsheetUrl}, fileUrls count=${fileUrls?.length || 0}`)

    // Validate fileUrls
    if (!fileUrls || !Array.isArray(fileUrls) || fileUrls.length === 0) {
      logOperation('create-project', 'Invalid fileUrls provided')
      return NextResponse.json({ error: 'At least one file URL is required' }, { status: 400 })
    }

    // Get user from database
    logOperation('create-project', `Looking up user with clerkId=${userId}`)
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })
    if (!user) {
      logOperation('create-project', `User not found for clerkId=${userId}`)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    logOperation('create-project', `Found user with id=${user.id}`)

    let connectedSheetId = sheetId

    // Extract sheet ID from spreadsheetUrl if provided and no sheetId
    if (!connectedSheetId && spreadsheetUrl) {
      connectedSheetId = extractSheetId(spreadsheetUrl)
      logOperation('create-project', `Extracted sheetId from URL: ${connectedSheetId}`)
    }

    logOperation('create-project', `Final connectedSheetId: ${connectedSheetId}`)

    // If creating from scratch and no sheet provided, create one
    if (type === 'scratch' && !connectedSheetId) {
      logOperation('create-project', 'Creating new Google Sheet (type=scratch, no sheetId provided)')
      try {
        const sheet = await createGoogleSheet(name)
        connectedSheetId = sheet.spreadsheetId
        logOperation('create-project', `Created Google Sheet with ID: ${connectedSheetId}`)

        // Save connected sheet
        logOperation('create-project', `Saving connected sheet to database for userId=${user.id}`)
        const connectedSheet = await prisma.connectedSheet.create({
          data: {
            userId: user.id,
            spreadsheetId: connectedSheetId!,
            spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${connectedSheetId}`,
            title: name,
          }
        })
        logOperation('create-project', `Created connectedSheet record with id=${connectedSheet.id}`)
      } catch (error) {
        logError('create-project', error, { step: 'create-google-sheet' })
        logOperation('create-project', 'Google Sheet creation failed, continuing without sheet')
        // Continue without sheet if creation fails
      }
    } else {
      logOperation('create-project', `Skipping Google Sheet creation: type=${type}, connectedSheetId=${connectedSheetId}`)
    }

    // Create project
    logOperation('create-project', `Creating project record for user=${user.id}`)
    const project = await prisma.project.create({
      data: {
        name,
        userId: user.id,
        fileUrls: fileUrls,
        status: 'PROCESSING',
      }
    })
    logOperation('create-project', `Created project with id=${project.id}`)

    // Link to connected sheet if available
    if (connectedSheetId) {
      logOperation('create-project', `Linking project ${project.id} to connectedSheet ${connectedSheetId}`)

      // First, check if the connected sheet exists
      const existingSheet = await prisma.connectedSheet.findFirst({
        where: { spreadsheetId: connectedSheetId, userId: user.id }
      })

      if (existingSheet) {
        logOperation('create-project', `Found existing connectedSheet with id=${existingSheet.id}`)
        const updateResult = await prisma.connectedSheet.updateMany({
          where: { spreadsheetId: connectedSheetId, userId: user.id },
          data: { projectId: project.id }
        })
        logOperation('create-project', `Updated ${updateResult.count} connectedSheet records`)
      } else {
        logOperation('create-project', `No existing connectedSheet found for spreadsheetId=${connectedSheetId}, userId=${user.id}`)

        // Check if we need to create a connected sheet record for existing sheets
        if (type !== 'scratch') {
          logOperation('create-project', `Creating connectedSheet record for existing sheet: ${connectedSheetId}`)
          try {
            // Use the provided spreadsheetUrl or construct it
            const finalSpreadsheetUrl = spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${connectedSheetId}`

            const connectedSheet = await prisma.connectedSheet.create({
              data: {
                userId: user.id,
                spreadsheetId: connectedSheetId,
                spreadsheetUrl: finalSpreadsheetUrl,
                title: name,
                projectId: project.id
              }
            })
            logOperation('create-project', `Created connectedSheet record for existing sheet with id=${connectedSheet.id}`)
          } catch (error) {
            logError('create-project', error, { step: 'create-connected-sheet-for-existing' })
            logOperation('create-project', 'Failed to create connectedSheet record for existing sheet')
          }
        }
      }
    } else {
      logOperation('create-project', 'No connectedSheetId available, skipping sheet linking')
    }

    // Call extract-document route
    logOperation('create-project', `Calling extract-document API for project ${project.id}`)
    const extractResponse = await fetch(`${req.nextUrl.origin}/api/extract-document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: project.id,
        fileUrls,
        columnNames,
        context,
      })
    })

    if (!extractResponse.ok) {
      logOperation('create-project', `Extract-document API failed with status: ${extractResponse.status}`)
      throw new Error('Document extraction failed')
    }
    logOperation('create-project', 'Extract-document API completed successfully')

    const extractData = await extractResponse.json()

    // Call get-document-screenshot route
    if (connectedSheetId) {
      logOperation('create-project', `Triggering screenshot API for sheet ${connectedSheetId}`)
      fetch(`${req.nextUrl.origin}/api/get-document-screenshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          sheetId: connectedSheetId,
        })
      }).catch(error => {
        logError('create-project', error, { step: 'screenshot' })
        logOperation('create-project', 'Screenshot API call failed')
      })
    } else {
      logOperation('create-project', 'Skipping screenshot API - no connectedSheetId')
    }

    logOperation('create-project', `Successfully created project ${project.id}`)
    return NextResponse.json({ projectId: project.id, ...extractData })
  } catch (error) {
    logError('create-project', error)
    logOperation('create-project', 'Project creation failed with error')
    return NextResponse.json({ error: 'Project creation failed' }, { status: 500 })
  }
}
