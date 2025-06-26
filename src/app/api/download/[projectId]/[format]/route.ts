import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '../../../../../../lib/prisma'
import { stringify } from 'csv-stringify/sync'
import ExcelJS from 'exceljs'
import { logOperation, logError } from '../../../../../../lib/utils'

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string; format: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, format } = params

    logOperation('download', `Starting download for projectId=${projectId}, format=${format}`)

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id }
    })

    if (!project || !project.jsonData) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const data = project.jsonData as any[]
    const filename = `${project.name.replace(/\s+/g, '_')}`

    switch (format.toLowerCase()) {
      case 'json':
        return new NextResponse(JSON.stringify(data, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="${filename}.json"`,
          },
        })

      case 'csv':
        const csvData = stringify(data, { header: true })
        return new NextResponse(csvData, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${filename}.csv"`,
          },
        })

      case 'xls':
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Data')
        
        if (data.length > 0) {
          const headers = Object.keys(data[0])
          worksheet.addRow(headers)
          data.forEach(row => {
            worksheet.addRow(headers.map(header => row[header]))
          })
        }

        const buffer = await workbook.xlsx.writeBuffer()
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
          },
        })

      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
    }
  } catch (error) {
    logError('download', error)
    return NextResponse.json({ error: 'Download failed' }, { status: 500 })
  }
}