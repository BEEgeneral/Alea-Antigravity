import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync } from 'fs';
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

const FOLDER_PATH = '/Users/albertogala/Downloads/Activos Alea Subir';

const PROPERTY_MAPPINGS = {
  'AC228_Teaser_vDEF1.pdf': {
    title: 'AC228 - Activo Residencial Madrid',
    asset_type: 'residential',
    location: 'Madrid',
    price_eur: 4500000,
    is_off_market: true
  },
  'JA4_Teaser_vDEF1.pdf': {
    title: 'JA4 - Activo Comercial',
    asset_type: 'commercial',
    location: 'Madrid',
    price_eur: 3200000,
    is_off_market: true
  },
  'Dossier Conde de la Cimera 6 _ vr.pdf': {
    title: 'Conde de la Cimera 6 - Residencial',
    asset_type: 'residential',
    location: 'Madrid',
    price_eur: 2800000,
    is_off_market: true
  },
  'Proyecto de Habitaciones _ Zona Chueca _VR..pdf': {
    title: 'Chueca - Proyecto de Habitaciones',
    asset_type: 'residential',
    location: 'Chueca, Madrid',
    price_eur: 1800000,
    is_off_market: true
  },
  'TASACION A SEPTIEMBRE 2025 DE ESPARTINAS (1).PDF': {
    title: 'Espartinas - Tasación',
    asset_type: 'land',
    location: 'Espartinas, Sevilla',
    price_eur: 5200000,
    is_off_market: true
  },
  '8. DOSSIER DE VENTA.PDF': {
    title: 'SUP-4 Nerja - Apartahotel Sector Hotelero',
    asset_type: 'hotel',
    location: 'Nerja, Málaga',
    price_eur: 15000000,
    is_off_market: true
  }
};

const COLLABORATOR_MAPPINGS = {
  'NEWEL_ PROPUESTA DE ACUERDO DE COLABORACIÓN, CONFIDENCIALIDAD Y RECONOCIMIENTO DE HONORARIOS.docx': {
    full_name: 'NEWEL',
    company_name: 'NEWEL Colaboradores',
    source: 'collaborator'
  },
  'ACUERDO DE RECONOCIMIENTO Y REPARTO DE HONORARIOS POR INTERMEDIACIÓN firmado (1).pdf': {
    full_name: 'Acuerdo Reparto Honorarios',
    source: 'agreement'
  }
};

async function extractTextFromPDF(filePath) {
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
  } catch (e) {
    console.error('PDF extraction error:', e.message);
    return '';
  }
}

async function uploadFile(filePath, folder) {
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
}

async function createProperty(propertyData, fileUrl, extractedText) {
  const { data, error } = await supabase
    .from('properties')
    .insert({
      title: propertyData.title,
      description: extractedText.substring(0, 2000),
      asset_type: propertyData.asset_type,
      location: propertyData.location,
      price_eur: propertyData.price_eur,
      is_off_market: propertyData.is_off_market || true,
      is_published: false,
      thumbnail_url: fileUrl
    })
    .select()
    .single();

  if (error) {
    console.error('Property insert error:', error);
    return null;
  }
  return data;
}

async function createDocument(propertyId, filePath, title, docType) {
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
    console.error('Document insert error:', error);
    return null;
  }
  return data;
}

async function processMainFolder() {
  console.log('📁 Processing main folder...\n');
  const files = readdirSync(FOLDER_PATH);
  
  const properties = files.filter(f => f.endsWith('.pdf') && PROPERTY_MAPPINGS[f]);
  const collaborators = files.filter(f => f.endsWith('.pdf') || f.endsWith('.docx'));
  
  console.log(`Found ${properties.length} property files`);
  console.log(`Found ${collaborators.length} other files\n`));

  for (const file of files) {
    const filePath = join(FOLDER_PATH, file);
    
    if (PROPERTY_MAPPINGS[file]) {
      console.log(`🏠 Processing property: ${file}`);
      const mapping = PROPERTY_MAPPINGS[file];
      const extractedText = await extractTextFromPDF(filePath);
      const url = await uploadFile(filePath, 'properties');
      
      if (url) {
        const property = await createProperty(mapping, url, extractedText);
        if (property) {
          console.log(`   ✅ Created property: ${property.id}`);
        }
      }
    } else if (file.includes('ACUERDO') || file.includes('NEWEL')) {
      console.log(`🤝 Processing collaborator: ${file}`);
      const url = await uploadFile(filePath, 'collaborators');
      console.log(`   ✅ Uploaded: ${url}`);
    } else if (file.includes('NOTA') || file.includes('Requerimientos')) {
      console.log(`📝 Processing note: ${file}`);
      const url = await uploadFile(filePath, 'notes');
      console.log(`   ✅ Uploaded: ${url}`);
    }
  }
}

async function processNerjaHotel() {
  console.log('\n🏨 Processing NERJA HOTEL sector...\n');
  const folder = join(FOLDER_PATH, 'SECTOR HOTELERO SUP-4 NERJA_Documentación inversores');
  const files = readdirSync(folder);
  
  const mainDossier = files.find(f => f.includes('DOSSIER DE VENTA'));
  if (mainDossier) {
    const filePath = join(folder, mainDossier);
    console.log(`🏨 Processing main dossier: ${mainDossier}`);
    const mapping = PROPERTY_MAPPINGS['8. DOSSIER DE VENTA.PDF'];
    const extractedText = await extractTextFromPDF(filePath);
    const url = await uploadFile(filePath, 'properties');
    
    let property = null;
    if (url) {
      property = await createProperty(mapping, url, extractedText);
      if (property) {
        console.log(`   ✅ Created property: ${property.id}`);
        
        // Upload supporting documents
        const supportingDocs = [
          { file: '10. Descripción y precios.pdf', title: 'Descripción y Precios', type: 'pricing' },
          { file: '10. Estudio económico 2026.pdf', title: 'Estudio Económico 2026', type: 'financial' },
          { file: '9. FICHA CATASTRAL.pdf', title: 'Ficha Catastral', type: 'catastro' },
          { file: '9. NOTA SIMPLE_Sector hotelero.pdf', title: 'Nota Simple', type: 'nota_simple' },
        ];
        
        for (const doc of supportingDocs) {
          const docPath = join(folder, doc.file);
          if (readdirSync(folder).includes(doc.file)) {
            await createDocument(property.id, docPath, doc.title, doc.type);
            console.log(`   📄 Added document: ${doc.title}`);
          }
        }
      }
    }
  }
}

async function main() {
  console.log('🚀 Alea Signature - Bulk Upload Script');
  console.log('=====================================\n');
  
  await processMainFolder();
  await processNerjaHotel();
  
  console.log('\n✅ Bulk upload complete!');
}

main().catch(console.error);
