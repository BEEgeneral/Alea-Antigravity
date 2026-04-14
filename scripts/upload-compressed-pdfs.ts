import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, basename, extname } from 'path';

const supabaseUrl = 'https://kfmjhoiropvyevykvqey.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmbWpob2lyb3B2eWV2eWt2cWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTcwNTA3MywiZXhwIjoyMDg3MjgxMDczfQ.yS9a0r4PUSASs50SOC3Q5H4Z-Q9HfYUHz2vLHwK21es';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Map compressed files to properties
const COMPRESSED_FILES: Record<string, { propertyTitle: string; fileName: string }> = {
  'Av. Monte 20 CSD FOTOGRAFÍAS 2024 sin infografía_compressed.pdf': { propertyTitle: 'Conde de la Cimera 6', fileName: 'Av. Monte 20 CSD FOTOGRAFÍAS 2024 sin infografía_compressed.pdf' },
  'EDIFICIO OFICINAS VALENTIN BEATO (CF)_compressed.pdf': { propertyTitle: 'Edificio Oficinas Valentin Beatot', fileName: 'EDIFICIO OFICINAS VALENTIN BEATO (CF)_compressed.pdf' },
  'Plaza Nueva - MB (1)_compressed.pdf': { propertyTitle: 'Conde de la Cimera 6', fileName: 'Plaza Nueva - MB (1)_compressed.pdf' },
  'Dossier Palacio Trinidad Grund-5 2_compressed.pdf': { propertyTitle: 'Palacio Trinidad Grund', fileName: 'Dossier Palacio Trinidad Grund-5 2_compressed.pdf' },
  'HOTELES IZAN_compressed.pdf': { propertyTitle: 'Hotel IZAN - Cadena Hotels', fileName: 'HOTELES IZAN_compressed.pdf' },
  'Presentacion Modificada Operacioěn Financiera Cadena Izan Hoteles_compressed.pdf': { propertyTitle: 'Hotel IZAN - Cadena Hotels', fileName: 'Presentacion Modificada Operacioěn Financiera Cadena Izan Hoteles con desglose del  Proyecto de Sale & Lease Back del Hotel Iza´n Cavanna Marzo 2019 v2 _compressed.pdf' },
};

const COMPRESSED_FOLDER = '/Users/albertogala/Library/CloudStorage/Dropbox/Activos AleaSignature/Por inversor/compressed';

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

async function uploadAndLink(filePath: string, propertyId: string, title: string): Promise<boolean> {
  try {
    const fileName = basename(filePath);
    const buffer = readFileSync(filePath);
    const uint8Array = bufferToUint8Array(buffer);

    const filePathInStorage = `${propertyId}/${Date.now()}_${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('dossiers')
      .upload(filePathInStorage, uint8Array, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.log(`   ⚠️ Upload error: ${uploadError.message}`);
      return false;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('dossiers')
      .getPublicUrl(filePathInStorage);

    const { error: dbError } = await supabase
      .from('documents')
      .insert({
        property_id: propertyId,
        title: title.replace('_compressed.pdf', '').replace('_compressed', ''),
        file_path: publicUrl,
        document_type: 'document'
      });

    if (dbError) {
      console.log(`   ⚠️ DB error: ${dbError.message}`);
      return false;
    }

    return true;
  } catch (e: any) {
    console.log(`   ⚠️ Error: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Uploading compressed PDFs...\n');

  const files = readdirSync(COMPRESSED_FOLDER).filter(f => f.endsWith('.pdf'));
  console.log(`Found ${files.length} compressed files\n`);

  let uploaded = 0;
  let failed = 0;

  for (const file of files) {
    const mapping = COMPRESSED_FILES[file];
    if (!mapping) {
      console.log(`⚠️ No mapping for: ${file}`);
      continue;
    }

    const propertyId = await getPropertyId(mapping.propertyTitle);
    if (!propertyId) {
      console.log(`❌ Property not found: ${mapping.propertyTitle}`);
      continue;
    }

    const filePath = join(COMPRESSED_FOLDER, file);
    console.log(`📄 ${file} → ${mapping.propertyTitle}`);

    const success = await uploadAndLink(filePath, propertyId, file);
    if (success) {
      console.log(`   ✅ Uploaded and linked`);
      uploaded++;
    } else {
      console.log(`   ❌ Failed`);
      failed++;
    }
  }

  console.log(`\n\n✅ Done! Uploaded: ${uploaded}, Failed: ${failed}`);
}

main().catch(console.error);