import { NextRequest, NextResponse } from 'next/server'
import { mistral } from '@ai-sdk/mistral'
import { generateText } from 'ai'
import { prisma } from '../../../../lib/prisma'
import { generateDataHash, logOperation, logError } from '../../../../lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json()

    logOperation('generate-text-analysis', `Starting analysis for projectId=${projectId}`)

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { textAnalysis: true }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const dataHash = generateDataHash(project.jsonData)

    // Check if analysis exists and is current
    if (project.textAnalysis && project.textAnalysis.dataHash === dataHash) {
      logOperation('generate-text-analysis', `Using cached analysis for projectId=${projectId}`)
      return NextResponse.json({ analysis: project.textAnalysis.content })
    }

    // Generate new analysis
    const { text } = await generateText({
      model: mistral('mistral-large-latest'),
      prompt: `Analyze the following structured data and provide insights:
      
      ${JSON.stringify(project.jsonData, null, 2)}
      
      Provide a comprehensive analysis including:
      - Data overview and summary
      - Key insights and patterns
      - Data quality assessment
      - Recommendations for action
      
      Format the response in markdown.`,
    })

    // Save analysis
    await prisma.textAnalysis.upsert({
      where: { projectId },
      update: {
        content: text,
        dataHash,
        updatedAt: new Date(),
      },
      create: {
        projectId,
        content: text,
        dataHash,
      }
    })

    logOperation('generate-text-analysis', `Successfully generated analysis for projectId=${projectId}`)

    return NextResponse.json({ analysis: text })
  } catch (error) {
    logError('generate-text-analysis', error)
    return NextResponse.json({ error: 'Analysis generation failed' }, { status: 500 })
  }
}
