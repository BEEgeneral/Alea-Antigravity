import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';

const supabaseUrl = 'https://kfmjhoiropvyevykvqey.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmbWpob2lyb3B2eWV2eWt2cWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTcwNTA3MywiZXhwIjoyMDg3MjgxMDczfQ.yS9a0r4PUSASs50SOC3Q5H4Z-Q9HfYUHz2vLHwK21es';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const FOLDER_PATH = '/Users/albertogala/Library/CloudStorage/Dropbox/Activos AleaSignature/Por inversor';

// Mapeo de propiedades por carpeta
const PROPERTY_BY_FOLDER: Record<string, string> = {
  'ACTIVOS ALEX': 'Palacio Trinidad Grund',
  'ACTIVOS RAFA': 'Conde de la Cimera 6',
  'ACTIVOS CARLOS & DAVID': 'Hotel Puerta América',
  'ACTIVOS MÓNICA': 'Edificio Triana 87',
  'ACTIVOS SILVIA': 'Plaza Santa Ana 13',
  'ACTIVOS KUBIK': 'Terreno Torremolinos',
};

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 80);
}

function bufferToUint8Array(buffer: Buffer): Uint8Array {
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

async function getPropertyId(title: string): Promise<string | null> {
  const { data } = await supabase
    .from('properties')
    .select('id')
    .ilike('title', `%${title.split(' ')[0]}%`)
    .limit(1)
    .maybeSingle();
  return data?.id || null;
}

async function uploadFile(filePath: string, folder: string): Promise<string | null> {
  try {
    const fileName = basename(filePath);
    const safeName = sanitizeFileName(fileName);
    const stat = statSync(filePath);
    
    if (stat.size > 50 * 1024 * 1024) {
      console.log(`      ⚠️ Too large (${Math.round(stat.size / 1024 / 1024)}MB): ${fileName.substring(0, 30)}`);
      return null;
    }
    
    const buffer = readFileSync(filePath);
    const uint8Array = bufferToUint8Array(buffer);
    
    const ext = extname(fileName).toLowerCase();
    const contentType = ext === '.pdf' ? 'application/pdf' : 
                       ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                       ext === '.png' ? 'image/png' : 'application/octet-stream';

    const filePathInStorage = `${folder}/${Date.now()}_${safeName}`;

    const { error } = await supabase.storage
      .from('dossiers')
      .upload(filePathInStorage, uint8Array, {
        contentType,
        upsert: true
      });

    if (error) {
      console.log(`      ⚠️ Upload error: ${error.message}`);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('dossiers')
      .getPublicUrl(filePathInStorage);

    return publicUrl;
  } catch (e: any) {
    console.log(`      ⚠️ Error: ${e.message}`);
    return null;
  }
}

async function createDocument(propertyId: string, filePath: string, title: string, docType: string): Promise<boolean> {
  const url = await uploadFile(filePath, propertyId);
  if (!url) return false;

  const { error } = await supabase
    .from('documents')
    .insert({
      property_id: propertyId,
      title,
      file_path: url,
      document_type: docType
    });

  if (error) {
    console.log(`      ⚠️ DB error: ${error.message}`);
    return false;
  }
  return true;
}

async function processFolder(folderPath: string, folderName: string) {
  const propertyTitle = PROPERTY_BY_FOLDER[folderName];
  if (!propertyTitle) {
    console.log(`\n📂 ${folderName} - no mapping, skipping`);
    return;
  }

  const propertyId = await getPropertyId(propertyTitle);
  if (!propertyId) {
    console.log(`\n📂 ${folderName} - property not found: ${propertyTitle}`);
    return;
  }

  console.log(`\n📂 ${folderName} → ${propertyTitle} (${propertyId.substring(0, 8)}...)`);

  const files = readdirSync(folderPath);
  const pdfFiles = files.filter(f => f.endsWith('.pdf'));
  const imageFiles = files.filter(f => f.match(/\.(jpg|jpeg|png)$/i));
  
  console.log(`   📄 ${pdfFiles.length} PDFs, 🖼️ ${imageFiles.length} images`);

  // Upload PDFs as documents
  for (const file of pdfFiles.slice(0, 15)) {
    const filePath = join(folderPath, file);
    console.log(`   📄 ${file.substring(0, 50)}...`);
    await createDocument(propertyId, filePath, file.replace(/\.[^.]+$/, '').substring(0, 100), 'document');
  }

  // Upload images as documents
  for (const file of imageFiles.slice(0, 15)) {
    const filePath = join(folderPath, file);
    console.log(`   🖼️ ${file.substring(0, 50)}...`);
    await createDocument(propertyId, filePath, file.replace(/\.[^.]+$/, '').substring(0, 100), 'image');
  }
}

async function main() {
  console.log('🚀 Uploading documents to Supabase\n');

  const items = readdirSync(FOLDER_PATH);
  const folders = items.filter(item => {
    const itemPath = join(FOLDER_PATH, item);
    return statSync(itemPath).isDirectory() && item.startsWith('ACTIVOS');
  });

  console.log(`Found ${folders.length} folders\n`);

  for (const folder of folders) {
    await processFolder(join(FOLDER_PATH, folder), folder);
  }

  console.log('\n\n✅ Documents upload completed!');
}

main().catch(console.error);