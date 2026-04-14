const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('fs');

const supabase = createClient('https://kfmjhoiropvyevykvqey.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmbWpob2lyb3B2eWV2eWt2cWV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTcwNTA3MywiZXhwIjoyMDg3MjgxMDczfQ.yS9a0r4PUSASs50SOC3Q5H4Z-Q9HfYUHz2vLHwK21es');

const FOLDER = '/Users/albertogala/Library/CloudStorage/Dropbox/Activos AleaSignature/Por inversor/compressed';

async function upload(filePath, propertyId, title) {
  try {
    const buffer = readFileSync(filePath);
    const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    const safeName = filePath.split('/').pop().replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = propertyId + '/' + Date.now() + '_' + safeName;
    
    const { error } = await supabase.storage.from('dossiers').upload(storagePath, uint8Array, { contentType: 'application/pdf', upsert: true });
    if (error) { console.log('Upload error:', error.message); return false; }
    
    const { data: { publicUrl } } = supabase.storage.from('dossiers').getPublicUrl(storagePath);
    const { error: dbError } = await supabase.from('documents').insert({ property_id: propertyId, title, file_path: publicUrl, document_type: 'document' });
    if (dbError) { console.log('DB error:', dbError.message); return false; }
    return true;
  } catch (e) {
    console.log('Error:', e.message);
    return false;
  }
}

async function main() {
  console.log('Subiendo archivos pendientes...\n');
  
  const r1 = await upload(FOLDER + '/EDIFICIO OFICINAS VALENTIN BEATO (CF)_ultra_compressed.pdf', 'c336e9cc-a939-47e3-b153-9a74e926ba9b', 'Edificio Valentin Beatot - Comprimido');
  console.log('EDIFICIO:', r1 ? '✅' : '❌');
  
  const r2 = await upload(FOLDER + '/Presentacion Modificada Operacioěn Financiera Cadena Izan Hoteles con desglose del  Proyecto de Sale & Lease Back del Hotel Iza´n Cavanna Marzo 2019 v2 _compressed.pdf', 'c56afa6b-e26e-438e-a4c7-83bd2eafe159', 'Presentacion Modificada Izan Hoteles');
  console.log('Presentacion:', r2 ? '✅' : '❌');
  
  console.log('\n✅ Completado!');
}

main();