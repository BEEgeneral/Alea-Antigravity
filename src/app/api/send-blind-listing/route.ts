import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { env } from '@/lib/env';
import { insforgeAdmin } from '@/lib/insforge-admin';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
  try {
    const { investorId, propertyIds, subject, customMessage } = await req.json();

    if (!investorId) {
      return NextResponse.json({ error: 'Missing investor ID' }, { status: 400 });
    }

    if (!resend) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    // Get investor details
    const { data: investor } = await insforgeAdmin
      .database
      .from('investors')
      .select('*')
      .eq('id', investorId)
      .single();

    if (!investor) {
      return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
    }

    // Get properties
    let propertiesQuery = insforgeAdmin
      .database
      .from('properties')
      .select('id, title, address, asset_type, price, is_off_market, thumbnail_url')
      .eq('is_published', true);

    if (propertyIds && propertyIds.length > 0) {
      propertiesQuery = propertiesQuery.in('id', propertyIds);
    } else {
      propertiesQuery = propertiesQuery.order('created_at', { ascending: false }).limit(12);
    }

    const { data: properties } = await propertiesQuery;
    const propertyList = (properties || []).map((p: any) => ({
      ...p,
      ref: `REF-${p.id.slice(0, 4).toUpperCase()}`,
      minPrice: Number(p.price) * 0.9,
      maxPrice: Number(p.price) * 1.1
    }));

    // Generate HTML content
    const propertyCards = propertyList.map(p => `
      <div style="border: 1px solid #e5e5e5; border-radius: 12px; padding: 20px; margin-bottom: 16px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <div>
            <span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: bold; text-transform: uppercase;">
              ${p.is_off_market ? 'ORIGEN PRIVADO' : 'DISPONIBLE'}
            </span>
            <span style="background: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 10px; font-weight: bold; text-transform: uppercase; margin-left: 8px;">
              ${p.asset_type?.toUpperCase() || 'TIPO'}
            </span>
          </div>
          <span style="color: #666; font-size: 12px;">${p.ref}</span>
        </div>
        <div style="background: #f3f4f6; height: 150px; border-radius: 8px; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; color: #666; font-size: 12px;">
          [IMAGEN DEL ACTIVO - Solicite acceso para ver]
        </div>
        <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1f2937;">
          CONFIDENCIAL: ${(p.address || 'UBICACIÓN PROTEGIDA').toUpperCase()}
        </h3>
        <p style="margin: 0 0 16px 0; color: #666; font-size: 13px;">
          Datos completos protegidos por NDA. Solicite acceso a su agente.
        </p>
        <div style="border-top: 1px solid #e5e5e5; padding-top: 16px;">
          <p style="margin: 0; color: #666; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
            RANGO DE INVERSIÓN ESTIMADO
          </p>
          <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold; color: #059669;">
            €${(p.minPrice / 1000000).toFixed(1)}M - €${(p.maxPrice / 1000000).toFixed(1)}M
          </p>
        </div>
      </div>
    `).join('');

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Radar de Inversión - Alea Signature</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1f2937;">
  <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #059669; padding-bottom: 24px;">
    <div style="font-size: 24px; font-weight: bold; color: #059669;">alea signature</div>
    <p style="color: #666; font-size: 14px; margin-top: 8px;">Radar de Inversión - Documento Confidencial</p>
  </div>
  
  <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin-bottom: 32px; font-size: 12px;">
    <strong style="color: #92400e;">⚠️ AVISO LEGAL:</strong> Este documento contiene información confidencial de activos inmobiliarios 
    de origen privado. La distribución está limitada a inversores registrados bajo el Acuerdo de Confidencialidad (NDA) 
    vigente. Queda prohibida la redistribución sin autorización expresa.
  </div>
  
  ${customMessage ? `
  <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 32px;">
    <p style="margin: 0; color: #374151; font-size: 14px; font-style: italic;">"${customMessage}"</p>
  </div>
  ` : ''}
  
  <div style="margin-bottom: 32px;">
    <p style="color: #666; font-size: 13px;"><strong>Destinatario:</strong> ${investor.full_name || investor.company_name || 'Invester'}</p>
    <p style="color: #666; font-size: 13px;"><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p style="color: #666; font-size: 13px;"><strong>Propiedades seleccionadas:</strong> ${propertyList.length}</p>
  </div>
  
  <div style="margin-top: 32px;">
    ${propertyCards}
  </div>
  
  <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e5e5; text-align: center; color: #999; font-size: 11px;">
    <p style="margin: 0;">Alea Signature - Inteligencia Patrimonial</p>
    <p style="margin: 8px 0 0 0;">Para más información, contacte con su agente asignado o responda a este email.</p>
  </div>
</body>
</html>
    `.trim();

    // Send email
    const emailSubject = subject || `Radar de Inversión - ${propertyList.length} oportunidades para ${investor.full_name || 'usted'}`;
    
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: investor.email,
      subject: emailSubject,
      html: htmlContent,
    });

    if (error) {
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update interests status to contacted
    if (propertyIds && propertyIds.length > 0) {
      await insforgeAdmin
        .database
        .from('investor_interests')
        .update({ status: 'contacted' })
        .eq('investor_id', investorId)
        .eq('property_id', propertyIds[0]);
    }

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      recipient: investor.email,
      propertyCount: propertyList.length
    });

  } catch (error: any) {
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
