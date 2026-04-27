import { NextResponse } from 'next/server';
import { generateReportPipeline, getReportFromInsForge, listReportsForProperty, deleteReport } from '@/lib/financial-subagent';
import pool from '@/lib/vps-pg';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get('propertyId');
    const action = searchParams.get('action') || 'get';

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId es obligatorio' }, { status: 400 });
    }

    if (action === 'list') {
      const reports = await listReportsForProperty(propertyId);
      return NextResponse.json({ reports });
    }

    const report = await getReportFromInsForge(propertyId);
    return NextResponse.json({ report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { propertyId, options, pdfBuffers } = body;

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId es obligatorio' }, { status: 400 });
    }

    // Fetch property from VPS PostgreSQL
    const propertyResult = await pool.query(
      'SELECT * FROM properties WHERE id = $1',
      [propertyId]
    );
    const property = propertyResult.rows[0];

    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 });
    }

    // Run report pipeline
    const result = await generateReportPipeline({
      property: property as any,
      options,
      pdfBuffers: pdfBuffers || [],
    });

    return NextResponse.json({
      reportId: result.reportId,
      summary: result.reportMarkdown.slice(0, 500) + '...',
      sources: result.sources,
      reportMarkdown: result.reportMarkdown,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get('reportId');
    const propertyId = searchParams.get('propertyId');

    if (reportId) {
      const ok = await deleteReport(reportId);
      return NextResponse.json({ success: ok });
    }

    if (propertyId) {
      // Delete all reports for property
      const reports = await listReportsForProperty(propertyId);
      for (const r of reports) {
        await deleteReport(r.id);
      }
      return NextResponse.json({ success: true, deleted: reports.length });
    }

    return NextResponse.json({ error: 'reportId o propertyId obligatorio' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
