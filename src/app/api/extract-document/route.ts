import { NextRequest, NextResponse } from 'next/server'
import { mistral } from '@ai-sdk/mistral'
import { generateText } from 'ai'
import { prisma } from '../../../../lib/prisma'
import { logOperation, logError } from '../../../../lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { projectId, fileUrl, columnNames, context } = await req.json()

    logOperation('extract-document', `Starting document extraction for projectId=${projectId}`)

    // For now, simulate document extraction
    // In a real implementation, you would:
    // 1. Download file from S3
    // 2. Determine file type (zip, image, PDF, audio)
    // 3. Extract content using appropriate service (Mistral OCR, Deepgram)
    // 4. Process with LLM to generate CSV

    const prompt = `
    Extract structured data from the uploaded document and convert it to CSV format.
    ${columnNames?.length ? `Use these column names: ${columnNames.join(', ')}` : 'Determine appropriate column names automatically.'}
    ${context ? `Additional context: ${context}` : ''}
    
    Return only valid CSV data with headers.
    `

    // Simulate extraction with mock data
    const mockCsvData = `Name,Email,Phone,Company
John Doe,john@example.com,555-0123,Acme Corp
Jane Smith,jane@example.com,555-0456,Tech Inc
Bob Johnson,bob@example.com,555-0789,Data Co`

    // Parse CSV to JSON for storage
    const lines = mockCsvData.split('\n')
    const headers = lines[0].split(',')
    const jsonData = lines.slice(1).map(line => {
      const values = line.split(',')
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index] || ''
        return obj
      }, {} as Record<string, string>)
    })

    // Update project with extracted data
    await prisma.project.update({
      where: { id: projectId },
      data: {
        jsonData,
        csvData: mockCsvData,
        status: 'COMPLETED',
        dataPoints: headers.length,
      }
    })

    // Create initial state
    await prisma.projectState.create({
      data: {
        projectId,
        version: 1,
        jsonData,
        csvData: mockCsvData,
      }
    })

    // Trigger sync with spreadsheet
    fetch(`${req.nextUrl.origin}/api/sync-with-spreadsheet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, csvData: mockCsvData })
    }).catch(error => logError('extract-document', error, { step: 'sync' }))

    logOperation('extract-document', `Successfully extracted document for projectId=${projectId}`)

    return NextResponse.json({ success: true, dataPoints: headers.length })
  } catch (error) {
    logError('extract-document', error)
    return NextResponse.json({ error: 'Document extraction failed' }, { status: 500 })
  }
}