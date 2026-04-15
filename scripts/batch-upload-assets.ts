import { readFileSync } from 'fs';
import { basename, join } from 'path';

const BASE_URL = 'https://if8rkq6j.eu-central.insforge.app';
const API_KEY = 'ik_dbb952a6fd01508d4ae7f53b36e23eaf';
const BUCKET = 'activos';

const INVESTOR_MAP: Record<string, string | null> = {
  'ACTIVOS SILVIA': '5768f967-d99f-4fcb-9b7a-69ae39d082e3',
  'ACTIVOS ALEX': 'a5b5bc12-cc2c-457b-85d6-7d108b76e0ad',
  'ACTIVOS CARLOS & DAVID': '37589479-d625-411c-9934-151c88f7be53',
  'ACTIVOS KUBIK': '870708e2-392b-4564-9523-45a8e3cede99',
  'ACTIVOS RAFA': '0ae020d1-22ad-436d-86e7-cc923ee6138d',
  'ACTIVOS MÓNICA': null,
};

const PROPERTY_MAP: Record<string, string> = {
  'EDIFICIO OFICINAS VALENTIN BEATO': 'c336e9cc-a939-47e3-b153-9a74e926ba9b',
  'Palacio Trinidad Grund': 'f52a7b90-999a-4874-9328-ed29da8748fa',
  'Hotel IZAN': 'c56afa6b-e26e-438e-a4c7-83bd2eafe159',
  'Café Chinitas': '8eeddcf1-f65b-40c0-9e3f-20c6b0cf5d65',
  'Olivia Pagoda': 'b660869e-9e29-43c1-93ba-b1479652637c',
  'Conde de la Cimera': '3ab56358-0905-41cb-b7d0-d4b77fdabbd0',
  'JA4': '4e2279b7-8377-4ecb-a11c-0d3dda0f5ddc',
  'Chueca': '31d8d45a-5b09-4b07-ba96-cfe7180fcd3e',
  'Salinas 10': '3c1365cc-9c57-4aba-87c8-3a002e42e704',
  'Loterías Maruja': '36421243-c1ed-4f27-8554-8ee8c1460f94',
  'Hotel Puerta América': '527bbc28-11d2-48ea-a90e-a732ea967498',
  'TERRENO TORREMOLINOS': 'ecbdac21-c9bd-46bd-8627-1347f399ac1a',
  'Plaza Santa Ana': 'cf52a653-b224-43d8-8b99-f62523e4aefe',
  'Bárbara de Braganza': 'd2c7ed7c-5a0d-43cf-8ce0-e78f1d73fe07',
};

function getMimeType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function findPropertyId(fileName: string): string | null {
  const lower = fileName.toLowerCase();
  for (const [key, id] of Object.entries(PROPERTY_MAP)) {
    if (lower.includes(key.toLowerCase())) return id;
  }
  return null;
}

function findInvestorId(folderPath: string): string | null {
  for (const [folder, id] of Object.entries(INVESTOR_MAP)) {
    if (folderPath.includes(folder)) return id;
  }
  return null;
}

async function getUploadStrategy(filename: string, contentType: string, size: number) {
  const res = await fetch(`${BASE_URL}/api/storage/buckets/${BUCKET}/upload-strategy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename, contentType, size }),
  });
  if (!res.ok) throw new Error(`Upload strategy error: ${res.status} ${await res.text()}`);
  return res.json();
}

async function uploadFile(filePath: string, key: string): Promise<string | null> {
  try {
    const buffer = readFileSync(filePath);
    const size = buffer.length;
    const contentType = getMimeType(filePath);
    
    const strategy = await getUploadStrategy(basename(filePath), contentType, size);
    console.log(`  Strategy: ${strategy.method}`);
    
    if (strategy.method === 'direct') {
      const formData = new FormData();
      formData.append('file', new Blob([buffer], { type: contentType }), basename(filePath));
      
      const res = await fetch(`${BASE_URL}${strategy.uploadUrl}`, {
        method: 'PUT',
        body: formData,
      });
      
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      console.log(`  Uploaded directly to ${strategy.uploadUrl}`);
      return `${BASE_URL}/api/storage/buckets/${BUCKET}/objects/${key}`;
    } else {
      const formData = new FormData();
      for (const [field, value] of Object.entries(strategy.fields)) {
        formData.append(field, value as string);
      }
      formData.append('file', new Blob([buffer], { type: contentType }), basename(filePath));
      
      const res = await fetch(strategy.uploadUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error(`S3 upload failed: ${res.status}`);
      
      if (strategy.confirmRequired) {
        await fetch(`${BASE_URL}${strategy.confirmUrl}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ size, contentType }),
        });
      }
      
      console.log(`  Uploaded via S3 presigned URL`);
      return `${BASE_URL}/api/storage/buckets/${BUCKET}/objects/${key}`;
    }
  } catch (error: any) {
    console.error(`  Error: ${error.message}`);
    return null;
  }
}

