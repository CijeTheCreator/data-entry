import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { uploadToS3 } from '../../../../lib/s3'
import { generateDataHash, logOperation, logError } from '../../../../lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json()

    logOperation('generate-audio-analysis', `Starting audio analysis for projectId=${projectId}`)

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { textAnalysis: true, audioAnalysis: true }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const dataHash = generateDataHash(project.jsonData)

    // Check if audio analysis exists and is current
    if (project.audioAnalysis && project.audioAnalysis.dataHash === dataHash) {
      logOperation('generate-audio-analysis', `Using cached audio analysis for projectId=${projectId}`)
      return NextResponse.json({ audioUrl: project.audioAnalysis.audioUrl })
    }

    // Get or generate text analysis first
    let textContent = project.textAnalysis?.content
    if (!textContent || project.textAnalysis?.dataHash !== dataHash) {
      const textResponse = await fetch(`${req.nextUrl.origin}/api/generate-text-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })
      const textData = await textResponse.json()
      textContent = textData.analysis
    }

    // Generate audio using ElevenLabs (mock implementation)
    // In real implementation, call ElevenLabs API
    const mockAudioBuffer = Buffer.from('mock audio data')
    const audioKey = `audio/${projectId}/${Date.now()}.mp3`
    const audioUrl = await uploadToS3(mockAudioBuffer, audioKey, 'audio/mpeg')

    // Save audio analysis
    await prisma.audioAnalysis.upsert({
      where: { projectId },
      update: {
        audioUrl,
        content: textContent,
        dataHash,
        updatedAt: new Date(),
      },
      create: {
        projectId,
        audioUrl,
        content: textContent,
        dataHash,
      }
    })

    logOperation('generate-audio-analysis', `Successfully generated audio analysis for projectId=${projectId}`)

    return NextResponse.json({ audioUrl })
  } catch (error) {
    logError('generate-audio-analysis', error)
    return NextResponse.json({ error: 'Audio analysis generation failed' }, { status: 500 })
  }
}