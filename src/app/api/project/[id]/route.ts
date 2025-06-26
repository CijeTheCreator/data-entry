import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs'
import { prisma } from '../../../../../lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        connectedSheet: true,
        states: {
          orderBy: { version: 'desc' },
          take: 1
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: project.id,
      name: project.name,
      fileUrls: project.fileUrls,
      status: project.status,
      dataPoints: project.dataPoints,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      connectedSheet: project.connectedSheet,
      currentVersion: project.states[0]?.version || 1,
    })
  } catch (error) {
    console.error('[project-get] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}