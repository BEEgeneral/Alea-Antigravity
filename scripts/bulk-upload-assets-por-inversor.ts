import { createClient } from '@supabase/supabase-js';
import { readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';

const supabaseUrl = 'https://kfmjhoiropvyevykvqey.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmbWpob2lyb3B2eWV2eWt2cWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTcwNTA3MywiZXhwIjoyMDg3MjgxMDczfQ.yS9a0r4PUSASs50SOC3Q5H4Z-Q9HfYUHz2vLHwK21es';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const FOLDER_PATH = '/Users/albertogala/Library/CloudStorage/Dropbox/Activos AleaSignature/Por inversor';

const INVESTOR_MAPPINGS: Record<string, { name: string; company?: string }> = {
  'ACTIVOS ALEX': { name: 'Alex', company: 'Alex Inversiones' },
  'ACTIVOS RAFA': { name: 'Rafa', company: 'Rafa Gestión de Activos' },
  'ACTIVOS CARLOS & DAVID': { name: 'Carlos & David', company: 'CD Inversiones' },
  'ACTIVOS MÓNICA': { name: 'Mónica', company: 'Mónica Inversiones' },
  'ACTIVOS SILVIA': { name: 'Silvia', company: 'Silvia Gestión' },
  'ACTIVOS KUBIK': { name: 'Kubik', company: 'Kubik Investments' },
};

const PROPERTY_MAPPINGS: Record<string, { title: string; asset_type: string; location: string; price_eur: number }> = {
  'Dossier Palacio Trinidad Grund-5 2.pdf': { title: 'Palacio Trinidad Grund', asset_type: 'residential', location: 'Madrid', price_eur: 4500000 },
  'HOTELES IZAN.pdf': { title: 'Hotel IZAN - Cadena Hotels', asset_type: 'hotel', location: 'España', price_eur: 15000000 },
  'Café Chinitas- 2025.pdf': { title: 'Café Chinitas', asset_type: 'commercial', location: 'Madrid', price_eur: 2500000 },
  'PROYECTO OLIVIA PAGODA FUENGIROLA.pdf': { title: 'Olivia Pagoda - Fuengirola', asset_type: 'residential', location: 'Fuengirola, Málaga', price_eur: 3200000 },
  'EDIFICIO OFICINAS VALENTIN BEATO (CF).pdf': { title: 'Edificio Oficinas Valentin Beatot', asset_type: 'commercial', location: 'Madrid', price_eur: 4500000 },
  'JA4_Teaser_vDEF1.pdf': { title: 'JA4 - Activo Residencial Madrid', asset_type: 'residential', location: 'Madrid', price_eur: 3200000 },
  'Dossier Conde de la Cimera 6 _ vr.pdf': { title: 'Conde de la Cimera 6', asset_type: 'residential', location: 'Madrid', price_eur: 2800000 },
  'Proyecto de Habitaciones _ Zona Chueca _VR..pdf': { title: 'Chueca - Proyecto de Habitaciones', asset_type: 'residential', location: 'Chueca, Madrid', price_eur: 1800000 },
  'SALINAS 10 -MALAGA - Ref. M0060-25.pdf': { title: 'Salinas 10 - Málaga', asset_type: 'residential', location: 'Málaga', price_eur: 2100000 },
  'Cuaderno informativo administración loterias Maruja.pdf': { title: 'Loterías Maruja', asset_type: 'commercial', location: 'Madrid', price_eur: 890000 },
  'Hotel Puerta América (2).pdf': { title: 'Hotel Puerta América', asset_type: 'hotel', location: 'Madrid', price_eur: 8500000 },
  'Plan Suelo Móstoles .pdf': { title: 'Suelo Urbano Móstoles', asset_type: 'land', location: 'Móstoles, Madrid', price_eur: 1200000 },
  'SUELO URBANO CALLE JAÉN 5 MOSTOLES.pdf': { title: 'Suelo Urbano Jaén 5 - Móstoles', asset_type: 'land', location: 'Móstoles, Madrid', price_eur: 950000 },
  'Edificio emblemático Triana 87 versión2 (1) (1).pdf': { title: 'Edificio Triana 87', asset_type: 'residential', location: 'Las Palmas', price_eur: 1750000 },
  'BLOQUE RESIDENCIAL ALICANTE.pdf': { title: 'Bloque Residencial Alicante', asset_type: 'residential', location: 'Alicante', price_eur: 2100000 },
  'Canarias.pdf': { title: 'Activo Canarias', asset_type: 'land', location: 'Canarias', price_eur: 1500000 },
  'Plaza Santa Ana 13 vf3.pdf': { title: 'Plaza Santa Ana 13', asset_type: 'residential', location: 'Madrid', price_eur: 1250000 },
  '3–77 PLANOS PISO BARBARA DE BRAGANZA.pdf': { title: 'Piso Bárbara de Braganza', asset_type: 'residential', location: 'Madrid', price_eur: 950000 },
  'TERRENO TORREMOLINOS.pdf': { title: 'Terreno Torremolinos', asset_type: 'land', location: 'Torremolinos, Málaga', price_eur: 750000 },
};

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 80);
}

