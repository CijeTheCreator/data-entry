import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { uploadToS3 } from '../../../../lib/s3'
import { logOperation, logError } from '../../../../lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logOperation('upload-file', `Starting file upload for userId=${userId}`)

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique key for S3
    const timestamp = Date.now()
    const key = `uploads/${userId}/${timestamp}-${file.name}`

    const url = await uploadToS3(buffer, key, file.type)

    logOperation('upload-file', `Successfully uploaded file to S3: ${url}`)

    return NextResponse.json({ url, filename: file.name })
  } catch (error) {
    logError('upload-file', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}