async function updateProperty(propertyId: string, data: Record<string, any>) {
  const res = await fetch(`${BASE_URL}/api/database/records/properties?id=eq.${propertyId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) console.error(`  Failed to update property: ${res.status} ${await res.text()}`);
  else console.log(`  Property updated`);
}

async function insertDocument(data: Record<string, any>) {
  const res = await fetch(`${BASE_URL}/api/database/records/documents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify([data]),
  });
  if (!res.ok) console.error(`  Failed to insert document: ${res.status} ${await res.text()}`);
  else {
    const doc = await res.json();
    console.log(`  Document created: ${doc[0]?.id}`);
  }
}

async function main() {
  const basePath = '/Users/albertogala/Library/CloudStorage/Dropbox/Activos AleaSignature';
  
  console.log('=== Batch Upload to InsForge Storage ===\n');

  const mainFiles = [
    join(basePath, 'EDIFICIO OFICINAS VALENTIN BEATO (CF).pdf'),
    join(basePath, 'Plan Suelo Móstoles .pdf'),
    join(basePath, 'SUELO URBANO CALLE JAÉN 5 MOSTOLES.pdf'),
  ];

  for (const filePath of mainFiles) {
    const fileName = basename(filePath);
    console.log(`\nProcessing main file: ${fileName}`);
    const key = fileName.replace(/\s+/g, '_').replace(/[()]/g, '');
    const url = await uploadFile(filePath, key);
    
    if (url) {
      const propertyId = findPropertyId(fileName);
      const investorId = findInvestorId('');
      
      if (propertyId) {
        await updateProperty(propertyId, { dossier_url: url });
        if (investorId) {
          await updateProperty(propertyId, { investor_id: investorId });
        }
      }
    }
  }

  const investorFolders = [
    'ACTIVOS SILVIA',
    'ACTIVOS ALEX',
    'ACTIVOS CARLOS & DAVID',
    'ACTIVOS KUBIK',
    'ACTIVOS RAFA',
    'ACTIVOS MÓNICA',
  ];

  for (const folder of investorFolders) {
    const folderPath = join(basePath, 'Por inversor', folder);
    console.log(`\n=== Processing ${folder} ===`);
    
    try {
      const { readdirSync, statSync } = await import('fs');
      const files = readdirSync(folderPath);
      
      for (const fileName of files) {
        if (fileName.includes('compressed') || fileName.startsWith('.')) continue;
        
        const filePath = join(folderPath, fileName);
        const stat = statSync(filePath);
        if (stat.isDirectory()) continue;
        
        const key = `${folder}/${fileName}`.replace(/\s+/g, '_').replace(/[()]/g, '');
        console.log(`\nUploading: ${fileName}`);
        
        const url = await uploadFile(filePath, key);
        if (url) {
          const propertyId = findPropertyId(fileName);
          const investorId = findInvestorId(folder);
          
          const docType = fileName.toLowerCase().includes('plano') ? 'floor_plan' :
                         fileName.toLowerCase().includes('ibi') ? 'ibi' :
                         fileName.toLowerCase().includes('foto') || fileName.toLowerCase().includes('img') ? 'photo' :
                         fileName.toLowerCase().includes('ubicacion') ? 'location' :
                         'document';
          
          const docData: Record<string, any> = {
            title: fileName.replace(/\.[^/.]+$/, ''),
            file_path: url,
            document_type: docType,
          };
          
          if (propertyId) docData.property_id = propertyId;
          
          await insertDocument(docData);
          
          if (propertyId && investorId) {
            await updateProperty(propertyId, { investor_id: investorId });
          }
        }
      }
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
    }
  }

  console.log('\n=== Batch upload complete! ===');
}

main().catch(console.error);