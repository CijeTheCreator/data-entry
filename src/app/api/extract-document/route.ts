// app/api/extract-document/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma'
import { extractAndProcessDocuments } from '../../../../lib/extract-document-helpers';
import { logOperation } from '../../../../lib/utils'

export async function POST(req: NextRequest) {
  try {
    logOperation('extract-document', 'API route called');

    const { projectId, fileUrls, columnNames, context } = await req.json();

    logOperation('extract-document', 'Request payload parsed', {
      projectId,
      fileUrlsCount: fileUrls?.length,
      hasColumnNames: !!columnNames,
      hasContext: !!context
    });

    // Validate required fields
    if (!projectId) {
      logOperation('extract-document', 'Validation failed: missing projectId');
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    if (!fileUrls || !Array.isArray(fileUrls) || fileUrls.length === 0) {
      logOperation('extract-document', 'Validation failed: invalid fileUrls', { fileUrls });
      return NextResponse.json(
        { error: 'File URLs array is required and must not be empty' },
        { status: 400 }
      );
    }

    logOperation('extract-document', 'Validation passed, updating project status to PROCESSING', {
      projectId
    });

    // Update project status to processing
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'PROCESSING',
      }
    });

    logOperation('extract-document', 'Project status updated to PROCESSING');

    try {
      logOperation('extract-document', 'Starting document extraction and processing', {
        projectId,
        fileUrls,
        columnNames,
        context
      });

      // Extract and process documents
      const { csvData, jsonData, dataPoints } = await extractAndProcessDocuments(
        fileUrls,
        columnNames,
        context
      );

      logOperation('extract-document', 'Document processing completed, updating database', {
        projectId,
        dataPoints,
        recordCount: jsonData.length
      });

      // Update project with extracted data
      await prisma.project.update({
        where: { id: projectId },
        data: {
          jsonData,
          csvData,
          status: 'COMPLETED',
          dataPoints,
        }
      });

      logOperation('extract-document', 'Project updated with extracted data');

      // Create initial state
      await prisma.projectState.create({
        data: {
          projectId,
          version: 1,
          jsonData,
          csvData,
        }
      });

      logOperation('extract-document', 'Initial project state created', {
        projectId,
        version: 1
      });

      // Trigger sync with spreadsheet
      logOperation('extract-document', 'Triggering spreadsheet sync', { projectId });
      fetch(`${req.nextUrl.origin}/api/sync-with-spreadsheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, csvData })
      }).catch(error => {
        logOperation('extract-document', 'Spreadsheet sync failed (non-blocking)', {
          projectId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        // Note: We don't throw here to avoid breaking the main flow
      });

      logOperation('extract-document', 'Document extraction completed successfully', {
        projectId,
        dataPoints,
        recordCount: jsonData.length
      });

      return NextResponse.json({
        success: true,
        message: 'Document extraction completed successfully',
        data: {
          projectId,
          dataPoints,
          recordCount: jsonData.length
        }
      });

    } catch (extractionError) {
      logOperation('extract-document', 'Document extraction failed, updating project status', {
        projectId,
        error: extractionError instanceof Error ? extractionError.message : 'Unknown error'
      });

      // Update project status to failed
      await prisma.project.update({
        where: { id: projectId },
        data: {
          status: 'FAILED',
        }
      });

      logOperation('extract-document', 'Project status updated to FAILED');

      return NextResponse.json(
        {
          error: 'Document extraction failed',
          details: extractionError instanceof Error ? extractionError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    logOperation('extract-document', 'API route error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
