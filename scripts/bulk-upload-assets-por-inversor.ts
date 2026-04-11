import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync, readdir } from 'fs';
import { join, basename, extname } from 'path';
import * as pdfjsLib from 'pdfjs-dist';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Carpeta raíz con activos por inversor
const FOLDER_PATH = '/Users/albertogala/Library/CloudStorage/Dropbox/Activos AleaSignature/Por inversor';

// Mapeo de carpetas a inversores (crear si no existen)
const INVESTOR_MAPPINGS: Record<string, { name: string; company?: string; email?: string }> = {
  'ACTIVOS ALEX': { name: 'Alex', company: 'Alex Inversiones' },
  'ACTIVOS RAFA': { name: 'Rafa', company: 'Rafa Gestión de Activos' },
  'ACTIVOS CARLOS & DAVID': { name: 'Carlos & David', company: 'CD Inversiones' },
  'ACTIVOS MÓNICA': { name: 'Mónica', company: 'Mónica Inversiones' },
  'ACTIVOS SILVIA': { name: 'Silvia', company: 'Silvia Gestión' },
  'ACTIVOS KUBIK': { name: 'Kubik', company: 'Kubik Investments' },
};

// Mapeo de archivos principales a propiedades
// El primer PDF de cada carpeta será la propiedad principal (dossier)
const PROPERTY_MAPPINGS: Record<string, { title: string; asset_type: string; location: string; price_eur: number }> = {
  // ACTIVOS ALEX
  'Dossier Palacio Trinidad Grund-5 2.pdf': { title: 'Palacio Trinidad Grund', asset_type: 'residential', location: 'Madrid', price_eur: 0 },
  'HOTELES IZAN.pdf': { title: 'Hotel IZAN - Cadena Hotels', asset_type: 'hotel', location: 'España', price_eur: 15000000 },
  'Café Chinitas- 2025.pdf': { title: 'Café Chinitas', asset_type: 'commercial', location: 'Madrid', price_eur: 0 },
  'PROYECTO OLIVIA PAGODA FUENGIROLA.pdf': { title: 'Olivia Pagoda - Fuengirola', asset_type: 'residential', location: 'Fuengirola, Málaga', price_eur: 0 },
  
  // ACTIVOS RAFA
  'EDIFICIO OFICINAS VALENTIN BEATO (CF).pdf': { title: 'Edificio Oficinas Valentin Beatot', asset_type: 'commercial', location: 'Madrid', price_eur: 4500000 },
  'JA4_Teaser_vDEF1.pdf': { title: 'JA4 - Activo Residencial Madrid', asset_type: 'residential', location: 'Madrid', price_eur: 3200000 },
  'Dossier Conde de la Cimera 6 _ vr.pdf': { title: 'Conde de la Cimera 6', asset_type: 'residential', location: 'Madrid', price_eur: 2800000 },
  'Proyecto de Habitaciones _ Zona Chueca _VR..pdf': { title: 'Chueca - Proyecto de Habitaciones', asset_type: 'residential', location: 'Chueca, Madrid', price_eur: 1800000 },
  'SALINAS 10 -MALAGA - Ref. M0060-25.pdf': { title: 'Salinas 10 - Málaga', asset_type: 'residential', location: 'Málaga', price_eur: 0 },
  'Cuaderno informativo administración loterias Maruja.pdf': { title: 'Loterías Maruja', asset_type: 'commercial', location: 'Madrid', price_eur: 0 },
  
  // ACTIVOS CARLOS & DAVID
  'Hotel Puerta América (2).pdf': { title: 'Hotel Puerta América', asset_type: 'hotel', location: 'Madrid', price_eur: 0 },
  'Plan Suelo Móstoles .pdf': { title: 'Suelo Urbano Móstoles', asset_type: 'land', location: 'Móstoles, Madrid', price_eur: 0 },
  'SUELO URBANO CALLE JAÉN 5 MOSTOLES.pdf': { title: 'Suelo Urbano Jaén 5 - Móstoles', asset_type: 'land', location: 'Móstoles, Madrid', price_eur: 0 },
  
  // ACTIVOS MÓNICA
  'Edificio emblemático Triana 87 versión2 (1) (1).pdf': { title: 'Edificio Triana 87', asset_type: 'residential', location: 'Las Palmas', price_eur: 0 },
  'BLOQUE RESIDENCIAL ALICANTE.pdf': { title: 'Bloque Residencial Alicante', asset_type: 'residential', location: 'Alicante', price_eur: 0 },
  'Canarias.pdf': { title: 'Activo Canarias', asset_type: 'land', location: 'Canarias', price_eur: 0 },
  
  // ACTIVOS SILVIA
  'Plaza Santa Ana 13 vf3.pdf': { title: 'Plaza Santa Ana 13', asset_type: 'residential', location: 'Madrid', price_eur: 0 },
  '3–77 PLANOS PISO BARBARA DE BRAGANZA.pdf': { title: 'Piso Bárbara de Braganza', asset_type: 'residential', location: 'Madrid', price_eur: 0 },
  
  // ACTIVOS KUBIK
  'TERRENO TORREMOLINOS.pdf': { title: 'Terreno Torremolinos', asset_type: 'land', location: 'Torremolinos, Málaga', price_eur: 0 },
};

async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const data = readFileSync(filePath);
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let text = '';
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return text.substring(0, 5000);
  } catch (e: any) {
    console.error('PDF extraction error:', e.message);
    return '';
  }
}