function bufferToUint8Array(buffer: Buffer): Uint8Array {
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

async function uploadFile(filePath: string, folder: string): Promise<string | null> {
  try {
    const fileName = basename(filePath);
    const safeName = sanitizeFileName(fileName);
    const stat = statSync(filePath);
    
    if (stat.size > 50 * 1024 * 1024) {
      console.log(`      ⚠️ File too large (${Math.round(stat.size / 1024 / 1024)}MB), skipping`);
      return null;
    }
    
    const buffer = require('fs').readFileSync(filePath);
    const uint8Array = bufferToUint8Array(buffer);
    
    const ext = extname(fileName).toLowerCase();
    const contentType = ext === '.pdf' ? 'application/pdf' : 
                       ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                       ext === '.png' ? 'image/png' : 'application/octet-stream';

    const filePathInStorage = `${folder}/${Date.now()}_${safeName}`;

    const { data, error } = await supabase.storage
      .from('dossiers')
      .upload(filePathInStorage, uint8Array, {
        contentType,
        upsert: true
      });

    if (error) {
      console.log(`      ⚠️ Storage error: ${error.message}`);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('dossiers')
      .getPublicUrl(filePathInStorage);

    return publicUrl;
  } catch (e: any) {
    console.log(`      ⚠️ Upload error: ${e.message}`);
    return null;
  }
}

async function findOrCreateInvestor(investorData: { name: string; company?: string }) {
  let { data: existing } = await supabase
    .from('investors')
    .select('*')
    .or(`full_name.ilike.%${investorData.name}%,company_name.ilike.%${investorData.company || investorData.name}%`)
    .maybeSingle();

  if (existing) {
    console.log(`   👤 Found: ${existing.full_name} (${existing.id})`);
    return existing;
  }

  const { data: newInvestor, error } = await supabase
    .from('investors')
    .insert({
      full_name: investorData.name,
      company_name: investorData.company,
      email: `${investorData.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      investor_type: 'private',
      kyc_status: 'approved'
    })
    .select()
    .single();

  if (error) {
    console.log(`   ❌ Investor error: ${error.message}`);
    return null;
  }

  console.log(`   ✅ Created: ${newInvestor.full_name} (${newInvestor.id})`);
  return newInvestor;
}

async function createProperty(propertyData: { title: string; asset_type: string; location: string; price_eur: number }, investorId: string | null, fileUrl: string | null) {
  const { data, error } = await supabase
    .from('properties')
    .insert({
      title: propertyData.title,
      asset_type: propertyData.asset_type,
      location: propertyData.location,
      price_eur: propertyData.price_eur,
      is_off_market: true,
      thumbnail_url: fileUrl,
      owner_id: investorId
    })
    .select()
    .single();

  if (error) {
    console.log(`   ❌ Property error: ${JSON.stringify(error)}`);
    return null;
  }
  return data;
}

async function createDocument(propertyId: string, filePath: string, title: string, docType: string) {
  const url = await uploadFile(filePath, 'documents');
  if (!url) return null;

  const { data, error } = await supabase
    .from('documents')
    .insert({
      property_id: propertyId,
      title,
      file_path: url,
      document_type: docType
    })
    .select()
    .single();

  if (error) {
    console.log(`   ❌ Document error: ${error.message}`);
    return null;
  }
  return data;
}

async function processInvestorFolder(folderPath: string, folderName: string) {
  console.log(`\n📂 ${folderName}`);
  
  const investorData = INVESTOR_MAPPINGS[folderName];
  if (!investorData) {
    console.log(`   ⚠️ No mapping, skipping`);
    return;
  }

  const investor = await findOrCreateInvestor(investorData);
  if (!investor) return;

  const files = readdirSync(folderPath);
  const pdfFiles = files.filter(f => f.endsWith('.pdf'));
  const imageFiles = files.filter(f => f.match(/\.(jpg|jpeg|png)$/i));
  
  console.log(`   📄 ${pdfFiles.length} PDFs, 🖼️ ${imageFiles.length} images`);

  let mainPropertyFile = pdfFiles.find(f => PROPERTY_MAPPINGS[f]);
  
  if (!mainPropertyFile && pdfFiles.length > 0) {
    mainPropertyFile = pdfFiles[0];
  }

  if (!mainPropertyFile) {
    console.log(`   ⚠️ No PDFs found`);
    return;
  }

  const mainFilePath = join(folderPath, mainPropertyFile);
  const mapping = PROPERTY_MAPPINGS[mainPropertyFile] || {
    title: mainPropertyFile.replace(/\.pdf$/i, ''),
    asset_type: 'residential',
    location: 'Madrid',
    price_eur: 1000000
  };

  console.log(`\n   🏠 Creating: ${mapping.title} (€${mapping.price_eur.toLocaleString()})`);
  
  const mainUrl = await uploadFile(mainFilePath, 'properties');
  const property = await createProperty(mapping, investor.id, mainUrl);
  
  if (!property) {
    return;
  }

  console.log(`   ✅ Property: ${property.id}`);

  const allFiles = [...pdfFiles, ...imageFiles].filter(f => f !== mainPropertyFile);
  
  for (const file of allFiles.slice(0, 8)) {
    const filePath = join(folderPath, file);
    const docType = file.match(/\.(jpg|jpeg|png)$/i) ? 'image' : 'document';
    console.log(`      📎 ${file.substring(0, 45)}...`);
    await createDocument(property.id, filePath, file.replace(/\.[^.]+$/, '').substring(0, 80), docType);
  }
}

async function main() {
  console.log('🚀 Bulk Upload - Por Inversor\n');

  const items = readdirSync(FOLDER_PATH);
  const investorFolders = items.filter(item => {
    const itemPath = join(FOLDER_PATH, item);
    return statSync(itemPath).isDirectory() && item.startsWith('ACTIVOS');
  });

  console.log(`Found ${investorFolders.length} folders\n`);

  for (const folder of investorFolders) {
    await processInvestorFolder(join(FOLDER_PATH, folder), folder);
  }

  console.log('\n\n✅ Done!');
}

main().catch(console.error);