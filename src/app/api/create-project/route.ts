import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '../../../../lib/prisma'
import { createGoogleSheet } from '../../../../lib/google-sheets'
import { logOperation, logError } from '../../../../lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logOperation('create-project', `Starting project creation for userId=${userId}`)

    const body = await req.json()
    const { name, fileUrl, type, columnNames, context, sheetId } = body

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let connectedSheetId = sheetId

    // If creating from scratch and no sheet provided, create one
    if (type === 'scratch' && !sheetId) {
      try {
        const sheet = await createGoogleSheet(user.id, name)
        connectedSheetId = sheet.spreadsheetId

        // Save connected sheet
        await prisma.connectedSheet.create({
          data: {
            userId: user.id,
            sheetId: connectedSheetId!,
            sheetUrl: `https://docs.google.com/spreadsheets/d/${connectedSheetId}`,
            title: name,
          }
        })
      } catch (error) {
        logError('create-project', error, { step: 'create-google-sheet' })
        // Continue without sheet if creation fails
      }
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        userId: user.id,
        fileUrls: [fileUrl],
        status: 'PROCESSING',
      }
    })

    // Link to connected sheet if available
    if (connectedSheetId) {
      await prisma.connectedSheet.updateMany({
        where: { sheetId: connectedSheetId, userId: user.id },
        data: { projectId: project.id }
      })
    }

    // Call extract-document route
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
      throw new Error('Document extraction failed')
    }

    const extractData = await extractResponse.json()

    // Call get-document-screenshot route
    if (connectedSheetId) {
      fetch(`${req.nextUrl.origin}/api/get-document-screenshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          sheetId: connectedSheetId,
        })
      }).catch(error => logError('create-project', error, { step: 'screenshot' }))
    }

    logOperation('create-project', `Successfully created project ${project.id}`)

    return NextResponse.json({ projectId: project.id, ...extractData })
  } catch (error) {
    logError('create-project', error)
    return NextResponse.json({ error: 'Project creation failed' }, { status: 500 })
  }
}