async function uploadFile(filePath: string, folder: string): Promise<string | null> {
  try {
    const fileName = basename(filePath);
    const arrayBuffer = readFileSync(filePath).buffer;
    const array = new Uint8Array(arrayBuffer);
    
    const ext = extname(fileName).toLowerCase();
    const contentType = ext === '.pdf' ? 'application/pdf' : 
                       ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                       ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                       ext === '.png' ? 'image/png' : 'application/octet-stream';

    const filePathInStorage = `${folder}/${Date.now()}_${fileName}`;

    const { data, error } = await supabase.storage
      .from('dossiers')
      .upload(filePathInStorage, array, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('dossiers')
      .getPublicUrl(filePathInStorage);

    return publicUrl;
  } catch (e: any) {
    console.error('Upload exception:', e.message);
    return null;
  }
}

async function findOrCreateInvestor(investorData: { name: string; company?: string; email?: string }) {
  // Buscar inversor por nombre o email
  let { data: existing } = await supabase
    .from('investors')
    .select('*')
    .or(`full_name.ilike.%${investorData.name}%,company_name.ilike.%${investorData.company || investorData.name}%`)
    .maybeSingle();

  if (existing) {
    console.log(`   👤 Found existing investor: ${existing.full_name} (${existing.id})`);
    return existing;
  }

  // Crear nuevo inversor
  const { data: newInvestor, error } = await supabase
    .from('investors')
    .insert({
      full_name: investorData.name,
      company_name: investorData.company,
      email: investorData.email || `${investorData.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
      investor_type: 'private',
      kyc_status: 'approved',
      labels: ['bulk-upload']
    })
    .select()
    .single();

  if (error) {
    console.error('   ❌ Error creating investor:', error);
    return null;
  }

  console.log(`   ✅ Created new investor: ${newInvestor.full_name} (${newInvestor.id})`);
  return newInvestor;
}

async function createProperty(propertyData: { title: string; asset_type: string; location: string; price_eur: number }, investorId: string | null, fileUrl: string | null, extractedText: string) {
  const { data, error } = await supabase
    .from('properties')
    .insert({
      title: propertyData.title,
      description: extractedText.substring(0, 2000),
      asset_type: propertyData.asset_type,
      location: propertyData.location,
      price_eur: propertyData.price_eur,
      is_off_market: true,
      is_published: false,
      thumbnail_url: fileUrl,
      owner_id: investorId
    })
    .select()
    .single();

  if (error) {
    console.error('   ❌ Property insert error:', error);
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
    console.error('   ❌ Document insert error:', error);
    return null;
  }
  return data;
}

async function processInvestorFolder(folderPath: string, folderName: string) {
  console.log(`\n📂 Processing folder: ${folderName}`);
  
  const investorData = INVESTOR_MAPPINGS[folderName];
  if (!investorData) {
    console.log(`   ⚠️ No mapping found for ${folderName}, skipping`);
    return;
  }

  // Find or create investor
  const investor = await findOrCreateInvestor(investorData);
  if (!investor) {
    console.log(`   ❌ Could not find or create investor for ${folderName}`);
    return;
  }

  // Read files in folder
  const files = readdirSync(folderPath);
  const pdfFiles = files.filter(f => f.endsWith('.pdf'));
  const imageFiles = files.filter(f => f.match(/\.(jpg|jpeg|png)$/i));
  
  console.log(`   📄 ${pdfFiles.length} PDFs, 🖼️ ${imageFiles.length} images`);

  // Find main property file (dossier)
  let mainPropertyFile = pdfFiles.find(f => PROPERTY_MAPPINGS[f]);
  
  if (!mainPropertyFile) {
    // Use first PDF as main property
    mainPropertyFile = pdfFiles[0];
  }

  if (!mainPropertyFile) {
    console.log(`   ⚠️ No PDF files found in ${folderName}`);
    return;
  }

  const mainFilePath = join(folderPath, mainPropertyFile);
  const mapping = PROPERTY_MAPPINGS[mainPropertyFile] || {
    title: mainPropertyFile.replace(/\.pdf$/i, ''),
    asset_type: 'residential',
    location: 'España',
    price_eur: 0
  };

  console.log(`\n   🏠 Creating property: ${mapping.title}`);
  
  // Extract text from main PDF
  const extractedText = await extractTextFromPDF(mainFilePath);
  
  // Upload main file
  const mainUrl = await uploadFile(mainFilePath, 'properties');
  
  // Create property
  const property = await createProperty(mapping, investor.id, mainUrl, extractedText);
  
  if (!property) {
    console.log(`   ❌ Failed to create property`);
    return;
  }

  console.log(`   ✅ Created property: ${property.id}`);

  // Upload additional files as documents
  const allFiles = [...pdfFiles, ...imageFiles].filter(f => f !== mainPropertyFile);
  
  for (const file of allFiles.slice(0, 10)) { // Limit to 10 additional files
    const filePath = join(folderPath, file);
    const docType = file.match(/\.(jpg|jpeg|png)$/i) ? 'image' : 'document';
    console.log(`      📎 Uploading: ${file}`);
    await createDocument(property.id, filePath, file.replace(/\.[^.]+$/, ''), docType);
  }
}

async function main() {
  console.log('🚀 Starting bulk upload from Por inversor folder\n');
  console.log(`📁 Folder: ${FOLDER_PATH}\n`);

  // Read investor folders
  const items = readdirSync(FOLDER_PATH);
  const investorFolders = items.filter(item => {
    const itemPath = join(FOLDER_PATH, item);
    return statSync(itemPath).isDirectory() && item.startsWith('ACTIVOS');
  });

  console.log(`Found ${investorFolders.length} investor folders\n`);

  for (const folder of investorFolders) {
    const folderPath = join(FOLDER_PATH, folder);
    await processInvestorFolder(folderPath, folder);
  }

  console.log('\n\n✅ Bulk upload completed!');
}

main().catch(console.error);