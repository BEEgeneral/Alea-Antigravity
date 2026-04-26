import { NextResponse } from 'next/server';
import { createAuthenticatedClient } from '@/lib/insforge-server';

interface BlindListingProperty {
  id: string;
  title: string;
  address: string;
  asset_type: string;
  price: number;
  is_off_market: boolean;
  thumbnail_url: string;
  ref: string;
  minPrice: number;
  maxPrice: number;
}

export async function POST(req: Request) {
  try {
    const client = await createAuthenticatedClient();
    const { data: { user } } = await client.auth.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { investorId, propertyIds, investorEmail } = await req.json();

    if (!investorId && !investorEmail) {
      return NextResponse.json({ error: 'Missing investor ID or email' }, { status: 400 });
    }

    let investor = null;
    if (investorId) {
      const { data } = await client.database.from('investors').select('*').eq('id', investorId).single();
      investor = data;
    } else if (investorEmail) {
      const { data } = await client.database.from('investors').select('*').eq('email', investorEmail).single();
      investor = data;
    }

    if (!investor) {
      return NextResponse.json({ error: 'Investor not found' }, { status: 404 });
    }

    let properties: BlindListingProperty[] = [];
    if (propertyIds && propertyIds.length > 0) {
      const { data } = await client
        .database
        .from('properties')
        .select('id, title, address, asset_type, price, is_off_market, thumbnail_url')
        .in('id', propertyIds);
      properties = (data || []).map((p: any) => ({
        ...p,
        ref: `REF-${p.id.slice(0, 4).toUpperCase()}`,
        minPrice: Number(p.price) * 0.9,
        maxPrice: Number(p.price) * 1.1
      }));
    } else {
      const { data } = await client
        .database
        .from('properties')
        .select('id, title, address, asset_type, price, is_off_market, thumbnail_url')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(12);
      properties = (data || []).map((p: any) => ({
        ...p,
        ref: `REF-${p.id.slice(0, 4).toUpperCase()}`,
        minPrice: Number(p.price) * 0.9,
        maxPrice: Number(p.price) * 1.1
      }));
    }

    const html = generateBlindListingHTML({
      investorName: investor.full_name || investor.company_name || 'Invester',
      investorEmail: investor.email,
      properties,
      generatedAt: new Date().toISOString()
    });

    return NextResponse.json({
      html,
      propertyCount: properties.length,
      investorId: investor.id,
      investorName: investor.full_name
    });

  } catch (error: any) {
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

interface BlindListingParams {
  investorName: string;
  investorEmail: string;
  properties: BlindListingProperty[];
  generatedAt: string;
}

function generateBlindListingHTML(params: BlindListingParams): string {
  const { investorName, investorEmail, properties, generatedAt } = params;

  const propertyCards = properties.map(p => `
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
      
      <div style="background: #f3f4f6; height: 150px; border-radius: 8px; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; color: #666;">
        [IMAGEN DEL ACTIVO]
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
        <p style="margin: 4px 0 0 0; color: #999; font-size: 11px;">
          * Precio sujeto a validación de due diligence
        </p>
      </div>
    </div>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Radar de Inversión - Alea Signature</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1f2937; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #059669; padding-bottom: 24px; }
    .logo { font-size: 24px; font-weight: bold; color: #059669; }
    .subtitle { color: #666; font-size: 14px; margin-top: 8px; }
    .nda-notice { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin-bottom: 32px; font-size: 12px; }
    .nda-notice strong { color: #92400e; }
    .investor-info { margin-bottom: 24px; color: #666; font-size: 13px; }
    .property-grid { margin-top: 32px; }
    .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e5e5; text-align: center; color: #999; font-size: 11px; }
    @media print { body { padding: 20px; } .property-grid { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">alea signature</div>
    <p class="subtitle">Radar de Inversión - Documento Confidencial</p>
  </div>
  
  <div class="nda-notice">
    <strong>⚠️ AVISO LEGAL:</strong> Este documento contiene información confidencial de activos inmobiliarios 
    de origen privado. La distribución está limitada a inversores registrados bajo el Acuerdo de Confidencialidad (NDA) 
    vigente. Queda prohibida la redistribución sin autorización expresa.
  </div>
  
  <div class="investor-info">
    <p><strong>Destinatario:</strong> ${investorName}</p>
    <p><strong>Email:</strong> ${investorEmail}</p>
    <p><strong>Fecha:</strong> ${new Date(generatedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p><strong>Propiedades seleccionadas:</strong> ${properties.length}</p>
  </div>
  
  <div class="property-grid">
    ${propertyCards}
  </div>
  
  <div class="footer">
    <p>Alea Signature - Inteligencia Patrimonial</p>
    <p>Este documento ha sido generado automáticamente. Para más información, contacte con su agente asignado.</p>
  </div>
</body>
</html>
  `.trim();
}
