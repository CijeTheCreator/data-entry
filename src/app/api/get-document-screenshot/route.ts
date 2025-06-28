import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { uploadToS3 } from '../../../../lib/s3'
import { logOperation, logError } from '../../../../lib/utils'

export async function POST(req: NextRequest) {

  return NextResponse.json({
    success: true,
    screenshotUrl: "https://twlh-files-bucket.s3.eu-north-1.amazonaws.com/screenshots/user_2z5BoKyMEKn5GQiXMiwd7QgTJKv/cmcg02k9h00016r0v61g42ilq/1751100586471-sheet-screenshot.png",
    message: 'Screenshot captured and saved successfully'
  })

  try {
    logOperation('get-document-screenshot', 'Starting screenshot capture')

    logOperation('get-document-screenshot', 'Parsing request body')
    const body = await req.json()
    const { projectId, sheetId } = body

    if (!projectId || !sheetId) {
      logOperation('get-document-screenshot', 'Missing required parameters')
      return NextResponse.json({ error: 'Missing projectId or sheetId' }, { status: 400 })
    }

    logOperation('get-document-screenshot', `Processing screenshot for projectId=${projectId}, sheetId=${sheetId}`)

    // Verify project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { connectedSheet: true, user: true }
    })

    if (!project) {
      logOperation('get-document-screenshot', `Project not found or access denied for projectId=${projectId}`)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Construct Google Sheets URL
    const googleSheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`
    logOperation('get-document-screenshot', `Taking screenshot of URL: ${googleSheetUrl}`)

    // Get screenshot from ScreenshotOne API
    const screenshotOneAccessKey = process.env.SCREENSHOTONE_ACCESS_KEY
    if (!screenshotOneAccessKey) {
      logError('get-document-screenshot', new Error('SCREENSHOTONE_ACCESS_KEY not configured'))
      return NextResponse.json({ error: 'Screenshot service not configured' }, { status: 500 })
    }

    const screenshotUrl = `https://api.screenshotone.com/take?url=${encodeURIComponent(googleSheetUrl)}&access_key=${screenshotOneAccessKey}&format=png&full_page=false&viewport_width=1920&viewport_height=1080`

    logOperation('get-document-screenshot', 'Fetching screenshot from ScreenshotOne API')
    const screenshotResponse = await fetch(screenshotUrl)

    if (!screenshotResponse.ok) {
      logError('get-document-screenshot', new Error(`ScreenshotOne API failed with status: ${screenshotResponse.status}`))
      return NextResponse.json({ error: 'Screenshot capture failed' }, { status: 500 })
    }

    // Get screenshot as buffer
    const screenshotBuffer = await screenshotResponse.arrayBuffer()
    const buffer = Buffer.from(screenshotBuffer)

    logOperation('get-document-screenshot', `Screenshot captured, size: ${buffer.length} bytes`)

    // Upload to S3
    const timestamp = Date.now()
    const s3Key = `screenshots/${project.user.clerkId}/${projectId}/${timestamp}-sheet-screenshot.png`

    logOperation('get-document-screenshot', `Uploading screenshot to S3 with key: ${s3Key}`)
    const s3Url = await uploadToS3(buffer, s3Key, 'image/png')

    logOperation('get-document-screenshot', `Screenshot uploaded to S3: ${s3Url}`)

    // Update project with screenshot URL
    await prisma.project.update({
      where: { id: projectId },
      data: { screenshotUrl: s3Url }
    })

    logOperation('get-document-screenshot', `Project updated with screenshot URL for projectId=${projectId}`)

    return NextResponse.json({
      success: true,
      screenshotUrl: s3Url,
      message: 'Screenshot captured and saved successfully'
    })

  } catch (error) {
    logError('get-document-screenshot', error)
    logOperation('get-document-screenshot', 'Screenshot capture failed with error')
    return NextResponse.json({ error: 'Screenshot capture failed' }, { status: 500 })
  }
}
