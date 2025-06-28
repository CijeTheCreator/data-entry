import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '../../../../lib/prisma'
import { createGoogleSheet } from '../../../../lib/google-sheets'
import { logOperation, logError } from '../../../../lib/utils'

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
    const { name, fileUrl, type, columnNames, context, sheetId } = body
    logOperation('create-project', `Request params: name=${name}, type=${type}, sheetId=${sheetId}`)

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
    logOperation('create-project', `Initial connectedSheetId: ${connectedSheetId}`)

    // If creating from scratch and no sheet provided, create one
    if (type === 'scratch' && !sheetId) {
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
      logOperation('create-project', `Skipping Google Sheet creation: type=${type}, sheetId=${sheetId}`)
    }

    // Create project
    logOperation('create-project', `Creating project record for user=${user.id}`)
    const project = await prisma.project.create({
      data: {
        name,
        userId: user.id,
        fileUrls: [fileUrl],
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
            const connectedSheet = await prisma.connectedSheet.create({
              data: {
                userId: user.id,
                spreadsheetId: connectedSheetId,
                spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${connectedSheetId}`,
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
        fileUrl,
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
